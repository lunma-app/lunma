## Why

In a multi-feed (OPML) folder, clicking "Show recently read" on one feed
revealed the read rows of **every** feed. The peek was wired to the
folder-level `hideRead` field (`setSmartFolderHideRead { folderId }`), but the
toggle renders per section — so one click flipped the whole folder. User value:
the peek acts on the feed you clicked, leaving the others drained.

## What Changes

- The "Show recently read" peek becomes **per resolved feed section** and
  **sidebar-local, per-window** — a new `setSmartSectionRevealRead(windowId,
  folderId, sourceKey, revealed)`, keyed exactly like the existing per-section
  collapse state. The folder's `hideRead` remains the persisted drained default;
  the per-section reveal overrides it for one section in one window.
- The footer toggle, the read-row collapse, and the "all caught up" empty-note
  all consult the per-section effective hide-read, not `node.hideRead` directly.
- `setSmartFolderHideRead` (the folder-level command) is unchanged and retained
  as the resting-default control; it is simply no longer the peek's trigger.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `smart-folders`: the "Reading folders are a draining unread queue" requirement
  re-specs the "Show recently read" peek as per-section + per-window +
  sidebar-local (`setSmartSectionRevealRead`), independent per feed, replacing
  the folder-wide `setSmartFolderHideRead`-toggled peek.

## Impact

- `apps/extension/src/shared/types.ts` — `SidebarLocalState` gains
  `revealedReadSmartSectionsByWindow` (mirrors `collapsedSmartSectionsByWindow`).
- `apps/extension/src/shared/store.svelte.ts` — new `setSmartSectionRevealRead`
  (sidebar-local, mirrors `setSmartSectionCollapsed`).
- `apps/extension/src/sidebar/SmartFolder.svelte` — `isSectionReadRevealed` /
  `sectionHidesRead` helpers; the footer toggle, row-collapse, and empty-note use
  them; `toggleHideRead` (folder dispatch) becomes `toggleSectionRead(sk)`.
- `apps/extension/src/sidebar/SmartFolder.test.ts` — peek tests updated to the
  per-section model; a new test asserts revealing one feed leaves others drained.
- Docs: no `docs/` file covers the peek; none change. The `smart-folders` spec
  is updated (see Modified Capabilities).
- No schema/migration change (the reveal is ephemeral, like collapse); no new
  bus command; no `src/ui` primitives.
