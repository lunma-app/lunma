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

<figure class="variant lunma-glass">
  <div class="stage">{@render children()}</div>
  <figcaption>{label}</figcaption>
</figure>

<style>
  /* A labeled glass tile: the primitive is read against the real frosted-glass
   * substrate (the `.lunma-glass` recipe from @lunma/tokens), not a white card,
   * so its on-glass contrast is visible. */
  .variant {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    padding: var(--space-4);
    border-radius: var(--r-lg);
  }

  .stage {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-3);
    min-height: 2.5rem;
  }

  figcaption {
    font-size: var(--text-xs);
    color: var(--text-muted);
    font-family: var(--font-mono);
  }
</style>
