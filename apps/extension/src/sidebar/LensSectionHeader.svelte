<script lang="ts">
import type { LensQuery, ResolvedLensSource } from '../shared/types';
import Icon from '../ui/Icon.svelte';

interface Props {
  /** The RESOLVED section config (one filter, or none for rss). */
  cfg: ResolvedLensSource;
  count?: string | undefined;
  /** Whether this section is collapsed (chevron points right, body hidden). */
  collapsed: boolean;
  /** Toggle this section's collapsed state. */
  onToggle: () => void;
  /** `id` of the section body this header discloses, for `aria-controls`. */
  controlsId?: string | undefined;
  /** First section in the folder — suppresses the hairline separator above. */
  first?: boolean | undefined;
}

const { cfg, count, collapsed, onToggle, controlsId, first = false }: Props = $props();

const ICON_BY_SOURCE: Record<string, string> = {
  gitlab: 'folder-git-2',
  github: 'folder-git-2',
  jira: 'folder-kanban',
  rss: 'rss',
};

// Per-source filter label for the `host · filter` header (multi-filter-smart-
// connectors design D8). Jira re-skins review-requested to "Watching".
function filterLabel(source: string, query: LensQuery): string {
  if (query === 'authored') return 'authored';
  if (query === 'assigned') return 'assigned';
  return source === 'jira' ? 'Watching' : 'reviewing';
}

const icon = $derived(ICON_BY_SOURCE[cfg.source] ?? 'folder');
const host = $derived.by(() => {
  try {
    return new URL(cfg.baseUrl).host;
  } catch {
    return cfg.baseUrl;
  }
});
// The source's custom name (smart-source-rename) labels the section in place of
// the host when set; otherwise the host.
const identity = $derived(cfg.name?.trim() || host);
// `identity · filter` for a queue section, plain `identity` for rss.
const hostLabel = $derived(
  cfg.query !== undefined ? `${identity} · ${filterLabel(cfg.source, cfg.query)}` : identity,
);

// The accessible label names the section, its count, and the toggle action. The
// trailing verb is written inside the two template branches (not a quoted
// ternary) so the icon-loader generator never mistakes the word "expand" — a
// real lucide icon name — for a reachable icon literal.
const ariaLabel = $derived(
  collapsed
    ? `${hostLabel} section, ${count ?? '0'} items, expand`
    : `${hostLabel} section, ${count ?? '0'} items, collapse`,
);
</script>

<button
  type="button"
  class="section-header"
  class:first
  aria-expanded={!collapsed}
  aria-controls={controlsId}
  aria-label={ariaLabel}
  onclick={onToggle}
>
  <!-- One disclosure slot (the one-glyph restraint): the source icon at rest,
       crossfading to a rotating chevron on hover / keyboard focus. Both glyphs
       are stacked in the same 16px box so the swap never reflows. -->
  <span class="section-disclosure" class:expanded={!collapsed} aria-hidden="true">
    <span class="glyph glyph-type"><Icon name={icon} size={16} /></span>
    <span class="glyph glyph-caret"><Icon name="chevron-right" size={14} /></span>
  </span>
  <span class="section-host">{hostLabel}</span>
  {#if count !== undefined}
    <span class="section-count">{count}</span>
  {/if}
</button>

<style>
  .section-header {
    appearance: none;
    border: 0;
    width: 100%;
    box-sizing: border-box;
    background: transparent;
    cursor: pointer;
    text-align: left;
    display: flex;
    align-items: center;
    gap: var(--space-2);
    min-height: 24px;
    /* Right inset --space-3 (12px), not --space-2, so the count right-aligns with
       the kebab GLYPHS above (a kebab button sits at 8px row-pad but its icon is
       inset ~4px inside the 24px button → glyph at ~12px). Aligns the whole
       trailing column. */
    padding: var(--space-1) var(--space-3) var(--space-1) var(--space-3);
    margin-bottom: var(--row-gap);
    /* Match the lens row + result rows: --r-lg pill on the interactive --hover wash. */
    border-radius: var(--r-lg);
    transition:
      background var(--motion-fast) var(--ease-standard),
      transform var(--motion-fast) var(--ease-standard);
  }
  /* Hairline separator above every section header except the first, so each
   * section reads as a discrete block (expanded or collapsed). */
  .section-header:not(.first) {
    margin-top: var(--space-1);
    border-top: 1px solid color-mix(in oklch, var(--text-faint) 22%, transparent);
    padding-top: calc(var(--space-1) + 1px);
  }
  .section-header:hover {
    background: var(--space-c-soft);
  }
  .section-header:hover .section-host {
    color: var(--text-2);
  }
  .section-header:active {
    transform: scale(var(--press-scale));
  }
  .section-header:focus-visible {
    outline: var(--focus-width) solid var(--focus-color);
    outline-offset: var(--focus-offset);
  }

  /* One 16px slot; the two glyphs share the box and crossfade. */
  .section-disclosure {
    position: relative;
    flex-shrink: 0;
    width: var(--favicon-size);
    height: var(--favicon-size);
  }
  .glyph {
    position: absolute;
    inset: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--text-dim);
    transition:
      opacity var(--motion-fast) var(--ease-standard),
      transform var(--motion-fast) var(--ease-standard);
  }
  .glyph-caret {
    opacity: 0;
  }
  /* On intent (hover / keyboard focus) the type icon fades out, the chevron in. */
  .section-header:hover .glyph-type,
  .section-header:focus-visible .glyph-type {
    opacity: 0;
  }
  .section-header:hover .glyph-caret,
  .section-header:focus-visible .glyph-caret {
    opacity: 1;
  }
  .section-disclosure.expanded .glyph-caret {
    transform: rotate(90deg);
  }

  .section-host {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    font: var(--weight-medium) var(--text-xs) / 1 var(--font-sans);
    color: var(--text-dim);
    transition: color var(--motion-fast) var(--ease-standard);
  }

  .section-count {
    flex-shrink: 0;
    font: var(--weight-semibold) var(--text-xs) / 1 var(--font-sans);
    color: var(--text-dim);
  }

  @media (prefers-reduced-motion: reduce) {
    .glyph {
      transition: none;
    }
  }
</style>
