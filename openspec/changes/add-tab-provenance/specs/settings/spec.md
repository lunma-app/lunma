## MODIFIED Requirements

### Requirement: Options page is rendered from the settings declarations

`apps/extension/src/options/Options.svelte` SHALL render its controls by iterating `SETTINGS`, grouping by `group`, and dispatching on `type`. For `type: 'enum'` it SHALL render a `SegmentedControl` when the option set is small (≤ 4 options) and a `Select` dropdown otherwise (so a many-option enum such as the search-engine picker stays usable rather than overflowing a single row); either reflects the current saved value. For `type: 'text'` it SHALL render the `TextInput` primitive bound to the current saved value, persisting via `writeSetting(key, value)` as the user edits. For `type: 'toggle'` it SHALL render a two-option `SegmentedControl` (`Off` | `On`) mapping to the boolean value. For `type: 'number'` it SHALL render a numeric `TextInput` (`inputmode="numeric"`), persisting the parsed integer (applying the declared `min` floor) and ignoring non-numeric input. A wide control (the `Select` dropdown or any text/number field) SHALL stack beneath its label, not share the row with it. Any control change SHALL call `writeSetting(key, value)` immediately, with no save button. The page SHALL render a branded header (version from `chrome.runtime.getManifest().version`) and a dark substrate.

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

**Provenance addition.** `trackTabProvenance` is the one declared toggle whose
rendered value is NOT its stored value. It SHALL render from
`effectiveProvenanceState()`, and its change handler SHALL NOT call `writeSetting`
directly: enabling SHALL first request `webNavigation` inside the user gesture and
write `true` only on a granted result, writing `false` back on a declined one. This
is a declared exception to the generic "any control change calls
`writeSetting(key, value)` immediately" rule, and applies to this key alone.

Both a setting description and a group intro are single lines
(`Record<keyof Settings, MessageThunk>` in `src/options/labels.ts`; the one-line
section description in this capability). The disclosure therefore SHALL be carried
by an **inline note rendered beneath this toggle**, not by widening either type and
not by overloading `options_tabsGroupIntro`, which describes the whole group. The
one-line description SHALL name the browsing-history prompt and the page-readable
marker; the note SHALL carry the uninstall limit and the browsing-session bound.

#### Scenario: The provenance toggle renders from effective state

- **GIVEN** synced settings carry `trackTabProvenance: true` and this device has no `webNavigation` grant
- **WHEN** the options page renders
- **THEN** the toggle SHALL render off

#### Scenario: A declined grant does not leave the toggle on

- **WHEN** the user enables the toggle and declines the Chrome prompt
- **THEN** `trackTabProvenance` SHALL be written back to `false` and the toggle SHALL render off

## ADDED Requirements

### Requirement: Track tab provenance setting

`SETTINGS` SHALL declare a `trackTabProvenance` toggle in the `Tabs` group,
defaulting to `false`, typed as `Settings.trackTabProvenance: boolean` and covered
by the existing schema-to-type guard.

It is the first setting whose stored value is **intent, not state**: it lives in
`chrome.storage.sync` while the `webNavigation` permission it gates is per-device
and never syncs, so a synced `true` can land on a device with no grant. On such a
device the effective state SHALL be off and Lunma SHALL NOT re-prompt on boot — a
permission request requires a user gesture.

Turning the setting off SHALL trigger the provenance teardown described in
`tab-provenance`. It SHALL NOT revoke the `webNavigation` grant, and it SHALL NOT
display a confirmation claiming markers were cleared — tabs that are not loaded are
unreachable at that moment, so the claim would be false for exactly those tabs.

**Disclosure.** Between the one-line description and the inline note beneath the
toggle, the options page SHALL state, before the permission prompt can be raised: that Chrome
will ask to read browsing history; that while the setting is on Lunma stores a
random marker in the pages visited, which those pages can read; that turning it off
clears the markers Lunma can still reach; that uninstalling Lunma cannot clear
markers already written; and that a marker cannot outlive the browsing session it
was written in.

#### Scenario: The setting is declared with an off default

- **WHEN** `SETTINGS` is read
- **THEN** it SHALL contain a `trackTabProvenance` toggle in the `Tabs` group whose default is `false`

#### Scenario: The disclosure names the marker and both limits

- **GIVEN** the options page is open at the `Tabs` group
- **WHEN** the toggle's description and the note beneath it are read together
- **THEN** they SHALL name the browsing-history prompt, the page-readable marker, the uninstall limit, and the browsing-session bound

#### Scenario: Turning it off shows no cleared-confirmation

- **WHEN** the user turns the toggle off
- **THEN** no confirmation asserting that markers were cleared SHALL be shown
