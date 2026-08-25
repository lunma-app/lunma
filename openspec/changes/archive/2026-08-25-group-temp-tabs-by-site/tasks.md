## 1. The clustering rule (RED first)

- [x] 1.1 Add `apps/extension/src/shared/cluster-by-host.test.ts`: clusters become contiguous, cluster order follows first appearance, relative order inside a cluster is preserved, hostless URLs cluster under `''` at their first-appearance position, the result is idempotent, and an already-clustered input returns an equal array
- [x] 1.2 Add `apps/extension/src/shared/cluster-by-host.ts` exporting `clusterIdsByHost(orderedIds, urlOf)`, keying via `hostOf` from `shared/label-for.ts`
- [x] 1.3 Confirm `biome check` accepts the new module's layer position (`shared/` imports nothing else in `src/`)

## 2. Bus command (RED first)

- [x] 2.1 Add the failing `bus.test.ts` cases: `groupTempTabsBySite` accepts `{ windowId, spaceId }` and `{ windowId }`, and rejects an unknown key / wrong types
- [x] 2.2 Add the `SidebarCommand` union member, the `SIDEBAR_COMMAND_KINDS` entry, the sidebar-origin allowlist entry, and `COMMAND_SCHEMAS.groupTempTabsBySite` in `shared/bus.ts`

## 3. Store mutation (RED first)

- [x] 3.1 Add the failing `store.svelte.test.ts` cases: reorders a Space instance's `tempTabIds` by cluster and returns `true`; leaves ids that are not live temp tabs of the window in their current slot; returns `false` without mutating when already clustered; returns `false` without throwing when the (window, Space) has no instance
- [x] 3.2 Add `groupTempTabsBySite(windowId, spaceId): boolean` to `shared/store.svelte.ts`, delegating the ordering to `clusterIdsByHost`

## 4. Coordinator handler (RED first)

- [x] 4.1 Add the failing `coordinator.tab-groups.test.ts` cases mirroring the `clearDuplicateTempTabs` suite: clusters the targeted Space, emits no broadcast when already clustered, archives nothing and calls no `chrome.tabs.remove`, and acks `'ok'` without mutating for a Space with no instance in the window
- [x] 4.2 Add the `groupTempTabsBySite` handler to `background/handlers/temp-tabs.ts` — calling `markDirty` ONLY when the store returns `true`, since a pure reorder raises no Chrome event — extend that file's kind union, add the `SidebarVariant` entry in `background/handlers/context.ts`, and register it in `background/coordinator.ts`

## 5. i18n

- [x] 5.1 Add `sidebar_tempGroupBySite`, `sidebar_groupedTabsBySite` (plural, `{count}`), and `sidebar_undo` to `apps/extension/messages/en.json`
- [x] 5.2 Add authored translations for all eight non-base locales (`es, pt, fr, de, ja, ko, zh-CN, ru`)
- [x] 5.3 Confirm the catalog key-parity test passes

## 6. Sidebar (RED first)

- [x] 6.1 Add the failing `App.test.ts` cases: the kebab menu lists Clear duplicates then Group by site; Group by site is disabled when the list is already clustered; activating it dispatches `groupTempTabsBySite` with the panel's `spaceId`; the toast appears on a resolved ack, counts every live temp tab of the Space, and its Undo dispatches `reorderTemp` with the captured pre-group order; a new toast replaces one still showing
- [x] 6.2 Generalize the toast state from `{ message, tabIds }` to `{ message, onUndo }` and repoint Clear and Clear duplicates at it (behaviour unchanged)
- [x] 6.3 Replace `Toast`'s hard-coded `actionLabel="Undo"` with `m.sidebar_undo()` (design D8)
- [x] 6.4 Add `canGroupTempTabsBySite(space)` and `onGroupTempBySite(spaceId)`, and add the menu item after Clear duplicates

## 7. Verify

- [x] 7.1 `pnpm verify` at the workspace root is green
- [x] 7.2 `pnpm test:e2e` is green
- [x] 7.3 `openspec validate group-temp-tabs-by-site --strict` passes

## 8. Follow-up fixes (reported after first ship)

- [x] 8.1 Group exactly the ids `TempTabs` renders — drop the `windowId` filter in `store.groupTempTabsBySite` and in the sidebar's `liveTempIdsFor`, with a regression test for the immovable-pivot split
- [x] 8.2 Collect non-http(s) tabs into one browser-pages cluster pinned last, in `clusterIdsByHost`
- [x] 8.3 Update the `spaces-and-tabs` delta and the design log (D12, D13) to match
- [x] 8.4 `pnpm verify` green
