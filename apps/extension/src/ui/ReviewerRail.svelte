<script lang="ts">
import Avatar from './Avatar.svelte';
import Icon from './Icon.svelte';

// ReviewerRail (review-lens, D8): a leading blocking-wins verdict glyph followed
// by overlapped reviewer Avatars (ring = each reviewer's state) with a `+N`
// overflow past `max`. Composes Avatar so the disc never re-rolls. Reads tokens
// only. An empty reviewer list renders nothing.
type Verdict = 'approved' | 'changes' | 'pending';

interface Reviewer {
  initials: string;
  state?: Verdict | undefined;
  title?: string | undefined;
}

interface Props {
  reviewers: Reviewer[];
  /** How many avatars to show before collapsing the rest into `+N`. */
  max?: number | undefined;
  /** Accessible name for the reviewer cluster (e.g. `'Reviewers'`). When set, the
   * rail becomes a named `role="group"` so assistive tech announces the discs as a
   * labelled collection rather than loose, context-free items. */
  ariaLabel?: string | undefined;
}

const { reviewers, max = 4, ariaLabel }: Props = $props();

// Blocking-wins (D5): `changes` > `pending` > `approved`. An unknown state
// counts as `pending` (never fabricated). The glyph maps to the curated lucide
// set — `circle-alert` (! / changes), `clock` (◷ / pending), `check` (✓ /
// approved) — paired with a colour so nothing is colour-only (WCAG-AA).
const VERDICT_ICON: Record<Verdict, { icon: string; color: string; label: string }> = {
  changes: { icon: 'circle-alert', color: 'var(--danger)', label: 'Changes requested' },
  pending: { icon: 'clock', color: 'var(--text-dim)', label: 'Review pending' },
  approved: { icon: 'check', color: 'var(--success)', label: 'Approved' },
};

const leadVerdict = $derived.by<Verdict | null>(() => {
  if (reviewers.length === 0) return null;
  const states = reviewers.map((r) => r.state ?? 'pending');
  if (states.includes('changes')) return 'changes';
  if (states.includes('pending')) return 'pending';
  return 'approved';
});

const shown = $derived(reviewers.slice(0, max));
const overflow = $derived(Math.max(0, reviewers.length - max));
</script>

{#if leadVerdict !== null}
  <span
    class="rail"
    data-testid="reviewer-rail"
    role={ariaLabel ? 'group' : undefined}
    aria-label={ariaLabel}
  >
    <span class="verdict" data-verdict={leadVerdict}>
      <Icon name={VERDICT_ICON[leadVerdict].icon} size={14} color={VERDICT_ICON[leadVerdict].color} label={VERDICT_ICON[leadVerdict].label} />
    </span>
    <span class="discs">
      {#each shown as reviewer (reviewer.initials)}
        <span class="disc">
          <Avatar initials={reviewer.initials} size="sm" ring={reviewer.state ?? 'pending'} title={reviewer.title} />
        </span>
      {/each}
      {#if overflow > 0}
        <!-- `role="img"` + `aria-label` so the badge announces "N more reviewers"
             rather than a bare "+N"; a generic <span> would not reliably expose an
             author-supplied name (REVIEWERRAIL-01). -->
        <span
          class="overflow"
          data-testid="reviewer-overflow"
          role="img"
          aria-label={`${overflow} more reviewers`}>+{overflow}</span>
      {/if}
    </span>
  </span>
{/if}

<style>
  .rail {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
  }

  .verdict {
    display: inline-flex;
    align-items: center;
  }

  .discs {
    display: inline-flex;
    align-items: center;
  }

  /* Overlap the discs; an outer surface ring separates adjacent discs so the
   * overlap reads as a stack, not a smear. The first disc has no inset. */
  .disc + .disc {
    margin-left: -6px;
  }
  .disc :global(.avatar) {
    outline: 2px solid var(--surface);
  }

  .overflow {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-left: var(--space-1);
    color: var(--text-dim);
    font-family: var(--font-sans);
    font-size: var(--text-2xs);
    font-weight: var(--weight-medium);
  }
</style>
