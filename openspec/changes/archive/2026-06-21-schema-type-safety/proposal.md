## Why

Five `as unknown as AppState` casts and multiple `space.color as SpaceColor` casts survive in the codebase because `AppStateV7Schema` leaves `liveTabsById`/`smartFolders` as optional (producing `undefined` instead of `{}`) and `SpaceSchema.color` is typed as `z.string()` rather than `z.enum(SPACE_COLORS)`. The casts suppress type errors today but hide real correctness gaps: `requestStateSnapshot` returns an unvalidated `msg.state` directly, and an invalid `Space.color` slips past Zod into `colourToOklch`. Closing these holes is the smallest plumbing required by the upcoming **space-management-ui** change, which relies on the store always holding a valid, cast-free `AppState`.

## What Changes

- `AppStateV7Schema` in `schemas.ts`: add `.default({})` to the `liveTabsById` and `smartFolders` fields so parse output matches `AppState` exactly (no more `undefined` vs `{}` gap).
- Remove the 5 `as unknown as AppState` casts: `messages.ts:258`, `BackupRestore.svelte:38`, `FeedSubscriptions.svelte:40`, `FeedSubscriptions.svelte:87`, `FeedSubscriptions.svelte:114`.
- `SpaceSchema.color` in `schemas.ts`: narrow from `z.string()` to `z.enum(SPACE_COLORS)`. Export `SPACE_COLORS` as a `const` array of the `SpaceColor` union members and derive the schema from it.
- `Space.color` in `types.ts`: narrow from `string` to `SpaceColor`, removing all `space.color as SpaceColor` casts in `space-tint.ts`, `launcher-suggestions-handler.ts`, `SpaceSwitcher.svelte`, and `App.svelte`.
- `requestStateSnapshot` in `messages.ts`: add `AppStateV7Schema.safeParse(msg.state)` and throw a descriptive `Error` on parse failure, rather than returning the unvalidated payload.
- `docs/architecture.md`: no changes required (this is an implementation-layer tightening, not an architectural change).
- `docs/tech-stack.md`: no changes required.

## Capabilities

### New Capabilities

None — this change tightens existing schema and type contracts; it does not introduce new runtime capabilities.

### Modified Capabilities

- `storage-and-migrations`: `AppStateV7Schema` gains `.default({})` on `liveTabsById` and `smartFolders`; the schema's parse output now exactly matches `AppState` without casting. The on-disk persisted format is unchanged.
- `typed-message-bus`: `requestStateSnapshot` gains a parse-and-throw validation step; `onStateBroadcast` cast is removed after the schema fix.
- `spaces-and-tabs`: `SpaceSchema.color` is narrowed to `z.enum(SPACE_COLORS)`; `Space.color` on the runtime type is narrowed to `SpaceColor`.

## Impact

- **`apps/extension/src/shared/schemas.ts`**: add `SPACE_COLORS` const, change `liveTabsById`/`smartFolders` to `.default({})`, narrow `SpaceSchema.color`.
- **`apps/extension/src/shared/types.ts`**: narrow `Space.color: string` → `Space.color: SpaceColor`.
- **`apps/extension/src/shared/messages.ts`**: remove `as unknown as AppState` cast in `onStateBroadcast`; add `safeParse` + throw in `requestStateSnapshot`.
- **`apps/extension/src/options/BackupRestore.svelte`**, **`FeedSubscriptions.svelte`**: remove `as unknown as AppState` casts.
- **`apps/extension/src/background/space-tint.ts`**, **`launcher-suggestions-handler.ts`**: remove `space.color as SpaceColor` casts.
- **`apps/extension/src/sidebar/SpaceSwitcher.svelte`**, **`App.svelte`**: remove `space.color as SpaceColor` casts.
- No new dependencies. No new public types, files, or methods beyond `SPACE_COLORS` (exported const).
- No new UI surfaces or primitives — this change is type/schema only.
