## ADDED Requirements

### Requirement: Language preference setting

The settings registry SHALL declare a `language` setting (`type: 'enum'`,
`group: 'Appearance'`, `label: 'Language'`, `default: 'auto'`) on the `Settings`
interface, persisted to `chrome.storage.sync` through the existing declarative engine.
Its options SHALL be `auto` (labelled "System") plus one entry per supported UI locale,
each labelled with its **endonym** (the language's own name): `en` "English", `es`
"Español", `pt-PT` "Português", `fr` "Français", `de` "Deutsch", `ja` "日本語", `ko`
"한국어", `zh-CN` "简体中文", `ru` "Русский". The stored type SHALL be
`SupportedLocale | 'auto'`.

The endonym option labels SHALL be literal strings in the declaration (a language name
is shown in its own language, so it is not itself translated), so `settings.ts` carries
no dependency on the i18n message catalog and no `settings → i18n` import edge is
introduced. The derived Zod SHALL be `z.enum([...]).catch('auto')` so an absent or
out-of-range stored value falls back to `'auto'` rather than failing the whole read.

`'auto'` is a sentinel meaning "resolve from the browser locale on first run"; the
resolution from `'auto'` to a concrete locale happens in the i18n resolver
(`initLocale()`, see the `i18n` capability), **not** in `DEFAULTS`, so `DEFAULTS.language`
SHALL remain the static value `'auto'`.

#### Scenario: Language defaults to auto

- **WHEN** settings are read with no stored value for `language`
- **THEN** `language` SHALL be `'auto'`

#### Scenario: An out-of-range stored language falls back to auto

- **WHEN** the stored `language` value is not one of `auto` or a supported locale
- **THEN** the field-level Zod fallback SHALL resolve it to `'auto'` without failing the whole settings read

#### Scenario: Language renders as an Appearance dropdown

- **WHEN** the options page is rendered from the settings declarations
- **THEN** the Appearance group SHALL show a `Language` control
- **AND** because it carries more than 4 options it SHALL render as a `Select` dropdown (stacked beneath its label) with the current value selected

#### Scenario: Selecting a language persists immediately

- **WHEN** the user selects a language option (a concrete locale or `auto`)
- **THEN** the Options `onSelect` handler SHALL route `language` through the i18n locale
  path — `setLocale(value, { reload: false })`, which persists via
  `writeSetting('language', value)` — rather than a bare `writeSetting`, with no
  intervening save action (mirroring the existing `density`/`theme` special-cases in
  `onSelect`)
