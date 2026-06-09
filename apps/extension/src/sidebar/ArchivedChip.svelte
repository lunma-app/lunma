<script lang="ts">
import type { IconName, SpaceId } from '../shared/types';
import Icon from '../ui/Icon.svelte';
import { useStore } from './store-context.svelte';

interface Props {
  /** The Space whose archived count this chip reflects (per-panel). */
  spaceId: SpaceId;
  /** Open the archived list (the options "Recently archived" subpage). */
  onOpen: () => void;
}

const { spaceId, onOpen }: Props = $props();
const store = useStore();

// This Space's archived-tab count. The chip — and thus the whole affordance —
// renders only when there is something to restore (collapse-when-empty).
const count = $derived(store.state.archivedTabs.filter((e) => e.spaceId === spaceId).length);
</script>

{#if count > 0}
  <button
    type="button"
    class="archived-chip"
    data-testid="archived-chip"
    title="Recently archived — open in Settings"
    aria-label={`Recently archived (${count})`}
    onclick={onOpen}
  >
    <Icon name={'archive' as IconName} size={13} />
    <span class="count">{count}</span>
  </button>
{/if}

<style>
  /* A quiet, low-emphasis affordance: archived tabs are receded, so the chip sits
   * back (muted) until hovered/focused. Tokens only. */
  .archived-chip {
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    height: var(--control-h-sm);
    padding: 0 var(--space-2);
    border: 1px solid transparent;
    border-radius: var(--r-pill);
    background: transparent;
    color: var(--text-dim);
    font: var(--weight-medium) var(--text-xs) / 1 var(--font-sans);
    cursor: pointer;
    transition:
      background var(--motion-fast) var(--ease-standard),
      color var(--motion-fast) var(--ease-standard),
      transform var(--motion-fast) var(--ease-standard);
  }
  .archived-chip:hover {
    background: var(--hover);
    color: var(--text-2);
  }
  /* Positioning + the :active press-scale are owned by `.new-tab-row .archived-chip`
   * in app.css (so the press transform composes with the absolute-centering
   * translate); this primitive only styles its look + focus. */
  .archived-chip:focus-visible {
    outline: var(--focus-width) solid var(--focus-color);
    outline-offset: var(--focus-offset);
  }
  .count {
    font-variant-numeric: tabular-nums;
  }

  @media (prefers-reduced-motion: reduce) {
    .archived-chip {
      transition:
        background var(--motion-fast) var(--ease-standard),
        color var(--motion-fast) var(--ease-standard);
    }
  }
</style>
