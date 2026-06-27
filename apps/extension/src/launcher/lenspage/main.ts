import { mount } from 'svelte';
import { log } from '../../shared/logger';
import { onStateBroadcast, requestStateSnapshot } from '../../shared/messages';
import { readSettings, type Settings, watchSettings } from '../../shared/settings';
import { applyDensityToDocument, applyThemeToDocument } from '../../shared/surface-boot';
import type { AppState } from '../../shared/types';
import { getCurrentWindowId } from '../../shared/window-id';
import LensPage from './LensPage.svelte';

const targetEl = document.getElementById('app');
if (!targetEl) throw new Error('folderpage: #app not found');
const target: HTMLElement = targetEl;

// The page is a read-only consumer (smart-folder-page) — it mirrors the SW's
// `smartFolders` runtime slice and never dispatches a state-mutating command on
// boot. It can render before the SW finishes booting (a freshly opened tab), so
// resolve the window independently and retry the snapshot with backoff, exactly
// like the new-tab page. A broadcast arriving during the retries short-circuits.
const BOOT_RETRY_DELAYS_MS = [100, 200, 400, 800];

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function applyDensity(settings: Settings): void {
  applyDensityToDocument(settings.density);
}

/** Reflect the light/dark theme onto `<html>`. */
function applyTheme(settings: Settings): void {
  applyThemeToDocument(settings.theme);
}

/** Reflect the atmosphere-glow + tint settings onto the `.lenspage` root so its
 * aurora backdrop shows/hides live. The aurora intensity is seeded from the `tint`
 * prop at first paint (mount props are static); `showGlares` is the live toggle —
 * `[data-show-glares='false']` hides the aurora in CSS, mirroring the new-tab home.
 * Called right after mount (before paint, so no flash) and on every settings change. */
function applyGlow(settings: Settings): void {
  const root = target.querySelector<HTMLElement>('[data-testid="lenspage-root"]');
  if (!root) return;
  root.dataset.showGlares = String(settings.showGlares);
  root.dataset.tint = settings.tint;
}

/** The folder this page renders, from `?folderId=…`. Null when the param is
 * missing (the component then renders the calm "no folder" state). */
function readFolderId(): string | null {
  return new URLSearchParams(window.location.search).get('folderId');
}

async function boot(): Promise<void> {
  const folderId = readFolderId();
  // Read the saved tint so it seeds LensPage's prop (first-paint aurora
  // intensity + data-tint), the way the sidebar/new-tab boots seed it. Apply the
  // saved density BEFORE mount so the first paint is at the right rhythm.
  const initialSettings = await readSettings();
  applyDensity(initialSettings);
  applyTheme(initialSettings);

  // windowId resolves against chrome.windows.* and doesn't depend on the SW.
  let windowId: number;
  try {
    windowId = await getCurrentWindowId();
  } catch (err) {
    // Without a window we cannot resolve the active Space colour — mount with a
    // neutral window so the page is never blank, and stop.
    log.error('lenspage boot failed: getCurrentWindowId', { err });
    mount(LensPage, {
      target,
      props: { windowId: -1, folderId, initialState: null, tint: initialSettings.tint },
    });
    applyGlow(initialSettings);
    watchSettings((settings) => {
      applyDensity(settings);
      applyTheme(settings);
      applyGlow(settings);
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
        log.debug('lenspage boot retry', { attempt: attempt + 1, err });
        await delay(BOOT_RETRY_DELAYS_MS[attempt] ?? 800);
      }
    }
  }

  // Stop our boot-window capture; LensPage installs its own live subscription.
  captureBroadcast();
  const initialState = pendingBroadcast ?? snapshot;
  mount(LensPage, {
    target,
    props: { windowId, folderId, initialState, tint: initialSettings.tint },
  });
  applyGlow(initialSettings);

  // Re-apply on change (e.g. the user switches density, theme, or the atmosphere
  // glow in the options page). Registered once per boot, after mount.
  watchSettings((settings) => {
    applyDensity(settings);
    applyTheme(settings);
    applyGlow(settings);
  });
}

void boot();
