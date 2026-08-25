## Context

The sidebar's temp-tab list (`src/sidebar/TempTabs.svelte`) is a flat `$derived.by`
projection of `spaceInstancesByWindow[windowId][spaceId].tempTabIds` through
`liveTabsById`. There is no parent concept anywhere: neither `LiveTab` nor
`SpaceInstance` carries a relationship, and `TabRow.svelte` has no depth. The
pinned side (`pinnedBySpace`, a `PinNode` discriminated-union tree rendered by
`PinnedTabs.svelte`) already does hierarchy — that is the prior art for
rendering, not for deriving.

Two prior findings constrain everything below.

**`openerTabId` alone is a non-signal.** `2026-07-02-fix-direct-url-tab-dedup`
Decision 1 settled this empirically — real built extension, Playwright-driven
Chromium, a `chrome.tabs.onCreated` listener in the actual service worker, every
gesture fired for real including a raw CDP `Target.createTarget` with no opener
parameter. Result: **`openerTabId` is set to the currently-active tab for every
new tab landing in an existing window, regardless of gesture.** It was
`undefined` only for the first tab of a brand-new window. Indenting by
`openerTabId` would nest a Ctrl+T blank tab under whatever you happened to be
reading. That is not lineage; it is a record of what was focused.

**The SW is not a place to keep things.** `openspec/specs/chrome-event-coordination/spec.md:210`
— *"In-memory queue, not persisted across SW termination… Reconciliation on wake
runs via `runRestartRecovery` plus `chrome.tabs.query()`, not by replaying queued
events."* There is no keepalive anywhere in the repo (no alarms ping, no
offscreen document); `bootReady` re-reads `chrome.storage.local` and reconciles
against live Chrome on every SW activation, cold start and idle wake alike.

Chrome facts established by documentation/source research for this change
(citations in Decision 1 and Decision 3):

- `openerTabId` is **not** an `onCreated`-payload field. `ExtensionTabUtil::CreateTabObject`
  reads it from live tab state on every Tab object construction, including each
  `tabs.get()` / `tabs.query()` — *"only present if the opener tab still exists."*
- Cross-API ordering between `chrome.tabs.*` and `chrome.webNavigation.*` is
  **specified nowhere**. The docs disclaim it for webRequest↔webNavigation and
  are silent on tabs.
- Server redirect (301/302) → **one** main-frame `onCommitted` at the final URL,
  qualifier `server_redirect`. Client redirect (meta refresh / JS `location`) →
  **two** commits, the second qualified `client_redirect`.
- webNavigation emits `"start_page"` where the history API emits
  `"auto_toplevel"` — the same underlying `PAGE_TRANSITION_AUTO_TOPLEVEL`, renamed
  for backwards compatibility in `web_navigation_api_helpers.cc`.

## Goals / Non-Goals

**Goals:**

- Give each live tab a resolved parent that is *correct or absent* — never
  guessed. A wrong indent is worse than no indent, because users trust
  indentation.
- Survive SW termination without journaling, by deriving from sources Chrome
  itself keeps.
- Keep the whole feature — permission, listeners, stored edges — behind one
  toggle whose `off` state means *nothing collected*.
- Degrade honestly and visibly at every boundary: revoked permission, dead
  opener, browser restart.

**Non-Goals:**

- Not identifying *which external application* opened a link. Chromium has the
  flag (`PAGE_TRANSITION_FROM_API`, 0x08000000 — *"The transition originated from
  an external application"*) and `web_navigation_api_helpers.cc` never emits a
  `from_api` qualifier; only `client_redirect`, `server_redirect`, `forward_back`,
  `from_address_bar` cross the API boundary. The signal is stripped upstream of
  any extension. Not a gap to engineer around.
- Not a graph view (Decision 6).
- Not the history backfill (`add-tab-provenance-backfill`).
- Not cross-window or cross-Space lineage. Parent and child are in the same
  window in v1.

## Decisions

### Decision 1: `onCommitted` is the sole trigger; there is no `onCreated` → `onCommitted` join

**Chosen.** One handler on `chrome.webNavigation.onCommitted`, filtered to
`frameId === 0`. It resolves the parent inline and stores the resolution. There
is no pending-state map, no correlation window, no journal.

```
  onCommitted(tabId, url, transitionType, frameId === 0)
        │
        ├─ isRootTransition(transitionType)
        │     typed | generated | auto_bookmark | keyword |
        │     keyword_generated | start_page | reload
        │        └──▶ ROOT. parent = null. done.
        │
        ├─ qualifiers includes 'client_redirect'
        │        └──▶ NOT a user edge. inherit the current tab's parent. done.
        │
        ├─ liveTabsById[tabId] already has a committed url?
        │        └──▶ YES: in-tab edge. parent = that url.
        │
        └──▶ NO (first commit): cross-tab edge.
             parent = current url of liveTabsById[openerTabId]
```

**Why not the join.** The obvious design — remember `openerTabId` at
`onCreated`, correlate at `onCommitted` — requires module-scope pending state
across two events. The repo already has two such structures
(`initial-load-tabs.ts`'s `midInitialLoad` Set, `pending-duplicate-tabs.ts`'s
`pending` array with a 5s TTL), both labelled "NOT persisted," both surviving on
the argument that their windows are sub-second and bracketed by events that keep
the SW alive. That argument does not transfer, for one reason: **their failure
mode is fail-open, ours would be fail-wrong.** Losing `midInitialLoad` degrades
to "no redirect dedup." Losing a provenance pending-map degrades to "this tab's
parent is whatever was focused" — a confident lie rendered as an indent. The
no-join version has no state to lose.

It also sidesteps the undocumented ordering: since the handler pulls the opener
from state (or Chrome) rather than remembering it, it does not care whether
`onCreated` won the race.

**Rejected: journal pending births to `chrome.storage.local`.** Correct, but pays
a write on every tab creation to solve a problem Decision 2 shows does not exist.

### Decision 2: `openerTabId` decay is benign — resolve eagerly, never re-read

`openerTabId` vanishes when the opener tab closes (docs: *"only present if the
opener tab still exists"*; source: `GetOpenerForTab()` returns null and the field
is omitted). So it is a **decaying** signal and "look it up whenever we need it"
is wrong. We resolve at first commit and persist the *resolution* (a parent URL),
never the `openerTabId`.

The decay window turns out not to matter, because of a symmetry:

```
  Tab born WITH a url            Tab born blank (Ctrl+T)
  (link, middle-click,            │
   external handoff)              │  user types minutes later
        │  commits in ms          │  SW may die in the gap
        │  opener still alive     ▼
        ▼                      transitionType: 'typed'
   resolve NOW ✓                   └──▶ ROOT — opener irrelevant ✓
```

The only window in which the opener can decay before we read it is the window in
which we do not need it. A tab that sits uncommitted for 30+ seconds is a blank
tab, and a blank tab's eventual commit is a root transition.

Residual case: a tab born with a URL that hangs past SW termination *and* whose
opener closes meanwhile. Resolves to unknown parent — **fail-open**, renders as a
root. Accepted.

`LiveTab` gains `openerTabId?: number` purely as a same-turn read of what
`chrome.tabs.query({})` already returns during `runRestartRecovery` — it is a
mirror field, not a stored fact, and it is stripped on persist along with the
rest of `liveTabsById`.

### Decision 3: filter `client_redirect`; let `server_redirect` through

A server redirect commits **once**, at the destination, so `shortlink → dest`
never appears as two nodes — nothing to filter. A client redirect commits
**twice**, and the second commit is a `link`-ish navigation the user never made;
unfiltered it fabricates a `shortlink → destination` edge and renders as a fake
indent.

The repo already cares about exactly this shape: `chrome-tabs.ts`'s
`markInitialLoad` comment cites *"a corporate mail/security link-rewriter"* as
its motivating case. A rewriter chain must resolve to one node at the real
destination, not a lineage of hops.

On a `client_redirect` commit, the tab **inherits its existing parent** rather
than parenting to its own pre-redirect URL.

### Decision 4: `webNavigation` goes in `optional_permissions`, against the standing least-privilege position

`openspec/specs/runtime-permissions/spec.md` enumerates `optional_permissions` as
exactly `history` and `bookmarks`, and `docs/architecture.md:223` lists the
required permissions as a closed set of seven. `2026-06-16-least-privilege-permissions`
established that surface as deliberately defended. This change argues against it,
so the argument is on the record:

- The feature is **impossible** without it. `transitionType` is the only thing
  separating a real edge from `openerTabId`'s noise, and it exists nowhere else
  in the extension API surface. Without it there is no honest hierarchy — only
  the confidently-wrong one the empirical test already ruled out.
- It is **optional and gesture-bound**, never at install. The install prompt is
  unchanged. A user who never flips the toggle never sees the grant.
- `off` is a real off: no permission held, no listener registered, no edges
  stored.
- The machinery already exists — `src/shared/permissions.ts` exposes
  `hasApiPermission` / `requestApiPermission` / `onPermissionsChange` over
  `OptionalApiPermission`. This adds one union member, not a pattern.

**Rejected: derive provenance from `chrome.history` only** (already an optional
permission, no new grant). `history` has no tab id — ever. It yields
`url → url` edges with no way to say which tab, window, or Space, which is the
axis a vertical-workspace product exists to render. It is the right source for
the *backfill* follow-up and the wrong one for live lineage.

**Rejected: content-script `document.referrer`** (no new permission; the
`<all_urls>` content scripts already exist). Empty under `noreferrer`,
cross-origin downgrades, and address-bar navigation. A provenance feature that
silently loses edges on the privacy-conscious half of the web is worse than none.

### Decision 5: on enable, existing tabs become roots — no seeded edges

Flipping the toggle starts collection *now*. Tabs already open have no
`transitionType` on record (it happened before the listener existed), so they are
roots, and lineage accrues as the user browses.

The tempting alternative — seed one level from `chrome.tabs.query({})`'s
`openerTabId` so the tree looks populated immediately — is **rejected outright**.
That is precisely the non-signal the empirical test disproved; it would fill the
sidebar with plausible, wrong indents at the exact moment the user is deciding
whether to trust the feature. Shallow and honest beats deep and fabricated.

This is the cost of shipping without the backfill, and it is why
`add-tab-provenance-backfill` is named in the proposal rather than hypothetical:
`chrome.history` + `getVisits()` can reconstruct real historical edges, so the
"empty on enable" objection has a real answer — later, with real data.

### Decision 6: no graph view

A node-link canvas answers *"show me the structure of everything."* Nobody has
that question. They have "why do I have this tab," "I closed the tab I found this
from," and "which of these 40 are roots" — all situated, all answered by the
sidebar that already exists, none needing a canvas the user must navigate to and
interpret. A graph surface would also be a large, dense artifact fighting the
frosted-glass vertical panel, and building the collection layer to feed one
speculative screen is the stranded-infrastructure shape the user-value policy
bans. If a graph is ever wanted, it is a marketing asset for `apps/site`, not a
product surface.

### Decision 7: the setting is intent; the permission is capability; boot reconciles

`Settings` persists to `chrome.storage.sync` (`src/shared/settings.ts`, key
`lunma.settings`). Permissions are per-device and never sync. So:

```
   Laptop                          Desktop
   ──────                          ───────
   toggle ON                       (sync arrives)
   permission granted   ──sync──▶  setting: ON
   collecting ✓                    permission: NOT granted
                                   collecting: nothing
                                   UI must NOT claim "on"
```

`trackTabProvenance` is therefore the first setting that is **not** self-describing.
Effective state is `setting && hasApiPermission('webNavigation')`.
`chrome.permissions.request()` requires a user gesture, so this **cannot** be
silently repaired at boot — it must render a distinct "enabled, needs permission
on this device" state with a click to grant. `onPermissionsChange` handles
mid-session revocation via the browser's own UI.

### Decision 8: persisted slice + v18, keyed by tabId

`provenanceByTabId: { [tabId: number]: ProvenanceEdge }` persists to
`chrome.storage.local` with the rest of `AppState`, bumping
`CURRENT_SCHEMA_VERSION` 17 → 18.

Persistence is not optional: the SW dies after ~30s idle, so an ephemeral slice
(e.g. a field on `liveTabsById`, which is stripped on persist) would lose lineage
continuously — many times an hour.

Keying by `tabId` means provenance is **browser-session scoped**: Chrome tab ids
do not survive a browser restart, so restart resets the forest to roots (pending
Spike 2 — if `openerTabId` survives session restore, a boot pass could recover
one level; if not, this is a hard limit and the backfill is its answer).
Migration is the standard shape: v18 adds the slice, defaulting to `{}`.

Eviction rides `tabs.onRemoved` (drop the tab's edge, reparent its children to
its parent — see Decision 9). Retention is not a setting; the slice is bounded by
live tabs.

### Decision 9: orphan children reparent to the grandparent

Closing a parent must not orphan its children into fake roots (they *do* have
lineage) nor delete them. On `tabs.onRemoved`, each child's parent pointer is
rewritten to the removed tab's parent — the tree shortens, nothing lies. This is
a correctness decision, not a preference, and is deliberately **not** a setting.

### Decision 10: one setting, not a settings group

`trackTabProvenance` only. A privacy/permission boundary genuinely belongs to the
user. Indent depth cap (Decision: cap at 3, below), orphan behaviour (Decision 9),
backfill-on-enable (Decision 5), and whether to show the "Opened from" meta are
all **decisions**, not knobs. If this feature grows a `Provenance` settings group
with six toggles, it means we failed to decide what it should do.

## Visual language

**Hierarchy.** Children indent by `--space-3` (12px) per level against the
sidebar's ~240–280px panel, capped at **depth 3**. Past the cap, deeper tabs
render at depth 3 — the tree stops deepening rather than running off the panel
edge. Arc's Spaces indent nested tabs the same way and hit the same wall; the cap
is the deliberate improvement over letting a redirect chain shove titles into a
sliver. Indentation is `padding-inline-start` on the row, not a margin, so the
whole row stays a hit target at every depth.

**The lineage rail.** A 1px vertical rule at `--color-border-subtle` runs from a
parent's row down through its children, terminating at the last child — the
standard tree affordance, and enough on its own that indentation does not need to
be large. At `vivid` it takes a low-opacity tint of the active Space's hue
(`--color-space-hue` @ 20%) so lineage reads as part of the Space's identity, not
as chrome. At `subtle` it stays neutral. It is decorative: `aria-hidden`, with
depth exposed to assistive tech via `aria-level` on the row (see below), never
via the rule.

**Motion.** A newly-parented tab settles into its indent with a 180ms
`--ease-out` transform on `padding-inline-start` — inside the 150–250ms band, at
the fast end because it is a settle, not an entrance. Reparenting on parent-close
(Decision 9) animates the same way, 200ms, so the tree visibly *shortens* rather
than teleporting — the user sees causality. Both are suppressed to 0ms under
`prefers-reduced-motion: reduce`, which for this feature is not a downgrade: the
indent is a static fact and reads identically without the tween.

**The "Opened from" meta.** Rides `TabRow`'s existing `meta` slot — the same slot
`drifted` already uses, so no new row anatomy. Type is `--font-size-xs` /
`--color-text-muted`, one line, ellipsised: *"from Hacker News."* Hostname only,
never the full URL — a title is noise at that size and a URL is a privacy
surface. It appears on hover/focus of the row, not persistently; at rest the
indent carries the information and the sidebar stays calm.

**Interaction feedback.** Hover, active, focus, and press states are `TabRow`'s
existing ones, unchanged — the `depth` prop must not fork them. The focus ring is
the token geometry, and it must not be clipped by the indent's overflow (a real
risk with `padding-inline-start` on a rounded row — the catalog story must cover
focus at depth 3).

**Degraded permission state.** The "enabled, needs permission on this device"
case (Decision 7) renders in the options page inline under the toggle, as a
`Button` with the calm inline-grant treatment `runtime-permissions` already
establishes for connector hosts. Not a banner, not a modal, not a colour alarm —
it is an unfinished setup, not an error.

**A11y.** Rows carry `aria-level` matching visual depth (capped at 3, matching
the render — assistive tech must not be told a depth the sight-reader cannot
see). The tree gets `role="tree"` / `role="treeitem"` only if `TempTabs` renders a
true single-root-per-branch structure; if the projection stays a flat list with
visual nesting, `aria-level` on listitems is the honest markup and `role="tree"`
would be a lie. Resolve during implementation against the actual projection —
whichever ships, contrast holds at AA at every Colour intensity, and the lineage
rail is never the sole carrier of meaning.

**Catalog.** `catalog/stories/ui/TabRow.stories.svelte` gains depth 0–3 states
including the cap boundary, the lineage rail, the `meta` line, and focus-at-depth.

## Risks / Trade-offs

- **[Spike 1 fails: external-app opens arrive as `link` with a live `openerTabId`]**
  → Then an external handoff is indistinguishable from an in-page link click and
  will parent to whatever was focused — the exact fail-wrong this design exists to
  avoid. Mitigation: if Spike 1 shows external opens are not separable, the
  cross-tab branch of Decision 1 must treat *first commits it cannot positively
  attribute* as roots. That shrinks the feature (fewer edges) but keeps it honest.
  This is why §1 gates: the answer changes the resolution rule, not just a
  constant.
- **[Spike 2 fails: `openerTabId` does not survive session restore]** → Provenance
  resets to a forest of roots on every browser restart. Mitigation: none within
  this change; it is the backfill's job. Must be stated in the spec as a known
  limit, not discovered by users.
- **[`webNavigation` grant prompt reads "Read your browsing history"]** → Users
  may decline at the toggle. Mitigation: none available — the string is Chrome's.
  The options copy must set expectations *before* the prompt so the grant is not a
  surprise; a declined grant must leave the toggle visibly off, not stuck on.
- **[`onCommitted` fires on every navigation in every tab]** → Volume through the
  serialized coordinator queue (`QUEUE_CAP = 1000`). Mitigation: the handler is
  pure and synchronous against in-memory state, and the `EventPolicy` entry
  coalesces by `tabId`, matching `tabs.onUpdated`'s existing treatment.
- **[Cross-API ordering is unspecified — `onCommitted` may precede `onCreated`]**
  → `liveTabsById[tabId]` may not exist when the handler runs. Mitigation:
  Decision 1's handler treats a missing entry as "first commit," which is the
  correct branch anyway. The disorder is benign by construction, not by luck.
- **[`start_page` / `auto_toplevel` naming split]** → Not live in this change
  (webNavigation only, one name), but it becomes a real normalization bug the
  moment the backfill lands and history-sourced edges join webNavigation-sourced
  ones. `isRootTransition()` MUST accept both spellings from day one so the
  follow-up does not have to revisit the predicate.
- **[Trusting an indent]** → The whole design's premise is that a wrong parent is
  worse than no parent, because indentation carries authority. Every "fail-open"
  above is that premise applied. If in review we find ourselves arguing for a
  plausible-but-unverified edge, that is the design failing, not the constraint.

## Migration Plan

v17 → v18 adds `provenanceByTabId`, defaulting to `{}`. No data reshaping; the
slice is new and empty. Downgrade is detectable via the existing version gate
(newer-than-current quarantines rather than Zod-rejecting).

Rollback is clean: the feature is off by default, and `off` releases the
permission and clears the slice. A user who never enabled it is byte-identical to
pre-change except for the `provenanceByTabId: {}` key and the schema version.

## Open Questions

1. **Spike 1** — what `transitionType` / `transitionQualifiers` does an
   external-app open actually produce? Undocumented; `from_api` is stripped.
   Warm-start vs cold-start may differ; platform may differ. **Gates the
   resolution rule.**
2. **Spike 2** — does `openerTabId` survive browser session restore? Docs silent.
   **Gates whether provenance is session-scoped or durable.**
3. `role="tree"` vs `aria-level`-on-listitem — depends on whether `TempTabs`'
   projection becomes a true tree or stays flat-with-visual-nesting. Resolve in
   implementation; both are covered by the a11y note above.
4. Does the `meta` slot on `TabRow` already have a consumer conflict with
   `drifted`? If a drifted pinned tab could also carry provenance, the slot needs
   a precedence rule. Check during implementation.
