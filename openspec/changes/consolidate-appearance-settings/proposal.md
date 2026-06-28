## Why

The options page reads as a pile of settings rather than a considered surface: a
user sees **two** appearance sections ("Look & feel" and "Appearance") split
arbitrarily, a one-item "Pinned tabs" section, and two management cards ("Recently
archived", "Result sources") stranded far from the settings they relate to. This
change reorganises the page into a small set of intuitive, well-named sections
with intro copy and helper notes, so first-time setup is legible at a glance —
direct user-visible value on a surface every user visits.

It also folds in two requested tweaks (comfort density by default; remove the
launcher result-row selection bar) and, in passing, closes drift the
2026-06-27 redesign left behind: the spec already places `showGlares` in the
`Appearance` group and already mandates a wash-only (no-bar) result selection,
but the code diverged on both, and `theme`/`reduceMotion` were never specced.

## What Changes

- **Merge "Look & feel" → "Appearance".** `theme`, `showGlares`, `reduceMotion`
  move from group `Look & feel` to `Appearance` (joining `density`, `tint`), so
  one section owns all visual settings. Drop the special-cased "Look & feel"
  rendering in `Options.svelte`.
- **Fold "Pinned tabs" → "Tabs".** `pinnedTabBoundaryDefault` moves to the
  `Tabs` group, ending a one-item section.
- **Rename "Search" → "Search & launcher"** (it already holds launcher scope).
- **Relocate the two orphan cards**: `ResultSourcesCard` renders directly under
  the Search & launcher group; `RecentlyArchived` directly under the Auto-archive
  group.
- **Section intro lines**: each settings/management section card renders a
  one-line description under its heading (new optional `SettingsCard` prop +
  per-section copy).
- **Helper notes / copy**: add notes where a setting's effect isn't obvious
  (e.g. Auto-archive only touches temporary tabs; what "Lock to site" does) and
  fix the now-inaccurate Density description (it affects launcher rows too).
- **Comfort by default**: `density` default `'normal'` → `'comfort'` (global —
  drives sidebar tab rows and launcher result rows).
- **Remove the result-row selection bar**: delete the `::before` accent marker in
  `ui/ResultRow.svelte`; selection becomes the `--accent-soft` wash alone,
  matching the overlay and the launcher spec's existing wash-only contract.
- Reconcile the `showGlares` label drift: spec `'Background effects'` → the
  shipped `'Atmosphere glow'`.

Final section order: Connections → Search & launcher (+ Result sources) →
Appearance → Tabs → Auto-archive (+ Recently archived) → Backup & restore.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `settings`: density default → `comfort`; `pinnedTabBoundaryDefault` group
  `Pinned tabs` → `Tabs`; `showGlares` label → `Atmosphere glow` (group stays
  `Appearance`); ADD `theme` + `reduceMotion` declarations (group `Appearance`),
  formalising redesign settings; the options page renders a per-group
  description line and places the Result-sources / Recently-archived cards under
  their related groups.
- `launcher`: the new-tab `ResultRow` indicates selection with the wash alone
  (no accent bar), matching the overlay's existing wash-only contract.

## Impact

- **Code**
  - `apps/extension/src/shared/settings.ts` — group reassignments, density
    default, label, `theme`/`reduceMotion` already declared (group change),
    description copy.
  - `apps/extension/src/options/Options.svelte` — drop Look & feel special-case,
    render groups with intro copy, relocate the two cards, helper notes.
  - `apps/extension/src/ui/SettingsCard.svelte` — optional `description` prop.
  - `apps/extension/src/ui/ResultRow.svelte` — remove the `::before` marker.
  - Possibly `ConnectionsCard`/`ResultSourcesCard`/`RecentlyArchived`/
    `BackupRestore` — intro copy via the new `SettingsCard` prop.
  - Tests: `settings.test.ts`, `Options.test.ts`, `ResultRow.test.ts`,
    `backup.test.ts`.
- **Primitives**: composes `SettingsCard`, `SegmentedControl`, `Select`,
  `SettingText`, `TextInput` (existing); extends `SettingsCard` with a
  description prop. No new primitives; `ResultRow` loses a decorative marker.
- **Docs**: none (`docs/` doesn't enumerate the options IA; the `settings`/
  `launcher` specs do).
- **Dependencies / schema / bus**: none. Defaults change but no new stored
  fields; `theme`/`reduceMotion` already persist.
