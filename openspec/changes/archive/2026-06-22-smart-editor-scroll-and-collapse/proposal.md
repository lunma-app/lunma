## Why

The redesigned smart-folder editor breaks with many sources. Each source renders
a full editable card, so an OPML import (dozens of feeds) grows the menu drawer
past the viewport with **no scroll** — the **Create / Save** action becomes
unreachable, so the folder can't be finished. The flat wall of identical
full-height cards also has weak hierarchy and is hard to scan. User value: the
editor stays usable at any source count — the primary action is always
reachable, and the source list reads as a scannable list.

## What Changes

- **The Sources list is height-bounded and scrolls** independently (`max-height`
  + `overflow-y: auto`), with **Name** pinned above and the folder settings +
  primary action pinned below — so Create/Save is reachable regardless of source
  count.
- **Cards collapse to a summary row** by default: source glyph + host + (queue)
  filter summary, with reorder / remove and a disclosure chevron; clicking the
  summary expands the full editable card. A **sole card** and any **incomplete**
  card always render expanded (so you can always finish/fix); a **newly added**
  card opens expanded; **OPML-imported** feed cards land **collapsed** (they're
  valid and numerous).

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `smart-folders`: "Creation and configuration via the pinned-header menu" gains
  the scrollable, height-bounded Sources list (action always reachable) and
  collapsible summary cards (sole/incomplete/new expanded; imported feeds
  collapsed).

## Impact

- `apps/extension/src/sidebar/SmartFolderEditor.svelte` — a bounded, scrollable
  `.source-list`; per-card expand/collapse state + a collapsed summary row;
  Name and the settings+action rows stay outside the scroll region.
- `apps/extension/src/sidebar/SmartFolderEditor.test.ts` — tests for collapse
  (summary by default for multi-source, click-to-expand, incomplete auto-expand,
  OPML imports collapsed, sole card expanded).
- Composes existing primitives + `@lunma/tokens`; no schema/bus change.
