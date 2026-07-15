# Design: pin-favorites-natively

## Context

A global favorite (`savedTabs[id].spaceId === null`, placed in `faviconRow`)
keeps a bound live tab per window. The current invariant — "a favorite's bound
tab is ungrouped and parked at the strip start" — is enforced by one
orchestrator helper, `ensureFavoriteUngrouped(tabId)` (`ungroupTabs` +
`moveTabToStripStart`), called from every binding path (`favoriteTab`,
`favoriteSavedTab`, `openSavedTab` incl. `replaceTabId`, boot reconciliation).
The favorite's tab still occupies a full-width native tab-strip slot.

Chrome's native tab pinning (`chrome.tabs.update(tabId, { pinned: true })`)
renders a tab icon-only at the strip start, and a pinned tab **cannot** be a
member of a tab group — pinning structurally guarantees both halves of the
existing invariant (never collapsed by a Space switch; always outside every
group's contiguous span).

## Goals / Non-Goals

**Goals:**
- A bound favorite's live tab is natively pinned in every window it's bound in.
- Leaving favorite-hood (couple into a Space; remove-to-Temporary) restores a
  normal unpinned tab.
- Existing users' favorites converge without a data migration.

**Non-Goals:**
- No stored-state / schema changes (native pinned state lives in Chrome).
- No continuous re-enforcement against a user manually unpinning a favorite's
  tab mid-session (mirrors the ungroup invariant: enforced at binding time and
  at boot, not fought live).
- No sidebar/launcher UI changes.

## Decisions

**D1 — Native pin replaces the strip-start park; ungroup stays explicit.**
The helper becomes ungroup → pin. Pinning subsumes `moveTabToStripStart`
(Chrome keeps pinned tabs at the strip start), so the wrapper is deleted rather
than left as dead code. The explicit `ungroupTabs` call stays first: it makes
the group-removal deterministic rather than relying on pin's side effect, and
keeps the ungroup guarantee even if the pin call is refused on a stale tab.
*Alternative considered:* keep the park as a fallback for a refused pin —
rejected; a refused pin means a stale/closed tab, where the park would refuse
identically.

**D2 — Rename `ensureFavoriteUngrouped` → `ensureFavoriteNativePinned`.**
Names are normative; a helper that pins must not be named "Ungrouped". Every
spec requirement naming the helper is already modified by this change, so the
rename adds no extra artifact surface. "NativePinned" (not "Pinned") avoids
colliding with Lunma's existing vocabulary where "pinned" means a Space-coupled
saved tab.

**D3 — Explicit native unpin on the two favorite-exit paths.**
- `pinSavedTab` (favorite → Space): `setTabNativePinned(tabId, false)` for each
  bound tab **before** `addTabToSpaceGroup` — `chrome.tabs.group` refuses
  pinned tabs, so relying on grouping to unpin implicitly is not an option.
- `unpinTab` on a favorite (record removed, tabs restored to Temporary):
  natively unpin each bound tab captured before `removeSavedTab`, so the
  ex-favorite regains a normal-size tab.
`deleteSavedTab` closes the tab; no unpin needed.
*Alternative considered:* leave the tab pinned on exit and let the user unpin —
rejected; a full-invariant symmetric exit keeps Chrome state a pure function of
Lunma coupling state.

**D4 — Boot reconciliation re-pins, upgrading existing users for free.**
The boot favorite step (tab-group-adoption) currently ungroups + parks each
restored still-grouped favorite tab. It now, for **every** bound favorite tab
(not only still-grouped ones), ensures ungrouped when grouped and natively
pinned when unpinned (read `tab.pinned` from the boot tabs query the pass
already performs — no extra Chrome round-trip). Existing installs converge at
the next service-worker boot; no migration.
*Alternative considered:* a one-shot storage-versioned migration — rejected;
native pinned state isn't stored state, and boot reconciliation is the
established convergence point for Chrome-side drift.

**D5 — `setTabNativePinned(tabId, pinned)` is a best-effort wrapper in
`tab-groups.ts`**, with the same swallow-and-`log.debug` contract as
`ungroupTabs`/`closeTab`: a refusal (stale/closed tab) never bubbles to the
coordinator's `SIDE_EFFECT_FAILED`.

## Risks / Trade-offs

- [User manually unpins a favorite's tab; it stays unpinned until next boot] →
  Accepted, mirrors the ungroup invariant's drift window; boot re-converges.
- [User already uses native pinning for non-favorite tabs] → No conflict: Lunma
  only pins tabs bound to `spaceId === null` records and only unpins on the two
  favorite-exit paths, never touching tabs it didn't pin.
- [`tabs.onActivated` Space-switch guard] → Unaffected: a favorite has no owning
  Space regardless of native pinned state; activating a natively pinned
  favorite still does not switch Spaces.
- [Pinned tabs survive window close differently (Chrome may move them)] →
  Existing per-window binding drift handling already reconciles closed/moved
  tabs; pinning introduces no new binding states.

## Migration Plan

Ships as code only. Existing favorites converge via D4 at the next
service-worker boot. Rollback = revert; natively pinned tabs simply stay pinned
until the user unpins them (harmless, user-reversible).

## Open Questions

None.
