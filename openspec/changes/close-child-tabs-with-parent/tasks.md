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

## 5. The request

- [x] 5.1 In the `tabs.onRemoved` handler (`apps/extension/src/background/handlers/chrome-tabs.ts`), resolve the batch BEFORE `ctx.store.onTabRemoved`, which splices the tab out of `tempTabIds` and makes `spaceOwningTab` return `null` (design D2). Guard, cheapest first: not `info.isWindowClosing`; `ctx.closeChildTabsWithParent()`; `ctx.provenanceEnabled()`; not `isCascading(tabId)`.
- [x] 5.2 Resolve the closing tab's Space with `spaceOwningTab`, then CONFIRM the closing tab is in that Space's `tempTabIds` — `spaceOwningTab` also resolves through `tabBindings`, so it answers for a PINNED tab, which must not cascade. Collect descendants via 1.1; an empty batch means no request.
- [x] 5.3 Broadcast `CASCADE_CONFIRM` (new constant in `shared/bus.ts`) with `{ windowId, spaceId, tabIds, title }` through `ctx.runSideEffect`, mirroring the `TAB_DEDUP_FLASH` broadcast in the same file. Archive NOTHING and close NOTHING here (design D6a).
- [x] 5.4 A rejected broadcast — no surface listening — leaves everything open and is not reported as an error.

## 6. The answer

- [x] 6.1 Add the `closeChildTabs` sidebar command (`{ windowId, spaceId, tabIds }`) to `shared/bus.ts`. THREE hand-maintained lists must each be updated — `SIDEBAR_COMMAND_KINDS`, `COMMAND_SCHEMAS`, and the `SidebarCommandSchema` discriminated-union member list — and only `COMMAND_SCHEMAS` is type-checked, so the other two fail at runtime, not at `tsc`.
- [x] 6.1a Close that gap: drive `bus.test.ts`'s per-kind loop from the type-exhaustive `VALID_COMMANDS` rather than from `SIDEBAR_COMMAND_KINDS`, and assert both directions between the Set and the union. Mutation-check by removing the new command from each list.
- [x] 6.2 Add its `SidebarVariant` to `handlers/context.ts` and its (empty) `EventPolicy` entry — never coalesced, since each confirmed batch is its own destructive act.
- [x] 6.3 Handle it in `handlers/temp-tabs.ts` beside `clearTempTabs`: re-validate the ids against the Space's current `tempTabIds` and live tabs (design D6b), archive the survivors under ONE `archivedAt`, `markCascading`, run the survivor check, then `chrome.tabs.remove`. Release the marks if the removal throws.
- [x] 6.4 In `sidebar/App.svelte`, listen for `CASCADE_CONFIRM` (mirroring the `TAB_DEDUP_FLASH` listener), ignore other windows, and raise the EXISTING toast slot with the count and a "Close" action that dispatches `closeChildTabs`. `Toast` already takes a generic `actionLabel`/`onAction`, so no primitive changes.
- [x] 6.5 Add `sidebar_cascadeConfirm` (plural-aware, like `sidebar_clearedTabs`) and `sidebar_cascadeConfirmAction` to all nine locales.
- [x] 6.6 Test the prompt: accepting dispatches `closeChildTabs` with exactly the offered ids; dismissing dispatches nothing; another window's request is ignored; an empty batch or a missing Space raises nothing.

## 7. Cascade tests

- [x] 7.1 Coordinator-level tests in `apps/extension/src/background/coordinator.close-cascade.test.ts`, driving the full round trip (close → request → confirm): a parent takes both children; a three-level chain goes whole; an unrelated tab survives; closing a child asks nothing.
- [x] 7.2 Guard tests, asserting NO REQUEST was made (not merely that nothing was removed — nothing is removed before confirmation, so that assertion is vacuous): `isWindowClosing`; setting off; provenance off; closing a pinned tab; a re-entrant removal of a batch member.
- [x] 7.3 Scope tests: a descendant outside the Space temp list survives; a subtree below an excluded tab survives.
- [x] 7.4 Request/batch tests: the request names the tabs, the Space, and the closed tab's title, and archives nothing; an unanswered request closes and archives nothing; a request nobody can receive closes nothing; once confirmed, every tab is archived under one stamp; the directly-closed tab is not archived; no tab archived twice; a confirmation is re-validated against the tabs that still exist; the window is never left empty.
- [x] 7.5 Ordering test: the batch is still resolvable for a tab whose Space is only known before `onTabRemoved` — the regression guarding design D2.
- [x] 7.6 Mutation-check 7.1–7.5: remove each of the five guards, the re-validation, the shared stamp, and the pre-`onTabRemoved` collection in turn, and confirm a test fails for each.

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
- [x] 9.3 Verified in a real Chrome with a throwaway e2e probe: closing a parent of two left both children OPEN and raised "Close 2 tabs opened from it?"; accepting closed both and archived them under ONE stamp.
- [x] 9.4 Verified the same way: closing a whole window with the setting on archived nothing.
- [x] 9.5 Verified from screenshots of the real options page in both states: disabled renders pill AND labels dimmed together (the pill is not left lit), the row keeps its own description and appends "Turn on “Show where tabs came from” first.", and enabling the dependency restores full contrast and drops the reason line.
- [x] 9.6 `openspec validate close-child-tabs-with-parent --strict`, clean.
