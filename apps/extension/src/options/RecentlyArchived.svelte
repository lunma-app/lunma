<script lang="ts">
import { onMount, tick } from 'svelte';
import { bus } from '../shared/bus';
import { readPersistedState, STATE_STORAGE_KEY } from '../shared/chrome/storage';
import { labelFor } from '../shared/label-for';
import { log } from '../shared/logger';
import { m } from '../shared/paraglide/messages';
import { DEFAULTS, readSettings, watchSettings } from '../shared/settings';
import type { ArchivedTab } from '../shared/types';
import Button from '../ui/Button.svelte';
import { faviconFor, faviconUrl } from '../ui/favicon';
import IconButton from '../ui/IconButton.svelte';
import SettingsCard from '../ui/SettingsCard.svelte';
import TabRow from '../ui/TabRow.svelte';

/**
 * The "Recently archived" management view on the options page (auto-archive). The
 * sidebar chip deep-links here. It reads the persisted `archivedTabs` directly from
 * `chrome.storage.local` (the slice IS persisted) and watches `onChanged`, so it
 * stays live without a service-worker channel; restore + clear-all go through the
 * bus to the SW (the store owner). Restore re-opens into the last-focused window.
 */

let archived = $state<ArchivedTab[]>([]);
// The retention window (days) drives the per-row "deletes in Nd" countdown. Read
// + watched so it updates live as the user tweaks it on this same options page.
let retentionDays = $state(DEFAULTS.autoArchiveRetentionDays);

function isArchivedTab(e: unknown): e is ArchivedTab {
  if (!e || typeof e !== 'object') return false;
  const r = e as Record<string, unknown>;
  return (
    typeof r.tabId === 'number' &&
    typeof r.url === 'string' &&
    typeof r.title === 'string' &&
    typeof r.spaceId === 'string' &&
    typeof r.archivedAt === 'number'
  );
}

async function read(): Promise<void> {
  try {
    const persisted = await readPersistedState();
    archived =
      persisted.kind === 'ok' || persisted.kind === 'salvaged' ? persisted.state.archivedTabs : [];
  } catch (err) {
    log.error('RecentlyArchived: read failed', { err });
    archived = [];
  }
}

onMount(() => {
  void read();
  void readSettings().then((s) => {
    retentionDays = s.autoArchiveRetentionDays;
  });
  const unwatch = watchSettings((s) => {
    retentionDays = s.autoArchiveRetentionDays;
  });
  const listener = (changes: Record<string, chrome.storage.StorageChange>, area: string): void => {
    if (area === 'local' && changes[STATE_STORAGE_KEY]) void read();
  };
  chrome.storage.onChanged.addListener(listener);
  return () => {
    chrome.storage.onChanged.removeListener(listener);
    unwatch();
  };
});

const DAY_MS = 24 * 60 * 60 * 1000;

/** Compact relative age — how long ago the tab was archived. */
function ageLabel(archivedAt: number, now: number): string {
  const sec = Math.max(0, Math.floor((now - archivedAt) / 1000));
  if (sec < 60) return 'now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  return `${Math.floor(hr / 24)}d`;
}

/** When the entry is permanently deleted by the retention TTL (the ≤100 FIFO cap
 * can evict sooner — see the spec). Rounds up to whole days. */
function deleteLabel(archivedAt: number, now: number, days: number): string {
  const daysLeft = Math.ceil((archivedAt + days * DAY_MS - now) / DAY_MS);
  if (daysLeft <= 0) return 'deleting soon';
  if (daysLeft === 1) return 'deletes in 1d';
  return `deletes in ${daysLeft}d`;
}

interface ArchivedItem {
  key: string;
  archivedAt: number;
  tabId: number;
  title: string;
  meta: string;
  faviconSrc: string;
  faviconFallbackSrc: string;
}

// All archived tabs (across every Space), most-recent-first; de-duped + keyed by
// the unique (archivedAt, tabId) composite.
const items = $derived.by<ArchivedItem[]>(() => {
  const now = Date.now();
  const seen = new Set<string>();
  return archived
    .slice()
    .sort((a, b) => b.archivedAt - a.archivedAt)
    .map((e) => ({
      key: `${e.archivedAt}-${e.tabId}`,
      archivedAt: e.archivedAt,
      tabId: e.tabId,
      title: labelFor(e.title, e.url),
      meta: `${ageLabel(e.archivedAt, now)} · ${deleteLabel(e.archivedAt, now, retentionDays)}`,
      faviconSrc: faviconFor(e.url),
      faviconFallbackSrc: faviconUrl(e.url),
    }))
    .filter((item) => {
      if (seen.has(item.key)) return false;
      seen.add(item.key);
      return true;
    });
});

// Restore re-opens the URL in the LAST-FOCUSED normal window (the options page is
// not tied to a window). The authoritative broadcast / storage write drops the row.
async function restore(archivedAt: number, tabId: number): Promise<void> {
  let windowId: number | undefined;
  try {
    const win = await chrome.windows.getLastFocused({ windowTypes: ['normal'] });
    windowId = win.id;
  } catch (err) {
    log.error('RecentlyArchived: could not resolve a window to restore into', { err });
  }
  if (windowId === undefined) return;
  bus
    .send({ kind: 'restoreArchivedTab', payload: { archivedAt, tabId, windowId } })
    .catch((err: unknown) =>
      log.error('ARCHIVED_RESTORE_DISPATCH_FAILED', { err, archivedAt, tabId }),
    );
}

// Discard a single archived record without restoring it (the per-row delete). The
// authoritative storage write drops the row.
function deleteOne(archivedAt: number, tabId: number): void {
  bus
    .send({ kind: 'deleteArchivedTab', payload: { archivedAt, tabId } })
    .catch((err: unknown) =>
      log.error('ARCHIVED_DELETE_DISPATCH_FAILED', { err, archivedAt, tabId }),
    );
}

// "Clear all" is a two-step confirm (safety-destructive-actions): the first click
// reveals an inline confirm row; only the Delete button dispatches the destructive
// clear (it discards every record permanently — URLs survive only in browser
// history). Cancel dismisses without touching anything.
let confirmingClearAll = $state(false);
// Wrapper around the heading-row action (Clear all ↔ confirm), so the options
// inline-reveal focus guarantee can move focus to Delete on open and back to the
// Clear-all trigger on cancel.
let clearActionsEl = $state<HTMLElement>();

async function openClearConfirm(): Promise<void> {
  confirmingClearAll = true;
  await tick();
  clearActionsEl?.querySelector<HTMLButtonElement>('[data-variant="primary"]')?.focus();
}

async function cancelClearConfirm(): Promise<void> {
  confirmingClearAll = false;
  await tick();
  clearActionsEl?.querySelector<HTMLButtonElement>('[data-testid="clear-all-trigger"]')?.focus();
}

function confirmClearAll(): void {
  confirmingClearAll = false;
  bus
    .send({ kind: 'clearArchivedTabs', payload: {} })
    .catch((err: unknown) => log.error('ARCHIVED_CLEAR_DISPATCH_FAILED', { err }));
}
</script>

<SettingsCard
  heading={m.options_recentlyArchivedHeading()}
  description={m.options_recentlyArchivedDescription()}
  id="recently-archived"
  testid="recently-archived"
>
  {#snippet actions()}
    {#if items.length > 0}
      <span class="clear-actions" bind:this={clearActionsEl}>
        {#if confirmingClearAll}
          <div class="import-confirm" data-testid="import-confirm">
            <span class="confirm-text">{m.options_clearArchivedConfirm()}</span>
            <Button variant="ghost" onclick={() => void cancelClearConfirm()}>{m.options_clearArchivedCancel()}</Button>
            <Button variant="primary" onclick={confirmClearAll}>{m.options_clearArchivedDelete()}</Button>
          </div>
        {:else}
          <Button variant="ghost" testid="clear-all-trigger" onclick={() => void openClearConfirm()}>
            {m.options_clearArchived()}
          </Button>
        {/if}
      </span>
    {/if}
  {/snippet}

  {#if items.length === 0}
    <p class="empty" data-testid="archived-empty">
      {m.options_archivedEmpty()}
    </p>
  {:else}
    <div class="rows">
      {#each items as item (item.key)}
        <TabRow
          title={item.title}
          faviconSrc={item.faviconSrc}
          faviconFallbackSrc={item.faviconFallbackSrc}
          meta={item.meta}
        >
          {#snippet trailing()}
            <span class="row-actions">
              <IconButton
                icon="rotate-ccw"
                ariaLabel={m.options_restoreArchivedLabel({ title: item.title })}
                title={m.options_restoreArchivedTitle()}
                onclick={() => restore(item.archivedAt, item.tabId)}
              />
              <IconButton
                icon="trash-2"
                ariaLabel={m.options_deleteArchivedLabel({ title: item.title })}
                title={m.options_deleteArchivedTitle()}
                onclick={() => deleteOne(item.archivedAt, item.tabId)}
              />
            </span>
          {/snippet}
        </TabRow>
      {/each}
    </div>
  {/if}
</SettingsCard>

<style>
  /* The card frame + serif heading are the shared `SettingsCard` / `CardHeading`
   * primitives; the heading now reads in the editorial serif like every other
   * options card (it was the one card still rendering the retired uppercase
   * micro-label), with the "Clear all" action in `CardHeading`'s `actions` slot. */

  /* A transparent focus-management wrapper around the heading action — it carries
   * no box (so the heading row lays out exactly as before), only a queryable
   * boundary for moving focus between the Clear-all trigger and the confirm. */
  .clear-actions {
    display: contents;
  }

  /* Inline "Clear all" confirm row — destructive, so it asks before discarding.
   * Shares the sibling cards' `.import-confirm` / `.confirm-text` vocabulary. */
  .import-confirm {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
  }
  .confirm-text {
    font: var(--weight-medium) var(--text-sm) / 1.3 var(--font-sans);
    color: var(--text-muted);
  }

  .empty {
    margin: 0;
    font: var(--weight-regular) var(--text-sm) / 1.45 var(--font-sans);
    color: var(--text-muted);
  }

  .rows {
    display: flex;
    flex-direction: column;
    gap: var(--row-gap);
  }
  /* Restore + delete sit together in the row's trailing slot. */
  .row-actions {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
  }
  /* Archived rows read a touch quieter than live tabs (receded). */
  .rows :global(.tab-row .title) {
    color: var(--text-2);
  }
</style>
