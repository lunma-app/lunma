# opml-import-export Specification

## Purpose

Import and export RSS smart-folder subscriptions as OPML: parse uploaded OPML
into `{ name, feedUrl }` entries, serialise existing RSS smart folders to
OPML 1.0, bulk-create folders on import, and surface it in an options-page Feed
subscriptions card — so users can move feed lists in and out of Lunma.

## Requirements

### Requirement: OPML parse utility extracts RSS feed entries
`parseOpml(xml: string)` in `shared/opml.ts` SHALL use `saxes` to walk all
`<outline>` elements at any nesting depth, collect those with `type="rss"` and
a non-empty `xmlUrl` attribute, and return `{ name: string; feedUrl: string }[]`
where `name` is `text ?? title ?? xmlUrl` and `feedUrl` is `xmlUrl`. Container
outlines (no `xmlUrl`) SHALL be silently skipped. A `saxes` parse error SHALL
NOT throw — the function returns whatever entries were collected before the error.
An input with no qualifying outlines SHALL return an empty array.

#### Scenario: Flat OPML with RSS outlines
- **WHEN** `parseOpml` is called with a valid OPML string containing three `type="rss"` outlines at body level
- **THEN** it returns an array of three `{ name, feedUrl }` objects with the correct `xmlUrl` values

#### Scenario: Nested OPML (category wrapping feeds) is flattened
- **WHEN** `parseOpml` is called with OPML where feeds are nested inside category outlines
- **THEN** it returns the feed entries from all nesting levels, ignoring category outlines

#### Scenario: Outlines without xmlUrl are skipped
- **WHEN** `parseOpml` is called with OPML containing category outlines (no `xmlUrl`) mixed with feed outlines
- **THEN** only the feed outlines appear in the result; category outlines are absent

#### Scenario: name falls back through text → title → xmlUrl
- **WHEN** an `<outline>` has no `text` attribute but has a `title` attribute
- **THEN** the entry's `name` is the `title` value
- **WHEN** an `<outline>` has neither `text` nor `title`
- **THEN** the entry's `name` is the `xmlUrl` value

#### Scenario: Malformed XML does not throw
- **WHEN** `parseOpml` is called with truncated or invalid XML
- **THEN** it returns whatever entries were parsed before the error without throwing

#### Scenario: Non-OPML file returns empty array
- **WHEN** `parseOpml` is called with XML that contains no `type="rss"` outlines with `xmlUrl`
- **THEN** it returns an empty array

### Requirement: OPML build utility serialises RSS feed folders to OPML 1.0
`buildOpml(folders: SmartFolderNode[])` in `shared/opml.ts` SHALL accept an
array of `SmartFolderNode` values and return a valid OPML 1.0 XML string. Each
node where `source === 'rss'` SHALL produce one `<outline>` element with
attributes `type="rss"`, `text` (the node's `name`), `xmlUrl` (the node's
`baseUrl`), and `htmlUrl` (also the node's `baseUrl` — see design D6). The
output SHALL include a `<?xml?>` declaration, an `<opml version="1.0">` root,
a `<head>` with a `<title>` of `"Lunma feed subscriptions"`, and a `<body>`
containing the outlines. Nodes where `source !== 'rss'` SHALL be excluded.

#### Scenario: Single feed folder serialises correctly
- **WHEN** `buildOpml` is called with one RSS node (`name: "HN"`, `baseUrl: "https://hn.rss"`)
- **THEN** the output contains exactly one `<outline>` with `type="rss"`, `text="HN"`, `xmlUrl="https://hn.rss"`, and `htmlUrl="https://hn.rss"`

#### Scenario: Non-RSS nodes are excluded
- **WHEN** `buildOpml` is called with a mixed array containing both RSS and GitHub nodes
- **THEN** only the RSS node appears in the output

#### Scenario: htmlUrl equals baseUrl
- **WHEN** `buildOpml` is called with an RSS node
- **THEN** the `htmlUrl` attribute equals the node's `baseUrl`

### Requirement: importOpml bus command bulk-creates RSS smart folders
The `importOpml` `SidebarCommand` in the typed message bus SHALL be accepted by
the background coordinator. Its payload is
`{ spaceId: string; feeds: { name: string; feedUrl: string }[] }`. The handler
SHALL iterate `feeds` and apply the `createSmartFolder` logic for each entry
with `source: 'rss'`, `baseUrl: feedUrl`, `name`, `maxItems: 10`,
`refreshMinutes: 30`. Each entry is processed independently: a validation
failure on one entry (e.g. an invalid URL rejected by `normalizeBaseUrl`) SHALL
NOT prevent the remaining entries from being processed. The command SHALL
complete with a summary `{ imported: number; skipped: number }` returned as the
ack payload.

#### Scenario: All valid feeds are created
- **WHEN** `importOpml` is dispatched with three valid feed entries
- **THEN** three new RSS smart folders are created in the target space and `imported` equals 3

#### Scenario: Invalid feed URLs are skipped and counted
- **WHEN** `importOpml` is dispatched with two valid entries and one entry with a relative `feedUrl`
- **THEN** two folders are created, `imported` equals 2, and `skipped` equals 1

#### Scenario: Unknown spaceId throws
- **WHEN** `importOpml` is dispatched with a `spaceId` that does not exist in the store
- **THEN** the command acks with an error and no folders are created

#### Scenario: Empty feeds array is a no-op
- **WHEN** `importOpml` is dispatched with `feeds: []`
- **THEN** no folders are created and `imported` equals 0

### Requirement: Options-page Feed subscriptions card
A `FeedSubscriptions.svelte` component SHALL be mounted in `options/Options.svelte`
as a `Surface variant="glass"` card in the Options layout. It SHALL provide:

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
