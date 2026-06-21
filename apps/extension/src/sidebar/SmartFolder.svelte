<script lang="ts">
import { dispatch } from '../shared/bus';
import { requiredOriginsForNode } from '../shared/connector-origins';
import { requestHostPermissions } from '../shared/permissions';
import type { PinNode, SmartFolderItem, SpaceId, TabId, WindowId } from '../shared/types';
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
import { useStore } from './store-context.svelte';

/**
 * A smart folder in the pinned tree (smart-folders, design D8): the same
 * folder-row chrome (`ui/FolderRow`) with live connector results as children.
 * Result rows activate like pinned tabs (smart-folder-item-bindings —
 * reversing the v1 link-shaped call): a click dispatches `openSmartItem`
 * (identity only — the SW resolves the URL from its own runtime slice), the
 * SW opens-if-dormant / focuses-if-bound, and a bound row takes the `TabRow`
 * selection grammar — the `--space-c-soft` active wash when its bound tab is
 * this window's focused tab — plus a hover ✕ closing the bound tab via the
 * existing `closeTab`. Still no drag/reorder/rename of result rows, and no
 * drift UI in v1 (the binding holds wherever the tab navigates). The folder
 * NODE itself drags/reorders among pins; its menu carries Refresh now · Edit…
 * · Move up/Move down · Delete (a two-step arm, smart-folder-delete-confirm —
 * the first activation morphs the entry into a danger "Delete — confirm" and
 * keeps the menu open, only the second dispatches `deleteSmartFolder`, and
 * closing/Escaping disarms: a tuned connector config, a specific JQL or an
 * obscure feed URL, is no longer trivially recreatable. The delete OUTCOME is
 * unchanged — it closes no tabs; bound tabs demote to Temporary SW-side).
 */

type SmartNode = Extract<PinNode, { kind: 'smart' }>;

interface Props {
  windowId: WindowId;
  spaceId: SpaceId;
  node: SmartNode;
  expanded: boolean;
  /** Move-bounds within the top-level pinned list (host-computed, like folders). */
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

// The glyph tints with the Space's colour — a smart node persists no colour of
// its own in v1 (design D8).
const spaceColor = $derived(store.state.spaces.find((s) => s.id === spaceId)?.color ?? 'gray');

// A FEED source (rss-connector) is the "reading nook": per-item read-state, an
// unread-count badge, the hide-read / mark-all-read / open-all controls. Queue
// sources keep their item-count badge + status dots unchanged.
const isFeed = $derived(node.source === 'rss');
/** The read item ids for this feed (rss-connector design D3), rebuilt from each
 * broadcast. Empty for queue sources (they carry no read-state). */
const readSet = $derived(new Set(store.state.smartReadState[node.id] ?? []));

// Runtime results (ephemeral slice). Absent — a SW cold start before the first
// fetch — reads as the quiet pending state.
const runtime = $derived(store.state.smartFolders[node.id]);
const fetchState = $derived(runtime?.state ?? 'pending');
const items = $derived(runtime?.items ?? []);
// Only the in-flight refresh indicator animates (visual language); reduced
// motion holds it static via FolderRow's busy treatment.
const busy = $derived(fetchState === 'pending');

// Held last-known items: the runtime slice dies with the SW (results are never
// persisted), so an SW restart boot-broadcasts an empty slice and an open
// sidebar would drop to ghost rows mid-reload. Hold the last item set in
// COMPONENT memory (still never persisted) and keep rendering it while a
// reload is in flight, so rows stay activatable during loading. An `ok` result
// — including an honestly-empty one — re-syncs the hold.
let heldItems = $state<SmartFolderItem[]>([]);
$effect(() => {
  if (items.length > 0 || fetchState === 'ok') heldItems = items;
});

// This folder's item bindings for THIS window (smart-folder-item-bindings):
// `{ [itemId]: { [windowId]: { tabId, allowGlob } } }`, rebuilt from every state broadcast.
const folderBindings = $derived(store.state.smartItemBindings[node.id] ?? {});

/** The live tab bound to `itemId` in this window, or undefined when dormant. */
function boundTabIdFor(itemId: string): TabId | undefined {
  return folderBindings[itemId]?.[windowId]?.tabId;
}

/** Bound-and-focused: the row takes the `--space-c-soft` active wash exactly
 * when its bound tab is this window's focused tab (the TabRow grammar). */
function isActiveItem(itemId: string): boolean {
  const tabId = boundTabIdFor(itemId);
  if (tabId === undefined) return false;
  const live = store.state.liveTabsById[tabId];
  return live !== undefined && live.windowId === windowId && live.active;
}

/** The hover ✕: close the bound live tab via the existing `closeTab` command
 * (no new close plumbing); `onTabRemoved` drops the binding SW-side. */
function closeBoundTab(itemId: string): void {
  const tabId = boundTabIdFor(itemId);
  if (tabId !== undefined) dispatch({ kind: 'closeTab', payload: { tabId } });
}

// Last-seen item data by id — the component memory a binding-held row renders
// from (design D3): an item with a live binding keeps its row after dropping
// out of the results (PR merged, query/source edited), same anatomy, until
// `onTabRemoved` drops the binding and the row evaporates. Sidebar-only,
// never persisted.
let lastSeenById = $state<Record<string, SmartFolderItem>>({});
$effect(() => {
  for (const item of items) lastSeenById[item.id] = item;
  // Prune entries no longer referenced by current items or live bindings so the
  // map doesn't grow unboundedly as items rotate through a smart folder.
  const liveIds = new Set([...items.map((i) => i.id), ...Object.keys(folderBindings)]);
  for (const id of Object.keys(lastSeenById)) {
    if (!liveIds.has(id)) delete lastSeenById[id];
  }
});

/** What the expanded list renders: live items, else the held set during an
 * in-flight reload (`pending`) or an outage (`error`) — plus binding-held
 * rows: items bound in this window that the base set no longer lists (open
 * work holds its row). */
const displayItems = $derived.by<SmartFolderItem[]>(() => {
  const base =
    items.length > 0 ? items : fetchState === 'pending' || fetchState === 'error' ? heldItems : [];
  const present = new Set(base.map((i) => i.id));
  const held: SmartFolderItem[] = [];
  for (const itemId of Object.keys(folderBindings)) {
    if (boundTabIdFor(itemId) === undefined || present.has(itemId)) continue;
    const seen = lastSeenById[itemId];
    if (seen) held.push(seen);
  }
  return held.length === 0 ? base : [...base, ...held];
});

// FEED draining-queue windowing (rss-connector design D5): for a feed `maxItems`
// is an UNREAD budget, not a fetch cap — the connector keeps the whole feed and
// the folder surfaces the newest `maxItems` UNREAD, backfilling older unread as
// you read. The window is the newest items down to (and including) the
// `maxItems`-th unread; interleaved read items ride along (collapsed by default
// for the drain beat; revealed by "Show recently read"). When fewer than
// `maxItems` unread exist the window is the newest `maxItems` items (bounded).
const feedWindow = $derived.by<SmartFolderItem[]>(() => {
  if (!isFeed) return displayItems;
  const unreadPositions: number[] = [];
  displayItems.forEach((it, i) => {
    if (!readSet.has(it.id)) unreadPositions.push(i);
  });
  const cutoff =
    unreadPositions.length >= node.maxItems
      ? (unreadPositions[node.maxItems - 1] as number) + 1
      : Math.min(displayItems.length, node.maxItems);
  return displayItems.slice(0, cutoff);
});
// What the list actually renders: the unread-budget window for a feed, the full
// set for a queue. Read rows within the feed window collapse (drained) unless
// "Show recently read" is on (see `.row-wrap.collapsed` / `node.hideRead`).
const renderItems = $derived(isFeed ? feedWindow : displayItems);

// The read rows WITHIN the rendered window — the count "Show recently read"
// reveals (feed only).
const readItems = $derived(isFeed ? feedWindow.filter((i) => readSet.has(i.id)) : []);
const readCount = $derived(readItems.length);
// Total unread across the whole kept buffer — what the badge counts.
const unreadCount = $derived(isFeed ? displayItems.filter((i) => !readSet.has(i.id)).length : 0);

// The header badge counts what needs attention (design D4): for a FEED the
// UNREAD count, `N+` at the `maxItems` budget, hidden entirely at zero (the calm
// "caught up" state); for a QUEUE the item count, `N+` at the `maxItems` cap so
// the cap is never silent.
const badge = $derived.by<string | undefined>(() => {
  if (isFeed) {
    if (unreadCount === 0) return undefined;
    return unreadCount > node.maxItems ? `${node.maxItems}+` : String(unreadCount);
  }
  if (displayItems.length >= node.maxItems) return `${node.maxItems}+`;
  if (displayItems.length > 0 || fetchState === 'ok') return String(displayItems.length);
  return undefined;
});

/** The quiet empty-state note — parity with a normal folder's "Empty — drag
 * tabs here". Shown in the SETTLED list when there is nothing to show. The
 * pending-first-fetch (ghost rows), signed-out (sign-in row), and error
 * (held items + "Couldn't reach …" note) states own their own copy, so this
 * stays out of their way. For a feed: "caught up" when all unread are read, "no
 * entries" when the feed is genuinely empty; for a queue: "nothing here". */
const emptyNote = $derived.by<string | undefined>(() => {
  if (fetchState === 'signed-out') return undefined;
  if (fetchState === 'needs-access') return undefined; // the grant prompt owns this state
  if (fetchState === 'pending' && displayItems.length === 0) return undefined;
  if (fetchState === 'error') return undefined; // the "Couldn't reach" note shows
  if (isFeed) {
    if (displayItems.length === 0) return 'No entries yet.';
    if (unreadCount === 0) return "You're all caught up.";
    return undefined;
  }
  return displayItems.length === 0 ? 'Nothing here right now.' : undefined;
});

/** The instance host for the sign-in / error phrasing (`new URL(...).host`,
 * port included — the engine's PAT key semantics). */
const host = $derived.by(() => {
  try {
    return new URL(node.baseUrl).host;
  } catch {
    return node.baseUrl;
  }
});

// Edit… drills the row menu (or the right-click menu) into the editor panel in
// place — RowMenu's drill-in API forwarded through FolderRow (design D9).
let editing = $state(false);
// The kebab menu's open state, bound through FolderRow so a confirmed edit
// can dismiss the WHOLE morph — not merely un-drill back to the action list
// (smart-folder-editor-dismissal; the editor's onDone contract).
let kebabMenuOpen = $state(false);

/** Editor confirm: close the drill-in AND whichever menu hosted it. */
function onEditorDone(): void {
  editing = false;
  kebabMenuOpen = false;
  menuOpen = false;
}

function refreshNow(): void {
  dispatch({ kind: 'refreshSmartFolder', payload: { spaceId, folderId: node.id } });
}
function deleteFolder(): void {
  dispatch({ kind: 'deleteSmartFolder', payload: { spaceId, folderId: node.id } });
}
function openItem(item: SmartFolderItem): void {
  // Identity only (smart-folder-item-bindings): the SW resolves the URL from
  // its own runtime slice — open-if-dormant, focus-if-bound.
  dispatch({
    kind: 'openSmartItem',
    payload: { spaceId, folderId: node.id, itemId: item.id, windowId },
  });
}
function openInstance(): void {
  dispatch({ kind: 'openUrl', payload: { url: node.baseUrl, windowId } });
}
// "Open all in a tab" (rss-connector design D6): the SW resolves the connector's
// listingUrl (the feed website / dashboard / JQL view) and opens it.
function openAll(): void {
  dispatch({ kind: 'openSmartFolderListing', payload: { spaceId, folderId: node.id, windowId } });
}
// Feed-only (design D3): mark every currently-listed item read; toggle the
// persisted hide-read preference.
function markAllRead(): void {
  dispatch({ kind: 'markAllSmartItemsRead', payload: { spaceId, folderId: node.id } });
}
function toggleHideRead(): void {
  dispatch({
    kind: 'setSmartFolderHideRead',
    payload: { spaceId, folderId: node.id, hideRead: !node.hideRead },
  });
}
// GitHub's signed-out fix is a token, not a session (github-connector D6):
// the row deep-links the options Connectors card via the extracted
// `openOptionsAt` — NOT `openUrl`, whose handler's scheme hardening drops the
// chrome-extension:// options URL (and stays untouched).
function openConnectorsSettings(): void {
  void openOptionsAt('#connectors');
}

// needs-access (least-privilege-permissions design D1/D3): the gesture-bound
// host request runs HERE (an extension-page surface), requesting the connector's
// required origins. On grant the SW's `onPermissionsChange` refetches the folder
// (needs-access → pending → ok), so this handler only requests — it never writes
// runtime state. A deny/dismiss leaves the prompt in place (reversible).
async function grantAccess(): Promise<void> {
  await requestHostPermissions(requiredOriginsForNode(node));
}

// Two-step Delete arm (smart-folder-delete-confirm): a tuned connector config
// (a specific JQL, an obscure feed URL) is no longer trivially recreatable, so
// Delete arms a danger "Delete — confirm" before dispatching — the FolderRow
// arm precedent. The same morphed `menuItems` feeds both surfaces, so they can
// never diverge; closing/Escaping either menu disarms (the `$effect` below).
let confirmingDelete = $state(false);

// One action vocabulary for both the kebab (RowMenuItem) and the right-click
// ContextMenu (MenuItem) — the shapes are structurally identical.
const menuItems = $derived<RowMenuItem[] & MenuItem[]>([
  { id: 'refresh', label: 'Refresh now', icon: 'rotate-cw', onSelect: refreshNow },
  {
    id: 'edit',
    label: 'Edit…',
    icon: 'pencil',
    keepOpen: true,
    submenu: true,
    onSelect: () => {
      confirmingDelete = false; // selecting another entry disarms a pending Delete
      editing = true;
    },
  },
  // "Open all in a tab" — every source (rss-connector design D6); pointer-,
  // keyboard-, and touch-reachable (also surfaced in the feed footer).
  { id: 'open-all', label: 'Open all in a tab', icon: 'arrow-up-right', onSelect: openAll },
  // "Mark all read" — feed sources only (design D3); less frequent + mildly
  // irreversible, so it lives in the kebab, not the footer.
  ...(isFeed
    ? [{ id: 'mark-all-read', label: 'Mark all read', icon: 'check-check', onSelect: markAllRead }]
    : []),
  { id: 'move-up', label: 'Move up', disabled: !canMoveUp, onSelect: onMoveUp },
  { id: 'move-down', label: 'Move down', disabled: !canMoveDown, onSelect: onMoveDown },
  // Two-step Delete: first activation arms the danger "Delete — confirm" and
  // keeps the menu open (`keepOpen`); only the second dispatches. The outcome is
  // unchanged — it destroys only the folder's own config and closes no tabs.
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
        keepOpen: true, // arm in place, keep the menu open
        onSelect: () => {
          confirmingDelete = true;
        },
      },
]);

// Right-click menu (one per smart row — the TabBoundaryEditor drill-in precedent).
let menuOpen = $state(false);
let menuX = $state(0);
let menuY = $state(0);
let menuAnchorEl = $state<HTMLElement | undefined>(undefined);

// Disarm a pending Delete whenever BOTH menu surfaces are closed (design D2), so
// a dismissed-and-reopened menu always lands on the unarmed "Delete", never a
// stale "Delete — confirm". The kebab forwards its close only via the
// `kebabMenuOpen` binding (no `onclose` reaches here), so this effect is its
// disarm path; the ContextMenu also clears the flag explicitly in `onclose`.
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

const instanceFavicon = $derived(faviconFor(node.baseUrl));

/** The row's full accessible phrase — colour is never the only carrier. For a
 * feed the unread/read state rides the name (design D8); for a queue the status
 * label does. */
function itemAria(item: SmartFolderItem, read: boolean): string {
  if (isFeed) return `${item.title} — ${read ? 'read' : 'unread'}`;
  return item.status ? `${item.title} — ${item.status.label}` : item.title;
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
    : `${node.name}, ${badge} ${isFeed ? 'unread' : 'items'}`}
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
  <!-- Result rows are activate-only — never drag sources (design D8). The
       container swallows pointerdown so a press on a result can't arm the
       host wrapper's smart-node drag. -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="children"
    data-testid="smart-children"
    onpointerdown={(e) => e.stopPropagation()}
  >
    {#if fetchState === 'pending' && displayItems.length === 0}
      <!-- TRUE first fetch (nothing ever shown): three static ghost rows — no
           shimmer, no strobe (D7). A reload with held items skips this branch. -->
      <div class="ghost" data-testid="smart-ghost-row" aria-hidden="true"></div>
      <div class="ghost" data-testid="smart-ghost-row" aria-hidden="true"></div>
      <div class="ghost" data-testid="smart-ghost-row" aria-hidden="true"></div>
    {:else if fetchState === 'signed-out'}
      {#if node.source === 'github'}
        <!-- Per-source signed-out flavor (github-connector D6): there is no
             session to sign in to — the fix is a token, so the row opens the
             options Connectors card via the sidebar's options deep-link. -->
        <button
          type="button"
          class="signin-row"
          data-testid="smart-signin-row"
          onclick={openConnectorsSettings}
        >
          Add a token in Settings → Connectors
        </button>
      {:else}
        <!-- GitLab AND Jira (jira-connector D8): both ride a browser session, so
             the row signs in to the instance and the next due poll heals. Keyed
             by exclusion — anything that is not `github` lands here. -->
        <button
          type="button"
          class="signin-row"
          data-testid="smart-signin-row"
          onclick={openInstance}
        >
          Sign in to {host}
        </button>
      {/if}
    {:else if fetchState === 'needs-access'}
      <!-- needs-access (least-privilege-permissions design D3): a calm muted
           prompt — NEVER a red error card. One key glyph, one muted line, and a
           primary "Grant access" button that requests the connector's required
           origins from this user gesture. On grant the SW's onPermissionsChange
           refetches (needs-access → pending → ok), no reload. -->
      <div class="needs-access" data-testid="smart-needs-access">
        <Icon name="key-round" size={16} />
        <span class="needs-access-copy">Lunma needs access to {host}</span>
        <Button variant="primary" onclick={grantAccess}>Grant access</Button>
      </div>
    {:else}
      {#each renderItems as item (item.id)}
        {@const bound = boundTabIdFor(item.id) !== undefined}
        {@const active = isActiveItem(item.id)}
        {@const read = isFeed && readSet.has(item.id)}
        {@const collapsed = isFeed && node.hideRead && read}
        <!-- A bound row's hover ✕ (the tab-row close affordance): an overlay
             sibling at the trailing slot — it takes the status dot's position
             only while the row is hovered (or the ✕ is keyboard-focused); the
             dot returns on mouse-out. The full status phrase stays in the
             Tooltip/ARIA label. Swallows pointerdown like the temp rows' ✕. -->
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
                onclick={() => closeBoundTab(item.id)}
              />
            </span>
          {/if}
        {/snippet}
        <!-- Hiding read collapses the read rows (height + opacity over
             --motion-base/--ease-emphasised); they stay mounted but inert so the
             collapse animates and the unread count is unaffected (design D3). -->
        <div
          class="row-wrap"
          class:bound
          class:active
          class:feed={isFeed}
          class:collapsed
          aria-hidden={collapsed}
          data-testid="smart-row-wrap"
          data-read={isFeed ? read : undefined}
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
                  aria-label={itemAria(item, false)}
                  onclick={() => openItem(item)}
                >
                  <span class="result-favicon" aria-hidden="true">
                    <Favicon src={instanceFavicon} size={16} />
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
              class:feed={isFeed}
              class:read
              tabindex={collapsed ? -1 : undefined}
              data-testid="smart-result-row"
              data-bound={bound}
              data-active={active}
              aria-label={itemAria(item, read)}
              onclick={() => openItem(item)}
            >
              <span class="result-favicon" aria-hidden="true">
                <Favicon src={instanceFavicon} size={16} />
              </span>
              <span class="result-title">{item.title}</span>
              <!-- The feed unread mark: a Space-hued dot that FADES (opacity-only)
                   when the item is read — it stays mounted so the "it resolves"
                   beat animates (design D8). -->
              {#if isFeed}
                <span class="dot unread" class:cleared={read} data-testid="smart-unread-dot"></span>
              {/if}
            </button>
          {/if}
          {@render closeSlot()}
        </div>
      {/each}
      {#if emptyNote}
        <!-- Empty-state parity with a normal folder's "Empty — drag tabs here"
             (a settled list with nothing to show). -->
        <div class="note-row" data-testid="smart-empty-note">{emptyNote}</div>
      {/if}
      {#if fetchState === 'error'}
        <div class="note-row" data-testid="smart-error-note">Couldn't reach {host}</div>
      {/if}
      {#if isFeed}
        <!-- Reading-controls footer (design D3/D6): low-ink ghost buttons. Left —
             the "Show recently read" peek (the drained queue's default hides
             read; this reveals them), absent when nothing is read. Right — open
             the feed's website in a tab. -->
        <div class="reading-controls" data-testid="smart-reading-controls">
          {#if readCount > 0}
            <Button
              variant="ghost"
              onclick={toggleHideRead}
              title={node.hideRead ? 'Show recently read' : 'Hide read again'}
            >
              {node.hideRead ? `Show ${readCount} read` : `Hide ${readCount} read`}
            </Button>
          {/if}
          <span class="controls-spacer"></span>
          <Button variant="ghost" onclick={openAll} title="Open the feed's website in a new tab">
            <span class="open-all-label">Open all</span>
            <Icon name="arrow-up-right" size={12} />
          </Button>
        </div>
      {/if}
    {/if}
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
    confirmingDelete = false; // closing / Escape disarms a pending Delete
  }}
/>

<style>
  /* Children share the folder-child content inset (PinnedTabs' `.children`):
   * padding (not margin) keeps each row's right edge aligned with top-level rows. */
  .children {
    padding-left: var(--space-4);
    display: flex;
    flex-direction: column;
    animation: smart-open var(--motion-base) var(--ease-emphasised);
  }

  /* Wraps a result row plus its hover ✕ overlay so the ✕ (a real button) never
   * nests inside the row button — the temp-row `.row-wrap` + close-slot shape. */
  .row-wrap {
    position: relative;
    margin: 0 0 var(--row-gap);
  }

  /* Result rows take the tab-row interaction vocabulary: hover wash, press
   * scale, the standard focus ring — over --motion-fast --ease-standard. */
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

  /* Bound + focused-in-this-window: the TabRow selection grammar — the same
   * --space-c-soft wash a selected tab row carries (hover keeps --surface-2,
   * so the two never read alike), title at semibold. No new fg/bg pairs. */
  .result-row.active {
    background: var(--space-c-soft);
    color: var(--text);
  }
  .result-row.active .result-title {
    font-weight: var(--weight-semibold);
  }

  /* The hover ✕ overlays the trailing slot (the dot's position). Quiet until
   * the row is hovered or the ✕ itself is keyboard-focused — the TabRow
   * trailing reveal, opacity-only so reduced motion needs no override. */
  .close-slot {
    position: absolute;
    top: 50%;
    /* Centre the ✕ glyph on the status dot it replaces. The dot (8px) sits at the
     * row's right padding edge, so its centre is `var(--space-2) + 4px` from the
     * row's right edge; anchoring the slot's right edge there and translating it
     * right by half its OWN width lands the (centred) glyph on that point
     * regardless of the IconButton box's exact footprint. The few px the
     * transparent box bleeds past the row sit in the list's `--list-pad` gutter
     * (overflow is left unset), never clipped. */
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
  /* While the ✕ holds the slot, the dot yields it (returns on mouse-out). */
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
  }

  .result-title {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    font: var(--weight-regular) var(--text-sm) / 1 var(--font-sans);
  }

  /* The ONE status glyph: an 8px dot painted from the semantic tokens —
   * identical at every tint level (status is semantic, not Space-hued). The
   * full phrase lives in the Tooltip + ARIA label, never as more visible
   * signal (the drift-dot precedent: feature-local, token-referencing CSS). */
  .dot {
    flex-shrink: 0;
    width: 8px;
    height: 8px;
    border-radius: var(--r-pill);
    /* Opacity-only swap with the hover ✕ (bound rows) — instant under reduced
     * motion via the fast tick, identical end state. */
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

  /* ── The reading nook (rss-connector) ───────────────────────────────────── */

  /* The feed unread mark: a filled dot in the Space hue (design D8) — immersive,
   * tying the unread signal to the Space's identity, NOT a notification red. It
   * stays mounted and FADES (opacity-only) over --motion-base when the item is
   * read (the "it resolves" beat). */
  .dot.unread {
    background: var(--space-c);
    transition: opacity var(--motion-base) var(--ease-standard);
  }
  .dot.unread.cleared {
    opacity: 0;
  }

  /* Unread vs read row grammar (design D8) — three carriers, never colour alone
   * (the row's accessible name states it too). Title ink + favicon opacity
   * settle over --motion-base so opening a row resolves it in place. */
  .result-row.feed .result-title {
    transition:
      color var(--motion-base) var(--ease-standard),
      font-weight var(--motion-base) var(--ease-standard);
  }
  .result-row.feed:not(.read) .result-title {
    color: var(--text);
    font-weight: var(--weight-medium);
  }
  /* `--text-muted` (not `--text-faint`): a read title stays meaningful content
   * and MUST clear WCAG-AA over the Space wash (asserted in contrast.test.ts). */
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

  /* Hide-read collapses the read rows (height + opacity over --motion-base /
   * --ease-emphasised — the smart-open feel); they stay mounted but inert. */
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

  /* Reading-controls footer: low-ink ghost buttons; the spacer pushes "Open all"
   * to the trailing edge. The ghost Button primitive owns the ink/hover wash. */
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

  /* First-fetch pending: static low-alpha bars at row height. */
  .ghost {
    height: var(--row-h);
    margin-bottom: var(--row-gap);
    border-radius: var(--r-md);
    background: color-mix(in oklch, var(--surface) 55%, transparent);
  }

  /* Signed-out: one quiet row; hover lifts the ink, the next poll heals. */
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

  /* needs-access: a calm muted prompt (least-privilege-permissions Visual
   * language) — NEVER a red error card. A key glyph + one muted line + the
   * primary Grant button (which owns its own tokens). Neutral foreground tokens
   * throughout, so a missing permission never reads as failure. */
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

  /* Error: last-known items hold; one dim note at the list end — never a card. */
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

  /* Item-set changes swap quietly — a --motion-fast opacity ease, no per-row
   * entrance theatre; reduced motion swaps instantly (identical end state). */
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
    .result-row {
      animation: none;
    }
    /* The unread→read resolve and the hide-read collapse swap instantly, with an
     * identical end state (design D3/D8). */
    .dot.unread,
    .row-wrap.feed,
    .result-row.feed .result-title,
    .result-row.feed .result-favicon {
      transition: none;
    }
  }
</style>
