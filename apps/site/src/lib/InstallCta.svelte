<script lang="ts">
import type { Snippet } from 'svelte';
import { LAUNCHED } from '$lib/links';

// The install call-to-action, composed from shared tokens. `fill` is the
// single highest-emphasis action (accent fill + hue glow); `ghost` is the
// quieter secondary. Hover lifts + intensifies the glow, active presses, and
// the global focus-visible ring applies.
//
// Pre-launch (`LAUNCHED === false`): there is no store listing to point at, so
// the primary (`fill`) CTA renders a non-interactive "coming soon" pill instead
// of a dead link, and the secondary (`ghost`, the Edge button) is omitted. At
// launch the flag flips and these become live install links with no edit here.
interface Props {
  href: string;
  variant?: 'fill' | 'ghost';
  compact?: boolean;
  /** Label shown in the pre-launch state (fill variant only). */
  soonLabel?: string;
  children: Snippet;
}

let {
  href,
  variant = 'fill',
  compact = false,
  soonLabel = 'Coming to the Chrome Web Store',
  children,
}: Props = $props();
</script>

{#if LAUNCHED}
  <a class="cta {variant}" class:compact {href} target="_blank" rel="noopener">
    {@render children()}
  </a>
{:else if variant === 'fill'}
  <span class="cta fill soon" class:compact aria-disabled="true">{soonLabel}</span>
{/if}

<style>
  .cta {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    padding: 13px 24px;
    border-radius: var(--r-pill);
    font-family: var(--font-sans);
    font-size: var(--text-lg);
    font-weight: var(--weight-semibold);
    line-height: 1;
    text-decoration: none;
    white-space: nowrap;
    cursor: pointer;
    transition:
      transform var(--motion-base) var(--ease-emphasised),
      box-shadow var(--motion-base) var(--ease-emphasised),
      background var(--motion-base) var(--ease-emphasised),
      color var(--motion-slow) var(--ease-emphasised);
  }

  .cta.compact {
    padding: 10px 18px;
    font-size: var(--text-md);
  }

  .fill {
    background: var(--accent);
    color: var(--accent-on);
    box-shadow: var(--glow-space);
  }

  .fill:hover {
    transform: translateY(-1px);
    box-shadow: var(--glow-space), var(--shadow-md);
  }

  .fill:active {
    transform: scale(var(--press-scale));
  }

  /* Pre-launch state: a quiet, non-interactive pill — reads as "coming", not as a
   * broken button. No accent fill, no glow, default cursor. */
  .soon {
    background: var(--surface);
    color: var(--text-2);
    border: 1px solid var(--border);
    box-shadow: none;
    cursor: default;
  }
  .soon:hover {
    transform: none;
    box-shadow: none;
  }

  .ghost {
    color: var(--text-2);
    border: 1px solid var(--border);
  }

  .ghost:hover {
    background: var(--surface);
    color: var(--text);
  }

  .ghost:active {
    transform: scale(var(--press-scale));
  }
</style>
