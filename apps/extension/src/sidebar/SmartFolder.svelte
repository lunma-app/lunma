<script lang="ts">
import { dispatch } from '../shared/bus';
import type { IconName } from '../shared/icon-names';
import type { PinNode, SmartFolderItem, SpaceColor, SpaceId, WindowId } from '../shared/types';
import ContextMenu from '../ui/ContextMenu.svelte';
import Favicon from '../ui/Favicon.svelte';
import FolderRow from '../ui/FolderRow.svelte';
import { faviconFor } from '../ui/favicon';
import type { MenuItem } from '../ui/menu-types';
import type { RowMenuItem } from '../ui/RowMenu.svelte';
import Tooltip from '../ui/Tooltip.svelte';
import { openOptionsAt } from './open-options';
import SmartFolderEditor from './SmartFolderEditor.svelte';
import { useStore } from './store-context.svelte';

/**
 * A smart folder in the pinned tree (smart-folders, design D8): the same
 * folder-row chrome (`ui/FolderRow`) with live connector results as children.
 * Results are link-shaped, NOT tab-shaped — activate-only rows dispatching the
 * existing `openUrl`; no close, no drag, no bound/drift semantics. The folder
 * NODE itself drags/reorders among pins; its menu carries Refresh now · Edit…
 * · Move up/Move down · Delete (no two-step confirm — the config is
 * recreatable in seconds and deleting closes no tabs).
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
const spaceColor = $derived(
  (store.state.spaces.find((s) => s.id === spaceId)?.color ?? 'gray') as SpaceColor,
);

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

/** What the expanded list renders: live items, else the held set during an
 * in-flight reload (`pending`) or an outage (`error`). */
const displayItems = $derived.by<SmartFolderItem[]>(() => {
  if (items.length > 0) return items;
  if (fetchState === 'pending' || fetchState === 'error') return heldItems;
  return [];
});

// Quiet item-count badge; `20+` at the cap so the cap is never silent. Hidden
// while nothing meaningful is countable (true first pending, signed-out).
const badge = $derived.by<string | undefined>(() => {
  if (displayItems.length >= 20) return '20+';
  if (displayItems.length > 0 || fetchState === 'ok') return String(displayItems.length);
  return undefined;
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
  dispatch({ kind: 'openUrl', payload: { url: item.url, windowId } });
}
function openInstance(): void {
  dispatch({ kind: 'openUrl', payload: { url: node.baseUrl, windowId } });
}
// GitHub's signed-out fix is a token, not a session (github-connector D6):
// the row deep-links the options Connectors card via the extracted
// `openOptionsAt` — NOT `openUrl`, whose handler's scheme hardening drops the
// chrome-extension:// options URL (and stays untouched).
function openConnectorsSettings(): void {
  void openOptionsAt('#connectors');
}

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
      editing = true;
    },
  },
  { id: 'move-up', label: 'Move up', disabled: !canMoveUp, onSelect: onMoveUp },
  { id: 'move-down', label: 'Move down', disabled: !canMoveDown, onSelect: onMoveDown },
  // No two-step confirm: deleting destroys only its own recreatable config,
  // closes no tabs, loses no user content (design D7) — unlike deleteSavedTab.
  { id: 'delete', label: 'Delete', icon: 'trash-2', danger: true, onSelect: deleteFolder },
]);

// Right-click menu (one per smart row — the TabBoundaryEditor drill-in precedent).
let menuOpen = $state(false);
let menuX = $state(0);
let menuY = $state(0);
let menuAnchorEl = $state<HTMLElement | undefined>(undefined);

export function onContextMenu(e: MouseEvent): void {
  e.preventDefault();
  menuX = e.clientX;
  menuY = e.clientY;
  menuAnchorEl = e.currentTarget as HTMLElement;
  editing = false;
  menuOpen = true;
}

const instanceFavicon = $derived(faviconFor(node.baseUrl));

/** The row's full accessible phrase — colour is never the only carrier. */
function itemAria(item: SmartFolderItem): string {
  return item.status ? `${item.title} — ${item.status.label}` : item.title;
}
</script>

<FolderRow
  name={node.name}
  icon={node.icon as IconName}
  color={spaceColor}
  {expanded}
  {onToggle}
  label={badge === undefined ? node.name : `${node.name}, ${badge} items`}
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
        <button
          type="button"
          class="signin-row"
          data-testid="smart-signin-row"
          onclick={openInstance}
        >
          Sign in to {host}
        </button>
      {/if}
    {:else}
      {#each displayItems as item (item.id)}
        {#if item.status}
          {@const status = item.status}
          <Tooltip label={status.label}>
            {#snippet children(props)}
              <button
                {...props}
                type="button"
                class="result-row"
                data-testid="smart-result-row"
                aria-label={itemAria(item)}
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
            data-testid="smart-result-row"
            aria-label={itemAria(item)}
            onclick={() => openItem(item)}
          >
            <span class="result-favicon" aria-hidden="true">
              <Favicon src={instanceFavicon} size={16} />
            </span>
            <span class="result-title">{item.title}</span>
          </button>
        {/if}
      {/each}
      {#if fetchState === 'error'}
        <div class="note-row" data-testid="smart-error-note">Couldn't reach {host}</div>
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

  /* Result rows take the tab-row interaction vocabulary: hover wash, press
   * scale, the standard focus ring — over --motion-fast --ease-standard. */
  .result-row {
    appearance: none;
    border: 0;
    margin: 0 0 var(--row-gap);
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
  }
</style>
