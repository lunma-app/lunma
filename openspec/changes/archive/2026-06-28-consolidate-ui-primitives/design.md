## Context

The `add-component-catalog` change put all ~40 `src/ui` primitives in one browsable view, which exposed redundancy the dispersed call sites hid (usage counts gathered by grep over `src/`, excluding the primitives' own files + `*.test.harness.svelte`):

- `Stack` — **0** consumers (only its catalog story).
- `Pill` (1) and `Chip` (6) — both small inline tokens.
- `BitsContextMenu` (4) and `BitsMenu` (3) — one menu model, two triggers. `menu-types.ts` already documents `MenuItem` as belonging to a `Menu`.
- `Divider` (1) and `RowButton` (1) — thin one-use wrappers, both consumed only by `sidebar/App.svelte`.

The kept set (row family `ResultRow`/`LensRow`/`FolderRow`/`TabRow`; review `Avatar`/`ReviewerRail`/`Diffstat`/`CardHeading`) is single-use-but-deliberate: each carries distinct behaviour (rename, drift, badges, overflow) that a merge would only complicate.

Constraints that shape this design:
- **No complexity creep.** A survivor must stay simple; "merge" is only justified when the union is *not* a mega-component.
- **Component-library policy.** Feature surfaces compose primitives and never re-roll buttons/tooltips/tiles — so a removed control cannot simply be inlined as bespoke styled markup in a surface; it must fold into a primitive.
- **Catalog parity.** `stories-coverage.test.ts` asserts one story per `src/ui` primitive; the set shrinking must keep it green (delete/merge the affected stories in the same change).
- **No behaviour regression.** Every migrated consumer renders and behaves as before; `pnpm verify` (primitive tests + catalog guard) and the e2e smoke gate it.

## Goals / Non-Goals

**Goals:**
- Shrink the primitive set ~40 → ~36 with zero new prop complexity and no consumer regression (`Stack`/`Pill`/`Divider` removed; two menus → one `Menu`; `RowButton` kept after review).
- One token primitive (`Chip`) and one menu primitive (`Menu`) instead of two each.
- Keep the catalog green and its stories representative of the new set.

**Non-Goals:**
- Merging the row family or the review primitives (would force a mega-component — explicitly out).
- Re-theming or restyling survivors beyond what the merge requires.
- Touching the catalog mechanism (auto-discovery, controls, coverage guard) — only its story files change.

## Decisions

**D1 — Remove `Stack` (dead code).** Zero `src/` consumers; delete the primitive, `Stack.test.harness.svelte`, `catalog/stories/ui/Stack.stories.svelte`, and any test. No consumer migration. *Alternative:* keep it as a convenience util — rejected; an unused primitive is exactly the bloat this change removes.

**D2 — Merge `Pill` → `Chip`.** `Chip` gains `hue?: number` (OKLCH hue; when set, the chip renders the hue-tinted status/verdict token `Pill` produced, using the theme-aware `--accent-text-l`/`--accent-fill-a` pattern `Pill` already used so WCAG-AA holds across the hue range and both themes) and `size?: 'sm' | 'md'` (`md` = the heavier verdict size). `Pill`'s content is plain text (`{tk.priority}` — verified the sole usage passes only text), so `Chip`'s existing `label: string` covers it — no snippet-children needed. The one consumer (`launcher/lenspage/OverviewPage.svelte`) migrates `<Pill hue={h}>{x}</Pill>` → `<Chip label={x} hue={h} />`. `hue` and `tone` are mutually exclusive (hue wins when set); documented in the prop. **Box-model caveat (spec review):** `Chip`'s base geometry differs from `Pill`'s (`Chip` has a fixed `--control-h-xs` height + `--text-xs` font; `Pill` has no fixed height, larger padding, `--text-2xs`/`--text-xs 600`). The `hue`/`size` path must therefore fully override height/padding/font, not merely add the colour recipe — so "renders like `Pill`" is a thing to verify visually, not assume. **WCAG guard:** the moved hue recipe (`oklch(var(--accent-text-l) 0.1 h)` on `oklch(0.55 0.13 h / var(--accent-fill-a))`) is currently **ungated** (`contrast.test.ts` doesn't cover `Pill`, which has no test). This change adds a contrast test over the priority/verdict hues × both themes so the AA-preservation claim is verified, not asserted. *Alternative:* a third unified `Tag` primitive absorbing both — rejected; `Chip` is the more-used name and already the token home, so growing it (two optional props) is lighter than a rename churn across 6 sites.

**D3 — Merge the two menus → `Menu` with a `trigger` discriminator.** New `apps/extension/src/ui/Menu.svelte` exposes the full shared surface carried by both today (`items: MenuItem[]`, `label?`, `headerKind?`, `headerTitle?`, `testid?`, bindable `open?`, `onOpenChange?`) plus the one genuinely-new prop `trigger: 'kebab' | 'context'`:
- `kebab` — renders the kebab `IconButton` trigger (`icon?`, `label?`), the former `BitsMenu`. It is a **floating dropdown** (bits-ui `DropdownMenu`, portaled, `align="end"`) — matching the shipped code, NOT the "in-place row-morph" some specs stale-ly describe (see D5 + the `spaces-and-tabs` delta, which this change corrects to the dropdown reality).
- `context` — takes the right-clickable region as `children` (spread trigger props), the former `BitsContextMenu`, a cursor-anchored floating popover.
Internally it branches to the matching bits-ui base (`DropdownMenu` vs `ContextMenu`); the consumer API is one component. All 7 sites migrate; `FolderRow` (a primitive consuming `BitsMenu`) switches to `<Menu trigger="kebab" …>`. The drill-in for sub-views is data-driven via `MenuItem.submenu` (there is **no** `panel`/`panelTitle` prop on the menu — a phantom the `tab-row-menu` spec text carries; left as-is since it's outside this rename's scope, but not added to `Menu`). *Alternative:* keep two thin components sharing an inner `MenuBody` — rejected; the trigger split is one prop, not enough to justify two public primitives, and `tab-row-menu`/`menu-types` already speak of a single `Menu`.

**D4 — Inline `Divider`; KEEP `RowButton`.** `Divider` is a layout rule (`<hr>` + optional trailing action), not a re-rolled control, so its one usage in `sidebar/App.svelte` is inlined as a plain token-styled rule with its trailing action composed from a primitive; `Divider` + harness + story are deleted. **`RowButton` is kept** (revised after spec review): it is not "just a layout" — it sets a row height (`--row-h`), a favicon-sized (`--favicon-size`) leading-icon slot so the glyph aligns to the adjacent temp rows' favicon column, an icon-slot hover-opacity transition, and the `--space-c-soft` row-hover wash. `Button` has none of these, and `children`-composition cannot box/treat the first child as that icon slot — so folding `RowButton` into `Button` would mean a real layout+icon-slot addition to a 21-consumer backbone for a single call site. Inlining into the surface is also out (re-rolls a styled button, violating the component-library policy). The least-bad option is to leave `RowButton` as the small purpose-built primitive it already is. *Alternatives:* `Button` `block` + leading-icon slot — rejected as backbone bloat; inline in `App.svelte` — rejected (policy). Net becomes ~36 (not ~35).

**D5 — Catalog + spec lockstep in the same change.** Delete the `Stack`/`Pill`/`Divider`/`RowButton`/`BitsContextMenu`/`BitsMenu` catalog stories; add one `Menu.stories.svelte`; extend `Chip.stories.svelte` with hue/size cells and `Button.stories.svelte` with a `block` cell. The `stories-coverage.test.ts` guard then passes against the smaller set with no mechanism change. The menu-rename deltas (`tab-row-menu`, `spaces-and-tabs`, `lunma-bookmark-bindings`) and `docs/architecture.md` land in lockstep. (`visual-system` is untouched — it names no affected primitive; the removed primitives are spec-silent and `Chip`'s new props are additive.)

## Visual language

This change ships surfaces (sidebar, lens overview, options), so the survivors must hold the immersive bar — and the merges must not regress it.

- **`Chip` with `hue`:** reproduces `Pill`'s hue-tinted token — the theme-aware `--accent-text-l` (label lightness) / `--accent-fill-a` (fill alpha) pattern that flips between dark/light themes, so a `hue=150` "Open" or `hue=25` "Blocked" chip stays WCAG-AA legible at every colour-intensity tier and in both themes. `size="md"` matches the verdict weight (`--text-xs`/600). No new colour values — the token recipe moves into `Chip`, and the `hue`/`size` path overrides `Chip`'s base height/padding/font (see D2) so the rendering matches `Pill`. Gated by a new contrast test, not assumed.
- **`Menu`:** preserves both entrances unchanged — the `context` trigger keeps the cursor-anchored floating popover with collision-clamping and the fast-tick entrance; the `kebab` trigger keeps the **floating dropdown** (`DropdownMenu`, `align="end"`) it ships today. Reduced-motion and the keyboard/ARIA + two-step delete-confirm contract from `tab-row-menu` are carried verbatim.
- **`RowButton` (kept):** unchanged — its row-height + favicon-aligned icon slot + Space-hue row-hover wash stay as the "New Tab" affordance.
- **Reduced-motion + contrast** hold at every intensity level for all survivors; the existing primitive contrast/motion tests cover `Menu`, and the **new** Chip-hue contrast test covers the migrated `Pill` recipe.

## Risks / Trade-offs

- **R1 — `Chip` label vs `Pill` snippet.** `Pill` accepted snippet `children`; `Chip` takes a `string` label. Mitigation: the sole `Pill` consumer passes plain text, so `label` suffices. If a future caller needs rich content, that is a separate enhancement — not blocked by this change.
- **R2 — One `Menu` over two bits-ui bases.** `context` and `kebab` use different bits-ui menus with different anchoring; a single API must not blur their behaviour. Mitigation: branch internally and keep the `tab-row-menu` contract (cursor anchor for `context`, kebab for dropdown); the existing `tab-row-menu` tests/e2e gate it. The 7-site migration is the largest blast radius — do it after the trivial removals.
- **R3 — Spec/name churn + morph-vs-dropdown reconciliation (`ContextMenu`/`RowMenu` → `Menu`).** Three specs + `docs/architecture.md` name the old menus; their requirements update to `Menu` (`trigger`). The rename is behaviour-neutral, BUT the `spaces-and-tabs` kebab requirements (and the FolderRow editing requirement) describe an "in-place row-morph drawer … NOT a floating dropdown" the code never implemented (it ships a portaled `DropdownMenu`). Mitigation: this change corrects that spec text to the shipped floating-dropdown reality — a deliberate, surfaced behaviour-text fix (no-silent-drift), not a code change. An implementer building `Menu`'s `kebab` trigger follows the dropdown, matching today's `BitsMenu`.
- **R4 — `RowButton` removal would bloat `Button`.** Folding `RowButton`'s row-height + favicon-aligned icon slot + hover wash into `Button` would complicate a 21-consumer backbone for one call site, and `children`-composition can't replicate the icon-slot treatment. Resolution (post-review): **keep `RowButton`** as a small purpose-built primitive; net is ~36, not ~35. Only `Divider` is removed from this pair.
- **R5 — Catalog guard red mid-migration.** Removing a primitive without removing its story (or vice-versa) fails the guard. Mitigation: each removal deletes primitive + story together; `pnpm verify` after each step.

## Migration Plan

Ordered by blast radius, verifying after each:
1. **Remove `Stack`** (0 consumers) — delete primitive + harness + story + test.
2. **`Pill` → `Chip`** — extend `Chip` (`hue`/`size`) + its story; migrate `OverviewPage`; delete `Pill` + harness + story.
3. **Menus → `Menu`** — add `Menu` + harness + story; migrate all 7 sites (incl. `FolderRow`); delete `BitsContextMenu`/`BitsMenu` + harnesses + stories.
4. **Inline `Divider`** — inline its one usage in `sidebar/App.svelte` as a token-styled rule + composed action; delete `Divider` + harness + story. (`RowButton` untouched.)
5. **Docs/specs lockstep** — the three menu-rename deltas (`tab-row-menu`, `spaces-and-tabs`, `lunma-bookmark-bindings`), `docs/architecture.md`; run `pnpm verify` (incl. catalog guard) + `pnpm test:e2e`.

Rollback = restore the deleted primitives + revert consumer edits; no data/schema/runtime change is involved.

## Open Questions

- None blocking. Both apply-time judgements raised by the pre-implementation spec review are now resolved in these artifacts: `RowButton` is **kept** (not folded into `Button`), and the kebab menu's spec is **corrected to the shipped floating-dropdown reality** (not a morph). The morph→dropdown spec correction is a deliberate, surfaced behaviour-text reconciliation of pre-existing drift.
