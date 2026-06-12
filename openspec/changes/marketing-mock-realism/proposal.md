# Make the marketing mocks read like the real product

## Why

The hero "Pick a Space" demo is the landing page's first interactive proof of
Lunma's core promise — *each Space keeps its own tabs* — yet today it only
**recolours** when you switch Spaces while showing the **identical hard-coded tab
list** for all five, which quietly contradicts the very idea it is selling. Two
more details undercut the same moment: the demo's Space title renders as a big
display-serif headline with a glow and a colour tile, nothing like the real
product's quiet hue-tinted row; and the global favourites row is stocked with
niche work tools (Figma, Linear, GitHub) rather than apps a first-time visitor
recognises. The user-visible value: the most-seen marketing surface starts
*demonstrating* the product instead of merely tinting it — Spaces visibly carry
their own tabs, the Space header looks exactly like what installs, and the
favourites read as "my apps."

## What Changes

- **Per-Space tab content in the hero demo.** Each of the five demo Spaces
  (Work, Design, Reading, Home, Writing) carries its **own** pinned + temporary
  tab list, so switching a Space swaps the tab rows (themed to that Space), not
  just the colour. The right-hand new-tab identity caption (`12 tabs · 5 pinned`)
  becomes per-Space too. **The global favourites grid stays constant across
  Spaces** — those are Space-independent global favourites ("one click away in
  every Space"); varying them would misrepresent the product. Only the tab rows
  below the Space header change.
- **Believable global favourites.** The favourites mock data is restocked with
  **common, recognisable consumer apps** (e.g. WhatsApp, Gmail, YouTube Music,
  Maps, Spotify, Calendar) instead of niche work tools, in both the hero demo's
  favourites grid and the Favourites chapter. The work tools (Figma/Linear/
  GitHub/Docs) remain available for the per-Space *tab rows*, where they fit a
  "Work" context.
- **Space-header fidelity.** The mock `SpaceHeader.svelte` is rewritten to match
  the real `SectionHeader.svelte` rendered-at-rest treatment: a quiet sans-serif
  **row** (glyph at the favicon column, name at `--weight-medium`/`--text-base`/
  `--font-sans`, sentence-case), hue-tinted via
  `oklch(from var(--space-c) max(l, 0.72) c h / 0.95)` — no display serif, no
  `--glow-space`, no filled colour tile. This extends the just-archived
  `align-site-visuals` "previews match the real components" principle to the
  Space header, which that change did not cover.

## Capabilities

### New Capabilities

*(none)*

### Modified Capabilities

- `marketing-site`: the "Composes the shared design language, not a copy"
  requirement's mock-fidelity scenario is extended to include the Space header
  (the demo's Space title SHALL render the real `SectionHeader` row treatment,
  not a display-serif headline). A scenario is added for the auto-rotating demo:
  switching Spaces SHALL swap each Space's own tab list while the global
  favourites grid stays constant.

## Impact

- **Affected code (site only):**
  - `apps/site/src/lib/mocks/apps.ts` — add common-app `FAV` entries (e.g.
    `whatsapp`, `gmail`, `ytmusic`, `spotify`, `maps2`, `calendar`); existing
    work-tool entries retained for tab rows.
  - `apps/site/src/lib/StageWindow.svelte` — the site-internal `SpaceDef` shape
    gains per-Space tab data (a `tabs`/`temp` structure + counts); the sidebar
    mock renders the active Space's tabs instead of hard-coded rows; the global
    favourites grid is restocked with common apps (held constant across Spaces).
  - `apps/site/src/lib/mocks/SpaceHeader.svelte` — style rewrite to the real
    `SectionHeader` row treatment (same `{ icon, name }` props — no public API
    change).
  - `apps/site/src/lib/Chapters.svelte` — the Favourites chapter's grid restocked
    with common apps (inherits the `SpaceHeader` fix automatically via the Spaces
    chapter).
- **New public surface:** new `FAV` entries in `apps.ts`; an extended
  site-internal `SpaceDef` interface in `StageWindow.svelte` (per-Space tab
  fields). No new files, no new dependencies, no extension changes.
- **`src/ui/` primitives:** none composed and none added — `apps/site` cannot
  import the extension's `ui/` layer (workspace boundary); the demo composes the
  site's own mock components (`SpaceHeader`, `FaviconGrid`, `TabRowMock`), and
  this change keeps them faithful rather than importing the real ones.
- **Docs:** no `docs/` files change — the marketing demo's content is not
  described in `docs/01`–`06`, and `docs/08-brand-identity.md` describes the
  token/brand relationship this change honours rather than alters. The
  `marketing-site` spec delta is the only artifact-of-record update.
- **Verification:** `pnpm --filter @lunma/site verify` (biome, svelte-check, the
  WCAG-AA contrast test — which must stay green for the hue-tinted Space-header
  text, mirroring the real component's `max(l, 0.72)` lightness floor — and the
  prerender build).
