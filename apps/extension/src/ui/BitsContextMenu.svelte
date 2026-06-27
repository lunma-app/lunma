<script lang="ts" module>
export type { MenuItem } from './menu-types';
</script>

<script lang="ts">
import { ContextMenu } from 'bits-ui';
import type { Snippet } from 'svelte';
import Icon from './Icon.svelte';
import type { MenuItem } from './menu-types';

/**
 * bits-ui-backed right-click context menu. Unlike the legacy {@link ContextMenu}
 * (a free-floating popover the host opens from its own `contextmenu` handler,
 * passing `x`/`y`/`anchorEl`), bits-ui's `ContextMenu.Trigger` OWNS the
 * right-click: it wraps the trigger region and opens a portaled popover at the
 * cursor, with collision-clamping, keyboard invocation (menu key / Shift+F10),
 * dismissal, and keyboard nav handled for us.
 *
 * So the integration shape differs: the host wraps its row/tile in this
 * component's `children` snippet instead of wiring `oncontextmenu` + `bind:open`
 * + coords. Item-level API is unchanged (`MenuItem`, `${testid}-item`,
 * `data-menu-id`, danger/disabled/keepOpen). The drill-in `panel`/`panelTitle`
 * API of the legacy component is intentionally NOT carried — bits-ui is a flat
 * popover with no editor-panel morph; drill-in editors stay custom (see the
 * migration assessment / `BitsContextMenu` doc comment in the change notes).
 */
interface Props {
  /** Actions, top to bottom. */
  items: MenuItem[];
  /** Accessible label for the menu. */
  label?: string | undefined;
  /** data-testid prefix: the panel is `<prefix>`, items are `<prefix>-item`
   * (mirrors the legacy component). Defaults to `context-menu`. */
  testid?: string | undefined;
  /** Optional titled header (comp §9): uppercase `headerKind` eyebrow + `headerTitle`. */
  headerKind?: string | undefined;
  headerTitle?: string | undefined;
  /** Fired whenever the menu opens or closes (host can reset transient state on close). */
  onOpenChange?: ((open: boolean) => void) | undefined;
  /** Bindable open state, for hosts that want to observe / force-close. */
  open?: boolean | undefined;
  /** The right-clickable region. bits-ui spreads the trigger props (the
   * `contextmenu` handler, ARIA) — you MUST forward them onto your element:
   * `{#snippet children(props)}<div {...props}>…</div>{/snippet}`. */
  children: Snippet<[Record<string, unknown>]>;
}

let {
  items,
  label = 'Actions',
  testid = 'context-menu',
  headerKind,
  headerTitle,
  onOpenChange,
  open = $bindable(false),
  children,
}: Props = $props();

function handleOpenChange(next: boolean): void {
  open = next;
  onOpenChange?.(next);
}
</script>

<ContextMenu.Root bind:open onOpenChange={handleOpenChange}>
  <ContextMenu.Trigger>
    {#snippet child({ props })}
      {@render children(props)}
    {/snippet}
  </ContextMenu.Trigger>

  <ContextMenu.Portal>
    <ContextMenu.Content
      class="lunma-menu"
      collisionPadding={8}
      aria-label={label}
      data-testid={testid}
    >
      {#if headerTitle !== undefined}
        <div class="lunma-menu-header">
          {#if headerKind !== undefined}<div class="lunma-menu-kind">{headerKind}</div>{/if}
          <div class="lunma-menu-title">{headerTitle}</div>
        </div>
      {/if}
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
            >
              {#if item.icon}
                <span class="leading" aria-hidden="true"><Icon name={item.icon} size={14} /></span>
              {/if}
              <span class="label">{item.label}</span>
            </button>
          {/snippet}
        </ContextMenu.Item>
      {/each}
    </ContextMenu.Content>
  </ContextMenu.Portal>
</ContextMenu.Root>

<style>
  /* Shares the comp menu look with BitsMenu (Sidebar Redesign §9). Portaled to
   * document.body by bits-ui, so the chrome + item styles are global (mirrors
   * Tooltip). Defined here too (not shared) so each primitive is self-contained;
   * identical selectors collapse in the bundle. */
  :global(.lunma-menu) {
    width: 212px;
    box-sizing: border-box;
    padding: var(--space-1);
    background: var(--bg-elev);
    border: 1px solid var(--border);
    border-radius: 14px;
    box-shadow: var(--shadow-lg);
    z-index: var(--z-dropdown);
    transform-origin: var(--bits-context-menu-content-transform-origin);
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
