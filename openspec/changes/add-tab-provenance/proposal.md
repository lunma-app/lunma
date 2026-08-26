## Why

A Space with forty tabs is a flat wall of favicons, and the question people
actually ask of it is not *"what is in here?"* but ***"why do I have this
tab?"*** Provenance answers it: the Temporary list indents a tab under the tab it
was opened from, so the one you reached three clicks deep off a search result
reads differently from the one you deliberately opened this morning. Depth
becomes legible without anyone filing anything.

The lineage **survives a browser restart**, which is what makes it worth its
cost. A tab's identity is carried by a random token in the page's own
`sessionStorage`, so a restored tab reports who it is and the tree comes back
exactly — no URL matching, no ordering heuristics, no reconstruction. See
[ADR 0005](../../../docs/adr/0005-tab-provenance.md) for why that is the only
mechanism that works and what it costs.

It ships **off by default**, behind one `Tabs` setting that gates the
`webNavigation` permission, the listeners, the stored edges, and the page tokens
together. Off means nothing is collected and nothing is written — not "collected
but hidden".

## What Changes

- **New `tab-provenance` capability.** Resolve a parent from
  `chrome.webNavigation.onCommitted` (`transitionType` decides whether an edge is
  real; `openerTabId` supplies the candidate), key it by page token, persist it,
  and expose it to the sidebar.
- **Token identity.** A **third content script**, `content/tab-token.ts`, stamps a
  random token into the page's `sessionStorage` and reports it to the service
  worker. It stays **dormant until the SW pushes to it**, mirroring
  `content/tab-boundary.ts` — so a user who never enables provenance has *zero*
  `sessionStorage` interaction, not even a read.
- **New setting `trackTabProvenance`** (toggle, `Tabs` group, default `false`).
  Enabling requests `webNavigation` inside the user gesture; a declined grant
  leaves the toggle visibly off.
- **`webNavigation` added to `optional_permissions`** and to
  `OptionalApiPermission`. **This modifies a normative list** in
  `runtime-permissions`, which today enumerates exactly `history` and `bookmarks`.
- **Sidebar renders hierarchy.** `TempTabs.svelte` projects a tree instead of a
  flat list; `TabRow.svelte` gains a `depth` prop.
- **Provenance is persisted** (`AppState` v19 + migration) — the MV3 worker dies
  after ~30s idle, so an ephemeral slice would evaporate many times an hour.
- **Turning it off converges to actually off** (see below).
- **Privacy disclosure**, in this change: the `/privacy` copy and the
  `marketing-site` requirement that governs it, plus the options copy beside the
  toggle.

### What "off" means

Off unwinds four things, and only three are ours to reach:

1. Stop handling commits. The `webNavigation` grant is **not** revoked —
   `runtime-permissions` holds that revocation is observed, never initiated by
   Lunma, and this change does not relax that. An unused grant is inert.
2. Clear the persisted edge slice. Immediate.
3. Push a token clear to every tab whose content script is reachable. Immediate.
4. Set a **cleanup-pending** flag: while set, the SW pushes a clear to each tab as
   it loads (via `tabs.onUpdated`), so tabs that were unloaded at step 3 converge
   as they are next used.

The flag is not cleared by a sweep that finds nothing among loaded tabs — step 3
already cleared those, so such a sweep is vacuous. It clears on a boot where
`chrome.storage.session` holds no session marker (the `session` area is wiped when
the browser closes, so this is a new browser session) AND `chrome.tabs.query`
reports no `http(s)` tab, meaning no page can still be holding one. Re-enabling
the setting also clears it, so the sweep cannot erase tokens as they are written.

Two limits are accepted and disclosed rather than hidden: **uninstall cannot clean
pages** (MV3 has no reliable uninstall hook), and a tab never loaded again is never
reached. Both are bounded by `sessionStorage` not outliving the browsing session.

### Not in scope

- **History backfill.** Impossible, not deferred: `getVisits()` records no
  referrer for any new-tab open (ADR 0005).
- **A graph view.** Rejected on its merits, not deferred.
- **Cold-start external-open attribution.** Unmeasured; a cold-start handoff is
  treated like any unattributable first commit — a root.

## Capabilities

### New Capabilities

- `tab-provenance`: resolving, persisting and rendering a live tab's parent —
  which tab it was opened from, whether that edge is real, when it is a root, how
  token identity is minted and reported, and how lineage degrades on permission
  revocation, SW termination, browser restart and toggle-off.

### Modified Capabilities

- `runtime-permissions`: **two** normative enumerations change — the manifest's
  `optional_permissions`, and the foundation module's
  `hasApiPermission`/`requestApiPermission` name union. The same requirement's
  content-script count also changes (a third script carries the token). The
  module's "no programmatic removal" rule is **retained**: turning provenance off
  does not revoke the grant.
- `settings`: a `trackTabProvenance` toggle in the `Tabs` group — and the first
  setting whose value is **intent, not state**, since it lives in
  `chrome.storage.sync` while the permission it gates is per-device and never
  syncs. A synced `on` can land on a device with no grant, so it needs a
  reconciliation requirement.
- `chrome-event-coordination`: a new event source (`chrome.webNavigation`) and
  kind (`webNavigation.onCommitted`), registered synchronously at top level only
  while the permission is held, plus its `EventPolicy` coalescing entry.
- `spaces-and-tabs`: the Temporary list acquires nesting where it was a flat
  projection of `tempTabIds`.
- `storage-and-migrations`: `CURRENT_SCHEMA_VERSION` 18 → 19 for the provenance
  slice, with its migration.
- `marketing-site`: the `/privacy` requirement enumerates exactly what the copy
  must say. Writing a token does not falsify its "never page content" clause —
  writing is not reading, and that clause stays verbatim — but the enumeration has
  no room for a marker Lunma leaves in visited pages, so the requirement, not
  merely the page, must gain it.

## Impact

**New public surface** (normative — anything not listed here is a deviation):

- `apps/extension/src/shared/provenance.ts` — `ProvenanceEdge`
  (`{ parentToken: string; recordedAt: number }`), `resolveParentTabId()` — the service
  worker resolves the EDGE only; depth is layout and belongs to the surface. This
  module stays free of `chrome.*` imports so `content/tab-token.ts` can import
  `TAB_TOKEN_KEY` from it within a content script's size budget —
  `isRootTransition()`, `PROVENANCE_EDGE_CAP` (2000), `PROVENANCE_MAX_DEPTH` (5),
  and `TAB_TOKEN_KEY` (`'lunma.tabToken'`) — the `sessionStorage` key, named here
  because it is the most user-visible identifier this change ships.
- `effectiveProvenanceState()` lives in `shared/provenance.ts`, NOT in
  `shared/permissions.ts` — that module is specified as carrying no policy. No
  removal export is added anywhere; the grant is never revoked by Lunma.
- `apps/extension/src/content/tab-token.ts` — the dormant token stamper/reporter.
- `apps/extension/src/background/handlers/web-navigation.ts` — the
  `webNavigation.onCommitted` handler.
- `AppState.provenanceByToken: { [token: string]: ProvenanceEdge }` — new
  persisted slice.
- `AppState.provenanceCleanupPending: boolean` — drives the converge-on-load sweep.
- `AppStateV19Schema` + the `AppStateV19` type in `shared/schemas.ts`.
- The `webNavigation.onCommitted` `PendingEvent` kind and its `EventPolicy` entry.
- Store mutators `recordProvenanceEdge()`, `pruneProvenanceEdges()`,
  `setProvenanceCleanupPending()`, and `setLiveTabToken()`.
- `Settings.trackTabProvenance: boolean` + its `SETTINGS` declaration, and
  `effectiveProvenanceState()` in `shared/settings.ts`.
- `OptionalApiPermission` gains `'webNavigation'`.
- `TabRow.svelte` gains `depth?: number`.
- `LiveTab` and `LiveTabSchema` gain `openerTabId?: TabId` (captured at CREATE,
  because it decays), `provenanceToken?: string` and `provenanceParentTabId?: TabId`. Both must be DECLARED on the schema:
  `LiveTabSchema` is a `z.strictObject` parsed on every broadcast, so an
  undeclared field rejects the whole broadcast.
- `AppStateV19Schema` + the `AppStateV19` type; both new slices carry Zod
  `.default(...)` so a same-version backup import still validates.
- Messages `lunma/provenance-sync` (`{ token }`, SW→script, a candidate),
  `lunma/provenance-token` (`{ token }`, script→SW, the token in effect) and
  `lunma/provenance-clear` (`{}`), declared in `shared/messages.ts` alongside the
  existing `lunma/boundary-*` pair — content-script messages already live there.
- `setLiveTabParent()` — the store mutator writing `provenanceParentTabId`.
- `ctx.provenanceEnabled(): boolean` — the coordinator's cached synchronous
  settings mirror, matching `ctx.dedupNewTabNavigations()`.
- `PROVENANCE_SESSION_MARKER_KEY` (`'lunma.provenanceSession'`) — the
  `chrome.storage.session` key whose absence marks a new browser session.
- Message keys `options_label_trackTabProvenance`,
  `options_desc_trackTabProvenance`, and the `Tabs` group-intro key carrying the
  remaining disclosure.

**Modified**: `public/manifest.json` (`optional_permissions`, third content
script), `src/background/index.ts`, `src/background/coordinator.ts`,
`src/shared/schemas.ts`, `src/shared/migrations.ts`, `src/shared/types.ts`,
`src/shared/store.svelte.ts`, `src/shared/permissions.ts`, `src/shared/settings.ts`,
`src/shared/chrome/storage.ts`, `src/shared/messages.ts`, `src/shared/backup.ts`,
`src/options/Options.svelte`, `src/options/labels.ts`,
`src/options/ResultSourcesCard.svelte` (narrowed to `OptionalResultSource`: it is
about launcher result sources, so widening the permission union must not force an
unrelated key on it), `src/sidebar/TempTabs.svelte`, `src/ui/TabRow.svelte`,
`src/sidebar/TempTabs.svelte`, `src/ui/TabRow.svelte`, `src/options/labels.ts`,
`apps/site/src/routes/privacy/+page.svelte`, all nine
`apps/extension/messages/*.json`.

**Docs updated in this change**:

- `docs/adr/0005-tab-provenance.md` — it currently states provenance is *not
  implemented*. That becomes false; the sentence goes.
- `docs/architecture.md` — the permission enumeration, the SW event-source list,
  the `AppState` slice inventory.
- **Left untouched**: `docs/tech-stack.md` (no stack change, no new dependency).

**`src/ui/` primitives**: composes `TabRow` (modified — gains `depth`) and the
existing `SegmentedControl` toggle rendering. **New primitives: none.** Per the
component-library policy, `catalog/stories/ui/TabRow.stories.svelte` MUST be
updated for the new `depth` prop in this change.

**Permissions and disclosure**: `webNavigation` is a user-visible escalation
("Read your browsing history"). It is optional and gesture-bound, never requested
at install. The page token is the first always-present, page-readable trace Lunma
leaves — it grants a site no new tracking ability, since any page can already
write its own per-tab `sessionStorage` id, so the exposure is specifically
extension detection. Both are disclosed in the options copy beside the toggle and
in `/privacy`.

**Release task (outside this repo)**: the Chrome Web Store listing needs a
`webNavigation` permission justification. The data-usage declaration should not
change — nothing is collected or transmitted — but that must be **confirmed, not
assumed**, since it is a signed declaration.
