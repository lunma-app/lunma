# Catalog fix roadmap (from catalog-review.md)

Batches the **42 systemic + 22 local** fixes from `docs/design/catalog-review.md`
into coherent, dependency-ordered **OpenSpec changes**. Global-first fixes edit
*shared layers* (`@lunma/tokens`, `recipes.css`, base primitives), so they are
**not** parallelizable — most share the same files and have add-token-then-consume
ordering. Land one change at a time: `openspec-propose` → TDD (RED/GREEN) →
`pnpm verify` (+ visual check in `pnpm --filter @lunma/extension catalog` for
contrast/motion) → archive → next.

**Prerequisites:** (1) current catalog branch committed; (2) triage below resolved
— the report is a *proposal*, not a mandate.

## Triage first (resolve before scheduling)

- **DS-35 "Migrate Select to bits-ui Popover positioning" — REJECT / reinterpret.**
  `bits-ui` is not a Lunma dependency (it's slotterpro's stack). Reviewer
  context-bleed. If Select's popover positioning is genuinely wrong, refile as
  "fix Select popover positioning with Lunma's own approach"; otherwise drop.
- Skim the P3 corpus for taste-only items; downgrade/defer any that aren't real
  defects before turning them into work.

## Ordered changes

### Phase 1 — P1 correctness & a11y (do first)

1. **`catalog-contrast-tokens`** — colour-role tokens. **DS-01** (interactive
   boundary → `--border-strong`/`--border-field`), **DS-02** (theme-flipping
   `accent-on`/`accent-label`), **DS-03** (danger-text + `--danger-soft`),
   DS-04 (AA status foregrounds), DS-05 (space-scope light-L cap on hue
   foregrounds/rings), DS-25 (neutral/muted status token). All edit `tokens.css`;
   clears WCAG 1.4.11 / 1.4.3. Contains the P1 trio. No upstream deps. **Start here.**
2. **`primitive-aria-fixes`** — **DS-42** (P1 LensRow `aria-busy`), DS-40 (listbox
   option ownership, no bare `<li>`), DS-23 (decorative-glyph accessible-name
   convention), DS-32 (dev-mode name-or-warn on nameable primitives). Pulls the
   last P1 forward; small, high-value semantics.

### Phase 2 — high-reach systemic

3. **`design-token-scales`** — **DS-10** (icon-size scale; reach 6), DS-14 (unify
   form-field metrics on `--control-h-*`/`--r-*`; reach 4), DS-12 (consume
   `--r-*`/`--space-*`, no raw geometry; reach 4), DS-11 (small-tile 26px token),
   DS-13 (line-height/leading scale), DS-09 (`--motion-spin` cadence token).
   Add-token-then-consume within the change. Highest aggregate leverage.
4. **`i18n-primitive-copy`** — **DS-22** (primitives receive translated copy, not
   inline English; reach 5). Touches the `i18n` capability. Self-contained.
5. **`overflow-and-layout`** — **DS-31** (shared long-content overflow contract;
   reach 5), DS-24 (InlineError drops intrinsic top margin), DS-30 (shared
   micro-label recipe).
6. **`input-and-glass-recipes`** — DS-07 (tokenized input focus-halo recipe;
   reach 5), DS-06 (surfaces include `.lunma-space-scope` for `--space-c*`),
   DS-19 (strong-glass modifier on `.lunma-glass`/Surface), DS-37 (hue-tinted
   accent-pill fill recipe), DS-33 (`::placeholder{--text-faint}`), DS-34 (shared
   field-label for Select consumers), DS-36 (Select disabled-option styling).
   **Depends on #1** — DS-37 needs the `accent-on` token.

### Phase 3 — motion + keyboard/focus

7. **`motion-recipes`** — DS-08 (auto-suppress transform transitions under
   reduced-motion; reach 4), DS-16 (shared hued ghost `:active` press recipe),
   DS-21 (compose shared aurora recipe + fix intensity ramp).
8. **`keyboard-and-focus`** — DS-27 (`scrollFade` scroll-padding for roving focus;
   reach 4), DS-29 (shared listbox roving-keyboard util, Home/End), DS-39
   (announced zero-results for searchable listboxes), DS-41 (header/action buttons
   meet 24px target floor), DS-28 (coarse-pointer fallback for hover-reveal),
   DS-17 (compose IconButton for overlay close controls), DS-18 (route scrims
   through `--scrim`/`--scrim-blur`).

### Phase 4 — catalog & misc

9. **`catalog-review-followups`** — DS-38 (stories exercise every axis/state),
   DS-20 (contrast assertion test for glass-on-aurora muted text), DS-26 (Icon
   null-resolution fallback glyph). Catalog/test-facing. (DS-35 triaged out.)

### Phase 5 — local exceptions

10. **`primitive-cleanup`** — the 22 `LOC-*` fixes, each intrinsic to one
    primitive. Mostly P3 doc/comment/small tweaks (LOC-06/07/08/09/10/11/13/18…);
    a few substantive to break out or handle carefully: LOC-01 (AccountConnectField
    distinct Token field name), LOC-02 (EntityBadge test harness + `.test.ts`),
    LOC-03 (ReviewerRail key on unique id), LOC-12 (Menu submenu semantics — may
    warrant its own change), LOC-16 (autocomplete on the PAT field). These *are*
    independent (distinct files) — the only place worktree-isolated parallelism
    is safe — but they're small enough for one sequential change.

## Sequencing notes

- **Dependencies:** #1 → #6 (accent tokens). Otherwise the phases are loosely
  independent; do Phase 1 (P1s) first, then order by reach × severity.
- **Blast radius:** the token/recipe changes ripple across every surface — the
  automated WCAG-AA contrast test + a manual catalog visual pass are the gates,
  not just `tsc`/lint.
- **Don't fan-out execution.** A parallel "fix-all" workflow would conflict on the
  shared token/recipe files and skip OpenSpec + gates. The parallel win was
  *finding* the work; *fixing* it is controlled sequential engineering.
- A one-shot planning agent could refine this grouping against each fix's full
  detail (this roadmap is title-level); the execution stays hand-driven.
