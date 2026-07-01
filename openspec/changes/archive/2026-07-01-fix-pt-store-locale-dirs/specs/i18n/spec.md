## MODIFIED Requirements

### Requirement: Native manifest and store-listing localization

The extension manifest SHALL be localized via the native `chrome.i18n` mechanism,
independent of Paraglide. `apps/extension/public/manifest.json` SHALL declare
`"default_locale": "en"` and SHALL reference localizable values as `__MSG_key__`
placeholders for: the extension `description`, `action.default_title`, and the
`description` of each declared command (`pin-active-tab`, `toggle-launcher`). The brand
`name` and `short_name` ("Lunma") SHALL remain literal and untranslated.

For every supported locale there SHALL be at least one
`apps/extension/public/_locales/{locale}/messages.json` providing the referenced message
keys; these files SHALL be passed through verbatim by the build (as `public/` already is
for `fonts/` and `icons/`). The `_locales` subdirectory names SHALL use Chrome's
underscore locale codes (`zh_CN`), not the BCP-47 hyphens the Paraglide
`messages/` catalogs use — a platform path convention, mapped (`-` → `_`) by the parity
and locale-set tests.

Chrome's own manifest-locale enum has no bare `pt` — only `pt_BR` and `pt_PT` — so a
directory literally named `pt` is invisible to the Chrome Web Store's supported-languages
listing even though `chrome.i18n` resolves it correctly at runtime. The region-neutral
`pt` app locale (Paraglide catalog, resolver, `SupportedLocale`) is therefore the ONLY
locale that fans out to two `_locales` directories on disk —
`apps/extension/public/_locales/pt_BR/messages.json` and
`apps/extension/public/_locales/pt_PT/messages.json` — both carrying byte-identical
content (the single region-neutral Portuguese copy, no region-specific translation). This
fan-out is Store-metadata only: the app-level locale set stays single-sourced at one
entry (`pt`), and the resolver still resolves every Portuguese browser variant to the one
`pt` locale. An automated test SHALL assert the two `pt` manifest files remain
byte-identical, so they cannot silently diverge into two different translations. The
Chrome Web Store listing's title/description fields are localized in the CWS dashboard
(an external, non-code task) and are out of scope for this spec.

#### Scenario: Manifest declares a default locale and message placeholders

- **WHEN** the built manifest is inspected
- **THEN** it SHALL contain `default_locale: "en"` and `__MSG_*__` placeholders for the description, action title, and command descriptions, while `name`/`short_name` remain the literal string "Lunma"

#### Scenario: A non-English UI localizes the action title

- **GIVEN** the browser UI language is a supported non-English locale with a populated `_locales` entry
- **WHEN** the extension loads
- **THEN** `chrome.i18n` SHALL resolve the action default title and description from that locale's `messages.json`

#### Scenario: Portuguese ships as two byte-identical Store-recognized directories

- **GIVEN** the app-level locale set includes the single region-neutral `pt` locale
- **WHEN** the `_locales` directory tree is inspected
- **THEN** it SHALL contain both `pt_BR/messages.json` and `pt_PT/messages.json`, and their contents SHALL be byte-identical
- **AND** it SHALL NOT contain a bare `pt/` directory
