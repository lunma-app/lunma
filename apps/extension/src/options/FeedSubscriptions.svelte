<script lang="ts">
import { onMount } from 'svelte';
import { bus } from '../shared/bus';
import { log } from '../shared/logger';
import { buildOpml, parseOpml, type SmartFolderNode } from '../shared/opml';
import type { AppState } from '../shared/types';
import Button from '../ui/Button.svelte';
import Select from '../ui/Select.svelte';
import Surface from '../ui/Surface.svelte';
import Toast from '../ui/Toast.svelte';

const STATE_KEY = 'lunma.state';

// Export state — seeded at mount (task 3.2 / design D8).
let rssNodes = $state<SmartFolderNode[]>([]);

// Import state
let fileInputEl = $state<HTMLInputElement>();
let parsedFeeds = $state<{ name: string; feedUrl: string }[]>([]);
let spaceOptions = $state<{ value: string; label: string }[]>([]);
let selectedSpaceId = $state('');
let confirmingImport = $state(false);

let toast = $state<{ message: string } | null>(null);
let importError = $state<string | null>(null);

onMount(async () => {
  // D8: read at mount to determine export button visibility.
  const got = await chrome.storage.local.get(STATE_KEY);
  const env = got[STATE_KEY] as { state: AppState } | undefined;
  if (!env?.state) return;
  rssNodes = collectRssNodes(env.state);
});

function collectRssNodes(state: AppState): SmartFolderNode[] {
  const nodes: SmartFolderNode[] = [];
  for (const spaceNodes of Object.values(state.pinnedBySpace)) {
    for (const node of spaceNodes) {
      if (node.kind === 'smart' && node.source === 'rss') {
        nodes.push(node);
      }
    }
  }
  return nodes;
}

function handleImportClick(): void {
  importError = null;
  fileInputEl?.click();
}

async function onFileChange(e: Event): Promise<void> {
  const input = e.currentTarget as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;

  importError = null;

  let text: string;
  try {
    text = await file.text();
  } catch {
    importError = 'Could not read the file.';
    return;
  }

  const feeds = parseOpml(text);
  if (feeds.length === 0) {
    importError = 'No RSS feeds found in this file.';
    confirmingImport = false;
    return;
  }

  // D8: read state at file-select time to populate the Space picker.
  const got = await chrome.storage.local.get(STATE_KEY);
  const env = got[STATE_KEY] as { state: AppState } | undefined;
  const spaces = env?.state?.spaces ?? [];

  parsedFeeds = feeds;
  spaceOptions = spaces.map((s) => ({ value: s.id, label: s.name }));
  selectedSpaceId = spaceOptions[0]?.value ?? '';
  confirmingImport = true;
}

async function confirmImport(): Promise<void> {
  const feeds = parsedFeeds;
  confirmingImport = false;
  parsedFeeds = [];
  importError = null;

  try {
    await bus.send({
      kind: 'importOpml',
      payload: { spaceId: selectedSpaceId, feeds },
    });
    // Refresh export-button visibility after a successful import.
    const got = await chrome.storage.local.get(STATE_KEY);
    const env = got[STATE_KEY] as { state: AppState } | undefined;
    if (env?.state) rssNodes = collectRssNodes(env.state);
    toast = { message: `${feeds.length} feeds imported` };
  } catch (err) {
    log.error('FeedSubscriptions: import failed', { err });
    importError = err instanceof Error ? err.message : 'Import failed — please try again.';
  }
}

function cancelImport(): void {
  confirmingImport = false;
  parsedFeeds = [];
  importError = null;
}

async function handleExport(): Promise<void> {
  importError = null;
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
    importError = err instanceof Error ? err.message : 'Export failed.';
  }
}
</script>

<Surface variant="glass">
  <section class="feed-subscriptions" data-testid="feed-subscriptions">
    <h2 class="group-label">Feed subscriptions</h2>
    <p class="description">Import feeds from any OPML file, or export your feed list.</p>

    <div class="actions">
      {#if confirmingImport}
        <div class="import-confirm" data-testid="import-confirm">
          <span class="confirm-text">Found {parsedFeeds.length} feeds — add to:</span>
          <Select
            options={spaceOptions}
            value={selectedSpaceId}
            ariaLabel="Target Space"
            testid="space-picker"
            onchange={(v) => (selectedSpaceId = v)}
          />
          <Button variant="ghost" onclick={cancelImport}>Cancel</Button>
          <Button variant="primary" onclick={() => void confirmImport()}>Import</Button>
        </div>
      {:else}
        <Button variant="primary" onclick={handleImportClick}>Import from OPML</Button>
        {#if rssNodes.length > 0}
          <Button variant="ghost" onclick={() => void handleExport()}>Export as OPML</Button>
        {/if}
      {/if}
    </div>

    {#if importError}
      <p class="import-error" role="alert" data-testid="import-error">{importError}</p>
    {/if}

    <input
      bind:this={fileInputEl}
      type="file"
      accept=".opml,.xml"
      class="file-input"
      onchange={(e) => void onFileChange(e)}
    />
  </section>
</Surface>

{#if toast}
  <Toast message={toast.message} onDismiss={() => (toast = null)} />
{/if}

<style>
  .feed-subscriptions {
    padding: var(--space-4) var(--space-5);
  }

  .group-label {
    margin: 0 0 var(--space-4);
    font-family: var(--font-display);
    font-size: var(--text-xl);
    font-weight: var(--weight-regular);
    line-height: 1.1;
    color: var(--text-2);
  }
  :global(:root[data-tint='standard']) .group-label,
  :global(:root[data-tint='vivid']) .group-label {
    color: oklch(from var(--space-c) max(l, 0.72) c h);
  }

  .description {
    margin: 0 0 var(--space-4);
    font: var(--weight-regular) var(--text-sm) / 1.45 var(--font-sans);
    color: var(--text-muted);
  }

  .actions {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding-top: var(--space-4);
    border-top: 1px solid var(--divider);
  }

  .import-confirm {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    flex-wrap: wrap;
  }
  .confirm-text {
    font: var(--weight-medium) var(--text-sm) / 1.3 var(--font-sans);
    color: var(--text-muted);
    white-space: nowrap;
  }

  .import-error {
    margin: var(--space-3) 0 0;
    padding: var(--space-2) var(--space-3);
    border-radius: var(--r-md);
    background: color-mix(in oklch, var(--danger) 10%, transparent);
    border: 1px solid color-mix(in oklch, var(--danger) 25%, transparent);
    font: var(--weight-regular) var(--text-sm) / 1.45 var(--font-sans);
    color: var(--danger);
  }

  .file-input {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }
</style>
