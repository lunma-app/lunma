import { log } from '../shared/logger';

/**
 * Open (or reuse) the options page at a hash deep-link — App.svelte's helper
 * extracted verbatim (github-connector design D6) so `SmartFolder`'s
 * "Add a token in Settings → Connectors" row composes the same options
 * deep-link as the ArchivedChip / FirstRunNotice paths. Reuses an existing
 * options tab when one is open (deep-linked via the hash), else opens one.
 *
 * Deliberately NOT the `openUrl` bus command: its handler's scheme hardening
 * drops non-http(s) URLs, so a `chrome-extension://` options URL would be
 * silently discarded — and that hardening stays untouched.
 */
export async function openOptionsAt(hash: string): Promise<void> {
  const base = chrome.runtime.getURL('src/options/index.html');
  const url = `${base}${hash}`;
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
    log.debug('openOptionsAt: reuse query failed; creating fresh', { err, hash });
  }
  await chrome.tabs.create({ url });
}
