<script lang="ts" module>
/** Panel treatments. `glass` is the frosted immersive panel (backdrop blur +
 * hue-tinted fill + highlight); `elevated` is an opaque raised card; `flat` is
 * a quiet inset surface. */
export type SurfaceVariant = 'glass' | 'elevated' | 'flat';
/** Corner radius, mapped to the `--r-*` token scale. */
export type SurfaceRadius = 'sm' | 'md' | 'lg' | 'xl';
</script>

<script lang="ts">
import type { Snippet } from 'svelte';

interface Props {
  /** Panel treatment. Defaults to the frosted `glass`. */
  variant?: SurfaceVariant | undefined;
  /** Corner radius token. Defaults to `lg`. */
  radius?: SurfaceRadius | undefined;
  /** Add the soft active-Space hue glow (`--glow-space-soft`). */
  glow?: boolean | undefined;
  /** `data-testid` passthrough. */
  testid?: string | undefined;
  children: Snippet;
}

const { variant = 'glass', radius = 'lg', glow = false, testid, children }: Props = $props();
</script>

<div
  class="surface"
  data-variant={variant}
  data-glow={glow ? 'true' : 'false'}
  data-testid={testid}
  style:--surface-radius={`var(--r-${radius})`}
>
  {@render children()}
</div>

<style>
  /* The one place the immersive chrome (glass blur, border highlight, shadow,
   * radius) is expressed. Every card / menu / overlay panel composes this so
   * none of them re-roll `backdrop-filter`. `--surface-glow` is a no-op shadow
   * unless `glow` is set, so it slots into each variant's shadow list cleanly. */
  .surface {
    position: relative;
    border-radius: var(--surface-radius);
    --surface-glow: 0 0 transparent;
  }
  .surface[data-glow='true'] {
    --surface-glow: var(--glow-space-soft);
  }

  .surface[data-variant='glass'] {
    background: var(--glass-bg);
    -webkit-backdrop-filter: blur(var(--glass-blur));
    backdrop-filter: blur(var(--glass-blur));
    border: 1px solid var(--glass-border);
    box-shadow: var(--glass-highlight), var(--surface-glow), var(--shadow-md);
  }
  .surface[data-variant='elevated'] {
    background: var(--surface-2);
    border: 1px solid var(--border-soft);
    box-shadow: var(--surface-glow), var(--shadow-lg);
  }
  .surface[data-variant='flat'] {
    background: var(--surface);
    border: 1px solid var(--border-soft);
    box-shadow: var(--surface-glow);
  }
</style>
