# Tasks — launcher-fuzzy-smart-folders

## 1. Dependency + stack amendment

- [x] 1.1 Add `@leeoniya/ufuzzy` to `apps/extension/package.json` (runtime dep); `pnpm install`, commit the lockfile change.
- [x] 1.2 Amend `docs/tech-stack.md`: At-a-glance row (Fuzzy search → uFuzzy), a "Non-obvious choices" subsection (why uFuzzy; **SW-side only, never in the overlay bundle** so the byte budget + no-Svelte/no-fuzzy overlay guard stay green), and a pinned version row.

## 2. Contract — the `smart` source + `folderName`

- [x] 2.1 `shared/launcher-contract.ts`: add `'smart'` to `ResultSource`; add `smart: 'smart'` to `BADGE_LABELS`; add optional `folderName?: string` to `LauncherResult`. Update the doc comments (precedence string, source-field table).
- [x] 2.2 Confirm the overlay still type-checks against the widened union (it imports `sourceBadgeLabel` + `LauncherResult` only — no scoring); no uFuzzy reaches `overlay.ts`.

## 3. Folder-name index

- [x] 3.1 Add `launcher/shared/folder-names.ts` exporting `buildFolderNameIndex(pinnedBySpace)` → `{ savedTabFolder: Record<SavedTabId,string>; smartFolder: Record<FolderId,string> }` (scan every Space's nodes: `folder` → each child `SavedTabId` ↦ name; `smart` → `FolderId` ↦ name). Pure, imports `shared` types only.
- [x] 3.2 Unit-test the index: a tab in a folder maps to the folder name; a favicon-row/unfoldered tab has no entry; a smart node maps its id to its name.

## 4. Providers

- [x] 4.1 Add `launcher/shared/providers/smart-folders.ts` — `smartFoldersProvider(smartFolders, folderNames?)` flattening every `runtime.items` (all sources, any runtime `state`) into `source: 'smart'` results (`id: 'smart:<itemId>'`, `title`, `url`, `folderName` from the index). No binding/tabId.
- [x] 4.2 Extend `providers/saved-tabs.ts` — `savedTabsProvider` takes the `savedTabFolder` index (new trailing param) and sets `folderName` when the saved tab is in a folder. Keep existing binding/`tabId` behaviour unchanged.
- [x] 4.3 Unit-test both providers, including: pending folder keeps last-known items; signed-out/error contribute none; saved tab in a folder carries `folderName`; favicon-row saved tab carries none.

## 5. Scoring — uFuzzy fuzzy/typo-tolerant matcher

- [x] 5.1 Rewrite `launcher/shared/scoring.ts`: **two** module-level uFuzzy instances — a SUBSEQUENCE pass (non-split haystack, `intraChars:'.'`, generous `intraIns`) and a TYPO pass (conservative `SingleError` intra opts — single per-term insert/sub/transpose/delete, no typo at the leading char), keeping the higher strength per field (resolved during apply: a single instance can't satisfy both the scattered-subsequence and transposition spec scenarios). Replace `scoreResult` with batch `scoreCandidates(query, candidates, now)`.
- [x] 5.2 Implement `strength(info)` ∈ [0,1] per D3 (base by start: prefix 1.0 / boundary 0.80 / mid-token 0.55, minus a gap penalty over `intraIns + interIns`); per-candidate `match = max(strength(title)·TITLE_W, strength(url)·URL_W, strength(folderName)·FOLDER_W)` per D2.
- [x] 5.3 Add `smart` to `SOURCE_WEIGHT` (≈0.78, between saved and bookmark); set `FOLDER_WEIGHT ≤ URL_WEIGHT`; keep the history recency boost inside `score = match · SOURCE_WEIGHT + recency`.
- [x] 5.4 Tune the D3 constants + uFuzzy opts against a fixture so the existing exact-match ordering invariants still hold (prefix beats scattered; tab-focus beats history) and the new fuzzy/typo cases pass.

## 6. Engine wiring

- [x] 6.1 `launcher/shared/search-engine.ts`: add `smart: LauncherResult[]` to `SearchSources`; set merge/de-dup order to `[...tabs, ...saved, ...smart, ...bookmarks, ...history]`; call `scoreCandidates` over the de-duped survivors (keep drop-zeros → stable sort → cap → truncation `log`).
- [x] 6.2 `background/launcher-suggestions-handler.ts`: build the folder-name index once from `store.state.pinnedBySpace`; wire `smartFoldersProvider(store.state.smartFolders, idx.smartFolder)` and pass `idx.savedTabFolder` to `savedTabsProvider`. Stay pure-read (no enqueue/mutate/persist/broadcast).

## 7. Surface rendering (badge)

- [x] 7.1 New-tab: confirm `ui/ResultRow.svelte` renders `smart` rows via the shared `sourceBadgeLabel` + `data-source="smart"` with no per-source colour token added (Comfort two-line + selection wash unchanged).
- [x] 7.2 Overlay: mirror the `smart` badge + `data-source="smart"` hook (`row.dataset.source`) in `overlay.ts`/`overlay.css` (the standing no-Svelte vanilla exception) to match `ResultRow` — badge stays source-agnostic (no per-source colour).

## 8. Tests + guards

- [x] 8.1 Update `scoring.test.ts` / `search-engine.test.ts` / `providers/providers.test.ts` for `scoreCandidates`, the `smart` source, the new precedence, fuzzy/typo, and folder-name matching (cover every new spec scenario).
- [x] 8.2 Confirm the overlay budget guard (`launcher/overlay.budget.test.ts`) still passes — no `node_modules/svelte/` import and gzipped size < 15KB, with uFuzzy absent from the overlay graph (assertion added).
- [x] 8.3 Update the `openspec/specs/launcher` spec: five providers (add smart-folder items), the fuzzy/typo + folder-name scoring model, the `tab > saved > smart > bookmark > history` precedence, the current-Space scope, and the `launcherScope` setting.

## 9. Verify

- [x] 9.1 `pnpm verify` at the workspace root green (tsc, biome incl. layer DAG, svelte-check, stylelint, vitest across packages).
- [x] 9.2 Re-read proposal/design/specs and confirm no un-surfaced deviation (names, files, fields all match the artifacts); raise any via AskUserQuestion before marking complete. — All deviations surfaced + agreed: two-instance uFuzzy matcher (D3/D7), the current-Space scope + `launcherScope` setting (D9), and deferring cross-Space activation auto-switch to a follow-up change; artifacts + docs updated in lockstep.

## 10. Current-Space launcher scope (added during apply, user-directed — design D9)

- [x] 10.1 `shared/launcher-contract.ts`: add optional `spaceId?: SpaceId` to `LauncherResult` (owning Space — pinned `saved` + every `smart`; absent for globals).
- [x] 10.2 `folder-names.ts`: add `smartFolderSpace: Record<FolderId, SpaceId>` to the index (scan switches to `Object.entries` for the spaceId); unit-tested.
- [x] 10.3 Providers set `spaceId` — `smartFoldersProvider(…, folderSpaces?)` from the index; `savedTabsProvider` from `SavedTab.spaceId` (pinned only, favorites null → none); unit-tested.
- [x] 10.4 `scoring.ts`: add `activeSpaceId?` param + a bounded `SPACE_BOOST` for in-Space results; `search-engine.ts` `runSearch` forwards it; unit-tested (in-Space outscores cross-Space peer; never boosts a non-match or a global row).
- [x] 10.5 `settings.ts`: add `LauncherScope` type + `launcherScope` enum declaration (`Search` group, default `prefer-current-space`); fix dependent `Settings` fixtures + the Options radio-count test.
- [x] 10.6 Handler: read `launcherScope` + `activeSpaceByWindow[windowId]`; filter Lunma sources for `current-space-only`, forward the active Space for `prefer-current-space`; handler-tested across all three modes (incl. favorites kept in strict mode).
- [x] 10.7 Artifacts updated in-change: proposal (What Changes / Capabilities / Impact), design (D5/D6/D9), spec (`spaceId` field + the *Launcher Space scope* requirement + scenarios), and the `openspec/specs/launcher` spec.

## 11. Cross-Space marker (added during apply, user-directed — design D10)

- [x] 11.1 `shared/launcher-contract.ts`: add optional `spaceName?`/`spaceColor?` to `LauncherResult` (a cross-Space marker; presence = render).
- [x] 11.2 Handler: `markCrossSpace` tags each `smart`/pinned-`saved` result whose owning Space ≠ active Space with `spaceName` + a paintable `spaceColor` (`oklch(…)` via `colourToOklch`); no-op when no active Space; runs in all scope modes (current-space-only already filtered the cross-Space rows out).
- [x] 11.3 `ui/ResultRow.svelte` + `ui/ResultList.svelte`: render a `.meta` cluster (`.space-chip` colour-dot + name, then the source badge); forward `spaceName`/`spaceColor`. Dot `background` is the only data-driven inline style.
- [x] 11.4 Overlay: mirror the `.meta`/`.space-chip` in `overlay.ts` + `overlay.css` (stateless — paints `result.spaceColor` directly, no palette import). Budget guard still green (no svelte/uFuzzy, < 15KB).
- [x] 11.5 Tests: handler (cross-Space carries `spaceName`+`spaceColor`, in-Space doesn't), `ResultRow` (chip renders only with `spaceName`, dot paints the colour).
- [x] 11.6 Artifacts/docs updated: proposal (What Changes / Impact), design (D10 + the Visual language section revised — the one new colour is the Space dot, AA held), spec (`spaceName`/`spaceColor` field + marker clause + scenario), the `openspec/specs/launcher` spec.
