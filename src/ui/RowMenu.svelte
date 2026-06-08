<script lang="ts" module>
import type { IconName } from '../shared/icon-names';

/**
 * One action row in a {@link RowMenu}. `onSelect` fires on click / keyboard
 * activation. `danger` paints the row in `--danger`. `keepOpen` suppresses the
 * default close-on-select so a row can mutate the menu in place (a two-step
 * confirm, or revealing the in-drawer `panel`).
 */
export interface RowMenuItem {
  id: string;
  label: string;
  onSelect: () => void;
  icon?: IconName | undefined;
  danger?: boolean | undefined;
  keepOpen?: boolean | undefined;
  /** Renders a trailing chevron + `aria-haspopup` to signal the row opens a
   * drill-in sub-view (a titled `panel`) rather than firing an action. */
  submenu?: boolean | undefined;
}
</script>

<script lang="ts">
import { onDestroy, tick } from 'svelte';
import type { Snippet } from 'svelte';
import Icon from './Icon.svelte';
import Surface from './Surface.svelte';

interface Props {
  /** The row content, rendered on top and untouched. Receives `{ trigger }` (the
   * kebab button to place in its trailing slot) and `expanded` (open state, for
   * showing the trigger / swapping visuals). */
  header: Snippet<[{ trigger: Snippet; expanded: boolean }]>;
  /** Actions, top to bottom. */
  items: RowMenuItem[];
  /** Optional in-drawer expandable region (e.g. a folder icon/colour picker, or
   * the boundary editor). Without `panelTitle` it renders BELOW the actions
   * (revealed by a keep-open action); WITH `panelTitle` it becomes a **drill-in
   * view** that REPLACES the actions — a back-header (`‹ panelTitle`) above the
   * panel — so a focused editor reads as its own screen, not a strip hung under
   * unrelated actions. The drawer grows to fit it either way. */
  panel?: Snippet | undefined;
  /** Title for the drill-in view. When set (and `panel` is active), the actions
   * are replaced by `‹ panelTitle` + the panel. */
  panelTitle?: string | undefined;
  /** Invoked by the drill-in back affordance (and `Esc` while drilled in) to
   * dismiss the panel and return to the action list. The parent owns the state
   * that decides whether `panel`/`panelTitle` are passed. */
  onPanelBack?: (() => void) | undefined;
  /** Accessible label for the kebab trigger and the action menu. */
  label?: string | undefined;
  /** Bindable open state — callers reset transient row state on close. */
  open?: boolean | undefined;
  /** Fired whenever the menu opens or closes. */
  onOpenChange?: ((open: boolean) => void) | undefined;
  /** data-testid prefix for the trigger (`<prefix>-trigger`) and items
   * (`<prefix>-item`). Lets a wrapper keep its established testids. */
  testidPrefix?: string | undefined;
}

let {
  header,
  items,
  panel,
  panelTitle,
  onPanelBack,
  label = 'Open menu',
  open = $bindable(false),
  onOpenChange,
  testidPrefix = 'row-menu',
}: Props = $props();

// Drill-in: a titled panel takes over the drawer (back-header + panel) in place
// of the action list. A plain (untitled) panel keeps the below-actions layout.
const drilledIn = $derived(!!panel && panelTitle !== undefined);
let backBtnEl = $state<HTMLButtonElement>();

// The row stays exactly as it is, on top and untouched (only the trigger icon
// swaps ⋮ → ✕). The action drawer is rendered BEHIND the row (lower z-index) and
// grows out from underneath it, emerging downward over the rows below.

const CLOSE_MS = 200; // matches --motion-base

let rootEl = $state<HTMLElement>();
let drawerEl = $state<HTMLElement>();
let contentEl = $state<HTMLElement>();
let triggerEl = $state<HTMLButtonElement>();
let cardH = $state(0);
let revealed = $state(false);
let closing = $state(false);
let closeTimer: ReturnType<typeof setTimeout> | undefined;
let resizeObserver: ResizeObserver | undefined;

// The trigger advertises closed the instant a close begins, even though the
// card lingers for its collapse outro.
const expanded = $derived(open && !closing);

let prevOpen = false;
$effect(() => {
  const isOpen = open;
  if (isOpen === prevOpen) return;
  prevOpen = isOpen;
  if (isOpen) void handleOpened();
});

// Move focus + re-measure when the drawer crosses the actions⇄drill boundary so
// the new view is reachable (back button on drill-in; first action on return)
// and the drawer height tracks the swapped content.
let prevDrilled = false;
$effect(() => {
  const d = drilledIn;
  if (d === prevDrilled) return;
  prevDrilled = d;
  if (!open) return;
  void tick().then(() => {
    measure();
    if (d) backBtnEl?.focus();
    else focusItem(0);
  });
});

onDestroy(() => {
  if (closeTimer !== undefined) clearTimeout(closeTimer);
  resizeObserver?.disconnect();
  removeOutside();
});

/** Grow the drawer to its content's full height (the row-height spacer + the
 * actions + any expanded panel). Re-run whenever the content resizes so an
 * in-drawer panel that expands later (Icon & colour) grows the drawer too. */
function measure(): void {
  if (drawerEl) cardH = drawerEl.scrollHeight;
}

async function handleOpened(): Promise<void> {
  if (closeTimer !== undefined) {
    clearTimeout(closeTimer);
    closeTimer = undefined;
  }
  closing = false;
  revealed = false;
  cardH = 0;
  await tick();
  measure();
  // Observe content growth/shrink (e.g. the icon/colour panel expanding) and
  // keep the drawer height in sync while open.
  resizeObserver?.disconnect();
  // Browser-only enhancement: keep the drawer height in sync when an in-drawer
  // panel expands later. Absent in jsdom — the initial measure() still runs.
  if (contentEl && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      if (open && !closing) measure();
    });
    resizeObserver.observe(contentEl);
  }
  // Two frames so the collapsed --row-h state paints before the grow flips on.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      revealed = true;
    });
  });
  await tick();
  focusItem(0);
  addOutside();
}

function openMenu(): void {
  if (closeTimer !== undefined) {
    clearTimeout(closeTimer);
    closeTimer = undefined;
  }
  const reviving = open && closing;
  closing = false;
  if (!open) {
    open = true; // → effect → handleOpened
    onOpenChange?.(true);
  } else if (reviving) {
    void handleOpened();
  }
}

function close(): void {
  if (!open || closing) return;
  closing = true;
  revealed = false;
  onOpenChange?.(false);
  removeOutside();
  resizeObserver?.disconnect();
  triggerEl?.focus();
  closeTimer = setTimeout(() => {
    closeTimer = undefined;
    closing = false;
    open = false;
  }, CLOSE_MS);
}

function onDocPointerDown(event: PointerEvent): void {
  if (rootEl && event.target instanceof Node && !rootEl.contains(event.target)) close();
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

function menuItemEls(): HTMLButtonElement[] {
  if (!rootEl) return [];
  return Array.from(rootEl.querySelectorAll<HTMLButtonElement>('[role="menuitem"]'));
}
function focusables(): HTMLElement[] {
  if (!rootEl) return [];
  return Array.from(rootEl.querySelectorAll<HTMLElement>('button:not([disabled])'));
}
function focusItem(index: number): void {
  const els = menuItemEls();
  if (els.length === 0) return;
  const i = ((index % els.length) + els.length) % els.length;
  els[i]?.focus();
}
function focusItemById(id: string): void {
  const el = rootEl?.querySelector<HTMLButtonElement>(`[data-menu-id="${id}"]`);
  (el ?? menuItemEls()[0])?.focus();
}

function onCardKeydown(event: KeyboardEvent): void {
  if (!open) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    // Esc steps back out of a drill-in view first, then closes the menu.
    if (drilledIn) onPanelBack?.();
    else close();
    return;
  }
  if (event.key === 'Tab') {
    const f = focusables();
    if (f.length === 0) return;
    const first = f[0];
    const last = f[f.length - 1];
    const activeEl = document.activeElement;
    if (event.shiftKey && activeEl === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && activeEl === last) {
      event.preventDefault();
      first?.focus();
    }
    return;
  }
  const els = menuItemEls();
  const idx = els.indexOf(document.activeElement as HTMLButtonElement);
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    focusItem(idx + 1);
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    focusItem(idx - 1);
  } else if (event.key === 'Home') {
    event.preventDefault();
    focusItem(0);
  } else if (event.key === 'End') {
    event.preventDefault();
    focusItem(els.length - 1);
  }
}

function onTriggerClick(): void {
  if (open && !closing) close();
  else openMenu();
}

async function onItemClick(item: RowMenuItem): Promise<void> {
  item.onSelect();
  if (item.keepOpen) {
    await tick();
    measure();
    focusItemById(item.id);
  } else {
    close();
  }
}
</script>

<div class="slot" class:open bind:this={rootEl} data-testid="row-menu-card">
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    bind:this={drawerEl}
    class="drawer"
    class:revealed
    style:--card-h={`${cardH}px`}
    onkeydown={onCardKeydown}
  >
    {#if open}
      <Surface variant="elevated" radius="md">
        <div bind:this={contentEl} class="content">
          <div class="spacer" aria-hidden="true"></div>
          {#if drilledIn}
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div class="drill" onpointerdown={stop}>
              <button
                bind:this={backBtnEl}
                type="button"
                class="drill-back"
                data-testid={`${testidPrefix}-back`}
                onclick={() => onPanelBack?.()}
              >
                <span class="back-icon" aria-hidden="true">
                  <Icon name={'chevron-left' as IconName} size={16} />
                </span>
                <span class="drill-title">{panelTitle}</span>
              </button>
              {#if panel}
                <div class="panel" onpointerdown={stop}>{@render panel()}</div>
              {/if}
            </div>
          {:else}
            <div class="actions" role="menu" tabindex={-1} aria-label={label} onpointerdown={stop}>
              {#each items as item (item.id)}
              <button
                type="button"
                role="menuitem"
                class="item"
                class:danger={item.danger}
                aria-haspopup={item.submenu ? 'menu' : undefined}
                data-menu-id={item.id}
                data-testid={`${testidPrefix}-item`}
                onclick={() => onItemClick(item)}
              >
                {#if item.icon}
                  <span class="leading" aria-hidden="true">
                    <Icon name={item.icon} size={14} />
                  </span>
                {/if}
                <span class="label">{item.label}</span>
                {#if item.submenu}
                  <span class="submenu-affordance" aria-hidden="true">
                    <Icon name={'chevron-right' as IconName} size={14} />
                  </span>
                {/if}
              </button>
              {/each}
              {#if panel}
                <div class="panel" onpointerdown={stop}>{@render panel()}</div>
              {/if}
            </div>
          {/if}
        </div>
      </Surface>
    {/if}
  </div>

  <div class="row-top">
    {@render header({ trigger, expanded })}
  </div>
</div>

{#snippet trigger()}
  <button
    bind:this={triggerEl}
    type="button"
    class="trigger"
    aria-haspopup="menu"
    aria-expanded={expanded}
    aria-label={label}
    title={label}
    data-testid={`${testidPrefix}-trigger`}
    onclick={onTriggerClick}
    onpointerdown={stop}
  >
    <Icon name={expanded ? 'x' : 'ellipsis-vertical'} size={16} />
  </button>
{/snippet}

<style>
  .slot {
    position: relative;
    height: var(--row-h);
  }
  .slot.open {
    z-index: var(--z-dropdown);
  }

  .row-top {
    position: relative;
    z-index: var(--z-raised);
    border-radius: var(--r-md);
  }
  .slot.open .row-top {
    background: var(--bg);
  }

  /* The drawer is the animating clip; its frosted/elevated fill is a Surface
   * rendered inside it (kept transparent here so the Surface shows through). */
  .drawer {
    position: absolute;
    inset-inline: 0;
    top: 0;
    z-index: var(--z-base);
    height: var(--row-h);
    overflow: hidden;
    background: transparent;
    border-radius: var(--r-md);
    transition: height var(--motion-base) var(--ease-standard);
  }
  .drawer.revealed {
    height: var(--card-h);
  }
  .spacer {
    height: var(--row-h);
  }

  .actions {
    display: flex;
    flex-direction: column;
    gap: 0;
    padding: var(--space-1);
    border-top: 1px solid var(--divider);
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
      color var(--motion-fast) var(--ease-standard),
      transform var(--motion-fast) var(--ease-standard);
  }
  .item:hover {
    background: var(--hover);
    color: var(--text);
  }
  .item:active {
    transform: scale(var(--press-scale));
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
    transition: color var(--motion-fast) var(--ease-standard);
  }
  .item .label {
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Trailing chevron for a drill-in row — the `label`'s `flex: 1` pushes it to
   * the right edge. Quiet by default, a touch brighter on hover. */
  .item .submenu-affordance {
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

  /* In-drawer expandable region (e.g. the folder icon/colour picker). */
  .panel {
    padding: var(--space-1) var(--space-2) var(--space-2);
  }

  /* Drill-in view: a back-header above the panel, replacing the action list so a
   * focused editor reads as its own screen rather than a strip under the actions. */
  .drill {
    display: flex;
    flex-direction: column;
    padding: var(--space-1);
    border-top: 1px solid var(--divider);
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

  .trigger {
    appearance: none;
    border: 0;
    margin: 0;
    padding: 0;
    width: var(--control-h-xs);
    height: var(--control-h-xs);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--r-sm);
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    transition:
      background var(--motion-fast) var(--ease-standard),
      color var(--motion-fast) var(--ease-standard),
      transform var(--motion-fast) var(--ease-standard);
  }
  .trigger:hover {
    background: var(--hover);
    color: var(--text);
  }
  .trigger:active {
    transform: scale(var(--press-scale));
  }
  .trigger:focus-visible {
    outline: var(--focus-width) solid var(--focus-color);
    outline-offset: var(--focus-offset);
  }
</style>
