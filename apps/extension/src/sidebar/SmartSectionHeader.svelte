<script lang="ts">
import type { ResolvedSourceConfig, SmartQuery } from '../shared/types';
import Icon from '../ui/Icon.svelte';

interface Props {
  /** The RESOLVED section config (one filter, or none for rss). */
  cfg: ResolvedSourceConfig;
  count?: string | undefined;
  /** Whether this section is collapsed (chevron points right, body hidden). */
  collapsed: boolean;
  /** Toggle this section's collapsed state. */
  onToggle: () => void;
  /** `id` of the section body this header discloses, for `aria-controls`. */
  controlsId?: string | undefined;
}

const { cfg, count, collapsed, onToggle, controlsId }: Props = $props();

const ICON_BY_SOURCE: Record<string, string> = {
  gitlab: 'folder-git-2',
  github: 'folder-git-2',
  jira: 'folder-kanban',
  rss: 'rss',
};

// Per-source filter label for the `host · filter` header (multi-filter-smart-
// connectors design D8). Jira re-skins review-requested to "Watching".
function filterLabel(source: string, query: SmartQuery): string {
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
// `host · filter` for a queue section, plain `host` for rss (no filter axis).
const hostLabel = $derived(
  cfg.query !== undefined ? `${host} · ${filterLabel(cfg.source, cfg.query)}` : host,
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
  aria-expanded={!collapsed}
  aria-controls={controlsId}
  aria-label={ariaLabel}
  onclick={onToggle}
>
  <span class="section-chevron" class:expanded={!collapsed} aria-hidden="true">
    <Icon name="chevron-right" size={12} />
  </span>
  <span class="section-icon">
    <Icon name={icon} size={16} />
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
    height: 12px;
    padding: 4px var(--space-2) 0 var(--space-3);
    margin-bottom: var(--row-gap);
    border-radius: var(--r-md);
    transition:
      background var(--motion-fast) var(--ease-standard),
      transform var(--motion-fast) var(--ease-standard);
  }
  .section-header:hover {
    background: var(--surface-2);
  }
  .section-header:hover .section-host {
    color: var(--text);
  }
  .section-header:active {
    transform: scale(var(--press-scale));
  }
  .section-header:focus-visible {
    outline: var(--focus-width) solid var(--focus-color);
    outline-offset: var(--focus-offset);
  }

  .section-chevron {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--text-dim);
    transition: transform var(--motion-fast) var(--ease-standard);
  }
  .section-chevron.expanded {
    transform: rotate(90deg);
  }

  .section-icon {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--favicon-size);
    color: var(--text-dim);
  }

  .section-host {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    font: var(--weight-regular) var(--font-size-xs, 11px) / 1 var(--font-sans);
    color: var(--text-muted);
    transition: color var(--motion-fast) var(--ease-standard);
  }

  .section-count {
    flex-shrink: 0;
    font: var(--weight-semibold) var(--font-size-xs, 11px) / 1 var(--font-sans);
    color: var(--text-dim);
  }

  @media (prefers-reduced-motion: reduce) {
    .section-chevron {
      transition: none;
    }
  }
</style>
