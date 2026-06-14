import { log } from '../shared/logger';

/**
 * Open (or reuse) the options page at the **Result sources** grant control
 * (least-privilege-permissions D5). The Alt+L overlay is a content script and
 * cannot call `chrome.permissions`, so its "Enable ⟨source⟩ results" affordance
 * messages the SW, which routes here.
 *
 * `chrome.runtime.openOptionsPage()` cannot carry a deep-link hash, so — like the
 * sidebar's `openOptionsAt` (which the SW cannot import under the layer DAG) — we
 * open `src/options/index.html#result-sources` via `chrome.tabs` (reusing an open
 * options tab when one exists, else creating one). The hash lands the user on the
 * `#result-sources` section where the inline Enable controls live.
 */

/** The options anchor of the Result sources grant control. */
export const RESULT_SOURCES_HASH = '#result-sources';

export async function openOptionsAtResultSources(): Promise<void> {
  const base = chrome.runtime.getURL('src/options/index.html');
  const url = `${base}${RESULT_SOURCES_HASH}`;
  try {
    const tabs = await chrome.tabs.query({});
    const existing = tabs.find((t) => t.id !== undefined && t.url?.startsWith(base));
    if (existing?.id !== undefined) {
      await chrome.tabs.update(existing.id, { active: true, url });
      if (existing.windowId !== undefined) {
        await chrome.windows.update(existing.windowId, { focused: true });
      }
      return;
    }
  } catch (err) {
    log.debug('openOptionsAtResultSources: reuse query failed; creating fresh', { err });
  }
  await chrome.tabs
    .create({ url })
    .catch((err) => log.error('openOptionsAtResultSources: tabs.create failed', { err }));
}
