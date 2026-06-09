import { mount } from 'svelte';
import { log } from '../shared/logger';
import { onStateBroadcast, reportSidebarFocus, requestStateSnapshot } from '../shared/messages';
import { readSettings, type Settings, watchSettings } from '../shared/settings';
import { applyDensityToDocument } from '../shared/surface-boot';
import type { AppState } from '../shared/types';
import { getCurrentWindowId } from '../shared/window-id';
import App from './App.svelte';
import { boundaryDefault } from './boundary-default.svelte';
import { createBroadcastApply } from './broadcast-apply';
import { createSidebarStore } from './store-context.svelte';
import { isSwipeLive, onSwipeLiveChange } from './swipe-live';

const targetEl = document.getElementById('app');
if (!targetEl) throw new Error('sidebar: #app not found');
const target: HTMLElement = targetEl;

// Side panel can open before the SW finishes booting (especially right
// after the extension reloads). `chrome.runtime.sendMessage` then throws
// "Receiving end does not exist". Retry with backoff: 100, 200, 400,
// 800ms. If a broadcast lands during retries, we use it and stop retrying.
const BOOT_RETRY_DELAYS_MS = [100, 200, 400, 800];

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function applyDensity(settings: Settings): void {
  applyDensityToDocument(settings.density);
}

/** Reflect the colour-intensity preference onto the `.sidebar` root so the
 * `.sidebar[data-tint=…]` token rules apply. Unlike density, `data-tint` lives
 * on `.sidebar` (where `--base-hue` is rebound to the active Space), not on
 * `<html>`. App.svelte renders the first-paint value from its `tint` prop; this
 * updates it live when the user changes the setting (no reload). */
function applyTint(settings: Settings): void {
  const sidebar = target.querySelector<HTMLElement>('[data-testid="sidebar"]');
  if (sidebar) sidebar.dataset.tint = settings.tint;
}

async function boot(): Promise<void> {
  // Apply the saved density BEFORE mount so the first paint is at the right
  // rhythm — no Normal→Compact flash (App's onMount runs after first paint).
  // Capture the read so the tint seeds App's prop too.
  const initialSettings = await readSettings();
  applyDensity(initialSettings);
  // Seed the sidebar's live mirror of the pinned-tab boundary default so the
  // locked-row indicator + editor caption are correct on first paint.
  boundaryDefault.value = initialSettings.pinnedTabBoundaryDefault;

  // Broadcast-race mitigation: capture any broadcast that lands while we're
  // awaiting the snapshot. If one arrives, we can short-circuit the
  // snapshot-retry loop — the SW is clearly alive and we have fresh state
  // to seed with.
  let pendingBroadcast: AppState | null = null;
  const captureBroadcast = onStateBroadcast((msg) => {
    pendingBroadcast = msg.state;
  });

  // windowId resolves against `chrome.windows.*` and doesn't depend on the
  // SW. Fetch it independently so a slow/dead SW can't take it down too.
  let windowId: number;
  try {
    windowId = await getCurrentWindowId();
  } catch (err) {
    log.error('sidebar boot failed: getCurrentWindowId', { err });
    captureBroadcast();
    return;
  }

  // Snapshot retries against the SW. Stop early if a broadcast arrived
  // (means SW is alive and we have state without needing the snapshot).
  let snapshot: AppState | null = null;
  let lastErr: unknown = null;
  for (let attempt = 0; attempt <= BOOT_RETRY_DELAYS_MS.length; attempt++) {
    try {
      snapshot = await requestStateSnapshot();
      break;
    } catch (err) {
      lastErr = err;
      if (pendingBroadcast) break;
      if (attempt < BOOT_RETRY_DELAYS_MS.length) {
        log.debug('sidebar boot retry', { attempt: attempt + 1, err });
        await delay(BOOT_RETRY_DELAYS_MS[attempt] ?? 800);
      }
    }
  }

  const seed = pendingBroadcast ?? snapshot;
  if (!seed) {
    log.error('sidebar boot failed after retries', { err: lastErr });
    // Keep the broadcast subscription alive — if the SW comes back it will
    // push a state broadcast that can be used to recover. Show a minimal
    // error state with a Retry button rather than leaving #app blank.
    target.innerHTML = `
      <div style="
        display:flex;flex-direction:column;align-items:center;justify-content:center;
        height:100%;gap:12px;padding:24px;box-sizing:border-box;
        font-family:var(--font-sans,system-ui,sans-serif);
        color:var(--text-muted,#9ca3af);text-align:center;
      ">
        <span style="font-size:13px;line-height:1.4;">Something went wrong.<br>The extension couldn't load.</span>
        <button id="sidebar-retry-btn" style="
          padding:6px 16px;border-radius:6px;border:1px solid var(--border,rgba(255,255,255,0.12));
          background:var(--surface-2,rgba(255,255,255,0.06));color:var(--text,#e5e7eb);
          font:500 12px/1 var(--font-sans,system-ui,sans-serif);cursor:pointer;
        ">Retry</button>
      </div>`;
    document.getElementById('sidebar-retry-btn')?.addEventListener('click', () => {
      target.innerHTML = '';
      void boot();
    });
    return;
  }

  const store = createSidebarStore(seed);
  captureBroadcast();

  // Apply broadcasts field-by-field (skip unchanged) and DEFER the heavy tab-list fields
  // out of a live swipe stream — the spike's `armRenderIdle`. See broadcast-apply.ts for
  // the full rationale; in short, an `activateSpace` echo mutates `liveTabsById` +
  // `spaceInstancesByWindow` (the SW closes the outgoing home tab / rebuilds groups), so
  // re-deriving every panel's tab list synchronously mid-momentum freezes the thread, the
  // wheel stream reads the freeze as a gap, and the gap re-arm commits a SECOND Space.
  // Buffering the heavy fields until the gesture ends keeps that render out of the window.
  const sink = store.state as unknown as Record<string, unknown>;
  const broadcastApply = createBroadcastApply({
    getField: (key) => store.state[key],
    setField: (key, value) => {
      sink[key] = value;
    },
    isLive: isSwipeLive,
    scheduleFlush: (fn) => {
      if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => fn());
      else setTimeout(fn, 0);
    },
  });
  onStateBroadcast((msg) => broadcastApply.apply(msg.state));
  onSwipeLiveChange(broadcastApply.onLiveChange);

  target.innerHTML = '';
  mount(App, { target, props: { store, windowId, tint: initialSettings.tint } });

  // Report the side panel's focus state to the SW (launcher-sidebar-focus-reach)
  // so the `toggle-launcher` command routes `Alt+L` to the focused new-tab launcher
  // when the panel is focused — Chrome forbids focusing the in-page overlay from the
  // panel (W3C webextensions #693). Seed from `document.hasFocus()` (a panel does NOT
  // auto-focus on open, so "opened" != "focused"); `pagehide` clears the entry when
  // the panel closes or navigates.
  reportSidebarFocus(windowId, document.hasFocus());
  window.addEventListener('focus', () => reportSidebarFocus(windowId, true));
  window.addEventListener('blur', () => reportSidebarFocus(windowId, false));
  window.addEventListener('pagehide', () => reportSidebarFocus(windowId, false));

  // Re-apply on change (e.g. the user switches density or colour intensity in
  // the options page). Registered once per successful boot, after mount.
  watchSettings((settings) => {
    applyDensity(settings);
    applyTint(settings);
    boundaryDefault.value = settings.pinnedTabBoundaryDefault;
  });
}

void boot();
