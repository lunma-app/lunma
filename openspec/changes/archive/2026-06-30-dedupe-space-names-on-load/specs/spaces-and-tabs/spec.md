## MODIFIED Requirements

### Requirement: Space names are unique

No two Spaces in `state.spaces` SHALL share a name under the normalized comparison
`normalizeSpaceName(name) = name.trim().toLocaleLowerCase()`, exported from
`apps/extension/src/shared/space-names.ts`. The Space record SHALL store the user's chosen casing
and surrounding form unchanged — only the *comparison* is normalized. Uniqueness is
**global** across all Spaces (not per-window and not scoped by colour), because a
single Space record may be instantiated in multiple windows and its name is the only
restart-durable key the boot adoption fallback (`group.title === space.name`) has.

Enforcement SHALL split by origin:

**1. Interactive create / rename SHALL be rejected.** `store.createSpace` SHALL throw
when the normalized name equals that of any existing Space. `store.renameSpace` SHALL
throw when the normalized new name equals that of any **other** Space (the Space being
renamed is excluded, so re-applying its own name or only changing its casing is
allowed). The coordinator's `createSpace` / `renameSpace` handlers SHALL let the throw
propagate to the `'lunma/command-ack'`, which the dispatcher's `bus.send` rejects with.

**2. Non-interactive mints SHALL auto-disambiguate.** Where Lunma mints or restores a
Space without a user-typed name — fresh-install group→Space conversion, restore from
trash, and the boot data migration — it SHALL pass the desired name through
`disambiguateSpaceName(desired, takenNormalized): string`, a pure function that returns
`desired` when its normalized form is absent from `takenNormalized`, else the first of
`"{desired} 2"`, `"{desired} 3"`, … whose normalized form is absent. These paths SHALL
NOT throw on collision.

**3. The Chrome-side rename mirror SHALL NOT throw.** When `tabGroups.onUpdated`
mirrors a user's Chrome-group title change back onto the Space, a title colliding with
another Space's name SHALL be resolved through `disambiguateSpaceName` (and the Chrome
group re-titled to the disambiguated name so group and record stay in lockstep), never
left to throw inside the drain.

**4. The load-path self-heal SHALL reassert uniqueness.** When persisted state is read,
`dedupePersistedState` (`apps/extension/src/shared/chrome/storage.ts`) SHALL enforce
normalized-name uniqueness over `state.spaces` alongside its existing id-dedup, so a
state that already holds two same-normalized-name Spaces on disk cannot survive the load
unchanged. The pass SHALL iterate `state.spaces` in order, keep the FIRST occurrence of
each normalized name unchanged, and for each later Space whose `normalizeSpaceName`
collides with one already kept, re-derive its display name via
`disambiguateSpaceName(space.name, takenNormalized)` against the names already kept this
pass. No Space SHALL be dropped and no `pinnedBySpace` / `spaceInstancesByWindow` entry
SHALL be rewritten — only the colliding record's `name` changes. Any rename SHALL mark
the result `changed`, so the existing read-path write-back persists the healed envelope
on first load. The pass SHALL be idempotent (a second load of the healed state renames
nothing).

#### Scenario: Creating a Space with an in-use name is rejected

- **GIVEN** `state.spaces` already contains a Space named "Work"
- **WHEN** the `createSpace` handler runs with payload name "work" (any casing/whitespace normalizing to "work")
- **THEN** `store.createSpace` SHALL throw
- **AND** the coordinator SHALL emit a `'lunma/command-ack'` carrying `{ error }`, which `bus.send` rejects with
- **AND** no second "Work" Space SHALL be added to `state.spaces`

#### Scenario: Renaming a Space to another Space's name is rejected

- **GIVEN** Spaces "Work" and "Personal" exist
- **WHEN** the user renames "Personal" to "Work"
- **THEN** `store.renameSpace` SHALL throw and the record's name SHALL remain "Personal"

#### Scenario: A Space may keep its own name (case-only edit allowed)

- **GIVEN** a Space named "Work"
- **WHEN** the user renames it to "work" (same Space, casing-only change)
- **THEN** `store.renameSpace` SHALL NOT throw and the record's name SHALL become "work"

#### Scenario: Restoring a trashed Space disambiguates a now-taken name

- **GIVEN** Space "Work" was trashed, then a new Space "Work" was created
- **WHEN** the user undoes the deletion to restore the trashed Space
- **THEN** the restored Space's name SHALL be disambiguated to "Work 2"
- **AND** both Spaces SHALL coexist with distinct names

#### Scenario: A Chrome-side group rename to an in-use name does not crash the drain

- **GIVEN** Spaces "Work" and "Side" exist, and "Side"'s live Chrome group is renamed by the user to "Work"
- **WHEN** `tabGroups.onUpdated` mirrors the title change
- **THEN** "Side" SHALL be renamed to a disambiguated "Work 2" (its Chrome group re-titled to match), NOT to a duplicate "Work"
- **AND** the drain SHALL complete without throwing

#### Scenario: Loading a state with duplicate-named Spaces disambiguates on read

- **GIVEN** persisted `state.spaces` holds two distinct-id Spaces both named "Default" (followed by a third named "Default 2")
- **WHEN** `readPersistedState` runs `dedupePersistedState` on the loaded state
- **THEN** the first "Default" SHALL keep its name, the second SHALL be renamed to "Default 3" (the first free normalized form, skipping the already-present "Default 2"), and the third SHALL remain "Default 2"
- **AND** all three Spaces and their `pinnedBySpace` entries SHALL be preserved
- **AND** the result SHALL be marked `changed` so the healed envelope is written back
- **AND** loading the healed state again SHALL rename nothing
