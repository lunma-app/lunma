<script lang="ts" module>
export type { MenuItem } from './menu-types';
</script>

<script lang="ts">
import { DropdownMenu } from 'bits-ui';
import Icon from './Icon.svelte';
import type { MenuItem } from './menu-types';

/**
 * bits-ui-backed drop-in replacement for {@link Menu}: a kebab trigger that opens
 * a portaled action popover. Same public surface as `Menu` (items / label / icon /
 * onOpenChange) and the same testids (`menu-trigger`, `menu-item`, `data-menu-id`)
 * so a consumer swap is `import Menu → import BitsMenu`. bits-ui owns placement,
 * collision-clamping, dismissal (Esc / outside-click), keyboard roving, and the
 * portal; we only restyle the comp look (Sidebar Redesign §9) via global classes
 * on the portaled content (mirrors Tooltip's portal-to-body styling approach).
 */
interface Props {
  /** Actions, top to bottom. */
  items: MenuItem[];
  /** Accessible label for the kebab trigger (and the popover). */
  label?: string | undefined;
  /** Trigger glyph; defaults to the vertical ellipsis (kebab). Any lucide name. */
  icon?: string | undefined;
  /** Optional header. `kind` is an uppercase eyebrow, `title` the row label —
   * matches the comp's titled header (§9). Both omitted → no header. */
  headerKind?: string | undefined;
  headerTitle?: string | undefined;
  /** Fired whenever the menu opens or closes (e.g. to reset a pending confirm). */
  onOpenChange?: ((open: boolean) => void) | undefined;
  /** Bindable open state. Lets a consumer DRIVE the menu closed (or open) — e.g.
   * a `keepOpen` item that drills into an editor must be able to dismiss the menu
   * when that editor finishes. Without this the menu is uncontrolled and a
   * consumer's "close" has no path to bits-ui. */
  open?: boolean;
}

let {
  items,
  label = 'Open menu',
  icon = 'ellipsis-vertical',
  headerKind,
  headerTitle,
  onOpenChange,
  open = $bindable(false),
}: Props = $props();

function handleOpenChange(next: boolean): void {
  onOpenChange?.(next);
}

// A press on the trigger must not start a row drag/swipe in the host — but it
// MUST still reach bits-ui's own pointerdown handler (which opens the menu). So
// compose: stop propagation to the host row, then forward to bits-ui's handler
// (spreading `{...props}` then setting `onpointerdown` would OVERRIDE bits-ui's
// handler in Svelte 5 — last-write-wins — and the menu would never open).
function triggerPointerDown(props: Record<string, unknown>, event: PointerEvent): void {
  event.stopPropagation();
  (props.onpointerdown as ((event: PointerEvent) => void) | undefined)?.(event);
}
</script>

<DropdownMenu.Root bind:open onOpenChange={handleOpenChange}>
  <DropdownMenu.Trigger>
    {#snippet child({ props })}
      <button
        {...props}
        type="button"
        class="trigger"
        aria-label={label}
        title={label}
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
      aria-label={label}
    >
      {#if headerTitle !== undefined}
        <div class="lunma-menu-header">
          {#if headerKind !== undefined}<div class="lunma-menu-kind">{headerKind}</div>{/if}
          <div class="lunma-menu-title">{headerTitle}</div>
        </div>
      {/if}
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
            >
              {#if item.icon}
                <span class="leading" aria-hidden="true"><Icon name={item.icon} size={14} /></span>
              {/if}
              <span class="label">{item.label}</span>
            </button>
          {/snippet}
        </DropdownMenu.Item>
      {/each}
    </DropdownMenu.Content>
  </DropdownMenu.Portal>
</DropdownMenu.Root>

<style>
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

  /* Portaled to document.body by bits-ui — the popover chrome + item styles must
   * be global (mirrors Tooltip). The comp's menu look (Sidebar Redesign §9): a
   * 212px panel on --bg-elev with a --border hairline, 14px radius, a small pop. */
  :global(.lunma-menu) {
    width: 212px;
    box-sizing: border-box;
    padding: var(--space-1);
    background: var(--bg-elev);
    border: 1px solid var(--border);
    border-radius: 14px;
    box-shadow: var(--shadow-lg);
    z-index: var(--z-dropdown);
    transform-origin: var(--bits-dropdown-menu-content-transform-origin);
  }
  :global(.lunma-menu[data-state='open']) {
    animation: lunma-menu-in var(--motion-fast) var(--ease-emphasised);
  }

  /* Titled header (§9): uppercase kind eyebrow + a one-line title, divider below. */
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

  /* Danger items paint red (§9 "danger items in red"). */
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

  /* Disabled (inert) entry — muted, non-interactive (parity with Menu/ContextMenu). */
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
