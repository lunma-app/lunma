## Why

When you open five links from one article and then close the article, those five
tabs stay behind with nothing tying them together any more — the exact clutter the
Temporary list exists to prevent. This change lets a user opt into closing a tab's
whole lineage with it: close the article, the five tabs it spawned go too. One
gesture instead of six, and the list stays as small as the user's actual attention.

It ships **off by default**, because the lineage signal is deliberately lossy. An
edge is recorded only for a `link` transition with a tokenised opener, and
everything else fails open to a root (`tab-provenance`). The blast radius of a
single close is therefore not predictable from the tab strip: the same-looking
action closes five tabs one time and one the next. Wiring a destructive action to a
signal designed to under-report is only acceptable when the user asked for it,
can see the subtree (it is indented), and can undo it.

## What Changes

- A new `closeChildTabsWithParent` setting (toggle, default `false`, **Tabs**
  group). When on, closing a temporary tab also closes its provenance
  descendants.
- The cascade triggers on **any** close of a tracked temporary tab — the Lunma
  sidebar, the Chrome tab strip, or `Cmd+W` — because it is observed at
  `chrome.tabs.onRemoved` rather than at one command handler.
- **Nothing closes until the user says so.** The worker asks — naming the count and
  the tab they were opened from — and closes only on an affirmative answer.
  Dismissing is a refusal. If no surface is listening to ask, the cascade does not
  happen; being unable to ask is not permission to act.
- The confirmed descendants are archived as **one batch** (a single shared
  `archivedAt`) before removal, so they stay recoverable from the archived-tabs
  view afterwards. The batch is re-validated at confirm time against the tabs that
  still exist.
- The cascade is scoped: only descendants that are **temporary tabs in the same
  Space** are closed. Pinned descendants and descendants in other Spaces survive
  and re-parent as they already do.
- It never fires while a window or the browser is closing, and never re-enters
  itself as the descendants it is closing report their own removals.
- Settings declarations gain an optional `dependsOn`, so a toggle whose meaning
  depends on another setting renders disabled with a reason instead of adding a
  second hardcoded special case to `Options.svelte`.
- With `trackTabProvenance` off there is no lineage, so the setting degrades to a
  no-op and renders disabled.

**Not breaking.** With the setting off — the default, and the state every existing
user is in — behaviour is exactly what `add-tab-provenance` ships: closing a parent
re-parents its children to the nearest live ancestor and they survive, indented one
level shallower.

## Capabilities

### New Capabilities

- `tab-close-cascade`: closing a tab closes its provenance descendants — what
  counts as a descendant, which closes trigger it, the batch/undo contract, and the
  guards that keep a window close or a re-entrant removal from cascading.

### Modified Capabilities

- `settings`: adds the `closeChildTabsWithParent` toggle declaration, and the
  optional `dependsOn` field on a toggle declaration plus the disabled rendering it
  drives.

**Ordering dependency:** `tab-provenance` does not exist under `openspec/specs/`
yet — it is introduced by the in-flight `add-tab-provenance` change. This change
therefore archives **after** that one.

Both changes ADD distinct requirements to `settings` rather than modifying a shared
one, so their deltas do not collide. The `dependsOn` rendering rule is deliberately
its own requirement rather than a second modification of "Options page is rendered
from the settings declarations": that requirement governs how the page derives rows
from declarations, while this one governs when a row is interactive. Folding it in
would also mean re-stating a requirement `add-tab-provenance` is concurrently
modifying, which is exactly the delta collision the split avoids.

## Impact

**New public surface** (nothing outside this list may be added during
implementation without agreement):

- `Settings.closeChildTabsWithParent: boolean` and its `SETTINGS` declaration
  (`apps/extension/src/shared/settings.ts`).
- `BooleanSettingKey` and `ToggleSettingDeclaration.dependsOn?: BooleanSettingKey`
  (same file). The key set is narrowed to boolean-valued settings — "when the
  named setting is off" is meaningless for `density` or `customSearchUrl`, and the
  type should refuse them rather than the prose forbidding them.
- `CASCADE_CONFIRM` = `'lunma/cascade-confirm'` in `apps/extension/src/shared/bus.ts`
  — the worker→sidebar request carrying `{ windowId, spaceId, tabIds, title }`,
  modelled on the existing `TAB_DEDUP_FLASH` constant and its
  `chrome.runtime.sendMessage` broadcast from the same handler file.
- A `closeChildTabs` sidebar command (`{ windowId, spaceId, tabIds }`) — the
  answer, so the destructive work runs on the drain through the single-writer
  path rather than from the surface. Handled in
  `apps/extension/src/background/handlers/temp-tabs.ts` beside `clearTempTabs`,
  whose archive-batch shape it reuses.
- Five message keys in all nine `apps/extension/messages/*.json`:
  `options_label_closeChildTabsWithParent`,
  `options_desc_closeChildTabsWithParent`, `options_desc_requiresSetting`
  (parameterised by `{setting}` — the disabled-reason line), and
  `sidebar_cascadeConfirm` (the prompt's plural-aware count, mirroring
  `sidebar_clearedTabs`) and `sidebar_cascadeConfirmAction` (its action label),
  plus the two per-setting entries in
  `apps/extension/src/options/labels.ts`.
- `SegmentedControl.disabled?: boolean` — a control-level disabled prop on
  `apps/extension/src/ui/SegmentedControl.svelte`, and the matching catalog story
  variant in `apps/extension/catalog/stories/ui/SegmentedControl.stories.svelte`.
  The primitive today exposes disabled only PER OPTION, which dims the option
  labels but leaves the selection pill at full opacity — a half-disabled control.
  This is the first shipped use of that state anywhere in the app.
- `collectDescendantTabIds(liveTabsById, rootTabId, spaceTempTabIds)` in
  `apps/extension/src/shared/provenance.ts` — pure, no `chrome.*`.
- `apps/extension/src/background/close-cascade.ts` — `markCascading`,
  `isCascading`, `clearCascading`, and the test-only `resetCloseCascade`; the
  module-level re-entrancy registry, modelled on the existing
  `background/initial-load-tabs.ts` and `background/handlers/pending-duplicate-tabs.ts`
  registries, both of which export the same test-only reset.
- `HandlerContext.closeChildTabsWithParent(): boolean` — a cached synchronous
  mirror, and `Coordinator.setCloseChildTabsWithParent(value)` that pushes it,
  both mirroring the existing `provenanceEnabled()` pair.

**Modified code:** the `tabs.onRemoved` handler
(`background/handlers/chrome-tabs.ts`), the settings watcher and mirror seed
(`background/index.ts`), the toggle rendering (`options/Options.svelte`), and the
confirmation prompt (`sidebar/App.svelte`, which gains a listener for the request
and reuses its existing toast slot with a "Close" action).

**No storage change.** The setting lives in `chrome.storage.sync` under the
existing derived `Settings` schema, so there is no `AppState` version bump and no
migration. `provenanceByToken` is untouched.

**No new permission.** The cascade uses `chrome.tabs.remove`, already held.

**`docs/`:** none updated. This adds a setting and a behaviour behind it; it
changes no layer boundary, no dependency, and no release process, so
`docs/architecture.md` and `docs/tech-stack.md` are deliberately left untouched.

**UI primitives:** composes existing primitives — `SegmentedControl` (the Off | On
toggle every boolean setting renders through), `SettingText`, and the sidebar's
existing undo toast. It adds **no new** primitive, but it does **modify** one:
`SegmentedControl` gains a control-level `disabled` prop, because the per-option
flag it has today dims the labels and not the selection pill. Per the
component-library policy that modification ships with its catalog story updated in
the same change.

**Privacy/ToS:** unchanged. No new data is read, stored, or transmitted; the
`/privacy` disclosure written by `add-tab-provenance` already covers the lineage
this feature acts on.
