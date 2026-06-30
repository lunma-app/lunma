## MODIFIED Requirements

### Requirement: Fresh-install conversion of Chrome groups into Spaces

On a **fresh install** — when no Spaces were loaded from a clean storage read at boot — the boot tab-group pass (`reconcileTabGroupsOnBoot(store, freshInstall)`, before adoption/materialization) SHALL convert each existing Chrome tab group into a Space so the user's existing groups appear as Spaces instead of collapsing into the single auto-created Default. `freshInstall` SHALL be determined as "`state.spaces` was empty after load, before `ensureAtLeastOneSpace`, AND the boot read `outcome` returned by `loadState()` was `'clean'`" — i.e. a genuine first install (a clean read of an absent/empty `lunma.state`). A `'recovered'` (corruption-quarantine fallback), `'salvaged'` (partial-corruption recovery), or `'unavailable'` (transient read failure) outcome is NOT a fresh install: each can leave `state.spaces` empty, but re-deriving Spaces from the user's live Chrome tab groups there would fabricate duplicate `'Default'`/`'Group N'` Spaces over real (quarantined) data on every such boot. None of those outcomes SHALL trigger conversion. Outside a fresh install the pass SHALL NOT convert any group into a Space.

For each existing group the conversion SHALL mint a Space whose colour is `fromGroupColor(group.color)` (the inverse of `toGroupColor`: Chrome `grey` → Lunma `gray`, other Chrome colours pass through, unknown → `gray`), MOVE that group's member tabs out of the Default into the new Space's `(window, Space)` instance (`store.assignSpaceTabs`, which removes them from any other instance in the same window), and re-bind the live group id (`store.recordSpaceGroup`). Bound (saved) tabs SHALL NOT be moved.

A group's Space name and fold behaviour depend on whether the group is titled. A **titled** group's Space name is its trimmed title; titled groups whose names are equal under `normalizeSpaceName` SHALL fold into ONE Space (instantiated once per window where a folded group lives), and that Space SHALL take the **first** folded group's colour — so two same-name groups of different colours produce a single Space rather than two same-named Spaces. An **untitled** group (empty/whitespace title) SHALL NOT fold with any other group — each untitled group SHALL become its own distinct Space named `'Group N'`, numbered sequentially (`'Group 1'`, `'Group 2'`, …) in iteration order.

A **titled** group whose trimmed title normalizes (`normalizeSpaceName`) to the name of a Space that already existed **before** this conversion pass — on a fresh install, the auto-created Default — SHALL fold into that pre-existing Space (assigning its member tabs and recording its live group id on it) rather than minting a new Space. This prevents a group literally titled `'Default'` from producing a duplicate `'Default 2'` Space alongside the auto-created Default. Every **minted** name — a titled group matching no this-pass and no pre-existing Space, or an untitled `'Group N'` — SHALL be passed through `disambiguateSpaceName` against the names already present in `state.spaces` so the uniqueness invariant (see Requirement: Space names are unique) holds. An untitled group's synthetic `'Group N'` name SHALL NOT fold into a same-named pre-existing Space (it is a Lunma-synthesized label, not a shared identity) and SHALL disambiguate as before.

Each window SHALL activate the Space whose group holds the window's active tab; a window whose active tab is ungrouped SHALL keep the Default active. After conversion the pass SHALL discard (`store.removeEmptySpace`) any pre-existing Space left with no temp tabs in any window and no pinned tabs — clearing the Default when every tab was grouped, keeping it when ungrouped tabs remain. `removeEmptySpace` SHALL hard-remove (NOT route through trash) and SHALL refuse to remove the last remaining Space. Conversion SHALL write state only (no `chrome.tabGroups` mutation).

#### Scenario: First install mints one Space per existing group

- **GIVEN** Lunma is installed with no persisted Spaces, and window 100 has two Chrome groups — `77` ("Work", blue, tabs 17+22) and `88` ("Side", red, tabs 30+31), with tab 17 active
- **WHEN** the boot pass runs with `freshInstall = true`
- **THEN** two Spaces "Work" (blue) and "Side" (red) SHALL exist, the auto-created Default SHALL be discarded
- **AND** "Work"'s window-100 instance SHALL hold tabs 17+22 bound to group `77`, "Side"'s SHALL hold 30+31 bound to group `88`
- **AND** window 100's active Space SHALL be "Work" (its group held the active tab)

#### Scenario: The Default is kept for ungrouped tabs

- **GIVEN** a fresh install where window 100 has group `77` ("Work", tabs 17+22) and an ungrouped, active tab 99
- **WHEN** the boot pass converts
- **THEN** a "Work" Space SHALL hold 17+22 and the Default SHALL be retained holding tab 99
- **AND** the Default SHALL remain active (the active tab is ungrouped) and its group SHALL be materialized

#### Scenario: Untitled groups stay separate and are numbered

- **GIVEN** a fresh install where window 100 has two untitled Chrome groups (`77` with tabs 17+22, `88` with tabs 30+31), both the same colour
- **WHEN** the boot pass converts
- **THEN** two distinct Spaces "Group 1" and "Group 2" SHALL exist (they SHALL NOT fold despite the shared colour)
- **AND** "Group 1" SHALL be bound to `77` and "Group 2" to `88`

#### Scenario: Same-identity groups across windows fold into one Space

- **GIVEN** a fresh install where windows 100 and 200 each have a "Work"/blue group (`77`, `78`)
- **WHEN** the boot pass converts
- **THEN** exactly ONE "Work" Space SHALL exist, with a window-100 instance bound to `77` and a window-200 instance bound to `78`

#### Scenario: Same-name groups of different colours fold into one Space

- **GIVEN** a fresh install where window 100 has groups `77` ("Work", blue) and `88` ("Work", red)
- **WHEN** the boot pass converts
- **THEN** exactly ONE "Work" Space SHALL exist (taking the first folded group's colour, blue)
- **AND** both `77` and `88`'s member tabs SHALL belong to that single "Work" instance

#### Scenario: Conversion does not run outside a fresh install

- **GIVEN** Lunma boots with at least one persisted Space (`freshInstall = false`)
- **WHEN** the boot pass runs and the window contains a Chrome group matching no Space
- **THEN** no Space SHALL be created from that group (it is handled only by adoption / left untracked)

#### Scenario: Conversion does not run after a corruption recovery

- **GIVEN** the boot read `outcome` is `'recovered'` (a corrupt payload was quarantined and the layer fell back to `createInitialState()`), or `'salvaged'` with no Spaces recovered, so `state.spaces` is empty after load
- **WHEN** the boot tab-group pass runs
- **THEN** `freshInstall` SHALL be `false`
- **AND** no Space SHALL be created from any existing Chrome group
- **AND** the boot SHALL mint only the single Default (per Requirement: At-least-one-Space invariant), never one Space per tab group

#### Scenario: Conversion does not run after an unavailable read

- **GIVEN** the boot read `outcome` is `'unavailable'` (a transient `chrome.storage.local.get` failure), so `state.spaces` is empty after load
- **WHEN** the boot tab-group pass runs
- **THEN** `freshInstall` SHALL be `false`
- **AND** no Space SHALL be created from any existing Chrome group
- **AND** the on-disk `lunma.state` SHALL be left intact (no Default minted, no persist)
