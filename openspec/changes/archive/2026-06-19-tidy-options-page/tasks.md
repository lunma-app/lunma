## 1. Test hooks first (decouple selectors before anything moves)

- [x] 1.1 Add `data-testid="group-heading"` to the registry card's `<h2>` in `Options.svelte`; update the `Options.test.ts` "Search renders first" ordering test to assert against `group-heading` instead of the `.group-label` class
- [x] 1.2 Add testids that survive extraction: `shortcut-card` / `shortcut-title` on the shortcut aside and a `testid` on its keyboard-shortcuts `Button`; scope the connectors/result-sources intro assertions to the existing `connectors-section` / `result-sources-section` testids (drop the shared `.connector-intro` querySelector); assert the auto-archive anchor via the `#auto-archive` id alone (drop the `section.group` coupling)
- [x] 1.3 `pnpm --filter @lunma/extension verify` green (no behaviour change yet)

## 2. Shared `ui/` primitives + token utility (build, prove by harness/test)

- [x] 2.1 Add `.sr-only` (visually-hidden) utility class to `packages/tokens/recipes.css`; `pnpm --filter @lunma/tokens build` clean
- [x] 2.2 Create `apps/extension/src/ui/CardHeading.svelte` — serif `--font-display`/`--text-xl` sentence-case `<h2>` + the `:root[data-tint='standard'|'vivid']` `oklch(from var(--space-c) max(l,0.72) c h)` override, heading text prop + optional `actions` snippet rendered beside the heading; token-only, forwards an optional `testid`. Add `CardHeading.test.harness.svelte` + `CardHeading.test.ts`
- [x] 2.3 Create `apps/extension/src/ui/SettingsCard.svelte` — composes `Surface variant="glass"` + section inner padding (`--space-4 --space-5`) + a `CardHeading` (heading + optional `actions`) + optional muted `description` paragraph + `children` snippet; forwards `id`/`testid`. Add harness + test
- [x] 2.4 Create `apps/extension/src/ui/SettingText.svelte` — the label + optional description column (`.setting-text` trio). Add harness + test
- [x] 2.5 Create `apps/extension/src/ui/InlineError.svelte` — `role="alert"` danger box with the shared `color-mix` danger styling; forwards `testid`. Add harness + test
- [x] 2.6 Add an `ariaLabel?: string` prop to `SegmentedControl.svelte`, applied to its `<fieldset>` as `aria-label`; extend `SegmentedControl.test.ts` to assert the fieldset carries it (spec: settings — "The radio group exposes an accessible name")
- [x] 2.7 `pnpm --filter @lunma/extension verify` green — primitives token-only (`lint:styles`), typed (`svelte-check`), tested

## 3. Recompose the existing cards onto the primitives (heading realign falls out)

- [x] 3.1 `Options.svelte` registry card: render group cards via `SettingsCard` + `CardHeading` (`group-heading` testid preserved), the label/description column via `SettingText`; delete the now-dead local `.group`/`.group-label`/`.setting-text`/`.setting-label`/`.setting-desc` CSS that moved into primitives — NOTE: `.group`/`.group-label` are still used by the not-yet-extracted Connectors + Result-sources inline sections, so they're kept until step 4 deletes them with those cards; only the registry-only `.setting-text`/`.setting-label`/`.setting-desc` were removed here
- [x] 3.2 `BackupRestore.svelte`: compose `SettingsCard` + `CardHeading` + `SettingText` + `InlineError`; delete its duplicated `.group-label`/`.description`/`.setting*`/`.import-error` blocks; keep the hidden file input using the `.sr-only` utility
- [x] 3.3 `FeedSubscriptions.svelte`: compose `SettingsCard` + `CardHeading` + `InlineError`; delete its duplicated chrome; hidden file input uses `.sr-only`
- [x] 3.4 `RecentlyArchived.svelte`: compose `SettingsCard` + `CardHeading` with the Clear-all `Button` in `CardHeading`'s `actions` slot — **the heading realigns to the shared serif treatment** (spec: auto-archive + visual-system regression scenarios); rename `.clear-confirm`/`.clear-confirm-text`/`archived-clear-confirm` to the sibling `.import-confirm`/`.confirm-text` vocabulary (no `ConfirmRow` primitive); update `RecentlyArchived.test.ts` for the renamed testid
- [x] 3.5 `pnpm --filter @lunma/extension verify` green — incl. the WCAG-AA contrast suite (cards visually identical except the realigned heading)

## 4. Extract the three inline sections into sibling cards

- [x] 4.1 Create `ConnectorsCard.svelte` — move the connectors state/functions, the `shared/connectors` import, the `<section id="connectors" data-testid="connectors-section">` intact, composing `SettingsCard`; own `onMount` refresh. Move the connectors `describe` block from `Options.test.ts` into a new `ConnectorsCard.test.ts`
- [x] 4.2 Create `ResultSourcesCard.svelte` — move `RESULT_SOURCES`, the grant state/functions, the `shared/permissions` import + the `onPermissionsChange` subscription, the `<section id="result-sources" data-testid="result-sources-section">` intact, composing `SettingsCard`; introduce its own intro-paragraph class (not the connectors one). Move the result-sources `describe` into `ResultSourcesCard.test.ts`
- [x] 4.3 Create `ShortcutGuidanceCard.svelte` — move `launcherShortcutBound` + `checkLauncherShortcut`/`openShortcutsPage` + the `shared/platform` import; render nothing until `launcherShortcutBound === false`; compose `<Icon name="keyboard" size={18}>` (add the `Icon` import) instead of the hand-inlined SVG; carry the `.shortcut-*` CSS + `@keyframes`. Move the shortcut `describe` into `ShortcutGuidanceCard.test.ts`
- [x] 4.4 `Options.svelte`: compose `<ConnectorsCard/>`, `<ResultSourcesCard/>`, `<ShortcutGuidanceCard/>`; delete the `shared/connectors`, `shared/permissions`, `shared/platform` imports and their `onMount` calls; keep `scrollToHash` `onMount` in `Options.svelte`; trim `Options.test.ts` chrome-mock to what the orchestrator still needs
- [x] 4.5 `pnpm --filter @lunma/extension verify` green; `pnpm test:e2e` smoke covers the sidebar→options `#connectors` / `#recently-archived` deep-link still resolving — NOTE: there is no dedicated deep-link e2e spec; the anchors are unit-asserted (the `#auto-archive` test + each extracted card's `id`), and the e2e smoke (13 passed) confirms the production build + surfaces still work after extraction

## 5. In-place dedup tidies (no new surface)

- [x] 5.1 Export `STATE_STORAGE_KEY = 'lunma.state'` from `apps/extension/src/shared/chrome/storage.ts` (rename the private const, value byte-identical); import it in `BackupRestore` / `FeedSubscriptions` / `RecentlyArchived`, deleting each local `STATE_KEY`
- [x] 5.2 Merge the byte-identical `.connector-indicator` / `.result-source-indicator` status-pill selectors into one rule (now in their respective extracted cards); export `TOGGLE_SEGMENTS` from `apps/extension/src/shared/settings.ts` and consume it in both `Options.svelte` and `BackupRestore.svelte` (drop the two local `TOGGLE_OPTIONS` copies) — NOTE: the step-4 extraction split the two byte-identical indicator selectors into their own cards (ConnectorsCard owns `.connector-indicator`, ResultSourcesCard owns `.result-source-indicator`), so each card now owns exactly one pill rule with no in-file duplication (no `StatusPill` primitive, per design D2)
- [x] 5.3 Delete the three unused `data-testid`s (`backup-restore`, `feed-subscriptions`, `connectors-section` IF unreferenced after step 4 — keep it if `ConnectorsCard.test.ts` now scopes to it); do NOT touch the `#recently-archived`/`#auto-archive`/`#result-sources` anchors or the `result-sources-section` testid — DONE: `backup-restore`/`feed-subscriptions` were dropped as a natural consequence of the step-3 recompose; `connectors-section` is KEPT (now scoped by `ConnectorsCard.test.ts`); the anchors + `result-sources-section` are untouched
- [x] 5.4 `pnpm --filter @lunma/extension verify` green

## 6. Accessibility behaviours (spec: visual-system inline-reveals + settings ariaLabel)

- [x] 6.1 Pass `ariaLabel` at every `SegmentedControl` call site: the options enum/toggle branches (`decl.label`), `BackupRestore` ("Include settings"), and the three sidebar editors `SpaceEditor` / `TabBoundaryEditor` / `SmartFolderEditor`
- [x] 6.2 Inline-reveal focus: in `BackupRestore` (import confirm), `RecentlyArchived` (Clear-all), and `ConnectorsCard` (token-replace), `bind:this` a container around the revealed row, focus the primary control (or the password field) after `await tick()`, and restore focus to the trigger on cancel (the `SpaceEditor` pattern)
- [x] 6.3 Result-sources grant: compose the `Toast` primitive on a successful grant in `ResultSourcesCard` so the swap is announced
- [x] 6.4 Add the missing `@media (prefers-reduced-motion: reduce)` guards: `animation: none` for the `.shortcut-card` entrance (now in `ShortcutGuidanceCard`) and `transition: none` for the `.column :global(.surface)` tint cross-fade (in `Options.svelte`)
- [x] 6.5 `pnpm --filter @lunma/extension verify` green

## 7. Test-coverage additions (test-only)

- [x] 7.1 Add a focus-management assertion per reveal (confirm opens → primary action focused; cancel → trigger refocused) in the relevant `*.test.ts`
- [x] 7.2 Cover the `onPermissionsChange` live-revoke path in `ResultSourcesCard.test.ts` (capture the `onRemoved` callback, flip `permissions.contains`, fire it, assert the row swaps back to the Enable button)
- [x] 7.3 Cover the second auto-archive number field `autoArchiveRetentionDays` (render + min-1 floor) in `Options.test.ts`
- [x] 7.4 Replace the magic 18-radio prose tally with a registry-derived count (or drop it, since per-group coverage already exists)
- [x] 7.5 `pnpm --filter @lunma/extension verify` green

## 8. Docs + workspace verify

- [x] 8.1 Update `docs/architecture.md`: the `apps/extension/src/` tree comments — the `ui/` primitive inventory (add `CardHeading` · `SettingsCard` · `SettingText` · `InlineError`) and the `options/` listing (the full card set), and the component-library section if it enumerates primitives
- [x] 8.2 Confirm `docs/tech-stack.md` / `docs/releasing.md` / `docs/adr/**` need no change (stack and release flow unchanged) — note in the change if any did — CONFIRMED no change needed: tech-stack's "options" mentions are build/HMR/fonts only (no new dependency, no stack shift); releasing.md and `docs/adr/**` carry no references to the options card structure
- [x] 8.3 `pnpm verify` (workspace root) green — extension + site + tokens; `pnpm test:e2e` smoke green
- [x] 8.4 `openspec validate tidy-options-page` clean; tasks all checked

## 9. Apply-time amendment — fold the appearance preview into the Appearance card (user-agreed)

- [x] 9.1 `Options.svelte`: fold the live appearance preview into the Appearance `SettingsCard` (a `group === 'Appearance'` conditional appends a `Preview`-labelled `.preview` block beneath the controls); remove the standalone bottom preview `<Surface>` and the now-unused `Surface` import; carry the `.preview` / `.preview-label` / `.preview-panel` CSS so Density still reflows the rows and the card's glass fill still re-treats with the tint (design D7)
- [x] 9.2 Update `Options.test.ts` ("renders the live preview rows folded into the Appearance card") to assert the 3 preview rows live within the `#appearance` card
- [x] 9.3 Reconcile the `visual-system` delta wording (the preview is folded into the Appearance card, NOT a standalone `SettingsCard`) + add the "preview sits within the Appearance card" scenario; note the deviation in `proposal.md` + `design.md` D7
- [x] 9.4 `pnpm verify` (workspace) green + `pnpm test:e2e` smoke green + a built-extension screenshot confirms the preview renders inside the Appearance card; `openspec validate tidy-options-page` clean

## 10. Adversarial-review follow-ups (review-driven)

- [x] 10.1 Bring `FeedSubscriptions` OPML import confirm into the inline-reveal focus pattern (focus the primary Import action on open via the `confirm-row` ref; restore focus to the `feed-import-trigger` on cancel) — it's behaviourally identical to the Backup import confirm the change already fixed; add it to the `visual-system` inline-reveals requirement + scenario, `proposal.md`, and `design.md` D4; add a focus test in `FeedSubscriptions.test.ts`
- [x] 10.2 Drop the dead `fireEvent` import in `ShortcutGuidanceCard.test.ts` (left over from the describe-block move; biome `noUnusedImports` warning)
- [x] 10.3 Acknowledged (no change): the shortcut glyph's `<Icon>` lazy-load sub-frame empty box is the design-agreed primitive swap (D1) — byte-identical lucide `keyboard` path, allowlisted so it always resolves, masked by the card's entrance fade; re-inlining the SVG would defeat the mandated primitive adoption
- [x] 10.4 `pnpm verify` (workspace) green + `pnpm test:e2e` smoke green; `openspec validate tidy-options-page` clean

## 11. Drop the appearance preview entirely (user-agreed, post-archive)

- [x] 11.1 Remove the `{#if group === 'Appearance'}` preview block from `Options.svelte` template; remove the `import TabRow` import; remove the `.preview` / `.preview-label` / `.preview-panel` CSS rules
- [x] 11.2 Remove the "renders the live preview rows folded into the Appearance card" test from `Options.test.ts`; fix any resulting biome format error
- [x] 11.3 Update `visual-system` delta spec: drop the preview-specific scenarios and revise the MODIFIED requirement to remove preview language
- [x] 11.4 Update `proposal.md` + `design.md` (D7) to record the drop decision
- [x] 11.5 `pnpm verify` (workspace) green
