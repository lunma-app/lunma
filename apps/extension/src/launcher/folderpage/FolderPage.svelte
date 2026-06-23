<script lang="ts">
import { onMount } from 'svelte';
import { dispatch } from '../../shared/bus';
import { requiredOriginsForConfig } from '../../shared/connector-origins';
import { log } from '../../shared/logger';
import { onStateBroadcast } from '../../shared/messages';
import { requestHostPermissions } from '../../shared/permissions';
import type { Tint } from '../../shared/settings';
import {
  colourToOklch,
  colourToOn,
  DEFAULT_HUE,
  DEFAULT_L,
  DEFAULT_ON,
  SPACE_CHROMA,
} from '../../shared/space-hue';
import type {
  AppState,
  PinNode,
  ResolvedSourceConfig,
  SmartFolderItem,
  SmartQuery,
  SmartSectionRuntime,
  Space,
  SpaceId,
} from '../../shared/types';
import '@lunma/tokens/tokens.css';
import '@lunma/tokens/fonts.css';
import '@lunma/tokens/recipes.css';
import './folderpage.css';
import Aurora from '../../ui/Aurora.svelte';
import Button from '../../ui/Button.svelte';
import { faviconFor } from '../../ui/favicon';
import Icon from '../../ui/Icon.svelte';
import Surface from '../../ui/Surface.svelte';
import FolderPageItem from './FolderPageItem.svelte';

type SmartNode = Extract<PinNode, { kind: 'smart' }>;

interface Props {
  /** This tab's window, resolved by `main.ts` via `chrome.windows.getCurrent`. */
  windowId: number;
  /** The target folder, from `?folderId=…`. Null when the param is missing. */
  folderId?: string | null;
  /** SW snapshot seed; null on a cold start until the first broadcast lands. */
  initialState?: AppState | null;
  /** Colour-intensity level, mirrored onto `data-tint` + the `<Aurora>` backdrop. */
  tint?: Tint;
}

const { windowId, folderId = null, initialState = null, tint = 'vivid' }: Props = $props();

// Read-only mirror of SW state — the sidebar/new-tab consumer pattern. NOT named
// `state` (collides with the `$state` rune). `appState` prefers the live broadcast.
let liveState = $state<AppState | null>(null);
const appState = $derived<AppState | null>(liveState ?? initialState);

onMount(() => {
  // Read-only live mirror. A host-permission grant from the needs-access
  // affordance flips a section in the SW, which re-polls and re-broadcasts on its
  // own — this subscription picks that up, so the page needs no permissions hook.
  const unsubscribe = onStateBroadcast((msg) => {
    liveState = msg.state;
  });
  return unsubscribe;
});

// Locate the folder + its owning Space (the page only has folderId from the URL).
// The page tints to the FOLDER'S Space — its identity — not the window's active
// Space; opening items needs that same owning spaceId.
const located = $derived.by<{ spaceId: SpaceId; node: SmartNode } | null>(() => {
  if (!appState || folderId === null) return null;
  for (const [spaceId, nodes] of Object.entries(appState.pinnedBySpace)) {
    const node = nodes.find((n): n is SmartNode => n.kind === 'smart' && n.id === folderId);
    if (node) return { spaceId, node };
  }
  return null;
});

const node = $derived(located?.node ?? null);
const spaceId = $derived(located?.spaceId ?? null);
const space = $derived<Space | null>(
  spaceId === null ? null : (appState?.spaces.find((s) => s.id === spaceId) ?? null),
);

// Space colour → the scoped OKLCH hue vars the aurora/hearth/glass read.
const activeOklch = $derived(space ? colourToOklch(space.color) : null);
const spaceHue = $derived(activeOklch?.h ?? DEFAULT_HUE);
const spaceChroma = $derived(activeOklch?.c ?? SPACE_CHROMA);
const spaceL = $derived(activeOklch?.l ?? DEFAULT_L);
const spaceOn = $derived(space ? colourToOn(space.color) : DEFAULT_ON);

// --- Section derivations (mirroring SmartFolder.svelte; the sidebar lives in a
// layer this page cannot import, so the pure logic is replicated locally) -----

/** Per-filter section identity — `${source}:${host}:${query}` (queue) /
 * `${source}:${host}` (rss). Same formula as background/smart-folders.ts. */
function sourceKey(cfg: ResolvedSourceConfig): string {
  const base = `${cfg.source}:${new URL(cfg.baseUrl).host}`;
  return cfg.query !== undefined ? `${base}:${cfg.query}` : base;
}

// Expand sources[] × queries[] into resolved per-filter sections (one for rss).
const sections = $derived.by<ResolvedSourceConfig[]>(() => {
  if (!node) return [];
  const out: ResolvedSourceConfig[] = [];
  for (const cfg of node.sources) {
    if (cfg.queries.length === 0) {
      out.push({ source: cfg.source, baseUrl: cfg.baseUrl, name: cfg.name });
    } else {
      for (const query of cfg.queries) {
        out.push({ source: cfg.source, baseUrl: cfg.baseUrl, query, name: cfg.name });
      }
    }
  }
  return out;
});

const folderRuntime = $derived(node ? appState?.smartFolders[node.id] : undefined);
const readSet = $derived(new Set(node ? (appState?.smartReadState[node.id] ?? []) : []));

function sectionRuntime(cfg: ResolvedSourceConfig): SmartSectionRuntime | undefined {
  return folderRuntime?.sections[sourceKey(cfg)];
}

function sectionItems(cfg: ResolvedSourceConfig): SmartFolderItem[] {
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

/** The items a feed section renders: unread only at rest (drained), or all when
 * read is revealed — capped to the section's display limit ("Show more" raises
 * it). Queue sections pass through (the connector already capped them). */
function displayItems(cfg: ResolvedSourceConfig): SmartFolderItem[] {
  const all = sectionItems(cfg);
  if (cfg.source !== 'rss') return all;
  const sk = sourceKey(cfg);
  const pool = isRevealed(sk) ? all : all.filter((i) => !readSet.has(`${sk}:${i.id}`));
  return pool.slice(0, sectionLimit(sk));
}

/** More items remain in the pool beyond the current limit (drives "Show more"). */
function hasMore(cfg: ResolvedSourceConfig): boolean {
  if (cfg.source !== 'rss') return false;
  const sk = sourceKey(cfg);
  const all = sectionItems(cfg);
  const poolLen = isRevealed(sk)
    ? all.length
    : all.filter((i) => !readSet.has(`${sk}:${i.id}`)).length;
  return poolLen > sectionLimit(sk);
}

/** Read items held in a section's buffer (drives "Show N read"). */
function readCount(cfg: ResolvedSourceConfig): number {
  const sk = sourceKey(cfg);
  return sectionItems(cfg).filter((i) => readSet.has(`${sk}:${i.id}`)).length;
}

function showMore(sk: string): void {
  limits = { ...limits, [sk]: sectionLimit(sk) + FEED_PAGE_DEFAULT };
}
function toggleReveal(sk: string): void {
  revealedRead = { ...revealedRead, [sk]: !isRevealed(sk) };
}

/** Toggle a feed item's read state via the bus (mark read / mark unread). */
function toggleRead(cfg: ResolvedSourceConfig, item: SmartFolderItem): void {
  if (!node) return;
  const itemId = `${sourceKey(cfg)}:${item.id}`;
  const kind = readSet.has(itemId) ? 'markSmartItemUnread' : 'markSmartItemRead';
  dispatch({ kind, payload: { folderId: node.id, itemId } });
}

/** Per-section attention count (unread for feeds, item count for queues). */
function sectionCount(cfg: ResolvedSourceConfig): number {
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

function filterLabel(source: string, query: SmartQuery): string {
  if (query === 'authored') return 'authored';
  if (query === 'assigned') return 'assigned';
  return source === 'jira' ? 'Watching' : 'reviewing';
}

function hostOf(cfg: ResolvedSourceConfig): string {
  try {
    return new URL(cfg.baseUrl).host;
  } catch {
    return cfg.baseUrl;
  }
}

function sectionLabel(cfg: ResolvedSourceConfig): string {
  const identity = cfg.name?.trim() || hostOf(cfg);
  return cfg.query !== undefined ? `${identity} · ${filterLabel(cfg.source, cfg.query)}` : identity;
}

function sectionIcon(cfg: ResolvedSourceConfig): string {
  return ICON_BY_SOURCE[cfg.source] ?? 'folder';
}

function itemFavicon(cfg: ResolvedSourceConfig, item: SmartFolderItem): string {
  if (cfg.source === 'rss') {
    try {
      return faviconFor(new URL(item.url).origin);
    } catch {
      return faviconFor(cfg.baseUrl);
    }
  }
  return faviconFor(cfg.baseUrl);
}

function itemAria(cfg: ResolvedSourceConfig, item: SmartFolderItem, read: boolean): string {
  if (cfg.source === 'rss') return `${item.title} — ${read ? 'read' : 'unread'}`;
  return item.status ? `${item.title} — ${item.status.label}` : item.title;
}

const MINUTE = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

/** A compact relative publication label ("3h ago", "2d ago"), falling back to a
 * short absolute date past a week. Undefined when the item carries no date. */
function dateLabel(item: SmartFolderItem): string | undefined {
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
function richFor(cfg: ResolvedSourceConfig, item: SmartFolderItem) {
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
function isActive(cfg: ResolvedSourceConfig, item: SmartFolderItem): boolean {
  if (!node || !appState) return false;
  const tabId =
    appState.smartItemBindings[node.id]?.[`${sourceKey(cfg)}:${item.id}`]?.[windowId]?.tabId;
  if (tabId === undefined) return false;
  const live = appState.liveTabsById[tabId];
  return live !== undefined && live.windowId === windowId && live.active;
}

function emptyNote(cfg: ResolvedSourceConfig): string | undefined {
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
function openItem(cfg: ResolvedSourceConfig, item: SmartFolderItem): void {
  if (spaceId === null || !node) return;
  dispatch({
    kind: 'openSmartItem',
    payload: { spaceId, folderId: node.id, itemId: `${sourceKey(cfg)}:${item.id}`, windowId },
  });
}

function signIn(cfg: ResolvedSourceConfig): void {
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

// The browser tab title (smart-folder-page): the folder's name when resolved,
// so the Chrome tab strip reads "Feeds" instead of the static fallback.
const pageTitle = $derived(node ? `${node.name} · Lunma` : 'Smart folder · Lunma');
</script>

<svelte:head>
  <title>{pageTitle}</title>
</svelte:head>

<main
  class="folderpage lunma-space-scope"
  data-testid="folderpage-root"
  data-tint={tint}
  style:--space-h={String(spaceHue)}
  style:--space-chroma={String(spaceChroma)}
  style:--space-l={String(spaceL)}
  style:--space-on={spaceOn}
>
  <Aurora intensity={tint} />
  <div class="hearth" aria-hidden="true"></div>

  <div class="stage">
    {#if !node}
      <!-- Calm neutral state: no folderId, or the folder isn't in state (yet, or
           deleted). Never an error card. -->
      <section class="missing" data-testid="folderpage-missing">
        <Icon name="layers" size={40} color="var(--text-dim)" />
        <h1 class="missing-title">No smart folder to show</h1>
        <p class="missing-copy">
          This page didn't get a folder to open, or that folder is no longer around.
        </p>
      </section>
    {:else}
      <header class="page-head" data-testid="folderpage-head">
        <span class="head-glyph" aria-hidden="true">
          <Icon name={node.icon} size={28} color="var(--space-c)" />
        </span>
        <h1 class="page-name" data-testid="folderpage-name">{node.name}</h1>
        <p class="page-meta" data-testid="folderpage-meta">
          {sections.length}
          {sectionWord}{#if attentionSum > 0} · {attentionSum} waiting{/if}
        </p>
      </header>

      <div class="sections" data-testid="folderpage-sections">
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
            data-testid="folderpage-section"
            data-source-key={sourceKey(cfg)}
          >
            <Surface variant="glass" radius="lg" glow testid="folderpage-section-surface">
              <div class="panel-inner">
                <div class="section-head">
                  <span class="section-glyph" aria-hidden="true">
                    <Icon name={sectionIcon(cfg)} size={16} color="var(--text-dim)" />
                  </span>
                  <h2 class="section-label">{sectionLabel(cfg)}</h2>
                  {#if count > 0}
                    <span class="section-count" data-testid="folderpage-section-count">{count}</span>
                  {/if}
                </div>

                {#if secState === 'pending' && items.length === 0}
                  <div class="ghost" data-testid="folderpage-ghost" aria-hidden="true"></div>
                  <div class="ghost" data-testid="folderpage-ghost" aria-hidden="true"></div>
                  <div class="ghost" data-testid="folderpage-ghost" aria-hidden="true"></div>
                {:else if secState === 'signed-out'}
                  {#if cfg.source === 'github'}
                    <button
                      type="button"
                      class="signin-row"
                      data-testid="folderpage-signin"
                      onclick={() => void openConnectorsSettings()}
                    >
                      Add a token in Settings → Connectors
                    </button>
                  {:else}
                    <button
                      type="button"
                      class="signin-row"
                      data-testid="folderpage-signin"
                      onclick={() => signIn(cfg)}
                    >
                      Sign in to {hostOf(cfg)}
                    </button>
                  {/if}
                {:else if secState === 'needs-access'}
                  <div class="needs-access" data-testid="folderpage-needs-access">
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
                        <FolderPageItem
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
                      {/each}
                    </div>
                  {/if}
                  {#if note}
                    <p class="note-row" data-testid="folderpage-empty-note">{note}</p>
                  {/if}
                  {#if secState === 'error'}
                    <p class="note-row" data-testid="folderpage-error-note">
                      Couldn't reach {hostOf(cfg)}
                    </p>
                  {/if}
                  <!-- Reading controls (feed sections): reveal/hide read + show more. -->
                  {#if isFeed && (hasMore(cfg) || readCount(cfg) > 0)}
                    {@const sk = sourceKey(cfg)}
                    <div class="reading-controls" data-testid="folderpage-reading-controls">
                      {#if hasMore(cfg)}
                        <Button variant="ghost" size="sm" onclick={() => showMore(sk)}>
                          <span>Show more</span>
                        </Button>
                      {/if}
                      <span class="controls-spacer"></span>
                      {#if readCount(cfg) > 0}
                        <Button
                          variant="ghost"
                          size="sm"
                          onclick={() => toggleReveal(sk)}
                          title={isRevealed(sk) ? 'Hide read items' : 'Show read items'}
                        >
                          {isRevealed(sk) ? 'Hide read' : `Show ${readCount(cfg)} read`}
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
    {/if}
  </div>
</main>
