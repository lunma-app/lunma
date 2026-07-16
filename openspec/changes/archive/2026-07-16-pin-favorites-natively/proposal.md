# Proposal: pin-favorites-natively

## Why

A global favorite ("fav app") keeps its live tab open permanently, but today that
tab occupies a full-width slot in Chrome's native tab strip — for users with
several favorites this wastes a large share of the strip on tabs they already
reach through Lunma's favicon row. Natively pinning a favorite's bound tab
(`chrome.tabs.update(tabId, { pinned: true })`) renders it as a small icon-only
tab, reclaiming that space, and gives favorites the "app-like, always there"
reading users expect from Arc-style favorites. Native pinning also structurally
guarantees the two properties the current invariant enforces by hand: a
natively-pinned tab can never be a member of a Chrome tab group (so no Space
switch can collapse it invisible) and always sits at the strip start (the park
that `moveTabToStripStart` exists for).

## What Changes

- Every path that today establishes the favorite ungroup invariant additionally
  natively pins the favorite's bound live tab: favoriting a live tab
  (`favoriteTab`), decoupling a pinned tab into a favorite (`favoriteSavedTab`),
  opening a dormant favorite (`openSavedTab`, including the `replaceTabId`
  open-in-place path), and the boot group-lifecycle reconciliation's favorite
  step.
- The single coordinator helper enforcing the invariant is renamed
  `ensureFavoriteUngrouped(tabId)` → `ensureFavoriteNativePinned(tabId)` and now
  performs ungroup + native pin. The explicit strip-start park
  (`moveTabToStripStart`) is removed — Chrome places pinned tabs at the strip
  start structurally — and the now-unused wrapper is deleted.
- Paths that end a tab's life as a favorite natively **unpin** it so it regains
  a normal-size tab: coupling a favorite into a Space (`pinSavedTab`, before the
  tab is grouped — Chrome refuses to group a pinned tab) and removing a favorite
  whose tab returns to Temporary (`unpinTab` on a `spaceId === null` record).
  `deleteSavedTab` closes the tab, so it needs no unpin.
- The boot favorite reconciliation step re-pins (and still un-groups) any
  favorite bound tab found unpinned/grouped, which also upgrades existing users'
  favorites without a data migration (no stored-state shape changes).
- New best-effort Chrome wrapper `setTabNativePinned(tabId, pinned)` in
  `background/tab-groups.ts`, mirroring `ungroupTabs`' swallow-and-log contract.

Vocabulary note: "natively pinned" (Chrome tab-strip pin) is used everywhere to
avoid collision with Lunma's existing "pinned" (a Space-coupled saved tab).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `lunma-bookmark-bindings`: the "A favorite's bound tab is ungrouped (global)"
  requirement becomes "A favorite's bound tab is natively pinned (and
  ungrouped)"; the couple/decouple transitions gain the native pin/unpin steps;
  `favoriteTab`, dormant-favorite activation, and the favorite-removal path
  (`unpinTab`) gain the pin/unpin post-conditions; the helper rename.
- `spaces-and-tabs`: coordinator group rules 1 (favorites intentionally
  ungrouped — now natively pinned, park requirement replaced by pin) and 2b
  (opened favorite routed to the renamed helper), and the boot reconciliation's
  favorite-ungroup step (now favorite pin-and-ungroup reconciliation).

## Impact

- **Code** (`apps/extension/src/background/` only; no UI surface changes, no
  store/schema changes):
  - `tab-groups.ts`: add `setTabNativePinned`; delete `moveTabToStripStart`.
  - `group-orchestrator.ts`: rename `ensureFavoriteUngrouped` →
    `ensureFavoriteNativePinned`; ungroup + pin instead of ungroup + park.
  - `handlers/favorites.ts`: call sites renamed; `pinSavedTab` natively unpins
    each bound tab before grouping.
  - `handlers/pinned-tabs.ts`: `openSavedTab` favorite call sites renamed;
    `unpinTab` natively unpins a favorite's bound tabs before restoring them to
    Temporary.
  - `tab-group-adoption.ts`: boot favorite step ensures ungrouped **and**
    natively pinned (drops its park call).
  - Tests updated in the same files' suites (`coordinator.favorites.test.ts`,
    `tab-group-adoption.test.ts`, `coordinator.test.ts` and helpers as needed).
- **New public names introduced**: `setTabNativePinned` (tab-groups wrapper),
  `ensureFavoriteNativePinned` (renamed orchestrator method). Removed:
  `moveTabToStripStart`, `ensureFavoriteUngrouped`.
- **Permissions/dependencies**: none — `chrome.tabs.update` is already used.
- **docs/**: no `docs/` file documents the favorite ungroup/park mechanics
  (checked `docs/architecture.md`); no docs updates needed. OpenSpec specs above
  are the artifact surface.
- **UI primitives**: none composed, none added (no user-visible surface ships;
  the visible effect is Chrome's own pinned-tab rendering).
