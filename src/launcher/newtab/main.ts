import { mount } from 'svelte';
import { log } from '../../shared/logger';
import { onStateBroadcast, requestStateSnapshot } from '../../shared/messages';
import { buildEngineRegistry } from '../../shared/search-engines';
import { readSettings, type Settings, watchSettings } from '../../shared/settings';
import type { AppState } from '../../shared/types';
import { getCurrentWindowId } from '../../shared/window-id';
import NewTab from './NewTab.svelte';

const targetEl = document.getElementById('app');
if (!targetEl) throw new Error('newtab: #app not found');
const target: HTMLElement = targetEl;

// Mirror the sidebar's boot: the page can render before the SW finishes booting
// (a fresh window's NTP), so resolve the window independently of the SW and
// retry the state snapshot with backoff. A broadcast arriving during the
// retries short-circuits the loop. The page is a read-only consumer — it never
// dispatches a command.
const BOOT_RETRY_DELAYS_MS = [100, 200, 400, 800];

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Reflect the density preference onto `<html>` so `tokens.css`'s
 * `:root[data-density=…]` overrides (and `ResultRow`'s Comfort two-line layout)
 * apply. Normal is the token default, so the attribute is omitted for it. A
 * direct mirror of `src/sidebar/main.ts`'s `applyDensity`. */
function applyDensity(settings: Settings): void {
  if (settings.density === 'normal') {
    delete document.documentElement.dataset.density;
  } else {
    document.documentElement.dataset.density = settings.density;
  }
}

/** Reflect the colour-intensity preference onto the `.home` root so its
 * `[data-tint=…]` glass overrides apply. NewTab renders the first-paint value
 * from its `tint` prop; this updates the glass cast live when the user changes
 * the setting (the aurora intensity prop is captured at first paint and
 * refreshes on the next page open — the new-tab page is short-lived). */
function applyTint(settings: Settings): void {
  const home = target.querySelector<HTMLElement>('[data-testid="newtab-home"]');
  if (home) home.dataset.tint = settings.tint;
}

async function boot(): Promise<void> {
  // Read the saved tint so it seeds NewTab's prop (first-paint aurora intensity
  // + data-tint), the way the sidebar boot seeds App's tint. The same read
  // builds the Tab-to-search engine registry passed to NewTab (captured at mount,
  // like tint; an options edit is reflected on the next page open).
  const initialSettings = await readSettings();
  // Apply the saved density BEFORE mount so the first painted result list is at
  // the right rhythm — no Normal→Comfort flash (mirrors the sidebar boot).
  applyDensity(initialSettings);
  const engines = buildEngineRegistry(initialSettings);

  // windowId resolves against chrome.windows.* and doesn't depend on the SW.
  let windowId: number;
  try {
    windowId = await getCurrentWindowId();
  } catch (err) {
    // Without a window we cannot resolve the active Space — mount the neutral
    // home so the page is never blank, and stop.
    log.error('newtab boot failed: getCurrentWindowId', { err });
    mount(NewTab, {
      target,
      props: { windowId: -1, initialState: null, tint: initialSettings.tint, engines },
    });
    watchSettings((settings) => {
      applyDensity(settings);
      applyTint(settings);
    });
    return;
  }

  // Capture any broadcast that lands while we await the snapshot.
  let pendingBroadcast: AppState | null = null;
  const captureBroadcast = onStateBroadcast((msg) => {
    pendingBroadcast = msg.state;
  });

  let snapshot: AppState | null = null;
  for (let attempt = 0; attempt <= BOOT_RETRY_DELAYS_MS.length; attempt++) {
    try {
      snapshot = await requestStateSnapshot();
      break;
    } catch (err) {
      if (pendingBroadcast) break;
      if (attempt < BOOT_RETRY_DELAYS_MS.length) {
        log.debug('newtab boot retry', { attempt: attempt + 1, err });
        await delay(BOOT_RETRY_DELAYS_MS[attempt] ?? 800);
      }
    }
  }

  // Stop our boot-window capture; NewTab installs its own live subscription.
  captureBroadcast();
  const initialState = pendingBroadcast ?? snapshot;
  mount(NewTab, {
    target,
    props: { windowId, initialState, tint: initialSettings.tint, engines },
  });

  // Re-apply on change (e.g. the user switches density or colour intensity in
  // the options page). Registered once per boot, after mount.
  watchSettings((settings) => {
    applyDensity(settings);
    applyTint(settings);
  });
}

void boot();
