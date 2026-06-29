## Why

Keyboard, screen-reader, and low-vision users hit avoidable barriers across Lunma's shipped surfaces: tab/space/folder/lens rows announce no active or busy state, custom selects dead-end arrow navigation at disabled options, several controls ship without an accessible name, status changes (OPML import result, empty search) are never announced, and — most visibly — the light theme renders unreadable text on frosted-glass panels (`--text-muted` at **2.0:1**, `--text-faint` at **1.3:1**). This change confirms and fixes every finding in the source-verified accessibility audit (1 High, 9 Medium, 34 Low) so the component library meets WCAG 2.2 AA at every Colour-intensity level and in both themes. It delivers visible value directly (shape a): AT/keyboard/low-vision users gain operable, announced, readable surfaces — no downstream consumer needed.

The audit (`lunma-ui-accessibility-audit.md`) moves into this change as its source-of-record and is archived alongside it.

## What Changes

Grouped by concern; the per-item checklist (44 items, each tied to its audit ID) lives in `tasks.md`.

- **Programmatic state for visually-conveyed state** — `aria-current` for the active TabRow / LensRow / FaviconTile, `aria-busy` for busy/loading rows (TabRow, FolderRow, LensRow, FaviconTile), and a non-color cue for Avatar verdict rings.
- **Accessible names** — name the headerless BottomSheet dialog, the ResultList listbox, the ReviewerRail overflow badge, the catalog boolean control, and guarantee a name on icon-only IconButton; let Kbd carry a spelled-out key name; expose the MultiSelect collapsed value; add the missing input-mode placeholder fallback to SearchField.
- **Keyboard operability** — Select and MultiSelect roving skips disabled options; message-only Toast becomes keyboard-engageable; the redundant TabRow favicon tab stop and the always-on ResultRow tab stop are removed under the active-descendant model; the programmatically-clicked OPML file input leaves the tab order.
- **Status messages** — polite live regions for the OPML import-confirm result (ServiceConnectPicker) and IconPicker empty/truncation messages.
- **Associations & roles** — `aria-describedby` wiring between TextInput and InlineError errors; `role="tooltip"` on the Tooltip bubble; `role="presentation"` on Select's `<li>` wrappers; ColorSwatch groups use `role="group"` (valid for `aria-pressed` members) instead of `role="radiogroup"`; Diffstat numerals carry an explicit additions/deletions label.
- **Contrast & tokens** (`@lunma/tokens`) — add a light-theme `--glass-bg`/`--glass-bg-strong` so glass follows the theme (fixes light-on-glass); darken `--border`/`--border-strong` to clear the 3:1 idle-field boundary in both themes; move informative `--text-faint` metadata (TabRow `.meta`, Menu kind label) to `--text-dim`. Extend `contrast.test.ts` to gate light-theme text, light-on-glass, and non-text border-vs-surface pairs so these cannot regress.
- **API convention** — rename the accessible-name-only `label` prop to `ariaLabel` on `Menu`, `FolderRow`, and `LensRow` (**BREAKING** for those internal consumers, updated in this change) and document the `label` (visible) vs `ariaLabel` (name-only) convention.
- **Catalog** — `aria-current` on the active nav button, a named boolean control, and a corrected Tooltip story trigger.
- **Component-library policy** — every touched `src/ui/*.svelte` primitive updates its `catalog/stories/ui/<Name>.stories.svelte`, and every prop/behaviour change carries Vitest coverage.

### New API surface (every new public prop/file)

- `Chip`: `ariaLabel?: string`
- `Kbd`: `ariaLabel?: string`
- `BottomSheet`: `ariaLabel?: string`
- `RowButton`: `ariaCurrent?: 'page' | 'true' | 'false' | undefined`
- `ResultList`: `ariaLabel?: string`
- `ResultRow`: `tabindex?: number`
- `ReviewerRail`: `ariaLabel?: string`
- `TextInput`: `required?: boolean`, `describedById?: string`, `autocomplete?: string`
- `InlineError`: `id?: string`
- Renames (**BREAKING**, internal): `Menu.label` → `Menu.ariaLabel`; `FolderRow.label` → `FolderRow.ariaLabel`; `LensRow.label` → `LensRow.ariaLabel`
- Tokens (`packages/tokens/tokens.css`): `--glass-bg` / `--glass-bg-strong` light-theme values (new); revised `--border` / `--border-strong` lightness (both themes)
- New file: `openspec/changes/harden-ui-accessibility/lunma-ui-accessibility-audit.md` (moved from repo root)

### Primitives composed / changed

This change adds no new feature component and re-rolls no primitive. It modifies these 26 existing `src/ui/` primitives in place — AccountConnectField, Avatar, BottomSheet, Chip, ColorSwatch, Diffstat, FaviconTile, FolderRow, IconButton, IconPicker, InlineError, Kbd, LensRow, Menu, MultiSelect, ResultList, ResultRow, ReviewerRail, RowButton, SearchField, Select, ServiceConnectPicker, TabRow, TextInput, Toast, Tooltip — plus their catalog stories.

Consumers updated:
- **`label`→`ariaLabel` rename** — `Menu`'s name-only `label` is set across surfaces: `sidebar/TempTabs.svelte`, `sidebar/Lens.svelte`, `sidebar/FaviconRow.svelte`, `sidebar/PinnedTabs.svelte`, `sidebar/SectionHeader.svelte`, `ui/FolderRow.svelte`, `options/ConnectionsCard.svelte`, and `catalog/stories/ui/Menu.stories.svelte`. `LensRow.label` and `FolderRow.label` are name-only overrides that no surface currently sets, so those two renames touch only the primitive + its catalog story.
- **ColorSwatch `role="group"`** — `sidebar/SpaceEditor.svelte` and `ui/FolderRow.svelte` (the two swatch-group containers).
- **Catalog shell** — `Catalog.svelte`, `lib/Story.svelte`, `stories/ui/Tooltip.stories.svelte`.

## Capabilities

### New Capabilities
- `ui-accessibility`: the cross-cutting accessibility contract the component library SHALL meet — accessible names on every interactive primitive, programmatic equivalents for visually-conveyed state (active/busy/drift), keyboard operability including roving past disabled options, status-message live regions, and correct roles/associations — expressed as requirements that reference the concrete primitives.

### Modified Capabilities
- `visual-system`: the contrast budget gains normative pairs — light-theme foreground tokens on glass, an idle non-text component boundary ≥3:1, and a 4.5:1 floor for informative normal-size text in both themes — enforced by `contrast.test.ts`, plus a light-theme `--glass-bg` so glass has a light expression.

## Impact

- **Code:** 26 `src/ui/*.svelte` primitives + their catalog stories; `packages/tokens/tokens.css`; `apps/extension/src/ui/contrast.test.ts`; rename consumers across the options page (`options/ConnectionsCard.svelte`) and sidebar (`TempTabs`, `Lens`, `FaviconRow`, `PinnedTabs`, `SectionHeader`); the ColorSwatch-group containers (`sidebar/SpaceEditor.svelte`, `ui/FolderRow.svelte`); and the catalog shell. New/updated Vitest specs per touched primitive. Also a one-element `Tooltip.svelte` fix for a pre-existing bits-ui 2.18.1 positioning bug surfaced while verifying TOOLTIP-01 (agreed out-of-audit; see design D9).
- **Visual:** light-theme surfaces using `.lunma-glass` / `--glass-bg` (SearchField input, DragClone, catalog previews) gain a light frosted treatment; idle input/select borders darken slightly; faint metadata in TabRow/Menu darkens one step. Covered in `design.md` → *Visual language*; reduced-motion and AA hold at every intensity.
- **Docs:** `docs/architecture.md` gains a one-line note on the `label` vs `ariaLabel` primitive-prop convention. No other `docs/` files change; the normative accessibility contract lives in the new `ui-accessibility` spec.
- **Gates:** `pnpm verify` (tsc, biome incl. layer DAG, svelte-check, stylelint, vitest incl. story-parity + contrast contract) and `pnpm test:e2e` must stay green. No new dependencies. No message-bus or storage-schema changes.
