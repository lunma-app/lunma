## ADDED Requirements

### Requirement: The trackTabProvenance setting declares intent, not state

`Settings` SHALL gain `trackTabProvenance: boolean`, declared in the `SETTINGS`
array in `apps/extension/src/shared/settings.ts` as a `toggle` in the `Tabs`
group, defaulting to `false`. `DEFAULTS` and `SettingsSchema` derive from the
declaration as they do for every other setting; the options page renders it
through the existing `SegmentedControl` + `TOGGLE_SEGMENTS` path with no new
rendering branch.

This is the first setting whose stored value does not describe effective state.
It persists to `chrome.storage.sync`, while the `webNavigation` permission it
gates is per-device and never syncs. Consumers SHALL therefore treat the stored
value as intent and compute effective state as
`trackTabProvenance && hasApiPermission('webNavigation')`. No consumer SHALL read
the setting alone to decide whether provenance is active.

#### Scenario: The toggle adds no new settings rendering branch

- **WHEN** the options page renders the `Tabs` group
- **THEN** `trackTabProvenance` SHALL render through the existing `toggle`
  declaration path
- **AND** no new group SHALL be added to `src/options/labels.ts`

#### Scenario: A stored true does not by itself enable collection

- **WHEN** `trackTabProvenance` reads back `true` from `chrome.storage.sync`
- **AND** `hasApiPermission('webNavigation')` is `false`
- **THEN** provenance SHALL NOT be collected
- **AND** the setting SHALL NOT be silently rewritten to `false`, because the
  user's intent on their other devices is unchanged

### Requirement: Enabling the toggle requests the permission on the user gesture

Flipping `trackTabProvenance` on SHALL call `requestApiPermission('webNavigation')`
within the user gesture that produced the change. If the grant is declined, the
setting SHALL be written back to `false` and the toggle SHALL render off.

Flipping it off SHALL release the `webNavigation` permission and clear
`provenanceByTabId`.

#### Scenario: A declined grant does not leave a stuck-on toggle

- **WHEN** a user flips `trackTabProvenance` on and declines the Chrome prompt
- **THEN** the stored value SHALL be `false`
- **AND** the toggle SHALL render off with no error banner

#### Scenario: Disabling releases the permission

- **WHEN** a user flips `trackTabProvenance` off
- **THEN** the `webNavigation` permission SHALL be released
- **AND** `provenanceByTabId` SHALL be cleared
