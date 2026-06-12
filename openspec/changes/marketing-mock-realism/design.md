# Design — marketing-mock-realism

## Context

The hero demo (`apps/site/src/lib/StageWindow.svelte`) binds the active Space's
hue/lightness/chroma on the window root and recolours via the registered
`@property` axes — that part is faithful. The drift is in the *content*:

- The sidebar mock hard-codes one tab list (`Figma — product redesign`,
  `Linear — this cycle`, `Spec — draft v3`, plus two archiving rows) that is
  rendered for **every** Space. Switching Spaces recolours but never changes the
  tabs, contradicting "each Space keeps its own tabs".
- The global favourites grid (`FaviconGrid` at the top) is stocked with
  `figma/linear/github/mail/calendar` — niche tools, not apps a first-time
  visitor recognises.
- `SpaceHeader.svelte` renders the Space title as `--font-display` `--text-xl`
  with a `--glow-space` text-shadow and a `--space-c` filled icon tile. The real
  `apps/extension/src/sidebar/SectionHeader.svelte` is a quiet sans row: a 16px
  hue-tinted glyph at the favicon column, the name at `--weight-medium`
  `--text-base` `--font-sans` sentence-case, tinted
  `oklch(from var(--space-c) max(l, 0.72) c h / 0.95)`, no glow, no tile.

The just-archived `align-site-visuals` brought the tab-row, favourite-tile, and
launcher mocks to fidelity but did not touch `SpaceHeader`; this change closes
that gap and adds the per-Space content the demo needs to *prove* the product.

## Goals / Non-Goals

**Goals:**

- Switching a Space in the demo swaps that Space's own pinned + temporary tab
  rows (and the new-tab caption), so the "separate tabs per Space" promise is
  shown, not just coloured.
- The global favourites read as "my apps" — common consumer apps — and stay
  **constant** across Spaces (they are Space-independent global favourites).
- The mock Space header renders the real `SectionHeader` row treatment.

**Non-Goals:**

- No change to the recolour mechanism, the auto-rotation gating
  (`IntersectionObserver` + hover/focus pause + reduced-motion), or the
  decorative browser chrome (Non-Goal carried from `align-site-visuals`).
- No importing the extension's `SectionHeader`/`Icon`/`FaviconRow` into the site
  (workspace boundary) — the mocks stay the site's own components.
- No real brand logos/SVGs — favourites stay the existing letter-plate
  `FaviconSpec` abstraction (a coloured plate + initial), just stocked with
  recognisable apps.
- The favourites grid does **not** vary per Space (varying it would misrepresent
  global favourites).

## Decisions

**D1 — Per-Space tab data lives on the demo's `SpaceDef`, not in a separate
store.** The site-internal `SpaceDef` interface in `StageWindow.svelte` gains
`tabs` (pinned rows: `{ title, fav, active?, drifted? }`), `temp` (temporary /
archiving rows: `{ title, fav, fading?, meta? }`), an `archived` count for the
`New Tab` row, and a `count` caption string (`"18 tabs · 4 pinned"`) for the
new-tab pane. The template renders `space.tabs` / `space.temp` instead of the
hard-coded rows. Alternative — a parallel `Record<SpaceColorName, …>` map — adds
an indirection with no benefit; the data already hangs off the Space object the
template iterates.

**D2 — Favourites are common apps, held constant across Spaces.** New `FAV`
entries (`whatsapp`, `gmail`, `ytmusic`, `spotify`, `gmaps`, `photos`) are added
to `apps/site/src/lib/mocks/apps.ts` and used for the demo's top grid and the
Favourites chapter; the demo's `favourites` array is declared **once** (not on
`SpaceDef`), so it never changes when the Space switches. The work tools
(`figma/linear/github/docs/notes`) remain for the per-Space *tab rows*, where a
"Work" or "Design" context makes them apt. Alternative — repurposing the
existing work-tool entries — was rejected: the tab rows still want them.

**D3 — `SpaceHeader` mirrors `SectionHeader` rendered-at-rest, keeping its text
glyph.** The mock cannot import the extension's `Icon` component (workspace
boundary), so it keeps its emoji/text glyph but styles the row exactly like the
real header: `height: var(--row-h)`, `padding: 0 var(--space-3)`, a glyph slot
at `--favicon-size` with `margin-right: var(--space-2)` and `opacity: 0.9`, the
name at `font: var(--weight-medium) var(--text-base)/1 var(--font-sans)`
sentence-case, hue-tinted `oklch(from var(--space-c) max(l, 0.72) c h / 0.95)`,
no `--glow-space`, no filled tile. The same `{ icon, name }` props are kept, so
the Chapters Spaces chapter inherits the fix with no call-site change.
Alternative — keep the serif headline as "marketing flourish" — was rejected: it
is exactly the hand-divergence the `marketing-site` fidelity scenario forbids,
and the user flagged it.

**D4 — The hue-tint floor mirrors the real component's `max(l, 0.72)`.** That
lightness floor is what keeps the tinted header text ≥4.5:1 over the Space wash;
copying it verbatim keeps the site's WCAG-AA contrast test green for every Space
hue without a site-specific tuning.

## Visual language

This change ships on the hero surface; the intent is *convergence + believable
content*, not new visual vocabulary:

- **Colour:** the Space header text adopts the product's hue-tint
  (`oklch(from var(--space-c) max(l, 0.72) c h / 0.95)`) instead of neutral serif
  + glow; the favourite tiles keep the borderless `--surface` plate from
  `align-site-visuals`; the active per-Space tab row keeps the `--space-c-soft`
  wash; archiving rows keep their `0.4` fade.
- **Hierarchy:** the Space header drops from display-serif headline to a
  `--weight-medium` row label — it reads as the *head of the tab list*, exactly
  as in the product, so the serif weight no longer competes with the new-tab
  pane's (correct) big serif identity.
- **Motion:** unchanged — the 600ms Space-recolour tween, the auto-rotation
  gating, and the reduced-motion path are untouched. Per-Space tab swaps ride the
  same Space-change; no new transition is introduced (tabs cut over with the
  recolour, consistent with the existing demo).
- **Interaction feedback:** none added — the demo's tab rows are static
  illustrations (the only interactive control remains the Space switcher, whose
  hover/active/focus treatments are unchanged).
- **Atmosphere:** unchanged (aurora/glass inherited).

## Risks / Trade-offs

- **[Risk] A per-Space tab row could push a hue-tinted title below WCAG-AA on a
  light Space colour.** → The header tint uses the same `max(l, 0.72)` floor the
  real component relies on; tab-row titles stay on `--text`/`--text-2` (untinted),
  so only the header is hue-tinted. The site contrast test gates it. → Mitigation:
  if the test flags a hue, raise the floor in both the mock and (separately) the
  real component rather than diverging silently.
- **[Risk] Restocking favourites shifts the Favourites chapter's tile letters.**
  → Intended — that chapter is meant to read as "my apps" too; no fidelity
  contract is broken (tiles stay the borderless plate).
- **[Trade-off] The per-Space tab content is authored, not data-driven.** Accepted
  — it is illustrative marketing content; the cost is a handful of literals in one
  component, which is the established pattern for the mocks.
