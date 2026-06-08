<script lang="ts" module>
import type { Tint } from '../shared/settings';

/** Aurora intensity tracks the tint level. */
export type AuroraIntensity = Tint;

/** Tint → overall opacity. `vivid` is the full backdrop; the calmer levels fade
 * it back. Mirrors the `[data-tint]` `--aurora-opacity` overrides. */
const INTENSITY_OPACITY: Record<Tint, number> = {
  subtle: 0.22,
  standard: 0.5,
  vivid: 0.9,
};
</script>

<script lang="ts">
import { onMount } from 'svelte';

interface Props {
  /** Maps to the overall opacity. When omitted, inherits `--aurora-opacity`
   * from the scope (the `[data-tint]` rules set it per tint level). */
  intensity?: AuroraIntensity | undefined;
}

const { intensity }: Props = $props();

const opacity = $derived(intensity ? INTENSITY_OPACITY[intensity] : undefined);

// Reflect reduced-motion so the drift can be observed/disabled. The CSS
// `@media (prefers-reduced-motion)` rule is the real gate; this attribute makes
// the behaviour assertable and mirrors the user preference in the DOM.
let reduced = $state(false);
onMount(() => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  reduced = mq.matches;
  const onChange = (e: MediaQueryListEvent): void => {
    reduced = e.matches;
  };
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
});

// Each blob's colour reads the scoped `--space-l` / `--space-chroma` / `--space-h`,
// so the whole backdrop recolours with the active Space's TRUE colour (a small
// `+0.04` lightness lift over `--space-l` keeps the blob a touch brighter than
// the wash, as before) and a `gray` Space washes neutral. Declared inline (not in
// the stylesheet) so the parameterisation is visible in the DOM. Falls back to the
// resting ember when unscoped.
function blob(alpha: number): string {
  return `oklch(clamp(0, calc(var(--space-l, 0.62) + 0.04), 1) var(--space-chroma, 0.15) var(--space-h, 62) / ${alpha})`;
}
</script>

<div
  class="aurora"
  aria-hidden="true"
  data-testid="aurora"
  data-intensity={intensity ?? 'inherit'}
  data-motion={reduced ? 'reduced' : 'full'}
  style:--aurora-opacity={opacity !== undefined ? String(opacity) : null}
>
  <span class="blob blob-1" style:--blob-c={blob(0.55)}></span>
  <span class="blob blob-2" style:--blob-c={blob(0.42)}></span>
  <span class="blob blob-3" style:--blob-c={blob(0.5)}></span>
  <span class="grain"></span>
</div>

<style>
  /* An ambient, behind-everything backdrop. Never interactive, never read by a
   * screen reader. Three slow-drifting hue blobs over a faint grain overlay. */
  .aurora {
    position: absolute;
    inset: 0;
    z-index: var(--z-base);
    overflow: hidden;
    pointer-events: none;
    opacity: var(--aurora-opacity, 0.9);
    /* Cross-fade with the active Space (alongside the substrate transition). */
    transition: opacity var(--motion-slow) var(--ease-emphasised);
  }

  .blob {
    position: absolute;
    width: 75%;
    height: 75%;
    border-radius: var(--r-pill);
    background: radial-gradient(closest-side, var(--blob-c), transparent 72%);
    filter: blur(8px);
    will-change: transform;
  }
  .blob-1 {
    top: -20%;
    left: -10%;
    animation: aurora-drift-1 30s var(--ease-standard) infinite alternate;
  }
  .blob-2 {
    top: 10%;
    right: -20%;
    animation: aurora-drift-2 34s var(--ease-standard) infinite alternate;
  }
  .blob-3 {
    bottom: -25%;
    left: 20%;
    animation: aurora-drift-3 38s var(--ease-standard) infinite alternate;
  }

  /* Faint film grain so the gradients don't band on large flat fills. A tiny
   * inline SVG turbulence, tiled and barely visible. */
  .grain {
    position: absolute;
    inset: 0;
    opacity: 0.04;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-size: 120px 120px;
  }

  @keyframes aurora-drift-1 {
    to {
      transform: translate3d(8%, 10%, 0) scale(1.1);
    }
  }
  @keyframes aurora-drift-2 {
    to {
      transform: translate3d(-10%, 8%, 0) scale(1.08);
    }
  }
  @keyframes aurora-drift-3 {
    to {
      transform: translate3d(6%, -8%, 0) scale(1.12);
    }
  }

  /* Reduced motion: the blobs sit at their base positions, no drift. The end
   * state is identical to the animated start frame. */
  @media (prefers-reduced-motion: reduce) {
    .blob {
      animation: none;
    }
  }
  .aurora[data-motion='reduced'] .blob {
    animation: none;
  }
</style>
