# settings Specification

## Purpose

Defines Lunma's declarative user-settings layer: a single registry from which the Zod schema, defaults, persistence, change notification, and options-page rendering are all derived; the `chrome.storage.sync` persistence boundary in `settings.ts`; safe field-level validation fallback; cross-surface change notification; and the token-only `SegmentedControl` primitive.
## Requirements
### Requirement: Settings are declared once in a registry

User settings SHALL be declared in a `SETTINGS` array in `src/shared/settings.ts`, each declaration carrying at least `{ key, type, default, label, group }`; `enum` settings SHALL additionally carry an `options` array of `{ value, label }`, `text` settings MAY carry an optional `placeholder`, and `number` settings MAY carry optional `min` / `max` / `step` and `placeholder` hints. The declaration `default` field SHALL accept `string | boolean | number` so non-`enum`/`text` variants carry a correctly-typed default. The Zod validation schema and the `DEFAULTS` object SHALL be derived from `SETTINGS` at module load — not maintained separately. A compile-time assertion SHALL guarantee the derived schema's output type matches the exported `Settings` interface.

The declaration union SHALL support these control `type`s: `enum`, `text`, `toggle` (a boolean), and `number` (an integer). Their derived Zod SHALL be: `enum → z.enum(values).catch(default)`, `text → z.string().catch(default)`, `toggle → z.boolean().catch(default)`, `number → z.number().int().catch(default)` (with the declared `min` applied as a floor where present). Additional variants arrive with their first consumer.

#### Scenario: Defaults derive from declarations

- **WHEN** `readSettings()` is called and no settings have been saved
- **THEN** it resolves with an object whose every field equals the `default` declared for that key in `SETTINGS`

#### Scenario: Adding an enum setting is a single declaration

- **WHEN** a new `enum` setting is appended to `SETTINGS` with a `default`, `label`, `group`, and `options`
- **THEN** its default, Zod validation, and options-page rendering follow from the declaration with no additional read/write/render code

#### Scenario: Adding a text setting is a single declaration

- **WHEN** a new `text` setting is appended to `SETTINGS` with a string `default`, `label`, and `group`
- **THEN** its default, Zod validation (`z.string().catch(default)`), and options-page rendering follow from the declaration with no additional read/write/render code

#### Scenario: A toggle setting derives a boolean schema and default

- **WHEN** a `toggle` setting is declared with `default: true`
- **THEN** `DEFAULTS` SHALL carry that key as the boolean `true`
- **AND** its derived Zod SHALL be `z.boolean().catch(true)` so a non-boolean stored value falls back to `true`

#### Scenario: A number setting derives an integer schema and default

- **WHEN** a `number` setting is declared with `default: 60`
- **THEN** `DEFAULTS` SHALL carry that key as the number `60`
- **AND** its derived Zod SHALL parse to an integer and fall back to `60` on a wrong-typed or absent stored value

### Requirement: Settings persist to chrome.storage.sync via settings.ts

All reads and writes of settings SHALL go through `src/shared/settings.ts`, which stores a single object under the key `'lunma.settings'` in `chrome.storage.sync`. No other module SHALL access that key directly. The module SHALL export exactly `readSettings`, `writeSetting`, and `watchSettings` (plus the `SETTINGS`, `DEFAULTS`, and type declarations).

#### Scenario: writeSetting persists a single field and preserves others

- **WHEN** `writeSetting('density', 'compact')` is called
- **THEN** the stored `'lunma.settings'` object has `density: 'compact'` and every other field retains its previous value

#### Scenario: Storage failure does not throw

- **WHEN** `chrome.storage.sync.set` rejects (e.g. quota or unavailable)
- **THEN** `writeSetting` catches and logs the error and does not reject to the caller

### Requirement: Settings reads are Zod-validated with safe field-level fallback

`readSettings()` SHALL parse the stored object through the derived Zod schema. Each field SHALL use `.catch(<declared default>)` so an out-of-range or wrong-typed stored value falls back to that setting's default rather than failing the whole read. A completely absent or unparseable object SHALL yield `DEFAULTS`.

#### Scenario: Unknown enum value falls back to the declared default

- **WHEN** `'lunma.settings'` contains `{ density: 'ultra' }`
- **THEN** `readSettings()` resolves with `density: 'normal'`

#### Scenario: Malformed object yields defaults

- **WHEN** `'lunma.settings'` contains a non-object (e.g. a string) or is absent
- **THEN** `readSettings()` resolves with `DEFAULTS` without throwing

### Requirement: watchSettings notifies other surfaces on change

`watchSettings(cb)` SHALL subscribe to `chrome.storage.onChanged`, filtering for `areaName === 'sync'` and the `'lunma.settings'` key, parse the new value through the schema, and invoke `cb` with the resulting `Settings`. It SHALL return an unsubscribe function that removes the listener.

#### Scenario: Change in one surface reaches another

- **WHEN** the options page calls `writeSetting('density', 'comfort')`
- **THEN** a `watchSettings` callback registered in the sidebar document is invoked with `density: 'comfort'` within one `chrome.storage.onChanged` event

#### Scenario: Unsubscribe stops notifications

- **WHEN** the function returned by `watchSettings(cb)` is called
- **THEN** `cb` is not invoked on subsequent settings changes

#### Scenario: Unrelated storage changes are ignored

- **WHEN** a change fires for `areaName === 'local'` or for a key other than `'lunma.settings'`
- **THEN** registered `watchSettings` callbacks are not invoked

### Requirement: Options page is rendered from the settings declarations

`src/options/Options.svelte` SHALL render its controls by iterating `SETTINGS`, grouping by `group`, and dispatching on `type`. For `type: 'enum'` it SHALL render a `SegmentedControl` when the option set is small (≤ 4 options) and a `Select` dropdown otherwise (so a many-option enum such as the search-engine picker stays usable rather than overflowing a single row); either reflects the current saved value. For `type: 'text'` it SHALL render the `TextInput` primitive bound to the current saved value, persisting via `writeSetting(key, value)` as the user edits. For `type: 'toggle'` it SHALL render a two-option `SegmentedControl` (`Off` | `On`) mapping to the boolean value. For `type: 'number'` it SHALL render a numeric `TextInput` (`inputmode="numeric"`), persisting the parsed integer (applying the declared `min` floor) and ignoring non-numeric input. A wide control (the `Select` dropdown or any text/number field) SHALL stack beneath its label, not share the row with it. Any control change SHALL call `writeSetting(key, value)` immediately, with no save button. The page SHALL render a branded header (version from `chrome.runtime.getManifest().version`) and a dark substrate.

#### Scenario: Current value pre-selected on load

- **WHEN** the options page opens and the saved density is `compact`
- **THEN** the `Compact` option in the rendered control is selected

#### Scenario: Enum selection persists immediately

- **WHEN** the user selects `Comfort`
- **THEN** `writeSetting('density', 'comfort')` is called with no intervening save action

#### Scenario: A many-option enum renders a dropdown

- **WHEN** the `defaultSearchEngine` setting (built-in engine ids + `custom`, more than 4 options) is rendered
- **THEN** it appears as a `Select` dropdown (not a `SegmentedControl`), stacked beneath its label, with the current value selected

#### Scenario: Text edit persists immediately

- **WHEN** the user edits the custom search URL field to `https://kagi.com/search?q=%s`
- **THEN** `writeSetting('customSearchUrl', 'https://kagi.com/search?q=%s')` is called with no intervening save action

#### Scenario: A toggle setting renders Off/On and persists a boolean

- **WHEN** the `autoArchiveEnabled` toggle is rendered with the stored value `true` and the user selects `Off`
- **THEN** the control SHALL show `On` selected before the change and `Off` after
- **AND** `writeSetting('autoArchiveEnabled', false)` SHALL be called with the boolean `false`

#### Scenario: A number setting renders a numeric field and persists an integer

- **WHEN** the user edits the `autoArchiveIdleMinutes` field to `30`
- **THEN** `writeSetting('autoArchiveIdleMinutes', 30)` SHALL be called with the number `30`
- **AND** a non-numeric edit SHALL NOT persist a non-number value

#### Scenario: Only declared renderers appear

- **WHEN** a declaration has a `type` for which no renderer exists yet
- **THEN** the options page does not crash; it renders nothing for that declaration (renderers exist for `enum` — `SegmentedControl` or `Select` —, `text` — `TextInput` —, `toggle` — `SegmentedControl` —, and `number` — numeric `TextInput`)

### Requirement: SegmentedControl is a reusable token-only primitive

`SegmentedControl.svelte` SHALL live in `src/ui/`, be exported from `src/ui/index.ts`, accept a typed `options` array plus the current `value` and an `onchange` callback, and use only design tokens from `tokens.css` (no hard-coded colours or pixel design values). It SHALL be implemented with `<input type="radio">` elements for native keyboard and accessibility semantics.

#### Scenario: Native radio keyboard navigation

- **WHEN** the control is focused and the user presses arrow keys
- **THEN** the selection moves between options via native radio-group behaviour and fires `onchange` with the newly selected value

#### Scenario: Selection indicator animates between options

- **WHEN** the user selects a different option
- **THEN** the selection pill slides to the newly active option over `200ms var(--ease-emphasised)` rather than snapping

### Requirement: Colour intensity (tint) setting

The settings engine SHALL declare a `tint` setting that controls the workspace
colour intensity, proving the declarative engine renders more than one setting.
The declaration SHALL be `{ key: 'tint', type: 'enum', group: 'Appearance',
label: 'Colour intensity', options: subtle | standard | vivid, default: 'vivid' }`,
and `Settings` SHALL gain a `tint: Tint` field derived from it exactly as
`density` is. The stored value SHALL live in the existing `chrome.storage.sync`
settings object and SHALL fall back to the declared default when absent or
out of range (the engine's `z.enum(...).catch(default)` behaviour).

A surface root that consumes the tint SHALL reflect it onto a `data-tint`
attribute (the same mechanism `density` uses for `data-density`), so the
`[data-tint='…']` token rules apply live, and SHALL update when the setting
changes via `watchSettings`.

#### Scenario: Tint defaults to vivid

- **WHEN** the settings are read and no `tint` value has been stored
- **THEN** `tint` SHALL be `vivid`

#### Scenario: Tint renders as a second Appearance control

- **WHEN** the options page renders
- **THEN** the Appearance group SHALL show both Density and Colour intensity controls
- **AND** each SHALL be a segmented control reflecting the stored value

#### Scenario: Changing tint updates the surface live

- **WHEN** the user changes the Colour intensity setting
- **THEN** the new value SHALL persist to `chrome.storage.sync`
- **AND** a consuming surface SHALL update its `data-tint` attribute via `watchSettings` without reload

#### Scenario: Out-of-range stored tint falls back to default

- **WHEN** the stored settings contain a `tint` value outside `subtle | standard | vivid`
- **THEN** the read SHALL fall back to `vivid` rather than failing the whole settings read

### Requirement: Global default for keeping pinned tabs on their site

Settings SHALL declare `pinnedTabBoundaryDefault: 'off' | 'domain'` (default
`'off'`) as an enum setting in a `Pinned tabs` group, rendered by the existing
declarative settings engine and persisted to `chrome.storage.sync`. The setting
SHALL be the **baseline** that an individual pinned tab's `boundary` overrides:

- `'off'` (default) — a pinned tab with no explicit `boundary` is **not** confined
  (today's free-drift behaviour).
- `'domain'` — a pinned tab with no explicit `boundary` is confined to the
  registrable domain of its `originalURL`.

A per-tab `boundary` of `{ mode: 'off' }` or `{ mode: 'locked' }` SHALL override the
global default for that tab. Changing the setting SHALL re-resolve the effective
allow-set for every currently bound, **inheriting** tab (via the SW's settings
watcher) without requiring a re-pin. The setting SHALL NOT alter tabs whose
`boundary` is explicitly set.

#### Scenario: Default keeps current behaviour

- **WHEN** `pinnedTabBoundaryDefault` is `'off'` (the default) and a pinned tab has no explicit boundary
- **THEN** the tab SHALL navigate freely (no enforcement), exactly as before this change

#### Scenario: Flipping the default locks inheriting pins live

- **WHEN** the user changes `pinnedTabBoundaryDefault` to `'domain'`
- **THEN** every bound pinned tab with no explicit boundary SHALL become confined to its registrable domain without re-pinning
- **AND** a pinned tab whose boundary is explicitly `{ mode: 'off' }` SHALL remain free

#### Scenario: An unknown stored value falls back to the default

- **WHEN** the stored `pinnedTabBoundaryDefault` is not a declared option
- **THEN** the settings read SHALL fall back to `'off'` (the declared default)

### Requirement: Default search engine and custom template settings

The settings registry SHALL own the launcher's web-search engine configuration:

- `defaultSearchEngine` (`type: 'enum'`, `group: 'Search'`, default `google`) whose
  options are the built-in engine ids (`google`, `duckduckgo`, `bing`, `brave`,
  `perplexity`, `youtube`, `wikipedia`) plus `custom`;
- `customSearchUrl` (`type: 'text'`, `group: 'Search'`, default `''`) — a URL
  template containing `%s` where the query is substituted, used only when
  `defaultSearchEngine === 'custom'`.

The built-in engines SHALL be defined as code constants `BUILT_IN_ENGINES`
(`SearchEngine = { id, name, urlTemplate }`) in `src/shared/search-engines.ts`,
imported by both the settings registry (for the enum options) and the launcher's
`web-actions` module (for URL building), so `settings.ts` carries no launcher
dependency. `resolveDefaultEngine(settings)` SHALL return the selected built-in
engine; when `custom` is selected it SHALL return the custom engine ONLY if
`customSearchUrl` contains `%s`, otherwise it SHALL fall back to the `google`
built-in. Both keys persist in the existing `chrome.storage.sync` settings object
and fall back to their declared defaults when absent or invalid (the engine's
`.catch(default)` behaviour).

#### Scenario: Default engine defaults to Google

- **WHEN** settings are read with no stored value
- **THEN** `defaultSearchEngine` SHALL be `google` and `customSearchUrl` SHALL be `''`

#### Scenario: A built-in selection resolves to that engine

- **GIVEN** `defaultSearchEngine` is `duckduckgo`
- **WHEN** `resolveDefaultEngine(settings)` runs
- **THEN** it SHALL return the DuckDuckGo built-in engine

#### Scenario: A valid custom template resolves to the custom engine

- **GIVEN** `defaultSearchEngine` is `custom` and `customSearchUrl` is
  `https://kagi.com/search?q=%s`
- **WHEN** `resolveDefaultEngine(settings)` runs
- **THEN** it SHALL return a custom engine whose `urlTemplate` is that string

#### Scenario: A custom template missing %s falls back to Google

- **GIVEN** `defaultSearchEngine` is `custom` and `customSearchUrl` is
  `https://kagi.com` (no `%s`)
- **WHEN** `resolveDefaultEngine(settings)` runs
- **THEN** it SHALL return the `google` built-in engine

### Requirement: Per-engine keyword and the assembled engine registry

`SearchEngine` (`src/shared/search-engines.ts`) SHALL gain a `keyword: string`;
each entry in `BUILT_IN_ENGINES` SHALL carry a fixed keyword (`google → g`,
`duckduckgo → ddg`, `bing → bing`, `brave → brave`, `perplexity → p`,
`youtube → yt`, `wikipedia → w`). The settings registry SHALL own a
`customSearchKeyword` (`type: 'text'`, `group: 'Search'`, default `''`) naming
the custom engine's keyword.

`buildEngineRegistry(settings)` SHALL return the active engine registry: the
built-ins, plus the custom engine ONLY when it is valid — `customSearchUrl`
contains `%s`, `customSearchKeyword` is non-empty, and that keyword does not
collide with a built-in keyword. On collision the built-in SHALL win and the custom
keyword SHALL be dropped from the registry (the custom engine remains usable as the
default per `launcher-web-search`); the options page SHALL surface an inline warning
for the colliding keyword. `customSearchKeyword` persists in the existing
`chrome.storage.sync` settings object and falls back to its default when absent or
invalid.

#### Scenario: Built-ins carry fixed keywords

- **WHEN** `buildEngineRegistry(settings)` runs with no custom engine configured
- **THEN** it SHALL return the built-ins, each with its fixed keyword (e.g.
  `youtube` with keyword `yt`)

#### Scenario: A valid custom engine joins the registry with its keyword

- **GIVEN** `defaultSearchEngine` is `custom`, `customSearchUrl` is
  `https://kagi.com/search?q=%s`, and `customSearchKeyword` is `k`
- **WHEN** `buildEngineRegistry(settings)` runs
- **THEN** the returned registry SHALL include the custom engine with keyword `k`

#### Scenario: A colliding custom keyword is dropped, built-in wins

- **GIVEN** a valid custom engine whose `customSearchKeyword` is `g` (a built-in
  keyword)
- **WHEN** `buildEngineRegistry(settings)` runs
- **THEN** the keyword `g` SHALL resolve to the built-in Google engine
- **AND** the custom engine SHALL NOT contribute the keyword `g`

#### Scenario: customSearchKeyword defaults and falls back safely

- **WHEN** settings are read with no stored `customSearchKeyword`
- **THEN** it SHALL be `''`
- **AND** an out-of-type stored value SHALL fall back to `''` without failing the read

