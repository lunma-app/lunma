## Context

The "Show recently read" peek toggled the folder-level `node.hideRead` via
`setSmartFolderHideRead { folderId }` (persisted). But `feedWindowForSection`
renders one feed per resolved section and the toggle sits in each section's
footer, so in a multi-feed (OPML) folder a single click flipped `hideRead` for
the whole folder — every feed's read rows revealed at once.

The per-section collapse state (`collapsedSmartSectionsByWindow`) already
establishes the pattern for "a view property of this window's section, not a
persisted folder field": sidebar-local, per-window, keyed
`windowId → folderId → sourceKey`, never persisted/broadcast.

## Goals / Non-Goals

**Goals:**
- The peek acts only on the clicked feed section, in the current window.
- Reuse the proven per-section-collapse mechanism (no schema/migration).

**Non-Goals:**
- No change to the persisted folder `hideRead` default (still the resting drained
  state) or to `setSmartFolderHideRead` (kept as the folder-level command).
- No persistence of the peek — it is ephemeral by design (resets on reload),
  matching the collapse precedent and the chosen approach.
- No UI/surface addition, so no `Visual language` section applies.

## Decisions

- **Mirror collapse exactly:** add `revealedReadSmartSectionsByWindow` to
  `SidebarLocalState` and `setSmartSectionRevealRead(windowId, folderId,
  sourceKey, revealed)` to the store, structurally identical to the collapse
  field/method. Lowest-risk, consistent with the just-shipped collapse feature.
- **Effective hide-read** per section: `sectionHidesRead(sk) = node.hideRead &&
  !isSectionReadRevealed(folderId, sk)`. The footer label/title, the read-row
  `collapsed` flag, and the "all caught up" empty-note all consult it.
- **Keep `setSmartFolderHideRead`:** the folder-level persisted default remains
  the resting state; only the peek's trigger moved. Removing the command would be
  a larger bus/spec change with no user benefit here.

## Risks / Trade-offs

- **Ephemeral peek:** revealing read rows does not survive a reload or cross to
  other windows. Accepted — a peek is transient, and this matches the collapse
  model the user already lives with.
- **`hideRead: false` folders:** when the folder default is "show read", a
  section's reveal is a no-op (read already shown). Expected: the override only
  *reveals* against a drained default; there is no per-section *hide* override,
  and the OPML default is `hideRead: true`.
