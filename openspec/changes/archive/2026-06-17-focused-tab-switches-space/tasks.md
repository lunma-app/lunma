# Tasks — focused-tab-switches-space

## 1. Owning-Space derivation helper

- [x] 1.1 Add a pure read helper `spaceOwningTab(state: AppState, windowId: WindowId, tabId: TabId): SpaceId | null` to `apps/extension/src/background/handlers/queries.ts` (no `chrome.*`, no mutation — matches the module's contract). Resolution: (a) the Space whose `spaceInstancesByWindow[windowId][spaceId].tempTabIds` includes `tabId`; else (b) a coupled pinned tab bound to it in that window (`tabBindings[savedId][windowId] === tabId` with `savedTabs[savedId].spaceId !== null`) → that `spaceId`; else `null`.
- [x] 1.2 A global favorite (`savedTabs[id].spaceId === null`) and any ungrouped/untracked tab SHALL resolve to `null` (never an owning Space).

## 2. Switch on activation (the onActivated handler)

- [x] 2.1 `handlers/chrome-tabs.ts` `tabs.onActivated`: after `setActiveTab` + the feed-consume side-effects, compute `spaceOwningTab(ctx.store.state, activeInfo.windowId, activeInfo.tabId)`; when it is non-null and differs from `activeSpaceByWindow[activeInfo.windowId]`, `await activateSpaceInWindow(ctx, activeInfo.windowId, owningSpace)` (from `handlers/activation.ts`). The handler becomes `async`; keep the existing `ctx.markDirty()`.
- [x] 2.2 Confirm no `focusTab`/launcher/surface change is needed (the switch is emergent via the resulting `onActivated`), per design D1.

## 3. Tests

- [x] 3.1 `chrome-tabs`/coordinator `onActivated` handler tests: activating a temp tab that lives in another Space switches the window's active Space (incoming group expanded, outgoing collapsed) AND the broadcast carries the new active Space; a same-Space activation does NOT re-switch (no orchestration); a global favorite / ungrouped tab never switches.
- [x] 3.2 No switch-loop: when the activation-driven switch activates a focus tab inside the now-active Space's group, the re-fired `onActivated` does NOT switch again — exactly one switch per activation (design D4).
- [x] 3.3 `queries.ts` unit tests for `spaceOwningTab`: temp-tab match, coupled-pinned-tab match, favorite/ungrouped → `null`.
- [x] 3.4 Playwright e2e (mirroring `e2e/cross-space-switch.spec.ts`): focus a cross-Space **open/temporary** tab from the launcher (open-tab result) and assert the SW's `activeSpaceByWindow` AND the sidebar's active-Space chip both move to that Space.

## 4. Docs

- [x] 4.1 The `openspec/specs/spaces-and-tabs` spec gains the activation-time Space-switch clause on *Per-window active Space tracking* (carried by this change's `specs/spaces-and-tabs/spec.md` delta). No `docs/` change (no layer-DAG, schema, or stack change); confirm `docs/architecture.md`'s active-Space model is unchanged in shape.

## 5. Verify

- [x] 5.1 `pnpm verify` at the workspace root green (tsc, biome incl. layer DAG, svelte-check, stylelint, vitest across packages).
- [x] 5.2 `pnpm test:e2e` green (the new cross-Space open-tab e2e plus the existing suite).
- [x] 5.3 Re-read proposal/design/specs and confirm no un-surfaced deviation (names, files, fields match the artifacts); raise any via AskUserQuestion before marking complete.
