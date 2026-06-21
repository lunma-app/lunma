## ADDED Requirements

### Requirement: Background effects (showGlares) toggle setting

The settings registry SHALL declare a `showGlares` toggle (`type: 'toggle'`,
`group: 'Appearance'`, `label: 'Background effects'`, `default: true`) on the
`Settings` interface. When `false`, all aurora backdrop and hue-glow light
effects SHALL be suppressed on every surface; the setting has no effect on
glass panels (`backdrop-filter`). Persistence, Zod schema (`z.boolean().catch(true)`),
default derivation, and options-page rendering SHALL all follow from the single
declaration with no additional read/write/render code.

A surface root that consumes `showGlares` SHALL reflect it as a
`data-show-glares` attribute on its root element (`"true"` / `"false"`), and
SHALL update live via `watchSettings` so a change made in options takes effect
without a reload.

#### Scenario: showGlares defaults to true

- **WHEN** settings are read with no stored value for `showGlares`
- **THEN** it SHALL resolve to `true`

#### Scenario: A malformed stored value falls back to the default

- **WHEN** the stored `showGlares` value is not a boolean
- **THEN** the field-level Zod fallback SHALL resolve it to `true` without failing the whole settings read

#### Scenario: The toggle renders on the options page

- **WHEN** the options page is rendered from the settings declarations
- **THEN** a two-segment Off | On `SegmentedControl` for "Background effects" SHALL appear under the "Appearance" group

#### Scenario: Changing the toggle updates the surface live

- **WHEN** the user sets "Background effects" to Off
- **THEN** the new value SHALL persist to `chrome.storage.sync`
- **AND** a consuming surface SHALL update its `data-show-glares` attribute via `watchSettings` without reload
