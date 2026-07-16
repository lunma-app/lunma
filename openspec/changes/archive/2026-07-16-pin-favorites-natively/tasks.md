# Tasks: pin-favorites-natively

## 1. Chrome wrappers (tab-groups.ts)

- [x] 1.1 RED: add tests for `setTabNativePinned(tabId, pinned)` — calls `chrome.tabs.update(tabId, { pinned })`, swallows + `log.debug`s a refusal (stale/closed tab), never throws
- [x] 1.2 GREEN: implement `setTabNativePinned` in `apps/extension/src/background/tab-groups.ts`, mirroring `ungroupTabs`' best-effort contract
- [x] 1.3 Delete `moveTabToStripStart` and its tests (subsumed by native pinning; verify no remaining call sites)

## 2. Orchestrator helper rename + pin (group-orchestrator.ts)

- [x] 2.1 RED: update orchestrator tests — `ensureFavoriteNativePinned(tabId)` ungroups then natively pins; no `chrome.tabs.move` park call
- [x] 2.2 GREEN: rename `ensureFavoriteUngrouped` → `ensureFavoriteNativePinned`; body = `ungroupTabs(tabId)` then `setTabNativePinned(tabId, true)`; update all call sites (`handlers/favorites.ts`, `handlers/pinned-tabs.ts`) and the orchestrator interface type

## 3. Favorite-exit paths natively unpin

- [x] 3.1 RED: `pinSavedTab` (couple favorite → Space) natively unpins each bound tab BEFORE `addTabToSpaceGroup` (coordinator.favorites tests)
- [x] 3.2 GREEN: implement the unpin in `handlers/favorites.ts` `pinSavedTab`
- [x] 3.3 RED: `unpinTab` on a `spaceId === null` favorite natively unpins each bound tab before restoring it to Temporary; a coupled saved tab's `unpinTab` performs no native unpin
- [x] 3.4 GREEN: implement the unpin in `handlers/pinned-tabs.ts` `unpinTab`

## 4. Boot favorite reconciliation (tab-group-adoption.ts)

- [x] 4.1 RED: boot favorite step ungroups a still-grouped favorite tab, natively pins an unpinned favorite tab (read `tab.pinned` from the boot tabs query — no extra Chrome call), no-ops an ungrouped+pinned one, and no longer parks (`chrome.tabs.move`)
- [x] 4.2 GREEN: extend the boot favorite step; thread the boot tabs query's `pinned` state to it; drop the park call

## 5. Verify

- [x] 5.1 `pnpm verify` at the workspace root passes (tsc, biome incl. layer DAG, svelte-check, stylelint, catalog gates, vitest)
- [x] 5.2 Confirm no source reference to `ensureFavoriteUngrouped` / `moveTabToStripStart` remains (`grep -rn` over `apps/extension/src`)
