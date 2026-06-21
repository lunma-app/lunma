## MODIFIED Requirements

### Requirement: Schema-to-type coherence

`apps/extension/src/shared/schemas.ts` SHALL include a compile-time assertion that `z.infer<typeof AppStateV7Schema>` and `AppState` (from `apps/extension/src/shared/types.ts`) are structurally equivalent. A drift between the two SHALL cause `pnpm exec tsc --noEmit` to fail.

The `AppStateV7Schema` SHALL define `smartItemBindings` as:
```
z.record(z.record(z.record(z.object({ tabId: z.number(), allowGlob: z.string() }))))
  .default({})
```
replacing the v6 `z.record(z.record(z.record(z.number()))).default({})`.

The `AppStateV7Schema` SHALL define `liveTabsById` as:
```
z.record(z.coerce.number(), LiveTabSchema).default({})
```
replacing the previous `.optional()` form — so the inferred type is `Record<number, LiveTab>` (not `Record<number, LiveTab> | undefined`), matching `AppState.liveTabsById`.

The `AppStateV7Schema` SHALL define `smartFolders` as:
```
z.record(z.string(), SmartFolderRuntimeSchema).default({})
```
replacing the previous `.optional()` form — so the inferred type is `Record<string, SmartFolderRuntime>` (not `Record<string, SmartFolderRuntime> | undefined`), matching `AppState.smartFolders`.

With these changes the `Persisted<T>` helper in `schemas.ts` (which previously omitted `liveTabsById` and `smartFolders` from the structural comparison to hide the optional/non-optional gap) SHALL be removed. The compile-time assertion SHALL compare `z.infer<typeof AppStateV7Schema>` and `AppState` directly, without stripping any fields.

No `as unknown as AppState` cast SHALL remain in the codebase for values produced by `AppStateV7Schema.safeParse`.

#### Scenario: Type drift fails the build

- **WHEN** a developer changes the `smartItemBindings` slot type in `AppState` without updating `AppStateV7Schema`
- **THEN** `pnpm exec tsc --noEmit` SHALL fail with a type-equivalence error in `apps/extension/src/shared/schemas.ts`

#### Scenario: liveTabsById gap removed — parse output is directly assignable to AppState

- **WHEN** `AppStateV7Schema.safeParse(payload)` succeeds on a payload lacking a `liveTabsById` field
- **THEN** `stateResult.data.liveTabsById` SHALL equal `{}` (the `.default({})` value)
- **AND** `stateResult.data` SHALL be directly assignable to `AppState` without a cast

#### Scenario: smartFolders gap removed — parse output is directly assignable to AppState

- **WHEN** `AppStateV7Schema.safeParse(payload)` succeeds on a payload lacking a `smartFolders` field
- **THEN** `stateResult.data.smartFolders` SHALL equal `{}`
- **AND** `stateResult.data` SHALL be directly assignable to `AppState` without a cast
