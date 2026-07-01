## MODIFIED Requirements

### Requirement: Language preference setting

The settings registry SHALL declare a `language` setting (`type: 'enum'`,
`group: 'Appearance'`, `label: 'Language'`, `default: 'auto'`) on the `Settings`
interface, persisted to `chrome.storage.sync` through the existing declarative engine.
Its options SHALL be `auto` (labelled "System") plus one entry per supported UI locale,
each labelled with its **endonym** (the language's own name): `en` "English", `es`
"Español", `pt` "Português", `fr` "Français", `de` "Deutsch", `ja` "日本語", `ko`
"한국어", `zh-CN` "简体中文", `ru` "Русский". The stored type SHALL be
`SupportedLocale | 'auto'`.

The endonym option labels SHALL be literal strings in the declaration (a language name
is shown in its own language, so it is not itself translated), so `settings.ts` carries
no dependency on the i18n message catalog and no `settings → i18n` import edge is
introduced. The derived Zod SHALL be `z.enum([...]).catch('auto')` so an absent or
out-of-range stored value falls back to `'auto'` rather than failing the whole read. A
previously-stored `'pt-PT'` value (no longer a member of the enum after the Portuguese
locale became region-neutral `pt`) SHALL therefore coerce to `'auto'` on read, which
re-resolves to `pt` for a Portuguese browser — a graceful, lossless fallback requiring
no store schema-version bump (the `language` setting lives in `chrome.storage.sync`,
not the versioned AppState).

#### Scenario: The language options list one endonym per supported locale

- **WHEN** the Options language picker is rendered
- **THEN** it SHALL offer "System" plus exactly `en` "English", `es` "Español", `pt` "Português", `fr` "Français", `de` "Deutsch", `ja` "日本語", `ko` "한국어", `zh-CN` "简体中文", `ru` "Русский"
- **AND** no `pt-PT` option SHALL appear

#### Scenario: A stale stored Portuguese preference falls back gracefully

- **GIVEN** a user previously stored `language: 'pt-PT'` before this change
- **WHEN** the settings are read after the locale became `pt`
- **THEN** `z.enum([...]).catch('auto')` SHALL coerce the out-of-range `'pt-PT'` to `'auto'`
- **AND** a Portuguese browser SHALL re-resolve that `'auto'` to `pt`, so the UI stays Portuguese
