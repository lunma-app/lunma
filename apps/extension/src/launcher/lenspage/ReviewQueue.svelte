<script lang="ts">
import { dispatch } from '../../shared/bus';
import { requiredOriginsForConfig } from '../../shared/connector-origins';
import { log } from '../../shared/logger';
import { requestHostPermissions } from '../../shared/permissions';
import type {
  AppState,
  LensItem,
  LensQuery,
  LensSectionRuntime,
  PinNode,
  ResolvedLensSource,
  SpaceId,
} from '../../shared/types';
import Button from '../../ui/Button.svelte';
import Icon from '../../ui/Icon.svelte';
import Surface from '../../ui/Surface.svelte';
import ChangeRow from './ChangeRow.svelte';
import LensFilterBar from './LensFilterBar.svelte';

type LensNode = Extract<PinNode, { kind: 'lens' }>;

// ReviewQueue (review-lens, D3): the typed Review lens's page archetype — a
// triage console, not a browse grid. Sections group into relationship lanes by
// query; each Change renders as a ChangeRow. Read-only: every action goes through
// the bus. Reuses the calm pending/signed-out/needs-access/error affordances.
interface Props {
  node: LensNode;
  spaceId: SpaceId;
  appState: AppState;
  windowId: number;
}

const { node, spaceId, appState, windowId }: Props = $props();

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

/** Per-section identity — `${source}:${host}:${query}`. */
function sourceKey(cfg: ResolvedLensSource): string {
  const base = `${cfg.source}:${hostOf(cfg.baseUrl)}`;
  return cfg.query !== undefined ? `${base}:${cfg.query}` : base;
}

/** Source-facet identity — `${provider}:${host}` (query-independent), so two
 * hosts with the same owner/repo never merge (D7). */
function facetKey(cfg: { source: string; baseUrl: string }): string {
  return `${cfg.source}:${hostOf(cfg.baseUrl)}`;
}

// Resolve sources[] × queries[] into per-filter sections (review lenses are
// github/gitlab only, so every section carries a query).
const sections = $derived.by<ResolvedLensSource[]>(() => {
  const out: ResolvedLensSource[] = [];
  for (const cfg of node.sources) {
    for (const query of cfg.queries) {
      out.push({
        source: cfg.source,
        baseUrl: cfg.baseUrl,
        query,
        name: cfg.name,
        lensKind: node.lensKind,
      });
    }
  }
  return out;
});

const folderRuntime = $derived(appState.lenses[node.id]);
function sectionRuntime(cfg: ResolvedLensSource): LensSectionRuntime | undefined {
  return folderRuntime?.sections[sourceKey(cfg)];
}

// --- Relationship lanes (D3) --------------------------------------------------
// `review-requested` → "Requested your review"; `authored` → "Authored by you";
// any other query → its own labelled lane. Lanes render in that priority order.
const LANE_ORDER: LensQuery[] = ['review-requested', 'authored'];
function laneLabel(query: LensQuery): string {
  if (query === 'review-requested') return 'Requested your review';
  if (query === 'authored') return 'Authored by you';
  return 'Assigned to you';
}

interface Lane {
  query: LensQuery;
  label: string;
  sections: ResolvedLensSource[];
}

const lanes = $derived.by<Lane[]>(() => {
  const byQuery = new Map<LensQuery, ResolvedLensSource[]>();
  for (const cfg of sections) {
    if (cfg.query === undefined) continue;
    const arr = byQuery.get(cfg.query) ?? [];
    arr.push(cfg);
    byQuery.set(cfg.query, arr);
  }
  const others = [...byQuery.keys()].filter((q) => !LANE_ORDER.includes(q));
  const order = [...LANE_ORDER, ...others];
  return order
    .filter((q) => byQuery.has(q))
    .map((q) => ({ query: q, label: laneLabel(q), sections: byQuery.get(q) ?? [] }));
});

// --- Source + repo filter (D7), page-local ephemeral state --------------------
let activeSource = $state<string | null>(null);
let activeRepo = $state<string | null>(null);

const multiSource = $derived(node.sources.length > 1);

function selectSource(key: string | null): void {
  activeSource = key;
  // Repo facets are scoped to the active source — reset on source change.
  activeRepo = null;
}
function selectRepo(repo: string | null): void {
  activeRepo = repo;
}

const sourceFacets = $derived.by(() => {
  const map = new Map<string, { key: string; label: string; count: number }>();
  for (const cfg of sections) {
    const key = facetKey(cfg);
    const rt = sectionRuntime(cfg);
    const n = rt?.state === 'ok' ? rt.items.length : 0;
    const existing = map.get(key);
    if (existing) existing.count += n;
    else map.set(key, { key, label: hostOf(cfg.baseUrl), count: n });
  }
  return [...map.values()];
});
const totalCount = $derived(sourceFacets.reduce((acc, f) => acc + f.count, 0));

const repoFacets = $derived.by(() => {
  if (activeSource === null) return [];
  const map = new Map<string, number>();
  for (const cfg of sections) {
    if (facetKey(cfg) !== activeSource) continue;
    const rt = sectionRuntime(cfg);
    if (rt?.state !== 'ok') continue;
    for (const item of rt.items) {
      const repo = item.change?.repo;
      if (repo !== undefined) map.set(repo, (map.get(repo) ?? 0) + 1);
    }
  }
  return [...map].map(([repo, count]) => ({ repo, count }));
});

function matchesFilter(cfg: ResolvedLensSource, item: LensItem): boolean {
  if (activeSource !== null && facetKey(cfg) !== activeSource) return false;
  if (activeRepo !== null && item.change?.repo !== activeRepo) return false;
  return true;
}

interface Row {
  cfg: ResolvedLensSource;
  item: LensItem;
}

/** The lane's visible change rows after the source/repo filter. */
function laneRows(lane: Lane): Row[] {
  const rows: Row[] = [];
  for (const cfg of lane.sections) {
    const rt = sectionRuntime(cfg);
    if (rt?.state !== 'ok') continue;
    for (const item of rt.items) {
      if (matchesFilter(cfg, item)) rows.push({ cfg, item });
    }
  }
  return rows;
}

/** The lane's sections, narrowed to the active source — drives the calm
 * pending/signed-out/needs-access/error affordances. */
function laneSections(lane: Lane): ResolvedLensSource[] {
  return lane.sections.filter((cfg) => activeSource === null || facetKey(cfg) === activeSource);
}

// --- Triage summary (the thesis line), computed over ALL ok items -------------
function laneOkCount(query: LensQuery): number {
  return sections
    .filter((cfg) => cfg.query === query)
    .reduce(
      (acc, cfg) =>
        acc + (sectionRuntime(cfg)?.state === 'ok' ? (sectionRuntime(cfg)?.items.length ?? 0) : 0),
      0,
    );
}

const HOUR = 3_600_000;
const DAY = 86_400_000;

const oldestLabel = $derived.by<string | null>(() => {
  let oldest = 0;
  for (const cfg of sections) {
    const rt = sectionRuntime(cfg);
    if (rt?.state !== 'ok') continue;
    for (const item of rt.items) {
      const updatedAt = item.change?.updatedAt;
      if (updatedAt === undefined) continue;
      oldest = Math.max(oldest, Date.now() - updatedAt);
    }
  }
  if (oldest === 0) return null;
  return oldest < HOUR
    ? `${Math.max(1, Math.round(oldest / 60_000))}m`
    : oldest < DAY
      ? `${Math.round(oldest / HOUR)}h`
      : `${Math.round(oldest / DAY)}d`;
});

const summaryParts = $derived.by<string[]>(() => {
  const parts: string[] = [];
  const queries = new Set(sections.map((cfg) => cfg.query));
  if (queries.has('review-requested'))
    parts.push(`${laneOkCount('review-requested')} await your review`);
  if (queries.has('authored')) parts.push(`${laneOkCount('authored')} you authored`);
  if (oldestLabel !== null) parts.push(`oldest ${oldestLabel}`);
  return parts;
});

// --- Activation (read-only: every action goes through the bus) ----------------
function isActive(cfg: ResolvedLensSource, item: LensItem): boolean {
  const tabId =
    appState.lensItemBindings[node.id]?.[`${sourceKey(cfg)}:${item.id}`]?.[windowId]?.tabId;
  if (tabId === undefined) return false;
  const live = appState.liveTabsById[tabId];
  return live !== undefined && live.windowId === windowId && live.active;
}

function openItem(cfg: ResolvedLensSource, item: LensItem): void {
  dispatch({
    kind: 'openLensItem',
    payload: {
      spaceId,
      folderId: node.id,
      itemId: `${sourceKey(cfg)}:${item.id}`,
      windowId,
      fromPage: true,
    },
  });
}

function signIn(cfg: ResolvedLensSource): void {
  dispatch({ kind: 'openUrl', payload: { url: cfg.baseUrl, windowId } });
}

/** Open (or reuse) the options page at the Connectors anchor (mirrors the
 * generic page's helper — the chrome-extension:// URL can't ride `openUrl`). */
async function openConnectorsSettings(): Promise<void> {
  const base = chrome.runtime.getURL('src/options/index.html');
  const url = `${base}#connectors`;
  try {
    const tabs = await chrome.tabs.query({});
    const existing = tabs.find((t) => t.id !== undefined && t.url?.startsWith(base));
    if (existing?.id !== undefined) {
      await chrome.tabs.update(existing.id, { active: true, url });
      if (existing.windowId !== undefined) {
        await chrome.windows.update(existing.windowId, { focused: true });
      }
      return;
    }
  } catch (err) {
    log.debug('ReviewQueue openConnectorsSettings: reuse query failed; creating fresh', { err });
  }
  await chrome.tabs.create({ url });
}
</script>

<header class="page-head" data-testid="lenspage-head">
  <span class="head-glyph" aria-hidden="true">
    <Icon name={node.icon} size={28} color="var(--space-c)" />
  </span>
  <h1 class="page-name" data-testid="lenspage-name">{node.name}</h1>
  <p class="page-meta" data-testid="reviewqueue-summary">
    {#if summaryParts.length > 0}{summaryParts.join(' · ')}{:else}No changes right now{/if}
  </p>
</header>

{#if multiSource}
  <LensFilterBar
    sources={sourceFacets}
    repos={repoFacets}
    {totalCount}
    {activeSource}
    {activeRepo}
    onSelectSource={selectSource}
    onSelectRepo={selectRepo}
  />
{/if}

<div class="lanes" data-testid="reviewqueue-lanes">
  {#each lanes as lane, laneIndex (lane.query)}
    {@const rows = laneRows(lane)}
    {@const secs = laneSections(lane)}
    <section class="lane" style:--i={laneIndex} data-testid="reviewqueue-lane" data-query={lane.query}>
      <div class="lane-head">
        <h2 class="lane-label">{lane.label}</h2>
        <span class="lane-rule"></span>
        <span class="lane-count" data-testid="reviewqueue-lane-count">{rows.length}</span>
      </div>
      <Surface variant="glass" radius="lg" glow testid="reviewqueue-lane-surface">
        <div class="lane-panel">
          {#if rows.length > 0}
            <div class="rows">
              {#each rows as row (sourceKey(row.cfg) + ':' + row.item.id)}
                <ChangeRow
                  item={row.item}
                  baseUrl={row.cfg.baseUrl}
                  active={isActive(row.cfg, row.item)}
                  onactivate={() => openItem(row.cfg, row.item)}
                />
              {/each}
            </div>
          {/if}

          <!-- Calm per-section states (reused from the generic page): ghosts while
               first-fetching, sign-in / grant / error affordances — never a red
               error card. -->
          {#each secs as cfg (sourceKey(cfg))}
            {@const rt = sectionRuntime(cfg)}
            {@const secState = rt?.state ?? 'pending'}
            {#if secState === 'pending' && (rt?.items.length ?? 0) === 0}
              <div class="ghost" data-testid="reviewqueue-ghost" aria-hidden="true"></div>
            {:else if secState === 'signed-out'}
              {#if cfg.source === 'github'}
                <button
                  type="button"
                  class="signin-row"
                  data-testid="reviewqueue-signin"
                  onclick={() => void openConnectorsSettings()}
                >
                  Add a token in Settings → Connectors
                </button>
              {:else}
                <button
                  type="button"
                  class="signin-row"
                  data-testid="reviewqueue-signin"
                  onclick={() => signIn(cfg)}
                >
                  Sign in to {hostOf(cfg.baseUrl)}
                </button>
              {/if}
            {:else if secState === 'needs-access'}
              <div class="needs-access" data-testid="reviewqueue-needs-access">
                <Icon name="key-round" size={16} />
                <span class="needs-access-copy">Lunma needs access to {hostOf(cfg.baseUrl)}</span>
                <Button
                  variant="primary"
                  onclick={() => void requestHostPermissions(requiredOriginsForConfig(cfg))}
                >
                  Grant access
                </Button>
              </div>
            {:else if secState === 'error'}
              <p class="note-row" data-testid="reviewqueue-error-note">
                Couldn't reach {hostOf(cfg.baseUrl)}
              </p>
            {/if}
          {/each}

          {#if rows.length === 0 && secs.every((cfg) => sectionRuntime(cfg)?.state === 'ok')}
            <p class="note-row" data-testid="reviewqueue-empty-note">Nothing here right now.</p>
          {/if}
        </div>
      </Surface>
    </section>
  {/each}
</div>

<style>
  .lanes {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }

  .lane {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    /* Reuse the generic page's staggered rise (D-visual). */
    animation: fp-panel-rise var(--motion-base) var(--ease-emphasised) backwards;
    animation-delay: calc(var(--i, 0) * 55ms + 80ms);
  }

  .lane-head {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: 0 var(--space-1);
  }
  .lane-label {
    flex-shrink: 0;
    margin: 0;
    font: var(--weight-semibold) var(--text-2xs) / 1 var(--font-sans);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-dim);
  }
  .lane-rule {
    flex: 1;
    height: 1px;
    background: linear-gradient(
      90deg,
      color-mix(in oklch, var(--text-faint) 30%, transparent),
      transparent
    );
  }
  .lane-count {
    flex-shrink: 0;
    min-width: 20px;
    text-align: center;
    padding: 2px var(--space-2);
    border-radius: var(--r-pill);
    background: var(--surface-2);
    color: var(--text-dim);
    font: var(--weight-semibold) var(--text-2xs) / 1.4 var(--font-sans);
  }

  .lane-panel {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding: var(--space-2);
  }
  .rows {
    display: flex;
    flex-direction: column;
  }

  /* Calm states — match the generic page's quiet treatment. */
  .ghost {
    height: 44px;
    border-radius: var(--r-md);
    background: linear-gradient(90deg, var(--surface-2), var(--surface-3), var(--surface-2));
    opacity: 0.5;
  }
  .signin-row {
    appearance: none;
    border: 0;
    width: 100%;
    text-align: left;
    padding: var(--space-3);
    border-radius: var(--r-md);
    background: transparent;
    color: var(--space-c);
    font: var(--weight-medium) var(--text-sm) / 1.3 var(--font-sans);
    cursor: pointer;
    transition: background var(--motion-fast) var(--ease-standard);
  }
  .signin-row:hover {
    background: var(--surface-2);
  }
  .signin-row:focus-visible {
    outline: var(--focus-width) solid var(--focus-color);
    outline-offset: var(--focus-offset);
  }
  .needs-access {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3);
    color: var(--text-muted);
    font: var(--weight-regular) var(--text-sm) / 1.3 var(--font-sans);
  }
  .needs-access-copy {
    flex: 1;
    min-width: 0;
  }
  .note-row {
    margin: 0;
    padding: var(--space-3);
    color: var(--text-dim);
    font: var(--weight-regular) var(--text-sm) / 1.3 var(--font-sans);
  }

  @media (prefers-reduced-motion: reduce) {
    .lane {
      animation: none;
    }
  }
</style>
