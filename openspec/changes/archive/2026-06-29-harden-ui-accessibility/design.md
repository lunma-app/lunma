## Context

A source-grounded accessibility audit (moved into this change as
`lunma-ui-accessibility-audit.md`) verified every `src/ui/` primitive and the
catalog shell against their actual source: 44 open items — 1 High, 9 Medium, 34
Low — across ~23 primitives plus `@lunma/tokens` and `contrast.test.ts`. The
foundations are already strong (roles/names/states largely correct, bits-ui
delegation for overlays, reduced-motion in 13 primitives, a passing 103-assertion
contrast contract), so this is a hardening pass, not a rebuild. The fixes are
small and local but numerous, and a few touch shared tokens that ripple across
surfaces — those need decisions before coding.

Constraints: the one-way import DAG and the primitive→token CSS contract are
gated by `biome check` / `pnpm lint:styles`; every touched `src/ui/*.svelte`
primitive must update its catalog story (story-parity guard); `contrast.test.ts`
is the contrast source-of-truth and must stay green; reduced-motion + WCAG-AA
hold at every Colour-intensity level.

## Goals / Non-Goals

**Goals:**
- Resolve all 44 audit items so the library meets WCAG 2.2 AA in both themes at
  every tint level.
- Close the light-theme-on-glass contrast failure at the token level so it cannot
  recur on any future light surface, and extend the contrast contract to gate it.
- Keep changes additive and non-breaking to external behaviour; the only breaking
  changes are three internal prop renames, updated in-repo in this change.

**Non-Goals:**
- No redesign of any component's visual identity or interaction model.
- No new feature component, no new dependency, no message-bus/storage change.
- The 37 "needs live-AT" items are verification tasks (manual NVDA/VoiceOver
  pass), not code changes; they do not block this change.
- AAA conformance is not targeted (AA is the bar).

## Decisions

### D1 — A dedicated `ui-accessibility` capability for the cross-cutting contract
The accessible-name / programmatic-state / keyboard / status-message contracts
apply across many primitives that no existing capability owns (Button, Chip,
Tooltip, Select, …). Putting them in one new capability keeps the contract
discoverable and reviewable. *Alternatives:* distribute deltas into the owning
feature specs (launcher/lenses/spaces-and-tabs/tab-row-menu) — rejected because
the generic primitives have no owning spec, so the contract would fragment;
fold everything into `visual-system` — rejected as it mixes the token/visual
system with control semantics. Token/contrast changes still belong to
`visual-system` (it owns the contrast budget), so that spec gets the delta.

### D2 — Fix light-on-glass at the token layer, not just the catalog
`--glass-bg`/`--glass-bg-strong` exist only in the dark `:root`; in light theme
`.lunma-glass` stays dark and light foreground tokens fail (`--text-muted`
2.0:1, `--text-faint` 1.3:1). We add a light-theme `--glass-bg`/`--glass-bg-strong`
so glass follows the theme. *Alternatives:* make only the catalog previews use an
opaque light surface — rejected because it leaves the design-system gap (any
future light glass surface fails) and contradicts the catalog's purpose (reading
primitives on the real glass substrate); leave catalog dark in light theme —
rejected (visible AA failure). Shipped surfaces re-declare `--glass-bg` only
under `:not([data-theme='light'])`, so the new light token applies to `.lunma-glass`
consumers in light theme (SearchField input, DragClone, catalog) — a desired,
consistent improvement, covered under *Visual language*.

### D3 — ColorSwatch groups become `role="group"`, not `role="radiogroup"`
The swatches are `aria-pressed` toggle buttons; the minimal valid fix is to
change the two consumer containers (`SpaceEditor.svelte`, `FolderRow.svelte`) to
`role="group"` with an accessible name — a labelled group of toggle buttons is a
conformant pattern requiring no keyboard rework and leaving the `ColorSwatch`
atom untouched. *Alternative:* convert swatches to `role="radio"`+`aria-checked`
AND add roving arrow-key navigation to FolderRow's group (SpaceEditor already has
it) — rejected as larger churn for a Medium with no AT benefit over the group
pattern.

### D4 — IconButton name fallback is non-breaking
`ariaLabel` stays optional; when absent the native `title` becomes the accessible
name, and a dev-mode warning fires when both are missing. *Alternative:* make
`ariaLabel` required — rejected as a breaking change to every IconButton call
site for a Low item.

### D5 — `--text-faint` is restricted, not globally darkened
Rather than raise `--text-faint` lightness (which would lift every faint/decorative
use), the two informative usages move to `--text-dim`: `TabRow` `.meta` (archived
age + delete countdown) and the `Menu` section-kind label. `--text-faint` is then
formally incidental/decorative. `contrast.test.ts` is extended to parse the light
block so the light values are gated too. *Alternative:* darken `--text-faint`
itself — rejected (changes the intended quiet hierarchy broadly).

**Apply-time correction (agreed):** `--text-dim` is AA-gated at 4.5:1 in dark, but
its *light* value (L 0.520) measured only **4.15:1** on `--surface-3` — below the
floor the repointed metadata now demands. Light `--text-dim` is therefore darkened
to **L 0.495** (clears 4.5:1 on all five light surfaces; `--surface-3` → 4.62:1),
so the move to `--text-dim` actually delivers AA on every surface. This is the only
text-ramp token value this change touches beyond the planned border/glass edits.

### D6 — The three `label`→`ariaLabel` renames are done now (one internal break)
`Menu`, `FolderRow`, and `LensRow` use `label` purely as a name override, which
contradicts the `label` = visible-text convention. We rename to `ariaLabel` and
update all in-repo consumers in this change. *Alternative:* keep `label` and only
document — rejected because the user asked to fix every item and the inconsistency
is the finding; this is the single (internal) breaking change and is contained.

### D7 — Message-only Toast becomes keyboard-engageable via a focusable container
A message-only toast (no action) renders no focusable child, so its focus-within
pause and Escape handler are pointer-only. We give the container `tabindex="0"`
plus a visible focus style so keyboard users can engage it. *Alternative:* always
render a dismiss button — rejected (adds chrome to a deliberately minimal toast).

### D8 — Sequencing: tokens/contract first, then props, then behaviour, then catalog
Land the token + `contrast.test.ts` changes first (highest-value, and the test
then guards the rest), then add the new primitive props, then the per-component
behaviour wiring, then the catalog and consumer/rename updates — each step
verifiable on its own. Recorded so apply-time work follows it.

### D9 — Out-of-audit fix (agreed): `Tooltip` floating position for bits-ui 2.18.1
Verifying the TOOLTIP-01 `role="tooltip"` work surfaced a **pre-existing**
positioning bug (identical on `HEAD`): bits-ui 2.18.1's `Tooltip.Content` `child`
snippet now hands back `{ props, wrapperProps }`, where `wrapperProps` carries the
floating-position style on an outer wrapper. `Tooltip.svelte` spread only `props`,
so the bubble lost its position and rendered as a `position: static` block at the
bottom of `<body>` — "nothing shows on hover", for **every** tooltip (FaviconTile,
TabRow, Lens, catalog). Fix: wrap the content in `<div {...wrapperProps}>` and keep
`{...props}` + `role="tooltip"` on the inner element. This is a bits-ui-integration
fix, not an accessibility item, but it is in `Tooltip.svelte` (already touched here),
it unblocks the 12.1 tooltip AT verification, and shipping a non-displaying tooltip
would be worse — so it lands in this change (agreed). Verified: bubble anchors to the
trigger, `Tooltip.test.ts` green, svelte-check clean. The same investigation found
the trigger's `aria-describedby` reading **empty** under 2.18.1: bits-ui sets it from
`contentNode.id`, but its auto-generated id lands on the floating *wrapper*, leaving
the inner content (the `contentNode`) with no id. Fixed by setting our own stable
`id` on the inner content `<div>` (after `{...props}`), so the trigger's
`aria-describedby` resolves to the bubble and a screen reader announces the tooltip
text as the trigger's description (verified: describedby matches the content id on
both hover and focus) — completing the TOOLTIP-01 contract end-to-end.

**Doc updates implied:** `docs/architecture.md` gains the `label` (visible) vs
`ariaLabel` (name-only) primitive-prop convention note (D6). No other `docs/`
file changes.

## Visual language

This change ships visual deltas in light theme and in idle-control chrome; all
hold AA and reduced-motion at every tint level.

- **Light-theme glass (D2):** new `--glass-bg` / `--glass-bg-strong` for
  `[data-theme='light']` — a light, low-alpha translucent fill (near-white with
  the warm base-hue tint, alpha in the 0.5 / 0.66 family to mirror the dark
  tokens) so panels read as frosted-light rather than dark. Backdrop blur, border,
  highlight, and all motion timings are unchanged; only the fill lightness/alpha
  changes. Foreground tokens on it must clear AA (verified by the new contrast
  assertion). States touched: SearchField `input` rest/hover/focus, DragClone,
  catalog previews.
- **Idle field boundary (THEME-02):** darken `--border` / `--border-strong`
  (both themes) just enough to clear 3:1 against `--surface`/`--bg` — a subtle
  hairline, still quiet, not a heavy 1px box. Focus state (accent border +
  `--bg-elev`) is unchanged.
- **Faint metadata (D5):** `TabRow` `.meta` and `Menu` kind label step from
  `--text-faint` to `--text-dim` — slightly more present, preserving the quiet
  secondary hierarchy.
- **Avatar verdict cue (AVATAR-01):** add a small per-state glyph/overlay
  alongside the ring so verdict is not hue-only; no motion, colour + shape
  together. Reuse the glyphs `ReviewerRail` already maps to these states —
  `check` (approved), `circle-alert` (changes), `clock` (pending) — so the cue
  reads consistently and no new lucide icon (hence no `gen:icons` regen) is
  introduced. Mirrors Arc's reliance on colour but improves on it for colour-blind
  users.
- **State affordances:** `aria-current`/`aria-busy` additions are
  non-visual; the existing active wash/ring and spinner visuals are unchanged.

Reduced motion: no new animation is introduced, so the existing
`prefers-reduced-motion` gates continue to apply.

## Risks / Trade-offs

- **Light `--glass-bg` changes shipped light surfaces (SearchField, DragClone)** →
  Verify each `.lunma-glass`/`--glass-bg` consumer in light theme in the catalog
  and the sidebar; the new contrast assertion guards legibility. Values are tunable
  tokens, easily adjusted.
- **Border darkening could read heavier than intended** → Pick the minimal
  lightness that reaches 3:1; review at all three tint levels and both themes.
- **The `label`→`ariaLabel` rename can miss a consumer** → `tsc`/`svelte-check`
  fail on a stale `label` prop; grep all call sites; story-parity guard covers the
  stories.
- **`aria-current` on the active row could double-announce with existing context**
  → Set it on the single primary focus target (title button), not multiple nodes.
- **Broad surface area (23 primitives)** → Each item is independent and tied to an
  audit ID and a test; `pnpm verify` + story-parity + contrast contract gate the
  whole.

## Migration Plan

- No data/schema/message migration. Token and prop changes are forward-only.
- Order per D8: (1) tokens + `contrast.test.ts`; (2) new primitive props + stories;
  (3) per-component behaviour wiring + tests; (4) catalog + consumer/rename updates
  + `docs/architecture.md`.
- Rollback: revert the token commit (restores prior glass/border/text behaviour);
  primitive changes are additive and individually revertible.
- Exit gate: `pnpm verify` and `pnpm test:e2e` green; every audit ID has a code
  change and a test or an explicit "needs live-AT" verification note.

## Open Questions

- Exact light `--glass-bg` lightness/alpha and the darkened `--border` values are
  proposed in tokens and confirmed visually in the catalog during apply; if the
  design eye wants different values, that is a token tweak, not a contract change.
- The 37 "needs live-AT" items require a manual NVDA + VoiceOver pass to close
  fully; this change makes the code correct and leaves those as a tracked
  verification checklist, not blockers.
