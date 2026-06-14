<script lang="ts">
import { buildBackup } from '../shared/backup';
import { bus } from '../shared/bus';
import { log } from '../shared/logger';
import { readSettings } from '../shared/settings';
import type { AppState, BackupEnvelope } from '../shared/types';
import Button from '../ui/Button.svelte';
import SegmentedControl from '../ui/SegmentedControl.svelte';
import Surface from '../ui/Surface.svelte';
import Toast from '../ui/Toast.svelte';

const STATE_KEY = 'lunma.state';

let includeSettings = $state(false);
let toast = $state<{ message: string } | null>(null);
let importError = $state<string | null>(null);
let confirmingImport = $state(false);
let pendingImportData = $state<unknown>(null);
let fileInputEl = $state<HTMLInputElement>();

const TOGGLE_OPTIONS = [
  { value: 'off', label: 'Off' },
  { value: 'on', label: 'On' },
];

async function handleExport(): Promise<void> {
  importError = null;
  try {
    const got = await chrome.storage.local.get(STATE_KEY);
    const env = got[STATE_KEY] as { state: AppState } | undefined;
    if (!env?.state) throw new Error('No state found in storage');

    const settings = includeSettings ? await readSettings() : undefined;
    const backup = buildBackup(env.state as AppState, settings);

    const date = new Date().toISOString().slice(0, 10);
    const json = JSON.stringify(backup, null, 2);
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `lunma-backup-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast = { message: 'Backup exported' };
  } catch (err) {
    log.error('BackupRestore: export failed', { err });
    importError = err instanceof Error ? err.message : 'Export failed.';
  }
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
  try {
    const text = await file.text();
    pendingImportData = JSON.parse(text) as unknown;
    confirmingImport = true;
    importError = null;
  } catch {
    importError = 'Could not read the backup file.';
    confirmingImport = false;
  }
}

async function confirmImport(): Promise<void> {
  const data = pendingImportData;
  confirmingImport = false;
  pendingImportData = null;
  importError = null;
  try {
    await bus.send({ kind: 'importState', payload: { backup: data as BackupEnvelope } });
    toast = { message: 'Backup restored' };
  } catch (err) {
    log.error('BackupRestore: import failed', { err });
    importError =
      err instanceof Error
        ? err.message
        : 'Import failed — the file may be corrupt or from an incompatible version.';
  }
}

function cancelImport(): void {
  confirmingImport = false;
  pendingImportData = null;
}
</script>

<Surface variant="glass">
  <section class="backup-restore" data-testid="backup-restore">
    <h2 class="group-label">Backup &amp; restore</h2>
    <p class="description">Move your Spaces to another machine, or keep a copy.</p>

    <div class="setting">
      <div class="setting-text">
        <span class="setting-label">Include settings</span>
        <span class="setting-desc">Carry your preferences to the new machine.</span>
      </div>
      <SegmentedControl
        name="backup-include-settings"
        options={TOGGLE_OPTIONS}
        value={includeSettings ? 'on' : 'off'}
        onchange={(v) => (includeSettings = v === 'on')}
      />
    </div>

    <div class="actions">
      <Button variant="primary" onclick={() => void handleExport()}>Export backup</Button>
      {#if confirmingImport}
        <div class="import-confirm" data-testid="import-confirm">
          <span class="confirm-text">Replace your data? This cannot be undone.</span>
          <Button variant="ghost" onclick={cancelImport}>Cancel</Button>
          <Button variant="primary" onclick={() => void confirmImport()}>Restore</Button>
        </div>
      {:else}
        <Button variant="ghost" onclick={handleImportClick}>Import backup</Button>
      {/if}
    </div>

    {#if importError}
      <p class="import-error" role="alert" data-testid="import-error">{importError}</p>
    {/if}

    <!-- Hidden file input — activated by Import backup button click. -->
    <input
      bind:this={fileInputEl}
      type="file"
      accept="application/json"
      class="file-input"
      onchange={(e) => void onFileChange(e)}
    />
  </section>
</Surface>

{#if toast}
  <Toast message={toast.message} onDismiss={() => (toast = null)} />
{/if}

<style>
  .backup-restore {
    padding: var(--space-4) var(--space-5);
  }

  /* Editorial heading — same treatment as the Settings group headings in
   * Options.svelte: Instrument Serif at --text-xl, sentence case. */
  .group-label {
    margin: 0 0 var(--space-4);
    font-family: var(--font-display);
    font-size: var(--text-xl);
    font-weight: var(--weight-regular);
    line-height: 1.1;
    color: var(--text-2);
  }
  /* Identity-hue tint for vivid/standard — mirrors the Options.svelte group-label
   * override so the heading renders consistently across all cards. The 0.72
   * lightness floor keeps it ≥ WCAG-AA over the glass fill at every hue. */
  :global(:root[data-tint='standard']) .group-label,
  :global(:root[data-tint='vivid']) .group-label {
    color: oklch(from var(--space-c) max(l, 0.72) c h);
  }

  .description {
    margin: 0 0 var(--space-4);
    font: var(--weight-regular) var(--text-sm) / 1.45 var(--font-sans);
    color: var(--text-muted);
  }

  .setting {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-4);
    padding: var(--space-3) 0;
    border-top: 1px solid var(--divider);
  }
  .setting-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .setting-label {
    font-size: var(--text-base);
    font-weight: var(--weight-medium);
    line-height: 1.2;
    color: var(--text);
  }
  .setting-desc {
    font-size: var(--text-sm);
    font-weight: var(--weight-regular);
    line-height: 1.3;
    color: var(--text-dim);
  }

  .actions {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding-top: var(--space-4);
    border-top: 1px solid var(--divider);
  }

  /* Inline import confirm row — same shape as RecentlyArchived "Clear all". */
  .import-confirm {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
  }
  .confirm-text {
    font: var(--weight-medium) var(--text-sm) / 1.3 var(--font-sans);
    color: var(--text-muted);
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

  /* Visually hidden — only activated programmatically. */
  .file-input {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }
</style>
