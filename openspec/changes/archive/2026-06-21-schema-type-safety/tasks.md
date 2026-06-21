## 1. Schema defaults — close the optional/non-optional gap

- [x] 1.1 In `apps/extension/src/shared/schemas.ts`, change `liveTabsById` in `AppStateV7Schema` from `.optional()` to `.default({})`
- [x] 1.2 In `apps/extension/src/shared/schemas.ts`, change `smartFolders` in `AppStateV7Schema` from `.optional()` to `.default({})`
- [x] 1.3 Remove the `Persisted<T>` helper and update `_schemaMatchesAppState` to compare `z.infer<typeof AppStateV7Schema>` and `AppState` directly (without stripping fields)
- [x] 1.4 Run `pnpm --filter @lunma/extension exec tsc --noEmit` and confirm it passes

## 2. Remove `as unknown as AppState` casts

- [x] 2.1 In `apps/extension/src/shared/messages.ts`, remove the `as unknown as AppState` cast in `onStateBroadcast` (now `stateResult.data` is directly assignable)
- [x] 2.2 In `apps/extension/src/options/BackupRestore.svelte`, remove the `as unknown as AppState` cast on `stateResult.data`
- [x] 2.3 In `apps/extension/src/options/FeedSubscriptions.svelte`, remove all three `as unknown as AppState` casts (`rssNodes` assignment and the `spaces` projection)
- [x] 2.4 Run `pnpm --filter @lunma/extension exec tsc --noEmit` and confirm it passes

## 3. Narrow `Space.color` to `SpaceColor`

- [x] 3.1 In `apps/extension/src/shared/schemas.ts`, add `export const SPACE_COLORS = ['red', 'orange', 'yellow', 'green', 'cyan', 'blue', 'purple', 'pink', 'gray'] as const satisfies SpaceColor[]`
- [x] 3.2 In `apps/extension/src/shared/schemas.ts`, change `SpaceSchema.color` from `z.string()` to `z.enum(SPACE_COLORS)`
- [x] 3.3 In `apps/extension/src/shared/types.ts`, change `Space.color: string` to `Space.color: SpaceColor`
- [x] 3.4 Remove all `space.color as SpaceColor` casts in `apps/extension/src/background/space-tint.ts` and `apps/extension/src/background/launcher-suggestions-handler.ts`
- [x] 3.5 Remove all `space.color as SpaceColor` casts in `apps/extension/src/sidebar/SpaceSwitcher.svelte` and `apps/extension/src/sidebar/App.svelte`
- [x] 3.6 Run `pnpm --filter @lunma/extension exec tsc --noEmit` and confirm it passes

## 4. Validate `requestStateSnapshot` response

- [x] 4.1 In `apps/extension/src/shared/messages.ts`, replace the bare `return msg.state` in `requestStateSnapshot` with `AppStateV7Schema.safeParse(msg.state)` — throw `new Error('requestStateSnapshot: invalid state payload: ' + ...)` on parse failure, return `stateResult.data` on success
- [x] 4.2 Run `pnpm --filter @lunma/extension exec tsc --noEmit` and confirm it passes

## 5. Quality gate

- [x] 5.1 Run `pnpm verify` at the workspace root and confirm all checks pass (tsc, biome, svelte-check, stylelint, vitest)
- [x] 5.2 Confirm zero `as unknown as AppState` and zero `as SpaceColor` casts remain in `apps/extension/src/` (grep check)
