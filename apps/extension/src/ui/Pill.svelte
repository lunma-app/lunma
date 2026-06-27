<script lang="ts">
import type { Snippet } from 'svelte';

/**
 * A token-tinted pill (lens-overview) — the redesign's status / priority /
 * verdict / genre chip. An accent pill is hue-tinted via the theme-aware
 * `--accent-text-l` (label lightness) + `--accent-fill-a` (fill alpha) tokens, so
 * it stays legible in dark AND light without per-pill colour branches; omit `hue`
 * for the neutral grey pill (`--text-muted` on `--surface-3`). `sm` is the small
 * status/priority pill; `md` is the larger Change verdict pill.
 *
 * The hue is passed as a number (OKLCH degrees) and applied as the `--pill-h`
 * custom property, so the colour is one token expression, not a per-call literal.
 */
interface Props {
  /** Accent hue in OKLCH degrees (e.g. 150 = green, 25 = red). Omit → neutral. */
  hue?: number | undefined;
  /** `sm` (10px) is the default status/priority pill; `md` (11px/600) is the
   * larger Change verdict pill. */
  size?: 'sm' | 'md' | undefined;
  /** `data-testid` passthrough. */
  testid?: string | undefined;
  children: Snippet;
}

const { hue, size = 'sm', testid, children }: Props = $props();
</script>

<span
  class="pill"
  class:accent={hue !== undefined}
  data-size={size}
  data-testid={testid}
  style:--pill-h={hue !== undefined ? String(hue) : undefined}
>
  {@render children()}
</span>

<style>
  .pill {
    display: inline-flex;
    align-items: center;
    border-radius: var(--r-pill);
    white-space: nowrap;
    /* Neutral default — overridden by `.accent`. */
    color: var(--text-muted);
    background: var(--surface-3);
  }
  /* Small status/priority pill. */
  .pill[data-size='sm'] {
    padding: 2px 9px;
    font: var(--weight-medium) var(--text-2xs) / 1.3 var(--font-sans);
  }
  /* Larger Change verdict pill. */
  .pill[data-size='md'] {
    padding: 3px 11px;
    font: var(--weight-semibold) var(--text-xs) / 1.3 var(--font-sans);
  }
  /* Accent (hue-tinted) — theme-aware via the accent-pill tokens. */
  .pill.accent {
    color: oklch(var(--accent-text-l) 0.1 var(--pill-h));
    background: oklch(0.55 0.13 var(--pill-h) / var(--accent-fill-a));
  }
</style>
