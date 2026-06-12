# Tasks — sidebar-firstrun-options-polish

## 1. Fresh-Space welcome

- [x] 1.1 Create `apps/extension/src/sidebar/Welcome.svelte` (+ `Welcome.test.harness.svelte` + `Welcome.test.ts`): ghost-outline tiles (feature-local CSS, no dashed borders), serif headline "Make this Space yours.", brand-voice hint covering drag-to-favorite + `Option+D` (design D3).
- [x] 1.2 Compose it from `FaviconRow.svelte` in the placeholder slot when `faviconRow` is empty AND the active Space has zero pinned bookmarks; suppress the pinned empty-state row while it shows (shell point 3 exception); standard placeholder with no active Space. Unit tests for all four composition states (both empty / favorites only / pinned only / no active Space).
- [x] 1.3 Drag contract: the welcome brightens on pinned/temp drag-over (`--space-c-soft`, `--motion-fast` `--ease-standard`) and a drop creates the first favorite (the placeholder's existing zone); no pin zone added — verify drag-into-panel pinning still works while the welcome shows. Harness/e2e test for the drop.
- [x] 1.4 Dissolve behavior: first favorite/pin returns the sidebar to the populated layout + remaining single-area state; the welcome never swipes with the carousel. Unit tests.

## 2. Quieter empty states + notice

- [x] 2.1 Restyle the favorites placeholder and pinned empty row: remove dashed borders, apply the soft ghost-outline + tint treatment (presentation only — specced behavior unchanged). Visual check at all three tints.
- [x] 2.2 Restyle `FirstRunNotice.svelte` to the compact notice (icon + short body carrying all three mandated facts + inline "Got it" / "Manage in settings"; corner ✕ dropped — "Got it" is the dismiss). Semantics, gating, facts, and dismissal writes untouched; behavioral test assertions stay as-is, presentation-level assertions (e.g. the ✕ testid) updated to match.

## 3. Options editorial pass

- [x] 3.1 Group headings → `--font-display` `--text-xl` sentence case with the identity-hue treatment; descriptions muted; `--space-6`/`--space-3`/`--space-4` rhythm per design D5. No control/registry changes; stylelint token rules stay green.
- [x] 3.2 Wordmark header at brand presence (display serif + glow dot per the existing requirement — verify, adjust size/spacing only).
- [x] 3.3 Contrast: serif headings + identity tint pass WCAG-AA over the aurora at every tint level (extend the automated contrast tests if headings introduce a new fg/bg pair).

## 4. Verification + docs

- [x] 4.1 Update `docs/04-capabilities.md`: sidebar composition (welcome state, empty-state treatment, notice presentation) + options-page description.
- [x] 4.2 `pnpm verify` green at the root; `pnpm test:e2e` green; dev-load eyeball pass of first-run (fresh profile), partially-populated, and populated sidebars + the options page at all tints; before/after screenshots for the review record.
