## Context

Saved-tab activation runs in the service worker as two coordinator command
handlers in `apps/extension/src/background/handlers/pinned-tabs.ts`:

- `openSavedTab` (dormant) — opens a new tab at `originalURL`, binds it, seeds the
  live-tab record, marks it active, and — for a coupled record (`spaceId !== null`)
  — `addTabToSpaceGroup(windowId, saved.spaceId, tabId)` (a favorite, `spaceId ===
  null`, is left ungrouped via `ensureFavoriteUngrouped`).
- `focusSavedTab` (bound) — `chrome.tabs.update(tabId, { active: true })` +
  `chrome.windows.update(windowId, { focused: true })`.

Neither touches the window's **active Space**. The window's active Space governs
which Chrome tab group is shown (others are collapsed/hidden). So opening a
Space-B pin from a window viewing Space A adds the tab to B's group while A's
group stays the visible one — the tab is bound and "active" in Chrome but sits in a
background group the user isn't looking at. Until `launcher-fuzzy-smart-folders`
the launcher couldn't reach cross-Space pins, so this never surfaced; now it can,
and it does.

The Space switch already has a proven path: the `activateSpace` command handler
(`handlers/spaces.ts`) does exactly two things — `store.activateSpace(windowId,
spaceId)` then `ctx.groups.orchestrateActivation(windowId, spaceId, outgoing,
preserveFavoriteFocus=true)` (show the target group, hide the outgoing one, close
the outgoing home-only tab, etc.). The launcher result already carries `spaceId`,
but the authoritative source in the handler is `SavedTab.spaceId` from the store.

## Goals / Non-Goals

**Goals:**

- Activating a **coupled** saved tab whose Space is not the window's active Space
  SHALL switch the window to that Space, so the opened/focused tab is visible in
  its now-active group.
- Reuse the existing activation sequence (no re-implementation of group show/hide).
- Keep it caller-agnostic: the launcher benefits with no launcher-side change; the
  sidebar (same-Space only) is unaffected (the condition is a no-op there).

**Non-Goals:**

- No switch for **favorites** (`spaceId === null`, global/ungrouped — visible
  everywhere already).
- No switch for **smart**, **tab**, **bookmark**, **history**, or the synthesized
  action results (see D4).
- No new state, schema, message, permission, or dependency; no change to the
  `spaces-and-tabs` activation contract itself (it is reused).
- No change to restart-recovery / programmatic rebind paths — only the
  user-initiated `openSavedTab`/`focusSavedTab` command handlers.

## Decisions

### D1 — Reuse the `activateSpace` sequence via a shared helper, not a re-dispatch

Factor the two-step activation (`store.activateSpace` + `groups.orchestrateActivation`)
into one small helper (e.g. `activateSpaceInWindow(ctx, windowId, spaceId)`) used by
**both** the `activateSpace` command handler and the two pinned-tab handlers, so the
sequence never drifts.

Alternatives rejected:
- **Re-dispatch the `activateSpace` command** from within `openSavedTab` — handlers
  must not enqueue commands onto the coordinator from inside a drain (re-entrancy);
  `activateSpace` is invoked as a direct `ctx`-call sequence, exactly like the
  command handler runs it.
- **Call only `store.activateSpace`** (skip orchestration) — leaves the Chrome
  groups unswitched, so the tab is still hidden; the bug would persist.

### D2 — Gate on coupled + different Space; favorites and same-Space are no-ops

Switch only when `saved.spaceId !== null` **and** `saved.spaceId !==
activeSpaceByWindow[windowId]`. A favorite never switches (it is ungrouped/global).
Same-Space activation skips the orchestration entirely, so the sidebar's
always-same-Space clicks pay nothing and behave exactly as today.

### D3 — Ordering: switch the Space before grouping/focusing the tab

- `openSavedTab`: run the switch **before** `addTabToSpaceGroup`, so the target
  group is the shown one when the new tab joins it (and the outgoing Space's
  show/hide + home-tab cleanup happen once, cleanly). The new tab is then added to
  the now-active Space's group and is visible.
- `focusSavedTab`: switch **before** `chrome.tabs.update(active)` so the tab is
  focused into an already-shown group rather than forcing Chrome to expand a hidden
  one.

### D4 — Smart items (and tabs/bookmarks/history) do not switch Space

A `smart` launcher result is link-shaped — it acts via `openUrl`, opening its URL
as an ordinary temporary tab in the current window with **no Space binding**. Its
*folder* lives in a Space, but the item itself is external tracked work, not a
Space-bound tab. Switching the whole window to the folder's Space because you opened
a PR would be surprising (you wanted to read the PR, not reorganise your
workspace). So smart results stay put. Open tabs (`focusTab`) carry no owning Space
in the launcher (group-derived, out of scope), and bookmarks/history/actions are
global. Only genuinely Space-bound **pinned saved tabs** switch — auto-switch
follows Chrome-group membership.

Alternative considered: switch to the smart folder's Space on smart-item
activation. Rejected for this change; revisit if users ask for it (the result
already carries the folder's `spaceId`, so it stays a small follow-up).

## Risks / Trade-offs

- **Extra group orchestration on a cross-Space open could add visible work/flicker**
  → Mitigation: gated to different-Space only (D2); it reuses the exact path a
  manual Space switch already runs, so the cost/visuals match an ordinary switch —
  which is the intended UX here.
- **"I didn't ask to switch Spaces"** → This is the intended fix: opening a
  Space-B pin lands you in Space B where the tab lives. Favorites (cross-Space by
  design) and smart items (external links) deliberately stay put, so the only
  switch is for a tab that genuinely belongs to another Space.
- **Re-entrancy / double-drain** → The handler calls the `ctx.groups`/`ctx.store`
  sequence directly (never enqueues a command), identical to how `activateSpace`
  runs inside its own drain; one drain, one broadcast.
- **`outgoing` capture** → Like `activateSpace`, capture the current active Space
  *before* `store.activateSpace` so orchestration can close the outgoing
  home-only tab; the shared helper owns this so both call sites get it right.

## Migration Plan

Pure behavioural change — no schema, storage, or message version bump, nothing to
migrate. Rollback is reverting the handler change; no persisted state is affected.

## Open Questions

- None blocking. The smart-item switch (D4 alternative) is intentionally deferred,
  not unresolved.
