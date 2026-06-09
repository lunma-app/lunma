<script lang="ts">
import type { FaviconSpec } from './apps';
import Favicon from './Favicon.svelte';

// A sidebar tab row, mirroring the extension's real TabRow: favicon + title,
// with the active treatment (soft Space wash + a 3px gradient leading bar in
// --space-c), a drift dot, a fading/archiving state, and optional right-edge
// meta. --space-c is supplied by the surrounding stage scope.
interface Props {
  title: string;
  fav: FaviconSpec;
  active?: boolean;
  fading?: boolean;
  drifted?: boolean;
  meta?: string;
}

let { title, fav, active = false, fading = false, drifted = false, meta }: Props = $props();
</script>

<div class="row" class:active class:fading>
  <span class="slot" class:drifted>
    <Favicon {fav} size={16} />
  </span>
  <span class="title">{title}</span>
  {#if meta}<span class="meta">{meta}</span>{/if}
</div>

<style>
  .row {
    position: relative;
    display: flex;
    align-items: center;
    gap: 9px;
    height: var(--row-h);
    padding: 0 var(--space-3);
    border-radius: var(--r-md);
    font-size: var(--text-base);
    color: var(--text-2);
    transition: opacity var(--motion-slow) var(--ease-emphasised);
  }

  /* Leading accent bar — inset 5px, faded top/bottom, in the Space colour. */
  .row::before {
    content: '';
    position: absolute;
    left: 5px;
    top: 50%;
    transform: translateY(-50%) scaleY(0);
    width: 3px;
    height: 18px;
    border-radius: var(--r-pill);
    background: linear-gradient(
      180deg,
      transparent 0%,
      var(--space-c) 28%,
      var(--space-c) 72%,
      transparent 100%
    );
    opacity: 0.9;
  }

  .row.active {
    background: var(--space-c-soft);
    color: var(--text);
  }
  .row.active::before {
    transform: translateY(-50%) scaleY(1);
  }
  .row.active .title {
    font-weight: var(--weight-semibold);
  }

  .row.fading {
    opacity: 0.4;
  }

  .slot {
    position: relative;
    display: inline-flex;
    opacity: 0.85;
  }
  .row.active .slot {
    opacity: 1;
  }

  .slot.drifted::after {
    content: '';
    position: absolute;
    right: -2px;
    bottom: -2px;
    width: 7px;
    height: 7px;
    border-radius: var(--r-pill);
    background: var(--space-c);
    box-shadow: 0 0 0 1.5px oklch(0.17 0.008 var(--space-h));
  }

  .title {
    flex: 1 1 auto;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .meta {
    flex: none;
    font-size: var(--text-xs);
    color: var(--text-faint);
  }
</style>
