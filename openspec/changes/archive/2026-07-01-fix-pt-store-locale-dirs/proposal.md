## Why

Portuguese silently disappeared from the Chrome Web Store dashboard's
"Language" picker after the region-neutral `pt` rename
(`2026-07-01-rename-pt-pt-to-pt`). Chrome's fixed manifest-locale list has no
bare `pt` — only `pt_BR` and `pt_PT` — so `apps/extension/public/_locales/pt/`
is invisible to the Store even though the extension still resolves and
renders Portuguese correctly in-app. Users who set their Chrome UI to
Portuguese and rely on the Store listing to confirm language support see no
Portuguese entry, and the Store's translated-listing tooling has nothing to
attach to. This restores that Store-facing visibility with no change to the
in-app experience.

## What Changes

- Replace the single `apps/extension/public/_locales/pt/` directory with two
  directories, `apps/extension/public/_locales/pt_BR/` and
  `apps/extension/public/_locales/pt_PT/`, each holding a byte-identical copy
  of the current `messages.json` (same region-neutral Portuguese copy, no new
  translation work).
- Update `apps/extension/src/i18n-locale-set.test.ts` so the manifest-locale-set
  guard folds `pt_BR`/`pt_PT` back to the single app locale `pt` for the
  set-comparison, and add an assertion that the two `pt_BR`/`pt_PT`
  `messages.json` files stay byte-identical (guards against future drift into
  two different translations).
- Update `apps/extension/src/i18n-parity.test.ts`'s `chromeDir()` helper so the
  key-parity check for the `pt` app locale resolves to one manifest directory
  (`pt_PT`) instead of the now-deleted `pt` directory.
- Update `docs/architecture.md`'s i18n section to describe the `pt_BR`/`pt_PT`
  fan-out and why it exists, and to state explicitly that it is Store-metadata
  only — the Paraglide catalog, the resolver, and `SupportedLocale` keep the
  single region-neutral `pt` app locale untouched.

No app-level behavior changes: the `language` setting, the resolver
(`shared/i18n.ts`), `SupportedLocale`, and the Paraglide `pt` catalog are
unaffected. This is a narrow, mechanical correction to restore Chrome Web
Store visibility, not a reversal of the region-neutral Portuguese decision.

## Capabilities

### Modified Capabilities
- `i18n`: the "Native manifest and store-listing localization" requirement
  changes from "one `_locales` directory per supported locale" to "the
  region-neutral `pt` locale ships as two byte-identical `_locales`
  directories (`pt_BR`, `pt_PT`), because Chrome's own manifest-locale list has
  no bare `pt`."

## Impact

- `apps/extension/public/_locales/pt/` (deleted) →
  `apps/extension/public/_locales/pt_BR/`,
  `apps/extension/public/_locales/pt_PT/` (added, identical content).
- `apps/extension/src/i18n-locale-set.test.ts` (test logic updated).
- `apps/extension/src/i18n-parity.test.ts` (test logic updated).
- `docs/architecture.md` (i18n section updated).
- No manifest.json, Paraglide catalog, or resolver changes.
