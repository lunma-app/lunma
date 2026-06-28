<script lang="ts" module>
export type { MenuItem } from './menu-types';
</script>

<script lang="ts">
import { ContextMenu, DropdownMenu } from 'bits-ui';
import type { Snippet } from 'svelte';
import Icon from './Icon.svelte';
import type { MenuItem } from './menu-types';

/**
 * The one bits-ui-backed action menu. `trigger` picks the surface:
 *
 * - `'kebab'` — a `⋮` trigger button opening a portaled **floating dropdown**
 *   (`DropdownMenu`, `align="end"`); testids `menu-trigger` / `menu-item`.
 * - `'context'` — the right-clickable region is `children` (spread the trigger
 *   props onto your element); right-click opens a cursor-anchored popover
 *   (`ContextMenu`). Panel testid = `testid` (default `context-menu`), items
 *   `${testid}-item`.
 *
 * Both share the item model (`MenuItem`: icon / danger / disabled / `keepOpen`
 * two-step confirm), the comp menu look, collision-clamping, dismissal, roving
 * keyboard nav, and the fast-tick entrance (reduced-motion honoured). Drill-in is
 * data-driven via `MenuItem.submenu`; there is no editor-panel prop.
 */
interface Props {
  /** Actions, top to bottom. */
  items: MenuItem[];
  /** Which surface: a kebab dropdown or a right-click context popover. */
  trigger: 'kebab' | 'context';
  /** Accessible label (trigger + popover). Defaults to a per-trigger label. */
  label?: string | undefined;
  /** Kebab trigger glyph (`trigger='kebab'`); any lucide name. */
  icon?: string | undefined;
  /** `trigger='context'`: panel testid (default `context-menu`), items
   * `${testid}-item`. (The kebab keeps the fixed `menu-trigger`/`menu-item`.) */
  testid?: string | undefined;
  /** Optional titled header (comp §9): uppercase `headerKind` + `headerTitle`. */
  headerKind?: string | undefined;
  headerTitle?: string | undefined;
  /** Fired whenever the menu opens or closes (host resets transient state on close). */
  onOpenChange?: ((open: boolean) => void) | undefined;
  /** Bindable open state — lets a host observe / force-close. */
  open?: boolean | undefined;
  /** The right-clickable region (`trigger='context'`). bits-ui spreads the
   * trigger props — forward them: `{#snippet children(props)}<div {...props}>…`. */
  children?: Snippet<[Record<string, unknown>]> | undefined;
}

let {
  items,
  trigger,
  label,
  icon = 'ellipsis-vertical',
  testid = 'context-menu',
  headerKind,
  headerTitle,
  onOpenChange,
  open = $bindable(false),
  children,
}: Props = $props();

const ariaLabel = $derived(label ?? (trigger === 'kebab' ? 'Open menu' : 'Actions'));

function handleOpenChange(next: boolean): void {
  open = next;
  onOpenChange?.(next);
}

// A press on the kebab must not start a host row drag/swipe, but MUST still reach
// bits-ui's own pointerdown handler (which opens the menu). Stop propagation to
// the row, then forward to bits-ui's handler (overriding it via `{...props}` then
// `onpointerdown` would last-write-win and the menu would never open).
function triggerPointerDown(props: Record<string, unknown>, event: PointerEvent): void {
  event.stopPropagation();
  (props.onpointerdown as ((event: PointerEvent) => void) | undefined)?.(event);
}
</script>

<!-- Shared header + item body, rendered identically by both triggers. -->
{#snippet header()}
  {#if headerTitle !== undefined}
    <div class="lunma-menu-header">
      {#if headerKind !== undefined}<div class="lunma-menu-kind">{headerKind}</div>{/if}
      <div class="lunma-menu-title">{headerTitle}</div>
    </div>
  {/if}
{/snippet}

{#snippet itemBody(item: MenuItem)}
  {#if item.icon}
    <span class="leading" aria-hidden="true"><Icon name={item.icon} size={14} /></span>
  {/if}
  <span class="label">{item.label}</span>
  {#if item.submenu}
    <!-- Signals the item drills into a sub-panel (menu-types `submenu`). -->
    <span class="trailing-chevron" aria-hidden="true"><Icon name="chevron-right" size={14} /></span>
  {/if}
{/snippet}

{#if trigger === 'kebab'}
  <DropdownMenu.Root bind:open onOpenChange={handleOpenChange}>
    <DropdownMenu.Trigger>
      {#snippet child({ props })}
        <button
          {...props}
          type="button"
          class="trigger"
          aria-label={ariaLabel}
          title={ariaLabel}
          data-testid="menu-trigger"
          onpointerdown={(event) => triggerPointerDown(props, event)}
        >
          <Icon name={open ? 'x' : icon} size={16} />
        </button>
      {/snippet}
    </DropdownMenu.Trigger>

    <DropdownMenu.Portal>
      <DropdownMenu.Content
        class="lunma-menu"
        sideOffset={4}
        align="end"
        collisionPadding={8}
        aria-label={ariaLabel}
      >
        {@render header()}
        {#each items as item (item.id)}
          <DropdownMenu.Item
            class={`lunma-menu-item${item.danger ? ' danger' : ''}${item.disabled ? ' disabled' : ''}`}
            disabled={item.disabled ?? false}
            closeOnSelect={!item.keepOpen}
            onSelect={() => item.onSelect()}
          >
            {#snippet child({ props })}
              <button
                {...props}
                type="button"
                data-menu-id={item.id}
                data-testid="menu-item"
                aria-haspopup={item.submenu ? 'true' : undefined}
              >
                {@render itemBody(item)}
              </button>
            {/snippet}
          </DropdownMenu.Item>
        {/each}
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  </DropdownMenu.Root>
{:else}
  <ContextMenu.Root bind:open onOpenChange={handleOpenChange}>
    <ContextMenu.Trigger>
      {#snippet child({ props })}
        {@render children?.(props)}
      {/snippet}
    </ContextMenu.Trigger>

    <ContextMenu.Portal>
      <ContextMenu.Content
        class="lunma-menu"
        collisionPadding={8}
        aria-label={ariaLabel}
        data-testid={testid}
      >
        {@render header()}
        {#each items as item (item.id)}
          <ContextMenu.Item
            class={`lunma-menu-item${item.danger ? ' danger' : ''}${item.disabled ? ' disabled' : ''}`}
            disabled={item.disabled ?? false}
            closeOnSelect={!item.keepOpen}
            onSelect={() => item.onSelect()}
          >
            {#snippet child({ props })}
              <button
                {...props}
                type="button"
                data-menu-id={item.id}
                data-testid={`${testid}-item`}
                aria-haspopup={item.submenu ? 'true' : undefined}
              >
                {@render itemBody(item)}
              </button>
            {/snippet}
          </ContextMenu.Item>
        {/each}
      </ContextMenu.Content>
    </ContextMenu.Portal>
  </ContextMenu.Root>
{/if}

<style>
  /* Kebab trigger (not portaled — scoped). */
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

  /* Portaled to document.body by bits-ui — the popover chrome + item styles are
   * global (mirrors Tooltip). The comp's menu look (Sidebar Redesign §9): a 212px
   * panel on --bg-elev, --border hairline, 14px radius, a small pop. The
   * transform-origin reads whichever bits-ui menu var is set (dropdown OR context). */
  :global(.lunma-menu) {
    width: 212px;
    box-sizing: border-box;
    padding: var(--space-1);
    background: var(--bg-elev);
    border: 1px solid var(--border);
    border-radius: 14px;
    box-shadow: var(--shadow-lg);
    z-index: var(--z-dropdown);
    transform-origin: var(
      --bits-dropdown-menu-content-transform-origin,
      var(--bits-context-menu-content-transform-origin)
    );
  }
  :global(.lunma-menu[data-state='open']) {
    animation: lunma-menu-in var(--motion-fast) var(--ease-emphasised);
  }

  :global(.lunma-menu-header) {
    padding: 6px 10px 8px;
    margin-bottom: 4px;
    border-bottom: 1px solid var(--border-soft);
  }
  :global(.lunma-menu-kind) {
    margin-bottom: 2px;
    font: var(--weight-medium) var(--text-2xs) / 1.2 var(--font-sans);
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: var(--text-faint);
  }
  :global(.lunma-menu-title) {
    font: var(--weight-semibold) var(--text-sm) / 1.2 var(--font-sans);
    color: var(--text-2);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  :global(.lunma-menu-item) {
    appearance: none;
    border: 0;
    margin: 0;
    width: 100%;
    box-sizing: border-box;
    padding: 8px 9px;
    display: flex;
    align-items: center;
    gap: 11px;
    background: transparent;
    color: var(--text-2);
    font: var(--weight-medium) var(--text-base) / 1 var(--font-sans);
    text-align: left;
    cursor: pointer;
    border-radius: 9px;
    transition:
      background var(--motion-fast) var(--ease-standard),
      color var(--motion-fast) var(--ease-standard);
  }
  :global(.lunma-menu-item:hover),
  :global(.lunma-menu-item[data-highlighted]) {
    background: var(--hover);
    color: var(--text);
  }
  :global(.lunma-menu-item:focus-visible) {
    outline: var(--focus-width) solid var(--focus-color);
    outline-offset: -2px;
  }
  :global(.lunma-menu-item .leading) {
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    color: var(--text-muted);
  }
  :global(.lunma-menu-item .label) {
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  :global(.lunma-menu-item .trailing-chevron) {
    flex: 0 0 auto;
    margin-left: auto;
    display: inline-flex;
    align-items: center;
    color: var(--text-faint);
  }

  :global(.lunma-menu-item.danger) {
    color: var(--danger);
  }
  :global(.lunma-menu-item.danger:hover),
  :global(.lunma-menu-item.danger[data-highlighted]) {
    background: color-mix(in oklch, var(--danger) 16%, var(--surface-2));
    color: var(--danger);
  }
  :global(.lunma-menu-item.danger .leading) {
    color: var(--danger);
  }

  :global(.lunma-menu-item.disabled),
  :global(.lunma-menu-item.disabled:hover),
  :global(.lunma-menu-item.disabled[data-highlighted]) {
    color: var(--text-faint);
    background: transparent;
    cursor: default;
  }
  :global(.lunma-menu-item.disabled .leading) {
    color: var(--text-faint);
  }

  @keyframes lunma-menu-in {
    from {
      opacity: 0;
      transform: scale(0.97) translateY(-4px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    :global(.lunma-menu[data-state='open']) {
      animation: none;
    }
  }
</style>
