## 1. Settings registry (settings.ts)

- [x] 1.1 Move `theme`, `showGlares`, `reduceMotion` to `group: 'Appearance'`; rename `showGlares` label `Background effects` → `Atmosphere glow`.
- [x] 1.2 Move `pinnedTabBoundaryDefault` to `group: 'Tabs'`.
- [x] 1.3 Rename the `Search` group string to `Search & launcher` on its settings.
- [x] 1.4 Flip `density` default `'normal'` → `'comfort'` in the declaration and in `DEFAULTS`.
- [x] 1.5 Fix the Density description to mention launcher result rows, not just tab rows.

## 2. SettingsCard primitive

- [x] 2.1 Add an optional `description` prop rendered as a muted one-line intro under the heading (tokens only).

## 3. Options page (Options.svelte)

- [x] 3.1 Remove the `lookAndFeel` / `otherGroups` split; render sections in the explicit order Connections → Search & launcher → Appearance → Tabs → Auto-archive → Backup & restore.
- [x] 3.2 Move `ResultSourcesCard` directly under the Search & launcher group; move `RecentlyArchived` directly under the Auto-archive group.
- [x] 3.3 Add a `GROUP_INTRO` map and pass `description` to each registry group card; add the temporary-vs-pinned helper note to the Auto-archive intro.
- [x] 3.4 Pass intro `description` copy to the standalone cards (Connections, Result sources, Recently archived, Backup & restore) where they own a `SettingsCard`.

## 4. ResultRow primitive

- [x] 4.1 Remove the `.result-row::before` marker, the `.selected::before` reveal, and the reduced-motion `::before` rule; selection stays the `--accent-soft` wash.

## 5. Tests

- [x] 5.1 `settings.test.ts`: default density → `comfort`; group assertions for the moved settings.
- [x] 5.2 `Options.test.ts`: single Appearance section (Theme/Colour/Density/Atmosphere glow/Reduce motion), no Look & feel, `pinnedTabBoundaryDefault` under Tabs, section intros present, Result-sources under Search & launcher, Recently-archived under Auto-archive.
- [x] 5.3 ResultRow selection marker removed in CSS; selected state stays the wash (a ::before pseudo-element isn't DOM-assertable in jsdom, so no new unit test).
- [x] 5.4 `backup.test.ts` and any other fixture referencing the old default/groups.

## 6. Verify

- [x] 6.1 `pnpm --filter @lunma/extension verify` green (tsc, biome, svelte-check, stylelint, vitest).
- [x] 6.2 `openspec validate consolidate-appearance-settings --strict` passes.
