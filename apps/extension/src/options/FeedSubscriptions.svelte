<script lang="ts">
import { onMount, tick } from 'svelte';
import { bus } from '../shared/bus';
import { STATE_STORAGE_KEY } from '../shared/chrome/storage';
import { log } from '../shared/logger';
import { buildOpml, parseOpml, type SmartFolderNode } from '../shared/opml';
import type { AppState } from '../shared/types';
import Button from '../ui/Button.svelte';
import InlineError from '../ui/InlineError.svelte';
import Select from '../ui/Select.svelte';
import SettingsCard from '../ui/SettingsCard.svelte';
import Toast from '../ui/Toast.svelte';

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
// Inline-reveal focus (options inline-reveals guarantee): the action row wraps
// both the Import trigger and the confirm row, so focus moves to the confirm's
// primary action on open and restores to the Import trigger on cancel — matching
// the Backup import confirm (the structurally-identical sibling reveal).
let actionsEl = $state<HTMLElement>();
let confirmRowEl = $state<HTMLElement>();

onMount(async () => {
  // D8: read at mount to determine export button visibility.
  const got = await chrome.storage.local.get(STATE_STORAGE_KEY);
  const env = got[STATE_STORAGE_KEY] as { state: AppState } | undefined;
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
  const got = await chrome.storage.local.get(STATE_STORAGE_KEY);
  const env = got[STATE_STORAGE_KEY] as { state: AppState } | undefined;
  const spaces = env?.state?.spaces ?? [];

  parsedFeeds = feeds;
  spaceOptions = spaces.map((s) => ({ value: s.id, label: s.name }));
  selectedSpaceId = spaceOptions[0]?.value ?? '';
  confirmingImport = true;
  // Move focus to the confirm's primary action (Import) so a keyboard user isn't
  // dropped to <body> when the trigger unmounts.
  await tick();
  confirmRowEl?.querySelector<HTMLButtonElement>('[data-variant="primary"]')?.focus();
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
    const got = await chrome.storage.local.get(STATE_STORAGE_KEY);
    const env = got[STATE_STORAGE_KEY] as { state: AppState } | undefined;
    if (env?.state) rssNodes = collectRssNodes(env.state);
    toast = { message: `${feeds.length} feeds imported` };
  } catch (err) {
    log.error('FeedSubscriptions: import failed', { err });
    importError = err instanceof Error ? err.message : 'Import failed — please try again.';
  }
}

async function cancelImport(): Promise<void> {
  confirmingImport = false;
  parsedFeeds = [];
  importError = null;
  // Restore focus to the Import trigger that opened the confirm.
  await tick();
  actionsEl?.querySelector<HTMLButtonElement>('[data-testid="feed-import-trigger"]')?.focus();
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

<SettingsCard
  heading="Feed subscriptions"
  description="Import feeds from any OPML file, or export your feed list."
>
  <div class="actions" bind:this={actionsEl}>
    {#if confirmingImport}
      <div class="import-confirm" data-testid="import-confirm" bind:this={confirmRowEl}>
        <span class="confirm-text">Found {parsedFeeds.length} feeds — add to:</span>
        <Select
          options={spaceOptions}
          value={selectedSpaceId}
          ariaLabel="Target Space"
          testid="space-picker"
          onchange={(v) => (selectedSpaceId = v)}
        />
        <Button variant="ghost" onclick={() => void cancelImport()}>Cancel</Button>
        <Button variant="primary" onclick={() => void confirmImport()}>Import</Button>
      </div>
    {:else}
      <Button variant="primary" testid="feed-import-trigger" onclick={handleImportClick}>
        Import from OPML
      </Button>
      {#if rssNodes.length > 0}
        <Button variant="ghost" onclick={() => void handleExport()}>Export as OPML</Button>
      {/if}
    {/if}
  </div>

  {#if importError}
    <InlineError message={importError} testid="import-error" />
  {/if}

  <input
    bind:this={fileInputEl}
    type="file"
    accept=".opml,.xml"
    class="sr-only"
    onchange={(e) => void onFileChange(e)}
  />
</SettingsCard>

{#if toast}
  <Toast message={toast.message} onDismiss={() => (toast = null)} />
{/if}

<style>
  /* The card frame, serif heading, lead, and error box are the shared
   * `SettingsCard` / `CardHeading` / `InlineError` primitives; this card owns
   * only its action-row layout (the inline import confirm embeds a `Select`, so
   * the confirm row stays per-card — no shared `ConfirmRow`). */
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
</style>
