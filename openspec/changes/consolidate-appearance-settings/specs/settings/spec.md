## MODIFIED Requirements

### Requirement: Settings reads are Zod-validated with safe field-level fallback

`readSettings()` SHALL parse the stored object through the derived Zod schema. Each field SHALL use `.catch(<declared default>)` so an out-of-range or wrong-typed stored value falls back to that setting's default rather than failing the whole read. A completely absent or unparseable object SHALL yield `DEFAULTS`. The declared default for `density` SHALL be `comfort`.

#### Scenario: Unknown enum value falls back to the declared default

- **WHEN** `'lunma.settings'` contains `{ density: 'ultra' }`
- **THEN** `readSettings()` resolves with `density: 'comfort'`

#### Scenario: Malformed object yields defaults

- **WHEN** `'lunma.settings'` contains a non-object (e.g. a string) or is absent
- **THEN** `readSettings()` resolves with `DEFAULTS` without throwing

### Requirement: Global default for keeping pinned tabs on their site

Settings SHALL declare `pinnedTabBoundaryDefault: 'off' | 'domain' | 'page'`
(default `'off'`) as an enum setting in the `Tabs` group, rendered by the
existing declarative settings engine and persisted to `chrome.storage.sync`. The
setting SHALL be the **baseline** that an individual pinned tab's `boundary`
overrides:

- `'off'` (default) — a pinned tab with no explicit `boundary` is **not** confined
  (today's free-drift behaviour).
- `'domain'` — a pinned tab with no explicit `boundary` is confined to the
  registrable domain of its `originalURL` (a whole-host lock).
- `'page'` — a pinned tab with no explicit `boundary` is confined to its current
  **view**, the URL glob `pageGlob(originalURL)` = `origin + pathname + '*'`, so
  links off that page (including same-host links) open in a new temporary tab.

The rendered control SHALL present three options with legible labels (e.g.
**Off** · **Lock to domain** · **Lock to this page**) and one-line descriptions.
A per-tab `boundary` of `{ mode: 'off' }` or `{ mode: 'locked' }` SHALL override
the global default for that tab. Changing the setting SHALL re-resolve the
effective allow-set for every currently bound, **inheriting** tab (via the SW's
settings watcher) without requiring a re-pin. The setting SHALL NOT alter tabs
whose `boundary` is explicitly set.

#### Scenario: Default keeps current behaviour

- **WHEN** `pinnedTabBoundaryDefault` is `'off'` (the default) and a pinned tab has no explicit boundary
- **THEN** the tab SHALL navigate freely (no enforcement), exactly as before this change

#### Scenario: Flipping the default to domain locks inheriting pins live

- **WHEN** the user changes `pinnedTabBoundaryDefault` to `'domain'`
- **THEN** every bound pinned tab with no explicit boundary SHALL become confined to its registrable domain without re-pinning

#### Scenario: The control renders under the Tabs group

- **WHEN** the options page is rendered from the settings declarations
- **THEN** the `pinnedTabBoundaryDefault` control SHALL appear under the `Tabs` group, not a separate `Pinned tabs` group

### Requirement: Background effects (showGlares) toggle setting

The settings registry SHALL declare a `showGlares` toggle (`type: 'toggle'`,
`group: 'Appearance'`, `label: 'Atmosphere glow'`, `default: true`) on the
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
- **THEN** a two-segment Off | On `SegmentedControl` for "Atmosphere glow" SHALL appear under the "Appearance" group

#### Scenario: Changing the toggle updates the surface live

- **WHEN** the user sets "Atmosphere glow" to Off
- **THEN** the new value SHALL persist to `chrome.storage.sync`
- **AND** a consuming surface SHALL update its `data-show-glares` attribute via `watchSettings` without reload

## ADDED Requirements

### Requirement: Theme setting

The settings registry SHALL declare a `theme` enum (`type: 'enum'`,
`group: 'Appearance'`, `label: 'Theme'`, `default: 'dark'`, options
`dark | light`) on the `Settings` interface. It SHALL render under the
`Appearance` group as a segmented control reflecting the stored value, and a
consuming surface SHALL reflect it onto `data-theme` and update live via
`watchSettings`.

#### Scenario: Theme defaults to dark and renders under Appearance

- **WHEN** the options page renders with no stored `theme`
- **THEN** a `Dark | Light` segmented control labelled "Theme" SHALL appear under the "Appearance" group with `Dark` selected

### Requirement: Reduce motion setting

The settings registry SHALL declare a `reduceMotion` toggle (`type: 'toggle'`,
`group: 'Appearance'`, `label: 'Reduce motion'`, `default: false`) on the
`Settings` interface. When `true`, drifting/ambient motion SHALL be held and
transitions eased; the OS `prefers-reduced-motion` preference SHALL still force
the reduced state regardless of this setting.

#### Scenario: Reduce motion defaults to false and renders under Appearance

- **WHEN** the options page renders with no stored `reduceMotion`
- **THEN** a two-segment Off | On control labelled "Reduce motion" SHALL appear under the "Appearance" group set to Off

### Requirement: Options page sections are organised, named, and self-describing

The options page SHALL present its settings under a small set of named sections
rendered in this order: `Connections`, `Search & launcher`, `Appearance`,
`Tabs`, `Auto-archive`, `Backup & restore`. There SHALL be no separate
`Look & feel` or `Pinned tabs` section — `theme`, `showGlares`, `reduceMotion`,
`density`, and `tint` all live under `Appearance`, and `pinnedTabBoundaryDefault`
lives under `Tabs`.

Each section card SHALL render a one-line description beneath its heading
(via a `SettingsCard` `description` prop). The launcher's optional result-source
providers card SHALL render directly beneath the `Search & launcher` group, and
the recently-archived management card directly beneath the `Auto-archive` group,
so each management surface sits with the settings it relates to.

#### Scenario: Appearance is the single visual section

- **WHEN** the options page renders
- **THEN** a single `Appearance` section SHALL contain Theme, Colour intensity, Density, Atmosphere glow, and Reduce motion
- **AND** no `Look & feel` section SHALL render

#### Scenario: Sections carry intro copy

- **WHEN** the options page renders
- **THEN** each section card SHALL show a one-line description beneath its heading

#### Scenario: Management cards sit with their settings

- **WHEN** the options page renders
- **THEN** the result-sources card SHALL appear directly beneath the `Search & launcher` group
- **AND** the recently-archived card SHALL appear directly beneath the `Auto-archive` group
