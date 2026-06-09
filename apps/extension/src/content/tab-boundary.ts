import { isNavigationAllowed } from '../shared/url-boundary';

/**
 * Pinned-tab domain-boundary enforcer — a second declarative content script
 * injected at `document_start` on `<all_urls>` (pinned-tab-domain-boundary).
 *
 * Dormant until the service worker pushes it an allow-set for this tab. While
 * armed, a **same-tab, unmodified, `http(s)`** anchor activation whose host is
 * outside the allow-set is cancelled and handed back to the SW to open in a new
 * temporary tab — the pinned tab never moves (no flash). Enforcement is
 * **clicks-only and redirect-blind by design**: it never observes or cancels
 * redirects or programmatic `location` changes, so OAuth/SSO sign-in flows pass
 * straight through. Anything it does not catch degrades into the existing drift
 * model (capability #4), never a broken state.
 *
 * Vanilla TypeScript, **no Svelte runtime** and **no heavy imports** — only the
 * tiny, pure `isNavigationAllowed` matcher (no Chrome, no logger). Guarded by
 * `window.__lunmaBoundaryInstalled` so re-injection is a no-op; budget < 3KB
 * gzipped, mirroring the launcher overlay's isolation discipline.
 */

(() => {
  const flag = window as unknown as { __lunmaBoundaryInstalled?: boolean };
  if (flag.__lunmaBoundaryInstalled) return;
  flag.__lunmaBoundaryInstalled = true;

  // The effective allow-set for THIS tab, or `null` when disarmed (the start
  // state, and inherit-off / boundary-cleared). The SW owns it (design D6); the
  // script only matches locally so a link click needs no per-click round-trip.
  let allow: string[] | null = null;

  /**
   * Whether this content script's extension context is still live. After the
   * extension reloads/updates, the OLD instance lingers in already-open pages but
   * its `chrome.runtime` is invalidated — touching it throws "Extension context
   * invalidated". When dead we must NOT intercept: the SW can't receive the
   * divert (and can't push fresh config), so the click should fall through to the
   * browser rather than be `preventDefault`-ed into a dead end.
   */
  function runtimeAlive(): boolean {
    try {
      return chrome.runtime?.id != null;
    } catch {
      return false;
    }
  }

  /**
   * Capture-phase handler for `click` + `auxclick`. Acts ONLY on a same-tab,
   * unmodified, primary, `http(s)` anchor activation whose target host is off
   * the allow-set: cancels it and asks the SW to open the URL elsewhere.
   * Everything else (disarmed, modified/aux/middle clicks, `target=_blank`,
   * non-`http(s)` schemes, in-allow hosts) is left untouched for Chrome to
   * handle — those already open a new tab or are not navigations.
   */
  function onActivate(e: MouseEvent): void {
    if (allow === null) return; // disarmed
    if (e.defaultPrevented) return; // already handled by the page
    if (e.button !== 0) return; // middle / right / aux → Chrome
    // `Alt` is treated as a modifier here too: Alt+click is a download gesture,
    // not a navigation, so it is left to Chrome (consistent with "unmodified").
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    const node = (e.target as Element | null)?.closest?.('a[href]') ?? null;
    if (!(node instanceof HTMLAnchorElement)) return;
    // Same-tab only: an empty or `_self` target navigates this tab; `_blank` /
    // `_parent` / `_top` open elsewhere already, so leave them to Chrome.
    if (node.target !== '' && node.target !== '_self') return;
    // `http(s)` only — `mailto:`, `tel:`, `javascript:`, etc. are not in-tab
    // web navigations; leave them to Chrome.
    if (node.protocol !== 'http:' && node.protocol !== 'https:') return;

    const href = node.href;
    if (isNavigationAllowed(href, allow)) return; // in-allow → navigate normally

    // Don't intercept on a dead context (extension reloaded/updated): let the
    // browser navigate normally rather than prevent-then-fail-to-divert.
    if (!runtimeAlive()) return;

    // Off-allow same-tab click: keep the pinned tab put and divert the URL.
    e.preventDefault();
    e.stopPropagation();
    try {
      // `sendMessage` THROWS synchronously (not rejects) if the context is
      // invalidated between the check above and here — guard both forms.
      void chrome.runtime
        .sendMessage({ type: 'lunma/boundary-open-elsewhere', url: href })
        .catch(() => undefined);
    } catch {
      /* context died mid-handler (rare); the click is already prevented */
    }
  }

  chrome.runtime.onMessage.addListener((msg: unknown) => {
    const m = msg as { type?: string; allow?: unknown } | null;
    if (m?.type !== 'lunma/boundary-config') return;
    // A non-array (e.g. `null`) disarms; an array arms with that allow-set.
    allow = Array.isArray(m.allow) ? (m.allow as string[]) : null;
  });

  // Capture phase so a page that `stopPropagation()`s on bubble-phase clicks
  // cannot swallow the activation before we see it. `auxclick` is registered for
  // completeness — its non-primary button fails the `e.button === 0` guard, so
  // middle/aux clicks fall through to Chrome (the desired new-tab outcome).
  document.addEventListener('click', onActivate, true);
  document.addEventListener('auxclick', onActivate, true);
})();
