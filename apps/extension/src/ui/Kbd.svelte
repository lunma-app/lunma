<script lang="ts">
import type { Snippet } from 'svelte';

interface Props {
  children: Snippet;
  /** Optional spelled-out accessible name for the `<kbd>` — supply it when the
   * visible glyph is a pictograph a screen reader can't pronounce (e.g. `'Option
   * L'` for `⌥L`, `'Command'` for `⌘`), or to hide a purely decorative glyph. */
  ariaLabel?: string | undefined;
}

const { children, ariaLabel }: Props = $props();
</script>

<kbd class="kbd" aria-label={ariaLabel}>{@render children()}</kbd>

<style>
  .kbd {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    background: var(--surface-2);
    color: var(--text-muted);
    border: 1px solid var(--border-soft);
    border-radius: var(--r-xs);
    font: var(--weight-semibold) var(--text-xs) / 1 var(--font-mono);
    letter-spacing: 0.04em;
  }
</style>
