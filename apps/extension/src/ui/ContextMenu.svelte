<script lang="ts" module>
export type { MenuItem } from './menu-types';
</script>

<script lang="ts">
import { onDestroy, type Snippet, tick } from 'svelte';
import Icon from './Icon.svelte';
import type { MenuItem } from './menu-types';
import Surface from './Surface.svelte';

/**
 * Right-click context menu — a popover anchored at a cursor position, with NO
 * built-in trigger (the host opens it from a `contextmenu` handler). Mirrors
 * `Menu`'s frosted `Surface` + `MenuItem` list, keyboard nav, and outside-click
 * dismissal, but floats at `(x, y)` (clamped into the viewport) instead of below a
 * kebab. Used where there is no room for a persistent trigger — e.g. the favicon
 * tiles, which carry no on-tile chrome.
 */
interface Props {
  /** Bindable open state — the host sets it true on right-click, the menu clears it. */
  open: boolean;
  /** Anchor (viewport coords, e.g. the `contextmenu` event's clientX/clientY). */
  x: number;
  y: number;
  /** The element that invoked the menu (the row/tile). When the event carried no
   * usable pointer position — a keyboard-invoked `contextmenu` (menu key /
   * `Shift+F10`) reports `clientX === 0 && clientY === 0` — the menu anchors to
   * this element's rect (title column, vertically centred) instead of (0,0), so a
   * keyboard user's menu opens at the focused row rather than the viewport corner. */
  anchorEl?: HTMLElement | undefined;
  /** Actions, top to bottom. */
  items: MenuItem[];
  /** Accessible label for the menu. */
  label?: string | undefined;
  /** data-testid prefix for items (`<prefix>-item`); the panel is `<prefix>`. */
  testid?: string | undefined;
  /** Fired whenever the menu closes (host can reset transient state). */
  onclose?: (() => void) | undefined;
  /** Optional drill-in sub-view (e.g. the boundary editor). When BOTH `panel` and
   * `panelTitle` are passed, the action list is replaced by a back-header
   * (`‹ panelTitle`) + the panel — exactly like `RowMenu`'s drill-in. The host owns
   * the state deciding whether they're passed (a `submenu` item's `onSelect` sets it). */
  panel?: Snippet | undefined;
  panelTitle?: string | undefined;
  /** Invoked by the back affordance (and `Esc` while drilled in) to leave the panel. */
  onPanelBack?: (() => void) | undefined;
}

let {
  open = $bindable(),
  x,
  y,
  items,
  label = 'Actions',
  testid = 'context-menu',
  onclose,
  panel,
  panelTitle,
  onPanelBack,
  anchorEl,
}: Props = $props();

/** Effective anchor point: the event coords, or — for a keyboard-invoked menu
 * (`x === 0 && y === 0`) with a known invoking element — that element's rect at its
 * title column, vertically centred. Clamped into the viewport by `place()`. */
function anchorPoint(): { x: number; y: number } {
  if (x === 0 && y === 0 && anchorEl) {
    const r = anchorEl.getBoundingClientRect();
    return { x: r.left + ROW_TITLE_INSET, y: r.top + r.height / 2 };
  }
  return { x, y };
}
/** Inset from a row's left edge to its title column (favicon gutter), so a
 * keyboard-anchored menu opens beside the title rather than at the row's edge. */
const ROW_TITLE_INSET = 28;

// Drill-in: a titled panel takes over the popover (back-header + panel) in place of
// the action list (mirrors RowMenu). The host controls whether panel/panelTitle pass.
const drilledIn = $derived(!!panel && panelTitle !== undefined);

let panelEl = $state<HTMLElement>();
let placedX = $state(0);
let placedY = $state(0);
/** The element that opened the menu — focus returns here on close. */
let openerEl: HTMLElement | null = null;

onDestroy(removeOutside);

function close(): void {
  if (!open) return;
  open = false;
  removeOutside();
  onclose?.();
  openerEl?.focus();
  openerEl = null;
}

function onItemClick(item: MenuItem): void {
  if (item.disabled) return; // inert end-of-list entry (e.g. Move at a boundary)
  item.onSelect();
  if (!item.keepOpen) close();
}

// Place at the anchor, then clamp into the viewport once the panel has size (an
// 8px margin). jsdom returns a zero rect, so clamping is a no-op under test.
$effect(() => {
  if (!open) return;
  openerEl = (document.activeElement instanceof HTMLElement ? document.activeElement : null);
  const p = anchorPoint();
  placedX = p.x;
  placedY = p.y;
  addOutside();
  void place();
});

// Re-focus + re-clamp when crossing the actions⇄drill boundary (the panel resizes
// the popover, and the new view's first control must be reachable).
let prevDrilled = false;
$effect(() => {
  const d = drilledIn;
  if (d === prevDrilled) return;
  prevDrilled = d;
  if (open) void place();
});

async function place(): Promise<void> {
  // Capture before the await so we don't read a $derived after its parent
  // effect is destroyed (derived_inert) if the component tears down mid-tick.
  const wasDrilled = drilledIn;
  await tick();
  // Focus the back affordance when drilled in, else the first action.
  const target = wasDrilled
    ? panelEl?.querySelector<HTMLButtonElement>(`[data-testid="${testid}-back"]`)
    : panelEl?.querySelector<HTMLButtonElement>('[role="menuitem"]');
  target?.focus();
  if (!panelEl || typeof window === 'undefined') return;
  const p = anchorPoint();
  const r = panelEl.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return; // unmeasured (jsdom) — leave at anchor
  const m = 8;
  placedX = Math.max(m, Math.min(p.x, window.innerWidth - m - r.width));
  placedY = Math.max(m, Math.min(p.y, window.innerHeight - m - r.height));
}

// --- outside-click dismissal -------------------------------------------------
function onDocPointerDown(event: PointerEvent): void {
  if (panelEl && event.target instanceof Node && !panelEl.contains(event.target)) close();
}
function addOutside(): void {
  document.addEventListener('pointerdown', onDocPointerDown, true);
}
function removeOutside(): void {
  document.removeEventListener('pointerdown', onDocPointerDown, true);
}

function stop(event: Event): void {
  event.stopPropagation();
}

// Portal the floating panel to <body> so its `position: fixed` is anchored to the
// VIEWPORT, not to a transformed ancestor. The sidebar carousel translates its
// track (`transform: translate3d`), which establishes a containing block for
// fixed descendants — without this, a menu opened from a pinned/temp row (which
// live inside the track) would float at the wrong place. Mirrors how DragClone /
// Toast are mounted at the root, outside the track.
function portal(node: HTMLElement): { destroy(): void } {
  document.body.appendChild(node);
  return {
    destroy() {
      node.remove();
    },
  };
}

// --- keyboard nav ------------------------------------------------------------
function menuItemEls(): HTMLButtonElement[] {
  if (!panelEl) return [];
  return Array.from(panelEl.querySelectorAll<HTMLButtonElement>('[role="menuitem"]'));
}
function focusAt(index: number): void {
  const els = menuItemEls();
  if (els.length === 0) return;
  const i = ((index % els.length) + els.length) % els.length;
  els[i]?.focus();
}
function onKeydown(event: KeyboardEvent): void {
  const els = menuItemEls();
  const idx = els.indexOf(document.activeElement as HTMLButtonElement);
  if (event.key === 'Escape') {
    event.preventDefault();
    // Esc steps back out of a drill-in view first, then closes the menu.
    // Read props directly (not the $derived) — the portal element outlives the
    // component effect, so drilledIn would warn derived_inert on destruction.
    if (!!panel && panelTitle !== undefined) onPanelBack?.();
    else close();
  } else if (event.key === 'ArrowDown') {
    event.preventDefault();
    focusAt(idx + 1);
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    focusAt(idx - 1);
  } else if (event.key === 'Home') {
    event.preventDefault();
    focusAt(0);
  } else if (event.key === 'End') {
    event.preventDefault();
    focusAt(els.length - 1);
  }
}
</script>

{#if open}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    bind:this={panelEl}
    use:portal
    class="context-menu"
    style:left={`${placedX}px`}
    style:top={`${placedY}px`}
    data-testid={testid}
    onkeydown={onKeydown}
    onpointerdown={stop}
  >
    <Surface variant="glass" radius="md">
      {#if drilledIn}
        <!-- Drill-in view: a back-header (‹ panelTitle) above the panel, replacing the
             actions — the same affordance pinned rows use (RowMenu). -->
        <div class="drill">
          <button
            type="button"
            class="drill-back"
            data-testid={`${testid}-back`}
            onclick={() => onPanelBack?.()}
          >
            <span class="back-icon" aria-hidden="true">
              <Icon name="chevron-left" size={16} />
            </span>
            <span class="drill-title">{panelTitle}</span>
          </button>
          {#if panel}<div class="drill-panel">{@render panel()}</div>{/if}
        </div>
      {:else}
        <div class="menu-list" role="menu" tabindex={-1} aria-label={label}>
          {#each items as item (item.id)}
            <button
              type="button"
              role="menuitem"
              class="item"
              class:danger={item.danger}
              class:disabled={item.disabled}
              aria-haspopup={item.submenu ? 'menu' : undefined}
              aria-disabled={item.disabled ? 'true' : undefined}
              data-menu-id={item.id}
              data-testid={`${testid}-item`}
              onclick={() => onItemClick(item)}
            >
              {#if item.icon}
                <span class="leading" aria-hidden="true"><Icon name={item.icon} size={14} /></span>
              {/if}
              <span class="label">{item.label}</span>
              {#if item.submenu}
                <span class="submenu-affordance" aria-hidden="true">
                  <Icon name="chevron-right" size={14} />
                </span>
              {/if}
            </button>
          {/each}
        </div>
      {/if}
    </Surface>
  </div>
{/if}

<style>
  .context-menu {
    position: fixed;
    z-index: var(--z-dropdown);
    min-width: 176px;
    animation: context-menu-in var(--motion-fast) var(--ease-emphasised);
  }
  .menu-list {
    display: flex;
    flex-direction: column;
    padding: var(--space-1);
  }

  .item {
    appearance: none;
    border: 0;
    margin: 0;
    width: 100%;
    box-sizing: border-box;
    height: 34px;
    padding: 0 var(--space-2);
    display: flex;
    align-items: center;
    gap: var(--space-2);
    background: transparent;
    color: var(--text-2);
    font: var(--weight-medium) var(--text-base) / 1 var(--font-sans);
    text-align: left;
    cursor: pointer;
    border-radius: var(--r-sm);
    transition:
      background var(--motion-fast) var(--ease-standard),
      color var(--motion-fast) var(--ease-standard);
  }
  .item:hover {
    background: var(--hover);
    color: var(--text);
  }
  .item:focus-visible {
    outline: var(--focus-width) solid var(--focus-color);
    outline-offset: -2px;
  }
  .item .leading {
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
  }
  .item .label {
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .item.danger {
    color: var(--danger);
  }
  .item.danger:hover {
    background: color-mix(in oklch, var(--danger) 16%, var(--surface-2));
    color: var(--danger);
  }
  .item.danger .leading {
    color: var(--danger);
  }

  /* Disabled (inert) entry — e.g. Move up/down at a list end. Stays focusable
   * (aria-disabled) but muted and non-interactive: no hover lift, default cursor. */
  .item.disabled,
  .item.disabled:hover,
  .item.disabled.danger,
  .item.disabled.danger:hover {
    color: var(--text-faint);
    background: transparent;
    cursor: default;
  }
  .item.disabled .leading {
    color: var(--text-faint);
  }

  /* Trailing chevron for a drill-in (submenu) item. */
  .submenu-affordance {
    flex: 0 0 auto;
    margin-left: var(--space-2);
    display: inline-flex;
    align-items: center;
    color: var(--text-faint);
    transition: color var(--motion-fast) var(--ease-standard);
  }
  .item:hover .submenu-affordance {
    color: var(--text-muted);
  }

  /* Drill-in view: a back-header above the panel, replacing the action list. */
  .drill {
    display: flex;
    flex-direction: column;
    padding: var(--space-1);
  }
  .drill-back {
    appearance: none;
    border: 0;
    margin: 0;
    width: 100%;
    box-sizing: border-box;
    height: 34px;
    padding: 0 var(--space-2);
    display: flex;
    align-items: center;
    gap: var(--space-1);
    background: transparent;
    color: var(--text-2);
    font: var(--weight-semibold) var(--text-base) / 1 var(--font-sans);
    text-align: left;
    cursor: pointer;
    border-radius: var(--r-sm);
    transition:
      background var(--motion-fast) var(--ease-standard),
      color var(--motion-fast) var(--ease-standard);
  }
  .drill-back:hover {
    background: var(--hover);
    color: var(--text);
  }
  .drill-back:focus-visible {
    outline: var(--focus-width) solid var(--focus-color);
    outline-offset: -2px;
  }
  .drill-back .back-icon {
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    color: var(--text-muted);
  }
  .drill-title {
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .drill-panel {
    padding: var(--space-1) var(--space-2) var(--space-2);
  }

  @keyframes context-menu-in {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .context-menu {
      animation: none;
    }
  }
</style>
