# Design — sidebar-firstrun-options-polish

## Context

First run stacks three instructional surfaces (favorites ghost placeholder, pinned empty row, auto-archive disclosure card) in a ~360px-wide panel — visual overload at the exact moment the product must feel calm and premium. The options page is functionally complete (settings registry, live preview, glass ramp) but typographically flat: every group reads at the same weight, nothing carries the serif identity. Both fixes are presentation-led with one real behavioral change (the consolidated welcome).

## Goals / Non-Goals

**Goals:**

- A fresh user's sidebar reads as one warm invitation, not three notices.
- Drag affordances appear when dragging; the resting state stays quiet.
- The auto-archive disclosure survives intact (legally/UX-wise it must disclose before acting) at a fraction of its visual weight.
- Options gains the editorial hierarchy of the brand (serif group identity, rhythm) with zero functional change.

**Non-Goals:**

- No onboarding flow/tour (a future change may own that).
- No changes to auto-archive semantics, copy, gating, or dismissal persistence.
- No options information-architecture changes (group order, controls, registry rendering stay).
- No new tokens or primitives.

## Decisions

**D1 — The welcome replaces, it doesn't add — and it lives in the fixed grid region.** When `faviconRow` is empty AND the active Space has zero pinned bookmarks, the fixed favicon-grid region (a sibling of the swiping carousel — it never translates with a swipe) renders the welcome in the placeholder's slot, and the pinned empty-state row inside the Space panel is suppressed (the Space header stays, reading calm with nothing beneath it until the divider). One block cannot literally span the fixed region and the per-Space panel, so the welcome owns the fixed slot and the panel goes quiet — the smallest structural change that ends the stacking. When exactly one area is empty, today's per-area states render unchanged; with no active Space (shell point 7), the standard placeholder renders, never the welcome. *Alternative:* placing the welcome inside the Space panel — rejected: it would leave the fixed grid region empty (violating its "not a bare bar and not nothing" rule), translate the favorites drop target with swipes, and pop in/out mid-swipe between a fresh and a populated Space.

**D2 — The welcome keeps the placeholder's drag contract; pinning keeps its own.** The block carries exactly the drag-over behavior the favorites placeholder owns today: it brightens under a pinned/temp drag, and a drop creates the first favorite. It adds **no pin drop zone of its own** — dragging into the pinned area inside the Space panel pins exactly as today (the panel's drop zones are untouched); the welcome *teaches* pinning through its copy instead. The first favorite (drop) or first pin (drag or `Option+D`) dissolves the welcome to the populated layout plus the remaining single-area state.

**D3 — Welcome copy speaks the brief; it ships as `Welcome.svelte`.** Headline (display serif, `--text-lg`): "Make this Space yours." Body (`--text-sm`, `--text-muted`): the brief's keeping-voice — drag a tab up to favorite it, pin what should stay (`Option+D`), everything else settles out on its own. One block, ≤3 short lines, ghost tiles above as the visual anchor (feature-local CSS outline shapes, the placeholder's precedent — not `FaviconTile` instances). Implemented as the sidebar feature component `apps/extension/src/sidebar/Welcome.svelte` (+ `Welcome.test.harness.svelte` + `Welcome.test.ts`, the sidebar's established pattern), composed by `FaviconRow.svelte` in the placeholder slot. *Alternative:* instructional bullets with icons — rejected as dashboard-speak; inlining the markup in `FaviconRow.svelte` — rejected: it would bloat the grid component with welcome concerns and break the one-component-one-file convention.

**D4 — Notice becomes a footnote, not a card.** The auto-archive disclosure (`apps/extension/src/sidebar/FirstRunNotice.svelte`) restyles from the boxed, titled card to a compact notice: icon + a short body that still carries all three spec-mandated facts (idle tabs archive automatically; the live idle threshold; the retention window) + "Got it" / "Manage in settings" as inline text actions, on a `--surface`-level fill with no border emphasis, in its current slot. "Got it" is the dismiss action the spec requires; the corner ✕ `IconButton` (`first-run-dismiss`) is dropped as redundant — the spec mandates *a* dismiss action and a settings action, both of which remain. All conditions, fact content, dismissal writes, and the settings link are untouched (`auto-archive` spec governs). *Alternative:* deferring the notice until the first sweep is imminent — rejected: changes disclosure semantics, out of scope.

**D5 — Options hierarchy via the existing vocabulary.** Group headings (`SEARCH`, `APPEARANCE`, …) re-set in `--font-display` at `--text-xl` sentence case with the identity-hue tint (the treatment Space names use), descriptions stay `--text-sm` muted, groups separated by `--space-6` so the page breathes; the wordmark header renders at the brand size with its glow dot (per the existing requirement). Controls, registry rendering, preview, and the glass ramp are untouched. *Alternative:* a two-column options layout — rejected: IA change for no identified user problem.

**Doc updates implied:** `docs/04-capabilities.md` — the sidebar composition bullet (empty/first-run states, notice presentation) and any options-page description line. No other docs affected.

## Visual language

- **Welcome block.** Ghost tile outlines (the existing Space-tinted ghost treatment, `--border-soft` outlines at low alpha — feature-local CSS shapes, not `FaviconTile` instances) above the serif headline; body in `--text-muted`. No dashed borders anywhere — dashed reads utilitarian; the ghost-outline + tint treatment reads like the product's own furniture awaiting use. Drag-over: ghosts + hint brighten to the `--space-c-soft` wash over `--motion-fast` `--ease-standard`; the dissolve to the populated layout runs `--motion-base` `--ease-emphasised`; the whole block never exceeds the vertical space the two old empty states occupied.
- **Notice.** `--text-sm` body on a quiet `--surface` row, `--r-md`; actions as text `Button`s (the primary "Got it" keeps `--accent-text`); no shadow, no border. Entrance unchanged (it follows the existing notice mount); dismissal fades over `--motion-base` `--ease-standard`.
- **Options.** Serif group headings at `--text-xl` with `oklch` identity tint at the established accent treatment; `--space-6` inter-group rhythm, `--space-3` heading→description, `--space-4` description→controls. Cards keep the glass ramp exactly as specced. Focus/hover/disabled states are all inherited from the primitives — nothing new.
- **Motion.** Only existing tokens: `--motion-fast` for drag brightening, `--motion-base` for dissolves; reduced motion collapses both via the token block. End states identical without motion.
- **Hierarchy outcome.** First-run sidebar: one focal block + the search pill + the switcher. Options: wordmark → group serif headings → controls, three clear levels where today there is one.
- **Arc reference.** Arc's first-run sidebar is similarly quiet but leans on onboarding overlays; Lunma's welcome does the teaching in-place in the brand voice — deliberately calmer than Arc's coach-marks.

## Risks / Trade-offs

- [The combined welcome hides the favorites/pinned distinction from brand-new users] → The copy names both gestures, the welcome itself is the live favorites drop target, and the per-area states return the moment either area has content, restoring the explicit zones.
- [Restyled notice could be overlooked] → It still renders on every sidebar mount until dismissed (semantics unchanged); disclosure-before-action is preserved — only weight changes. If discoverability of "Manage in settings" measurably suffers, revisit.
- [Serif headings could clash with the options form density] → The `--space-6` rhythm separates registers; the serif is confined to group headings (the pairing rule: serif = identity, sans = information).
- [With the pinned empty row suppressed, the empty pinned area under the header could read as dead space] → The header + divider already frame it as a list region, the welcome's copy names pinning, and drag-into-the-panel still pins. The empty row returns whenever the welcome stops showing while pinned is still empty (i.e. once favorites gain content); covered by the composition unit tests.

## Open Questions

*(none)*
