## ADDED Requirements

### Requirement: User-facing surface strings render through the message catalog

Every user-visible string in the sidebar, launcher (new-tab + the `Alt+L` overlay), and options surfaces SHALL render through a Paraglide message function (`m.*`), not a hardcoded literal. New message keys SHALL be added to
`apps/extension/messages/en.json` (the source of truth) under a flat, surface-namespaced
key convention; interpolation and plurals SHALL use Paraglide's ICU message syntax.
Surfaces SHALL continue to obtain locale *state* only via `src/shared/i18n.ts`; they
render messages via the generated `m.*` directly (the locale-state-vs-message-rendering
split established by `add-i18n-foundation`).

The brand string "Lunma" and the endonym option labels in `settings.ts` SHALL remain
literal (intentionally untranslated).

#### Scenario: A surface string is read from the catalog

- **WHEN** a sidebar/launcher/options surface renders a user-facing label
- **THEN** the text SHALL come from a `m.*` message function keyed in `messages/en.json`, not a string literal in the component

#### Scenario: Switching locale changes the rendered text

- **GIVEN** the `language` setting resolves to `de`
- **WHEN** a migrated surface paints
- **THEN** its strings SHALL render from the `de` catalog (German), not English

### Requirement: Authored translations for every supported non-base locale

Each supported non-base locale SHALL ship authored, context- and length-conscious translations of every key — replacing the English-copy seeds from `add-i18n-foundation` — in both `apps/extension/messages/{locale}.json` and `apps/extension/public/_locales/{locale}/messages.json`. The existing catalog-parity test SHALL continue
to guarantee key-completeness with no empty values; translation *quality* is a human
review gate (not asserted by a test).

#### Scenario: No locale ships English placeholders for migrated keys

- **WHEN** a migrated key is present in `en.json`
- **THEN** each non-`en` catalog SHALL provide that key's value as a translation in its own language (not a verbatim English copy), with the parity test still green

### Requirement: Launcher overlay localization within the byte budget

The `Alt+L` launcher overlay SHALL display its user-facing strings localized within the overlay byte budget (`overlay.budget.test.ts`, <15KB), by one of two mechanisms: (Plan A) the
overlay imports the relevant `m.*` messages, permitted only if
`src/launcher/overlay.budget.test.ts` stays within its <15KB ceiling with those messages
tree-shaken in; or (Plan B) the service worker sends pre-localized label strings to the
overlay over the typed message bus, keeping the overlay catalog-free. The design SHALL
record the measured choice; whichever is chosen, the overlay budget guard SHALL stay
green and the overlay SHALL remain SW-safe (no `window`/`document` access for locale).

#### Scenario: The overlay budget guard holds after localization

- **WHEN** `overlay.budget.test.ts` runs after the overlay is localized
- **THEN** the overlay bundle SHALL remain under its 15KB ceiling

### Requirement: The pipeline fails on a new un-localized user-facing string

`pnpm verify` SHALL fail when a new user-facing string is introduced in a migrated
surface (`sidebar/`, `launcher/`, `options/`) as a literal instead of a message. The
mechanism SHALL be a Vitest guard `apps/extension/src/i18n-no-literal.test.ts` that parses
each surface `.svelte` template (via the Svelte compiler AST) and fails on a user-visible
literal text node, EXCEPT where allow-listed: whitespace/punctuation-only nodes, the brand
string "Lunma", text inside `code`/`pre`/`<style>`, legitimately-fixed attributes (class
names, `data-testid`, non-visible `aria` identifiers), and an explicit inline
`i18n-exempt` escape hatch (`<!-- i18n-exempt: reason -->` / `// i18n-exempt`). The guard
SHALL report the offending `file:line` and text. The guard SHALL cover template text
nodes AND user-facing attribute / component-prop literals (`placeholder`, `title`,
`aria-label`/`ariaLabel`, `alt`, `heading`, `label`, `description`, `subtitle`); literal
strings in `<script>` logic (e.g. option-list labels, toast text) are outside its scope
and remain a review concern.

A `m.*` reference with no catalog key SHALL fail `verify` — enforced by the TypeScript
compiler, not a separate lint: Paraglide generates a typed `m` namespace, so a missing key
is a compile error (`tsc`, already in `verify`), which is stronger than a runtime lint.

#### Scenario: A hardcoded surface literal fails verify

- **GIVEN** a developer adds a visible literal string to a migrated `.svelte` surface without a message key or an `i18n-exempt` marker
- **WHEN** `pnpm verify` runs
- **THEN** `i18n-no-literal.test.ts` SHALL fail, reporting the file, line, and the offending text

#### Scenario: An explicitly exempt literal passes

- **GIVEN** an intentional literal carries an inline `i18n-exempt` marker (or is the brand string "Lunma")
- **WHEN** the guard runs
- **THEN** it SHALL NOT fail on that literal

#### Scenario: A message reference with no catalog key fails verify

- **WHEN** a surface calls `m.someKey()` that is absent from `messages/en.json`
- **THEN** `tsc` (in `verify`) SHALL fail — the generated `m` namespace is typed, so the missing property is a compile error
