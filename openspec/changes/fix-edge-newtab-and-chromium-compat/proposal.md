## Why

On Microsoft Edge, opening a new tab leaves Lunma's new-tab page **stranded in
the sidebar as a Temporary tab** instead of being treated as the empty-Space
home — the bug a user reported. The same Chrome-only assumption breaks the
"Open keyboard shortcuts" recovery button (it opens a browser error page on
Edge). Both are user-visible breakage on a browser the product explicitly
markets support for (the site and the launch checklist both commit to Chrome
**and** Edge). This change makes Lunma's
home-tab recognition and its shortcut-binding affordance portable across
Chromium forks (Chrome, Edge, Brave) so Edge users get the same behaviour
Chrome users already have.

Root cause: `isNewTabUrl()` hardcodes the literal `chrome://newtab/`. A fresh
Edge tab transiently reports `edge://newtab/` before the
`chrome_url_overrides.newtab` override resolves, so it fails the home-tab test,
is adopted into `tempTabIds` on `tabs.onCreated`, and is never un-adopted (the
`tabs.onUpdated` correction is guarded on `!isNewTabUrl`, and the *resolved*
`chrome-extension://` URL **does** match via the portable `getURL` branch — so
the correction no-ops and the tab stays mis-classified). Five downstream
consumers inherit the same literal; one source fix repairs all of them.

## What Changes

- **Home-tab recognition becomes scheme-agnostic.** `isNewTabUrl()`
  (`apps/extension/src/shared/new-tab.ts`) recognises any Chromium fork's
  internal new-tab URL (`chrome://newtab`, `edge://newtab`, `brave://newtab`,
  with optional trailing slash / query / hash), in addition to the existing
  portable `chrome.runtime.getURL(NEWTAB_PAGE_PATH)` match (unchanged). This
  alone fixes the reported "NTP shows as a Temporary tab" bug and its five
  downstream consumers — `background/handlers/chrome-tabs.ts` (onCreated /
  onUpdated), `background/seed-existing-tabs.ts`, `background/group-orchestrator.ts`,
  `background/tab-group-adoption.ts`, `background/index.ts` — which delegate to
  the helper and need **no** edits.
- **The "Open keyboard shortcuts" control opens the host browser's shortcuts
  page.** `Options.svelte`'s `openShortcutsPage()` derives the browser's
  internal scheme at runtime (`edge://extensions/shortcuts` on Edge, default
  `chrome://extensions/shortcuts`) via a new `shared/platform.ts` helper,
  instead of the hardcoded `chrome://extensions/shortcuts` that opens an error
  page on Edge.
- **Browser-neutral user-facing copy** where text hardcodes "Chrome":
  the manifest `description`, the unbound-shortcut guidance card body, and the
  result-sources revoke hint in `Options.svelte`.
- **Regression coverage**: `new-tab.test.ts` gains `edge://newtab/` /
  `brave://newtab/` cases, and the onCreated/home-tab classification path gets
  an Edge-scheme case so the bug cannot silently return.

**Non-goals (verified portable by the audit; explicitly out of scope):** script
injection / boundary gates (http(s) whitelist), favicon handling (`_favicon`
endpoint + `chrome://`/`about:` ignore-list), launcher input classification /
dedup / providers, and manifest keys (`minimum_chrome_version`,
`chrome_url_overrides`, `favicon`/`tabGroups`/`sidePanel` permissions) all work
on Edge unchanged. The marketing site's `apps/site/src/lib/seo.ts` "for Chrome"
strings are a separate `marketing-site` concern and are left for a follow-up.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `spaces-and-tabs`: the "Lunma new-tab page is the empty-Space home"
  requirement — home-tab recognition (`isNewTabUrl`) matches the host browser's
  own internal new-tab scheme across Chromium forks, not only `chrome://newtab/`,
  so an Edge new tab is recognised as a home tab (and never listed as a
  Temporary tab).
- `launcher`: the "Detect and guide when the launcher shortcut is unbound"
  requirement — the guidance control opens the **host browser's**
  keyboard-shortcuts page (resolved at runtime), and the guidance copy is
  browser-neutral, so the recovery path works on Edge as well as Chrome.

## Impact

- **Code (functional):**
  - `apps/extension/src/shared/new-tab.ts` — scheme-agnostic match in
    `isNewTabUrl` (signature unchanged; no new exports).
  - `apps/extension/src/shared/platform.ts` — **new exported**
    `getExtensionsShortcutsUrl(): string` (built on an internal browser-scheme
    detector). No new dependency.
  - `apps/extension/src/options/Options.svelte` — `openShortcutsPage()` calls
    the new helper; composes the existing `Button` primitive (no new
    primitives, no visual change beyond copy).
- **Code (copy):** `apps/extension/public/manifest.json` (`description`),
  `apps/extension/src/options/Options.svelte` (shortcut-card body + result-sources
  revoke hint).
- **Tests:** `apps/extension/src/shared/new-tab.test.ts` (+ Edge/Brave cases);
  the chrome-tabs onCreated / `coordinator.home-tab.test.ts` home-tab path (+
  an `edge://newtab/` case); `apps/extension/src/options/Options.test.ts:522`
  (asserts the host-derived URL, not the hardcoded literal).
- **Docs:** none need updating. The shipped site/manifest positioning and the
  launch checklist already commit to Chrome+Edge and already flag the NTP
  override as Edge-fragile; the remaining `docs/` files are unaffected.
- **No** changes to: import-layer DAG, dependencies, Zod schemas / migrations,
  message bus, or any persisted state (home-tab status is derived, never
  persisted).
