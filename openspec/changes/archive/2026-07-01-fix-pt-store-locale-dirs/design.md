## Context

`2026-07-01-rename-pt-pt-to-pt` collapsed the Portugal-specific `pt-PT` locale
into a region-neutral `pt` everywhere a locale code appears, including the
native `chrome.i18n` manifest catalog directory
(`apps/extension/public/_locales/pt/`). That was correct for the app-level
locale set — Paraglide catalog, resolver, `SupportedLocale` — but Chrome Web
Store's own manifest-locale list (the one the Store dashboard's Language
picker reads from) is a fixed enum that includes `pt_BR` and `pt_PT` but no
bare `pt`. A directory named `pt` is invisible to the Store even though
`chrome.i18n` resolves it fine at runtime inside a loaded extension — it's a
build-time / Store-tooling-only gap.

## Goals / Non-Goals

**Goals:**
- Restore Portuguese visibility in the Chrome Web Store's supported-languages
  list.
- Keep exactly one authored Portuguese copy — no new translation work, no
  divergence between a `pt_BR` and a `pt_PT` variant.
- Leave the app-level region-neutral `pt` locale (Paraglide, resolver,
  `SupportedLocale`, persisted `language` setting) completely untouched.

**Non-Goals:**
- Re-introducing region-specific Portuguese *content* (Brazilian vs.
  European copy). Both directories carry the same region-neutral text.
- Any change to `manifest.json`, the resolver's `BASE_TAG_TO_LOCALE` map, or
  the Paraglide catalog set.

## Decisions

### D1 — Ship the manifest catalog as `pt_BR` + `pt_PT`, both byte-identical

`apps/extension/public/_locales/pt/` is replaced by
`apps/extension/public/_locales/pt_BR/messages.json` and
`apps/extension/public/_locales/pt_PT/messages.json`, both copies of the
current file. This is the minimal fix for Chrome's fixed locale enum without
reopening the region-neutral decision at the app level.

- **Alternative — ship only `pt_PT`:** rejected. Brazilian Chrome installs
  (`pt-BR` UI language) would still show no Store-recognized Portuguese
  entry for their exact browser locale; shipping both costs nothing (same
  file, copied twice) and covers both Store-recognized variants.
- **Alternative — revert to `pt-PT` app-wide (undo the prior rename):**
  rejected. That was already considered and rejected in the original change
  design; this fix is scoped to the Store-metadata layer only, not a reversal
  of the region-neutral resolver decision.

### D2 — Test guards fold `pt_BR`/`pt_PT` back to `pt`, plus a drift guard

`i18n-locale-set.test.ts`'s `manifestCatalogLocales()` currently assumes one
`_locales` directory per app locale. It now maps `pt-BR`/`pt-PT` (post
underscore→hyphen normalization) back to the single app locale `pt` before
deduping and comparing against `EXPECTED`, so the locale-*set* invariant
(one entry per app locale) still holds. A new test reads both
`pt_BR/messages.json` and `pt_PT/messages.json` and asserts they are
byte-identical (`JSON.stringify` equality), so the Store-metadata fan-out
can never silently diverge into two different translations without a test
failure.

`i18n-parity.test.ts`'s `chromeDir()` helper — used for the key-completeness
check against `en` — resolves `pt` to `pt_PT` specifically (an explicit
override), since byte-identity with `pt_BR` is already guarded by the test
above; checking both would be redundant.

- **Alternative — assert key-parity separately for both `pt_BR` and
  `pt_PT`:** rejected as redundant once byte-identity is asserted; one
  parity check plus one identity check gives the same guarantee with less
  test surface.

## Risks / Trade-offs

- [Risk] A future translator edits `pt_BR/messages.json` or
  `pt_PT/messages.json` directly and the two drift → [Mitigation] the new
  byte-identity test in `i18n-locale-set.test.ts` fails `pnpm verify`
  immediately.
- [Risk] Someone reads the two directories and assumes Lunma has real
  Brazilian-Portuguese content → [Mitigation] `docs/architecture.md` states
  explicitly that both directories carry the same region-neutral copy, and
  the spec delta explains why the fan-out exists.

## Migration Plan

1. Delete `apps/extension/public/_locales/pt/`.
2. Add `apps/extension/public/_locales/pt_BR/messages.json` and
   `apps/extension/public/_locales/pt_PT/messages.json` (identical content
   to the deleted file).
3. Update `i18n-locale-set.test.ts` and `i18n-parity.test.ts` per D2.
4. Update `docs/architecture.md`'s i18n section.
5. `pnpm verify` (extension package) to confirm the test guards pass.

No rollback complexity — this is a static-asset + test change with no
runtime code path affected; reverting is a plain file/test revert.
