## Context

`SmartFolderEditor.svelte` builds a `sources: DraftSource[]` then dispatches
`createSmartFolder` / `updateSmartFolder`. Today it renders: a source summary
list, then an `addingSource` inline sub-form (its own Source/URL/Filters +
**Cancel/Add**), then Name / Show / Refresh, then **Add smart folder**. The two
Add buttons and the detached sections are the confusion.

## Goals / Non-Goals

**Goals:**
- One readable top-to-bottom flow; one primary action.
- Single-source folders: fill-and-create, no inner Add step.
- Preserve every behaviour: OPML import, duplicate-host filter merge, per-source
  adaptive labels/hints, refresh defaults, name auto-suggest, edit mode, and the
  save-before-permission-prompt order.

**Non-Goals:**
- No change to the bus commands, payloads, validation semantics, or the engine.
- No new primitives.

## Visual language

- **Source cards.** Each source is a `--surface-2` card (`--r-md`, `--space-2`
  padding): a head row with the source `Select` (flex-1) + a quiet `✕` remove
  (`--text-dim` → `--danger`/`--text` on hover; hidden when one card remains),
  then the per-source body — URL `TextInput`, or the OPML file picker, plus the
  queue filter `Chip` row. Cards stack with `--space-2`.
- **Add affordance.** `+ Add source` as a compact ghost `Button` (`size="sm"`)
  directly under the list — clearly secondary to the primary action.
- **Hierarchy & order.** Name (`TextInput`) leads; then the `Sources` group;
  then `Show` / `Refresh` `Select`s; then the hint + actions. Group labels use
  `--text-xs`/`--weight-medium`/`--text-muted` (the editor's existing field
  label style).
- **Primary action.** A single right-aligned **Create** (new) / **Save** (edit)
  primary `Button` with **Cancel** ghost beside it; the validation hint sits to
  their left so the blocked reason is read with the button, not stranded.
- **Motion / contrast.** Card add/remove uses the existing list-reorder feel;
  reduced-motion holds; all colours from the token ramps (WCAG-AA).

## Decisions

- **`DraftSource.source: AddSourceType`** (adds `'opml'`) so a card can be an
  OPML importer. An OPML card shows the file picker; on file select it parses and
  **splices itself out**, inserting one `rss` card per new feed (dedup by
  `source:host`), then restores the source to a normal feed list. `canConfirm`
  treats a still-unresolved OPML card (or any card with no file) as invalid.
- **No `addingSource` state.** Per-card edits mutate `sources[index]` directly.
  `+ Add source` appends a default card (`gitlab`, default URL, `review-
  requested`). The duplicate-`source:host` **merge** runs when a card's
  source/host is edited to collide with another, mirroring today's add merge.
- **First card seeded on create**; edit mode seeds from `node.sources`.
- **Save-before-permission-prompt** confirm order (least-privilege D4) is kept
  verbatim.

## Risks / Trade-offs

- **Always-editable cards** are denser than summary chips, but multi-source
  folders are rare and the panel is transient; legibility beats compactness here.
- **Duplicate-host merge on in-place edit** is subtler than on a discrete Add.
  Mitigation: merge only on commit of a source/URL change, dedupe deterministically
  (first card wins, `QUERY_ORDER`), covered by tests.
- **Test churn** is large (the add-sub-form testids vanish). Mitigation: the
  rewrite keeps stable testids for the list/name/show/refresh/confirm and adds
  card-scoped ids; behaviours are re-asserted against the new structure.
