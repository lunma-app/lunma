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

The `buildOpml` utility in `shared/opml.ts` SHALL accept the lens nodes plus the
`AppState.sources` account map (its signature widens to `buildOpml(nodes, sources)`) and,
for each node, produce one `<outline>` element per `LensSourceRef` whose **resolved
account** has `provider === 'rss'`. A reference whose `sourceId` is absent from `sources`
SHALL be skipped. The folder's `name` SHALL be the `text` attribute for each outline when
the folder resolves to a single rss source; for folders resolving to multiple rss sources
each outline's `text` SHALL be the folder name and the account host. The `xmlUrl` and
`htmlUrl` attributes SHALL be the resolved account's `baseUrl`. Nodes with no
rss-resolving reference SHALL produce no `<outline>`.

#### Scenario: A single-source RSS folder serialises one outline

- **WHEN** `buildOpml` is called with one node referencing one rss account (`name: "HN"`, account `baseUrl: "https://hn.rss"`) and that account in `sources`
- **THEN** the output contains exactly one `<outline>` with `type="rss"`, `text="HN"`, `xmlUrl="https://hn.rss"`, and `htmlUrl="https://hn.rss"`

#### Scenario: A multi-source RSS folder serialises one outline per resolved RSS source

- **WHEN** `buildOpml` is called with a node named `"Feeds"` referencing two rss accounts (`https://a.com/rss` and `https://b.com/rss`)
- **THEN** the output contains two `<outline>` elements with `text` `"Feeds — a.com"` and `"Feeds — b.com"`

#### Scenario: Non-RSS references are excluded; a dangling ref is skipped

- **WHEN** `buildOpml` is called with a node referencing a `gitlab` account and an `rss` account, plus a ref whose `sourceId` is absent from `sources`
- **THEN** only the resolved rss account appears as an `<outline>`; the gitlab and dangling refs produce none

### Requirement: Options-page Feed subscriptions card

Feed management on the options page SHALL live in the **Feeds** group of the
Connections manager (see the `connector-accounts` capability), not a separate Feed
subscriptions card. **OPML import** SHALL be reached from the RSS feed branch of the
shared Service-dropdown connect picker. The **standalone-import** behavior below applies
only to the **Options Connections manager** mode (the picker hosted with target
`spaces`); when the picker is hosted by the **lens editor** (an `onImportFeeds` callback,
no `spaces`), OPML import instead adds the feeds INTO the lens being assembled and SHALL
NOT dispatch `importOpml` or create a standalone lens (see the `connector-accounts` and
`lenses` capabilities). In the Options/standalone mode the import flow SHALL read
"Found N feeds — import as one folder into:" at the confirm step, with the Space `Select`
and Cancel / Import buttons unchanged. On successful import the `Toast` SHALL show
`"Folder imported with N feeds"` (`imported > 0, skipped === 0`) or
`"Folder imported with N feeds (M skipped)"` (`skipped > 0`); when `imported === 0` it
SHALL show "No valid feed URLs found" instead. **Export OPML** SHALL be a utility on the
Feeds group header; its presence SHALL key on whether any lens references an **rss
account** (a `LensSourceRef` whose resolved account has `provider === 'rss'`).

#### Scenario: Import confirm step shows updated copy

- **WHEN** the user chooses "Import OPML" in the connect picker's RSS branch (Options manager, `spaces` passed) and selects an OPML file with 5 feed outlines
- **THEN** the confirm step SHALL show "Found 5 feeds — import as one folder into:" followed by a Space Select

#### Scenario: Editor OPML import does not create a standalone lens

- **WHEN** the connect picker is hosted by the lens editor (`onImportFeeds`, no `spaces`) and the user imports an OPML file
- **THEN** the confirm step SHALL omit the Space Select, read "Found N feeds — add to this lens:", and on confirm SHALL add the feeds into the edited lens WITHOUT dispatching `importOpml`

#### Scenario: Toast on successful multi-feed import

- **WHEN** `importOpml` acks with `{ imported: 5, skipped: 0 }`
- **THEN** a Toast shows `"Folder imported with 5 feeds"`

#### Scenario: Toast on all-invalid import shows error

- **WHEN** `importOpml` acks with `{ imported: 0, skipped: 3 }`
- **THEN** a Toast or inline error message shows `"No valid feed URLs found"` and no success toast is shown

#### Scenario: Export utility absent when no RSS account is referenced

- **WHEN** no lens references an account with `provider === 'rss'`
- **THEN** the Export OPML utility is not rendered on the Feeds group header

#### Scenario: Export utility present when an RSS account is referenced

- **WHEN** at least one lens references an account with `provider === 'rss'`
- **THEN** the Export OPML utility is rendered on the Feeds group header and clicking it triggers a file download

### Requirement: importOpml bus command bulk-creates RSS lenses

The `importOpml` `SidebarCommand` SHALL keep the payload shape
`{ spaceId: string; feeds: { name: string; feedUrl: string }[] }`. The handler SHALL
create **one** RSS lens per import. For each valid feed (`feedUrl` parses as absolute
http(s)) the handler SHALL **find-or-mint an rss `SourceAccount`** for that feed URL
(de-duplicated by normalized `baseUrl`; reusing an existing rss account on the same URL,
else minting a new SW-generated-id account into `AppState.sources`), and the lens SHALL
carry `sources: LensSourceRef[]` with one `{ sourceId, queries: [] }` entry per valid feed.
Invalid entries are silently skipped and counted. The lens name SHALL be the single feed's
`name` when `feeds.length === 1`, else `"Feeds"`; defaults `maxItems: 10`,
`refreshMinutes: 30`, `hideRead: true`. The ack payload SHALL be
`{ imported: number; skipped: number }` (`imported` = valid feeds referenced). When
`imported === 0` no lens (and no account) SHALL be created.

#### Scenario: All valid feeds create one folder referencing minted rss accounts

- **WHEN** `importOpml` is dispatched with three valid feed entries
- **THEN** one RSS lens is created whose `sources` holds three `LensSourceRef`s, each referencing an rss account in `AppState.sources`, and the ack carries `{ imported: 3, skipped: 0 }`

#### Scenario: A feed URL already backed by an account reuses it

- **WHEN** `importOpml` imports a `feedUrl` for which an rss account already exists
- **THEN** the lens reference SHALL point at the existing account's id (no duplicate account is minted)

#### Scenario: Invalid feed URLs are skipped and counted

- **WHEN** `importOpml` is dispatched with two valid entries and one relative `feedUrl`
- **THEN** one lens is created with two references and the ack carries `{ imported: 2, skipped: 1 }`

#### Scenario: Empty or all-invalid import creates nothing

- **WHEN** `importOpml` is dispatched with `feeds: []` or only invalid entries
- **THEN** no lens and no account are created and the ack carries `{ imported: 0, skipped: N }`

