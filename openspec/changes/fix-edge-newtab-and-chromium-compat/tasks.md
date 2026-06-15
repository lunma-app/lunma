## 1. Home-tab recognition (the reported bug)

- [ ] 1.1 In `apps/extension/src/shared/new-tab.ts`, replace the two hardcoded literal checks (`url === 'chrome://newtab/' || url === 'chrome://newtab'`) with the anchored scheme-agnostic match `/^(chrome|edge|brave):\/\/newtab\/?(?:[?#].*)?$/.test(url)`; keep the `chrome.runtime.getURL(NEWTAB_PAGE_PATH)` branch unchanged.
- [ ] 1.2 Update the `isNewTabUrl` doc comment (lines ~15-19) to describe matching any Chromium fork's internal new-tab scheme (`chrome`/`edge`/`brave`://newtab) plus the resolved extension URL — not just `chrome://newtab/`.
- [ ] 1.3 Confirm the five downstream consumers need no edits (they delegate to `isNewTabUrl`): `background/handlers/chrome-tabs.ts` (onCreated/onUpdated), `background/seed-existing-tabs.ts`, `background/group-orchestrator.ts`, `background/tab-group-adoption.ts`, `background/index.ts`. (Verification only — if any edit turns out to be needed, that is a deviation: stop and confirm.)

## 2. Host-browser shortcuts page

- [ ] 2.1 In `apps/extension/src/shared/platform.ts`, add an exported `getExtensionsShortcutsUrl(): string` (built on a small internal scheme detector) that returns `edge://extensions/shortcuts` when `navigator.userAgent` contains `Edg/`, else `chrome://extensions/shortcuts`.
- [ ] 2.2 In `apps/extension/src/options/Options.svelte`, change `openShortcutsPage()` to `chrome.tabs.create({ url: getExtensionsShortcutsUrl() })` (import the helper); remove the hardcoded `chrome://extensions/shortcuts` literal.

## 3. Browser-neutral copy

- [ ] 3.1 `apps/extension/public/manifest.json` `description` (line ~6): drop "for Chrome" → a browser-neutral description (e.g. "Spatial tab and bookmark management — Arc-style Spaces and vertical tabs.").
- [ ] 3.2 `Options.svelte` unbound-shortcut card body (lines ~367-369): replace "Chrome has to set the keyboard shortcut…" with browser-neutral wording (e.g. "Your browser has to set the keyboard shortcut — open its shortcuts page to bind it.").
- [ ] 3.3 `Options.svelte` result-sources revoke hint (lines ~563-565): replace "Chrome's extension settings" with "your browser's extension settings".

## 4. Regression tests

- [ ] 4.1 `apps/extension/src/shared/new-tab.test.ts`: assert `isNewTabUrl` returns true for `edge://newtab/`, `edge://newtab`, and `brave://newtab/`; and false for `edge://settings/`, `edge://newtab-foo`, and `https://newtab` (alongside the existing `chrome://newtab/` true and `chrome://settings/` false cases).
- [ ] 4.2 Add an `edge://newtab/` home-tab classification case to the onCreated path / `coordinator.home-tab.test.ts` (parametrize the `NEWTAB` fixture) asserting the home tab is grouped and NOT added to `tempTabIds`.
- [ ] 4.3 `apps/extension/src/options/Options.test.ts` (line ~522): update the assertion to expect `getExtensionsShortcutsUrl()`'s result (default `chrome://extensions/shortcuts`); add an Edge case that stubs `navigator.userAgent` to include `Edg/` and asserts `edge://extensions/shortcuts`.

## 5. Docs reconciliation

- [ ] 5.1 Confirm no `docs/` file needs editing: the Chrome + Edge (Chromium) positioning already lives in the shipped site/manifest positioning and the launch checklist.

## 6. Verify

- [ ] 6.1 Run `pnpm verify` (extension `tsc`, Biome incl. layer DAG + import cycles, svelte-check, stylelint, Vitest) and `pnpm test:e2e`; all green.
- [ ] 6.2 Manual smoke on Edge (or document it as a release-notes step): open a new tab → it renders the Lunma home and does NOT appear in the sidebar Temporary list; with `Alt+L` unbound, the "Open keyboard shortcuts" button opens `edge://extensions/shortcuts`.
