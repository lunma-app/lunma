## Why

When a user presses `Alt+L` (or types on the new-tab home) they can reach an open
tab, a saved tab, any Chrome bookmark, or a history entry — but **not** the live
forge work and feed items Lunma itself fetches into smart folders. The product
makes those items first-class in the sidebar, yet the launcher is blind to them:
to jump to a tracked PR/MR/issue/article you must open the sidebar and expand the
folder. This change makes the launcher reach smart-folder items directly, so
`Alt+L → type a PR title → Enter` jumps straight to it.

It also fixes two everyday frustrations with the finder's matching. Today
matching is exact substring only — a typo (`recieve`) or a non-contiguous guess
(`prsfix`) finds nothing, and there is no way to find things by the **folder**
they live in. After this change the finder is fuzzy and typo-tolerant, and a
saved tab or smart item also matches its parent folder's name (type `work` and
the tabs inside your "Work" folder surface). The value is one coherent step up in
the launcher's reach and forgiveness — the surface the user hits dozens of times
a day.

## What Changes

- **A fifth launcher data provider — smart-folder items.** A new
  `smartFoldersProvider` flattens the live `AppState.smartFolders` runtime items
  (across **all** sources — GitLab, GitHub, Jira, RSS) into launcher candidates.
  Items are link-shaped (`{ id, title, url, status? }`), so they act through the
  **existing** `openUrl { url, windowId }` branch — no new dispatch, message,
  chrome API, or permission.
- **A new result source `'smart'`**, badged generically as `smart`. The de-dup
  precedence gains a slot: **`tab > saved > smart > bookmark > history`** (a PR
  open as a tab is reached by focusing the tab; a live work item outranks a stale
  bookmark/history hit). A `smart` source weight is added to scoring.
- **Folder-name-aware matching.** A saved tab also matches the name of the
  regular `folder` node it lives in; a smart item also matches its smart-folder's
  name. Folders themselves are **not** result rows and gain no new activation —
  the folder name only widens what its children match against. `LauncherResult`
  gains an optional `folderName?: string`.
- **A configurable current-Space scope** (added during apply, user-directed). A
  new global **`launcherScope`** setting (`Search` group; enum; default
  `prefer-current-space`) governs how the launcher relates results to the
  requesting window's active Space: `global` (no preference, the launcher-v1
  behaviour), `prefer-current-space` (in-Space results get a bounded scoring
  boost, everything still reachable), or `current-space-only` (cross-Space Lunma
  items — smart items + pinned saved tabs from other Spaces — are filtered out;
  global favorites/tabs/bookmarks/history remain). Only Space-placed Lunma results
  carry an owning Space, so `LauncherResult` also gains an optional `spaceId?:
  SpaceId`. Resolved service-worker-side; no surface/message change. (Cross-Space
  *activation* auto-switch is deferred to a separate follow-up change.)
- **A cross-Space marker on result rows** (added during apply, user-directed). A
  `smart`/pinned-`saved` result that lives in a Space other than the one being
  viewed shows a small chip — a colour dot in that Space's identity colour + its
  name — so the cross-Space items a `prefer-current-space`/`global` list surfaces
  are identifiable at a glance. The SW handler resolves the marker and ships
  `spaceName` + a paintable `spaceColor` `oklch(…)` on the result (so the stateless
  overlay needs no Space palette); `LauncherResult` gains optional
  `spaceName?`/`spaceColor?`. In-active-Space and global rows carry no marker.
- **Fuzzy, typo-tolerant matching via uFuzzy.** The hand-rolled exact-substring
  `scoreResult`/`quality` is replaced by a uFuzzy-backed matcher running
  service-worker-side. A 0..1 match strength derived from uFuzzy's match info is
  kept inside today's `× SOURCE_WEIGHT (+ history recency)` envelope, so source
  ordering and the recency tiebreaker survive. The fixed cap, URL de-dup, and
  truncation-log are unchanged.
- **BREAKING (pinned stack):** adds the `@leeoniya/ufuzzy` runtime dependency.
  Because the launcher scorer runs only in the service worker (both surfaces are
  thin clients that render returned results), uFuzzy never enters the overlay's
  `<15KB` content-script bundle — the prior "no fuzzy dependency / small overlay"
  rationale does not apply here. `docs/02-tech-stack.md` is amended in this same
  change to record the dependency and its rationale.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `launcher`: the *Shared search engine and data providers* requirement gains a
  fifth provider (smart-folder items) and the `'smart'` source; the *Result
  de-duplication, scoring, and ordering* requirement changes the de-dup
  precedence to `tab > saved > smart > bookmark > history`, replaces the
  exact-substring match model with uFuzzy-backed fuzzy/typo-tolerant matching,
  and adds folder-name as a matched field; *Acting on a launcher result* notes
  `smart` results act via the existing `openUrl` branch; the result-row badge
  contract gains the `smart` label; a new *Launcher Space scope* requirement adds
  the configurable current-Space scope (`launcherScope` setting,
  `LauncherResult.spaceId`).

The `smart-folders` capability is **consumed read-only** (the provider reads
`AppState.smartFolders`) and gains **no** new requirement, so its spec is not
modified. The `settings`/`options` capabilities gain **one enum declaration**
(`launcherScope`) but **no new requirement** — the declarative settings engine
already renders it (auto-rendered `SegmentedControl`), so their specs are not
modified either.

## Impact

- **New file** — `apps/extension/src/launcher/shared/providers/smart-folders.ts`
  (`smartFoldersProvider`).
- **New helper** — `apps/extension/src/launcher/shared/folder-names.ts`
  (`buildFolderNameIndex`): maps each `SavedTabId` → enclosing `folder` node name,
  each smart `FolderId` → smart node name, and each smart `FolderId` → owning
  `SpaceId` (for the current-Space scope), derived from `pinnedBySpace`.
- **Modified contract** — `apps/extension/src/shared/launcher-contract.ts`:
  `ResultSource` adds `'smart'`; `BADGE_LABELS` adds `smart: 'smart'`;
  `LauncherResult` adds optional `folderName?: string`, `spaceId?: SpaceId`, and
  the cross-Space-marker fields `spaceName?`/`spaceColor?`.
- **Modified providers/engine** —
  `providers/saved-tabs.ts` (`savedTabsProvider` takes the folder-name index and
  sets `folderName`, plus `spaceId` for pinned tabs); `providers/smart-folders.ts`
  (sets `folderName` + `spaceId`); `scoring.ts` (uFuzzy-backed match strength,
  `SOURCE_WEIGHT` gains `smart`, matches `title`/`url`/`folderName`, plus the
  current-Space boost via a new `activeSpaceId?` param); `search-engine.ts`
  (`SearchSources` gains `smart`, precedence chain updated, uFuzzy batch wiring,
  `runSearch` forwards `activeSpaceId?`).
- **New setting** — `apps/extension/src/shared/settings.ts`: a `LauncherScope`
  type + a `launcherScope` enum declaration (`Search` group, default
  `prefer-current-space`); the options page auto-renders it (no Options code).
- **Modified handler** — `apps/extension/src/background/launcher-suggestions-handler.ts`
  wires the smart provider, builds the folder-name index from `pinnedBySpace`,
  reads `launcherScope` + `activeSpaceByWindow[windowId]`, applies the scope
  (filter for `current-space-only`, boost for `prefer-current-space`), and tags
  cross-Space results with the marker (`spaceName` + `spaceColor` via
  `colourToOklch`).
- **Composed primitives, no new ones** — `ui/ResultRow.svelte` and `ui/ResultList`
  render the `smart` rows and the cross-Space marker (a `.meta` cluster: the
  optional Space chip + the source badge); the badge rides the existing
  centralized `sourceBadgeLabel`. The `Alt+L` overlay's vanilla mirror
  (`launcher/overlay.css` / `overlay.ts`) gains the `smart` badge +
  `data-source="smart"` styling and the same `.meta`/`.space-chip` mirror (the
  standing component-library exception for the no-Svelte overlay). The marker's
  only new colour is the data-driven Space dot (the existing nine-Space palette via
  `colourToOklch`); no `src/ui` primitive is added or re-rolled.
- **Dependency** — adds `@leeoniya/ufuzzy` (service-worker / background bundle
  only; absent from the overlay content-script bundle, which the verify-time
  budget guard continues to enforce).
- **Docs updated in this change** — `docs/02-tech-stack.md` (uFuzzy stack
  amendment), `docs/04-capabilities.md` §5 (the launcher provider list, scoring
  model, de-dup precedence, and the current-Space scope) and §7 (the
  `launcherScope` setting in the `Search` group). **Untouched:**
  `docs/03-architecture.md` (no layer-DAG change), `docs/01-vision.md`,
  `05-roadmap.md`, `06-migration.md`, and the
  `smart-folders`/`storage-and-migrations` capability docs (no schema or
  persistence change — the consumed `smartFolders` slice is ephemeral, and the
  `launcherScope` setting degrades to its default via the per-field `.catch`, so
  no settings migration).
