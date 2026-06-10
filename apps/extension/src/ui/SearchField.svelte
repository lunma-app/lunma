<script lang="ts" module>
/** `trigger` renders a button that opens a launcher; `input` renders a live
 * search box. Both share the pill chrome so no surface re-rolls it. */
export type SearchFieldMode = 'trigger' | 'input';
</script>

<script lang="ts">
import type { Snippet } from 'svelte';
import Icon from './Icon.svelte';
import type { IconName } from '../shared/icon-names';
import Kbd from './Kbd.svelte';

interface Props {
  /** `trigger` (a button) or `input` (a live field). Defaults to `input`. */
  mode?: SearchFieldMode;
  /** Optional content rendered between the leading icon and the input (`input`
   * mode) — e.g. a Tab-to-search engine `Chip` (launcher-tab-to-search). The
   * pill stays one primitive; surfaces compose a token into this slot rather
   * than re-rolling the field. */
  leading?: Snippet | undefined;
  /** Placeholder / trigger label. */
  placeholder?: string;
  /** Current value (bindable; `input` mode). */
  value?: string;
  /** Fired on every input event (`input` mode). */
  oninput?: ((value: string) => void) | undefined;
  /** Fired on Enter (`input` mode). */
  onenter?: (() => void) | undefined;
  /** Raw keydown passthrough (`input` mode) — for surfaces that drive a roving
   * keyboard model (e.g. forwarding `↑`/`↓` + `Escape` to a `ResultList`). Fires
   * before `onenter`; a consumer typically uses one or the other, not both. */
  onkeydown?: ((event: KeyboardEvent) => void) | undefined;
  /** Fired on click / activation (`trigger` mode). */
  onclick?: (() => void) | undefined;
  /** Leading glyph. Defaults to `search`. */
  leadingIcon?: IconName;
  /** Trailing keyboard hint (e.g. `⌥L`). Omit for none. */
  kbd?: string | undefined;
  /** Accessible name (the field has no visible label). */
  ariaLabel?: string | undefined;
  /** `data-testid` for the button / input. */
  testid?: string | undefined;
  /** Autofocus the input on mount (`input` mode). */
  autofocus?: boolean | undefined;
  /** Wire the input as an ARIA combobox over a results listbox (`input` mode) —
   * the launcher surfaces set this so screen readers announce the field as a
   * combobox with `aria-autocomplete="list"`. Pair with `controls`, `expanded`,
   * and `activeDescendant`. */
  combobox?: boolean | undefined;
  /** id of the controlled listbox (combobox `aria-controls`). */
  controls?: string | undefined;
  /** Is the results popup currently shown (combobox `aria-expanded`)? */
  expanded?: boolean | undefined;
  /** id of the active option in the listbox (combobox `aria-activedescendant`). */
  activeDescendant?: string | undefined;
}

let {
  mode = 'input',
  leading,
  placeholder = 'Search…',
  value = $bindable(''),
  oninput,
  onenter,
  onkeydown,
  onclick,
  leadingIcon = 'search',
  kbd,
  ariaLabel,
  testid = 'search-field',
  autofocus = false,
  combobox = false,
  controls,
  expanded,
  activeDescendant,
}: Props = $props();

// Bound to the live input (input mode) so a consumer can imperatively refocus —
// e.g. the new-tab launcher restoring focus after the engine chip's × unmounts
// the leading slot (launcher-tab-to-search).
let inputEl = $state<HTMLInputElement | undefined>();
export function focus(): void {
  inputEl?.focus();
}

function handleInput(event: Event): void {
  const next = (event.currentTarget as HTMLInputElement).value;
  value = next;
  oninput?.(next);
}

function handleKeydown(event: KeyboardEvent): void {
  onkeydown?.(event);
  if (event.key === 'Enter') {
    event.preventDefault();
    onenter?.();
  }
}
</script>

{#if mode === 'trigger'}
  <button
    type="button"
    class="field"
    data-mode="trigger"
    data-testid={testid}
    aria-label={ariaLabel ?? placeholder}
    onclick={() => onclick?.()}
  >
    <span class="leading"><Icon name={leadingIcon} size={15} /></span>
    <span class="text placeholder">{placeholder}</span>
    {#if kbd}<span class="trailing"><Kbd>{kbd}</Kbd></span>{/if}
  </button>
{:else}
  <div class="field" data-mode="input">
    <span class="leading"><Icon name={leadingIcon} size={15} /></span>
    {#if leading}<span class="leading-slot">{@render leading()}</span>{/if}
    <!-- svelte-ignore a11y_autofocus -->
    <input
      bind:this={inputEl}
      class="text control"
      type="text"
      {placeholder}
      {value}
      {autofocus}
      aria-label={ariaLabel}
      role={combobox ? 'combobox' : undefined}
      aria-autocomplete={combobox ? 'list' : undefined}
      aria-expanded={combobox ? (expanded ?? false) : undefined}
      aria-controls={combobox ? controls : undefined}
      aria-activedescendant={combobox ? activeDescendant : undefined}
      data-testid={testid}
      autocomplete="off"
      oninput={handleInput}
      onkeydown={handleKeydown}
    />
    {#if kbd}<span class="trailing"><Kbd>{kbd}</Kbd></span>{/if}
  </div>
{/if}

<style>
  .field {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    gap: var(--space-2);
    width: 100%;
    min-width: 0;
    height: var(--control-h-md);
    padding: 0 var(--space-3);
    background: var(--surface);
    color: var(--text-muted);
    border: 1px solid var(--border-soft);
    border-radius: var(--r-pill);
    transition:
      background var(--motion-fast) var(--ease-standard),
      border-color var(--motion-fast) var(--ease-standard),
      box-shadow var(--motion-base) var(--ease-standard);
  }

  /* Trigger reads as a button but looks like the field. */
  .field[data-mode='trigger'] {
    appearance: none;
    margin: 0;
    cursor: text;
    text-align: left;
  }
  .field:hover {
    background: var(--surface-2);
    border-color: var(--border);
  }

  /* Input mode is a frosted-glass pill for immersive surfaces (the new-tab
   * home): the --glass-bg fill + backdrop blur + highlight at rest, lifting to
   * the more-opaque --glass-bg-strong on hover. Trigger mode keeps the opaque
   * --surface fill (the sidebar shell head), so this never alters SearchTrigger. */
  .field[data-mode='input'] {
    background: var(--glass-bg);
    -webkit-backdrop-filter: blur(var(--glass-blur));
    backdrop-filter: blur(var(--glass-blur));
    border-color: var(--glass-border);
    box-shadow: var(--glass-highlight);
  }
  .field[data-mode='input']:hover {
    background: var(--glass-bg-strong);
    border-color: var(--glass-border);
  }

  .leading {
    flex: 0 0 auto;
    display: inline-flex;
    color: var(--text-dim);
  }
  /* Hosts a composed leading token (e.g. the Tab-to-search engine chip) between
   * the icon and the input. Holds its intrinsic size so the input keeps the rest
   * of the pill; the token itself ellipsises if it must. */
  .leading-slot {
    flex: 0 1 auto;
    min-width: 0;
    display: inline-flex;
    align-items: center;
  }
  .trailing {
    flex: 0 0 auto;
    display: inline-flex;
  }

  .text {
    flex: 1;
    min-width: 0;
    font: var(--weight-regular) var(--text-base) / 1 var(--font-sans);
  }
  .placeholder {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Bare input — the pill is the chrome. */
  .control {
    appearance: none;
    border: 0;
    background: transparent;
    color: var(--text);
    padding: 0;
  }
  .control::placeholder {
    color: var(--text-muted);
  }
  .control:focus {
    outline: none;
  }

  /* Trigger focus: the single focus-ring convention (auto-hue inside .sidebar
   * via --focus-color → --accent). Input focus rings the whole pill plus the
   * soft Space glow. */
  .field[data-mode='trigger']:focus-visible {
    outline: var(--focus-width) solid var(--focus-color);
    outline-offset: var(--focus-offset);
  }
  .field[data-mode='input']:focus-within {
    border-color: oklch(from var(--accent) l c h / 0.55);
    box-shadow:
      var(--glass-highlight),
      0 0 0 3px var(--accent-soft),
      var(--glow-space-soft);
  }
</style>
