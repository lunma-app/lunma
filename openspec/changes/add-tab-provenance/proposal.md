## Why

A Space with forty tabs is a flat wall of favicons, and the question users
actually ask of it is never "show me the structure" — it is *"why do I have this
tab?"* Today Lunma cannot answer that. Every tab looks equally rootless, so the
tab you opened three clicks deep off a search result sits beside the one you
deliberately pinned this morning, indistinguishable. This change gives live tabs
a **parent**: the temp-tab list indents children under the tab they were opened
from, and a tab row can say *"Opened from Hacker News."* Depth becomes legible
without the user doing any filing.

It ships **off by default**, behind a single `Tabs` setting that gates the
`webNavigation` permission, the event listeners, and the stored edges together —
off means nothing is collected, not "collected but hidden."

Explicitly **not** in scope: a node-link graph view. The exploration behind this
change (see `design.md`, Decision 6) concluded a graph canvas answers a question
nobody has, fights the vertical-panel visual language, and would be the stranded
-infrastructure shape the user-value policy bans. Provenance is rendered into the
sidebar that already exists.

## What Changes

- **New `tab-provenance` capability**: resolve a parent for each live tab from
  `chrome.webNavigation.onCommitted` (`transitionType` decides whether an edge is
  real; `openerTabId` supplies the candidate parent), persist the resolved edge,
  and expose it to the sidebar.
- **New setting `trackTabProvenance`** (toggle, `Tabs` group, default `off`).
  Enabling it requests the `webNavigation` permission on the user gesture;
  disabling it releases the permission and clears stored edges.
- **`webNavigation` added to `optional_permissions`** and to the
  `OptionalApiPermission` union in `src/shared/permissions.ts`. **This modifies a
  normative list** in the `runtime-permissions` spec, which currently enumerates
  `optional_permissions` as exactly `history` and `bookmarks`.
- **Sidebar temp-tab list renders hierarchy**: `TempTabs.svelte` projects a tree
  instead of a flat list; `TabRow.svelte` gains a `depth` prop.
- **Provenance is persisted** (`AppState` v19 + migration) — required because the
  MV3 service worker dies after ~30s idle, so ephemeral edges would evaporate
  continuously.
- **Two empirical spikes gate the change** (see `tasks.md` §1). Both are
  undocumented in Chrome and this repo's precedent is to settle them by
  experiment, not reasoning — that is how `openerTabId` was settled in
  `2026-07-02-fix-direct-url-tab-dedup`, where documentation-based reasoning had
  it exactly backwards. A bad answer to Spike 1 reshapes what this change can
  claim; a bad answer to Spike 2 may reduce it to session-scoped provenance.

### Not in scope (named follow-ups, not stranded)

- **History backfill** (`add-tab-provenance-backfill`): sweeping
  `chrome.history` + `getVisits()` to reconstruct edges retroactively, giving the
  graph depth at the moment the toggle is flipped and re-deriving lineage after a
  browser restart. Deferred because it is independently valuable and doubles this
  change's size. Without it, enabling the toggle starts every currently-open tab
  as a root and lineage accrues as the user browses — **honest but shallow**. No
  fabricated edges are used to paper over this (see `design.md`, Decision 5).
- **Graph view**: rejected, not deferred.

## Capabilities

### New Capabilities

- `tab-provenance`: resolving, persisting, and rendering the parent of a live
  tab — which tab/URL it was opened from, whether that edge is real, when it is
  a root, and how the lineage degrades on permission revocation, SW termination,
  and browser restart.

### Modified Capabilities

- `runtime-permissions`: the normative `optional_permissions` enumeration gains
  `webNavigation`; the `OptionalApiPermission` union gains `'webNavigation'`.
- `settings`: a new `trackTabProvenance` toggle declaration in the `Tabs` group,
  and the first setting whose value is **intent, not state** — it lives in
  `chrome.storage.sync` while the permission it gates is per-device and never
  syncs, so a synced `on` can land on a device with no grant. Requires a
  reconciliation requirement.
- `chrome-event-coordination`: a new event source (`chrome.webNavigation`) and
  event kind (`webNavigation.onCommitted`), with its listener registered
  synchronously at top level only while the permission is held, plus its
  `EventPolicy` coalescing entry.
- `spaces-and-tabs`: the temp-tab list acquires an ordering/nesting concept
  (children render under their parent) where it was previously a flat projection
  of `tempTabIds`.
- `storage-and-migrations`: `CURRENT_SCHEMA_VERSION` 18 → 19 for the persisted
  provenance slice, with its migration.

## Impact

**New public surface** (normative — anything not listed here is a deviation):

- `apps/extension/src/shared/provenance.ts` — `TabProvenance`,
  `ProvenanceEdge`, `resolveParent()`, `isRootTransition()`.
- `apps/extension/src/background/handlers/web-navigation.ts` — the
  `webNavigation.onCommitted` handler.
- `AppState.provenanceByTabId: { [tabId: number]: ProvenanceEdge }` — new
  persisted slice.
- `Settings.trackTabProvenance: boolean` + its `SETTINGS` declaration.
- `OptionalApiPermission` gains `'webNavigation'`.
- `TabRow.svelte` gains `depth?: number`.
- `LiveTab` gains `openerTabId?: number`.

**Modified**: `public/manifest.json` (`optional_permissions`),
`src/background/index.ts` (listener registration + permission-conditional wiring),
`src/background/coordinator.ts` (`EventPolicy` entry),
`src/shared/schemas.ts` (v19), `src/shared/migrations.ts`,
`src/sidebar/TempTabs.svelte`, `src/ui/TabRow.svelte`,
`src/options/labels.ts` (if a group intro changes).

**Docs updated in this change**: `docs/architecture.md` (the permission
enumeration at :223 — currently a closed list of seven; the SW event-source list;
the AppState slice inventory). **Left untouched**: `docs/tech-stack.md` (no stack
change — no new dependency).

**`src/ui/` primitives composed**: `TabRow` (modified — gains `depth`),
`SegmentedControl` (the existing toggle rendering, unchanged).
**New primitives**: none. `TabRow`'s catalog story
(`catalog/stories/ui/TabRow.stories.svelte`) MUST be updated for the new `depth`
prop in this change, per the component-library policy.

**Permissions**: `webNavigation` is a user-visible escalation ("Read your
browsing history" in the Chrome grant prompt). It is optional and gesture-bound,
never requested at install. This argues against the position established by
`2026-06-16-least-privilege-permissions`; `design.md` Decision 4 defends it.

**Risk**: two undocumented Chrome behaviours gate this (`tasks.md` §1). The
change should not proceed past §1 without those answers.
