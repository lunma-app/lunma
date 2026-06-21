## ADDED Requirements

### Requirement: requestStateSnapshot validates its response payload

The `requestStateSnapshot()` function exported from `apps/extension/src/shared/messages.ts` SHALL validate the `state` field of the SW's response against `AppStateV7Schema` before returning. If validation fails, it SHALL throw a descriptive `Error` whose message begins with `'requestStateSnapshot: invalid state payload'` and includes a summary of the first Zod issue. It SHALL NOT return an unvalidated `msg.state` directly.

The function SHALL NOT return `msg.state` by casting (`msg.state as AppState`). After the schema fix in the `storage-and-migrations` capability (`liveTabsById` / `smartFolders` gaining `.default({})`), the parse result SHALL be directly assignable to `AppState` without any cast.

#### Scenario: A valid state snapshot parses and is returned without a cast

- **WHEN** the SW responds with a valid `lunma/state-snapshot` message whose `state` passes `AppStateV7Schema.safeParse`
- **THEN** `requestStateSnapshot` SHALL return `stateResult.data` directly, typed as `AppState`, with no `as AppState` or `as unknown as AppState` cast required

#### Scenario: A malformed state snapshot throws a descriptive error

- **WHEN** the SW responds with a `lunma/state-snapshot` message whose `state` fails `AppStateV7Schema.safeParse` (e.g. a field has the wrong type)
- **THEN** `requestStateSnapshot` SHALL throw an `Error` whose `message` starts with `'requestStateSnapshot: invalid state payload'`
- **AND** the caller's `await requestStateSnapshot()` promise SHALL reject with that error
