## Why

Multi-section smart folders (any kind — feeds and queue) read poorly: the
section header carries **two** leading glyphs (a disclosure chevron AND the
source icon) before the host, the three text levels (folder → section host →
item title) don't separate cleanly, sections run into one another, and the
collapsed list is vertically airy. The user value: a calmer, tighter section
list where each feed/section reads as a distinct block and the title leads —
applies to every smart folder, not just feeds.

## What Changes

- **One disclosure slot.** The section header's chevron + source icon merge into
  a single 16px slot: the source icon (rss / git / kanban) at rest, crossfading
  to a rotating chevron on hover or keyboard focus. Honors the requirement's
  "one-glyph restraint."
- **Hierarchy.** Section host label drops to `--text-xs` / `--weight-medium` /
  `--text-dim` (hover lifts to `--text-2`); item titles keep `--text-sm`
  (unread `--weight-medium`/`--text`, read `--weight-regular`/`--text-muted`);
  per-item favicons are recessed at rest (~0.85 opacity, full on hover/active)
  so titles lead.
- **Separation + density.** A hairline separator above each section header
  except the first; compact (~24px) header height so the collapsed list is a
  tidy column.
- Reduced-motion collapses the crossfade/rotation to instant; WCAG-AA holds (all
  colours from the `--text-*` ramp on `--surface`).

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `smart-folders`: "Smart-folder rendering and the one-glyph restraint" — the
  section header becomes a single disclosure slot (source icon at rest, chevron
  on hover/focus) with refined hierarchy, a hairline separator, and compact
  height, replacing the two-glyph (chevron + icon) header.

## Impact

- `apps/extension/src/sidebar/SmartSectionHeader.svelte` — merged disclosure
  slot (icon ↔ chevron), compact height, host `--text-xs`/`--weight-medium`,
  separator-above, reduced-motion guard.
- `apps/extension/src/sidebar/SmartFolder.svelte` — recess per-item favicons at
  rest; pass a `first` flag to the header for the separator.
- `apps/extension/src/sidebar/SmartSectionHeader.test.ts` — assert the single
  slot renders both glyphs (icon default, chevron present for hover/expanded
  state) and the disclosure semantics still hold.
- Composes the existing `Icon` primitive + `@lunma/tokens` only — no new
  primitives, no hard-coded design values, no schema/bus change.
