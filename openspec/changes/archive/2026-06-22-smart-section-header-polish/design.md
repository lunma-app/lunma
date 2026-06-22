## Context

`SmartSectionHeader.svelte` renders, per resolved section, a row with two
leading glyphs — a `chevron-right` (rotating on expand) AND the source icon —
then the host label and count. Two glyphs before the host is visually noisy and
redundant with the folder's own icon; the header height (`12px` with an
overflowing 16px icon) makes the collapsed list airy, and the host label sits at
nearly the same weight as item titles.

## Goals / Non-Goals

**Goals:**
- One disclosure slot per section header (source icon ↔ chevron).
- Clear three-level hierarchy and visible section separation.
- Tight collapsed vertical rhythm.
- Same change for every smart-folder kind (the header is shared).

**Non-Goals:**
- No change to collapse state, badge math, or the folder-level row.
- No schema/bus change; the disclosure is presentation only.

## Visual language

- **Disclosure slot (one glyph, on intent).** A single 16px slot stacks the
  source icon and a `chevron-right` absolutely in the same box. At rest the
  source icon shows in `--text-dim`; on `:hover` / `:focus-visible` of the
  header the icon crossfades out and the chevron in (opacity, `--motion-fast`
  `--ease-standard`), the chevron rotating 90° when expanded. The whole header
  is the button; `aria-expanded` + the body's presence carry state for SR and at
  rest. This is the "one-glyph restraint" made literal.
- **Hierarchy.** Folder name `--text-md`/`--weight-medium` (unchanged) → section
  host `--text-xs`/`--weight-medium`/`--text-dim`, hover `--text-2` → item title
  `--text-sm` (unread `--weight-medium`/`--text`, read `--weight-regular`/
  `--text-muted`). Per-item favicons recess to `opacity: 0.85` at rest, `1` on
  row hover/active — the title, not the disc, leads.
- **Separation.** A hairline `border-top: 1px solid color-mix(in oklch,
  var(--text-faint) 22%, transparent)` above every section header except the
  first, with `--space-1` breathing room — expanded blocks and the collapsed
  column both read as discrete sections.
- **Density.** Header height ≈ 24px (`--space-1` vertical padding + the
  `--text-xs` line), `--row-gap` between — the collapsed list is a tidy column,
  not an airy one.
- **Motion / contrast.** `prefers-reduced-motion: reduce` drops the crossfade and
  rotation to instant. All colours come from the `--text-*` ramp on `--surface`,
  preserving WCAG-AA at every Colour intensity.

## Decisions

- **Stack-and-crossfade** the two glyphs in one slot rather than swapping the
  DOM node — keeps layout stable (no reflow) and the transition cheap.
- **`first` flag** passed from `SmartFolder.svelte` (it knows section order)
  drives the separator, since the header + body are flat siblings and CSS
  `:first-child` can't see across the body nodes.

## Risks / Trade-offs

- **State legibility at rest.** With the chevron hidden until hover, collapsed vs
  expanded isn't shown by the slot at rest — but the body's presence/absence
  shows it, and `aria-expanded` covers assistive tech. Accepted per the chosen
  direction (it favours calm over a permanent caret).
