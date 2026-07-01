## MODIFIED Requirements

### Requirement: Authored translations for every supported non-base locale

Each supported non-base locale SHALL ship authored, context- and length-conscious translations of every key — replacing the English-copy seeds from `add-i18n-foundation` — in both `apps/extension/messages/{locale}.json` and `apps/extension/public/_locales/{locale}/messages.json`. UI concept-terms — in particular the workspace **"Space"** — SHALL be rendered in each locale's own language, not carried as the English word, EXCEPT the brand string "Lunma" and the endonym option labels, which remain literal (as governed by the manifest- and surface-string requirements). The existing catalog-parity test SHALL continue
to guarantee key-completeness with no empty values; translation *quality* (including whether a concept-term is genuinely localized) is a human
review gate (not asserted by a test).

#### Scenario: No locale ships English placeholders for migrated keys

- **WHEN** a migrated key is present in `en.json`
- **THEN** each non-`en` catalog SHALL provide that key's value as a translation in its own language (not a verbatim English copy), with the parity test still green

#### Scenario: The workspace concept-term is localized in every locale

- **WHEN** a catalog string names the workspace "Space" concept in `de` or `pt`
- **THEN** it SHALL use the locale's own term (`de` → `Raum`/pl. `Räume`/genitive `Raums`/dative pl. `Räumen`; `pt` → `Espaço`/`Espaços`), not the English word "Space", consistent with `es`/`fr`/`ja`/`ko`/`ru`/`zh-CN` which already localize it
