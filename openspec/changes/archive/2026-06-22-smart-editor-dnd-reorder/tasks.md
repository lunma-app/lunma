## 1. Implementation

- [x] 1.1 Restructure the source card into a **persistent header** (disclosure chevron + source glyph + host identity + collapsed filter summary + actions) plus a **body beneath** (Source `Select`, URL/OPML, filter chips) shown only when expanded. The header is identical in both states; the `Source` Select moves into the body. Disable the chevron for incomplete cards. Update `isExpanded` to seed initial cards expanded + force-expand incomplete; OPML imports collapsed.
- [x] 1.2 Replace the `↑ ↓` buttons with a **grip handle**: `draggable`, with `ondragstart`/`ondragover`/`ondrop`/`ondragend` reordering `sources` (drop indicator + dragged-card dimming), and `onkeydown` Arrow Up/Down calling the array move. Keep the remove `×` (hidden at one card). Add `grip-vertical` to the icon allowlist (`pnpm gen:icons`).

## 2. Tests

- [x] 2.1 Tests: the header (glyph + host) is present collapsed AND expanded; the `Source` select renders in the body when expanded (not the header); Arrow-key reorder on the grip moves a card; incomplete card can't collapse; OPML imports collapsed; remove hidden at one card.

## 3. Spec & verify

- [x] 3.1 Confirm the `smart-folders` delta matches (drafted in this change's `specs/`).
- [x] 3.2 Run `pnpm --filter @lunma/extension verify` and ensure green.
