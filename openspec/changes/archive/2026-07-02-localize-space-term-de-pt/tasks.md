## 1. German catalog (`de`)

- [x] 1.1 In `apps/extension/messages/de.json`, replace the "Space" concept term
  across all ~19 strings: `Space` → `Raum`, pl. `Spaces` → `Räume`, dative pl.
  "aus anderen Spaces" → "aus anderen Räumen", genitive sing. `Spaces`/`Space` →
  `Raums` (e.g. "dieses Spaces" → "dieses Raums", "des aktiven Spaces" → "des
  aktiven Raums"), and `Space-Farbe` (`sidebar_spaceColorLabel`) → `Raumfarbe`.
  Edit per string for case agreement; do not blind find-replace.
- [x] 1.2 In `apps/extension/public/_locales/de/messages.json`, translate the 2
  strings that name "Space(s)": the extension description ("…projektbezogene
  Spaces…" → "…projektbezogene Räume…") and the `pin-active-tab` command
  description ("…im aktuellen Space…" → "…im aktuellen Raum…").

## 2. Portuguese catalog (`pt`)

- [x] 2.1 In `apps/extension/messages/pt.json`, replace across all ~19 strings:
  `Space` → `Espaço`, pl. `Spaces` → `Espaços`. Review each string for article
  agreement (e.g. "deste Space" → "deste Espaço", "Todos os Spaces" → "Todos os
  Espaços").
- [x] 2.2 In `apps/extension/public/_locales/pt/messages.json`, translate the 2
  strings: the extension description ("…Spaces por projeto…" → "…Espaços por
  projeto…") and the `pin-active-tab` command description ("…no Space atual…" →
  "…no Espaço atual…").

## 3. Verification

- [x] 3.1 Confirm zero residual English concept-term in string VALUES (message
  KEYS like `sidebar_editSpace` legitimately keep "Space" and are unchanged):
  `grep -nE ': "[^"]*Space' apps/extension/messages/{de,pt}.json
  apps/extension/public/_locales/{de,pt}/messages.json` returns no matches.
- [x] 3.2 Confirm no key changed: message KEYS in `de.json`/`pt.json` are
  identical to before (only values edited); the `en` source is untouched.
- [x] 3.3 Run `pnpm --filter @lunma/extension verify` — `i18n-parity`,
  `i18n-locale-set`, and `i18n-no-literal` stay green; full gate passes.
- [x] 3.4 Spot-check the sidebar Space editor and Options (launcher-scope, tint
  description) in `de` and `pt` to confirm the term reads naturally in context.
