<script lang="ts" module>
export type { MenuItem } from './menu-types';
</script>

<script lang="ts">
import { onDestroy, tick } from 'svelte';
import Icon from './Icon.svelte';
import type { MenuItem } from './menu-types';
import Surface from './Surface.svelte';

interface Props {
  /** Actions, top to bottom. */
  items: MenuItem[];
  /** Accessible label for the kebab trigger (and the popover). */
  label?: string | undefined;
  /** Trigger glyph; defaults to the vertical ellipsis (kebab). Any lucide name
   * (the generic `Icon` renderer), not the curated picker catalogue. */
  icon?: string | undefined;
  /** Fired whenever the menu opens or closes (e.g. to reset a pending confirm). */
  onOpenChange?: ((open: boolean) => void) | undefined;
}

const { items, label = 'Open menu', icon = 'ellipsis-vertical', onOpenChange }: Props = $props();

let open = $state(false);
let rootEl = $state<HTMLElement>();
let triggerEl = $state<HTMLButtonElement>();

onDestroy(removeOutside);

function setOpen(next: boolean): void {
  if (next === open) return;
  open = next;
  onOpenChange?.(next);
  if (next) {
    addOutside();
    void focusFirstSoon();
  } else {
    removeOutside();
  }
}

async function focusFirstSoon(): Promise<void> {
  await tick();
  menuItemEls()[0]?.focus();
}

function toggle(): void {
  setOpen(!open);
}

function onItemClick(item: MenuItem): void {
  item.onSelect();
  if (!item.keepOpen) {
    setOpen(false);
    triggerEl?.focus();
  }
}

// --- outside-click dismissal -------------------------------------------------
function onDocPointerDown(event: PointerEvent): void {
  if (rootEl && event.target instanceof Node && !rootEl.contains(event.target)) setOpen(false);
}
function addOutside(): void {
  document.addEventListener('pointerdown', onDocPointerDown, true);
}
function removeOutside(): void {
  document.removeEventListener('pointerdown', onDocPointerDown, true);
}

function stop(event: Event): void {
  // Keep a press on the menu from starting a row drag/swipe in the host.
  event.stopPropagation();
}

// --- keyboard nav ------------------------------------------------------------
function menuItemEls(): HTMLButtonElement[] {
  if (!rootEl) return [];
  return Array.from(rootEl.querySelectorAll<HTMLButtonElement>('[role="menuitem"]'));
}
function focusAt(index: number): void {
  const els = menuItemEls();
  if (els.length === 0) return;
  const i = ((index % els.length) + els.length) % els.length;
  els[i]?.focus();
}
function onKeydown(event: KeyboardEvent): void {
  if (!open) return;
  const els = menuItemEls();
  const idx = els.indexOf(document.activeElement as HTMLButtonElement);
  if (event.key === 'Escape') {
    event.preventDefault();
    setOpen(false);
    triggerEl?.focus();
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

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="menu" bind:this={rootEl} onkeydown={onKeydown}>
  <button
    bind:this={triggerEl}
    type="button"
    class="trigger"
    aria-haspopup="menu"
    aria-expanded={open}
    aria-label={label}
    title={label}
    data-testid="menu-trigger"
    onclick={toggle}
    onpointerdown={stop}
  >
    <Icon name={open ? 'x' : icon} size={16} />
  </button>

  {#if open}
    <div class="popover">
      <Surface variant="glass" radius="md">
        <div class="menu-list" role="menu" tabindex={-1} aria-label={label} onpointerdown={stop}>
          {#each items as item (item.id)}
            <button
              type="button"
              role="menuitem"
              class="item"
              class:danger={item.danger}
              data-menu-id={item.id}
              data-testid="menu-item"
              onclick={() => onItemClick(item)}
            >
              {#if item.icon}
                <span class="leading" aria-hidden="true"><Icon name={item.icon} size={14} /></span>
              {/if}
              <span class="label">{item.label}</span>
            </button>
          {/each}
        </div>
      </Surface>
    </div>
  {/if}
</div>

<style>
  .menu {
    position: relative;
    display: inline-flex;
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

  /* Popover floats below-right of the trigger; the frosted panel is a Surface. */
  .popover {
    position: absolute;
    top: calc(100% + 4px);
    right: 0;
    z-index: var(--z-dropdown);
    min-width: 168px;
    animation: menu-in var(--motion-fast) var(--ease-emphasised);
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

  @keyframes menu-in {
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
    .popover {
      animation: none;
    }
  }
</style>
