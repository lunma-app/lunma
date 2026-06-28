## ADDED Requirements

### Requirement: Settings control labels are localized without a settings→i18n edge

The options page SHALL render each setting's control **label** and **description** through
a Paraglide message function, so the Settings UI is fully localized. The mapping from a
setting `key` to its message SHALL live in a new `apps/extension/src/options/labels.ts`
indirection consumed by `Options.svelte` at render time — **not** in `settings.ts`.
`settings.ts` SHALL continue to import no i18n catalog and SHALL retain its literal
`label`/`description` fields as the declaration shape and the non-localized fallback, so
no `settings → i18n` import edge is introduced (the cycle ban from `add-i18n-foundation`
D4 holds, enforced by `biome check`'s `noImportCycles`). The endonym option labels of the
`language` setting SHALL remain literal.

#### Scenario: A setting label renders localized via the indirection

- **GIVEN** the active locale is `fr`
- **WHEN** the options page renders a setting row
- **THEN** its label and description SHALL come from `options/labels.ts` → `m.*` in French, while `settings.ts` imports no catalog

#### Scenario: No settings→i18n import cycle is introduced

- **WHEN** `biome check` runs after the labels are localized
- **THEN** `settings.ts` SHALL import no i18n catalog and `noImportCycles` SHALL pass

#### Scenario: Endonym option labels stay literal

- **WHEN** the `language` setting's options render
- **THEN** each option SHALL show its endonym literal (Español, 日本語, …), not a message-backed string
