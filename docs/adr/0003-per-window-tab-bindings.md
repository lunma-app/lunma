# 0003 — Per-window tab bindings (uniform)

- **Status:** Accepted
- **Date:** 2026-06-05

## Context

Lunma binds a saved tab to a live Chrome tab through a single, session-ephemeral
map:

```
tabBindings: { [savedTabId: SavedTabId]: TabId | null }
```

One saved tab maps to exactly one live tab id (`store.svelte.ts` `bindSavedTab`).
Bindings are not persisted across a clean session — they are rebuilt on restart
by URL match (`tab-bindings.ts` `runRestartRecovery`). Drift (`currentURL !==
originalURL`) is tracked per binding.

Two forces make the single-valued shape inadequate:

1. **The "same Space in multiple windows" promise is half-baked.** The same
   Space active in two windows should make each window a real place with its own
   live tabs. But a pinned tab shared across both windows has **one** binding —
   so clicking it in the second window focuses the live tab in the *first*
   window (a cross-window focus jump), or the second click silently overwrites
   the first window's binding. The data model can't express "this pinned tab is
   open as a different live tab in each window," which is what the two-window
   case actually is.

2. **The global favicon row requires it.** A favorite is shown in *every* window
   across *different* Spaces simultaneously. Clicking it in Window-1 (Space A)
   and Window-2 (Space B) must focus/open a **different** live tab in each. With
   `tabBindings[favId] = tabId` the second window clobbers the first. A global
   favorite is impossible to bind correctly without per-window slots.

Both are the same defect seen from two angles: bindings are window-agnostic, but
a saved tab's *liveness* is inherently per-window.

## Decision

- **D1 — `tabBindings` becomes per-window.** The map nests a window dimension:

  ```
  tabBindings: { [savedTabId: SavedTabId]: { [windowId: WindowId]: TabId } }
  ```

  A saved tab can be bound to a distinct live tab in each window that has opened
  it; an absent `windowId` key means "not bound in that window."

- **D2 — Uniform, not favorites-only.** The per-window shape applies to **all**
  saved tabs — pinned *and* favorites — not just favorites. This preserves the
  `lunma-bookmark-bindings` invariant that pinned and favicon-row entries *"differ
  only by which placement array references them; there SHALL NOT be separate
  binding logic per type."* One binding model, no per-type branches.

- **D3 — Drift is per-(saved tab, window).** A saved tab can read "home" in one
  window and "drifted" in another; each window's sidebar (already a per-window
  surface) renders its own window's drift state from its own slot.

- **D4 — Open/focus never jumps windows.** Activating a saved tab in window `W`
  focuses `W`'s bound tab; if `W` has no slot, open a live tab and bind `W`'s
  slot. A click in one window never moves focus to, or rebinds, another window's
  tab.

- **D5 — Restart recovery runs per-window.** Recovery URL-matches each window's
  restored tabs to rebind that window's slots independently, rather than picking a
  single tab per saved tab globally.

- **D6 — Store stays thin.** The nested map is still chrome-free synchronous
  state; all `chrome.tabs` I/O remains in the coordinator (ADR 0001 D-thin-store,
  ADR 0002 D5). Mutators gain a `windowId` argument; no new async surface in the
  store.

The concrete `tabBindings` shape change and its schema migration are a **data-shape
requirement** and will be written into the appropriate capability spec
(`storage-and-migrations` / `lunma-bookmark-bindings`) by the implementing
change's delta, per docs/adr/README.md ("data shape now, behavior later"). Because
bindings are session-ephemeral and rebuilt by URL on first activation, the
migration may simply reset `tabBindings` to `{}` rather than rewrapping existing
entries.

## Alternatives considered

- **Favorites-only per-window (keep pinned single-bound).** Smaller blast radius,
  pinned behavior untouched — but it stands up *two* binding models side by side
  with conditional paths at every binding read/write, directly violating the "no
  separate binding logic per type" spec, and it leaves the multi-window pinned
  focus-jump unfixed. Rejected.

- **Keep the single binding; accept the multi-window clobber.** Zero refactor,
  but the multi-window-Spaces opportunity stays unrealized and the global favicon
  row cannot bind correctly at all. Rejected.

- **Persist bindings across restart instead of rebuilding by URL.** Orthogonal to
  this decision and rejected elsewhere — session-scoped tab ids make persisted
  bindings stale on restart (ADR 0002 constraint 3); URL rebuild stays.

## Consequences

- **Direct user value, not just plumbing.** The same Space active in N windows
  finally gives each window its own live tabs. This delivers user-visible value
  on its own, and it also unblocks the global favicon row downstream.
- **Unblocks the global favicon row.** A favorite binds independently per window.
- **Refactor surface.** Every binding read/write gains a `windowId`; restart
  recovery, drift derivation, and their tests are reworked. A behavior change — a
  beneficial one — for users who run a Space in multiple windows.
- **Schema migration.** `tabBindings` nests by window (or resets to `{}`); a
  numbered `AppState` version bump + migration, specced by the implementing
  change.
- **Forecloses** window-agnostic binding assumptions and any per-type binding
  logic. After this, "a saved tab's live tab" is always qualified by a window.
