# Component review (global-first) — Button

> Global-first static review — findings are symptoms; fixes target the design-system root cause (token / recipe / primitive / convention). "needs visual" items confirm in the catalog (`pnpm --filter @lunma/extension catalog`); a11y findings carry WCAG 2.2 SC.

## Executive summary

Two systemic fixes at the shared token/convention layer resolve 2 of 3 findings on the single reviewed primitive (Button); only 1 finding is genuinely local (a self-contained CSS duplication). Both systemic issues stem from Button improvising values the design language should own — a control boundary that should use the `--border-field` token the repo adopted in THEME-02, and a primary hover that should read a `--primary-hover` token instead of a raw `brightness()`. Do DS-01 first: it is the P2 contrast fix and swapping secondary's boundary to `--border-field` is the highest-leverage repair, restoring the 3:1 UI-component floor for the outline control.

## Prioritized TODO (global-first)

- [ ] **P2** [DS DS-01] Boundary secondary/outline control on --border-field _(reach 1, effort S)_
- [ ] **P3** [DS DS-02] Add --primary-hover token, drop brightness() magic value _(reach 1, effort S)_
- [ ] **P3** [LOCAL EXCEPTION LOC-01] Remove duplicated transition in Button sm override _(effort S)_

## Design-system fixes — do these first

### DS-01 · Secondary/outline control boundary uses --border-field, not decorative --border  _(convention)_

Secondary outline button's boundary falls below the 3:1 UI-component contrast floor, so its clickable region is unidentifiable on transparent fill.

- **Root cause:** Button's secondary variant draws its only boundary with the decorative --border token (dividers/edges) instead of the --border-field token adopted for form controls in THEME-02.
- **Fix (global):** Swap `border: 1px solid var(--border)` to `var(--border-field)` on `.btn[data-variant='secondary']` (Button.svelte:111), enshrining the convention that outline/form controls boundary on --border-field.
- **Severity:** P2 · 1.4.11 — **Effort:** S — **Reach:** 1 primitive(s)
- **Repairs:** Button (apps/extension/src/ui/Button.svelte)
- **Findings:** BUTT-01

### DS-02 · Add --primary-hover token; retire raw brightness() magic value  _(token)_

Primary hover's raw brightness magic value violates the src/ui no-hard-coded-values contract and cannot be tuned centrally.

- **Root cause:** No --primary-hover token exists, so the primary variant improvises `filter:brightness(1.06)` while secondary/ghost hovers swap tokenized fills.
- **Fix (global):** Add a `--primary-hover` fill token to @lunma/tokens and set `background: var(--primary-hover)` on `.btn[data-variant='primary']:hover` (Button.svelte:100-103), dropping the `filter` line.
- **Severity:** P3 — **Effort:** S — **Reach:** 1 primitive(s)
- **Repairs:** Button (apps/extension/src/ui/Button.svelte)
- **Findings:** BUTT-05

## Component-specific fixes — exceptions

### LOC-01 · Button (apps/extension/src/ui/Button.svelte)

The sm override re-declares the identical 4-property transition already on .btn, so the copies drift if only one is edited.

- **Fix (local):** Delete the redundant `transition` block from `.btn[data-size='sm']` (Button.svelte:77-81); sm only overrides height/padding/font and inherits the transition from .btn.
- **Why local (not systemic):** Intrinsic to Button's own sm-size CSS override — a duplicated declaration within one primitive's stylesheet with no token, recipe, or cross-primitive root cause.
- **Severity:** P3 — **Effort:** S — **Finding:** BUTT-06

## Appendix — findings by primitive (traceability)

### Button (apps/extension/src/ui/Button.svelte)

- **BUTT-01 · P2 · color-contrast · 1.4.11 Non-text Contrast (AA)** — Secondary (default) outline button's only boundary is decorative --border (~0.300L dark / ~0.875L light), below the 3:1 UI-component floor, so an outline-only control on transparent fill fails to identify its clickable region. _(Button.svelte:111 `border:1px solid var(--border)`; tokens.css:130,456 --border; tokens.css:125-131 THEME-02 lifted controls to --border-field for 3:1)_  → **DS-01** _(system-likely)_
- **BUTT-05 · P3 · consistency** — Primary hover uses a raw `filter:brightness(1.06)` magic value while secondary/ghost hover swap tokenized fills, leaving one hover state un-tokenized against the src/ui no-hard-coded-values contract. _(Button.svelte:102 `filter:brightness(1.06)` vs :114 var(--surface-2), :129 var(--hover))_  → **DS-02** _(system-likely)_
- **BUTT-06 · P3 · maintainability** — The sm rule re-declares the identical 4-property transition already on .btn; the redundant copy drifts if only one is edited. _(Button.svelte:65-69 and :77-81 identical transition blocks)_  → **LOC-01** _(local)_

  <details><summary>Deliberate (confirmed, not bugs)</summary>

  - BUTT-04 fixed --control-h-md height is deliberate tokenized geometry that also clears the 2.5.8 24px target minimum; changing height→min-height fights that decision. — Button.svelte:56,74; tokens.css:315-316; deliberate-decisions geometry/target-size
  </details>
