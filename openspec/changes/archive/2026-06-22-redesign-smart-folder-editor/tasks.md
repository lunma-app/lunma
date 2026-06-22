## 1. Implementation

- [x] 1.1 Rewrite `SmartFolderEditor.svelte` to the card-list layout: Name `TextInput` first; a `Sources` list of in-place editable cards; `Show` / `Refresh` `Select`s; a single primary Create/Save + Cancel + hint row. Remove the `addingSource` sub-form state.
- [x] 1.2 `DraftSource.source: AddSourceType` (incl. `'opml'`) + optional per-card `file`. Each card: source `Select`, URL `TextInput` (or OPML file picker), queue filter `Chip` row, remove `×` (hidden when one card). Seed one default card on create; seed from `node.sources` on edit.
- [x] 1.3 Per-card edit mutates `sources[index]`. `+ Add source` (`Button size="sm"` ghost) appends a default card. Preserve: duplicate-`source:host` filter merge, per-source URL label / filters-hidden-for-rss / hint / refresh default / name auto-suggest, `canConfirm` (empty list, queue-without-filters, invalid URL, unresolved OPML card all block), and the save-before-`requestHostPermissions` order verbatim.
- [x] 1.4 OPML card: choosing `'opml'` shows the file picker; on file select, parse + expand into deduped `rss` cards (splice out the OPML card), set the import note, and apply the existing name/refresh defaults.

## 2. Tests

- [x] 2.1 Rewrite `SmartFolderEditor.test.ts` to the in-place model: seeded-card create, fill-and-create (no inner Add), `+ Add source`, remove (hidden at one card), per-card filter toggle + merge-on-duplicate-host, OPML import expansion, confirm-blocked cases, edit mode, and the `requestHostPermissions` union/diff behaviour.

## 3. Spec & verify

- [x] 3.1 Confirm the `smart-folders` delta matches the implemented flow (drafted in this change's `specs/`).
- [x] 3.2 Run `pnpm --filter @lunma/extension verify` and ensure green.
