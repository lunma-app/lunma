## MODIFIED Requirements

### Requirement: importOpml bus command creates one multi-source RSS smart folder

The `importOpml` `SidebarCommand` SHALL be accepted by the background coordinator with
the same payload shape: `{ spaceId: string; feeds: { name: string; feedUrl: string }[] }`.
The handler SHALL now create **one** RSS smart folder per import operation (not one folder
per feed entry). The single folder SHALL carry `sources: SmartSourceConfig[]` with one
entry per valid feed: `{ source: 'rss', baseUrl: feedUrl }` (no `query`, as RSS sources
are feed-kind). Invalid entries (unparseable or non-http(s) `feedUrl`) are silently
skipped and counted. The folder's name SHALL be the single feed's `name` when
`feeds.length === 1`; otherwise `"Feeds"`. Default `maxItems: 10`, `refreshMinutes: 30`,
`hideRead: true` (unchanged per-feed defaults, now applied folder-level). The command
SHALL complete with a summary `{ imported: number; skipped: number }` as the ack payload,
where `imported` is the count of valid sources added to the folder and `skipped` is the
count of invalid entries. When `imported === 0` (all entries invalid or `feeds` is empty)
no folder is created and the ack carries `{ imported: 0, skipped: N }`.

#### Scenario: All valid feeds create one multi-source folder

- **WHEN** `importOpml` is dispatched with three valid feed entries
- **THEN** exactly one RSS smart folder is created in the target space with `sources` containing three entries
- **AND** the ack carries `{ imported: 3, skipped: 0 }`

#### Scenario: Invalid feed URLs are skipped and counted; valid ones still create one folder

- **WHEN** `importOpml` is dispatched with two valid entries and one entry with a relative `feedUrl`
- **THEN** one folder is created with `sources` containing two entries
- **AND** the ack carries `{ imported: 2, skipped: 1 }`

#### Scenario: A single-feed import names the folder after the feed

- **WHEN** `importOpml` is dispatched with `feeds: [{ name: 'Hacker News', feedUrl: 'https://news.ycombinator.com/rss' }]`
- **THEN** the created folder's name SHALL be `'Hacker News'`

#### Scenario: A multi-feed import names the folder "Feeds"

- **WHEN** `importOpml` is dispatched with three feed entries
- **THEN** the created folder's name SHALL be `'Feeds'`

#### Scenario: Unknown spaceId throws

- **WHEN** `importOpml` is dispatched with a `spaceId` that does not exist in the store
- **THEN** the command acks with an error and no folder is created

#### Scenario: Empty feeds array is a no-op

- **WHEN** `importOpml` is dispatched with `feeds: []`
- **THEN** no folder is created and the ack carries `{ imported: 0, skipped: 0 }`

#### Scenario: All invalid entries is a no-op

- **WHEN** `importOpml` is dispatched with feeds all having invalid (relative) `feedUrl` values
- **THEN** no folder is created and the ack carries `{ imported: 0, skipped: N }`

### Requirement: OPML build utility serialises RSS sources from multi-source folders

`buildOpml(nodes: SmartFolderNode[])` in `shared/opml.ts` SHALL accept the updated
node shape (with `sources: SmartSourceConfig[]`) and for each node produce one `<outline>`
element per `SmartSourceConfig` entry whose `source === 'rss'`. The folder's `name` is
used as the `text` attribute for each outline when the folder is single-source; for
multi-source folders each outline's `text` is derived as
`${node.name} — ${new URL(cfg.baseUrl).host}` to distinguish entries from the same folder.
The `xmlUrl` and `htmlUrl` attributes continue to be set to `cfg.baseUrl` (unchanged).
Nodes where no `sources` entry has `source === 'rss'` produce no `<outline>`.

#### Scenario: A single-source RSS folder serialises one outline

- **WHEN** `buildOpml` is called with one RSS node (`name: "HN"`, single source `baseUrl: "https://hn.rss"`)
- **THEN** the output contains exactly one `<outline>` with `type="rss"`, `text="HN"`, `xmlUrl="https://hn.rss"`, and `htmlUrl="https://hn.rss"`

#### Scenario: A multi-source RSS folder serialises one outline per RSS source

- **WHEN** `buildOpml` is called with a folder named `"Feeds"` with two rss sources (`https://a.com/rss` and `https://b.com/rss`)
- **THEN** the output contains two `<outline>` elements: one for each source, with `text` `"Feeds — a.com"` and `"Feeds — b.com"` respectively

#### Scenario: Non-RSS sources in a mixed folder are excluded per-entry

- **WHEN** `buildOpml` is called with a folder containing sources `[{ source: 'gitlab', ... }, { source: 'rss', baseUrl: 'https://feed.example.com/rss' }]`
- **THEN** only the rss source appears as an `<outline>` in the output

### Requirement: Options-page Feed subscriptions card (import flow updated)

The import flow in `FeedSubscriptions.svelte` SHALL be updated to reflect the new
one-folder-per-import behaviour. The confirm step SHALL read:
"Found N feeds — import as one folder into:" (previously "Found N feeds — add to:").
The Space `Select` picker and Cancel / Import buttons are unchanged. On successful import,
the `Toast` SHALL show `"Folder imported with N feeds"` when `imported > 0` and
`skipped === 0`, or `"Folder imported with N feeds (M skipped)"` when `skipped > 0`.
When `imported === 0` (all entries invalid) the Toast SHALL show an error message
"No valid feed URLs found" instead of a success toast.

#### Scenario: Import confirm step shows updated copy

- **WHEN** the user selects an OPML file with 5 feed outlines
- **THEN** the confirm step SHALL show "Found 5 feeds — import as one folder into:" followed by a Space Select

#### Scenario: Toast on successful multi-feed import

- **WHEN** `importOpml` acks with `{ imported: 5, skipped: 0 }`
- **THEN** a Toast shows `"Folder imported with 5 feeds"`

#### Scenario: Toast with skip count

- **WHEN** `importOpml` acks with `{ imported: 3, skipped: 2 }`
- **THEN** a Toast shows `"Folder imported with 3 feeds (2 skipped)"`

#### Scenario: Toast on all-invalid import shows error

- **WHEN** `importOpml` acks with `{ imported: 0, skipped: 3 }`
- **THEN** a Toast or inline error message shows `"No valid feed URLs found"` and no success toast is shown

#### Scenario: Export button absent when no RSS sources exist

- **WHEN** the state has no smart node with any `source: 'rss'` entry in its `sources`
- **THEN** the Export button is not rendered

#### Scenario: Export button present when any RSS source exists

- **WHEN** the state has at least one smart node with a `source: 'rss'` entry
- **THEN** the Export button is rendered and clicking it triggers a file download
