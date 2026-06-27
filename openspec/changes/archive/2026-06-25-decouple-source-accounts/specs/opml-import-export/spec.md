<!-- The OPML capability is built on embedded `sources: LensSource[]`; under the
     account-reference model a lens node's `sources` are `LensSourceRef[]` (no
     provider/baseUrl), so build must resolve refs against `AppState.sources` and
     import must mint rss accounts before referencing them. -->

## MODIFIED Requirements

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

The import flow in `FeedSubscriptions.svelte` SHALL read "Found N feeds — import as one
folder into:" at the confirm step, with the Space `Select` and Cancel / Import buttons
unchanged. On successful import the `Toast` SHALL show `"Folder imported with N feeds"`
(`imported > 0, skipped === 0`) or `"Folder imported with N feeds (M skipped)"`
(`skipped > 0`); when `imported === 0` it SHALL show "No valid feed URLs found" instead.
The Export button's presence SHALL key on whether any lens references an **rss account**
(a `LensSourceRef` whose resolved account has `provider === 'rss'`), since the lens node
no longer carries `source` on its entries.

#### Scenario: Import confirm step shows updated copy

- **WHEN** the user selects an OPML file with 5 feed outlines
- **THEN** the confirm step SHALL show "Found 5 feeds — import as one folder into:" followed by a Space Select

#### Scenario: Toast on successful multi-feed import

- **WHEN** `importOpml` acks with `{ imported: 5, skipped: 0 }`
- **THEN** a Toast shows `"Folder imported with 5 feeds"`

#### Scenario: Toast on all-invalid import shows error

- **WHEN** `importOpml` acks with `{ imported: 0, skipped: 3 }`
- **THEN** a Toast or inline error message shows `"No valid feed URLs found"` and no success toast is shown

#### Scenario: Export button absent when no RSS account is referenced

- **WHEN** no lens references an account with `provider === 'rss'`
- **THEN** the Export button is not rendered

#### Scenario: Export button present when an RSS account is referenced

- **WHEN** at least one lens references an account with `provider === 'rss'`
- **THEN** the Export button is rendered and clicking it triggers a file download

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
