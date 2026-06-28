<script lang="ts">
import type { ResultSource } from '../shared/launcher-contract';
import { sourceBadgeLabel } from '../shared/launcher-contract';
import Favicon from './Favicon.svelte';

interface Props {
  /** Result title — the row's primary scan target. */
  title: string;
  /** Result URL — shown dimmed + ellipsised, and the row's hover title. */
  url: string;
  /** Which provider the result came from — drives the source badge. */
  source: ResultSource;
  /** Favicon URL (e.g. from `faviconFor`). Forwarded to the composed `Favicon`,
   * which falls back to a globe on error/absence (the launcher source is already
   * the `_favicon` endpoint, so there is no distinct staged fallback). */
  faviconSrc?: string | undefined;
  /** Roving keyboard selection: soft accent wash + leading accent marker. */
  selected?: boolean | undefined;
  /** Tab-dedup: the result's URL is already open in the active Space. Renders a
   * muted "already open" line beneath the title (Enter switches to that tab,
   * Shift+Enter forces a new one). Only set for dedup-eligible sources. */
  alreadyOpen?: boolean | undefined;
  /** Cross-Space marker (launcher-fuzzy-smart-folders): the foreign Space's name,
   * set only when the result lives in a Space other than the one being viewed.
   * Its presence renders the colour-dot + name chip. */
  spaceName?: string | undefined;
  /** The foreign Space's colour as an `oklch(…)` string — paints the chip's dot. */
  spaceColor?: string | undefined;
  /** Stable DOM id for the option — the combobox input points its
   * `aria-activedescendant` here when this row is the roving selection. */
  id?: string | undefined;
  /** Whole-row click (acts on the result). */
  onclick?: (() => void) | undefined;
  /** Pointer entered the row — surfaces use it to move the roving selection here. */
  onhover?: (() => void) | undefined;
}

const {
  title,
  url,
  source,
  faviconSrc,
  selected = false,
  alreadyOpen = false,
  spaceName,
  spaceColor,
  id,
  onclick,
  onhover,
}: Props = $props();
</script>

<button
  type="button"
  class="result-row"
  class:selected
  class:already-open={alreadyOpen}
  {id}
  role="option"
  aria-selected={selected}
  data-testid="result-row"
  data-source={source}
  data-selected={selected}
  data-already-open={alreadyOpen}
  title={url}
  onclick={() => onclick?.()}
  onmouseenter={() => onhover?.()}
>
  <span class="favicon">
    <Favicon src={faviconSrc} size={16} />
  </span>
  <span class="title-block">
    <span class="title">{title}</span>
    {#if alreadyOpen}
      <!-- Secondary metadata (tab-dedup): plain muted text, not a chip. -->
      <span class="already-open" data-testid="result-already-open">already open</span>
    {/if}
  </span>
  <span class="meta">
    {#if spaceName}
      <!-- Cross-Space marker: a dot in the foreign Space's colour + its name. The
           name carries the meaning (colour is a secondary cue), so AA holds. -->
      <span class="space-chip" data-testid="result-space" title={`In ${spaceName}`}>
        <span class="space-dot" style:background={spaceColor}></span>
        <span class="space-name">{spaceName}</span>
      </span>
    {/if}
    <span class="badge" data-testid="result-badge">{sourceBadgeLabel(source)}</span>
  </span>
  <span class="url">{url}</span>
</button>

<style>
  .result-row {
    position: relative;
    appearance: none;
    width: 100%;
    border: 0;
    margin: 0;
    background: transparent;
    color: var(--text-2);
    border-radius: var(--r-md);
    padding: 0 var(--space-3);
    height: var(--row-h);
    /* Single line (Compact / Normal) — a CSS grid that reproduces the former
     * flex row: favicon · title · badge cluster left, the url takes the
     * remaining width and ellipsises (the flexible track). */
    display: grid;
    grid-template-columns: auto minmax(0, auto) auto minmax(0, 1fr);
    grid-template-areas: 'favicon title badge url';
    align-items: center;
    column-gap: var(--space-2);
    text-align: left;
    cursor: pointer;
    transition: background var(--motion-fast) var(--ease-standard),
      color var(--motion-fast) var(--ease-standard);
  }

  /* An "already open" row carries a second (secondary) line beneath its title, so
   * the fixed single-line --row-h would clip it — let it grow with light vertical
   * padding (the Comfort layout below is already auto-height + padded). */
  .result-row.already-open {
    height: auto;
    padding-top: var(--space-1);
    padding-bottom: var(--space-1);
  }

  /* Comfort — a roomy two-line row built for scanning: the title (+ type badge)
   * on line 1, the url tiny + dimmed on line 2, the favicon spanning both rows.
   * Auto-height (the 40px Comfort tab token would clip the second line) with
   * symmetric ~--space-2 vertical padding. Keyed on the ambient density — no
   * per-row prop, exactly as TabRow inherits --row-h. */
  :global(:root[data-density='comfort']) .result-row {
    grid-template-columns: auto minmax(0, 1fr) auto;
    grid-template-areas:
      'favicon title badge'
      'favicon url   url';
    height: auto;
    padding: var(--space-2) var(--space-3);
    row-gap: var(--row-gap);
  }

  .result-row:hover {
    background: var(--hover);
    color: var(--text);
  }

  .result-row:active {
    background: var(--press);
  }

  /* Roving keyboard selection wins over hover: the soft accent wash alone — no
     leading accent bar (matches the overlay + sidebar tab row's wash-only selection). */
  .result-row.selected {
    background: var(--accent-soft);
    color: var(--text);
  }

  .result-row:focus-visible {
    outline: var(--focus-width) solid var(--focus-color);
    outline-offset: var(--focus-offset);
  }

  .favicon {
    grid-area: favicon;
    /* Vertically centred — across both rows in the Comfort two-line layout. */
    align-self: center;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--favicon-size);
    height: var(--favicon-size);
    color: var(--text-muted);
    opacity: 0.9;
  }

  /* The title cell stacks the title over the optional "already open" line. A
   * single-line row (no secondary text) reads identically to before — the column
   * collapses to just the title. */
  .title-block {
    grid-area: title;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 1px;
  }

  .title {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font: var(--weight-medium) var(--text-base) / 1 var(--font-sans);
    color: inherit;
  }

  /* Secondary metadata for a deduped result — same muted/size register as the
   * url line (the list's other secondary text), never a chip. */
  .already-open {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font: var(--weight-regular) var(--text-sm) / 1 var(--font-sans);
    color: var(--text-muted);
  }

  /* The trailing meta cluster: an optional cross-Space chip, then the source badge. */
  .meta {
    grid-area: badge;
    align-self: center;
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
  }

  /* Cross-Space marker — a colour dot in the foreign Space's identity colour plus
   * its name. Quieter than the source badge (no filled background) so it reads as
   * a location hint, not a second source label. */
  .space-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-width: 0;
  }
  .space-dot {
    flex: 0 0 auto;
    width: 7px;
    height: 7px;
    border-radius: var(--r-pill);
    /* `background` is the Space's resolved `oklch(…)`, set inline from data. */
  }
  .space-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    font: var(--weight-semibold) var(--text-2xs) / 1 var(--font-sans);
    color: var(--text-dim);
  }

  /* Tiny uppercased source chip — quiet identity for where the result came from. */
  .badge {
    align-self: center;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    font: var(--weight-semibold) var(--text-2xs) / 1 var(--font-sans);
    color: var(--text-dim);
    background: var(--surface-2);
    border-radius: var(--r-sm);
    padding: 3px 5px;
  }

  .url {
    grid-area: url;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font: var(--weight-regular) var(--text-sm) / 1 var(--font-sans);
    color: var(--text-muted);
  }

</style>
