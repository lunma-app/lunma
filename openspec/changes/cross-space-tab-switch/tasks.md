# Tasks — cross-space-tab-switch

## 1. Shared activation helper

- [ ] 1.1 Extract the `activateSpace` command's two-step sequence (`store.activateSpace(windowId, spaceId)` + `ctx.groups.orchestrateActivation(windowId, spaceId, outgoing, true)`, capturing `outgoing` first) into one reusable helper (e.g. `activateSpaceInWindow(ctx, windowId, spaceId)`), and have `handlers/spaces.ts`'s `activateSpace` call it (no behaviour change there).
- [ ] 1.2 The helper SHALL no-op when `spaceId === activeSpaceByWindow[windowId]` (idempotent, so callers can invoke it unconditionally for a coupled record).

## 2. Switch on activation (the two handlers)

- [ ] 2.1 `handlers/pinned-tabs.ts` `openSavedTab`: when `saved.spaceId !== null` and it differs from the focused window's active Space, call the helper **before** `addTabToSpaceGroup`, so the new tab joins the now-shown group. Favorites (`spaceId === null`) and same-Space opens are unchanged.
- [ ] 2.2 `handlers/pinned-tabs.ts` `focusSavedTab`: when the bound tab's `saved.spaceId !== null` and differs from the active Space, call the helper **before** `chrome.tabs.update(active)`. Favorites/same-Space unchanged.
- [ ] 2.3 Confirm smart/tab/bookmark/history activation paths are untouched (smart items keep acting via `openUrl` with no Space switch, per design D4).

## 3. Tests

- [ ] 3.1 Coordinator/`pinned-tabs` handler tests: a dormant cross-Space pin open switches the window's active Space AND the new tab joins the now-active (visible) group; a dormant same-Space pin does NOT re-activate; a dormant favorite never switches.
- [ ] 3.2 A bound cross-Space saved tab focus switches the active Space before focusing; a same-Space bound focus does not switch.
- [ ] 3.3 The `activateSpace` command handler still behaves identically after the helper extraction (its existing tests stay green).

## 4. Docs

- [ ] 4.1 The `openspec/specs/lunma-bookmark-bindings` spec: note the activation-time Space switch for coupled saved tabs (favorites excluded); the `openspec/specs/launcher` spec: cross-link it from the saved-result action (selecting a cross-Space saved result switches to its Space).

## 5. Verify

- [ ] 5.1 `pnpm verify` at the workspace root green (tsc, biome incl. layer DAG, svelte-check, stylelint, vitest across packages).
- [ ] 5.2 Re-read proposal/design/specs and confirm no un-surfaced deviation (names, files, fields match the artifacts); raise any via AskUserQuestion before marking complete.
