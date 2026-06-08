<script lang="ts">
import { onMount } from 'svelte';
import { bus } from '../shared/bus';
import { log } from '../shared/logger';
import { DEFAULTS, readSettings, watchSettings } from '../shared/settings';
import type { ArchivedTab, IconName } from '../shared/types';
import Button from '../ui/Button.svelte';
import { faviconFor, faviconUrl } from '../ui/favicon';
import IconButton from '../ui/IconButton.svelte';
import Surface from '../ui/Surface.svelte';
import TabRow from '../ui/TabRow.svelte';

/**
 * The "Recently archived" management view on the options page (auto-archive). The
 * sidebar chip deep-links here. It reads the persisted `archivedTabs` directly from
 * `chrome.storage.local` (the slice IS persisted) and watches `onChanged`, so it
 * stays live without a service-worker channel; restore + clear-all go through the
 * bus to the SW (the store owner). Restore re-opens into the last-focused window.
 */
const STATE_KEY = 'lunma.state';

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
    const got = await chrome.storage.local.get(STATE_KEY);
    const env = got[STATE_KEY] as { state?: { archivedTabs?: unknown } } | undefined;
    const list = env?.state?.archivedTabs;
    archived = Array.isArray(list) ? list.filter(isArchivedTab) : [];
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
    if (area === 'local' && changes[STATE_KEY]) void read();
  };
  chrome.storage.onChanged.addListener(listener);
  return () => {
    chrome.storage.onChanged.removeListener(listener);
    unwatch();
  };
});

function labelFor(title: string, url: string): string {
  if (title) return title;
  try {
    return new URL(url).hostname || 'Untitled';
  } catch {
    return 'Untitled';
  }
}

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

function clearAll(): void {
  bus
    .send({ kind: 'clearArchivedTabs', payload: {} })
    .catch((err: unknown) => log.error('ARCHIVED_CLEAR_DISPATCH_FAILED', { err }));
}
</script>

<Surface variant="glass">
  <section id="recently-archived" class="archived" data-testid="recently-archived">
    <div class="head">
      <h2 class="group-label">Recently archived</h2>
      {#if items.length > 0}
        <Button variant="ghost" onclick={clearAll}>Clear all</Button>
      {/if}
    </div>

    {#if items.length === 0}
      <p class="empty" data-testid="archived-empty">
        Nothing archived yet — idle temporary tabs land here so you can bring them back.
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
                  icon={'rotate-ccw' as IconName}
                  ariaLabel={`Restore ${item.title}`}
                  title="Restore"
                  onclick={() => restore(item.archivedAt, item.tabId)}
                />
                <IconButton
                  icon={'trash-2' as IconName}
                  ariaLabel={`Delete ${item.title}`}
                  title="Delete"
                  onclick={() => deleteOne(item.archivedAt, item.tabId)}
                />
              </span>
            {/snippet}
          </TabRow>
        {/each}
      </div>
    {/if}
  </section>
</Surface>

<style>
  .archived {
    padding: var(--space-4) var(--space-5);
  }

  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    margin-bottom: var(--space-3);
    padding-bottom: var(--space-2);
    border-bottom: 1px solid var(--divider);
  }
  .group-label {
    margin: 0;
    font-size: var(--text-2xs);
    font-weight: var(--weight-semibold);
    line-height: 1;
    letter-spacing: 0.08em;
    text-transform: uppercase;
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
