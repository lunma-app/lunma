# smart-folders Specification — delta for collapsible-smart-folder-sections

## MODIFIED Requirements

### Requirement: Smart-folder rendering and the one-glyph restraint

The sidebar SHALL render a smart folder with a sectioned layout when it has ≥ 2 sources.
A single-source folder renders identically to today (no section headers, no collapse
control, no visual change).

When expanded with ≥ 2 sources, the folder SHALL render, for each `SmartSourceConfig`
entry in `node.sources` order: (a) a **section header** row (a leading disclosure chevron
in `--text-dim` + source icon in `--text-dim` + host label in `--text-muted`,
`--font-size-xs`, 12px height) followed by (b) the section's **body** — its result rows
using the existing per-kind rules (queue → status dots; feed → unread marks), plus the
section's ghost/empty/error/sign-in/needs-access rows and feed reading-controls. Section
headers SHALL be implemented as `SmartSectionHeader.svelte` (composed of the `Icon`
primitive only — no new primitives).

The section header SHALL be an **interactive disclosure control** (a `<button>`, not an
`aria-hidden` divider): activating it toggles that section's collapsed state (see
Requirement: Multi-source smart-folder sections are individually collapsible). It SHALL
carry `aria-expanded` reflecting the section's collapsed state and an accessible label
naming the host, the count, and the toggle action. When a section is **collapsed**, the
folder SHALL render the section header (including its count) and hide the section body;
when expanded, the body renders normally.

The section header and its result rows SHALL stay at the same indentation — the disclosure
affordance SHALL NOT introduce an additional nesting indent (the layout is flat: collapse
is signalled by chevron state, not indent depth).

The folder badge SHALL sum per-section attention counts: `Σ (item count for queue sections)
+ Σ (unread count for feed sections)`, **independent of any section's collapsed state**.
The `N+` cap triggers when any section has hit its `maxItems` cap. The badge never shows 0
(hidden when sum is 0). For a single-source folder the badge is identical to today.

Empty-state notes, ghost rows (first-fetch), signed-out/error/needs-access states, and
the "open work holds its row" behavior apply per section. A section in `pending`
(first-ever fetch) renders three static ghost rows.

#### Scenario: A single-source folder renders identically to before this change

- **GIVEN** a smart folder with exactly one source entry
- **WHEN** the folder is expanded
- **THEN** no section header and no collapse control are rendered and the layout is visually identical to the pre-change behavior

#### Scenario: A two-source folder renders sectioned

- **GIVEN** a smart folder with sources `[gitlab:gitlab.com, github:github.com]`, each `ok` with items
- **WHEN** the folder is expanded
- **THEN** the folder renders: section header "gitlab.com" → gitlab items → section header "api.github.com" → github items

#### Scenario: The folder badge sums per-section attention counts regardless of collapse

- **GIVEN** a folder with a queue section (7 items) and a feed section (3 unread of 10), with the feed section collapsed
- **WHEN** the folder renders
- **THEN** the badge reads `10` (the collapsed section still contributes)

#### Scenario: A section header is a disclosure control

- **GIVEN** a two-source folder, expanded
- **WHEN** the gitlab section header renders
- **THEN** it is a button carrying `aria-expanded` and an accessible label naming the host, count, and toggle action — not an `aria-hidden` divider

#### Scenario: A section in needs-access renders inline while other sections render normally

- **GIVEN** a folder with sections `gitlab:ok:5items` and `github:needs-access`, both expanded
- **WHEN** the folder is expanded
- **THEN** the gitlab section renders its 5 items; the github section renders one "Lunma needs access to api.github.com" row

## ADDED Requirements

### Requirement: Multi-source smart-folder sections are individually collapsible

On a smart folder with ≥ 2 sources, each section SHALL be individually collapsible from its
section header, independent of the other sections and of the folder-level expand/collapse.
This applies to **multi-source folders only**; single-source folders have no section header
and therefore no per-section collapse.

A section's collapsed state SHALL be stored as **sidebar-local, per-window, ephemeral**
state on `SidebarLocalState`:
`collapsedSmartSectionsByWindow?: { [windowId: WindowId]: { [folderId: FolderId]: { [sourceKey: string]: boolean } } }`,
where `sourceKey` is the section's `${source}:${host}` identity. The state SHALL NEVER be
persisted to storage and SHALL NEVER be broadcast (it is augmented onto the store like
`expandedFoldersByWindow`). The mutator `setSmartSectionCollapsed(windowId, folderId,
sourceKey, collapsed): void` SHALL write it. An **absent** entry means **expanded**: a
section defaults to expanded, and after an SW restart or sidebar reopen all sections render
expanded.

Collapse state SHALL be **per-window**: the same folder's section MAY be collapsed in one
window and expanded in another, with no cross-window write.

When a section is collapsed, the folder SHALL render the section header (with its
attention count) and SHALL NOT render that section's body (result rows, ghost rows,
sign-in/needs-access rows, empty/error notes, feed reading-controls). The chevron SHALL
reflect the collapsed state (`aria-expanded={!collapsed}`). Collapsing a section SHALL NOT
affect the folder-level badge, polling, runtime, bindings, or any other section.

The disclosure SHALL respect `prefers-reduced-motion: reduce`: the chevron rotation and the
section-body entrance animation SHALL be disabled under reduced motion.

#### Scenario: Collapsing a section hides its body and keeps its header

- **GIVEN** a two-source folder `[gitlab:gitlab.com (ok, 5 items), github:github.com (ok, 3 items)]`, both expanded, in window 100
- **WHEN** the user activates the gitlab section header
- **THEN** `setSmartSectionCollapsed(100, folderId, 'gitlab:gitlab.com', true)` is written
- **AND** the gitlab section header (with its count) still renders while its 5 result rows are hidden
- **AND** the github section continues to render its header and 3 rows

#### Scenario: Collapse is per-window

- **GIVEN** a folder open in window 100 and window 200, with its gitlab section collapsed in window 100
- **WHEN** window 200 renders the same folder
- **THEN** the gitlab section is expanded in window 200 (no cross-window collapse)

#### Scenario: Sections default to expanded after a restart

- **GIVEN** a section was collapsed in window 100 before the SW restarted
- **WHEN** the sidebar re-renders the folder after restart
- **THEN** the section renders expanded (the ephemeral collapse state was not persisted)

#### Scenario: A collapsed busy section still contributes to the folder badge

- **GIVEN** a two-source folder whose collapsed gitlab section holds 4 items and whose expanded feed section holds 2 unread
- **WHEN** the folder renders
- **THEN** the folder badge reads `6` (collapse does not change the badge)

#### Scenario: Single-source folders have no per-section collapse

- **GIVEN** a smart folder with exactly one source
- **WHEN** the folder is expanded
- **THEN** no section header and no collapse control render, and no `collapsedSmartSectionsByWindow` entry is created for it
