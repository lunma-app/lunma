## Why

German and European-Portuguese users see the core workspace concept — a "Space" —
labelled with the raw English word "Space" throughout the sidebar and Options
surfaces ("Neuer Space…", "Novo Space…", "Alle Spaces"). Every other supported
locale already localises it (es `espacio`, fr `espace`, ja `スペース`, ko
`스페이스`, ru `пространство`, zh-CN `空间`), so `de` and `pt` read as
half-translated. This change finishes the translation so the concept reads in the
user's own language on the surfaces they use most. It is a direct, user-visible
localisation-quality fix — not plumbing.

## What Changes

- Translate the UI "Space" concept term in the two catalogs that still keep the
  English word:
  - `apps/extension/messages/de.json` (~19 strings): `Space` → `Raum`, plural
    `Spaces` → `Räume` (dative pl. `Räumen`), genitive sing. `Spaces`/`Space` →
    `Raums`, and the compound `Space-Farbe` → `Raumfarbe`.
  - `apps/extension/messages/pt.json` (~19 strings): `Space` → `Espaço`, plural
    `Spaces` → `Espaços` (European Portuguese, matching the `pt` catalog).
- Translate the same term in the native manifest catalogs:
  - `apps/extension/public/_locales/de/messages.json` (2 strings: extension
    description + the `pin-active-tab` command description).
  - `apps/extension/public/_locales/pt/messages.json` (2 strings: same two).
- No message KEYS change and no new keys are added, so the i18n key-parity and
  locale-set guards stay green. Source-of-truth `en.json` is untouched.

German term rationale: `Raum` ("room/space") preserves Arc's spatial metaphor
for the workspace concept and declines across the strings (sing. `Raum`/genitive
`Raums`/dative `Raum`, pl. `Räume`/dative `Räumen`, compound `Raumfarbe`).
Portuguese uses `Espaço`/`Espaços`, the natural European-Portuguese term already
implied by the rest of the `pt` catalog.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `i18n`: tightens the existing "Authored translations for every supported
  non-base locale" requirement to make explicit that UI concept-terms (in
  particular the workspace "Space") are rendered in each locale's own language
  rather than carried as the English word — with the existing brand-string
  ("Lunma") and endonym-label exceptions unchanged. Closes the loophole that let
  `de`/`pt` keep the English literal, so they cannot silently regress.

## Impact

- **Code:** `apps/extension/messages/{de,pt}.json`,
  `apps/extension/public/_locales/{de,pt}/messages.json` — string values only.
- **Tests:** `src/i18n-parity.test.ts` and `src/i18n-locale-set.test.ts` stay
  green (keys and locale set unchanged). `src/i18n-no-literal.test.ts` is
  unaffected (it guards the `en` source, which does not change).
- **Docs:** none. No `docs/` file names the per-locale term for "Space"; the
  behavioural rule lives in the `i18n` spec (updated in this change). `docs/`
  files are left untouched.
- **No new** public types, files, methods, fields, dependencies, primitives, or
  UI surfaces. No visual/motion surface is added or restyled (string content
  only), so no `Visual language` section applies.
