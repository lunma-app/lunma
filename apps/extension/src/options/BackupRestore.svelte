<script lang="ts">
import { tick } from 'svelte';
import { buildBackup } from '../shared/backup';
import { bus } from '../shared/bus';
import { readPersistedState } from '../shared/chrome/storage';
import { log } from '../shared/logger';
import { m } from '../shared/paraglide/messages';
import { BackupEnvelopeSchema } from '../shared/schemas';
import { readSettings } from '../shared/settings';
import type { AppState } from '../shared/types';
import Button from '../ui/Button.svelte';
import InlineError from '../ui/InlineError.svelte';
import SegmentedControl from '../ui/SegmentedControl.svelte';
import SettingsCard from '../ui/SettingsCard.svelte';
import SettingText from '../ui/SettingText.svelte';
import Toast from '../ui/Toast.svelte';
import { toggleSegments } from './labels';

// Session-constant (locale is fixed until a language change reloads the surface).
const toggleOptions = toggleSegments();

let includeSettings = $state(false);
let toast = $state<{ message: string } | null>(null);
let importError = $state<string | null>(null);
let confirmingImport = $state(false);
let pendingImportData = $state<unknown>(null);
let fileInputEl = $state<HTMLInputElement>();
// Inline-reveal focus (options inline-reveals guarantee): the action row wraps
// both the trigger and the confirm row, so we can move focus to the confirm's
// primary action on open and restore it to the Import trigger on cancel.
let actionsEl = $state<HTMLElement>();
let confirmRowEl = $state<HTMLElement>();

async function handleExport(): Promise<void> {
  importError = null;
  try {
    const persisted = await readPersistedState();
    if (persisted.kind !== 'ok' && persisted.kind !== 'salvaged') {
      throw new Error('No valid state found in storage');
    }

    const settings = includeSettings ? await readSettings() : undefined;
    const backup = buildBackup(persisted.state, settings);

    const date = new Date().toISOString().slice(0, 10);
    const json = JSON.stringify(backup, null, 2);
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `lunma-backup-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast = { message: m.options_backupExported() };
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
    // Move focus to the confirm's primary action (Restore) so a keyboard user
    // isn't dropped to <body> when the trigger unmounts.
    await tick();
    confirmRowEl?.querySelector<HTMLButtonElement>('[data-variant="primary"]')?.focus();
  } catch {
    importError = m.options_importReadError();
    confirmingImport = false;
  }
}

async function confirmImport(): Promise<void> {
  const data = pendingImportData;
  confirmingImport = false;
  pendingImportData = null;
  importError = null;
  const parsed = BackupEnvelopeSchema.safeParse(data);
  if (!parsed.success) {
    importError = m.options_importInvalidError();
    return;
  }
  try {
    await bus.send({ kind: 'importState', payload: { backup: parsed.data } });
    toast = { message: m.options_backupRestored() };
  } catch (err) {
    log.error('BackupRestore: import failed', { err });
    importError = err instanceof Error ? err.message : m.options_importFailedError();
  }
}

async function cancelImport(): Promise<void> {
  confirmingImport = false;
  pendingImportData = null;
  // Restore focus to the Import trigger that opened the confirm.
  await tick();
  actionsEl?.querySelector<HTMLButtonElement>('[data-testid="import-trigger"]')?.focus();
}
</script>

<SettingsCard
  heading={m.options_backupHeading()}
  description={m.options_backupDescription()}
  flush
>
  <div class="setting">
    <SettingText label={m.options_includeSettingsLabel()} description={m.options_includeSettingsDescription()} />
    <SegmentedControl
      name="backup-include-settings"
      options={toggleOptions}
      value={includeSettings ? 'on' : 'off'}
      ariaLabel={m.options_includeSettingsLabel()}
      onchange={(v) => (includeSettings = v === 'on')}
    />
  </div>

  <div class="actions" bind:this={actionsEl}>
    <Button variant="secondary" onclick={() => void handleExport()}>{m.options_exportBackup()}</Button>
    {#if confirmingImport}
      <div class="import-confirm" data-testid="import-confirm" bind:this={confirmRowEl}>
        <span class="confirm-text">{m.options_importConfirm()}</span>
        <Button variant="ghost" onclick={() => void cancelImport()}>{m.options_importCancel()}</Button>
        <Button variant="primary" onclick={() => void confirmImport()}>{m.options_importRestore()}</Button>
      </div>
    {:else}
      <Button variant="ghost" testid="import-trigger" onclick={handleImportClick}>
        {m.options_importBackup()}
      </Button>
    {/if}
  </div>

  {#if importError}
    <div class="card-foot">
      <InlineError message={importError} testid="import-error" />
    </div>
  {/if}

  <!-- Hidden file input — activated by Import backup button click. -->
  <input
    bind:this={fileInputEl}
    type="file"
    accept="application/json"
    class="sr-only"
    onchange={(e) => void onFileChange(e)}
  />
</SettingsCard>

{#if toast}
  <Toast message={toast.message} onDismiss={() => (toast = null)} />
{/if}

<style>
  /* The card frame, serif heading, lead, label column, and error box are the
   * shared `SettingsCard` / `CardHeading` / `SettingText` / `InlineError`
   * primitives; this card owns only its row layout. */
  .setting {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    padding: var(--space-4) var(--space-5);
    border-top: 1px solid var(--border-soft);
  }

  .actions {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-4) var(--space-5) var(--space-5);
    border-top: 1px solid var(--border-soft);
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
  /* The error box keeps the card's gutter under the flush body. */
  .card-foot {
    padding: 0 var(--space-5) var(--space-4);
  }
</style>
