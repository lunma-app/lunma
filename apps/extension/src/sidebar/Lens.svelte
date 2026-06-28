<script lang="ts">
import { hostLabel, tokenHelpUrl, tokenRequirement } from '../shared/account-ui';
import { PROVIDER_AUTH_METHODS } from '../shared/auth-method';
import { dispatch } from '../shared/bus';
import { requiredOriginsForConfig } from '../shared/connector-origins';
import { setAccountToken } from '../shared/connectors';
import { entityForItem, type LensEntity } from '../shared/lens-entity';
import { applyLensFilter } from '../shared/lens-filter';
import { sourceKey } from '../shared/lens-labels';
import { m } from '../shared/paraglide/messages';
import { requestHostPermissions } from '../shared/permissions';
import type {
  AppState,
  LensItem,
  LensSectionRuntime,
  LensSourceRef,
  PinNode,
  ResolvedLensSource,
  SidebarLocalState,
  SpaceId,
  TabId,
  WindowId,
} from '../shared/types';
import AccountConnectField from '../ui/AccountConnectField.svelte';
import BitsContextMenu from '../ui/BitsContextMenu.svelte';
import BottomSheet from '../ui/BottomSheet.svelte';
import Button from '../ui/Button.svelte';
import Favicon from '../ui/Favicon.svelte';
import { faviconFor } from '../ui/favicon';
import Icon from '../ui/Icon.svelte';
import IconButton from '../ui/IconButton.svelte';
import LensRow from '../ui/LensRow.svelte';
import type { MenuItem } from '../ui/menu-types';
import Tooltip from '../ui/Tooltip.svelte';
import LensEditor from './LensEditor.svelte';
import LensSectionHeader from './LensSectionHeader.svelte';
import { useStore } from './store-context.svelte';

/**
 * A smart folder in the pinned tree: the lens-header row chrome (`ui/LensRow`)
 * with live connector results as children, rendered in per-RESOLVED-SECTION
 * blocks. Each `sources[]` instance expands over its `queries[]` into one
 * section per filter (one section for an rss feed); when the folder has ≥2
 * resolved sections a `LensSectionHeader` divides them. Single-section folders
 * render identically to before (no section header, no regression).
 */

type LensNode = Extract<PinNode, { kind: 'lens' }>;

interface Props {
  windowId: WindowId;
  spaceId: SpaceId;
  node: LensNode;
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

// Active treatment ONLY while this lens's overview peek is the window's ACTIVE
// tab — mirrors a result row's `isActiveItem`. The peek RECORD persists after focus
// moves (so reopening focuses the same tab), but the header must not read "selected"
// once you switch to another tab.
const isActivePeek = $derived.by(() => {
  const peek = store.state.lensPeekByWindow[windowId];
  if (peek?.folderId !== node.id) return false;
  const live = store.state.liveTabsById[peek.tabId];
  return live !== undefined && live.windowId === windowId && live.active;
});

const spaceColor = $derived(store.state.spaces.find((s) => s.id === spaceId)?.color ?? 'gray');

// Per-section collapse read — `collapsedLensSectionsByWindow` is augmented onto
// the store by the sidebar (sidebar-local, never part of `AppState`), so read it
// through the same structural cast `PinnedTabs` uses for `expandedFoldersByWindow`.
// Absent entry ⇒ expanded.
function isSectionCollapsed(folderId: string, sk: string): boolean {
  const augmented = store.state as AppState & SidebarLocalState;
  return augmented.collapsedLensSectionsByWindow?.[windowId]?.[folderId]?.[sk] ?? false;
}

// Per-section "reveal recently read" peek — sidebar-local, per-window (same
// structural cast + absent ⇒ not revealed). The folder's `hideRead` is the
// drained resting default; revealing one feed's read rows here overrides it for
// THAT section only, so the peek never spills across feeds or windows.
function isSectionReadRevealed(folderId: string, sk: string): boolean {
  const augmented = store.state as AppState & SidebarLocalState;
  return augmented.revealedReadLensSectionsByWindow?.[windowId]?.[folderId]?.[sk] ?? false;
}

/** Effective hide-read for a feed section: the folder default, unless this
 * window has revealed that section's read rows. */
function sectionHidesRead(sk: string): boolean {
  return node.hideRead && !isSectionReadRevealed(node.id, sk);
}

// Resolve each account REFERENCE (connector-accounts) against `AppState.sources`
// and expand it over its `queries[]` into per-filter resolved sections (one
// section, no query, for an rss feed). The account supplies `source`/`baseUrl`/
// `name`/`sourceId`. A reference whose account was disconnected (dangling) is
// dropped here and surfaced via `danglingRefs` as a calm "account removed" row.
// The single derivation the render, badge, and identity all key on.
const accounts = $derived(store.state.sources);
const sections = $derived.by<ResolvedLensSource[]>(() => {
  const out: ResolvedLensSource[] = [];
  for (const ref of node.sources) {
    const account = accounts[ref.sourceId];
    if (!account) continue;
    const base = {
      source: account.provider,
      baseUrl: account.baseUrl,
      name: account.name,
      sourceId: account.id,
      lensKind: node.lensKind,
    };
    if (ref.queries.length === 0) {
      out.push({ ...base });
    } else {
      for (const query of ref.queries) {
        out.push({ ...base, query });
      }
    }
  }
  return out;
});

// References whose account is gone (disconnected) — rendered as a calm removed
// row (design D9), never a crash.
const danglingRefs = $derived<LensSourceRef[]>(
  node.sources.filter((ref) => accounts[ref.sourceId] === undefined),
);

// Whether any resolved section is a feed — gates the feed-only menu items.
const hasFeedSections = $derived(sections.some((cfg) => cfg.source === 'rss'));

/** Read items for the whole folder (feed sections only). */
const readSet = $derived(new Set(store.state.lensReadState[node.id] ?? []));

// Sectioned runtime — absent before the first fetch.
const folderRuntime = $derived(store.state.lenses[node.id]);

function sectionRuntime(cfg: ResolvedLensSource): LensSectionRuntime | undefined {
  return folderRuntime?.sections[sourceKey(cfg)];
}

const busy = $derived(
  !folderRuntime || Object.values(folderRuntime.sections).some((s) => s.state === 'pending'),
);

// Per-section held items: last-known set carried through SW restarts and
// in-flight reloads so rows stay activatable while loading.
let heldItemsBySection = $state<Record<string, LensItem[]>>({});
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
let lastSeenById = $state<Record<string, LensItem>>({});
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

const folderBindings = $derived(store.state.lensItemBindings[node.id] ?? {});

/** Live tab bound to this item in this window, by namespaced id. */
function boundTabIdFor(cfg: ResolvedLensSource, item: LensItem): TabId | undefined {
  return folderBindings[`${sourceKey(cfg)}:${item.id}`]?.[windowId]?.tabId;
}

function isActiveItem(cfg: ResolvedLensSource, item: LensItem): boolean {
  const tabId = boundTabIdFor(cfg, item);
  if (tabId === undefined) return false;
  const live = store.state.liveTabsById[tabId];
  return live !== undefined && live.windowId === windowId && live.active;
}

function closeBoundTab(cfg: ResolvedLensSource, item: LensItem): void {
  const tabId = boundTabIdFor(cfg, item);
  if (tabId !== undefined) dispatch({ kind: 'closeTab', payload: { tabId } });
}

// Dismiss an (unopened) feed item: mark it read so it drains out of the unread
// list — the read-it-later gesture. `itemId` is the namespaced `sourceKey:nativeId`
// the read-state slice keys on (same shape openLensItem marks read SW-side).
function dismissFeedItem(cfg: ResolvedLensSource, item: LensItem): void {
  dispatch({
    kind: 'markLensItemRead',
    payload: { folderId: node.id, itemId: `${sourceKey(cfg)}:${item.id}` },
  });
}

/** Live items + held items during reloads + binding-held rows per section. */
// Sidebar grouping: changes (PRs/MRs) before tickets (issues), then articles, then
// generic — so a mixed queue section reads as two clean blocks, never interleaved.
const ENTITY_RANK: Record<LensEntity, number> = { change: 0, ticket: 1, article: 2, generic: 3 };

// Per-item leading glyph for a code lens row: a PR/MR shows a pull-request mark, an
// issue the issue dot — so a (sorted) mixed section reads apart at a glance. Feeds /
// generic items return null and keep their source favicon.
function itemGlyph(item: LensItem): string | null {
  const entity = entityForItem(item);
  if (entity === 'change') return 'git-pull-request';
  if (entity === 'ticket') return 'circle-dot';
  return null;
}

function displayItemsForSection(cfg: ResolvedLensSource): LensItem[] {
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
  const held: LensItem[] = [];
  for (const [namespacedId, slots] of Object.entries(folderBindings)) {
    if (!namespacedId.startsWith(`${sk}:`)) continue;
    const nativeId = namespacedId.slice(sk.length + 1);
    if (slots[windowId] === undefined || present.has(nativeId)) continue;
    const seen = lastSeenById[namespacedId];
    if (seen) held.push(seen);
  }
  const ordered = held.length === 0 ? base : [...base, ...held];
  // Apply the persisted lens filter before sorting and before feed windowing so
  // maxItems counts only surviving rows (D9).
  const host = (() => {
    try {
      return new URL(cfg.baseUrl).host;
    } catch {
      return cfg.baseUrl;
    }
  })();
  const filterResult = applyLensFilter(
    ordered.map((item) => ({ item, host })),
    node.filter ?? {},
  );
  const filtered = filterResult.map((r) => r.item);
  // Stable sort by entity → changes group ahead of tickets; each connector's order
  // holds within a type. Single-entity sections (rss → article, jira → ticket) are
  // a no-op, so feed windowing/ordering downstream is unaffected.
  return [...filtered].sort(
    (a, b) => ENTITY_RANK[entityForItem(a)] - ENTITY_RANK[entityForItem(b)],
  );
}

/** Feed windowing: newest N unread + interleaved read rows (identical to the
 * single-source draining-queue model, applied per section). */
function feedWindowForSection(cfg: ResolvedLensSource, secItems: LensItem[]): LensItem[] {
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
  cfg: ResolvedLensSource,
  renderItems: LensItem[],
  secItems: LensItem[],
  secState: LensSectionRuntime['state'],
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
    if (secItems.length === 0) return m.sidebar_lensNoEntriesYet();
    const unreadCount = secItems.filter((i) => !readSet.has(`${sk}:${i.id}`)).length;
    if (unreadCount === 0) return m.sidebar_lensAllCaughtUp();
    return undefined;
  }
  return secItems.length === 0 ? m.sidebar_lensNothingHere() : undefined;
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

const isFilterActive = $derived(
  (node.filter?.entities?.length ?? 0) > 0 ||
    (node.filter?.repos?.length ?? 0) > 0 ||
    (node.filter?.projects?.length ?? 0) > 0,
);

function openItem(cfg: ResolvedLensSource, item: LensItem): void {
  dispatch({
    kind: 'openLensItem',
    payload: { spaceId, folderId: node.id, itemId: `${sourceKey(cfg)}:${item.id}`, windowId },
  });
}

function openAll(): void {
  dispatch({ kind: 'openLensListing', payload: { spaceId, folderId: node.id, windowId } });
}

// Open the folder's full-page view (smart-folder-page). The row body + chevron
// keep normal expand/collapse; only the header's "open as page" icon and the
// kebab item open the page (design D3).
function openPage(): void {
  dispatch({ kind: 'openLensPage', payload: { spaceId, folderId: node.id, windowId } });
}

function markAllRead(): void {
  dispatch({ kind: 'markAllLensItemsRead', payload: { spaceId, folderId: node.id } });
}

// Toggle THIS section's read-rows peek (sidebar-local, per-window) — never the
// folder-wide `hideRead`, so revealing one feed's read rows leaves the others
// drained.
function toggleSectionRead(sk: string): void {
  store.setLensSectionRevealRead(windowId, node.id, sk, !isSectionReadRevealed(node.id, sk));
}

function refreshNow(): void {
  dispatch({ kind: 'refreshLens', payload: { spaceId, folderId: node.id } });
}

function deleteFolder(): void {
  dispatch({ kind: 'deleteLens', payload: { spaceId, folderId: node.id } });
}

// Whether a provider can ride the browser session (gitlab/jira) — drives the
// method-aware signed-out lane (sign-in row vs inline token reconnect).
function isSessionCapable(cfg: ResolvedLensSource): boolean {
  return PROVIDER_AUTH_METHODS[cfg.source].includes('session');
}

// Sections where the user opened the optional "add a token" reveal on a
// session-capable signed-out lane, keyed by sourceKey.
let tokenRevealOpen = $state<Record<string, boolean>>({});
// Sections where a reconnect was attempted but the next fetch still came back
// signed-out (a bad token) — keyed by sourceKey; drives the bad-token error.
let reconnectAttempted = $state<Record<string, boolean>>({});

// Clear the bad-token flag for any section that has healed to `ok`.
$effect(() => {
  for (const [sk, sec] of Object.entries(folderRuntime?.sections ?? {})) {
    if (sec.state === 'ok' && reconnectAttempted[sk]) {
      const next = { ...reconnectAttempted };
      delete next[sk];
      reconnectAttempted = next;
    }
  }
});

/** Write a per-source token inline (connector-accounts) and refetch the section
 * without navigating to Options. */
function reconnect(cfg: ResolvedLensSource, token: string): void {
  reconnectAttempted = { ...reconnectAttempted, [sourceKey(cfg)]: true };
  void setAccountToken(cfg.sourceId, token).then(() =>
    dispatch({ kind: 'refreshLens', payload: { spaceId, folderId: node.id } }),
  );
}

function itemAria(cfg: ResolvedLensSource, item: LensItem, read: boolean): string {
  if (cfg.source === 'rss') return `${item.title} — ${read ? 'read' : 'unread'}`;
  return item.status ? `${item.title} — ${item.status.label}` : item.title;
}

// The "Edit lens" editor now lives in a `BottomSheet` (the per-consumer drill-in
// boundary): the kebab/right-click "Edit…" item opens the sheet, which renders
// the existing `LensEditor` unchanged. Sheet open/close is owned here; the
// editor's `onDone` (Save/Create or Cancel) closes the sheet and the kebab.
let sheetOpen = $state(false);

function onEditorDone(): void {
  sheetOpen = false;
}

let confirmingDelete = $state(false);

const menuItems = $derived<MenuItem[]>([
  { id: 'refresh', label: m.sidebar_lensRefresh(), icon: 'rotate-cw', onSelect: refreshNow },
  {
    id: 'edit',
    label: m.sidebar_lensEdit(),
    icon: 'pencil',
    onSelect: () => {
      confirmingDelete = false;
      sheetOpen = true;
    },
  },
  { id: 'open-page', label: m.sidebar_lensOpenAsPage(), icon: 'external-link', onSelect: openPage },
  { id: 'open-all', label: m.sidebar_lensOpenAll(), icon: 'arrow-up-right', onSelect: openAll },
  ...(hasFeedSections
    ? [
        {
          id: 'mark-all-read',
          label: m.sidebar_lensMarkAllRead(),
          icon: 'check-check',
          onSelect: markAllRead,
        },
      ]
    : []),
  {
    id: 'move-up',
    label: m.sidebar_lensMoveUp(),
    icon: 'arrow-up',
    disabled: !canMoveUp,
    onSelect: onMoveUp,
  },
  {
    id: 'move-down',
    label: m.sidebar_lensMoveDown(),
    icon: 'arrow-down',
    disabled: !canMoveDown,
    onSelect: onMoveDown,
  },
  confirmingDelete
    ? {
        id: 'delete',
        label: m.sidebar_lensDeleteConfirm(),
        icon: 'trash-2',
        danger: true,
        onSelect: () => {
          confirmingDelete = false;
          deleteFolder();
        },
      }
    : {
        id: 'delete',
        label: m.sidebar_lensDelete(),
        icon: 'trash-2',
        danger: true,
        keepOpen: true,
        onSelect: () => {
          confirmingDelete = true;
        },
      },
]);

// A pending two-step Delete is disarmed when the right-click menu closes, via
// `BitsContextMenu`'s `onOpenChange` below (the lens row carries no kebab).

/**
 * Retained for the host (PinnedTabs forwards the lens row's `contextmenu`, and the
 * test harness binds it) so its forwarding wiring keeps type-checking. The
 * right-click menu is now owned by `BitsContextMenu` wrapping the folder row
 * below — bits-ui captures the `contextmenu` on the row itself, anchors at the
 * cursor, and handles keyboard invocation (menu key / Shift+F10) + dismissal — so
 * this no longer opens anything itself.
 */
export function onContextMenu(_e: MouseEvent): void {
  // Intentionally empty: bits-ui's `ContextMenu.Trigger` (below) owns the
  // right-click. This kept-for-compat export is a no-op.
}
</script>

<!-- Right-click is owned by bits-ui: the trigger props spread onto a wrapper that
     contains the whole folder row. It sits INSIDE Lens, nested under the
     `.row-wrap` PinnedTabs measures for the unit drag — so bits-ui adds only its
     `contextmenu`/ARIA handlers and never disturbs that measured element's
     identity. `onOpenChange` resets a pending Delete confirm when the menu closes
     (the legacy `onclose` behaviour). -->
<BitsContextMenu
  items={menuItems}
  label={m.sidebar_smartFolderActions()}
  testid="smart-folder-menu"
  onOpenChange={(open) => {
    if (!open) confirmingDelete = false;
  }}
>
  {#snippet children(menuProps)}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div {...menuProps} class="lens-row-context">
      <LensRow
        name={node.name}
        icon={node.icon}
        color={spaceColor}
        active={isActivePeek}
        {expanded}
        {onToggle}
        onOpenPage={openPage}
        openPageLabel={badge === undefined
          ? m.sidebar_lensOpenPageLabel({ name: node.name })
          : m.sidebar_lensOpenPageLabelBadge({
              name: node.name,
              badge,
              kind: hasFeedSections ? m.sidebar_lensKindUnread() : m.sidebar_lensKindItems(),
            })}
        {badge}
        {busy}
      />
    </div>
  {/snippet}
</BitsContextMenu>

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
      {@const bodyId = `lens-section-body-${node.id}-${sourceKey(cfg)}`}

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
        <LensSectionHeader
          {cfg}
          count={sectionCount}
          {collapsed}
          first={sectionIndex === 0}
          controlsId={bodyId}
          onToggle={() =>
            store.setLensSectionCollapsed(windowId, node.id, sourceKey(cfg), !collapsed)}
        />
      {/if}

      {#if !collapsed}
      <div class="section-body" id={bodyId}>
      {#if secState === 'pending' && secItems.length === 0}
        <div class="ghost" data-testid="smart-ghost-row" aria-hidden="true"></div>
        <div class="ghost" data-testid="smart-ghost-row" aria-hidden="true"></div>
        <div class="ghost" data-testid="smart-ghost-row" aria-hidden="true"></div>
      {:else if secState === 'signed-out'}
        {@const secHost = hostLabel(cfg.baseUrl)}
        {#if isSessionCapable(cfg)}
          <!-- Session-capable (gitlab/jira): the next poll heals after sign-in;
               offer an optional inline "add a token" upgrade. -->
          <button
            type="button"
            class="signin-row"
            data-testid="smart-signin-row"
            onclick={() => dispatch({ kind: 'openUrl', payload: { url: cfg.baseUrl, windowId } })}
          >
            {m.sidebar_lensSignInTo({ host: secHost })}
          </button>
          {#if tokenRevealOpen[sourceKey(cfg)]}
            <div class="reconnect-field" data-testid="smart-reconnect-field">
              <AccountConnectField
                host={secHost}
                requirement="optional"
                hasToken={false}
                helpUrl={tokenHelpUrl(cfg.source, cfg.baseUrl)}
                onConnect={(t) => reconnect(cfg, t)}
              />
            </div>
          {:else}
            <Button
              variant="ghost"
              size="sm"
              testid="smart-add-token-toggle"
              onclick={() => {
                tokenRevealOpen = { ...tokenRevealOpen, [sourceKey(cfg)]: true };
              }}
            >
              {m.sidebar_lensAddToken()}
            </Button>
          {/if}
        {:else}
          <!-- pat-only (github) or a bad token: inline reconnect that writes the
               per-source token and refetches — no navigation to Options. -->
          <div class="reconnect-field" data-testid="smart-reconnect-field">
            <p class="reconnect-copy">{m.sidebar_lensReconnect({ host: secHost })}</p>
            <AccountConnectField
              host={secHost}
              requirement={tokenRequirement(cfg.source) === 'optional' ? 'optional' : 'required'}
              hasToken={false}
              helpUrl={tokenHelpUrl(cfg.source, cfg.baseUrl)}
              error={reconnectAttempted[sourceKey(cfg)]
                ? m.sidebar_lensTokenError()
                : undefined}
              onConnect={(t) => reconnect(cfg, t)}
            />
          </div>
        {/if}
      {:else if secState === 'needs-access'}
        {@const secHost = (() => { try { return new URL(cfg.baseUrl).host; } catch { return cfg.baseUrl; } })()}
        <div class="needs-access" data-testid="smart-needs-access">
          <Icon name="key-round" size={16} />
          <span class="needs-access-copy">{m.sidebar_lensNeedsAccess({ host: secHost })}</span>
          <Button variant="primary" onclick={() => void requestHostPermissions(requiredOriginsForConfig(cfg))}>{m.sidebar_lensGrantAccess()}</Button>
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
          {@const glyph = itemGlyph(item)}

          {#snippet closeSlot()}
            {#if bound || isSectionFeed}
              {@const dismiss = bound ? m.sidebar_lensClose() : m.sidebar_lensDismiss()}
              <!-- svelte-ignore a11y_no_static_element_interactions -->
              <span class="close-slot" onpointerdown={(e) => e.stopPropagation()}>
                <IconButton
                  icon="x"
                  ariaLabel={dismiss}
                  title={dismiss}
                  size={14}
                  testid="smart-close"
                  onclick={() => (bound ? closeBoundTab(cfg, item) : dismissFeedItem(cfg, item))}
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
                    data-testid="lens-result-row"
                    data-bound={bound}
                    data-active={active}
                    aria-label={itemAria(cfg, item, false)}
                    onclick={() => openItem(cfg, item)}
                  >
                    <span class="result-favicon" data-tone={status.tone} aria-hidden="true">
                      {#if glyph}<Icon name={glyph} size={14} />{:else}<Favicon src={itemFavSrc} size={14} />{/if}
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
                data-testid="lens-result-row"
                data-bound={bound}
                data-active={active}
                aria-label={itemAria(cfg, item, read)}
                onclick={() => openItem(cfg, item)}
              >
                <span class="result-favicon" aria-hidden="true">
                  {#if glyph}<Icon name={glyph} size={14} />{:else}<Favicon src={itemFavSrc} size={14} />{/if}
                </span>
                <span class="result-title">{item.title}</span>
              </button>
            {/if}
            {@render closeSlot()}
          </div>
        {/each}

        {#if emptyNote}
          <div class="note-row" data-testid="smart-empty-note">{emptyNote}</div>
        {/if}
        {#if isFilterActive}
          <button
            class="filtered-note"
            type="button"
            data-testid="smart-filtered-note"
            onclick={openPage}
            title={m.sidebar_lensFiltered()}
          >
            <Icon name="filter" size={11} />
            <span>{m.sidebar_lensFilteredBadge()}</span>
          </button>
        {/if}
        {#if secState === 'error'}
          {@const secHost = (() => { try { return new URL(cfg.baseUrl).host; } catch { return cfg.baseUrl; } })()}
          <div class="note-row" data-testid="smart-error-note">{m.sidebar_lensCouldNotReach({ host: secHost })}</div>
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
                {hidesRead ? m.sidebar_lensShowRead({ count: readCount }) : m.sidebar_lensHideRead({ count: readCount })}
              </Button>
            {/if}
            <span class="controls-spacer"></span>
            <Button
              variant="ghost"
              size="sm"
              onclick={openAll}
              title={m.sidebar_lensOpenFeedSite()}
            >
              <span class="open-all-label">{m.sidebar_lensOpenAllFeed()}</span>
              <Icon name="arrow-up-right" size={12} />
            </Button>
          </div>
        {/if}
      {/if}
      </div>
      {/if}
    {/each}

    {#each danglingRefs as ref (ref.sourceId)}
      <div class="removed-row" data-testid="smart-account-removed">
        <Icon name="unplug" size={16} />
        <span class="removed-copy">{m.sidebar_lensAccountRemoved()}</span>
      </div>
    {/each}
  </div>
{/if}

<!-- The "Edit sources…"/LensEditor drill-in is an EDITOR, not a menu: it opens in
     a `BottomSheet` scoped to the sidebar panel. The existing `LensEditor` is
     rendered unchanged inside; its `onDone` (Save/Create or Cancel) closes the
     sheet (and the kebab). The sheet's own scrim/✕/Esc dismissal routes through
     `onClose`. -->
<BottomSheet
  open={sheetOpen}
  portalTo=".sidebar"
  title={m.sidebar_editLensSheet()}
  onClose={() => {
    sheetOpen = false;
  }}
>
  {#snippet children()}
    <LensEditor {spaceId} {windowId} {node} onDone={onEditorDone} />
  {/snippet}
</BottomSheet>

<style>
  /* The bits-ui right-click trigger wrapper. `display: contents` makes it
   * layout-transparent — it generates no box, so the folder row keeps its exact
   * geometry and PinnedTabs' measured `.row-wrap` (the parent, used for the unit
   * drag) is unaffected — while still carrying bits-ui's `contextmenu`/ARIA
   * handlers, which fire for events bubbling up from the row inside it. */
  .lens-row-context {
    display: contents;
  }

  /* The expand body. The comp insets result rows with their own left padding
   * (`padding-left: 20px`) rather than indenting the container, so the wrapper
   * stays full-width and the drag geometry reads clean row rects. */
  .children {
    display: flex;
    flex-direction: column;
    padding: var(--space-1) 0 var(--space-2);
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

  /* Result row (comp §5b/5c result rows). The leading 24px state-coloured tile
   * carries the source disc; the title leads; a hover-revealed dismiss + the
   * status/unread dot sit in the trailing slot. The left inset (`--space-5`)
   * lines the tiles up under the lens header's 26px icon tile. Height stays on
   * `--row-h` so the drag controller reads consistent row rects. */
  .result-row {
    appearance: none;
    border: 0;
    margin: 0;
    width: 100%;
    box-sizing: border-box;
    min-height: var(--row-h);
    /* Right inset --space-3 (12px) so the trailing unread/status dot right-aligns
       with the kebab GLYPHS on the headers above (kebab button at 8px row-pad,
       icon inset ~4px → glyph at ~12px). Keeps the whole trailing column plumb. */
    padding: var(--space-1) var(--space-3) var(--space-1) var(--space-5);
    display: flex;
    align-items: center;
    gap: var(--space-2);
    background: transparent;
    color: var(--text);
    border-radius: var(--r-lg);
    cursor: pointer;
    text-align: left;
    animation: smart-item-in var(--motion-fast) var(--ease-standard);
    transition:
      background var(--motion-fast) var(--ease-standard),
      box-shadow var(--motion-fast) var(--ease-standard),
      transform var(--motion-fast) var(--ease-standard);
  }
  /* Hover mirrors the active wash (`--space-c-soft`) without the ring; `.result-row.active`
     (later in source) keeps its ring while hovered. */
  .result-row:hover {
    background: var(--space-c-soft);
  }
  .result-row:active {
    transform: scale(var(--press-scale));
  }
  .result-row:focus-visible {
    outline: var(--focus-width) solid var(--focus-color);
    outline-offset: var(--focus-offset);
  }

  /* Active = the Space-soft wash + a Space-line inset ring (comp ACTIVE_STYLE:
   * `background:var(--space-soft);box-shadow:inset 0 0 0 1px var(--space-line)`). */
  .result-row.active {
    background: var(--space-c-soft);
    box-shadow: inset 0 0 0 1px var(--space-c-dim);
    color: var(--text);
  }
  .result-row.active .result-title {
    font-weight: var(--weight-semibold);
  }

  /* Hover-revealed dismiss in the trailing slot (comp `.sb-kebab`: invisible at
   * rest, revealed on row hover / focus-within). Sits over the dot's slot. */
  .close-slot {
    position: absolute;
    top: 50%;
    /* Right-align the dismiss glyph to the trailing column (--space-3) — the same
       right edge as the status dot, the feed/lens counts, and the kebab glyphs
       above — so every trailing element shares one column. The 14px glyph sits
       centred in the --icon-btn box, so back off by that centring padding
       (--icon-btn / 4 = 7px) to land the glyph's right edge on --space-3. */
    right: calc(var(--space-3) - var(--icon-btn) / 4);
    translate: 0 -50%;
    display: inline-flex;
    opacity: 0;
    pointer-events: none;
    transition: opacity var(--motion-fast) var(--ease-standard);
  }
  .row-wrap:hover .close-slot,
  .close-slot:focus-within,
  /* A SELECTED (active) row keeps its close button persistently visible —
     selecting a tab must never hide the close (otherwise it takes a hover to
     dismiss the open item). */
  .row-wrap:has(.result-row.active) .close-slot {
    opacity: 1;
    pointer-events: auto;
  }
  .row-wrap.bound:hover .dot,
  .row-wrap.bound:has(.close-slot:focus-within) .dot,
  /* Hide the status/unread dot under the persistently-shown close on an active row. */
  .row-wrap:has(.result-row.active) .dot {
    opacity: 0;
  }

  /* State-coloured leading tile (comp §5b: 24px rounded tile, `background:iconBg;
   * color:iconColor` per STATE). The source disc sits inside; the tone of the
   * tint comes from `data-tone` (status rows) and defaults to the neutral
   * `--surface-2` wash (feed rows + the no-pipeline / draft case). */
  .result-favicon {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: var(--r-sm);
    background: var(--surface-2);
    color: var(--text-muted);
    transition:
      background var(--motion-fast) var(--ease-standard),
      opacity var(--motion-fast) var(--ease-standard);
  }
  .result-favicon[data-tone='ok'] {
    background: color-mix(in oklch, var(--success) 16%, transparent);
    color: var(--success);
  }
  .result-favicon[data-tone='fail'] {
    background: color-mix(in oklch, var(--danger) 16%, transparent);
    color: var(--danger);
  }
  .result-favicon[data-tone='warn'] {
    background: color-mix(in oklch, var(--warning) 16%, transparent);
    color: var(--warning);
  }
  .result-favicon[data-tone='pending'] {
    background: color-mix(in oklch, var(--info) 16%, transparent);
    color: var(--info);
  }

  .result-title {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    font: var(--weight-regular) var(--text-sm) / 1.3 var(--font-sans);
    color: var(--text);
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

  /* Feed rows have no trailing dot (read/unread is carried by title weight + colour
     + favicon dimming — a status dot would be redundant on a feed). Reserve the
     trailing slot anyway so the hover-revealed dismiss never overlaps the title;
     status rows reserve it via their in-flow dot. */
  .result-row.feed {
    padding-right: calc(var(--space-3) + 16px);
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
    padding: var(--space-1) var(--space-2) 0 var(--space-5);
    margin-top: var(--space-1);
  }
  .controls-spacer {
    flex: 1 1 auto;
  }

  .ghost {
    height: var(--row-h);
    margin-bottom: var(--row-gap);
    border-radius: var(--r-lg);
    background: color-mix(in oklch, var(--surface) 55%, transparent);
  }

  .signin-row {
    appearance: none;
    border: 0;
    margin: 0 0 var(--row-gap);
    width: 100%;
    box-sizing: border-box;
    min-height: var(--row-h);
    padding: var(--space-1) var(--space-2) var(--space-1) var(--space-5);
    display: flex;
    align-items: center;
    background: transparent;
    color: var(--text-muted);
    border-radius: var(--r-lg);
    cursor: pointer;
    text-align: left;
    font: var(--weight-regular) var(--text-sm) / 1.3 var(--font-sans);
    transition:
      background var(--motion-fast) var(--ease-standard),
      color var(--motion-fast) var(--ease-standard);
  }
  .signin-row:hover {
    background: var(--hover);
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
    padding: var(--space-2) var(--space-2) var(--space-2) var(--space-5);
    color: var(--text-muted);
  }
  .needs-access-copy {
    flex: 1;
    min-width: 0;
    color: var(--text-muted);
    font: var(--weight-regular) var(--text-sm) / 1.3 var(--font-sans);
  }

  /* Inline reconnect (connector-accounts) — the per-section token field that
   * heals a signed-out lane without leaving the sidebar. */
  .reconnect-field {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    margin: 0 0 var(--row-gap);
    padding: var(--space-2) var(--space-2) var(--space-2) var(--space-5);
  }
  .reconnect-copy {
    margin: 0;
    color: var(--text-muted);
    font: var(--weight-medium) var(--text-sm) / 1.2 var(--font-sans);
  }

  /* Dangling reference (design D9) — a calm "account removed" row, never an error
   * card. */
  .removed-row {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin: 0 0 var(--row-gap);
    padding: var(--space-2) var(--space-2) var(--space-2) var(--space-5);
    color: var(--text-muted);
  }
  .removed-copy {
    flex: 1;
    min-width: 0;
    color: var(--text-muted);
    font: var(--weight-regular) var(--text-sm) / 1.3 var(--font-sans);
  }

  /* Empty/error note (comp §5b: `padding:2px 10px 6px 20px;font-size:12px;
   * color:var(--text-faint);font-style:italic`). */
  .note-row {
    padding: var(--space-1) var(--space-2) var(--space-1) var(--space-5);
    color: var(--text-faint);
    font: var(--weight-regular) var(--text-sm) / 1.3 var(--font-sans);
    font-style: italic;
  }

  /* Filtered affordance — a muted funnel + label that taps through to the lens
   * overview so the user can change the filter. Rendered only when the lens has
   * a non-empty persisted filter (D-visual, design). */
  .filtered-note {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-1) var(--space-2) var(--space-1) var(--space-5);
    width: 100%;
    border: 0;
    background: transparent;
    color: var(--text-faint);
    font: var(--weight-regular) var(--text-xs) / 1 var(--font-sans);
    cursor: pointer;
    text-align: left;
    transition: color var(--motion-fast) var(--ease-standard);
  }
  .filtered-note:hover {
    color: var(--text-muted);
  }
  .filtered-note:focus-visible {
    outline: var(--focus-width) solid var(--focus-color);
    outline-offset: var(--focus-offset);
  }
  @media (prefers-reduced-motion: reduce) {
    .filtered-note { transition: none; }
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
    .row-wrap.feed,
    .result-row.feed .result-title,
    .result-favicon {
      transition: none;
    }
  }
</style>
