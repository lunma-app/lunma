# Tasks — cross-space-tab-switch

## 1. Shared activation helper

- [x] 1.1 Extract the `activateSpace` command's two-step sequence (`store.activateSpace(windowId, spaceId)` + `ctx.groups.orchestrateActivation(windowId, spaceId, outgoing, true)`, capturing `outgoing` first) into one reusable helper (e.g. `activateSpaceInWindow(ctx, windowId, spaceId)`), and have `handlers/spaces.ts`'s `activateSpace` call it (no behaviour change there).
- [x] 1.2 The helper SHALL no-op when `spaceId === activeSpaceByWindow[windowId]` (idempotent, so callers can invoke it unconditionally for a coupled record).

## 2. Switch on activation (the two handlers)

- [x] 2.1 `handlers/pinned-tabs.ts` `openSavedTab`: when `saved.spaceId !== null` and it differs from the focused window's active Space, call the helper **before** `addTabToSpaceGroup`, so the new tab joins the now-shown group. Favorites (`spaceId === null`) and same-Space opens are unchanged.
- [x] 2.2 `handlers/pinned-tabs.ts` `focusSavedTab`: when the bound tab's `saved.spaceId !== null` and differs from the active Space, call the helper **before** `chrome.tabs.update(active)`. Favorites/same-Space unchanged.
- [x] 2.3 Confirm smart/tab/bookmark/history activation paths are untouched (smart items keep acting via `openUrl` with no Space switch, per design D4).

## 3. Tests

- [x] 3.1 Coordinator/`pinned-tabs` handler tests: a dormant cross-Space pin open switches the window's active Space AND the new tab joins the now-active (visible) group; a dormant same-Space pin does NOT re-activate; a dormant favorite never switches.
- [x] 3.2 A bound cross-Space saved tab focus switches the active Space before focusing; a same-Space bound focus does not switch.
- [x] 3.4 (added, agreed with user) Playwright e2e (`e2e/cross-space-switch.spec.ts`): in a real Chromium loading `dist/`, an external `activateSpace` moves the sidebar, and focusing a cross-Space pinned saved tab switches BOTH the SW's `activeSpaceByWindow` AND the sidebar's active-Space chip — closing the broadcast→sidebar round-trip the vitest layer cannot exercise.
- [x] 3.3 The `activateSpace` command handler still behaves identically after the helper extraction for every real (production-reachable) path. Surfaced deviation (D5): the idempotent helper makes an explicit *same-Space* re-activate a no-op (skips the stale-group rebuild). No surface ever dispatches `activateSpace` for the already-active Space (`SpaceSwitcher` opens the editor instead; the swipe carousel only commits to adjacent Spaces), so this path is production-unreachable. The one favorites test that re-activated the active Space to force a stale-group rebuild was rewired to drive it via a genuine `away → work` switch; all `activateSpace` tests stay green.

## 4. Docs

- [x] 4.1 The `lunma-bookmark-bindings` spec delta notes the activation-time Space switch for coupled saved tabs (favorites excluded) — already carried by this change's `specs/lunma-bookmark-bindings/spec.md`. Added a `specs/launcher/spec.md` delta: a MODIFIED *Acting on a launcher result* requirement with a single **non-normative** cross-reference (no new `SHALL`, no behaviour change) that selecting a coupled cross-Space `saved` result switches to its Space via the `lunma-bookmark-bindings` handlers. Proposal Capabilities/Impact updated to reflect the launcher's doc-only cross-link.

## 5. Verify

- [x] 5.1 `pnpm verify` at the workspace root green (tsc, biome incl. layer DAG, svelte-check, stylelint, vitest across packages). Extension 2110 tests + site 21 tests pass; exit 0.
- [x] 5.2 Re-read proposal/design/specs and confirm no un-surfaced deviation (names, files, fields match the artifacts). Three deviations were surfaced via AskUserQuestion and agreed, with artifacts updated in lockstep: (a) new `handlers/activation.ts` host for the shared helper; (b) D5 — the idempotent helper makes a (production-unreachable) same-Space re-activate a no-op; (c) launcher gains a non-normative cross-reference delta + proposal rewording. `openspec validate` passes.
