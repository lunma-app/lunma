## 1. Descendant collection (pure)

- [x] 1.1 Add `collectDescendantTabIds(liveTabsById, rootTabId, spaceTempTabIds)` to `apps/extension/src/shared/provenance.ts`: transitive descendants of `rootTabId` by resolved `provenanceParentTabId`, restricted to ids present in `spaceTempTabIds`, with a visited set so a cycle terminates. An excluded tab PRUNES its subtree (design D4b) — build the child index from eligible tabs only, so nothing below an excluded tab is reachable. No `chrome.*`.
- [x] 1.2 Unit-test it in `apps/extension/src/shared/provenance.test.ts`: two children of one parent; a three-level chain; the root never in the result; an unrelated tab excluded; a descendant excluded because it is not in `spaceTempTabIds`; a subtree below an excluded tab also excluded (design D4b); no children; a cycle terminating.
- [x] 1.3 Mutation-check 1.2 — break the transitive step, then the Space fence, and confirm a test fails for each.

## 2. Settings declaration

- [x] 2.1 Add `closeChildTabsWithParent: boolean` to the `Settings` interface in `apps/extension/src/shared/settings.ts`, with a doc comment naming the `tab-close-cascade` capability.
- [x] 2.2 Add its `SETTINGS` declaration: `type: 'toggle'`, `default: false`, group `Tabs`, placed immediately after `trackTabProvenance`; description names the consequence first, then that it is undoable.
- [x] 2.3 Add `BooleanSettingKey` (the boolean-valued keys of `Settings`) and `ToggleSettingDeclaration.dependsOn?: BooleanSettingKey`; set `dependsOn: 'trackTabProvenance'` on the new declaration. The narrow type is normative — a text/enum key must not compile (settings spec).
- [x] 2.4 Add the key to `DEFAULTS` — it is a hand-written literal, not derived. Confirm the derived Zod (`buildSchema`) picks the toggle up automatically and that a non-boolean stored value degrades to `false` via its `.catch(default)` without failing the whole read.
- [x] 2.5 Add `options_label_closeChildTabsWithParent`, `options_desc_closeChildTabsWithParent`, and the parameterised `options_desc_requiresSetting` (the disabled-reason line, `{setting}`) to ALL NINE `apps/extension/messages/*.json`, keeping key parity across locales, and register the two per-setting keys in `apps/extension/src/options/labels.ts`.

## 3. Coordinator mirror

- [x] 3.1 Add `closeChildTabsWithParent(): boolean` to `HandlerContext` in `apps/extension/src/background/handlers/context.ts`, documented as a synchronous mirror like `provenanceEnabled()`.
- [x] 3.2 Add the backing field, `setCloseChildTabsWithParent(value)`, and the context wiring in `apps/extension/src/background/coordinator.ts`. Default `false`.
- [x] 3.3 Seed the mirror at boot AND push it from the settings watcher in `apps/extension/src/background/index.ts`. Both — a boot-only seed is stale for the life of the worker (the defect `add-tab-provenance` shipped and fixed).
- [x] 3.4 Regression-test the watcher push BEHAVIOURALLY, in the cascade tests (7.2), not in `index.test.ts`: the mirror is private to the coordinator and exposing a getter purely for a test would add public surface the proposal does not list. The test enables the setting through a live settings change and asserts a subsequent close cascades. Mutation-check by deleting the watcher push. (Moved from `index.test.ts`; see design "Apply-time decisions".)

## 4. Re-entrancy registry

- [x] 4.1 Add `apps/extension/src/background/close-cascade.ts` exporting `markCascading(tabIds)`, `isCascading(tabId)`, `clearCascading(tabId)` and the test-only `resetCloseCascade()`, modelled on `background/initial-load-tabs.ts` and `background/handlers/pending-duplicate-tabs.ts` (both of which export the same reset).
- [x] 4.2 Unit-test mark/is/clear: clearing one id leaves the rest of the batch marked; clearing an unmarked id is a no-op; `resetCloseCascade` empties the registry.

## 5. The cascade itself

- [x] 5.1 In the `tabs.onRemoved` handler (`apps/extension/src/background/handlers/chrome-tabs.ts`), resolve the batch BEFORE `ctx.store.onTabRemoved`, which splices the tab out of `tempTabIds` and makes `spaceOwningTab` return `null` (design D2). It need not precede the existing `nextUnreadFeedItemAfterClose` read, which has the same constraint. Guard, cheapest first: not `info.isWindowClosing`; `ctx.closeChildTabsWithParent()`; `ctx.provenanceEnabled()`; not `isCascading(tabId)`.
- [x] 5.2 Resolve the closing tab's Space with the existing `spaceOwningTab` query (`background/handlers/queries.ts`), then CONFIRM the closing tab is in that Space's `tempTabIds` — `spaceOwningTab` also resolves a Space through `tabBindings`, so it answers for a PINNED tab, which must not cascade. Read that Space's `tempTabIds` and collect descendants via 1.1. Empty batch ⇒ proceed with the normal removal path, no side effects.
- [x] 5.3 Archive every batch member with ONE shared `archivedAt` via `appendArchivedTab`, then `pruneArchivedTabs(now)` — matching `clearTempTabs`. Do NOT archive the directly-closed tab (design D6). This is synchronous store work, followed by `ctx.markDirty()`.
- [x] 5.4 `markCascading(batch)`, then run the chrome I/O through `ctx.runSideEffect` (design D7): survivor check via `chrome.tabs.query`, `chrome.tabs.create` if the window would be emptied, then `chrome.tabs.remove(batch)`. Clear each mark as its removal arrives, and clear the whole batch when the remove call settles, so a mark cannot leak when a removal never comes.
- [x] 5.5 Broadcast `CASCADE_CLOSED` (`'lunma/cascade-closed'`, new constant in `apps/extension/src/shared/bus.ts`) with `{ windowId, tabIds }` via `chrome.runtime.sendMessage`, mirroring the `TAB_DEDUP_FLASH` broadcast already in this file.

## 6. Undo surface

- [x] 6.1 In `apps/extension/src/sidebar/App.svelte`, listen for `CASCADE_CLOSED` on `chrome.runtime.onMessage` (mirroring the `TAB_DEDUP_FLASH` listener in `TempTabs.svelte`), ignoring messages for another window.
- [x] 6.2 Raise the EXISTING `clearedToast` slot with the cascade count and `onUndo: () => onUndoClear(tabIds)`. No new toast component, no change to `undoClearTempTabs`.
- [x] 6.3 Add `sidebar_cascadeClosedTabs` (plural-aware, like `sidebar_clearedTabs`) to all nine locales.
- [x] 6.4 Test: the announcement raises the toast; a message for a different window is ignored; taking undo dispatches `undoClearTempTabs` with exactly the announced ids; a cascade toast replaces a showing clear toast rather than stacking.

## 7. Cascade tests

- [x] 7.1 Coordinator-level tests in a new `apps/extension/src/background/coordinator.close-cascade.test.ts`: a parent takes both children; a three-level chain goes whole; an unrelated tab survives; closing a child leaves the parent open.
- [x] 7.2 Guard tests: `isWindowClosing` cascades nothing; setting off cascades nothing; provenance off cascades nothing; closing a PINNED tab with temp children cascades nothing; a re-entrant removal of a batch member starts no second cascade. Include the behavioural mirror-push test moved here from 3.4: enabling the setting through a live settings change makes a subsequent close cascade.
- [x] 7.3 Scope tests: a pinned descendant survives; a descendant in another Space survives; a subtree below an excluded tab survives.
- [x] 7.4 Batch/undo tests: every descendant archived under one `archivedAt`; the directly-closed tab NOT archived; no descendant archived twice; the announcement carries exactly the archived ids; a rejected announcement does not fail the cascade and leaves the archive intact.
- [x] 7.5 Ordering test: a cascade still fires for a tab whose Space is resolvable only before `onTabRemoved` — the regression guarding design D2.
- [x] 7.6 Mutation-check 7.1–7.5: remove the `isWindowClosing` guard, the re-entrancy guard, the shared stamp, and move the collection after `onTabRemoved`, and confirm a test fails for each.

## 8. Options rendering

- [x] 8.1 Add a control-level `disabled?: boolean` prop to `apps/extension/src/ui/SegmentedControl.svelte` that dims the selection pill along with the options and blocks input. The existing per-option flag dims labels only, leaving the pill at full opacity (design, Visual language).
- [x] 8.2 Add the opacity transition so the disabled swap does not snap, honouring the primitive's existing reduced-motion guard.
- [x] 8.3 Update `apps/extension/catalog/stories/ui/SegmentedControl.stories.svelte` with a disabled variant — required by the component-library policy for any `src/ui` primitive this change modifies, and the first case for a state nothing else exercises.
- [x] 8.4 In `apps/extension/src/options/Options.svelte`, render a `dependsOn` toggle disabled by passing the new prop, resolving the dependency through its EFFECTIVE value (`toggleValue()`), not `settings[dependsOn]` (design D8b).
- [x] 8.5 Swap the row description to `options_desc_requiresSetting` with the dependency's label when disabled.
- [x] 8.6 Ensure a disabled toggle does not write its setting, and that the stored value survives toggling the dependency off and on (design D9).
- [x] 8.7 Tests in `apps/extension/src/options/Options.test.ts`: disabled when the dependency is off; disabled when the dependency is stored `true` but not effectively on; interactive when effectively on; no write while disabled; stored value preserved across a dependency flip; a toggle with no `dependsOn` unaffected.

## 9. Verification

- [x] 9.1 `pnpm verify` at the workspace root, green (includes the story-parity guard for 8.3).
- [x] 9.2 `pnpm test:e2e`, green.
- [x] 9.3 Verified in a real Chrome against the built extension with a throwaway e2e probe (not a hand check): provenance on + setting on, two tabs opened from a parent, closing the parent left zero http tabs and archived both children under ONE stamp.
- [x] 9.4 Verified the same way: closing a whole window with the setting on archived nothing.
- [x] 9.5 Verified from screenshots of the real options page in both states: disabled renders pill AND labels dimmed together (the pill is not left lit), the row keeps its own description and appends "Turn on “Show where tabs came from” first.", and enabling the dependency restores full contrast and drops the reason line.
- [x] 9.6 `openspec validate close-child-tabs-with-parent --strict`, clean.
