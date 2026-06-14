import { persist } from '../shared/chrome/storage';
import { log } from '../shared/logger';
import {
  type BoundaryOpenElsewhereMessage,
  broadcastState,
  type LauncherToggleMessage,
  type OpenNewTabLauncherMessage,
  type OpenOptionsGrantMessage,
  respondWithCurrentWindow,
  type SidebarFocusMessage,
} from '../shared/messages';
import { isNewTabUrl, NEWTAB_PAGE_PATH } from '../shared/new-tab';
import { buildEngineRegistry } from '../shared/search-engines';
import { readSettings, type Settings, watchSettings } from '../shared/settings';
import type { TabId } from '../shared/types';
import {
  handleAutoArchiveAlarm,
  registerAutoArchiveAlarm,
  unregisterAutoArchiveAlarm,
} from './auto-archive';
import { installBusAdapter } from './bus-adapter';
import type { PendingEvent } from './coordinator';
import { ensureAtLeastOneSpace } from './default-space';
import { registerLauncherSuggestionsHandler } from './launcher-suggestions-handler';
import { openOptionsAtResultSources } from './open-options-grant';
import { backfillOverlayIntoOpenTabs, injectOverlay } from './overlay-injection';
import { resolvePinActiveTab } from './pin-active-tab';
import { seedExistingTabs } from './seed-existing-tabs';
import { seedExistingWindows } from './seed-existing-windows';
import {
  handleSmartFoldersAlarm,
  refreshDueSmartFolders,
  registerSmartFoldersPermissionSync,
  registerSmartFoldersRefreshKick,
  type SmartFolderDeps,
  syncSmartFoldersAlarm,
} from './smart-folders';
import { resolveSpaceTint } from './space-tint';
import { registerStateSnapshotHandler } from './state-snapshot-handler';
import { coordinator, loadState, store } from './store-singleton';
import { runRestartRecovery } from './tab-bindings';
import { reconcileTabGroupsOnBoot } from './tab-group-adoption';
import { purgeExpiredTrash } from './trash-purge';

// Side-panel behavior is idempotent — set it on every SW boot rather than
// gating on `chrome.runtime.onInstalled`. A top-level `chrome.runtime.X`
// reference can throw "Cannot read properties of undefined (reading
// 'onInstalled')" if `chrome.runtime` is transiently unavailable at SW
// module-eval (observed in the wild — possibly a Chrome SW boot race or
// stale-context re-eval). That throw kills the whole boot chain before any
// listener registers. Optional-chained access keeps the SW alive.
try {
  chrome.sidePanel
    ?.setPanelBehavior?.({ openPanelOnActionClick: true })
    .catch((err) => log.error('sidePanel.setPanelBehavior failed', { err }));
} catch (err) {
  log.warn('sidePanel.setPanelBehavior threw at boot', { err });
}

// Boot sequence. Boot mutations run to completion (`bootReady`) before any
// enqueued event mutates state. Every listener — the bus adapter, the
// snapshot handler, AND the chrome.* event listeners — is registered
// SYNCHRONOUSLY in the SW's first turn (below), because MV3 only routes the
// message/event that *wakes* a dormant SW to listeners present in that first
// turn; anything registered after an `await` misses the wake-up and the
// command/event is silently lost. To keep the "boot mutations first" guarantee,
// each listener defers its `coordinator.enqueue` until `bootReady` resolves.
// A fresh install (no Spaces loaded from storage) lets the boot tab-group pass
// convert the user's existing Chrome groups into Spaces. Captured BEFORE
// `ensureAtLeastOneSpace` mints the Default, then consumed by
// `reconcileTabGroupsOnBoot`.
let freshInstall = false;
// An `unavailable` boot read (every storage `get` threw) leaves an empty
// in-memory store that MUST NOT be mistaken for a first install: skip the
// Default mint, the fresh-install group conversion, AND the boot persist so the
// real (unreadable-this-boot) `lunma.state` is left byte-intact for the next
// activation, which re-reads (design D3).
let bootUnavailable = false;
const bootReady: Promise<void> = loadState()
  .then(({ outcome }) => {
    if (outcome === 'recovered') {
      log.warn('booted with recovered-from-corruption state');
    } else if (outcome === 'salvaged') {
      log.warn('booted with salvaged (partially-recovered) state');
    } else if (outcome === 'unavailable') {
      log.error('boot storage read unavailable — preserving on-disk state, skipping mint/persist');
    }
    bootUnavailable = outcome === 'unavailable';
    freshInstall = store.state.spaces.length === 0 && !bootUnavailable;
    return runRestartRecovery();
  })
  .then(() => {
    if (!bootUnavailable) ensureAtLeastOneSpace(store);
  })
  .then(() => {
    purgeExpiredTrash(store);
  })
  .then(() => seedExistingWindows(store))
  // Adopt already-open tabs into their window's active Space as temp tabs, and
  // seed the ephemeral live-tab metadata — both from one tabs.query. liveTabsById
  // is never read from disk (stripped on persist); both run on every SW boot,
  // before any listener can mutate state. Then heal any pre-existing cross-
  // instance overlap so the per-window ownership invariant holds before groups
  // materialize (prevent-space-group-collapse): `reconcileTabOwnership` keeps
  // each tab in its single correct owner (live-group match, else active Space)
  // and strips the duplicates, using the live tab→group map from this same query.
  .then(async () => {
    const tabs = await chrome.tabs.query({});
    seedExistingTabs(store, tabs);
    store.rebuildLiveTabs(tabs);
    const tabGroupById = new Map<TabId, number>();
    for (const tab of tabs) {
      if (tab.id !== undefined) tabGroupById.set(tab.id, tab.groupId ?? -1);
    }
    store.reconcileTabOwnership(tabGroupById);
  })
  // On a fresh install, convert the user's existing Chrome groups into Spaces;
  // then adopt restored groups (re-bind session-scoped ids) and materialize the
  // active Space's group when missing — before the boot persist/broadcast so the
  // broadcast carries the reconciled groupIds.
  .then(() => reconcileTabGroupsOnBoot(store, freshInstall))
  .then(() => {
    // Skip the boot persist on an `unavailable` read so `lunma.state` is left
    // intact for the next boot (no Default written over real data). Listeners +
    // broadcast wiring below are otherwise unchanged.
    if (!bootUnavailable) return persist(store.snapshot());
  })
  .then(() => {
    // The snapshot handler stays POST-boot: it answers a sidebar's
    // `state-request` synchronously with `store.snapshot()`, so registering it
    // before `loadState` populates state would risk replying with the empty
    // default. A cold-start request is covered by the sidebar's retry loop plus
    // the boot broadcast below.
    registerStateSnapshotHandler(store);
    // The pure-read launcher-suggestions channel registers alongside the
    // snapshot handler (same post-boot rationale: it reads `store.state` to
    // source the saved-tabs provider, so it must not answer before boot
    // populates state). Queue-independent — it never enqueues/mutates/persists/
    // broadcasts.
    registerLauncherSuggestionsHandler(store);
  })
  // Broadcast the reconciled post-boot state. Without this, a sidebar that is
  // ALREADY open when the SW wakes (e.g. you open a tab after the SW idled out)
  // never learns about boot-time reconciliation — the wake-up event is what
  // booted the SW, and boot mutations bypass the coordinator's per-drain
  // broadcast. The open sidebar would otherwise keep rendering stale state
  // (this is why a newly-opened tab's Temporary row went missing).
  .then(() => {
    broadcastState('boot', store.snapshot());
  })
  .catch((err) => log.error('SW boot failed', { err }));

// Wake-critical listeners are registered SYNCHRONOUSLY (see the boot comment):
// the bus adapter (command channel) and the chrome.* event listeners (tab /
// window events). Both defer their enqueue until `bootReady`. The snapshot
// handler is the exception — it registers post-boot, inside the chain above.
registerChromeListeners();
installBusAdapter(coordinator, bootReady);

// Smart-folders connector seams (smart-folders, design D4): the alarm tick,
// the state-request kick, and handler-started refreshes all enqueue
// `smartFolders.result` events through the coordinator, deferred to bootReady
// like every other event source.
const smartFolderDeps: SmartFolderDeps = { store, enqueue: enqueueAfterBoot };

// The parallel `'lunma/state-request'` refresh-kick listener — a SECOND,
// independent listener on the sidebar's boot/open signal (the pure-read
// snapshot handler in `state-snapshot-handler.ts` is untouched and keeps the
// response channel). Registered SYNCHRONOUSLY: a sidebar opening can be the
// message that wakes a dormant SW; the due-check itself defers to `bootReady`
// so it never reads a half-loaded store.
registerSmartFoldersRefreshKick(smartFolderDeps, bootReady);

// Host-permission sync (least-privilege-permissions design D5/D9): observe
// `chrome.permissions` grants/revocations and heal gated folders without a
// reload — a granted origin refetches its `needs-access`/due folders, a revoked
// one drops affected folders back to `needs-access`. Registered SYNCHRONOUSLY
// (the change may wake a dormant SW); the reconcile pass defers to `bootReady`.
registerSmartFoldersPermissionSync(smartFolderDeps, bootReady);

// Initial poll-alarm sync from the loaded pinned trees (the alarm may have been
// cleared by a browser restart; create/update/delete handlers retune it live),
// plus a post-boot refresh-due kick: the runtime slice dies with the SW (never
// persisted), so after EVERY restart each smart folder's fetchedAt is gone and
// every folder is due — refetching now heals an already-open sidebar's results
// in seconds instead of leaving ghosts until the next alarm tick (which is the
// only other freshness path an open sidebar gets: it never re-sends its
// state-request, so the sidebar-open kick can't fire for it).
void bootReady.then(() => {
  void syncSmartFoldersAlarm(store);
  void refreshDueSmartFolders(smartFolderDeps);
});

// Seed the boundary default + arm every currently-bound saved tab
// (pinned-tab-domain-boundary) — AFTER boot, fire-and-forget, so it NEVER gates
// command processing. `refreshBoundTabBoundaries` injects the boundary content
// script into bound tabs (`chrome.scripting`); doing that inside the boot chain
// would stall the bus adapter's `bootReady`-gated command enqueue if any
// injection is slow/blocked (a locked tab mid-load), timing out sidebar commands
// like `activateSpace`. It also covers restart-recovery rebinds (those tabs
// predate the load and lack the declarative script). The default stays `'off'`
// until this resolves — the safe baseline.
void bootReady.then(async () => {
  const settings = await readSettings();
  coordinator.setBoundaryDefault(settings.pinnedTabBoundaryDefault);
  // Seed the navigation-dedup mirror (navigation-tab-dedup) so the tab handler
  // reads the live value synchronously on the drain.
  coordinator.setDedupNewTabNavigations(settings.dedupNewTabNavigations);
  await coordinator.refreshBoundTabBoundaries();
});

// The current-window request answers the launcher overlay's keydown (`Alt+L`)
// fallback, which carries no message payload. It reads `sender.tab?.windowId`
// and the active Space's hue/chroma for that window (so the keydown-opened
// overlay glows in the Space's colour, like the command path). It registers
// SYNCHRONOUSLY at top-level (not in the post-boot chain like the
// snapshot/suggestions handlers): a content-script `Alt+L` can be the very
// message that wakes a dormant SW, and MV3 only routes the wake-up message to
// listeners present in the first turn. `resolveSpaceTint` is a synchronous
// store read (no mutation) — null before boot populates state, which just means
// the overlay opens on its default accent until state is ready.
respondWithCurrentWindow(
  (windowId) => resolveSpaceTint(store.state, windowId),
  // Tab-to-search registry for the keydown-opened overlay (launcher-tab-to-
  // search). Sourced async from settings per request; mirrors the command path's
  // `toggleLauncherOverlay` attach below.
  async () => buildEngineRegistry(await readSettings()),
);

// Boundary divert (pinned-tab-domain-boundary): the boundary content script
// sends this when the user clicks an off-allow link in a bound tab. Read the
// sender tab's window and enqueue the EXISTING `openUrl` command, so the URL
// opens in a new temporary tab while the pinned tab stays put (design D5) — no
// new tab-spawning machinery, no direct state mutation here. Registered
// SYNCHRONOUSLY: an off-allow click can be the very message that wakes a dormant
// SW, and MV3 only routes a wake-up to first-turn listeners; the enqueue itself
// defers to `bootReady` like every other event.
chrome.runtime.onMessage.addListener((raw: unknown, sender: chrome.runtime.MessageSender): void => {
  if (sender.id !== chrome.runtime.id) return;
  if (!raw || typeof raw !== 'object') return;
  const m = raw as Partial<BoundaryOpenElsewhereMessage>;
  if (m.type !== 'lunma/boundary-open-elsewhere') return;
  const url = m.url;
  const windowId = sender.tab?.windowId;
  if (typeof url !== 'string' || windowId === undefined) return;
  enqueueAfterBoot({
    source: 'sidebar',
    kind: 'openUrl',
    payload: { url, windowId },
    correlationId: `cmd:${crypto.randomUUID()}`,
  });
});

// Sidebar focus report (launcher-sidebar-focus-reach): the side panel tells us
// whether it currently holds keyboard focus, keyed by its window. Persisted in
// `chrome.storage.session` so the `toggle-launcher` command can route `Alt+L` to
// the focused new-tab launcher when the panel is focused (the in-page overlay
// would open unfocusable — W3C #693) even after a SW teardown. Registered
// SYNCHRONOUSLY (a focus report can be the message that wakes a dormant SW);
// UI-only — never enqueues, mutates, or broadcasts.
chrome.runtime.onMessage.addListener((raw: unknown, sender: chrome.runtime.MessageSender): void => {
  if (sender.id !== chrome.runtime.id) return;
  if (!raw || typeof raw !== 'object') return;
  const m = raw as Partial<SidebarFocusMessage>;
  if (m.type !== 'lunma/sidebar-focus') return;
  if (typeof m.windowId !== 'number' || typeof m.focused !== 'boolean') return;
  void setSidebarFocus(m.windowId, m.focused);
});

// Explicit open-new-tab-launcher request (launcher-sidebar-focus-reach): the
// sidebar launcher button click (the trailing IconButton in the Space switcher
// bar — the replacement for the removed SearchTrigger pill). Opens/focuses the
// new-tab launcher in the sidebar's window independently of the `chrome.commands`
// binding. Registered SYNCHRONOUSLY; UI-only.
chrome.runtime.onMessage.addListener((raw: unknown, sender: chrome.runtime.MessageSender): void => {
  if (sender.id !== chrome.runtime.id) return;
  if (!raw || typeof raw !== 'object') return;
  const m = raw as Partial<OpenNewTabLauncherMessage>;
  if (m.type !== 'lunma/open-newtab-launcher') return;
  if (typeof m.windowId !== 'number') return;
  void openNewTabLauncher(m.windowId);
});

// Open-options-at-grant-location (least-privilege-permissions D5): the Alt+L
// overlay can't call `chrome.permissions`, so its "Enable history/bookmark
// results" affordance routes here — the SW opens the options page at the Result
// sources grant control. Registered SYNCHRONOUSLY; UI-only, never enqueues. The
// `source` is carried for parity but both optional permissions live in the same
// section, so the SW simply opens it.
chrome.runtime.onMessage.addListener((raw: unknown, sender: chrome.runtime.MessageSender): void => {
  if (sender.id !== chrome.runtime.id) return;
  if (!raw || typeof raw !== 'object') return;
  const m = raw as Partial<OpenOptionsGrantMessage>;
  if (m.type !== 'lunma/open-options-grant') return;
  void openOptionsAtResultSources();
});

// Sync the auto-archive sweep alarm to the current settings (auto-archive):
// register it (at the threshold-derived period) only while the master switch is
// on, and clear it otherwise. Clearing first means an enabled re-sync is always
// clear-then-create, so a changed `autoArchiveIdleMinutes` re-arms at the new
// period. Cheap and idempotent, so running it on every settings change (not just
// the two relevant keys) is fine.
async function syncAutoArchiveAlarm(settings: Settings): Promise<void> {
  await unregisterAutoArchiveAlarm();
  registerAutoArchiveAlarm(settings);
}

// React to a live `pinnedTabBoundaryDefault` change (pinned-tab-domain-boundary):
// update the coordinator's cached default and re-push config to every bound tab
// so the new baseline arms inheriting tabs / leaves explicit `off` tabs free —
// no re-pin needed. Registered SYNCHRONOUSLY (a settings change can wake the SW);
// `refreshBoundTabBoundaries` no-ops cleanly before boot populates bindings. The
// same watcher re-syncs the auto-archive alarm so enabling/disabling the feature
// or retuning the threshold takes effect without a reload.
watchSettings((settings) => {
  coordinator.setBoundaryDefault(settings.pinnedTabBoundaryDefault);
  // Push the live navigation-dedup toggle (navigation-tab-dedup) so flipping it
  // takes effect without a reload.
  coordinator.setDedupNewTabNavigations(settings.dedupNewTabNavigations);
  void coordinator.refreshBoundTabBoundaries();
  void syncAutoArchiveAlarm(settings);
});

// Initial alarm sync from persisted settings (the watcher only fires on CHANGE).
// Fire-and-forget: the alarm only needs settings, not the booted store.
void readSettings().then(syncAutoArchiveAlarm);

// Backfill the overlay into already-open tabs on install/update (and unpacked
// reload). Declarative content scripts inject only into tabs opened/reloaded
// AFTER the extension loads, so existing tabs would otherwise lack the `Alt+L`
// keydown listener until reloaded — and with the command shortcut unbound,
// nothing else injects them. Registered SYNCHRONOUSLY in the first turn so the
// install event isn't missed; optional-chained like the other chrome.* hooks.
// UI-only (no store mutation), so it does not wait on `bootReady`.
chrome.runtime?.onInstalled?.addListener(() => {
  backfillOverlayIntoOpenTabs().catch((err) =>
    log.error('backfillOverlayIntoOpenTabs failed', { err }),
  );
});

/** Enqueue a chrome-sourced event, but not until boot mutations have finished. */
function enqueueAfterBoot(event: PendingEvent): void {
  void bootReady.then(() => coordinator.enqueue(event));
}

function registerChromeListeners(): void {
  chrome.tabs.onCreated.addListener((tab) => {
    enqueueAfterBoot({ source: 'chrome', kind: 'tabs.onCreated', payload: { tab } });
  });

  chrome.tabs.onRemoved.addListener((tabId, info) => {
    enqueueAfterBoot({ source: 'chrome', kind: 'tabs.onRemoved', payload: { tabId, info } });
  });

  chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    enqueueAfterBoot({
      source: 'chrome',
      kind: 'tabs.onUpdated',
      payload: { tabId, changeInfo },
    });
  });

  chrome.tabs.onActivated.addListener((activeInfo) => {
    enqueueAfterBoot({ source: 'chrome', kind: 'tabs.onActivated', payload: { activeInfo } });
  });

  // Tab-group lifecycle hints (non-destructive). Optional-chained like
  // chrome.commands — `chrome.tabGroups` is absent if the manifest's tabGroups
  // permission fails to register, and that must never kill listener wiring.
  chrome.tabGroups?.onRemoved.addListener((group) => {
    enqueueAfterBoot({
      source: 'chrome',
      kind: 'tabGroups.onRemoved',
      payload: { groupId: group.id },
    });
  });

  chrome.tabGroups?.onUpdated.addListener((group) => {
    enqueueAfterBoot({ source: 'chrome', kind: 'tabGroups.onUpdated', payload: { group } });
  });

  chrome.windows.onCreated.addListener((window) => {
    enqueueAfterBoot({ source: 'chrome', kind: 'windows.onCreated', payload: { window } });
  });

  chrome.windows.onRemoved.addListener((windowId) => {
    // Prune the window's sidebar-focus key (launcher-sidebar-focus-reach) so a
    // closed window leaves no stale entry in chrome.storage.session.
    void setSidebarFocus(windowId, false);
    enqueueAfterBoot({ source: 'chrome', kind: 'windows.onRemoved', payload: { windowId } });
  });

  // chrome.commands is an event source for pinning the active tab (design D1/D8).
  // Optional-chained: `chrome.commands` is absent if the manifest's commands
  // key fails to register, and we never want that to kill listener wiring.
  chrome.commands?.onCommand.addListener((command) => {
    if (command === 'pin-active-tab') {
      enqueuePinActiveTab().catch((err) => log.error('enqueuePinActiveTab failed', { err }));
      return;
    }
    if (command === 'toggle-launcher') {
      toggleLauncherOverlay().catch((err) => log.error('toggleLauncherOverlay failed', { err }));
      return;
    }
  });

  // Auto-archive (auto-archive): register the sweep-alarm LISTENER synchronously
  // (an alarm fire can be the wake-up message, and MV3 only routes it to
  // first-turn listeners); the handler reads the master switch and enqueues one
  // sweep, DEFERRED to `bootReady` like every other event so the sweep never
  // drains against a half-loaded store. The alarm's CREATION/CLEARING is settings-
  // dependent and handled by `syncAutoArchiveAlarm` (initial read + watcher) above,
  // so it is not created here.
  chrome.alarms?.onAlarm.addListener((alarm) => {
    void handleAutoArchiveAlarm({ enqueue: enqueueAfterBoot }, alarm);
    // Smart-folders poll (smart-folders, design D4): same first-turn listener
    // rationale; the due-check reads the store, so it defers to bootReady.
    void bootReady.then(() => handleSmartFoldersAlarm(smartFolderDeps, alarm));
  });
}

/**
 * Per-window sidebar-focus state (launcher-sidebar-focus-reach), persisted in
 * `chrome.storage.session` — NOT service-worker memory — so it survives a SW
 * teardown: otherwise the `Alt+L` command that re-wakes a dormant SW would find no
 * state and open the unfocusable in-page overlay instead of the new-tab launcher.
 * Per-window keys avoid read-modify-write races between windows; a stale key for a
 * window closed while the SW was dead is harmless (no command fires for a closed
 * window, and window ids are not reused within a session). The `storage` permission
 * already covers `storage.session` — no manifest change.
 */
const SIDEBAR_FOCUS_KEY_PREFIX = 'lunma.sidebarFocus:';

async function setSidebarFocus(windowId: number, focused: boolean): Promise<void> {
  const key = `${SIDEBAR_FOCUS_KEY_PREFIX}${windowId}`;
  try {
    if (focused) await chrome.storage.session.set({ [key]: true });
    else await chrome.storage.session.remove(key);
  } catch (err) {
    log.warn('setSidebarFocus failed', { err, windowId, focused });
  }
}

async function isSidebarFocused(windowId: number): Promise<boolean> {
  const key = `${SIDEBAR_FOCUS_KEY_PREFIX}${windowId}`;
  try {
    const got = await chrome.storage.session.get(key);
    return got[key] === true;
  } catch (err) {
    log.warn('isSidebarFocused read failed', { err, windowId });
    return false;
  }
}

/**
 * Route the `toggle-launcher` (`Alt+L`) command to the focused window's active
 * tab so its content script toggles the launcher overlay. UI-only — no state
 * mutation, so it does not wait on `bootReady`. The windowId rides along so the
 * stateless overlay can scope its suggestions query, and the active Space's
 * hue/chroma (when resolved and non-neutral) so the overlay glows in the Space's
 * colour. A page with no content script (e.g. a `chrome://` page) just rejects
 * the send — benign. When the focused window's sidebar holds focus the command
 * routes to the new-tab launcher instead (see the sidebar-focus branch below).
 */
async function toggleLauncherOverlay(): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  // Resolve the focused window once — used for the sidebar-focus branch and the
  // no-injectable-tab fallback. The active tab's window, else `lastFocusedWindow`.
  const focusedWindowId =
    tab?.windowId ?? (await chrome.windows.getLastFocused().catch(() => undefined))?.id;
  // Sidebar-focus branch (launcher-sidebar-focus-reach): when the focused window's
  // side panel holds focus, the in-page overlay would open UNFOCUSABLE — Chrome
  // forbids moving focus from the panel into the page (W3C #693). Route to the
  // focused new-tab launcher instead, BEFORE messaging/injecting the page overlay,
  // so no unfocusable overlay is ever created. The state is read from
  // `chrome.storage.session` so it survives a SW teardown.
  if (focusedWindowId !== undefined && (await isSidebarFocused(focusedWindowId))) {
    log.debug('toggle-launcher: sidebar focused; opening new-tab launcher', {
      windowId: focusedWindowId,
    });
    await openNewTabLauncher(focusedWindowId);
    return;
  }
  if (tab?.id === undefined) {
    // No injectable active tab (focus on a non-tab surface, or the query returned
    // nothing). Fall back to the new-tab launcher so Alt+L still reaches a launcher
    // (launcher-reach).
    log.debug('toggle-launcher: no injectable active tab; opening new-tab launcher', {
      windowId: focusedWindowId,
    });
    await openNewTabLauncher(focusedWindowId);
    return;
  }
  const msg: LauncherToggleMessage = { type: 'lunma/toggle-launcher', windowId: tab.windowId };
  const tint = resolveSpaceTint(store.state, tab.windowId);
  if (tint) {
    msg.spaceHue = tint.hue;
    msg.spaceChroma = tint.chroma;
    msg.spaceL = tint.l;
  }
  // Attach the Tab-to-search engine registry (launcher-tab-to-search) alongside
  // the hue, sourced from settings, so the stateless overlay recognizes keywords
  // and renders the chip without a settings dependency.
  const engines = buildEngineRegistry(await readSettings());
  if (engines.length > 0) msg.engines = engines;
  try {
    await chrome.tabs.sendMessage(tab.id, msg);
  } catch {
    // No receiver: the overlay content script isn't in this tab yet — declarative
    // content scripts only inject into tabs opened/reloaded AFTER the extension
    // loads, so an already-open tab has none. Inject it on demand, then resend.
    // Shares injectOverlay with the install-time backfill.
    try {
      await injectOverlay(tab.id);
      await chrome.tabs.sendMessage(tab.id, msg);
    } catch (err) {
      // Injection forbidden (chrome://, the Web Store, an extension page) — the
      // overlay can't appear on this page by Chrome policy. Fall back to the
      // new-tab launcher in this tab's window so Alt+L still reaches a launcher
      // (launcher-reach), reusing an open new-tab there rather than piling up tabs.
      log.debug('toggle-launcher: overlay uninjectable; opening new-tab launcher', {
        tabId: tab.id,
        err,
      });
      await openNewTabLauncher(tab.windowId);
    }
  }
}

/**
 * Open the new-tab launcher in `windowId` as the universal `Alt+L` fallback
 * (launcher-reach) for pages where the in-place overlay can't be injected
 * (`chrome://`, the Web Store, extension pages, the sidebar over such a tab) or
 * when there is no injectable active tab. Best-effort reuse (design D3): focus an
 * existing new-tab launcher in that window if one is already open — so repeated
 * `Alt+L` lands in the same launcher rather than piling up empty tabs (its input
 * refocuses on reactivation, design D5) — else create one.
 *
 * The create path opens the launcher by its **explicit extension URL**, NOT the
 * bare `chrome_url_overrides.newtab` override (no `url`): on the new-tab-page
 * surface Chrome focuses the omnibox and suppresses the page's `autofocus` for
 * ~500ms, so a freshly opened launcher would land with the caret in the address
 * bar rather than the search input. Loaded as a normal extension tab the page
 * keeps focus, so its `autofocus` lands in the search input (design D5).
 * `isNewTabUrl` matches this URL, so the reuse branch still recognizes it. If the
 * reuse query is unreliable in some Chrome build, creating a fresh new-tab is the
 * safe default.
 */
async function openNewTabLauncher(windowId: number | undefined): Promise<void> {
  try {
    const tabs = await chrome.tabs.query(windowId === undefined ? {} : { windowId });
    const existing = tabs.find((t) => t.id !== undefined && isNewTabUrl(t.url));
    if (existing?.id !== undefined) {
      await chrome.tabs.update(existing.id, { active: true });
      return;
    }
  } catch (err) {
    log.debug('toggle-launcher: new-tab reuse query failed; creating fresh', { err });
  }
  const url = chrome.runtime.getURL(NEWTAB_PAGE_PATH);
  await chrome.tabs
    .create(windowId === undefined ? { url, active: true } : { url, windowId, active: true })
    .catch((err) => log.error('openNewTabLauncher: tabs.create failed', { err }));
}

/**
 * Resolve the focused window's active tab and enqueue a `pinTab` event for it.
 * No-op (logged) when there is nothing to pin — see {@link resolvePinActiveTab}.
 * The event is sidebar-sourced with a synthetic correlationId; its ack has no
 * bus client waiting and is harmlessly dropped by the coordinator's emitter.
 */
async function enqueuePinActiveTab(): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  const result = resolvePinActiveTab(store, tab);
  if (!result) {
    log.debug('pin-active-tab: nothing to toggle');
    return;
  }
  // Alt+D is a toggle: pin an unbound temp tab, or unpin an already-pinned one.
  if (result.action === 'pin') {
    enqueueAfterBoot({
      source: 'sidebar',
      kind: 'pinTab',
      payload: result.payload,
      correlationId: `cmd:${crypto.randomUUID()}`,
    });
  } else {
    enqueueAfterBoot({
      source: 'sidebar',
      kind: 'unpinTab',
      payload: result.payload,
      correlationId: `cmd:${crypto.randomUUID()}`,
    });
  }
}
