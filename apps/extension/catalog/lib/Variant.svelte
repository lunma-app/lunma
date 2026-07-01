<script lang="ts">
import type { Snippet } from 'svelte';

interface Props {
  /** The variant's caption (e.g. `primary · sm · disabled`). */
  label: string;
  /** The rendered primitive(s) for this cell. */
  children: Snippet;
}

const { label, children }: Props = $props();
</script>

<figure class="variant">
  <div class="stage">{@render children()}</div>
  <figcaption>{label}</figcaption>
</figure>

<style>
  /* A labeled glass tile: the primitive is read against the real frosted-glass
   * substrate (the `.lunma-glass` recipe from @lunma/tokens), not a white card,
   * so its on-glass contrast is visible. The fill lives on `::before` rather
   * than `.variant` itself: `backdrop-filter` on `.variant` would make it a
   * stacking context, trapping a child popover's z-index (e.g. MultiSelect's)
   * below whichever sibling tile comes later in the Examples grid's DOM order.
   */
  .variant {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    padding: var(--space-4);
    border-radius: var(--r-lg);
  }
  .variant::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: var(--glass-bg);
    -webkit-backdrop-filter: blur(var(--glass-blur));
    backdrop-filter: blur(var(--glass-blur));
    border: 1px solid var(--glass-border);
    box-shadow: var(--glass-highlight), var(--shadow-md);
  }

  .stage {
    position: relative;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-3);
    min-height: 2.5rem;
  }

  figcaption {
    position: relative;
    font-size: var(--text-xs);
    color: var(--text-muted);
    font-family: var(--font-mono);
  }
</style>
