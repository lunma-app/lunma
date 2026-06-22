## 1. Implementation

- [x] 1.1 In `SmartFolderEditor.svelte`, bound the `.source-list` (`max-height: min(46vh, 420px)` + `overflow-y: auto`) so Name (above) and settings + hint + actions (below) stay pinned and the primary action is always reachable.
- [x] 1.2 Add per-card expand state (`userExpanded: Set<string>`); `isExpanded(s) = sources.length === 1 || cardIncomplete(s) || userExpanded.has(s.id)`. `addSourceCard` opens the new card; OPML-imported feeds stay collapsed.
- [x] 1.3 Render a collapsed summary row (source glyph + host + queue filter summary + reorder/remove + rotating `chevron-right`); activating the summary toggles expansion. Expanded cards render the existing editable body.

## 2. Tests

- [x] 2.1 Tests: a sole card renders expanded; a second added card is expanded while the first collapses (when valid); clicking a collapsed summary expands it; an incomplete card stays expanded; OPML-imported feed cards render collapsed; the bounded scroll region is present on the source list.

## 3. Spec & verify

- [x] 3.1 Confirm the `smart-folders` delta covers the scrollable list + collapsible cards (drafted in this change's `specs/`).
- [x] 3.2 Run `pnpm --filter @lunma/extension verify` and ensure green.
