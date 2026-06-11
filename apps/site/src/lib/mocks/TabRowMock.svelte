<script lang="ts">
import type { FaviconSpec } from './apps';
import Favicon from './Favicon.svelte';

// A sidebar tab row, mirroring the extension's real TabRow: favicon + title,
// with the active treatment (a soft Space wash + heavier title — no accent bar),
// a drift dot, a fading/archiving state, and optional right-edge meta. --space-c
// is supplied by the surrounding stage scope. The drift dot rings in the
// surrounding substrate (--stage-bg inside a stage, falling back to --bg) — the
// extension's real dot rings in var(--bg) — so the ring reads against whatever
// the row sits on without hand-coding the colour.
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
    gap: var(--space-2);
    height: var(--row-h);
    padding: 0 var(--space-3);
    border-radius: var(--r-md);
    font-size: var(--text-base);
    color: var(--text-2);
    transition: opacity var(--motion-slow) var(--ease-emphasised);
  }

  /* Active treatment: a soft Space-coloured wash + heavier title carry it — no
   * leading accent bar (matches the extension's TabRow). */
  .row.active {
    background: var(--space-c-soft);
    color: var(--text);
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
    box-shadow: 0 0 0 1.5px var(--stage-bg, var(--bg));
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
