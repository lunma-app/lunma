<script lang="ts">
import type { SmartSourceConfig } from '../shared/types';
import Icon from '../ui/Icon.svelte';

interface Props {
  cfg: SmartSourceConfig;
  count?: string | undefined;
}

const { cfg, count }: Props = $props();

const ICON_BY_SOURCE: Record<string, string> = {
  gitlab: 'folder-git-2',
  github: 'folder-git-2',
  jira: 'folder-kanban',
  rss: 'rss',
};

const icon = $derived(ICON_BY_SOURCE[cfg.source] ?? 'folder');
const host = $derived.by(() => {
  try {
    return new URL(cfg.baseUrl).host;
  } catch {
    return cfg.baseUrl;
  }
});
</script>

<div class="section-header" aria-hidden="true">
  <span class="section-icon">
    <Icon name={icon} size={16} />
  </span>
  <span class="section-host">{host}</span>
  {#if count !== undefined}
    <span class="section-count">{count}</span>
  {/if}
</div>

<style>
  .section-header {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    height: 12px;
    padding: 4px var(--space-2) 0 var(--space-3);
    margin-bottom: var(--row-gap);
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
  }

  .section-count {
    flex-shrink: 0;
    font: var(--weight-semibold) var(--font-size-xs, 11px) / 1 var(--font-sans);
    color: var(--text-dim);
  }
</style>
