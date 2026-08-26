## ADDED Requirements

### Requirement: Close child tabs with parent setting

Settings SHALL declare a `closeChildTabsWithParent` toggle, defaulting to `false`,
in the **Tabs** group. It governs whether closing a temporary tab also closes the
tabs opened from it (see `tab-close-cascade`).

Its description SHALL state that the tabs opened from the closed tab are closed too
and that the action can be undone, so the destructive consequence is legible before
the user turns it on rather than after.

The setting SHALL be synced like every other declared setting. It carries no
per-device component, so a `true` synced from another device SHALL take effect
directly, gated only by whether tab provenance is itself effectively on for that
device.

#### Scenario: The setting defaults to off

- **GIVEN** a profile that has never changed this setting
- **WHEN** the settings are read
- **THEN** `closeChildTabsWithParent` SHALL be `false`

#### Scenario: The toggle renders in the Tabs group

- **WHEN** the options page renders
- **THEN** a toggle for `closeChildTabsWithParent` SHALL appear in the **Tabs** group with a description naming both the consequence and that it is undoable

#### Scenario: A malformed stored value degrades to the default

- **GIVEN** a stored settings object whose `closeChildTabsWithParent` is not a boolean
- **WHEN** the settings are read
- **THEN** the value SHALL fall back to `false` and the rest of the settings SHALL still parse

### Requirement: A toggle may declare a dependency on another setting

A toggle declaration MAY name another setting it depends on. Only a boolean-valued
setting SHALL be nameable — "when the named setting is off" has no meaning for a
text or enum setting, and the declaration type SHALL refuse them rather than the
prose forbidding them.

When the named setting is off, the dependent toggle SHALL render **disabled**, and
SHALL show why it is disabled rather than silently refusing input. The reason SHALL
be shown in the row itself, naming the setting to enable first, and SHALL NOT be
hidden behind a hover-only affordance.

The dependency SHALL be evaluated against the named setting's EFFECTIVE value — the
same value that setting's own toggle renders — not its raw stored value. A setting
whose effective state combines a synced value with a per-device grant can be stored
`true` on a device where it is off; reading the stored value there would present an
interactive toggle for a permanently inert feature.

This SHALL be expressed as a field on the declaration, not as per-setting branching
in the options page: the options page already carries one hardcoded special case,
and a second would make the declaration list stop describing how the page renders.

A disabled dependent toggle SHALL NOT write its setting. Its stored value SHALL be
left untouched, so re-enabling the setting it depends on restores the user's
previous choice rather than resetting it.

Dependency SHALL affect rendering only. The behaviour a dependent setting gates is
enforced where that behaviour lives, so a stored `true` under a disabled dependency
SHALL still be inert at the point of use.

#### Scenario: A dependent toggle disables when its dependency is off

- **GIVEN** `closeChildTabsWithParent` declares a dependency on `trackTabProvenance`, which is off
- **WHEN** the options page renders
- **THEN** the `closeChildTabsWithParent` toggle SHALL be disabled and SHALL show why

#### Scenario: A dependent toggle enables when its dependency is on

- **GIVEN** `trackTabProvenance` is effectively on
- **WHEN** the options page renders
- **THEN** the `closeChildTabsWithParent` toggle SHALL be interactive

#### Scenario: Disabling the dependency preserves the stored choice

- **GIVEN** `closeChildTabsWithParent` is `true`
- **WHEN** `trackTabProvenance` is turned off
- **THEN** `closeChildTabsWithParent` SHALL remain `true` in storage, and SHALL take effect again when `trackTabProvenance` is turned back on

#### Scenario: A dependency stored true but ineffective still disables

- **GIVEN** `trackTabProvenance` is stored `true` but is not effectively on for this device
- **WHEN** the options page renders
- **THEN** the `closeChildTabsWithParent` toggle SHALL be disabled

#### Scenario: A toggle with no declared dependency is unaffected

- **GIVEN** a toggle that declares no dependency
- **WHEN** the options page renders
- **THEN** it SHALL be interactive regardless of any other setting's value
