<script lang="ts">
import { flip } from 'svelte/animate';
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
import { faviconFor } from '../../ui/favicon';
import Icon from '../../ui/Icon.svelte';
import Surface from '../../ui/Surface.svelte';
import LensPageItem from './LensPageItem.svelte';

type LensNode = Extract<PinNode, { kind: 'lens' }>;

// The generic (untyped) lens body (review-lens, D3): the magazine/queue section
// grid extracted VERBATIM from LensPage.svelte so a `general` lens renders
// byte-for-byte as before. The page shell (aurora, hearth, Space-hue scope, state
// mirror, located/missing, tab title) stays in LensPage; the kind branch chooses
// this view or ReviewQueue.
interface Props {
  /** The resolved lens node (always a lens; the shell gates on it). */
  node: LensNode;
  /** The owning Space — opening items needs this spaceId. */
  spaceId: SpaceId;
  /** Read-only SW state mirror, threaded from the shell. */
  appState: AppState;
  /** This tab's window. */
  windowId: number;
}

const { node, spaceId, appState, windowId }: Props = $props();

// Card layout animation (smart-folder-page): cards FLIP to their new positions —
// and fade in/out — as entries are added or removed (Clear read drains lingering
// items, a refresh brings new ones, Show more reveals more). Collapses to instant
// under `prefers-reduced-motion` so the layout still settles, just without motion.
const prefersReducedMotion =
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
const CARD_MOTION_MS = prefersReducedMotion ? 0 : 220;

/** Per-filter section identity — `${source}:${host}:${query}` (queue) /
 * `${source}:${host}` (rss). Same formula as background/smart-folders.ts. */
function sourceKey(cfg: ResolvedLensSource): string {
  const base = `${cfg.source}:${new URL(cfg.baseUrl).host}`;
  return cfg.query !== undefined ? `${base}:${cfg.query}` : base;
}

// Expand sources[] × queries[] into resolved per-filter sections (one for rss).
const sections = $derived.by<ResolvedLensSource[]>(() => {
  const out: ResolvedLensSource[] = [];
  for (const cfg of node.sources) {
    if (cfg.queries.length === 0) {
      out.push({
        source: cfg.source,
        baseUrl: cfg.baseUrl,
        name: cfg.name,
        lensKind: node.lensKind,
      });
    } else {
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
  }
  return out;
});

const folderRuntime = $derived(appState.lenses[node.id]);
const readSet = $derived(new Set(appState.lensReadState[node.id] ?? []));

// Lingering read (smart-folder-page): an item read WHILE this page is open does
// NOT vanish — it stays in place (dimmed, with its undo toggle) for the session.
// Items read BEFORE the page opened are "drained" (hidden at rest, behind "Show
// read"); the next reopen makes today's reads drained too. We detect the
// open→read transition by diffing the broadcast read set against the previous
// one: ids that newly appear are linger; ids that leave (un-read) stop lingering.
// `prevRead === null` on the first run captures the baseline (prior reads stay
// drained). Page-local + ephemeral — resets on reload, which is the drain point.
let lingeringRead = $state<Set<string>>(new Set());
let prevRead: Set<string> | null = null;
$effect(() => {
  const cur = readSet;
  if (prevRead === null) {
    prevRead = new Set(cur);
    return;
  }
  let changed = false;
  const next = new Set(lingeringRead);
  for (const id of cur) {
    if (!prevRead.has(id) && !next.has(id)) {
      next.add(id); // newly read while open → linger
      changed = true;
    }
  }
  for (const id of lingeringRead) {
    if (!cur.has(id)) {
      next.delete(id); // un-read → stop lingering
      changed = true;
    }
  }
  prevRead = new Set(cur);
  if (changed) lingeringRead = next;
});

/** A read item is "drained" (hidden at rest) when it was read before this page
 * session — i.e. read but not lingering. Lingering reads stay visible. */
function isDrained(key: string): boolean {
  return readSet.has(key) && !lingeringRead.has(key);
}

function sectionRuntime(cfg: ResolvedLensSource): LensSectionRuntime | undefined {
  return folderRuntime?.sections[sourceKey(cfg)];
}

function sectionItems(cfg: ResolvedLensSource): LensItem[] {
  return sectionRuntime(cfg)?.items ?? [];
}

// --- Reading controls (smart-folder-page), per feed section, PAGE-LOCAL --------
// Reveal-read and the display limit live in component state — not persisted, and
// not the sidebar's per-window slice (this is a separate surface). They reset on
// reload, like a peek. Reassigned (not mutated) so the runes pick up the change.
let revealedRead = $state<Record<string, boolean>>({});
let limits = $state<Record<string, number>>({});

// The page has far more room than the cramped sidebar, so it does NOT inherit the
// folder's `maxItems` budget — it shows a fuller first page. 24 is grid-friendly
// (divisible by 2/3/4/6), so the magazine rows fill out at common column counts;
// "Show more" pages by the same amount through the 200-item feed buffer.
const FEED_PAGE_DEFAULT = 24;

function sectionLimit(sk: string): number {
  return limits[sk] ?? FEED_PAGE_DEFAULT;
}
function isRevealed(sk: string): boolean {
  return revealedRead[sk] ?? false;
}

/** The items a feed section renders: at rest, unread + lingering (just-read this
 * session); drained reads are hidden until "Show read" reveals them. Capped to
 * the section's display limit ("Show more" raises it). Queue sections pass
 * through (the connector already capped them). */
function displayItems(cfg: ResolvedLensSource): LensItem[] {
  const all = sectionItems(cfg);
  if (cfg.source !== 'rss') return all;
  const sk = sourceKey(cfg);
  const pool = isRevealed(sk) ? all : all.filter((i) => !isDrained(`${sk}:${i.id}`));
  return pool.slice(0, sectionLimit(sk));
}

/** More items remain in the pool beyond the current limit (drives "Show more"). */
function hasMore(cfg: ResolvedLensSource): boolean {
  if (cfg.source !== 'rss') return false;
  const sk = sourceKey(cfg);
  const all = sectionItems(cfg);
  const poolLen = isRevealed(sk)
    ? all.length
    : all.filter((i) => !isDrained(`${sk}:${i.id}`)).length;
  return poolLen > sectionLimit(sk);
}

/** Drained (prior-session) reads still in the buffer — drives "Show N read". */
function drainedReadCount(cfg: ResolvedLensSource): number {
  const sk = sourceKey(cfg);
  return sectionItems(cfg).filter((i) => isDrained(`${sk}:${i.id}`)).length;
}

/** Lingering (read-this-session) items still shown — drives "Clear read". */
function lingeringReadCount(cfg: ResolvedLensSource): number {
  const sk = sourceKey(cfg);
  return sectionItems(cfg).filter((i) => lingeringRead.has(`${sk}:${i.id}`)).length;
}

function showMore(sk: string): void {
  limits = { ...limits, [sk]: sectionLimit(sk) + FEED_PAGE_DEFAULT };
}
function toggleReveal(sk: string): void {
  revealedRead = { ...revealedRead, [sk]: !isRevealed(sk) };
}

/** Drain this section's lingering reads now (they'd otherwise drain on reopen). */
function clearRead(sk: string): void {
  const next = new Set(lingeringRead);
  for (const id of lingeringRead) if (id.startsWith(`${sk}:`)) next.delete(id);
  lingeringRead = next;
}

/** Toggle a feed item's read state via the bus (mark read / mark unread). */
function toggleRead(cfg: ResolvedLensSource, item: LensItem): void {
  const itemId = `${sourceKey(cfg)}:${item.id}`;
  const kind = readSet.has(itemId) ? 'markLensItemUnread' : 'markLensItemRead';
  dispatch({ kind, payload: { folderId: node.id, itemId } });
}

/** Per-section attention count (unread for feeds, item count for queues). */
function sectionCount(cfg: ResolvedLensSource): number {
  const sk = sourceKey(cfg);
  const items = sectionItems(cfg);
  if (cfg.source === 'rss') return items.filter((i) => !readSet.has(`${sk}:${i.id}`)).length;
  return items.length;
}

// Folder attention sum (independent of any section state) — the header figure.
const attentionSum = $derived(sections.reduce((acc, cfg) => acc + sectionCount(cfg), 0));
const sectionWord = $derived(sections.length === 1 ? 'section' : 'sections');

// --- Section labelling (mirroring SmartSectionHeader.svelte) ------------------
const ICON_BY_SOURCE: Record<string, string> = {
  gitlab: 'folder-git-2',
  github: 'folder-git-2',
  jira: 'folder-kanban',
  rss: 'rss',
};

function filterLabel(source: string, query: LensQuery): string {
  if (query === 'authored') return 'authored';
  if (query === 'assigned') return 'assigned';
  return source === 'jira' ? 'Watching' : 'reviewing';
}

function hostOf(cfg: ResolvedLensSource): string {
  try {
    return new URL(cfg.baseUrl).host;
  } catch {
    return cfg.baseUrl;
  }
}

function sectionLabel(cfg: ResolvedLensSource): string {
  const identity = cfg.name?.trim() || hostOf(cfg);
  return cfg.query !== undefined ? `${identity} · ${filterLabel(cfg.source, cfg.query)}` : identity;
}

function sectionIcon(cfg: ResolvedLensSource): string {
  return ICON_BY_SOURCE[cfg.source] ?? 'folder';
}

function itemFavicon(cfg: ResolvedLensSource, item: LensItem): string {
  if (cfg.source === 'rss') {
    try {
      return faviconFor(new URL(item.url).origin);
    } catch {
      return faviconFor(cfg.baseUrl);
    }
  }
  return faviconFor(cfg.baseUrl);
}

function itemAria(cfg: ResolvedLensSource, item: LensItem, read: boolean): string {
  if (cfg.source === 'rss') return `${item.title} — ${read ? 'read' : 'unread'}`;
  return item.status ? `${item.title} — ${item.status.label}` : item.title;
}

const MINUTE = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

/** A compact relative publication label ("3h ago", "2d ago"), falling back to a
 * short absolute date past a week. Undefined when the item carries no date. */
function dateLabel(item: LensItem): string | undefined {
  if (item.publishedAt === undefined) return undefined;
  const diff = Date.now() - item.publishedAt;
  if (diff < HOUR) return `${Math.max(1, Math.round(diff / MINUTE))}m ago`;
  if (diff < DAY) return `${Math.round(diff / HOUR)}h ago`;
  if (diff < 7 * DAY) return `${Math.round(diff / DAY)}d ago`;
  return new Date(item.publishedAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

/** Feed entries carry richer content (excerpt + thumbnail); queue items don't. */
function richFor(cfg: ResolvedLensSource, item: LensItem) {
  if (cfg.source !== 'rss') return undefined;
  const excerpt = item.excerpt;
  const imageUrl = item.imageUrl;
  if (excerpt === undefined && imageUrl === undefined) return undefined;
  return {
    ...(excerpt !== undefined ? { excerpt } : {}),
    ...(imageUrl !== undefined ? { imageUrl } : {}),
  };
}

/** Bound-tab activation for THIS item in this window (drives the active card). */
function isActive(cfg: ResolvedLensSource, item: LensItem): boolean {
  const tabId =
    appState.lensItemBindings[node.id]?.[`${sourceKey(cfg)}:${item.id}`]?.[windowId]?.tabId;
  if (tabId === undefined) return false;
  const live = appState.liveTabsById[tabId];
  return live !== undefined && live.windowId === windowId && live.active;
}

function emptyNote(cfg: ResolvedLensSource): string | undefined {
  const sk = sourceKey(cfg);
  const secItems = sectionItems(cfg);
  const secState = sectionRuntime(cfg)?.state ?? 'pending';
  if (secState === 'error') return undefined;
  if (cfg.source === 'rss') {
    if (secItems.length === 0) return 'No entries yet.';
    const unread = secItems.filter((i) => !readSet.has(`${sk}:${i.id}`)).length;
    return unread === 0 ? "You're all caught up." : undefined;
  }
  return secItems.length === 0 ? 'Nothing here right now.' : undefined;
}

// --- Activation (read-only: every action goes through the bus) ----------------
function openItem(cfg: ResolvedLensSource, item: LensItem): void {
  dispatch({
    kind: 'openLensItem',
    payload: {
      spaceId,
      folderId: node.id,
      itemId: `${sourceKey(cfg)}:${item.id}`,
      windowId,
      // Mark this as a page-originated open so closing the tab returns to the
      // page rather than auto-advancing to the next feed item.
      fromPage: true,
    },
  });
}

function signIn(cfg: ResolvedLensSource): void {
  dispatch({ kind: 'openUrl', payload: { url: cfg.baseUrl, windowId } });
}

/** Open (or reuse) the options page at the Connectors anchor. Replicates the
 * sidebar's `openOptionsAt('#connectors')` (github-connector design D6) — the
 * helper lives in the sidebar layer, unimportable here, and `openUrl` would drop
 * the chrome-extension:// URL via its scheme hardening, so the page opens it
 * directly through chrome.tabs (it is itself an extension page). */
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
    log.debug('folderpage openConnectorsSettings: reuse query failed; creating fresh', { err });
  }
  await chrome.tabs.create({ url });
}
</script>

<header class="page-head" data-testid="lenspage-head">
  <span class="head-glyph" aria-hidden="true">
    <Icon name={node.icon} size={28} color="var(--space-c)" />
  </span>
  <h1 class="page-name" data-testid="lenspage-name">{node.name}</h1>
  <p class="page-meta" data-testid="lenspage-meta">
    {sections.length}
    {sectionWord}{#if attentionSum > 0} · {attentionSum} waiting{/if}
  </p>
</header>

<div class="sections" data-testid="lenspage-sections">
  {#each sections as cfg, sectionIndex (sourceKey(cfg))}
    {@const sec = sectionRuntime(cfg)}
    {@const secState = sec?.state ?? 'pending'}
    {@const isFeed = cfg.source === 'rss'}
    {@const items = displayItems(cfg)}
    {@const count = sectionCount(cfg)}
    {@const note = emptyNote(cfg)}
    <!-- Staggered entrance: each panel rises in turn (CSS reads --i). -->
    <section
      class="section-panel"
      class:feed={isFeed}
      style:--i={sectionIndex}
      data-testid="lenspage-section"
      data-source-key={sourceKey(cfg)}
    >
      <Surface variant="glass" radius="lg" glow testid="lenspage-section-surface">
        <div class="panel-inner">
          <div class="section-head">
            <span class="section-glyph" aria-hidden="true">
              <Icon name={sectionIcon(cfg)} size={16} color="var(--text-dim)" />
            </span>
            <h2 class="section-label">{sectionLabel(cfg)}</h2>
            {#if count > 0}
              <span class="section-count" data-testid="lenspage-section-count">{count}</span>
            {/if}
          </div>

          {#if secState === 'pending' && items.length === 0}
            <div class="ghost" data-testid="lenspage-ghost" aria-hidden="true"></div>
            <div class="ghost" data-testid="lenspage-ghost" aria-hidden="true"></div>
            <div class="ghost" data-testid="lenspage-ghost" aria-hidden="true"></div>
          {:else if secState === 'signed-out'}
            {#if cfg.source === 'github'}
              <button
                type="button"
                class="signin-row"
                data-testid="lenspage-signin"
                onclick={() => void openConnectorsSettings()}
              >
                Add a token in Settings → Connectors
              </button>
            {:else}
              <button
                type="button"
                class="signin-row"
                data-testid="lenspage-signin"
                onclick={() => signIn(cfg)}
              >
                Sign in to {hostOf(cfg)}
              </button>
            {/if}
          {:else if secState === 'needs-access'}
            <div class="needs-access" data-testid="lenspage-needs-access">
              <Icon name="key-round" size={16} />
              <span class="needs-access-copy">Lunma needs access to {hostOf(cfg)}</span>
              <Button
                variant="primary"
                onclick={() => void requestHostPermissions(requiredOriginsForConfig(cfg))}
              >
                Grant access
              </Button>
            </div>
          {:else}
            {#if items.length > 0}
              <div class="card-grid" class:feed={isFeed}>
                {#each items as item (item.id)}
                  {@const read = isFeed && readSet.has(`${sourceKey(cfg)}:${item.id}`)}
                  <!-- The cell is the keyed/animated box: FLIP repositions the
                       SURVIVING cards when the list changes. We deliberately
                       do NOT add an out-`transition` here: a leave transition
                       keeps a destroyed card's DOM (and its `Favicon`, which
                       holds `$derived`) alive through the outro, and reading
                       that derived post-teardown trips Svelte's `derived_inert`
                       warning. Removing a card immediately (flip-only) avoids
                       that window while still animating the reflow. -->
                  <div class="card-cell" animate:flip={{ duration: CARD_MOTION_MS }}>
                    <LensPageItem
                      title={item.title}
                      faviconSrc={itemFavicon(cfg, item)}
                      status={item.status}
                      feed={isFeed}
                      {read}
                      active={isActive(cfg, item)}
                      ariaLabel={itemAria(cfg, item, read)}
                      rich={richFor(cfg, item)}
                      dateLabel={isFeed ? dateLabel(item) : undefined}
                      onactivate={() => openItem(cfg, item)}
                      onToggleRead={isFeed ? () => toggleRead(cfg, item) : undefined}
                    />
                  </div>
                {/each}
              </div>
            {/if}
            {#if note}
              <p class="note-row" data-testid="lenspage-empty-note">{note}</p>
            {/if}
            {#if secState === 'error'}
              <p class="note-row" data-testid="lenspage-error-note">
                Couldn't reach {hostOf(cfg)}
              </p>
            {/if}
            <!-- Reading controls (feed sections): show more · clear read ·
                 reveal/hide read. Just-read items linger (dimmed) until you
                 clear them or reopen the page. -->
            {#if isFeed && (hasMore(cfg) || lingeringReadCount(cfg) > 0 || drainedReadCount(cfg) > 0)}
              {@const sk = sourceKey(cfg)}
              <div class="reading-controls" data-testid="lenspage-reading-controls">
                {#if hasMore(cfg)}
                  <Button variant="ghost" size="sm" onclick={() => showMore(sk)}>
                    <span>Show more</span>
                  </Button>
                {/if}
                <span class="controls-spacer"></span>
                {#if lingeringReadCount(cfg) > 0}
                  <Button
                    variant="ghost"
                    size="sm"
                    onclick={() => clearRead(sk)}
                    title="Clear the items you've read this session"
                  >
                    Clear read
                  </Button>
                {/if}
                {#if drainedReadCount(cfg) > 0}
                  <Button
                    variant="ghost"
                    size="sm"
                    onclick={() => toggleReveal(sk)}
                    title={isRevealed(sk) ? 'Hide read items' : 'Show read items'}
                  >
                    {isRevealed(sk) ? 'Hide read' : `Show ${drainedReadCount(cfg)} read`}
                  </Button>
                {/if}
              </div>
            {/if}
          {/if}
        </div>
      </Surface>
    </section>
  {/each}
</div>
