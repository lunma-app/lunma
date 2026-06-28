## Context

The options page renders mostly from the `SETTINGS` registry grouped by `group`,
plus standalone cards (`ConnectionsCard`, `ResultSourcesCard`, `RecentlyArchived`,
`BackupRestore`, `ShortcutGuidanceCard`). `Options.svelte` special-cases the
`Look & feel` group to render first, then the rest in registry order, then the
standalone cards in a fixed sequence — which is how the appearance split and the
two stranded cards arose. The 2026-06-27 redesign also drifted three settings
(`theme`, `showGlares`, `reduceMotion`) into a `Look & feel` group the spec
doesn't define, and re-labelled `showGlares` from the spec's `Background effects`
to `Atmosphere glow`.

## Goals / Non-Goals

**Goals:**

- One visual section (`Appearance`); no one-item sections; management cards beside
  their settings; clear section names + intro copy + helper notes.
- Comfort density by default; wash-only result selection (drop the `ResultRow`
  bar).
- Close the `theme`/`reduceMotion`/`showGlares` spec drift in passing.

**Non-Goals:**

- No change to what any setting *does*, to persistence, the Zod engine, or the
  message bus. Only grouping, defaults, labels, copy, ordering, and one removed
  decorative marker.
- No change to the launcher result data/scoring or the overlay (already compliant).

## Decisions

- **Grouping via the registry.** Move `theme`/`showGlares`/`reduceMotion` to
  `group: 'Appearance'` and `pinnedTabBoundaryDefault` to `group: 'Tabs'` in
  `settings.ts`. Rename the `Search` group string to `Search & launcher`. The
  grouping is data, so the page picks it up without per-group code.
- **Explicit section order in `Options.svelte`.** Replace the `lookAndFeel` vs
  `otherGroups` split with an explicit ordered render: Connections →
  Search & launcher (+ `ResultSourcesCard`) → Appearance → Tabs → Auto-archive
  (+ `RecentlyArchived`) → Backup & restore. The two cards are interleaved by
  rendering them right after their related group card.
- **Section intros via a `SettingsCard` `description` prop.** Add an optional
  `description` prop to `SettingsCard` (rendered as a muted line under the
  heading). Registry-group intros come from a small `GROUP_INTRO` map in
  `Options.svelte`; the standalone cards pass their own intro string.
- **Helper notes use the existing `description` field.** Per-setting helper copy
  rides the existing `SettingText` description (no new per-row note element).
  Fix Density's description to mention launcher rows; add the temporary-vs-pinned
  clarification to the Auto-archive group intro.
- **Comfort default.** Flip `density` default in the `SETTINGS` declaration and in
  `DEFAULTS` (kept in sync per the module's contract).
- **Drop the `ResultRow` marker.** Delete the `.result-row::before` rule, the
  `.result-row.selected::before` reveal, and the reduced-motion `::before` rule;
  selection is the `--accent-soft` wash that already exists.

## Visual language

- **Hierarchy.** Section intros (muted `--text-muted`, `--text-sm`) sit directly
  under each heading, giving every card a one-line "what this is" before the
  controls — the page reads as guided sections, not a settings dump. Merging the
  two appearance sections removes a redundant heading and shortens the scan.
- **Colour & motion.** No new colour or motion. Removing the result-row accent
  bar also removes its `scaleY` transition; selection is now a single calm wash,
  consistent across launcher, overlay, and sidebar — fewer competing motions.
- **Reduced-motion / WCAG-AA.** Unaffected: intro copy is static text at AA
  contrast; the removed marker had a motion the wash doesn't, so reduced-motion
  behaviour only simplifies. Comfort density increases row spacing (never
  reduces legibility).

## Risks / Trade-offs

- **Comfort is global.** Defaulting to comfort makes sidebar tab rows and launcher
  results roomier for everyone, not just the launcher — intended, surfaced to the
  user, and reversible per-user in Appearance.
- **Test churn.** `settings.test.ts` (default density, group assertions),
  `Options.test.ts` (Appearance group, no Look & feel, card placement, intros),
  `ResultRow.test.ts` (selected state no longer has a marker), and `backup.test.ts`
  (sample settings) update to the new defaults/structure.
- **Spec drift closed mid-change.** Formalising `theme`/`reduceMotion` and
  re-labelling `showGlares` are scoped, low-risk spec additions/edits that bring
  the spec back in line with shipped code.
