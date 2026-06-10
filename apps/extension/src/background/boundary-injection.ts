import { log } from '../shared/logger';

/**
 * Inject the pinned-tab boundary content script into one tab on demand
 * (pinned-tab-domain-boundary). Declarative content scripts only inject into
 * tabs opened/reloaded AFTER the extension loads, so a tab bound by restart
 * recovery (a pre-existing tab) lacks the boundary script — the SW injects it
 * before pushing the allow-set.
 *
 * The boundary entry is selected from the manifest **by filename**, NOT by array
 * index (as {@link injectOverlay} also does), so it never binds to the wrong
 * entry if the content-scripts order changes (design D6).
 *
 * Re-injection is idempotent: the boundary IIFE early-returns on its
 * `window.__lunmaBoundaryInstalled` guard. A forbidden page (`chrome://`, the
 * Web Store, extension pages) cannot be injected — that rejection is swallowed
 * (degrade to the drift model, design D2) so the caller never throws; the
 * boundary is still saved/configured. Only a genuinely-missing manifest
 * declaration (a build/config bug) throws.
 */
const BOUNDARY_SCRIPT_FILE = 'tab-boundary';

export async function injectBoundary(tabId: number): Promise<void> {
  const entry = chrome.runtime
    .getManifest()
    .content_scripts?.find((cs) => cs.js?.some((file) => file.includes(BOUNDARY_SCRIPT_FILE)));
  const files = entry?.js;
  if (!files || files.length === 0) {
    throw new Error('injectBoundary: no boundary content script declared in manifest');
  }
  try {
    await chrome.scripting.executeScript({ target: { tabId }, files });
  } catch (err) {
    log.debug('injectBoundary: cannot inject into this page', { tabId, err });
  }
}
