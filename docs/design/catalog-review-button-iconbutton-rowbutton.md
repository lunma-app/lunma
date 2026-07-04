# Component review (global-first) — Button, IconButton, RowButton

> Global-first static review: findings are symptoms; fixes target the design-system root cause (@lunma/tokens / recipe / primitive / convention). Shared issues become one fix that repairs every primitive. Per-component findings are traced to their owning fix in the appendix. No live browser render — items marked "needs visual" should be confirmed in the catalog (pnpm --filter @lunma/extension catalog). Accessibility findings carry WCAG 2.2 success criteria.

## Executive summary

Three of the four findings resolve at the design-system layer, not in the primitives themselves: two shared conventions and one token/spec-boundary rule cover 2 of the 3 primitives (Button, RowButton), leaving exactly **one genuinely local** exception (RowButton's `ariaCurrent` prop-vs-render mismatch, an internal API inconsistency unique to that primitive). Every "system-likely" finding here is a case of one sibling already implementing a pattern the design language never codified — IconButton suppresses transforms under reduced motion but Button re-rolls the transition list without it; TabRow auto-sets `title` on truncating labels but RowButton doesn't. The repair is to promote those patterns to shared conventions so no future primitive can re-introduce the gap, rather than patching each control.

Do **DS-01 first**: it is the only WCAG-relevant finding (1.4.11 non-text contrast) and it is a straight token swap mandated by Lunma's own visual-system spec — free-floating interactive controls must draw their resting boundary from `--border-strong`, never the decorative `--border`. Landing DS-01 both fixes the highest-severity issue and establishes the interactive-boundary convention that any future bordered control inherits.

## Prioritized TODO (global-first)

- [ ] **P2** [DS DS-01] Interactive-control boundaries use --border-strong, not decorative --border _(reach 1, effort S)_
- [ ] **P3** [DS DS-02] Share reduced-motion transform-suppression convention (Button matches IconButton) _(reach 1, effort S)_
- [ ] **P3** [DS DS-03] Codify truncating-label auto-title convention (RowButton matches TabRow) _(reach 1, effort S)_
- [ ] **P3** [LOCAL EXCEPTION LOC-01] Render RowButton's ariaCurrent state or drop the prop/story/docstring claim _(effort S)_

## Design-system fixes — do these first

### DS-01 · Interactive-control boundaries must use --border-strong, not decorative --border  _(token)_

The secondary Button's only resting boundary is `border: 1px solid var(--border)` (Button.svelte:111); --border (oklch 0.300) is documented as intentionally soft/decorative and below the 3:1 non-text contrast floor, so the button box is barely distinguishable from its surface for low-vision users on every surface.

- **Root cause:** Button reaches for the decorative --border token as the visible boundary of an interactive control, violating visual-system spec.md:196-201 which mandates --border-strong (oklch 0.580, clears the WCAG 1.4.11 3:1 non-text floor) for free-floating non-field controls and forbids --border for that role. This is a token-selection convention gap, not a Button-only bug.
- **Fix (global):** Swap the interactive-control resting boundary from var(--border) to var(--border-strong) in Button's secondary variant, and codify the convention (spec.md:196-201) so every free-floating non-field control draws its boundary from --border-strong; --border stays decorative-only. Audit other bordered controls to confirm compliance.
- **Severity:** P2 · 1.4.11 — **Effort:** S — **Reach:** 1 primitive(s)
- **Repairs:** Button
- **Findings:** BUTT-01

### DS-02 · Share a reduced-motion transform-suppression convention across interactive primitives  _(convention)_

A user who requested reduced motion still gets an eased 120ms press transform on Button, diverging from IconButton and from Lunma's binding reduced-motion policy (no AA breach — 2.3.3 is AAA — but a policy/consistency gap).

- **Root cause:** IconButton drops its transform transition under prefers-reduced-motion (IconButton.svelte:118-126) but that pattern was never promoted to a shared convention, so Button re-rolls its `transform var(--motion-fast)...` transition list (Button.svelte:65-69,77-81) with no @media (prefers-reduced-motion: reduce) block. --motion-fast (120ms) is not among the tokens the global reduced-motion block collapses (tokens.css:409-417), so the press-scale still animates.
- **Fix (global):** Establish one reduced-motion transform-suppression convention (either extend the global reduced-motion block in tokens.css to neutralize --motion-fast transforms, or a shared primitive pattern) and apply it to Button so the press transform is dropped under prefers-reduced-motion, matching IconButton. Any transform-animating primitive inherits it.
- **Severity:** P3 · 2.3.3 (AAA, advisory) — **Effort:** S — **Reach:** 1 primitive(s)
- **Repairs:** Button
- **Findings:** BUTT-02

### DS-03 · Codify a truncating-label auto-title convention so ellipsised text is hover-revealable  _(convention)_

A truncated RowButton label offers no hover reveal of the full text unless the consumer separately remembers to pass `title` — a sighted-hover gap latent today (short 'New tab' label) but real for any future long-label consumer. The pattern is duplicated-and-missing across two primitives.

- **Root cause:** TabRow auto-sets `title={title}` on its truncating title button (TabRow.svelte:169), but that auto-title pattern for ellipsised labels was never made a shared convention, so RowButton — which also truncates (`overflow:hidden;text-overflow:ellipsis;white-space:nowrap`, RowButton.svelte:101-107) — leaves `title` passthrough-only (RowButton.svelte:28) and never defaults it to `label`.
- **Fix (global):** Adopt a shared convention that any primitive rendering a truncating label defaults `title` to that label's text (fallback to a passed-in `title`). Wire RowButton to default `title` to `label`; align it with TabRow's existing behaviour so the two primitives implement the same rule rather than one-off each.
- **Severity:** P3 — **Effort:** S — **Reach:** 1 primitive(s)
- **Repairs:** RowButton
- **Findings:** ROWB-03

## Component-specific fixes — exceptions

### LOC-01 · RowButton

RowButton exposes an `ariaCurrent` prop (and ships a dedicated 'current' catalog story) but renders zero visual treatment for it — no `[aria-current]` rule and no active/selected state in the scoped style (RowButton.svelte:37-108), so an `ariaCurrent="page"` row is pixel-identical to a default row and the docstring/story claim of a visual 'wash' is false.

- **Fix (local):** Wire a resting current/selected treatment for `[aria-current]` using the already-existing hue tokens (--space-c-soft / --space-c-dim) so the rendered state matches the prop, the docstring, and the catalog story — or, if no visual state is intended, remove the prop, story, and docstring claim. Prefer wiring the state.
- **Why local (not systemic):** This is an internal self-contradiction unique to RowButton's own API surface — a prop + catalog story + docstring all promise a state the component never renders. No other primitive exposes `ariaCurrent` without a matching state, and the shared layer it would draw from (the --space-c-* hue tokens) already exists and is simply unwired here, so nothing shared is broken; the defect and its fix are intrinsic to this one primitive.
- **Severity:** P3 — **Effort:** S — **Finding:** ROWB-01

## Appendix — findings by primitive (traceability)

### Button (Atoms)

- **BUTT-01 · P2 · contrast-non-text · 1.4.11 Non-text Contrast (AA)** — The `secondary` variant's only resting visual boundary is `border: 1px solid var(--border)` (Button.svelte:111). `--border` (tokens.css:130, oklch 0.300) is documented at tokens.css:125-129 as intentionally soft/decorative and BELOW the WCAG 1.4.11 3:1 non-text floor; `--border-strong` (0.580) is the token lifted to clear it for interactive-control boundaries.  → **DS-01**
  - _Impact:_ At rest the secondary button box is barely distinguishable from the surface behind it for low-vision users. visual-system spec.md:196-201 is explicit: a free-floating non-field interactive control's boundary SHALL use `--border-strong`, and "The decorative --border SHALL NOT be used as the visible boundary of an interactive control." This breaks Lunma's own stricter internal rule on every secondary button on every surface.  ·  _Scope:_ system-likely  ·  _Root cause:_ Convention/token choice: Button reaches for the decorative `--border` instead of the interactive-boundary token `--border-strong` mandated by visual-system spec.md:196-201.
  - _Evidence:_ Button.svelte:111 `border: 1px solid var(--border)`; tokens.css:125-130 (comment states --border sits below the 3:1 floor by design; --border-strong is the lifted token); visual-system spec.md:196-201, 260-264 (Interactive-control boundary scenario).
- **BUTT-02 · P3 · reduced-motion · 2.3.3 Animation from Interactions (AAA)** — `.btn` (Button.svelte:65-69) and `.btn[data-size='sm']` (77-81) both list `transform var(--motion-fast) var(--ease-standard)`, and Button has NO `@media (prefers-reduced-motion: reduce)` block. `--motion-fast` (120ms) is not among the tokens the reduced-motion block collapses (tokens.css:409-417 only touches --motion-base/-slow/-space-switch), so the `:active scale(var(--press-scale))` press still animates over 120ms under reduced motion.  → **DS-02**
  - _Impact:_ A user who requested reduced motion still gets an eased press transform. Small (3% scale, 120ms, only while held) — WCAG covers this only at 2.3.3 (AAA), so no AA breach — but it diverges from the sibling IconButton, which deliberately drops the transform transition under reduced motion (IconButton.svelte:118-126), and from Lunma's binding reduced-motion policy.  ·  _Scope:_ system-likely  ·  _Root cause:_ Convention: the reduced-motion transform-suppression pattern IconButton implements is not shared, so Button re-rolls the transition list without it.
  - _Evidence:_ Button.svelte:65-69, 77-81 include `transform …`; no reduced-motion media query in the file; IconButton.svelte:118-126 is the reference pattern; tokens.css:409-417 collapses only the three longer motion tokens.

  <details><summary>Deliberate (confirmed, not bugs)</summary>

  - Primary variant takes the fixed cool `--primary`/`--primary-on` (not the per-Space `--accent`), reserved for the single highest-emphasis CTA; white-on-primary tuned to 4.57:1 (dark) AA. — tokens.css:159-166; Button.svelte:89-98
  - Disabled uses an explicit muted fill (`--disabled-bg` + `--text-faint`) rather than blanket opacity, placed after the variant rules to win on equal specificity; disabled text is WCAG-exempt and the control is inert via native `disabled`. — Button.svelte:137-148
  - Focus-visible ring is the tokenized convention (`--focus-width` solid `--focus-color`, `--focus-offset`) that auto-rebinds to the active Space hue in `.sidebar`. — Button.svelte:84-87; visual-system spec.md
  - Press feedback via shared `--press-scale`; radii/heights via `--r-md`/`--control-h-md`/`--control-h-sm`; no raw design literals (token-consumption contract + Stylelint gate). — Button.svelte:54-56, 73-76, 105, 118, 134
  - sm=28px and md=36px both clear the 2.5.8 24px minimum target height; sm intentionally uses `--text-xs` for compact/tertiary affordances. — Button.svelte:73-82; Props doc 6-9
  - Primary hover uses `filter: brightness(1.06)` as a deliberate gloss for the raised CTA (comment: semibold + top highlight + short drop), intentionally distinct from the background-token hover of secondary/ghost. Divergent by design, not an inconsistency defect. — Button.svelte:95-103
  </details>

### IconButton (Atoms)

_No issues found._


  <details><summary>Deliberate (confirmed, not bugs)</summary>

  - ICON-01 (no pressed/selected/aria-pressed state) contradicts two documented deliberate decisions and is not a real gap. (1) The ui-accessibility spec's 'Visually-conveyed selection or active state has a programmatic equivalent' requirement scopes the aria-current/aria-pressed obligation to primitives that DO convey state visually — it enumerates TabRow, LensRow, FaviconTile, Avatar and deliberately omits IconButton. IconButton renders no selected/active tint, so there is no SC 4.1.2 gap: there is nothing conveyed by colour that lacks a programmatic equivalent. (2) The minimal-API posture is explicitly documented (IconButton.svelte:26-28: 'deliberately kept minimal, leaving room for future fills without re-rolling'). Adding a pressed state now is speculative API for a case no in-repo consumer needs — the star/bell/Favourite story rows are demo icons, not stateful toggles. CLAUDE.md bans 'scaffolding no named change consumes.' When a real toggle consumer lands, the state hook ships in that change (component-library policy). FaviconTile's own aria-current/aria-pressed obligation is separate and already satisfied. — openspec/specs/ui-accessibility/spec.md (selection-state requirement enumerates TabRow/LensRow/FaviconTile/Avatar, omits IconButton); IconButton.svelte:12-34,66-77 (no visual selected state); CLAUDE.md component-library + minimal-API policy
  </details>

### RowButton (Atoms)

- **ROWB-01 · P3 · states-completeness** — RowButton exposes an `ariaCurrent` prop (and ships a dedicated "current (aria-current)" catalog story) but renders ZERO visual treatment for it — there is no `[aria-current]` rule and no active/selected state in the scoped `<style>` (RowButton.svelte:37-108). A row with `ariaCurrent="page"` is pixel-identical to a default row, so the "current" story variant is indistinguishable from "default" in the catalog.  → **LOC-01**
  - _Impact:_ The docstring ("...when the active treatment is otherwise a CSS wash", RowButton.svelte:10-13) and the story comment ("so it isn't conveyed by the wash alone", stories:58-59) both assert a visual wash that does not exist, making the prop + catalog example misleading. Latent, not a live user-facing break: the only shipping consumer (sidebar New Tab row, App.svelte:722) never sets `ariaCurrent`, and the catalog nav the docstring cites rolls its own `.cat-nav-item` button (Catalog.svelte:135-137) rather than RowButton — so no surface currently renders a stateless current-row. No hard WCAG SC applies (nothing uses colour-alone to convey state; 1.4.1 is N/A).  ·  _Scope:_ local  ·  _Root cause:_ primitive:RowButton exposes an `ariaCurrent` prop with no matching visual state — the hue tokens (`--space-c-soft`/`--space-c-dim`) exist and are simply unwired here; the inconsistency (prop + story + docstring vs no rendered state) is self-contained to this primitive, not a missing shared token/recipe.
  - _Evidence:_ RowButton scoped style has :hover / :active / :focus-visible / :disabled rules but no `[aria-current]` rule (RowButton.svelte:62-81); the required space tokens already exist and are used elsewhere — cf. TabRow.svelte:236-239 `.tab-row.active { background: var(--space-c-soft); box-shadow: inset 0 0 0 1px var(--space-c-dim); }`. ariaCurrent is a bare passthrough at RowButton.svelte:30.
- **ROWB-03 · P3 · api-ergonomics** — The label truncates with an ellipsis (`.label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap }`, RowButton.svelte:101-107) but RowButton does not default `title` to `label` — `title` is passthrough-only (RowButton.svelte:28), so a truncated label offers no hover reveal unless the consumer separately remembers to pass `title`.  → **DS-03**
  - _Impact:_ Sighted-hover gap only: a truncated row gives no way to read the full text on hover. Screen-reader users are unaffected — the accessible name is the full visible label (button text content). Latent for the current shipping consumer (the "New tab" label is short and never truncates), but real for any future long-label consumer. Contrast the sibling TabRow, which auto-sets `title={title}` on its title button (TabRow.svelte:169).  ·  _Scope:_ local  ·  _Root cause:_ primitive:RowButton `title` not defaulted to `label` — a self-contained gap; there is no shared truncating-label auto-title recipe (TabRow handles it per-component), so the fix belongs in this primitive.
  - _Evidence:_ RowButton.svelte:28 `{title}` is passthrough with no `label` fallback; truncation at RowButton.svelte:101-107; TabRow.svelte:169 auto-titles its truncating label.

  <details><summary>Deliberate (confirmed, not bugs)</summary>

  - Transparent resting background + dark-first row treatment, with the hover wash `var(--space-c-soft, var(--surface-2))` falling back to the neutral surface outside a Space scope — matches TabRow and the immersive Space-hue system. — RowButton.svelte:62-66; TabRow.svelte:226-228; tokens.css space-* hue tokens
  - Icon slot sized to `--favicon-size` (16px) with the Icon rendered at size 16 — deliberate icon-to-favicon alignment with TabRow's favicon slot, not a hardcoded magic number. — RowButton.svelte:83-95; comment at lines 83-84
  - Focus ring uses the tokenized convention (`--focus-width` / `--focus-color` / `--focus-offset`), which auto-rebinds to the active Space hue inside `.sidebar` — no re-rolled ring; meets 2px thickness for 2.4.13. — RowButton.svelte:73-76; tokens.css:304-307
  - 120ms `--motion-fast` transitions are background/color/opacity cross-fades (no movement), so they are acceptable under prefers-reduced-motion; the reduced-motion block intentionally only collapses the longer movement tweens. — RowButton.svelte:57-59,94; tokens.css:409-417
  - Composed Icon is decorative (`aria-hidden` when no label) and the accessible name comes from the visible `label` text child — correct per the label-vs-ariaLabel convention. — Icon.svelte:97-107; ui-accessibility spec Requirement: label vs ariaLabel
  - Disabled `opacity: 0.4` is the transparent-control disabled convention shared with IconButton (identical treatment); Button's explicit `--disabled-bg`/`--text-faint` is scoped to filled-background controls. Not a divergence to fix. — RowButton.svelte:78-81; IconButton.svelte:113-115; Button.svelte:139-145
  </details>
