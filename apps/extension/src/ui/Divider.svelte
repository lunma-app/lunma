<script lang="ts">
import type { Snippet } from 'svelte';

interface Props {
  /** Optional trailing action rendered at the divider's right edge (e.g. a
   * ghost Button). When present the rule grows to fill and the action hugs
   * the right, matching Arc's "rule trails into a small action" composition. */
  action?: Snippet | undefined;
}

const { action }: Props = $props();
</script>

<div class="divider" data-testid="divider" role="separator">
  <span class="rule"></span>
  {#if action}
    <span class="action">{@render action()}</span>
  {/if}
</div>

<style>
  .divider {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
  }

  .rule {
    flex: 1;
    height: 1px;
    background: var(--border-soft);
  }

  .action {
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
  }
</style>
