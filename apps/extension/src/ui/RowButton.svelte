<script lang="ts">
import Icon from './Icon.svelte';

interface Props {
  icon: string;
  label: string;
  onclick: () => void;
  disabled?: boolean | undefined;
  title?: string | undefined;
  /** `aria-current` passthrough — set `'page'` on the one row representing the
   * current location (e.g. the active catalog-nav item) so assistive tech can tell
   * which row is selected when the active treatment is otherwise a CSS wash. */
  ariaCurrent?: 'page' | 'true' | 'false' | undefined;
}

const { icon, label, onclick, disabled = false, title, ariaCurrent }: Props = $props();

function handleClick(): void {
  if (disabled) return;
  onclick();
}
</script>

<button
  type="button"
  class="row-button"
  data-testid="row-button"
  {title}
  {disabled}
  aria-current={ariaCurrent}
  onclick={handleClick}
>
  <span class="icon-slot"><Icon name={icon} size={16} /></span>
  <span class="label">{label}</span>
</button>

<style>
  /* Matches the temp-tab row (`TabRow`) treatment so the New Tab affordance reads
   * as a row in the same list — same height, icon slot, title weight/colour, and
   * hover wash — just without a favicon image or a trailing close action. */
  .row-button {
    appearance: none;
    width: 100%;
    border: 0;
    margin: 0;
    background: transparent;
    color: var(--text-2);
    border-radius: var(--r-md);
    padding: 0 var(--space-3);
    height: var(--row-h);
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font: var(--weight-regular) var(--text-base) / 1 var(--font-sans);
    text-align: left;
    cursor: pointer;
    transition:
      background var(--motion-fast) var(--ease-standard),
      color var(--motion-fast) var(--ease-standard);
  }

  .row-button:hover:not(:disabled) {
    /* Same Space-hue wash as the tab/lens rows; falls back to the neutral surface
       outside a Space scope (where `--space-c-soft` isn't defined). */
    background: var(--space-c-soft, var(--surface-2));
    color: var(--text);
  }

  .row-button:active:not(:disabled) {
    background: var(--press);
  }

  .row-button:focus-visible {
    outline: var(--focus-width) solid var(--focus-color);
    outline-offset: var(--focus-offset);
  }

  .row-button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  /* 16px box mirroring TabRow's favicon slot, so the leading glyph sits exactly
   * where a temp row's favicon would — the two rows align icon-to-favicon. */
  .icon-slot {
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--favicon-size);
    height: var(--favicon-size);
    color: inherit;
    opacity: 0.85;
    transition: opacity var(--motion-fast) var(--ease-standard);
  }

  .row-button:hover:not(:disabled) .icon-slot {
    opacity: 1;
  }

  .label {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
