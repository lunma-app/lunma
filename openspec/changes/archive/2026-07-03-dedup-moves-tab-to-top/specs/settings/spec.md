## ADDED Requirements

### Requirement: Move-switched-to-tab-to-top setting

The settings registry SHALL declare a `dedupMovesTabToTop` boolean toggle
(`type: 'toggle'`, `default: true`, group `'Tabs'`) on the `Settings`
interface. It governs the promotion behaviour in the `tab-dedup` capability:
when `true`, any of the three dedup focus paths (`openUrl`, onCreated-time
direct-URL dedup, navigation dedup) that focuses an already-open **temp**
tab instead of creating a duplicate ALSO moves that tab to the top of its
(window, Space) instance's Temporary list; when `false`, the tab is focused
but its position is left unchanged. It has no effect when the deduped tab
is a bound/pinned tab (no `tempTabIds` position to move).

As an ordinary toggle declaration, its default, the derived Zod
(`z.boolean().catch(true)`), persistence, change notification, and
options-page rendering SHALL follow from the single declaration with no
additional read/write/render code. The options page SHALL render it as the
standard `SegmentedControl` (Off | On) under a "Tabs" group, with label
"Move switched-to tabs to the top" and a description explaining the
behaviour.

#### Scenario: The toggle defaults to On

- **WHEN** settings are read with no stored value for `dedupMovesTabToTop`
- **THEN** it SHALL resolve to `true`

#### Scenario: A malformed stored value degrades to the default

- **WHEN** the stored `dedupMovesTabToTop` value is not a boolean
- **THEN** the field-level Zod fallback SHALL resolve it to `true` (the declared default), without failing the whole settings read

#### Scenario: The toggle renders on the options page

- **WHEN** the options page is rendered from the settings declarations
- **THEN** a two-segment Off | On `SegmentedControl` for "Move switched-to tabs to the top" SHALL appear under the "Tabs" group
