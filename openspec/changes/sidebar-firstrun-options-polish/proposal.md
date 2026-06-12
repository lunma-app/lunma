# Sidebar first-run + options editorial polish

## Why

The 2026-06-11 UI/UX review found the sidebar's first impression is its most cluttered state: a brand-new user sees the favorites ghost placeholder, the pinned empty-state row, *and* the auto-archive disclosure card stacked at once — three instructional boxes before they've done anything, the opposite of the "calm, lamp-lit place" the brand promises. The options page, meanwhile, is the least distinctive surface: a column of same-weight cards with no serif, no rhythm, and a barely-there wordmark. This change gives a fresh user one warm welcome instead of three boxes, and gives options the editorial hierarchy the visual-quality policy demands — both purely user-visible improvements.

## What Changes

- **A fresh-start welcome.** When the user has no favorites AND the active Space has no pinned tabs, the sidebar renders **one** consolidated welcome block (brand voice, quiet ghost-tile preview, a single hint covering drag-to-favorite and pin). It lives in the **fixed favicon-grid region** (replacing the grid's empty placeholder — it does not swipe with the Space carousel), and the pinned empty-state row inside the Space panel is suppressed while it shows (the Space header stays). It keeps the placeholder's drag contract (brightens under a drag; a drop creates the first favorite); drag-to-pin into the panel works exactly as today. Shipped as a new sidebar feature component, `Welcome.svelte`, composed by `FaviconRow.svelte`. When only one of the two areas is empty, the existing per-area empty states continue to render; with no active Space, the standard placeholder renders.
- **Quieter empty-state treatment.** The dashed-border boxes are restyled to the soft ghost treatment (Space-tinted ghost outlines + dim hint, now pinned down in the modified grid requirement); drop-zone affordances brighten during drag rather than shouting at rest.
- **Auto-archive notice, calmer.** The first-run disclosure (`FirstRunNotice.svelte`) keeps its exact semantics and all three spec-mandated facts (idle archival, the live threshold, the retention window — the `auto-archive` spec's requirement is untouched) but is restyled from a heavy titled card to a compact, quiet notice: icon + a short body carrying the three facts + inline "Got it" / "Manage in settings" text actions. "Got it" is the dismiss action the spec requires; the redundant corner ✕ `IconButton` is dropped (the spec mandates *a* dismiss action, not two).
- **Options editorial pass.** Setting-group headings move to the display serif with the established identity treatment, the page gains a clear type/spacing rhythm (group title → description → controls), and the wordmark header gets the presence the brand brief gives it — all within the existing glass-ramp/preview behavior.

## Capabilities

### New Capabilities

*(none)*

### Modified Capabilities

- `spaces-and-tabs`: MODIFIED "Sidebar shell composition" (point 3 gains the welcome exception; the zero-pinned mount scenario gains a non-empty-favorites GIVEN; a both-empty scenario is added) and MODIFIED "Global favicon grid in the sidebar" (the placeholder paragraph gains the welcome variant + the no-dashed-borders treatment, with matching qualifiers on the empty-row scenario); plus a new fresh-start welcome requirement owning the block's content, placement, drag contract, and dissolution.
- `visual-system`: the options on-brand requirement gains the editorial hierarchy contract (serif group headings, type/spacing rhythm) — modified requirement.

*(`auto-archive` is intentionally not modified — the disclosure's behavior, copy, gating, and dismissal are untouched; only its visual weight changes.)*

## Impact

- **Affected code**: `apps/extension/src/sidebar/` (`FaviconRow.svelte` — placeholder slot + welcome composition; `PinnedTabs.svelte`/`App.svelte` — pinned empty-row suppression; `EmptyState.svelte` — restyle; `FirstRunNotice.svelte` — the compact notice), `apps/extension/src/options/Options.svelte` + options styles. No background/shared changes.
- **New public types/files/methods/fields**: three new files — `apps/extension/src/sidebar/Welcome.svelte`, `Welcome.test.harness.svelte`, `Welcome.test.ts` (the sidebar's established component/harness/test pattern). No new bus messages, settings, tokens, or schema changes; ghost-tile styling stays feature-local CSS (the same precedent the shipped placeholder uses). Anything beyond this is a deviation to raise first.
- **Primitives composed (no new primitives)**: `Surface`, `Stack`, `Icon`, `Button`, existing type/spacing/motion tokens. The welcome's ghost tiles are not `FaviconTile` instances — they are quiet outline shapes drawn with feature-local CSS, the same precedent the shipped grid placeholder uses (no primitive API change).
- **Docs**: updates `docs/04-capabilities.md` (sidebar empty/first-run states, notice presentation, options-page description). All other `docs/` files untouched.
- **Dependencies**: none added.
