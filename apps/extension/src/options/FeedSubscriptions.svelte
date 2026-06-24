<script lang="ts">
import { onMount } from 'svelte';
import { readPersistedState } from '../shared/chrome/storage';
import { log } from '../shared/logger';
import { buildOpml, type LensNode } from '../shared/opml';
import type { AppState } from '../shared/types';
import Button from '../ui/Button.svelte';
import InlineError from '../ui/InlineError.svelte';
import SettingsCard from '../ui/SettingsCard.svelte';
import Toast from '../ui/Toast.svelte';

let rssNodes = $state<LensNode[]>([]);
let toast = $state<{ message: string } | null>(null);
let exportError = $state<string | null>(null);

onMount(() => {
  let cancelled = false;
  void (async () => {
    const persisted = await readPersistedState();
    if (cancelled || (persisted.kind !== 'ok' && persisted.kind !== 'salvaged')) return;
    rssNodes = collectRssNodes(persisted.state);
  })();
  return () => {
    cancelled = true;
  };
});

function collectRssNodes(state: AppState): LensNode[] {
  const nodes: LensNode[] = [];
  for (const spaceNodes of Object.values(state.pinnedBySpace)) {
    for (const node of spaceNodes) {
      if (node.kind === 'lens' && node.sources.some((s) => s.source === 'rss')) {
        nodes.push(node);
      }
    }
  }
  return nodes;
}

async function handleExport(): Promise<void> {
  exportError = null;
  try {
    const xml = buildOpml(rssNodes);
    const date = new Date().toISOString().slice(0, 10);
    const url = URL.createObjectURL(new Blob([xml], { type: 'text/xml' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `lunma-feeds-${date}.opml`;
    a.click();
    URL.revokeObjectURL(url);
    toast = { message: 'Feeds exported' };
  } catch (err) {
    log.error('FeedSubscriptions: export failed', { err });
    exportError = err instanceof Error ? err.message : 'Export failed.';
  }
}
</script>

{#if rssNodes.length > 0}
  <SettingsCard
    heading="Feed subscriptions"
    description="Export your RSS feed list as an OPML file. To import feeds, use the smart folder editor."
  >
    <div class="actions">
      <Button variant="ghost" onclick={() => void handleExport()}>Export as OPML</Button>
    </div>

    {#if exportError}
      <InlineError message={exportError} testid="export-error" />
    {/if}
  </SettingsCard>

  {#if toast}
    <Toast message={toast.message} onDismiss={() => (toast = null)} />
  {/if}
{/if}

<style>
  .actions {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding-top: var(--space-4);
    border-top: 1px solid var(--divider);
  }
</style>
