## Why

Two related editor problems. (1) A source card's collapsed and expanded states
share **no common header**: collapsed shows `glyph + host`, but expanding throws
that away and replaces it with a `Source` Select — so toggling swaps the whole
top and reads as two unrelated components ("just strange"). (2) Reorder uses
`↑ ↓` buttons on every row, which is cluttered and not how a list wants to be
reordered. User value: a card whose **identity header stays put** while only its
body opens/closes, and **drag-to-reorder** that feels like a list.

## What Changes

- **Persistent card header.** Every card (collapsed OR expanded) shows the same
  header row: a disclosure chevron, the source glyph, the host identity (+ a
  queue filter summary when collapsed), and the row actions. Expanding reveals
  the body **beneath** the header (the `Source` Select, the URL field / OPML
  picker, the filter chips) — the header never changes shape. Changing the
  source **type** moves into the body's `Source` Select (the header shows the
  resulting glyph + host). An incomplete card can't be collapsed (its chevron is
  disabled) so it's always fixable.
- **Drag-to-reorder.** A **grip handle** replaces the `↑ ↓` buttons: pointer
  drag-and-drop reorders the cards (with a drop indicator), and the handle is
  keyboard-operable (focus it, **Arrow Up / Down** move the card). The remove
  `×` stays (hidden at one card).

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `smart-folders`: "Creation and configuration via the pinned-header menu" — the
  source card gains a persistent identity header shared by both states (body
  expands beneath it), and reorder becomes a drag handle (pointer DnD + keyboard
  arrows) replacing the move up/down buttons.

## Impact

- `apps/extension/src/sidebar/SmartFolderEditor.svelte` — restructure the card
  into a persistent header + collapsible body; the `Source` Select moves into
  the body; add a grip handle with HTML5 drag-and-drop + Arrow-key reorder;
  remove the `↑ ↓` icon buttons.
- `apps/extension/src/sidebar/SmartFolderEditor.test.ts` — header present in both
  states; keyboard (Arrow) reorder on the grip; remove/collapse behaviour.
- `apps/extension/src/ui/icon-loaders.generated.ts` — regenerated for
  `grip-vertical`.
- Composes existing primitives + `@lunma/tokens`; no schema/bus change.
