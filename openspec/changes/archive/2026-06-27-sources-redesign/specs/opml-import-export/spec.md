## MODIFIED Requirements

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
