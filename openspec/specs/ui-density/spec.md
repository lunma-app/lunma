# ui-density Specification

## Purpose

Defines the sidebar tab-list density system: the three density modes (`compact`, `normal`, `comfort`), the CSS custom-property tokens that drive vertical rhythm, the motion behaviour on density change, how the sidebar applies density before first render, and the options-page live preview.
## Requirements
### Requirement: Density modes control the vertical rhythm of the tab list

The `density` setting SHALL support three modes — `compact`, `normal`, and `comfort` — controlling tab-row height, the gap between rows, and the horizontal padding of tab-list containers. The mapping SHALL be:

| Mode    | `--row-h` | `--row-gap` | `--list-pad` |
|---------|-----------|-------------|--------------|
| compact | 28px      | 1px         | 6px          |
| normal  | 34px      | 2px         | 8px          |
| comfort | 40px      | 4px         | 12px         |

Font size SHALL NOT change between modes. The bottom `SpaceSwitcher` bar SHALL NOT scale with density — only the Pinned and Temporary tab lists do.

#### Scenario: Default density is normal

- **WHEN** no density preference has been saved
- **THEN** the sidebar renders with `--row-h: 34px`, `--row-gap: 2px`, `--list-pad: 8px`

#### Scenario: Compact mode tightens rows and list padding

- **WHEN** the active density is `compact`
- **THEN** `document.documentElement` carries `data-density="compact"` and tab rows are 28px tall

#### Scenario: Comfort mode opens rows and list padding

- **WHEN** the active density is `comfort`
- **THEN** `document.documentElement` carries `data-density="comfort"` and tab rows are 40px tall

#### Scenario: SpaceSwitcher padding is unaffected

- **WHEN** the density changes between any two modes
- **THEN** the bottom `SpaceSwitcher` bar's padding is unchanged

### Requirement: Density tokens are CSS custom properties on `:root`

`--row-h`, `--row-gap`, and `--list-pad` SHALL be declared on `:root` in `src/ui/tokens.css` with `normal`-mode values as defaults, and `compact`/`comfort` overrides as `:root[data-density="compact"]` / `:root[data-density="comfort"]` selectors in the same file. No component SHALL hard-code a pixel value for row height, row gap, or list padding.

#### Scenario: TabRow inherits row height by token

- **WHEN** `data-density` changes on `document.documentElement`
- **THEN** `TabRow` height changes via CSS inheritance with no JS intervention

#### Scenario: List containers inherit padding and gap by token

- **WHEN** `data-density` changes on `document.documentElement`
- **THEN** `PinnedTabs` and `TempTabs` container padding and `.row-wrap` gaps update via CSS inheritance

#### Scenario: Drag insertion line stays aligned across densities

- **WHEN** a drag is in progress and the density is `compact` or `comfort`
- **THEN** the drop-line insets track `--list-pad` (`calc(var(--list-pad) + 2px)`) so the line stays flush with the rows rather than offset

### Requirement: Density change animates via the global motion token

Switching density SHALL animate the row-height change using `transition: height var(--motion-base) var(--ease-standard)` on `TabRow`. Under `prefers-reduced-motion: reduce`, the change SHALL use the reduced duration produced by the existing global token collapse (`--motion-base` → `--motion-fast`, 120ms); no bespoke per-component suppression is required.

#### Scenario: Height eases on density change

- **WHEN** the user changes density while the sidebar is open
- **THEN** the tab rows animate to the new height over ~200ms rather than snapping

#### Scenario: Reduced motion uses the fast tick

- **WHEN** `prefers-reduced-motion: reduce` is active and the density changes
- **THEN** the row height changes over the collapsed `--motion-fast` duration (120ms), consistent with every other transition in the app

### Requirement: Sidebar applies density before first render and on change

`src/sidebar/main.ts` SHALL read settings during `boot()` and set `document.documentElement.dataset.density` **before** `mount(App, …)`, and SHALL subscribe via `watchSettings` to update the attribute when the user changes density. When density is `normal`, the attribute MAY be omitted (normal is the token default). `App.svelte` SHALL NOT read settings storage (so existing `App` render tests need no `chrome.storage` mock).

#### Scenario: No flash of the wrong density on boot

- **WHEN** the side panel opens with `compact` saved
- **THEN** `document.documentElement` has `data-density="compact"` before any tab row is painted — the user never sees a Normal→Compact jump

#### Scenario: Sidebar reflows on options-page change without reload

- **WHEN** the user changes density in the options page
- **THEN** the sidebar updates `data-density` within one `chrome.storage.onChanged` event and reflows at the new density, no reload

### Requirement: Options page shows a live density preview

The options page SHALL render a preview panel of mock `TabRow`s (composed from the `src/ui/TabRow` primitive). On density selection it SHALL apply `data-density` to its own `document.documentElement` so the preview rows reflow live, in addition to persisting the setting.

#### Scenario: Preview reflows as the user picks

- **WHEN** the user selects a different density on the options page
- **THEN** the preview rows immediately re-space to the selected density (animating per the height transition), without waiting for a sidebar round-trip

### Requirement: The launcher surfaces apply density

The launcher SHALL honour the `density` setting on **both** delivery surfaces (the
new-tab page and the `Alt+L` overlay), the same way the sidebar tab list does — not
only the sidebar.

- `src/launcher/newtab/main.ts` SHALL read settings during boot and set
  `document.documentElement.dataset.density` **before** mounting `NewTab` (omitting
  the attribute when density is `normal`, the token default), and SHALL subscribe
  via `watchSettings` to update the attribute when the user changes density.
  `NewTab.svelte` SHALL NOT read settings storage (its render tests need no
  `chrome.storage` mock), mirroring `App.svelte`.
- The `Alt+L` overlay SHALL apply density to its closed-shadow host. Because
  density is a **global** setting (not per-window like the active-Space hue the SW
  resolves), the overlay SHALL read the `density` field of `lunma.settings`
  **directly** from `chrome.storage.sync` (not via a launcher-toggle message), set
  `data-density` on the host element so the shadow stylesheet's
  `:host([data-density='comfort'])` rules apply, and track `chrome.storage.onChanged`
  to stay current.

#### Scenario: New-tab applies density before first paint

- **WHEN** the new-tab page boots with the saved density `comfort`
- **THEN** `document.documentElement` carries `data-density="comfort"` before
  `NewTab` is mounted, so the first painted result list is already at Comfort

#### Scenario: New-tab reflects a density change without reload

- **WHEN** the user changes density while a new-tab page is open
- **THEN** the page updates `data-density` within one `chrome.storage.onChanged`
  event and the result rows reflow at the new density, no reload

#### Scenario: The overlay applies density to its host

- **WHEN** the overlay opens and the saved density is `comfort`
- **THEN** the overlay sets `data-density="comfort"` on its host element so the
  shadow stylesheet renders the two-line Comfort row
- **AND** when the saved density is `normal` the host carries no `data-density`
  (or a value the comfort rule does not match), so the row stays single-line

