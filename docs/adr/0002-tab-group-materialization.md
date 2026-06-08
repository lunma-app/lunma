# 0007 — Tab-group materialization of Spaces

- **Status:** Accepted
- **Date:** 2026-05-30
- **Implementing phase:** Phase 2 (see docs/05-roadmap.md) — shipped by the `space-tab-groups` change

## Context

Until this change a Space had no physical presence in Chrome. `spaceInstance.groupId`
was a hardcoded `-1`, there were zero `chrome.tabGroups` calls, and
`store.activateSpace` **overwrote** the window's single instance on every switch —
so switching A→B discarded A's `tempTabIds` and switching back made a fresh empty
instance (the observed "temp tabs vanish on switch" bug). Spaces were sidebar
filters, not real containers: Chrome's strip showed every Space's tabs at once.

The `spaces-and-tabs` spec already *required* the real behaviour (materialize as
tab groups; reuse `groupId`/`tempTabIds` on re-activation; collapse old / expand
new on switch; retitle on rename; close on delete). The code never implemented it.
This decision records how we close that gap.

**MV3 / `chrome.tabGroups` constraints that shape the design:**

1. A tab group **cannot be empty** — an empty group auto-dissolves; so a Space's
   group only exists once the Space has ≥1 tab in that window.
2. Chrome **will not collapse a group that contains the active tab** — to collapse
   the outgoing Space's group on a switch, focus must first move into the incoming
   group.
3. Group ids and tab ids are **session-scoped** — they change on browser restart;
   persisted `groupId`s are stale after a restart and must be reconciled.
4. `tabGroups` is a **separate permission** (manifest had `tabs`, not `tabGroups`).

## Decision

- **D1 — Nested per-(window, Space) instance map.** `spaceInstancesByWindow`
  becomes `{ [windowId]: { [spaceId]: SpaceInstance } }`. A window keeps an
  instance — its own `groupId` + `tempTabIds` — for *every* Space it has
  instantiated, not just the active one, so switching away and back **reuses**
  them. `activateSpace` no longer discards anything. The active instance is
  `spaceInstancesByWindow[windowId]?.[activeSpaceByWindow[windowId]]`. A `groupId`
  of `-1` is the "no live Chrome group yet" sentinel. (Schema V4 + a V3→V4
  migration that nests each existing instance under its `spaceId`; see
  docs/06-migration.md.)

  _Why not keep one-per-window and re-derive from Chrome on switch-back?_ Chrome
  groups carry no stable Lunma id, so re-discovering "which group was this
  Space's" would mean matching on title/colour — fragile and broken by user
  edits. The persisted instance is the source of truth; Chrome is reconciled
  against it (D4).

- **D2 — Collapse / expand, not `chrome.tabs.hide`.** Visibility is driven by
  `chrome.tabGroups.update({ collapsed })`: the active Space's group is expanded,
  every other **Lunma-tracked** group in the window is collapsed. Lunma only ever
  touches `groupId`s it tracks — a user's own manually-created group is never
  collapsed, retitled, or closed. `chrome.tabs.hide()` was rejected (D2 in the
  change's design): it needs the `tabHide` permission, shows a persistent
  user-facing warning bar, and hidden tabs disappear from the strip rather than
  tucking behind a native group header.

- **D3 — Empty-group lifecycle + switch sequence.** Because a group can't be
  empty (constraint 1) and can't be collapsed while it holds the active tab
  (constraint 2), activation runs an ordered sequence in the coordinator:
  (a) reconcile/create the target group, (b) ensure a focusable tab — open a
  fresh one if the Space has none in the window, (c) activate a tab in the target
  group so focus leaves the outgoing one, (d) expand the target and collapse the
  other tracked groups. The group is titled + recoloured with the Space's
  identity when (re)created.

- **D4 — Reconcile on activation.** Before reusing a persisted `groupId` the
  coordinator verifies it with `chrome.tabGroups.get` (exists + right window →
  reuse; missing → rebuild from `tempTabIds` ∩ tabs still open in the window, and
  record the new id). This folds restart handling into the normal activation
  path — no separate boot pass for groups.

- **D5 — I/O lives in the coordinator (thin store).** All `chrome.tabGroups` /
  `chrome.tabs.group|ungroup` / activation `chrome.tabs.update` calls live in
  `src/background/tab-groups.ts` wrappers, sequenced by `coordinator.ts`. Store
  mutators stay synchronous and chrome-free; `recordSpaceGroup` is the only
  group-related state write.

## Alternatives considered

- **`chrome.tabs.hide()`** — true hiding, cleaner separation, but the `tabHide`
  permission shows a persistent "an extension is hiding tabs" warning and removes
  tabs from the strip. Rejected (D2).
- **Pure sidebar filter (status quo)** — simplest, but Chrome's strip keeps
  showing every Space's tabs at once, which hollows out the core "a Space is a
  place" promise. Rejected.
- **One Chrome window per Space** — closest to Arc's true isolation, but
  heavyweight and breaks single-window workflows. Out of scope.
- **One-per-window instance, re-derive on switch-back** — fragile group
  rediscovery by title/colour. Rejected (D1).

## Consequences

- The strip declutters to the active Space using Chrome's native collapse/expand
  (not re-skinned). Spaces become real places; the "temp tabs vanish on switch"
  bug is fixed by the data model alone.
- We inherit Chrome's group UI: a colored group pill in the strip, Chrome's 9-color
  palette (Lunma's nine `SpaceColor` values map 1:1 to it via `toGroupColor`; only
  the `gray`→`grey` spelling differs), and the native animation. Switching a Space now also moves tab
  focus (constraint 2), and entering an empty Space opens a fresh tab (constraint 1).
- **Restart limitation — treat as a launch blocker, not a someday follow-up.**
  Immediately after a browser restart Chrome may have *restored* the previous
  groups with new ids Lunma doesn't recognise; on first activation Lunma **rebuilds**
  rather than adopting them, which can momentarily double-group. Precise
  restored-group adoption is a named follow-up — and because the restart path is
  the most likely "why is my browser doing this" first impression, it should be
  resolved (or the double-group made invisible) **before any public/wide release**,
  not deferred indefinitely. The rebuild is at least idempotent per activation.
- Manual user edits to a Lunma group (drag a tab out, ungroup, rename in Chrome)
  desync Lunma's persisted state until the next activation reconcile — best-effort
  only in this change.
- Adds the `tabGroups` manifest permission (near-invisible given `tabs` is already
  present). No npm dependencies.
