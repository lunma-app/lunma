## MODIFIED Requirements

### Requirement: Options-page Feed subscriptions card
A `FeedSubscriptions.svelte` component SHALL be mounted in `options/Options.svelte`
as a card composing the shared `SettingsCard` primitive (which renders the glass
`Surface` frame and the serif `CardHeading`) in the Options layout, with its
inline error message rendered through the shared `InlineError` primitive. It SHALL
provide:

**Import flow:**
- An "Import from OPML" primary `Button` that opens a hidden
  `<input type="file" accept=".opml,.xml">`.
- After file selection, `parseOpml` is called client-side. If the result is
  empty, an error message SHALL be shown ("No RSS feeds found in this file")
  and the confirm step SHALL NOT appear.
- If feeds are found, a confirm step SHALL replace the button row, showing the
  feed count, a `Select` of available Space names (populated from
  `AppState.pinnedTree` Space nodes, defaulting to the first Space), a Cancel
  ghost `Button`, and an Import primary `Button`.
- Confirming SHALL dispatch `importOpml` with the selected `spaceId` and the
  parsed feeds. On success, a `Toast` SHALL show `"N feeds imported"` (or
  `"N feeds imported, M skipped"` when M > 0). On error, an error message SHALL
  be shown.

**Export flow:**
- An "Export as OPML" ghost `Button` SHALL be rendered only when at least one
  `source: 'rss'` folder exists in any Space in the current state.
- Clicking it SHALL call `buildOpml` with all RSS nodes from `AppState.pinnedTree`,
  generate a download of `lunma-feeds-{date}.opml`, and show a `Toast`
  (`"Feeds exported"`).

#### Scenario: Import shows confirm step with feed count and space picker
- **WHEN** the user selects an OPML file with 5 feed outlines
- **THEN** the confirm step appears showing "Found 5 feeds — add to:" followed by a Space Select

#### Scenario: Import error for no feeds found
- **WHEN** the user selects a file that parses to zero RSS entries
- **THEN** an error alert is shown and the confirm step does not appear

#### Scenario: Export button absent when no RSS folders exist
- **WHEN** the state has no `source: 'rss'` pinned nodes
- **THEN** the Export button is not rendered

#### Scenario: Export button present when RSS folders exist
- **WHEN** the state has at least one `source: 'rss'` pinned node
- **THEN** the Export button is rendered and clicking it triggers a file download

#### Scenario: Toast on successful import
- **WHEN** `importOpml` acks with `{ imported: 3, skipped: 0 }`
- **THEN** a Toast shows "3 feeds imported"

#### Scenario: Toast with skip count when some entries are skipped
- **WHEN** `importOpml` acks with `{ imported: 2, skipped: 1 }`
- **THEN** a Toast shows "2 feeds imported, 1 skipped"
