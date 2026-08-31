import { TAB_TOKEN_KEY } from '../shared/provenance';

/**
 * Provenance token carrier — a third declarative content script injected at
 * `document_start` on the same origins as the other two (tab-provenance).
 *
 * Dormant until the service worker messages it: with the provenance setting off it
 * performs NO `sessionStorage` interaction at all, not even a read, so a user who
 * never enables the feature is indistinguishable from one without it.
 *
 * On `lunma/provenance-sync` it keeps whatever token the page already holds — the
 * property that makes lineage survive a session restore — and writes the offered
 * candidate only when the page holds none. It never mints one itself.
 *
 * Vanilla TypeScript, no Svelte runtime, no `chrome.*` beyond `runtime` messaging,
 * and one tiny pure import — mirroring `content/tab-boundary.ts`'s isolation
 * discipline. Guarded by `window.__lunmaTokenInstalled` so re-injection is a no-op.
 */

(() => {
  const flag = window as unknown as { __lunmaTokenInstalled?: boolean };
  if (flag.__lunmaTokenInstalled) return;
  flag.__lunmaTokenInstalled = true;

  /** `sessionStorage` throws in sandboxed frames and when site data is blocked;
   * a page we cannot mark is simply a root, never an error. */
  function read(): string | null {
    try {
      return sessionStorage.getItem(TAB_TOKEN_KEY);
    } catch {
      return null;
    }
  }

  function write(token: string): boolean {
    try {
      sessionStorage.setItem(TAB_TOKEN_KEY, token);
      return true;
    } catch {
      return false;
    }
  }

  chrome.runtime.onMessage.addListener((msg: unknown, _sender, sendResponse) => {
    const m = msg as { type?: string; token?: unknown } | null;

    if (m?.type === 'lunma/provenance-clear') {
      try {
        sessionStorage.removeItem(TAB_TOKEN_KEY);
      } catch {
        /* nothing to clear if storage is unavailable */
      }
      return;
    }

    if (m?.type !== 'lunma/provenance-sync' || typeof m.token !== 'string') return;

    // A token already on the page WINS: it is the durable identity a restore
    // brings back. The candidate is only used when the page carries none.
    const existing = read();
    const effective = existing ?? (write(m.token) ? m.token : null);
    if (effective === null) return; // unmarkable page → the SW treats it as a root

    // RESPOND to the sync — the service worker awaits this reply and records the
    // token it carries. A separate `runtime.sendMessage` would not do: nothing
    // listens for it, and `tabs.sendMessage` would resolve `undefined`, which the
    // worker reads as "no identity" and silently drops the tab's lineage.
    // The work above is synchronous, so responding inline is correct and this
    // listener must NOT return true (that would leave the channel open).
    sendResponse({ type: 'lunma/provenance-token', token: effective });
  });

  // Announce readiness. crxjs ships content scripts as async loaders that
  // dynamically import the real module, so this listener attaches well AFTER
  // `document_start` — later than `onCommitted` and even `onDOMContentLoaded`,
  // where every `tabs.sendMessage` fails with "Receiving end does not exist".
  // The worker therefore cannot push first; the page says when it is reachable.
  //
  // This touches NO page storage: dormancy means no `sessionStorage` read or
  // write until instructed, and a readiness ping is neither.
  try {
    void chrome.runtime.sendMessage({ type: 'lunma/provenance-hello' });
  } catch {
    /* extension context gone; the next load announces again */
  }
})();
