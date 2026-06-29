<script lang="ts">
// Diffstat (review-lens, D8): mono `+N −N` numerals over a proportional two-tone
// bar. The magnitude is NEVER colour-only — the numerals always render beside the
// bar (WCAG-AA). Collapses to nothing when no diff size is known (no `+0 −0`).
// Reads tokens only.
interface Props {
  additions?: number | undefined;
  deletions?: number | undefined;
}

const { additions, deletions }: Props = $props();

// When BOTH sides are absent the component renders nothing; a present-but-zero
// side still renders its `0`.
const hasAny = $derived(additions !== undefined || deletions !== undefined);
const total = $derived((additions ?? 0) + (deletions ?? 0));
// The bar proportion; a zero total leaves both segments empty (the track shows).
const addPct = $derived(total > 0 ? `${((additions ?? 0) / total) * 100}%` : '0%');
const delPct = $derived(total > 0 ? `${((deletions ?? 0) / total) * 100}%` : '0%');

// Explicit additions/deletions label so the numerals don't rely on the `+`/`−`
// glyphs (which screen readers suppress at default punctuation verbosity). The
// `.nums` span becomes a `role="img"` named by this string, omitting an absent
// side; the visible numerals are unchanged (DIFFSTAT-01).
const numsLabel = $derived(
  [
    additions !== undefined ? `${additions} addition${additions === 1 ? '' : 's'}` : undefined,
    deletions !== undefined ? `${deletions} deletion${deletions === 1 ? '' : 's'}` : undefined,
  ]
    .filter((part) => part !== undefined)
    .join(', '),
);
</script>

{#if hasAny}
  <span class="diffstat" data-testid="diffstat">
    <span class="nums" role="img" aria-label={numsLabel}>
      {#if additions !== undefined}<span class="add">+{additions}</span>{/if}
      {#if deletions !== undefined}<span class="del">−{deletions}</span>{/if}
    </span>
    <span class="bar" aria-hidden="true">
      <span class="seg seg-add" style:width={addPct}></span>
      <span class="seg seg-del" style:width={delPct}></span>
    </span>
  </span>
{/if}

<style>
  .diffstat {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
  }

  .nums {
    display: inline-flex;
    align-items: baseline;
    gap: var(--space-1);
    font-family: var(--font-mono);
    font-size: var(--text-2xs);
    font-weight: var(--weight-medium);
    font-variant-numeric: tabular-nums;
  }
  .add {
    color: var(--success);
  }
  .del {
    color: var(--danger);
  }

  /* Proportional two-tone bar on a neutral track. */
  .bar {
    display: inline-flex;
    width: 48px;
    height: 6px;
    border-radius: var(--r-pill);
    background: var(--surface-3);
    overflow: hidden;
  }
  .seg {
    height: 100%;
  }
  .seg-add {
    background: var(--success);
  }
  .seg-del {
    background: var(--danger);
  }
</style>
