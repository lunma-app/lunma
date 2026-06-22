## Context

The current card uses two different tops: a collapsed summary (glyph + host) and
an expanded head whose first element is the `Source` Select. Toggling swaps the
whole top, so the states look unrelated. Reorder uses per-row `↑ ↓` buttons.

## Goals / Non-Goals

**Goals:**
- One persistent header per card, identical in both states; only the body opens.
- Drag-to-reorder with a keyboard-accessible handle.

**Non-Goals:**
- No change to create/edit/merge/OPML/validation semantics or the bus.
- No new primitives.

## Visual language

- **Persistent header.** `[chevron] [source glyph] [host identity] (· filters
  when collapsed) … [grip] [×]`. The chevron rotates 90° when expanded; the glyph
  is the source family icon (`rss` / `folder-git-2` / `folder-kanban`); the
  identity is the host (or "New source" when blank). The header is the same node
  in both states (no swap), so expanding reads as the same card growing.
- **Body (expanded only), beneath the header:** a `Source` Select (change type),
  the URL `TextInput` (or OPML picker), and the queue filter chips. It fades in
  (`source-card-in`, reduced-motion guarded).
- **Containment:** expanded = bordered `--surface-2` box; collapsed = clean
  hover-lit row (kept from the prior change), so the glue holds.
- **Reorder.** A grip handle (`grip-vertical`, `--text-dim`) on the right:
  `draggable`; dragging a card shows a drop indicator on the card under the
  pointer and dims the dragged card; dropping moves it. The handle is a
  `<button>` — **Arrow Up/Down** move the card (the keyed `{#each}` moves the
  same DOM node, so focus follows). Remove `×` stays (hidden at one card).

## Decisions

- **Source type moves to the body.** The header must be stable, so the type
  Select can't live in it; the header shows the *resulting* glyph + host, and the
  body's first field is `Source`. This is what makes the two states share a head.
- **HTML5 drag-and-drop, local array.** The editor's `sources` is local `$state`,
  so reorder is a plain array move on drop — no store/DnD-library coupling. Only
  the grip is `draggable` (dragging from inside the URL input must not start a
  drag).
- **Keyboard reorder on the grip** preserves the a11y the `↑ ↓` buttons gave;
  the keyed each keeps focus on the moved card's grip.

## Risks / Trade-offs

- **jsdom can't exercise native drag events** well; tests cover the keyboard
  reorder path and header presence, and the drop reorder logic is a pure array
  move (unit-testable via the keyboard path that shares it).
- **Disabled chevron on incomplete cards** could read as inert; paired with the
  invalid border + disabled primary action, the intent (fix me) stays clear.
