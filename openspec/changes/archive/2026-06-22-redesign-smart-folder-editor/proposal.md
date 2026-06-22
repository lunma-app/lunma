## Why

The "New smart folder" form is confusing: it has a **two-stage, two-Add**
model. An inline "Add source" sub-form (Source → URL → Filters) carries its own
**Cancel / Add**, floating mid-dialog, while a separate **Add smart folder**
sits at the bottom — two buttons that look alike but do different things, an
added-sources list that isn't legible while you build, folder-level fields
(Name / Show / Refresh) detached below, and a stranded "Add at least one
source" error. Creating the common single-source folder takes an inner "Add"
then an outer "Add" with a dead gap between. The user value: a form you can read
top-to-bottom and complete in one pass — Name it, fill the source, Create.

## What Changes

- **Name-first, sources-as-a-list, one primary action.** The editor becomes:
  Name → a Sources list of **in-place editable cards** (no inline add sub-form,
  no inner Add/Cancel) → folder settings (Show / Refresh) → a single
  **Create** / **Save** primary action (+ Cancel).
- **The first source is a live card**, so a single-source folder is fill-and-
  create — no separate "Add source" step. **+ Add source** appends another card;
  **✕** removes one (hidden when only one remains).
- Each card carries the source `Select`, the per-source URL field (or **OPML
  file** picker), and the queue **filter** multi-select — the existing
  source-adaptive behaviour (Feed URL vs Instance URL, filters hidden for rss,
  hint, refresh default) now lives in the card.
- **OPML** stays a source type: choosing it on a card shows the file picker;
  importing **expands** that card into one rss card per feed (dedup preserved).
- Editing a card mutates `sources` directly; **duplicate `source:host` still
  merges** filters. Confirm is blocked while any card is invalid (bad URL, queue
  with no filters, or an OPML card with no file chosen yet), with the reason
  shown beside the action.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `smart-folders`: "Creation and configuration via the pinned-header menu" —
  replaces the inline add-source sub-form with in-place editable source cards,
  Name-first ordering, and a single primary Create/Save action; OPML becomes a
  source-type card that imports-and-expands.

## Impact

- `apps/extension/src/sidebar/SmartFolderEditor.svelte` — rewritten to the
  card-list layout; drops the `addingSource` sub-form state; folds its add-state
  into per-card editing; OPML import operates on a card.
- `apps/extension/src/sidebar/SmartFolderEditor.test.ts` — rewritten to the
  in-place model (the `smart-add-source-open/type/url/confirm` flow is gone;
  new card-level testids).
- Composes existing `ui/` primitives (`Select`, `TextInput`, `Chip`, `Button`
  incl. the new `size="sm"`) + `@lunma/tokens` — no new primitives.
- No schema/bus change: `createSmartFolder` / `updateSmartFolder` payloads
  (`sources[]`, name, maxItems, refreshMinutes) and the merge/validation
  semantics are unchanged; only the editor UI is redesigned.
