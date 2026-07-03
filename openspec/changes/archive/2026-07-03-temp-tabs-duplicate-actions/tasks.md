## 1. Duplicate menu-item icon

- [x] 1.1 Add `icon: 'copy'` to the `duplicate` entry in `tabMenuItems()` (`apps/extension/src/sidebar/TempTabs.svelte`).
- [x] 1.2 Update/extend the `TempTabs.svelte` menu test(s) to assert the `duplicate` item renders the `copy` icon.
- [x] 1.3 Do NOT run `pnpm gen:icons` yet — `chevron-down` (task 4.1) is a second new icon literal this change introduces; regenerate the allowlist once in task 4.7 after both are in source.

## 2. Bus command: clearDuplicateTempTabs

- [x] 2.1 Add `clearDuplicateTempTabs` to the `SidebarCommand` union in `apps/extension/src/shared/bus.ts` with payload `{ windowId: WindowId; spaceId?: SpaceId }`, mirroring `clearTempTabs`.
- [x] 2.2 Add its Zod schema to `COMMAND_SCHEMAS`, add the kind to `SIDEBAR_COMMAND_KINDS`/the runtime guard, and register it in the schema union array — mirroring `clearTempTabs`'s entries exactly.
- [x] 2.3 Add/extend `bus.test.ts` coverage: the new kind validates, round-trips, and is exhaustively covered by the `SIDEBAR_COMMAND_KINDS` guard.

## 3. Background handler: clearDuplicateTempTabs

- [x] 3.1 In `apps/extension/src/background/handlers/temp-tabs.ts`, add a `clearDuplicateTempTabs` handler sibling to `clearTempTabs`: resolve the target Space's `tempTabIds` open in `windowId`, group by exact live-tab URL, and for each group of size > 1 keep index 0 (earliest-listed) and collect the rest into the closing batch.
- [x] 3.2 If the batch is empty, no-op (no archive call, no `chrome.tabs.remove`, no broadcast).
- [x] 3.3 Otherwise reuse `clearTempTabs`'s existing archive-then-survivor-check-then-remove sequence (`ctx.store.appendArchivedTab`, `pruneArchivedTabs`, the "would this empty the window" home-tab guard, `chrome.tabs.remove`) for the batch.
- [x] 3.4 Register the new handler in the coordinator (`apps/extension/src/background/coordinator.ts`) and in `apps/extension/src/background/handlers/context.ts`, alongside `clearTempTabs`.
- [x] 3.5 Add handler tests covering: two-way duplicate collapse, three-way duplicate collapse (keeps earliest), no-duplicates no-op, archive-before-remove ordering, and the empty-window home-tab guard — mirroring the existing `clearTempTabs` test suite's structure.

## 4. Sidebar UI: Clear-duplicates kebab menu

- [x] 4.1 In `apps/extension/src/sidebar/App.svelte`, render a `Menu` (`trigger="kebab"`, `icon="chevron-down"`, `ariaLabel={m.sidebar_clearMenuLabel({ spaceName: panel.space.name })}`) immediately after the existing "Clear" `Button` inside the `divider-action` span, with a single item labelled `m.sidebar_tempClearDuplicates()` ("Clear duplicates") — following `SectionHeader.svelte:56`'s existing per-Space `ariaLabel` precedent for a kebab trigger.
- [x] 4.2 Compute whether the panel's Space currently has any duplicate-URL temp tabs (client-side, from already-available state) and set the menu item's `disabled` accordingly.
- [x] 4.3 Wire the item's `onSelect` to dispatch `bus.send({ kind: 'clearDuplicateTempTabs', payload: { windowId, spaceId: panel.space.id } })`, following the existing `onClearTemp` pattern (`App.svelte:407-422`) for a new `onClearDuplicateTemp(spaceId)` handler.
- [x] 4.4 On success, reuse the existing `clearedToast` state/`Toast` mount, with new copy (`sidebar_clearedDuplicateTabs`) and the closed batch's `tabId`s wired to the existing Undo path (`onUndoClear`, dispatching `undoClearTempTabs`) — no new Toast/undo plumbing.
- [x] 4.5 Add/extend `App.svelte` tests: menu renders beside Clear whenever Clear renders, item disabled with no duplicates / enabled with duplicates, activating it dispatches `clearDuplicateTempTabs` with the right payload, the trigger's `ariaLabel` is Space-scoped, and the resulting Toast/Undo path matches Clear's existing test pattern.
- [x] 4.6 Add `sidebar_tempClearDuplicates` ("Clear duplicates") and `sidebar_clearMenuLabel` ("Clear options for {spaceName}") to `apps/extension/messages/en.json` (see also §5.1 for `sidebar_clearedDuplicateTabs`).
- [x] 4.7 Now that `icon: 'copy'` (task 1.1) and `icon="chevron-down"` (task 4.1) are both in source, run `pnpm gen:icons` once to add both to `apps/extension/src/ui/icon-loaders.generated.ts`; commit the regenerated file.

## 5. i18n

- [x] 5.1 Add `sidebar_clearedDuplicateTabs` ("Cleared N duplicate tabs — Undo", pluralized like the existing `sidebar_clearedTabs`) to `apps/extension/messages/en.json`. (`sidebar_tempClearDuplicates` and `sidebar_clearMenuLabel` are added in task 4.6, alongside the UI that consumes them.)
- [x] 5.2 Run the project's i18n pipeline for the other locale catalogs per the `i18n` capability's process (so the key-completeness parity test stays green), rather than hand-editing every locale file.

## 6. Verification

- [x] 6.1 Run `pnpm verify` at the workspace root; fix any `tsc`/Biome/svelte-check/stylelint/vitest failures.
- [x] 6.2 Manually exercise both features in the built extension: confirm the Duplicate menu item shows the `copy` icon, and confirm Clear duplicates collapses a manually-created duplicate-URL group correctly (keeping the earliest tab), including Undo.
- [x] 6.3 Confirm no regression to the existing single-click "Clear" (clear-all) behavior.
