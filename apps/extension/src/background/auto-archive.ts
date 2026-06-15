import { log } from '../shared/logger';
import { readSettings, type Settings } from '../shared/settings';
import type { LunmaStore } from '../shared/store.svelte';
import type { AppState, Space, SpaceId, TabId, WindowId } from '../shared/types';

/**
 * Auto-archive (auto-archive). The idle-temporary-tab archival loop:
 *
 *   - `registerAutoArchiveAlarm(settings)` / `unregisterAutoArchiveAlarm()` /
 *     `handleAutoArchiveAlarm` — the `chrome.alarms` trigger that enqueues one
 *     `autoArchiveSweep` coordinator command per fire. The alarm is registered
 *     ONLY while the master switch is on, at a period DERIVED from the idle
 *     threshold (so a disabled or long-threshold config stops paying the
 *     per-minute SW-wake cost); it is cleared when the switch goes off.
 *   - `handleAutoArchiveSweep` — runs entirely inside one coordinator tick:
 *     snapshot the store, query Chrome for active/pinned, compute candidates with
 *     per-Space thresholds, `chrome.tabs.remove` + record each, then prune.
 *   - `handleRestoreArchivedTab` — re-opens an archived tab's URL and drops its
 *     record (the user-loop close).
 *   - `resolveSpaceAutoArchive` / `computeArchiveCandidates` — pure, unit-tested
 *     without Chrome (design D6).
 *
 * The thin-store rule holds: every `chrome.*` call and `readSettings()` lives
 * here in the background layer; the store gains only sync, plain-data mutators.
 */

/** The sweep alarm name. Its period is DERIVED from the user-tunable idle
 * threshold (`autoArchiveAlarmPeriodMinutes`), not fixed. */
export const AUTO_ARCHIVE_ALARM_NAME = 'lunma/auto-archive-sweep';

/** A temporary tab eligible for archiving, with the Space it belongs to. */
export interface ArchiveCandidate {
  tabId: TabId;
  spaceId: SpaceId;
}

/** The global auto-archive settings the resolver needs. */
type AutoArchiveSettings = Pick<Settings, 'autoArchiveEnabled' | 'autoArchiveIdleMinutes'>;

/**
 * Resolve a Space's EFFECTIVE auto-archive config (auto-archive, "Per-Space
 * override resolution"). The global `autoArchiveEnabled` toggle is the master
 * switch; when on, each Space resolves to inherit / off / custom. The resolved
 * `idleMinutes` is clamped to a floor of `1`. Pure — no Chrome, no I/O.
 *
 *   - master off → `{ enabled: false }` (defensive; the sweep does not run then),
 *   - absent override → inherit the global threshold,
 *   - `{ mode: 'off' }` → `{ enabled: false }` even though the global toggle is on,
 *   - `{ mode: 'custom'; idleMinutes }` → archive at the Space's own threshold.
 */
export function resolveSpaceAutoArchive(
  space: Space,
  settings: AutoArchiveSettings,
): { enabled: boolean; idleMinutes: number } {
  const globalMinutes = Math.max(1, Math.floor(settings.autoArchiveIdleMinutes));
  if (!settings.autoArchiveEnabled) {
    return { enabled: false, idleMinutes: globalMinutes };
  }
  const override = space.autoArchive;
  if (override === undefined) {
    return { enabled: true, idleMinutes: globalMinutes };
  }
  if (override.mode === 'off') {
    return { enabled: false, idleMinutes: globalMinutes };
  }
  return { enabled: true, idleMinutes: Math.max(1, Math.floor(override.idleMinutes)) };
}

/**
 * Compute the temporary tabs to archive (auto-archive, "Candidate exclusions").
 * Pure + separately testable. A temporary tab (tracked in some Space instance's
 * `tempTabIds`) is a candidate only when ALL hold:
 *
 *   - its owning Space resolves to `enabled` (master on + not `{ mode: 'off' }`),
 *   - it is not pinned in Chrome,
 *   - it is not the active tab of any window,
 *   - it is not bound to a saved tab (a value in `tabBindings`),
 *   - it has a defined `tabLastActivity` entry, and
 *   - `(now - tabLastActivity[id]) >= effectiveThresholdMs` for ITS Space.
 *
 * Exclusions are O(1) Set lookups against pre-computed sets.
 */
export function computeArchiveCandidates(
  snapshot: AppState,
  opts: {
    activeTabIds: ReadonlySet<TabId>;
    pinnedTabIds: ReadonlySet<TabId>;
    now: number;
    effectiveForSpace: (spaceId: SpaceId) => { enabled: boolean; thresholdMs: number };
  },
): ArchiveCandidate[] {
  const { activeTabIds, pinnedTabIds, now, effectiveForSpace } = opts;
  // Every live tab id bound to a saved tab in any window (per-window-tab-bindings,
  // ADR 0003) — Lunma-bound tabs survive auto-archive.
  const boundTabIds = new Set<TabId>(
    Object.values(snapshot.tabBindings).flatMap((binding) => Object.values(binding)),
  );
  const candidates: ArchiveCandidate[] = [];
  const seen = new Set<TabId>(); // defensive: a tab id owns one instance per window
  for (const windowMap of Object.values(snapshot.spaceInstancesByWindow)) {
    if (!windowMap) continue;
    for (const [spaceId, instance] of Object.entries(windowMap)) {
      if (!instance) continue;
      const eff = effectiveForSpace(spaceId);
      if (!eff.enabled) continue; // Space resolves off → contributes no candidates
      for (const tabId of instance.tempTabIds) {
        if (seen.has(tabId)) continue;
        if (pinnedTabIds.has(tabId)) continue;
        if (activeTabIds.has(tabId)) continue;
        if (boundTabIds.has(tabId)) continue;
        const last = snapshot.tabLastActivity[tabId];
        if (last === undefined) continue; // no staleness signal → never archived
        if (now - last < eff.thresholdMs) continue; // still fresh
        seen.add(tabId);
        candidates.push({ tabId, spaceId });
      }
    }
  }
  return candidates;
}

/**
 * Run one auto-archive sweep inside a single coordinator tick (auto-archive,
 * "Sweep computes candidates, removes, records, and prunes in one tick").
 * Returns whether `archivedTabs` changed (so the coordinator only persists +
 * broadcasts when there is something new). All Chrome I/O + `readSettings()`
 * live here; the store mutations are sync.
 */
export async function handleAutoArchiveSweep(store: LunmaStore): Promise<boolean> {
  const settings = await readSettings();
  const now = Date.now();
  const snapshot = store.snapshot();

  let tabs: chrome.tabs.Tab[];
  try {
    tabs = await chrome.tabs.query({});
  } catch (err) {
    log.error('autoArchiveSweep: tabs.query failed', { err });
    // Still enforce retention even when the query failed.
    const before = store.state.archivedTabs.length;
    store.pruneArchivedTabs(now);
    return store.state.archivedTabs.length !== before;
  }

  const activeTabIds = new Set<TabId>();
  const pinnedTabIds = new Set<TabId>();
  const tabsById = new Map<TabId, chrome.tabs.Tab>();
  for (const tab of tabs) {
    if (tab.id === undefined) continue;
    tabsById.set(tab.id, tab);
    if (tab.active) activeTabIds.add(tab.id);
    if (tab.pinned) pinnedTabIds.add(tab.id);
  }

  const effectiveForSpace = (spaceId: SpaceId): { enabled: boolean; thresholdMs: number } => {
    const space = snapshot.spaces.find((s) => s.id === spaceId);
    const resolved = space
      ? resolveSpaceAutoArchive(space, settings)
      : { enabled: false, idleMinutes: Math.max(1, Math.floor(settings.autoArchiveIdleMinutes)) };
    return { enabled: resolved.enabled, thresholdMs: resolved.idleMinutes * 60_000 };
  };

  const candidates = computeArchiveCandidates(snapshot, {
    activeTabIds,
    pinnedTabIds,
    now,
    effectiveForSpace,
  });

  let changed = false;
  for (const { tabId, spaceId } of candidates) {
    const tab = tabsById.get(tabId);
    // Skip a stale candidate — a tab id still in the store's `tempTabIds` that
    // Chrome no longer has (e.g. closed while the SW was asleep, not yet
    // reconciled). There is nothing to close or archive, and calling
    // `chrome.tabs.remove` on a dead id only throws noise. (`onRemoved` / boot
    // reconciliation prunes it from the store.)
    if (tab === undefined) {
      log.debug('autoArchiveSweep: skipping stale candidate (no live tab)', { tabId });
      continue;
    }
    const url = tab.url ?? snapshot.liveTabsById[tabId]?.url ?? '';
    const title = tab.title ?? snapshot.liveTabsById[tabId]?.title ?? '';
    try {
      await chrome.tabs.remove(tabId);
    } catch (err) {
      // A genuinely-live tab Chrome refused to close — don't record it (its
      // onRemoved never fires); rare, so a real error is warranted.
      log.error('autoArchiveSweep: tabs.remove failed', { tabId, err });
      continue;
    }
    store.appendArchivedTab({ tabId, url, title, spaceId, archivedAt: now });
    changed = true;
  }

  const beforePrune = store.state.archivedTabs.length;
  const retentionDays = Math.max(1, Math.floor(settings.autoArchiveRetentionDays));
  store.pruneArchivedTabs(now, retentionDays * 24 * 60 * 60 * 1000);
  if (store.state.archivedTabs.length !== beforePrune) changed = true;
  return changed;
}

/**
 * Re-open an archived tab and drop its record (auto-archive, "Restore re-opens an
 * archived tab and removes its record"). Identifies the entry by the composite
 * `(archivedAt, tabId)`; throws when none matches (the ack carries the error). The created tab is
 * adopted into the window's active Space through the existing `tabs.onCreated`
 * path (like `openUrl`) — NO direct `tempTabIds` / `liveTabsById` mutation.
 */
export async function handleRestoreArchivedTab(
  store: LunmaStore,
  payload: { archivedAt: number; tabId: number; windowId: WindowId },
): Promise<void> {
  const { archivedAt, tabId, windowId } = payload;
  const entry = store.state.archivedTabs.find(
    (e) => e.archivedAt === archivedAt && e.tabId === tabId,
  );
  if (!entry) {
    throw new Error(
      `restoreArchivedTab: no archived tab (archivedAt ${archivedAt}, tabId ${tabId})`,
    );
  }
  await chrome.tabs.create({ url: entry.url, windowId });
  store.removeArchivedTab(archivedAt, tabId);
}

/**
 * The sweep-alarm period in minutes, derived from the idle threshold. The alarm
 * only needs to fire within one interval of a tab's deadline, so half the idle
 * threshold — floored at Chrome's 1-minute minimum — is sufficient granularity
 * while avoiding the per-minute SW wake the old fixed period forced on everyone.
 */
export function autoArchiveAlarmPeriodMinutes(
  settings: Pick<Settings, 'autoArchiveIdleMinutes'>,
): number {
  return Math.max(1, Math.floor(settings.autoArchiveIdleMinutes / 2));
}

/**
 * Register the sweep alarm — ONLY when the master switch is on, at the
 * threshold-derived period. When the switch is off this is a no-op (the caller
 * clears any existing alarm via `unregisterAutoArchiveAlarm`), so a disabled
 * user pays zero SW-wake cost. `chrome.alarms.create` replaces a same-named
 * schedule, so re-registering on boot / after a threshold change is safe.
 */
export function registerAutoArchiveAlarm(
  settings: Pick<Settings, 'autoArchiveEnabled' | 'autoArchiveIdleMinutes'>,
): void {
  if (!settings.autoArchiveEnabled) return;
  chrome.alarms.create(AUTO_ARCHIVE_ALARM_NAME, {
    periodInMinutes: autoArchiveAlarmPeriodMinutes(settings),
  });
}

/** Clear the sweep alarm (a no-op if none exists). Called when auto-archive is
 * disabled, and before re-registering with a new period on a threshold change. */
export async function unregisterAutoArchiveAlarm(): Promise<void> {
  await chrome.alarms.clear(AUTO_ARCHIVE_ALARM_NAME);
}

/**
 * The minimal coordinator surface the alarm handler needs. Declared locally so
 * this module never imports the concrete `Coordinator` — `coordinator.ts` imports
 * the sweep/restore handlers from here, and a back-import would form a cycle
 * (Biome `noImportCycles`). The real coordinator's `enqueue` (accepting the wider
 * `PendingEvent`) is assignable to this narrower shape.
 */
export interface SweepEnqueuer {
  enqueue(event: { source: 'alarm'; kind: 'autoArchiveSweep' }): void;
}

/**
 * Handle a fired alarm (auto-archive, "Alarm-driven sweep trigger"). On the
 * sweep alarm, read the master switch; when on, enqueue exactly one
 * `autoArchiveSweep` command. Never mutates the store or calls `chrome.tabs.*`
 * directly — the whole sweep happens inside the command handler.
 */
export async function handleAutoArchiveAlarm(
  enqueuer: SweepEnqueuer,
  alarm: chrome.alarms.Alarm,
): Promise<void> {
  if (alarm.name !== AUTO_ARCHIVE_ALARM_NAME) return;
  const settings = await readSettings();
  if (!settings.autoArchiveEnabled) return;
  enqueuer.enqueue({ source: 'alarm', kind: 'autoArchiveSweep' });
}
