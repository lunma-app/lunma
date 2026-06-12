# Tasks — marketing-mock-realism

## 1. Common-app favourites data

- [x] 1.1 In `apps/site/src/lib/mocks/apps.ts`, add recognisable consumer-app `FAV` entries (letter-plate `FaviconSpec`, no real logos): `whatsapp` (`W`, green ~150), `gmail` (`M`, red ~25), `ytmusic` (`♪`, red ~25), `spotify` (`S`, green ~150), `gmaps` (`◆`, blue ~250), `photos` (`P`, cyan ~200). Keep the existing work-tool entries (`figma/linear/docs/github/notes/...`) — they stay for the per-Space tab rows.

## 2. Space-header fidelity (SpaceHeader mock)

- [x] 2.1 Rewrite `apps/site/src/lib/mocks/SpaceHeader.svelte` styles to mirror the real `apps/extension/src/sidebar/SectionHeader.svelte` rendered-at-rest treatment: a row at `height: var(--row-h)`, `padding: 0 var(--space-3)`, `border-radius: var(--r-md)`; the glyph in a `--favicon-size` slot with `margin-right: var(--space-2)`, `opacity: 0.9` (keep the emoji/text glyph — no extension `Icon` import across the workspace boundary); the name at `font: var(--weight-medium) var(--text-base)/1 var(--font-sans)`, sentence-case, ellipsised; hue-tinted `color: oklch(from var(--space-c) max(l, 0.72) c h / 0.95)`. Remove the display serif, `--glow-space` text-shadow, and the filled `--space-c` icon tile. Keep the `{ icon, name }` props unchanged. Update the header comment to name `SectionHeader` as the mirrored component.

## 3. Per-Space tab content (StageWindow hero demo)

- [x] 3.1 In `apps/site/src/lib/StageWindow.svelte`, extend the site-internal `SpaceDef` interface with `tabs: { title; fav; active?; drifted? }[]` (pinned rows), `temp: { title; fav; fading?; meta? }[]` (temporary/archiving rows), `archived: number` (the `New Tab` row count), and `count: string` (the new-tab pane caption). Author each Space's set:
  - **Work** (blue ◐): tabs — `Figma — product redesign` (active, `figma`), `Linear — this cycle` (`linear`), `GitHub — pull requests` (`github`); temp — `Spec — draft v3` (`docs`), `Standup notes` (fading, `archiving…`, `notes`); archived 3; count `18 tabs · 4 pinned`.
  - **Design** (purple ✦): tabs — `Figma — components` (active, `figma`), `Moodboard — references` (drifted, `reader`), `Linear — design tasks` (`linear`); temp — `Type specimens` (fading, `archiving…`, `docs`); archived 2; count `11 tabs · 3 pinned`.
  - **Reading** (green ❍): tabs — `How OKLCH works` (active, `docs`), `Newsletter — this week` (`gmail`); temp — `A long read from lunch` (fading, `archiving…`, `reader`), `Saved thread` (fading, `archiving…`, `reader`); archived 5; count `9 tabs · 2 pinned`.
  - **Home** (orange ⌂): tabs — `Calendar — this week` (active, `calendar`), `Maps — weekend route` (`gmaps`), `Shopping list` (`shop`); temp — `Recipe — pasta` (fading, `archiving…`, `reader`); archived 1; count `7 tabs · 3 pinned`.
  - **Writing** (pink ✎): tabs — `Essay — revisions` (active, `docs`), `Notes — outline` (`notes`); temp — `Research — sources` (fading, `archiving…`, `reader`); archived 2; count `6 tabs · 2 pinned`.
- [x] 3.2 Replace the hard-coded pinned/temp `TabRowMock` rows in the sidebar mock with `{#each space.tabs}` / `{#each space.temp}` loops (passing `active`/`drifted`/`fading`/`meta`); bind the `New Tab` row's `N archived` to `space.archived` and the new-tab pane's `12 tabs · 5 pinned` caption to `space.count`.
- [x] 3.3 Restock the demo's **global** favourites grid (the top `FaviconGrid`) with the common apps from 1.1 (`whatsapp`, `gmail`, `ytmusic`, `gmaps`, `spotify`). Keep this `favourites` array declared once at module/component scope — it MUST NOT live on `SpaceDef`, so it stays identical across Space switches.

## 4. Favourites chapter

- [x] 4.1 In `apps/site/src/lib/Chapters.svelte`, restock the Favourites chapter's `FaviconGrid` items with the common apps (`whatsapp`, `gmail`, `ytmusic`, `gmaps`, `spotify`, `calendar`, `photos`, + one more) so it reads as "my apps" too. (The Spaces chapter inherits the `SpaceHeader` fix automatically — no call-site edit needed there.)

## 5. Verify

- [x] 5.1 Run `pnpm --filter @lunma/site verify` (biome, svelte-check, the WCAG-AA contrast test — must stay green for the hue-tinted Space-header text — and the prerender build).
- [x] 5.2 In a headed browser: confirm switching Spaces swaps the tab rows (and the new-tab caption) while the global favourites grid stays constant; confirm the Space header now reads as a quiet hue-tinted sans row (not a serif headline); confirm the favourites read as common apps.

## 6. Review-driven polish (agreed during apply, 2026-06-12)

- [x] 6.1 Even out the demo window height across Spaces so it never jumps on switch: give every Space the same 4 tab rows (3 pinned + 1 archiving temp). Work had 5 rows → dropped its "Spec — draft v3" temp row; Writing had 3 → added a "Draft — chapter two" pinned row. Measured: all five windows render at the same height (476px) instead of 470–476px.
- [x] 6.2 In `StageWindow.svelte`, make the new-tab pane's search pill (`.nt-search`) sit on a single line — `width: max-content; max-width: 100%; white-space: nowrap` ("Search tabs, bookmarks…" was wrapping, then clipping; `max-content` fits it with padding, measured no overflow).
- [x] 6.3 Temp-section realism: temporary tabs are normal open tabs, not all "archiving…". Removed the `fading`/`meta: 'archiving…'` state from every per-Space temp row except a single thematically-apt example (Reading's "A long read from lunch") — so the auto-archive state reads as occasional, not universal (the dedicated Auto-archive chapter still demonstrates it fully).
