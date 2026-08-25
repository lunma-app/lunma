## Why

A Space that has been open a while accumulates a long, interleaved Temporary
list — three GitHub tabs, a Figma tab, two more GitHub tabs, a doc. Finding the
tab you want means scanning the whole list. **Group by site** collapses that scan
into one click: same-host tabs sit together, so the list reads as a handful of
site clusters instead of a flat run of rows.

It lands beside **Clear duplicates** in the Temporary divider's kebab menu — the
existing home for "tidy this list" actions — and is its non-destructive sibling:
Clear duplicates removes rows, Group by site only reorders them.

## What Changes

- Add a **Group by site** item to the Temporary divider's kebab menu
  (`apps/extension/src/sidebar/App.svelte`), directly after Clear duplicates.
- Add bus command `groupTempTabsBySite` (`{ windowId, spaceId? }`), handled in
  the coordinator: reorder the Space's `tempTabIds` so tabs sharing a hostname
  are contiguous.
- Clustering is **stable**: clusters appear in the order their host first appears
  in the current list, and tabs keep their relative order within a cluster. A tab
  whose URL has no parseable hostname clusters under the empty-string key like
  any other host. Grouping is therefore idempotent.
- The item renders **disabled** (not hidden) when grouping would change nothing —
  matching how Clear duplicates reflects duplicate-presence.
- A Space with no instance in the window is a silent no-op acked `'ok'`, matching
  `clearDuplicateTempTabs` and `store.reorderTemp` — no error ack.
- Undo: a transient "Grouped N tabs by site — Undo" toast in the existing toast
  slot, where **N is the count of the Space's live temporary tabs in that
  window** — the size of the reordered set. Undo dispatches the existing
  `reorderTemp` with the pre-group order the sidebar captured locally — **no new
  undo command**.
- Generalize the sidebar's single toast slot from
  `{ message, tabIds }` + a hard-wired `onUndoClear` to `{ message, onUndo }`, so
  Clear, Clear duplicates, and Group by site share one slot without a
  two-toasts-at-once state.
- **Also in scope (existing i18n defect):** `Toast`'s `actionLabel="Undo"` is
  currently a hard-coded English literal in `App.svelte` — a violation of the
  `i18n` capability's "UI message strings SHALL live in per-locale catalog
  files". Since this change rewrites that call site, it adds a `sidebar_undo`
  message key and uses it. Flagged rather than fixed silently.

No **BREAKING** change: no persisted shape changes, so no schema-version bump.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `spaces-and-tabs`: the Temporary divider's kebab menu gains a second item, and
  a new requirement specifies the Group-by-site action, its clustering rule, its
  disabled condition, and its undo.
- `typed-message-bus`: registers the `groupTempTabsBySite` command kind, its Zod
  payload schema, and its sidebar-origin allowlist entry.

The `i18n` capability is NOT modified: its requirements (catalog key-parity,
authored translations for every non-base locale, no un-localized user-facing
string) are generic and already cover the three new keys.

## Impact

**Code**

- `apps/extension/src/shared/bus.ts` — `SidebarCommand` union member, the
  `SIDEBAR_COMMAND_KINDS` list entry, the sidebar-origin allowlist entry, and
  `COMMAND_SCHEMAS.groupTempTabsBySite`.
- `apps/extension/src/background/handlers/temp-tabs.ts` — the
  `groupTempTabsBySite` handler; its kind added to the handler's union.
- `apps/extension/src/background/handlers/context.ts` — the
  `SidebarVariant<'groupTempTabsBySite'>` entry.
- `apps/extension/src/background/coordinator.ts` — the handler-table entry.
- `apps/extension/src/shared/store.svelte.ts` — new method
  `groupTempTabsBySite(windowId, spaceId)` returning `boolean` (whether the order
  changed). No new exported type.
- `apps/extension/src/sidebar/App.svelte` — the menu item, the
  `canGroupTempTabsBySite(space)` predicate, `onGroupTempBySite(spaceId)`, and
  the generalized toast state.
- `apps/extension/src/shared/cluster-by-host.ts` — **new file**: the pure
  clustering rule, `clusterIdsByHost(orderedIds, urlOf)`, called by both the
  coordinator handler and the sidebar's disabled-state predicate.
- `apps/extension/src/shared/label-for.ts` — unchanged; `hostOf` is reused as-is.

**New public symbols** (the complete list this change introduces)

- Bus command kind `groupTempTabsBySite` and its payload schema.
- `LunmaStore.groupTempTabsBySite(windowId: WindowId, spaceId: SpaceId): boolean`
  — returns whether it changed the order, so the handler knows whether to
  `markDirty`.
- `clusterIdsByHost(orderedIds: readonly TabId[], urlOf: (id: TabId) => string | undefined): TabId[]`
  in the new `apps/extension/src/shared/cluster-by-host.ts`. Named for the
  mechanism (hostname keying), not the user-facing action.
- Message keys `sidebar_tempGroupBySite`, `sidebar_groupedTabsBySite`,
  `sidebar_undo`.

**Tests**

- `apps/extension/src/shared/store.svelte.test.ts` — clustering rule, stability,
  idempotency, empty-host handling, missing-instance no-op.
- `apps/extension/src/background/coordinator.tab-groups.test.ts` — the command
  end-to-end through the coordinator, mirroring the `clearDuplicateTempTabs`
  cases.
- `apps/extension/src/sidebar/App.test.ts` — menu item present, disabled when
  grouping is a no-op, dispatches on select, toast + undo round-trip.
- `apps/extension/src/shared/bus.test.ts` — payload schema accept/reject.

**Docs**

- Updates: none. No `docs/` file enumerates sidebar menu items or bus command
  kinds; both are specified in `openspec/specs/`, which this change updates.
- Left untouched: `docs/architecture.md`, `docs/tech-stack.md`.

**UI primitives**

- Composes existing: `Menu` + `MenuItem` (`src/ui/Menu.svelte`, `menu-types.ts`)
  and `Toast` (`src/ui/Toast.svelte`). Both are used as-is.
- New primitives: none, and no `src/ui/*.svelte` file changes — so no catalog
  story is added or updated.

**Known interaction**

Undo routes through `reorderTemp`, the same path as drag-reorder. A separate,
still-open investigation suggests sidebar reorders can silently fail to commit
(`dispatch` swallows bus rejections, `shared/bus.ts:1159`). If that is confirmed,
Undo inherits the same failure mode. This change does not attempt that fix — it
is tracked separately so a reorder-reliability fix is not entangled with a
feature.
