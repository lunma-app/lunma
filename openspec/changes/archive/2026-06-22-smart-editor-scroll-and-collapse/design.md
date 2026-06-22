## Context

The redesigned editor renders every source as a full editable card. The menu
drawer (`RowMenu`) measures its content and grows to fit, so a long source list
(an OPML import) overflows the sidebar with no scroll and the Create/Save action
is pushed off-screen — the folder can't be finished. The flat stack of identical
full cards also scans poorly.

## Goals / Non-Goals

**Goals:**
- The primary action is always reachable, any source count.
- A scannable source list; full editing on demand.

**Non-Goals:**
- No change to the create/edit/merge/OPML/validation semantics or the bus.
- No new primitives.

## Visual language

- **Bounded scroll region.** `.source-list` gets `max-height` (a fraction of the
  viewport, `max-height: min(46vh, 420px)`) + `overflow-y: auto` + a thin scroll
  gutter. Name sits above it, the settings `Select`s + hint + actions below — all
  outside the scroll region, so the action row is always visible. The editor is a
  flex column; only the list scrolls.
- **Collapsed summary row.** Source glyph (the section icon — `rss` / `folder-
  git-2` / `folder-kanban`) in `--text-dim`, then the host in `--text` and a
  queue filter summary in `--text-dim` (`--text-xs`), then the reorder/remove
  controls and a `chevron-right` disclosure that rotates when expanded. One row
  tall, `--surface-2`, hover lifts to `--surface-3`. Activating the summary (not
  its controls) toggles expansion.
- **Expanded card.** Unchanged full editor (Select + URL + filter chips), with
  the same chevron now rotated.
- **Motion / contrast.** Chevron rotation honours `prefers-reduced-motion`; all
  colours from the token ramps (WCAG-AA).

## Decisions

- **Expansion rule:** a card renders expanded when
  `sources.length === 1 || cardIncomplete(card) || userExpanded.has(id)`. So the
  sole card is always open; incomplete cards force open (always fixable); a new
  card (`addSourceCard` adds its id to `userExpanded`) opens; OPML-imported feeds
  (never added to `userExpanded`, and valid) stay collapsed.
- **Bound the list, not the whole editor:** keeps Name + settings + actions
  pinned and host-agnostic (works in both the `RowMenu` drawer and the
  `ContextMenu` popover, neither of which scrolls a drill-in panel itself).

## Risks / Trade-offs

- **`vh` inside a popover:** the bound is a `min(vh, px)` cap, so it degrades to
  the px cap in short viewports and never exceeds the viewport fraction — the
  action stays on screen. Accepted over a host-measured bound (simpler, robust).
- **Collapsed summary hides the URL:** intentional for scannability; one click
  reveals it, and incomplete cards never collapse.
