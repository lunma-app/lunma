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
  /** Stable DOM id for the option — the combobox input points its
   * `aria-activedescendant` here when this row is the roving selection. */
  id?: string | undefined;
  /** Whole-row click (acts on the result). */
  onclick?: (() => void) | undefined;
  /** Pointer entered the row — surfaces use it to move the roving selection here. */
  onhover?: (() => void) | undefined;
}

const { title, url, source, faviconSrc, selected = false, id, onclick, onhover }: Props = $props();
</script>

<button
  type="button"
  class="result-row"
  class:selected
  {id}
  role="option"
  aria-selected={selected}
  data-testid="result-row"
  data-source={source}
  data-selected={selected}
  title={url}
  onclick={() => onclick?.()}
  onmouseenter={() => onhover?.()}
>
  <span class="favicon">
    <Favicon src={faviconSrc} size={16} />
  </span>
  <span class="title">{title}</span>
  <span class="badge" data-testid="result-badge">{sourceBadgeLabel(source)}</span>
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
    row-gap: 2px;
  }

  /* Leading accent marker for the roving selection — floats inside the pill. */
  .result-row::before {
    content: '';
    position: absolute;
    left: 5px;
    top: 50%;
    transform: translateY(-50%) scaleY(0);
    width: 3px;
    height: 18px;
    border-radius: var(--r-pill);
    background: var(--accent);
    opacity: 0.9;
    transition: transform var(--motion-base) var(--ease-emphasised);
  }

  .result-row:hover {
    background: var(--hover);
    color: var(--text);
  }

  .result-row:active {
    background: var(--press);
  }

  /* Roving keyboard selection wins over hover: a soft accent wash + the marker. */
  .result-row.selected {
    background: var(--accent-soft);
    color: var(--text);
  }
  .result-row.selected::before {
    transform: translateY(-50%) scaleY(1);
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

  .title {
    grid-area: title;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font: var(--weight-medium) var(--text-base) / 1 var(--font-sans);
    color: inherit;
  }

  /* Tiny uppercased source chip — quiet identity for where the result came from. */
  .badge {
    grid-area: badge;
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

  @media (prefers-reduced-motion: reduce) {
    .result-row::before {
      transition: none;
    }
  }
</style>
