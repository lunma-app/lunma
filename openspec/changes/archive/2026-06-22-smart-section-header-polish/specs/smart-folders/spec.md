## MODIFIED Requirements

### Requirement: Smart-folder rendering and the one-glyph restraint

The sidebar SHALL render a smart folder with a sectioned layout when it has ≥ 2 **resolved
sections** (counting each filter of each instance plus each rss feed). A folder with exactly one
resolved section renders identically to today (no section headers, no collapse control, no visual
change).

When expanded with ≥ 2 resolved sections, the folder SHALL render, in `node.sources` order and
within each entry in `queries` order: (a) a **section header** row — a single **16px disclosure
slot** showing the section's source icon (`rss` / git / kanban) in `--text-dim` **at rest**, which
crossfades to a rotating `chevron-right` on the header's `:hover` / `:focus-visible` (one slot, NOT
a separate chevron and icon), followed by a label in `--text-dim`, `--text-xs`, `--weight-medium`,
at a compact (~24px) height, with a hairline separator above every section header except the first —
followed by (b) the section's **body** — its result rows using the existing per-kind rules
(queue → status dots; feed → unread marks), plus the section's ghost/empty/error/sign-in/needs-access
rows and feed reading-controls. The header label SHALL be `host · filter` for a queue section (e.g.
`gitlab.com · authored`, the filter using the per-source query label) and `host` for an rss section.
Section headers SHALL be implemented as `SmartSectionHeader.svelte` (composed of the `Icon` primitive
only — no new primitives). Per-item favicons SHALL be recessed at rest (reduced opacity, full on row
hover/active) so the item title leads. The crossfade and chevron rotation SHALL collapse to instant
under `prefers-reduced-motion: reduce`, and all header colours SHALL come from the `--text-*` ramp so
WCAG-AA holds at every Colour intensity.

The section header SHALL be an **interactive disclosure control** (a `<button>`, not an
`aria-hidden` divider): activating it toggles that section's collapsed state (see Requirement:
Multi-source smart-folder sections are individually collapsible). It SHALL carry `aria-expanded`
reflecting the section's collapsed state and an accessible label naming the section (host and
filter), the count, and the toggle action. When a section is **collapsed**, the folder SHALL render
the section header (including its count) and hide the section body; when expanded, the body renders
normally.

The section header and its result rows SHALL stay at the same indentation — the disclosure
affordance SHALL NOT introduce an additional nesting indent (the layout is flat: collapse is
signalled by the section body's presence and the on-hover chevron, not indent depth).

The folder badge SHALL sum per-section attention counts: `Σ (item count for queue sections)
+ Σ (unread count for feed sections)`, counting each resolved section independently (an item
appearing in two filter sections counts in each) and **independent of any section's collapsed
state**. The `N+` cap triggers when any section has hit its `maxItems` cap. The badge never shows 0
(hidden when sum is 0). For a single-section folder the badge is identical to today.

Empty-state notes, ghost rows (first-fetch), signed-out/error/needs-access states, and the "open
work holds its row" behavior apply per resolved section. A section in `pending` (first-ever fetch)
renders three static ghost rows.

#### Scenario: A single-section folder renders identically to before this change

- **GIVEN** a smart folder with exactly one resolved section (one instance, one filter)
- **WHEN** the folder is expanded
- **THEN** no section header and no collapse control are rendered and the layout is visually identical to the pre-change behavior

#### Scenario: A two-filter instance renders sectioned with host · filter headers

- **GIVEN** a folder with one instance `{ source: 'gitlab', baseUrl: 'https://gitlab.com', queries: ['authored', 'review-requested'] }`, each section `ok` with items
- **WHEN** the folder is expanded
- **THEN** the folder renders: section header "gitlab.com · authored" → authored items → section header "gitlab.com · reviewing" → review-requested items

#### Scenario: The section header is a single disclosure slot

- **GIVEN** a two-source folder, expanded
- **WHEN** a section header renders
- **THEN** it presents ONE 16px leading slot — the source icon at rest — not a separate chevron plus source icon
- **AND** the chevron is revealed (crossfaded in, rotated to reflect expanded state) on the header's hover / keyboard focus

#### Scenario: The folder badge sums per-section attention counts regardless of collapse

- **GIVEN** a folder with a gitlab authored section (7 items) and a gitlab reviewing section (3 items), with the reviewing section collapsed
- **WHEN** the folder renders
- **THEN** the badge reads `10` (the collapsed section still contributes)

#### Scenario: A section header is a disclosure control

- **GIVEN** a two-source folder, expanded
- **WHEN** the gitlab section header renders
- **THEN** it is a button carrying `aria-expanded` and an accessible label naming the host, count, and toggle action — not an `aria-hidden` divider
