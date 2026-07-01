## Context

`state.spaces` uniqueness is enforced by name (spec `spaces-and-tabs` →
"Space names are unique"), split by origin: interactive `createSpace` /
`renameSpace` throw on a normalized-name collision; non-interactive mints
(fresh-install conversion, trash restore, migrations) auto-disambiguate via
`disambiguateSpaceName`; the Chrome-side rename mirror disambiguates rather
than throwing inside the drain; and the load-path self-heal
(`dedupePersistedState`, `apps/extension/src/shared/chrome/storage.ts`)
re-asserts uniqueness on every read by renaming a later duplicate to
`"{name} 2"`, `"{name} 3"`, … Within a single continuous storage lifetime
these four paths keep `state.spaces` free of *exact* name collisions.

Duplicates instead accumulate **across** extension lifecycle events that each
independently produce their own valid, uniquely-named `"Default"` Space:

- **Reinstall from a new path.** An unpacked extension's id is derived from
  its install path; a new path means a new id and a brand-new, empty
  `chrome.storage.local`. `ensureAtLeastOneSpace`
  (`apps/extension/src/background/default-space.ts`) mints a fresh `"Default"`
  against that empty state. `reconcileTabGroupsOnBoot`'s fresh-install
  conversion (`apps/extension/src/background/tab-group-adoption.ts`,
  `convertGroupsToSpaces`) is supposed to fold any Chrome group left over from
  a previous install (`chrome.tabGroups` is browser/profile-global and
  outlives an uninstall) whose title normalizes to `"Default"` into that new
  Space — but this fold only sees what a single `chrome.tabGroups.query({})`
  call returns at that boot tick. Under a session/window-restore race (a
  window not yet restored when the query fires), a stale group is invisible
  to that pass; it is left untracked, and `materializeActiveGroups` mints yet
  another native `"Default"` group for the just-converted Space instead of
  reusing the old one.
- **A false "fresh install" from a corrupted/salvaged read.** A separate
  defect (`gate-fresh-install-on-clean-read`, archived
  `2026-07-01-gate-fresh-install-on-clean-read`) let a corruption-quarantine
  (`outcome: 'recovered'`) or empty-salvage (`outcome: 'salvaged'`) boot read
  masquerade as a genuine first install, re-running the same conversion
  machinery over real user data — this was in fact the actual cause of the
  originally reported screenshot (five unnumbered "Default" pills); see
  Open Questions. Now that it's fixed, any *other* future boot path that
  reaches `state.spaces.length === 0` would still mint another `"Default"`
  the same way, which is why this change remains useful independent of that
  fix.

Both are producers of the same shape of defect: an extra, usually-empty
`"Default"` (or any other coincidentally-reused name) Space that today's
self-heal renames (`"Default 2"`) rather than removes — so it survives forever
and the pill count only grows with every future occurrence, regardless of
which lifecycle path triggered it this time.

## Goals / Non-Goals

**Goals:**
- Stop an empty duplicate-named Space from surviving indefinitely: collapse
  it away automatically wherever the existing uniqueness self-heal already
  runs (on read) and at the end of every boot's tab-group reconciliation, so
  a duplicate exposed only after the boot's one-shot Chrome query (the window
  restore race) is still caught before the reconciled state is broadcast.
- Never lose real user data: a collision group where two or more members hold
  actual tabs/pins keeps today's rename-and-keep-both behaviour untouched —
  no automatic content merge.
- Share one definition of "empty Space" between the existing
  `removeEmptySpace` (store) and the new read-path/boot-path cleanup, so the
  three call sites can never disagree about what counts as safe to drop.

**Non-Goals:**
- Content-merging two Spaces that both hold real tabs/pins into one. Flagged
  as future work in the proposal's "Out of scope" — needs its own design
  (what happens to conflicting per-window instances, pinned order, colour) and
  is not needed to kill the reported symptom (the observed duplicates are
  empty auto-Defaults, not user-filled workspaces).
- Opportunistically adopting an untracked native Chrome group that shares a
  title with an existing Space but was never converted into one. That would
  narrow the "an untracked user group is never adopted" invariant (a group a
  user created and happened to title the same is currently — deliberately —
  left alone) and needs explicit product sign-off, not a bundled side effect
  of a duplicate-Space cleanup.
- Any UI/visual change. The Space switcher (`SpaceSwitcher.svelte`) already
  renders "one chip per Space" correctly; this change only shrinks
  `state.spaces` itself. No new surface, primitive, or visual-language
  decision is introduced — the `Visual language` section is omitted per the
  design-instructions rule (only required for changes shipping a
  user-visible surface/feature component; this one changes backend state
  only).

## Decisions

**D1 — Factor "empty Space" into a shared pure predicate.**
`LunmaStore.removeEmptySpace` already defines "empty" inline: no
`pinnedBySpace[spaceId]` entries and no window's `spaceInstancesByWindow[..][
spaceId].tempTabIds`. Extract this into
`apps/extension/src/shared/space-empty.ts`:
`isSpaceEmpty(state: Pick<AppState, 'pinnedBySpace' | 'spaceInstancesByWindow'>, spaceId: SpaceId): boolean`.
`removeEmptySpace` calls it (no behaviour change — same two conditions, same
order). The read-path self-heal (`dedupePersistedState`, operating on a
plain loaded-from-disk state object) and the boot-time cleanup (operating on
`store.state`, same shape) both call the identical predicate, so "empty" can
never mean something different in three places.
*Alternative considered:* duplicate the two-condition check inline at each
call site. Rejected — three independent copies of a two-line invariant are
exactly the kind of drift this change exists to prevent elsewhere.

**D2 — A pure `groupDuplicateSpaceNames` helper decides keep/drop/rename,
call sites apply it.**
Add to `apps/extension/src/shared/space-names.ts`:
```
groupDuplicateSpaceNames(spaces: { id: SpaceId; name: string }[]): SpaceId[][]
```
Returns, in first-seen order, every normalized-name collision group (arrays
of length ≥ 2; Spaces with a unique name are omitted entirely). Pure,
synchronous, no `isSpaceEmpty` dependency (grouping needs only id + name) —
kept separate from the empty/non-empty partition so the same grouping logic
serves both the read path (drop-or-rename) and the boot path
(drop-only, via `removeEmptySpace`).

For each group, the **caller** (which alone knows how to check emptiness and
how to remove/rename in its own state shape) partitions members into empty vs
non-empty using `isSpaceEmpty` and resolves as:
- **Exactly one non-empty member:** keep it under its original name; drop
  every empty member.
- **Zero non-empty members (all empty):** keep the first (array order); drop
  the rest — no data exists to distinguish them.
- **Two or more non-empty members:** unchanged from today — first member
  keeps its name, every later member (empty or not) is disambiguated via
  `disambiguateSpaceName` and kept. Never auto-merges real content.
*Alternative considered:* have `groupDuplicateSpaceNames` itself take an
`isEmpty` callback and return a resolved plan. Rejected — the two call sites
mutate genuinely different shapes (a plain object being assembled in
`dedupePersistedState` vs. live `store` mutation via `removeEmptySpace`), so
forcing one shared "apply" function would need an abstraction over both
mutation styles for no real reuse; keeping resolution logic at the call site
alongside its own mutation primitives (splice-and-reindex-maps vs.
`store.removeEmptySpace`) is simpler and keeps `removeEmptySpace`'s existing
last-Space guard as the sole gate on the boot path.

**D3 — `dedupePersistedState` applies D2 directly on the plain state.**
For a "drop the empty members" resolution, delete the Space from
`state.spaces` and its `spaceInstancesByWindow` / `activeSpaceByWindow` /
`lastActivatedSpaceId` entries — the same three structures
`removeEmptySpace` already updates, applied here to a plain object instead of
the live store class (this path runs before the store exists, at raw state
load). `pinnedBySpace[spaceId]` is by definition empty (that's part of
`isSpaceEmpty`), so no pinned data is touched. The result is marked `changed`
(as today) so the healed envelope persists on first read, same as the
existing rename path.

**D4 — Boot-time cleanup runs once, at the very end of
`reconcileTabGroupsOnBoot`.**
After `ungroupRestoredFavorites`, iterate
`groupDuplicateSpaceNames(store.state.spaces)`; for each group, partition via
`isSpaceEmpty` and call `store.removeEmptySpace(id)` for every id the D2
resolution says to drop (rename-fallback groups are left alone — the boot
pass never renames, only the read path does, since a boot-time rename would
retitle a Space out from under an already-rendered sidebar with no user
action). `removeEmptySpace` already no-ops when the Space is non-empty
(defense in depth if grouping/partition ever disagree) or when it is the
last remaining Space. This step is a no-op whenever no duplicate exists —
cost is one grouping pass over a small array, every boot.
*Alternative considered:* only run this cleanup when `freshInstall` is true
(bundling it into `convertGroupsToSpaces`). Rejected — the window-restore
race this change targets is precisely a case where the *first* fresh-install
query missed a group; gating the fix on the same flag that gated the
original miss would not close the race, only move it. Running unconditionally
at the end of every boot's reconciliation catches a duplicate however it was
produced, on the very next boot after it appears.

## Risks / Trade-offs

- **[Risk] A Space the user intentionally left empty (created, never opened
  a tab in it yet) coincidentally shares a name with another empty Space and
  gets silently dropped.** → Mitigation: this requires the user to have
  *two* same-named empty Spaces, which they could only reach today by
  triggering the very bug this change fixes (interactive `createSpace`
  already throws on same-name creation) — so the only realistic empty+empty
  collision is exactly the reported defect shape. Accepted.
- **[Risk] `removeEmptySpace`'s refusal on "last remaining Space" means a
  collision group where every member is empty AND is also the *only* Space
  the user has (impossible — `groupDuplicateSpaceNames` only returns groups
  of ≥ 2, and the invariant elsewhere guarantees ≥ 1 Space always exists)
  cannot actually occur.** → No mitigation needed; noted for completeness.
- **[Trade-off] Non-empty collision groups are left exactly as today
  (renamed, not merged).** A user who already has two *content-holding*
  "Default"s after this ships still sees both, now permanently numbered
  apart. Accepted per Non-Goals — automatic content merge is materially
  riskier and out of scope; the user can manually consolidate via the
  existing UI.

## Migration Plan

No storage schema/migration change — `dedupePersistedState` already runs on
every read; this only changes its collision resolution, and the boot-time
step is new but additive (no-op absent duplicates). Ships in the normal
extension update channel. No rollback plan beyond reverting the change (an
empty-duplicate Space that this change drops cannot be un-dropped from a
user's live state without a full backup restore, but by construction it held
no data — see `data-backup` capability for restoring from a snapshot if ever
needed).

## Open Questions (resolved)

- **Archive order.** `gate-fresh-install-on-clean-read` was archived first
  (2026-07-01), ahead of this change, as recommended.
- **Screenshot reproducibility.** Task 6.1's automated repro (boot-timing
  race, sequential independent "fresh installs", and the load-path rename
  self-heal) could NOT reproduce an unnumbered duplicate against current
  `main` post-archive — every path either folds correctly or produces a
  numbered rename. This confirms the reported screenshot's five *unnumbered*
  "Default" pills predate `gate-fresh-install-on-clean-read` and were that
  bug, not a gap this change needs to close. This change now proceeds as
  pre-emptive cleanup of the numbered-rename gap (an empty "Default 2" is
  real but unverified against any live report), not as a fix for the
  screenshot itself — see the revised proposal `## Why`.
