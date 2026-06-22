<script lang="ts">
import { dispatch } from '../shared/bus';
import { requiredOriginsForConfig } from '../shared/connector-origins';
import { requestHostPermissions } from '../shared/permissions';
import type {
  AppState,
  PinNode,
  ResolvedSourceConfig,
  SidebarLocalState,
  SmartFolderItem,
  SmartSectionRuntime,
  SpaceId,
  TabId,
  WindowId,
} from '../shared/types';
import Button from '../ui/Button.svelte';
import ContextMenu from '../ui/ContextMenu.svelte';
import Favicon from '../ui/Favicon.svelte';
import FolderRow from '../ui/FolderRow.svelte';
import { faviconFor } from '../ui/favicon';
import Icon from '../ui/Icon.svelte';
import IconButton from '../ui/IconButton.svelte';
import type { MenuItem } from '../ui/menu-types';
import type { RowMenuItem } from '../ui/RowMenu.svelte';
import Tooltip from '../ui/Tooltip.svelte';
import { openOptionsAt } from './open-options';
import SmartFolderEditor from './SmartFolderEditor.svelte';
import SmartSectionHeader from './SmartSectionHeader.svelte';
import { useStore } from './store-context.svelte';

/**
 * A smart folder in the pinned tree: the same folder-row chrome (`ui/FolderRow`)
 * with live connector results as children, rendered in per-RESOLVED-SECTION
 * blocks. Each `sources[]` instance expands over its `queries[]` into one
 * section per filter (one section for an rss feed); when the folder has ≥2
 * resolved sections a `SmartSectionHeader` divides them. Single-section folders
 * render identically to before (no section header, no regression).
 */

type SmartNode = Extract<PinNode, { kind: 'smart' }>;

interface Props {
  windowId: WindowId;
  spaceId: SpaceId;
  node: SmartNode;
  expanded: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggle: () => void;
}

const {
  windowId,
  spaceId,
  node,
  expanded,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onToggle,
}: Props = $props();

const store = useStore();

const spaceColor = $derived(store.state.spaces.find((s) => s.id === spaceId)?.color ?? 'gray');

// Per-filter section identity key — same formula as background/smart-folders.ts
// but defined locally to respect the layer DAG (sidebar cannot import from
// background/): `${source}:${host}:${query}` for queue, `${source}:${host}` for rss.
function sourceKey(cfg: ResolvedSourceConfig): string {
  const base = `${cfg.source}:${new URL(cfg.baseUrl).host}`;
  return cfg.query !== undefined ? `${base}:${cfg.query}` : base;
}

// Per-section collapse read — `collapsedSmartSectionsByWindow` is augmented onto
// the store by the sidebar (sidebar-local, never part of `AppState`), so read it
// through the same structural cast `PinnedTabs` uses for `expandedFoldersByWindow`.
// Absent entry ⇒ expanded.
function isSectionCollapsed(folderId: string, sk: string): boolean {
  const augmented = store.state as AppState & SidebarLocalState;
  return augmented.collapsedSmartSectionsByWindow?.[windowId]?.[folderId]?.[sk] ?? false;
}

// Per-section "reveal recently read" peek — sidebar-local, per-window (same
// structural cast + absent ⇒ not revealed). The folder's `hideRead` is the
// drained resting default; revealing one feed's read rows here overrides it for
// THAT section only, so the peek never spills across feeds or windows.
function isSectionReadRevealed(folderId: string, sk: string): boolean {
  const augmented = store.state as AppState & SidebarLocalState;
  return augmented.revealedReadSmartSectionsByWindow?.[windowId]?.[folderId]?.[sk] ?? false;
}

/** Effective hide-read for a feed section: the folder default, unless this
 * window has revealed that section's read rows. */
function sectionHidesRead(sk: string): boolean {
  return node.hideRead && !isSectionReadRevealed(node.id, sk);
}

// Expand the per-instance sources[] over each instance's queries[] into per-
// filter resolved sections (one section, no query, for an rss feed). The single
// derivation the render, badge, and identity all key on (sources × queries order).
const sections = $derived.by<ResolvedSourceConfig[]>(() => {
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

// Whether any source is a feed — gates the feed-only menu items and controls.
const hasFeedSections = $derived(node.sources.some((cfg) => cfg.source === 'rss'));

/** Read items for the whole folder (feed sections only). */
const readSet = $derived(new Set(store.state.smartReadState[node.id] ?? []));

// Sectioned runtime — absent before the first fetch.
const folderRuntime = $derived(store.state.smartFolders[node.id]);

function sectionRuntime(cfg: ResolvedSourceConfig): SmartSectionRuntime | undefined {
  return folderRuntime?.sections[sourceKey(cfg)];
}

const busy = $derived(
  !folderRuntime || Object.values(folderRuntime.sections).some((s) => s.state === 'pending'),
);

// Per-section held items: last-known set carried through SW restarts and
// in-flight reloads so rows stay activatable while loading.
let heldItemsBySection = $state<Record<string, SmartFolderItem[]>>({});
$effect(() => {
  for (const cfg of sections) {
    const sk = sourceKey(cfg);
    const sec = folderRuntime?.sections[sk];
    const secItems = sec?.items ?? [];
    const secState = sec?.state ?? 'pending';
    if (secItems.length > 0 || secState === 'ok') {
      heldItemsBySection[sk] = secItems;
    }
  }
});

// Namespaced last-seen map: key = `${sourceKey}:${nativeId}` so items from
// different sections with colliding native ids never shadow each other.
let lastSeenById = $state<Record<string, SmartFolderItem>>({});
$effect(() => {
  for (const [sk, sec] of Object.entries(folderRuntime?.sections ?? {})) {
    for (const item of sec.items) {
      lastSeenById[`${sk}:${item.id}`] = item;
    }
  }
  const liveKeys = new Set<string>();
  for (const [sk, sec] of Object.entries(folderRuntime?.sections ?? {})) {
    for (const item of sec.items) liveKeys.add(`${sk}:${item.id}`);
  }
  for (const namespacedId of Object.keys(folderBindings)) liveKeys.add(namespacedId);
  const stale = Object.keys(lastSeenById).filter((k) => !liveKeys.has(k));
  if (stale.length > 0) {
    const next = { ...lastSeenById };
    for (const k of stale) delete next[k];
    lastSeenById = next;
  }
});

const folderBindings = $derived(store.state.smartItemBindings[node.id] ?? {});

/** Live tab bound to this item in this window, by namespaced id. */
function boundTabIdFor(cfg: ResolvedSourceConfig, item: SmartFolderItem): TabId | undefined {
  return folderBindings[`${sourceKey(cfg)}:${item.id}`]?.[windowId]?.tabId;
}

function isActiveItem(cfg: ResolvedSourceConfig, item: SmartFolderItem): boolean {
  const tabId = boundTabIdFor(cfg, item);
  if (tabId === undefined) return false;
  const live = store.state.liveTabsById[tabId];
  return live !== undefined && live.windowId === windowId && live.active;
}

function closeBoundTab(cfg: ResolvedSourceConfig, item: SmartFolderItem): void {
  const tabId = boundTabIdFor(cfg, item);
  if (tabId !== undefined) dispatch({ kind: 'closeTab', payload: { tabId } });
}

/** Live items + held items during reloads + binding-held rows per section. */
function displayItemsForSection(cfg: ResolvedSourceConfig): SmartFolderItem[] {
  const sk = sourceKey(cfg);
  const sec = folderRuntime?.sections[sk];
  const items = sec?.items ?? [];
  const secState = sec?.state ?? 'pending';
  const base =
    items.length > 0
      ? items
      : secState === 'pending' || secState === 'error'
        ? (heldItemsBySection[sk] ?? [])
        : [];
  const present = new Set(base.map((i) => i.id));
  const held: SmartFolderItem[] = [];
  for (const [namespacedId, slots] of Object.entries(folderBindings)) {
    if (!namespacedId.startsWith(`${sk}:`)) continue;
    const nativeId = namespacedId.slice(sk.length + 1);
    if (slots[windowId] === undefined || present.has(nativeId)) continue;
    const seen = lastSeenById[namespacedId];
    if (seen) held.push(seen);
  }
  return held.length === 0 ? base : [...base, ...held];
}

/** Feed windowing: newest N unread + interleaved read rows (identical to the
 * single-source draining-queue model, applied per section). */
function feedWindowForSection(
  cfg: ResolvedSourceConfig,
  secItems: SmartFolderItem[],
): SmartFolderItem[] {
  if (cfg.source !== 'rss') return secItems;
  const sk = sourceKey(cfg);
  const unreadPositions: number[] = [];
  secItems.forEach((it, i) => {
    if (!readSet.has(`${sk}:${it.id}`)) unreadPositions.push(i);
  });
  // The window must (a) span through the newest `maxItems` unread items (all of
  // them when fewer) so every counted unread renders even when read rows sit
  // ahead of them — slicing the first `maxItems` by POSITION drops unread that
  // trail a run of read rows (you read the newest N) — AND (b) still cover at
  // least the first `maxItems` rows so trailing read rows stay available for the
  // "show read" peek. Hence the max of both bounds. No unread → just the peek.
  const unreadBudget = Math.min(unreadPositions.length, node.maxItems);
  const peekCutoff = Math.min(secItems.length, node.maxItems);
  const cutoff =
    unreadBudget > 0
      ? Math.max((unreadPositions[unreadBudget - 1] as number) + 1, peekCutoff)
      : peekCutoff;
  return secItems.slice(0, cutoff);
}

function sectionEmptyNote(
  cfg: ResolvedSourceConfig,
  renderItems: SmartFolderItem[],
  secItems: SmartFolderItem[],
  secState: SmartSectionRuntime['state'],
): string | undefined {
  if (secState === 'error') return undefined;
  // For feeds: consider hidden (collapsed) items as invisible — the user sees an
  // empty list when every item is read and hideRead is on.
  const sk = sourceKey(cfg);
  const visibleItems =
    cfg.source === 'rss' && sectionHidesRead(sk)
      ? renderItems.filter((i) => !readSet.has(`${sk}:${i.id}`))
      : renderItems;
  if (visibleItems.length > 0) return undefined;
  if (cfg.source === 'rss') {
    if (secItems.length === 0) return 'No entries yet.';
    const unreadCount = secItems.filter((i) => !readSet.has(`${sk}:${i.id}`)).length;
    if (unreadCount === 0) return "You're all caught up.";
    return undefined;
  }
  return secItems.length === 0 ? 'Nothing here right now.' : undefined;
}

/** Badge: sum per-RESOLVED-SECTION attention counts (an item in two filter
 * sections counts in each). `N+` when any section has hit its `maxItems` cap.
 * When folderRuntime is absent (SW restart), compute from held items so the
 * badge doesn't disappear during the reload window. */
const badge = $derived.by<string | undefined>(() => {
  let total = 0;
  let anyCapped = false;
  for (const cfg of sections) {
    const sk = sourceKey(cfg);
    const secItems = displayItemsForSection(cfg);
    if (cfg.source === 'rss') {
      // Feed: the true unread count (maxItems is a display budget, not a count
      // cap — the buffer holds them all), so the badge is never `N+` for a feed.
      total += secItems.filter((i) => !readSet.has(`${sk}:${i.id}`)).length;
    } else {
      // Queue: the connector already slices to maxItems, so a full section is at
      // cap and the true upstream count may be higher → `N+`.
      total += secItems.length;
      if (secItems.length >= node.maxItems) anyCapped = true;
    }
  }
  if (total === 0) return undefined;
  return anyCapped ? `${total}+` : String(total);
});

function openItem(cfg: ResolvedSourceConfig, item: SmartFolderItem): void {
  dispatch({
    kind: 'openSmartItem',
    payload: { spaceId, folderId: node.id, itemId: `${sourceKey(cfg)}:${item.id}`, windowId },
  });
}

function openAll(): void {
  dispatch({ kind: 'openSmartFolderListing', payload: { spaceId, folderId: node.id, windowId } });
}

function markAllRead(): void {
  dispatch({ kind: 'markAllSmartItemsRead', payload: { spaceId, folderId: node.id } });
}

// Toggle THIS section's read-rows peek (sidebar-local, per-window) — never the
// folder-wide `hideRead`, so revealing one feed's read rows leaves the others
// drained.
function toggleSectionRead(sk: string): void {
  store.setSmartSectionRevealRead(windowId, node.id, sk, !isSectionReadRevealed(node.id, sk));
}

function refreshNow(): void {
  dispatch({ kind: 'refreshSmartFolder', payload: { spaceId, folderId: node.id } });
}

function deleteFolder(): void {
  dispatch({ kind: 'deleteSmartFolder', payload: { spaceId, folderId: node.id } });
}

function openConnectorsSettings(): void {
  void openOptionsAt('#connectors');
}

function itemAria(cfg: ResolvedSourceConfig, item: SmartFolderItem, read: boolean): string {
  if (cfg.source === 'rss') return `${item.title} — ${read ? 'read' : 'unread'}`;
  return item.status ? `${item.title} — ${item.status.label}` : item.title;
}

let editing = $state(false);
let kebabMenuOpen = $state(false);

function onEditorDone(): void {
  editing = false;
  kebabMenuOpen = false;
  menuOpen = false;
}

let confirmingDelete = $state(false);

const menuItems = $derived<RowMenuItem[] & MenuItem[]>([
  { id: 'refresh', label: 'Refresh now', icon: 'rotate-cw', onSelect: refreshNow },
  {
    id: 'edit',
    label: 'Edit…',
    icon: 'pencil',
    keepOpen: true,
    submenu: true,
    onSelect: () => {
      confirmingDelete = false;
      editing = true;
    },
  },
  { id: 'open-all', label: 'Open all in a tab', icon: 'arrow-up-right', onSelect: openAll },
  ...(hasFeedSections
    ? [{ id: 'mark-all-read', label: 'Mark all read', icon: 'check-check', onSelect: markAllRead }]
    : []),
  { id: 'move-up', label: 'Move up', icon: 'arrow-up', disabled: !canMoveUp, onSelect: onMoveUp },
  {
    id: 'move-down',
    label: 'Move down',
    icon: 'arrow-down',
    disabled: !canMoveDown,
    onSelect: onMoveDown,
  },
  confirmingDelete
    ? {
        id: 'delete',
        label: 'Delete — confirm',
        icon: 'trash-2',
        danger: true,
        onSelect: () => {
          confirmingDelete = false;
          deleteFolder();
        },
      }
    : {
        id: 'delete',
        label: 'Delete',
        icon: 'trash-2',
        danger: true,
        keepOpen: true,
        onSelect: () => {
          confirmingDelete = true;
        },
      },
]);

let menuOpen = $state(false);
let menuX = $state(0);
let menuY = $state(0);
let menuAnchorEl = $state<HTMLElement | undefined>(undefined);

$effect(() => {
  if (!kebabMenuOpen && !menuOpen) confirmingDelete = false;
});

export function onContextMenu(e: MouseEvent): void {
  e.preventDefault();
  menuX = e.clientX;
  menuY = e.clientY;
  menuAnchorEl = e.currentTarget as HTMLElement;
  editing = false;
  menuOpen = true;
}
</script>

<FolderRow
  name={node.name}
  icon={node.icon}
  color={spaceColor}
  {expanded}
  {onToggle}
  label={badge === undefined
    ? node.name
    : `${node.name}, ${badge} ${hasFeedSections ? 'unread' : 'items'}`}
  {badge}
  {busy}
  {menuItems}
  panel={editing ? editorPanel : undefined}
  panelTitle={editing ? 'Edit smart folder' : undefined}
  onPanelBack={() => {
    editing = false;
  }}
  bind:menuOpen={kebabMenuOpen}
/>

{#snippet editorPanel()}
  <SmartFolderEditor {spaceId} {node} onDone={onEditorDone} />
{/snippet}

{#if expanded}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="children"
    data-testid="smart-children"
    onpointerdown={(e) => e.stopPropagation()}
  >
    {#each sections as cfg, sectionIndex (sourceKey(cfg))}
      {@const sec = sectionRuntime(cfg)}
      {@const secState = sec?.state ?? 'pending'}
      {@const secItems = displayItemsForSection(cfg)}
      {@const isSectionFeed = cfg.source === 'rss'}
      {@const renderItems = isSectionFeed ? feedWindowForSection(cfg, secItems) : secItems}
      {@const emptyNote = sectionEmptyNote(cfg, renderItems, secItems, secState)}
      {@const collapsed = isSectionCollapsed(node.id, sourceKey(cfg))}
      {@const bodyId = `smart-section-body-${node.id}-${sourceKey(cfg)}`}

      {#if sections.length >= 2}
        {@const sectionCount = (() => {
          const secItems = displayItemsForSection(cfg);
          const sk = sourceKey(cfg);
          if (cfg.source === 'rss') {
            const n = secItems.filter((i) => !readSet.has(`${sk}:${i.id}`)).length;
            return n > 0 ? String(n) : undefined;
          }
          return secItems.length > 0 ? String(secItems.length) : undefined;
        })()}
        <SmartSectionHeader
          {cfg}
          count={sectionCount}
          {collapsed}
          first={sectionIndex === 0}
          controlsId={bodyId}
          onToggle={() =>
            store.setSmartSectionCollapsed(windowId, node.id, sourceKey(cfg), !collapsed)}
        />
      {/if}

      {#if !collapsed}
      <div class="section-body" id={bodyId}>
      {#if secState === 'pending' && secItems.length === 0}
        <div class="ghost" data-testid="smart-ghost-row" aria-hidden="true"></div>
        <div class="ghost" data-testid="smart-ghost-row" aria-hidden="true"></div>
        <div class="ghost" data-testid="smart-ghost-row" aria-hidden="true"></div>
      {:else if secState === 'signed-out'}
        {#if cfg.source === 'github'}
          <button
            type="button"
            class="signin-row"
            data-testid="smart-signin-row"
            onclick={openConnectorsSettings}
          >
            Add a token in Settings → Connectors
          </button>
        {:else}
          {@const secHost = (() => { try { return new URL(cfg.baseUrl).host; } catch { return cfg.baseUrl; } })()}
          <button
            type="button"
            class="signin-row"
            data-testid="smart-signin-row"
            onclick={() => dispatch({ kind: 'openUrl', payload: { url: cfg.baseUrl, windowId } })}
          >
            Sign in to {secHost}
          </button>
        {/if}
      {:else if secState === 'needs-access'}
        {@const secHost = (() => { try { return new URL(cfg.baseUrl).host; } catch { return cfg.baseUrl; } })()}
        <div class="needs-access" data-testid="smart-needs-access">
          <Icon name="key-round" size={16} />
          <span class="needs-access-copy">Lunma needs access to {secHost}</span>
          <Button variant="primary" onclick={() => void requestHostPermissions(requiredOriginsForConfig(cfg))}>Grant access</Button>
        </div>
      {:else}
        {#each renderItems as item (item.id)}
          {@const bound = boundTabIdFor(cfg, item) !== undefined}
          {@const active = isActiveItem(cfg, item)}
          {@const read = isSectionFeed && readSet.has(`${sourceKey(cfg)}:${item.id}`)}
          {@const collapsed = isSectionFeed && sectionHidesRead(sourceKey(cfg)) && read}
          {@const itemFavSrc = isSectionFeed
            ? (() => { try { return faviconFor(new URL(item.url).origin); } catch { return faviconFor(cfg.baseUrl); } })()
            : faviconFor(cfg.baseUrl)}

          {#snippet closeSlot()}
            {#if bound}
              <!-- svelte-ignore a11y_no_static_element_interactions -->
              <span class="close-slot" onpointerdown={(e) => e.stopPropagation()}>
                <IconButton
                  icon="x"
                  ariaLabel="Close tab"
                  title="Close tab"
                  size={14}
                  testid="smart-close"
                  onclick={() => closeBoundTab(cfg, item)}
                />
              </span>
            {/if}
          {/snippet}

          <div
            class="row-wrap"
            class:bound
            class:active
            class:feed={isSectionFeed}
            class:collapsed
            aria-hidden={collapsed}
            data-testid="smart-row-wrap"
            data-read={isSectionFeed ? read : undefined}
          >
            {#if item.status}
              {@const status = item.status}
              <Tooltip label={status.label}>
                {#snippet children(props)}
                  <button
                    {...props}
                    type="button"
                    class="result-row"
                    class:active
                    data-testid="smart-result-row"
                    data-bound={bound}
                    data-active={active}
                    aria-label={itemAria(cfg, item, false)}
                    onclick={() => openItem(cfg, item)}
                  >
                    <span class="result-favicon" aria-hidden="true">
                      <Favicon src={itemFavSrc} size={16} />
                    </span>
                    <span class="result-title">{item.title}</span>
                    <span class="dot {status.tone}" data-testid="smart-status-dot"></span>
                  </button>
                {/snippet}
              </Tooltip>
            {:else}
              <button
                type="button"
                class="result-row"
                class:active
                class:feed={isSectionFeed}
                class:read
                tabindex={collapsed ? -1 : undefined}
                data-testid="smart-result-row"
                data-bound={bound}
                data-active={active}
                aria-label={itemAria(cfg, item, read)}
                onclick={() => openItem(cfg, item)}
              >
                <span class="result-favicon" aria-hidden="true">
                  <Favicon src={faviconFor(cfg.baseUrl)} size={16} />
                </span>
                <span class="result-title">{item.title}</span>
                {#if isSectionFeed}
                  <span class="dot unread" class:cleared={read} data-testid="smart-unread-dot"></span>
                {/if}
              </button>
            {/if}
            {@render closeSlot()}
          </div>
        {/each}

        {#if emptyNote}
          <div class="note-row" data-testid="smart-empty-note">{emptyNote}</div>
        {/if}
        {#if secState === 'error'}
          {@const secHost = (() => { try { return new URL(cfg.baseUrl).host; } catch { return cfg.baseUrl; } })()}
          <div class="note-row" data-testid="smart-error-note">Couldn't reach {secHost}</div>
        {/if}

        {#if isSectionFeed}
          {@const readCount = renderItems.filter((i) => readSet.has(`${sourceKey(cfg)}:${i.id}`)).length}
          {@const hidesRead = sectionHidesRead(sourceKey(cfg))}
          <div class="reading-controls" data-testid="smart-reading-controls">
            {#if readCount > 0}
              <Button
                variant="ghost"
                size="sm"
                onclick={() => toggleSectionRead(sourceKey(cfg))}
                title={hidesRead ? 'Show recently read' : 'Hide read again'}
              >
                {hidesRead ? `Show ${readCount} read` : `Hide ${readCount} read`}
              </Button>
            {/if}
            <span class="controls-spacer"></span>
            <Button
              variant="ghost"
              size="sm"
              onclick={openAll}
              title="Open the feed's website in a new tab"
            >
              <span class="open-all-label">Open all</span>
              <Icon name="arrow-up-right" size={12} />
            </Button>
          </div>
        {/if}
      {/if}
      </div>
      {/if}
    {/each}
  </div>
{/if}

<ContextMenu
  bind:open={menuOpen}
  x={menuX}
  y={menuY}
  anchorEl={menuAnchorEl}
  items={menuItems}
  label="Smart folder actions"
  testid="smart-folder-menu"
  panel={editing ? editorPanel : undefined}
  panelTitle={editing ? 'Edit smart folder' : undefined}
  onPanelBack={() => {
    editing = false;
  }}
  onclose={() => {
    editing = false;
    confirmingDelete = false;
  }}
/>

<style>
  .children {
    padding-left: var(--space-3);
    display: flex;
    flex-direction: column;
    animation: smart-open var(--motion-base) var(--ease-emphasised);
  }

  /* Section body wrapper (collapsible-smart-folder-sections). Adds NO padding or
   * indent — header and rows keep their own padding, so the layout stays flat.
   * Mirrors `.children`'s column flow and replays the `smart-open` entrance when
   * a collapsed section is re-expanded (the wrapper is conditionally rendered,
   * so a fresh mount re-triggers the animation). */
  .section-body {
    display: flex;
    flex-direction: column;
    animation: smart-open var(--motion-base) var(--ease-emphasised);
  }

  .row-wrap {
    position: relative;
    margin: 0 0 var(--row-gap);
  }

  .result-row {
    appearance: none;
    border: 0;
    margin: 0;
    width: 100%;
    box-sizing: border-box;
    height: var(--row-h);
    padding: 0 var(--space-2) 0 var(--space-3);
    display: flex;
    align-items: center;
    gap: var(--space-2);
    background: transparent;
    color: var(--text-2);
    border-radius: var(--r-md);
    cursor: pointer;
    text-align: left;
    animation: smart-item-in var(--motion-fast) var(--ease-standard);
    transition:
      background var(--motion-fast) var(--ease-standard),
      transform var(--motion-fast) var(--ease-standard);
  }
  .result-row:hover {
    background: var(--surface-2);
  }
  .result-row:active {
    transform: scale(var(--press-scale));
  }
  .result-row:focus-visible {
    outline: var(--focus-width) solid var(--focus-color);
    outline-offset: var(--focus-offset);
  }

  .result-row.active {
    background: var(--space-c-soft);
    color: var(--text);
  }
  .result-row.active .result-title {
    font-weight: var(--weight-semibold);
  }

  .close-slot {
    position: absolute;
    top: 50%;
    right: calc(var(--space-2) + 4px);
    translate: 50% -50%;
    display: inline-flex;
    opacity: 0;
    pointer-events: none;
    transition: opacity var(--motion-fast) var(--ease-standard);
  }
  .row-wrap:hover .close-slot,
  .close-slot:focus-within {
    opacity: 1;
    pointer-events: auto;
  }
  .row-wrap.bound:hover .dot,
  .row-wrap.bound:has(.close-slot:focus-within) .dot {
    opacity: 0;
  }

  .result-favicon {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--favicon-size);
    height: var(--favicon-size);
    color: var(--text-muted);
    /* Recessed at rest so the title leads, not the bright source disc; full
     * strength on hover / when active. */
    opacity: 0.8;
    transition: opacity var(--motion-fast) var(--ease-standard);
  }
  .row-wrap:hover .result-favicon,
  .result-row.active .result-favicon {
    opacity: 1;
  }

  .result-title {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    font: var(--weight-regular) var(--text-sm) / 1 var(--font-sans);
  }

  .dot {
    flex-shrink: 0;
    width: 8px;
    height: 8px;
    border-radius: var(--r-pill);
    transition: opacity var(--motion-fast) var(--ease-standard);
  }
  .dot.ok {
    background: var(--success);
  }
  .dot.fail {
    background: var(--danger);
  }
  .dot.warn {
    background: var(--warning);
  }
  .dot.pending {
    background: var(--info);
  }

  .dot.unread {
    background: var(--space-c);
    transition: opacity var(--motion-base) var(--ease-standard);
  }
  .dot.unread.cleared {
    opacity: 0;
  }

  .result-row.feed .result-title {
    transition:
      color var(--motion-base) var(--ease-standard),
      font-weight var(--motion-base) var(--ease-standard);
  }
  .result-row.feed:not(.read) .result-title {
    color: var(--text);
    font-weight: var(--weight-medium);
  }
  .result-row.feed.read .result-title {
    color: var(--text-muted);
    font-weight: var(--weight-regular);
  }
  .result-row.feed .result-favicon {
    transition: opacity var(--motion-base) var(--ease-standard);
  }
  .result-row.feed.read .result-favicon {
    opacity: 0.45;
  }

  .row-wrap.feed {
    max-height: var(--row-h);
    transition:
      max-height var(--motion-base) var(--ease-emphasised),
      opacity var(--motion-base) var(--ease-emphasised),
      margin var(--motion-base) var(--ease-emphasised);
  }
  .row-wrap.feed.collapsed {
    max-height: 0;
    margin: 0;
    opacity: 0;
    overflow: hidden;
    pointer-events: none;
  }

  .reading-controls {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-1) var(--space-1) 0;
    margin-top: var(--space-1);
  }
  .controls-spacer {
    flex: 1 1 auto;
  }

  .ghost {
    height: var(--row-h);
    margin-bottom: var(--row-gap);
    border-radius: var(--r-md);
    background: color-mix(in oklch, var(--surface) 55%, transparent);
  }

  .signin-row {
    appearance: none;
    border: 0;
    margin: 0 0 var(--row-gap);
    width: 100%;
    box-sizing: border-box;
    height: var(--row-h);
    padding: 0 var(--space-2) 0 var(--space-3);
    display: flex;
    align-items: center;
    background: transparent;
    color: var(--text-muted);
    border-radius: var(--r-md);
    cursor: pointer;
    text-align: left;
    font: var(--weight-regular) var(--text-sm) / 1 var(--font-sans);
    transition:
      background var(--motion-fast) var(--ease-standard),
      color var(--motion-fast) var(--ease-standard);
  }
  .signin-row:hover {
    background: var(--surface-2);
    color: var(--text);
  }
  .signin-row:focus-visible {
    outline: var(--focus-width) solid var(--focus-color);
    outline-offset: var(--focus-offset);
  }

  .needs-access {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin: 0 0 var(--row-gap);
    padding: var(--space-2) var(--space-2) var(--space-2) var(--space-3);
    color: var(--text-muted);
  }
  .needs-access-copy {
    flex: 1;
    min-width: 0;
    color: var(--text-muted);
    font: var(--weight-regular) var(--text-sm) / 1.3 var(--font-sans);
  }

  .note-row {
    padding: var(--space-1) var(--space-2) var(--space-1) var(--space-3);
    color: var(--text-faint);
    font: var(--weight-regular) var(--text-xs) / 1.2 var(--font-sans);
  }

  @keyframes smart-open {
    from {
      opacity: 0;
      transform: translateY(-3px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes smart-item-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .children,
    .section-body,
    .result-row {
      animation: none;
    }
    .dot.unread,
    .row-wrap.feed,
    .result-row.feed .result-title,
    .result-favicon {
      transition: none;
    }
  }
</style>
