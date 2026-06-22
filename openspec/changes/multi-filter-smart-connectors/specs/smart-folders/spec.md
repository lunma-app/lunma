## MODIFIED Requirements

### Requirement: Smart-folder configuration persists as a pinned-tree node

A smart folder SHALL persist as a third `PinNode` kind in `pinnedBySpace`:
`{ kind: 'smart'; id: FolderId; name: string; icon: string; sources: SmartSourceConfig[]; maxItems: number; hideRead: boolean; refreshMinutes: number }`,
where `SmartSourceConfig` is `{ source: SmartSource; baseUrl: string; queries: SmartQuery[] }`.
Each `SmartSourceConfig` entry is one connector **instance** (source + host); its `queries`
array is the set of canned filters that instance contributes. The `sources` array SHALL contain
at least one entry; the editor SHALL prevent confirming with an empty list. The flat `source`,
`baseUrl`, and `query?` fields on the smart node remain **removed** (they were removed in the
multi-source change); the per-entry `query?` field is replaced by `queries`.

`SmartSource` (`'gitlab' | 'github' | 'jira' | 'rss'`) and `SmartQuery`
(`'authored' | 'assigned' | 'review-requested'`) are unchanged. A **queue** source
(gitlab/github/jira) entry SHALL carry a **non-empty** `queries` array (at least one filter);
a **feed** source (rss) entry SHALL carry `queries: []` (rss has no filter axis). The same
per-source rules for `baseUrl` (normalized, trailing slash stripped, absolute http(s) only) and
defaults per source apply to each entry, enforced by the SW's create/update handlers. The SW
SHALL throw when any entry's `baseUrl` does not parse as an absolute http(s) URL, or when a queue
source entry's `queries` is empty, or when an rss entry's `queries` is non-empty.

The node persists **configuration only** — it SHALL NOT carry a `children` field; results are
ephemeral runtime state (see Requirement: Smart-folder results are ephemeral sectioned runtime
state). The node orders among pins exactly like a `folder` node and round-trips `reorderPinned`
losslessly; drag/drop and expand/collapse semantics are unchanged.

`icon` is minted by the SW on create from the **first** source entry's connector `mintedIcon`
when all sources share the same connector kind, otherwise from the compound icon `'layers'` (a
lucide glyph in the curated `ICON_NAMES` list). The number of filters does not affect icon
minting — icon keys on connector kinds only. `refreshMinutes` and `hideRead` are unchanged
folder-level fields. `maxItems` applies per section (see Requirement: Smart folders honour a
per-folder maximum item count).

#### Scenario: A smart folder survives restart as config only

- **WHEN** the SW boots with a persisted smart node in `pinnedBySpace`
- **THEN** the node is restored with its `sources` (each carrying `queries`), `maxItems`, `hideRead`, and `refreshMinutes` intact
- **AND** no result items are read from storage

#### Scenario: A multi-filter instance persists with two queries

- **WHEN** `createSmartFolder` is dispatched with `sources: [{ source: 'gitlab', baseUrl: 'https://gitlab.com', queries: ['authored', 'review-requested'] }]` and the SW restarts
- **THEN** the node is restored with the single instance carrying both filters intact and validates under the current-version schema

#### Scenario: A multi-instance folder persists with two connectors

- **WHEN** `createSmartFolder` is dispatched with `sources: [{ source: 'gitlab', baseUrl: 'https://gitlab.com', queries: ['authored'] }, { source: 'github', baseUrl: 'https://github.com', queries: ['authored'] }]` and the SW restarts
- **THEN** the node is restored with both instances intact and validates under the current-version schema

#### Scenario: baseUrl is normalized and validated per entry

- **WHEN** `createSmartFolder` is dispatched with a sources entry whose `baseUrl` is `'https://gitlab.example.com/'`
- **THEN** the stored entry's `baseUrl` SHALL be `https://gitlab.example.com` (trailing slash stripped)
- **AND** a dispatch with any entry's `baseUrl` not parsing as an absolute http(s) URL SHALL throw, with the ack carrying the error

#### Scenario: A queue instance with an empty queries array is rejected

- **WHEN** `createSmartFolder` is dispatched with a `gitlab` sources entry whose `queries` is `[]`
- **THEN** the SW SHALL throw and the ack SHALL carry the error
- **AND** no node SHALL be persisted

#### Scenario: A feed entry carries an empty queries array

- **WHEN** `createSmartFolder` is dispatched with an `rss` sources entry with `queries: []`
- **THEN** the stored entry SHALL have `queries: []`
- **AND** the node is restored with `source: 'rss'` intact after a SW restart

#### Scenario: An empty sources array is rejected

- **WHEN** `createSmartFolder` is dispatched with `sources: []`
- **THEN** the SW SHALL throw and the ack SHALL carry the error

#### Scenario: A smart folder reorders among pins like a folder

- **WHEN** the user drags a smart folder above a pinned tab and the sidebar dispatches `reorderPinned` with the full post-drop tree
- **THEN** the smart node persists at its new position with all config fields unchanged

### Requirement: Smart-folder results are ephemeral runtime state

Query results SHALL live in a broadcast-only `AppState` slice
`smartFolders: { [folderId]: SmartFolderRuntime }` where `SmartFolderRuntime` is
`{ sections: { [sourceKey: string]: SmartSectionRuntime } }` and `SmartSectionRuntime` is
`{ state: 'pending' | 'ok' | 'signed-out' | 'error' | 'needs-access'; items: SmartFolderItem[]; fetchedAt: number | null }`.
`sourceKey` is the **per-filter** section identity: `${source}:${new URL(baseUrl).host}:${query}`
for a queue section, and `${source}:${new URL(baseUrl).host}` for an rss section (no query). It is
derived from a **resolved single-query config** produced by expanding a `SmartSourceConfig` over
its `queries[]`, and is the stable identity key for that section within the folder.

The slice SHALL never be persisted and SHALL be written only by the coordinator drain: a connector
fetch completes and enqueues the internal event
`{ source: 'connector'; kind: 'smartFolders.result'; payload: { folderId, sourceKey, runtime: SmartSectionRuntime } }`
whose handler calls `store.setSmartSectionRuntime(folderId, sourceKey, runtime)`, producing one
broadcast per drain (unchanged broadcast contract). A refresh that begins while items exist SHALL
mark each section's runtime `pending` **without clearing `items`** (no blink). After a SW restart
the slice is empty, so each section renders pending until its first fetch.

#### Scenario: Results arrive through the single-writer drain per section

- **WHEN** a connector fetch completes for folder `f1`, source key `gitlab:gitlab.com:authored`
- **THEN** the connector enqueues a `smartFolders.result` event carrying `{ folderId: 'f1', sourceKey: 'gitlab:gitlab.com:authored', runtime }` and the coordinator handler writes it via `setSmartSectionRuntime`
- **AND** exactly one `state-broadcast` carries the updated section

#### Scenario: Two filters of one instance occupy distinct sections

- **GIVEN** a folder with one instance `{ source: 'gitlab', baseUrl: 'https://gitlab.com', queries: ['authored', 'review-requested'] }`
- **WHEN** both sections fetch
- **THEN** the runtime holds two sections keyed `gitlab:gitlab.com:authored` and `gitlab:gitlab.com:review-requested`, neither overwriting the other

#### Scenario: A refresh keeps last-known items visible per section

- **GIVEN** folder `f1`'s section `gitlab:gitlab.com:authored` runtime is `ok` with 5 items
- **WHEN** a refresh begins for that folder
- **THEN** the section state becomes `pending` while `items` still holds the 5 items

#### Scenario: A SW restart costs one pending beat per section

- **WHEN** the SW restarts and the sidebar renders a multi-filter smart folder before its first fetches complete
- **THEN** each section renders the pending state (no stale items from disk)

### Requirement: Polling and refresh scheduling

On each tick the engine SHALL fan out per **resolved section** (one per `SmartSourceConfig` entry
for each of its `queries`, or a single section for an rss entry) across all due folders, fetching
each section independently; the single repeating alarm (`lunma/smart-folders-poll`) and cadence
logic are unchanged. `startSmartFolderRefresh(deps, node, caches?)` SHALL iterate `node.sources`, expand
each entry over its `queries[]` into resolved single-query configs (a single pass for rss), derive
each `sourceKey`, and call `fetchSmartSectionRuntime(cfg, node.maxItems, caches)` for each resolved
config in parallel (bounded by the existing concurrency model). Within one poll cycle, the engine
SHALL share `ConnectorCaches` across the filters of the same connector instance so per-instance
me-resolution (e.g. `/api/v4/user`) is performed at most once per instance per cycle.
`refreshSmartFolder { spaceId, folderId }` SHALL unconditionally refresh ALL resolved sections of
that folder.

#### Scenario: Only due folders refresh on a tick

- **GIVEN** folder A (`refreshMinutes: 5`, last fetched 6 minutes ago) with one gitlab instance carrying two filters, and folder B (`refreshMinutes: 30`, last fetched 10 minutes ago)
- **WHEN** the poll alarm fires
- **THEN** both of folder A's filter sections refresh and folder B's sections do not

#### Scenario: One me-resolution per instance per cycle

- **GIVEN** a gitlab instance carrying filters `['authored', 'assigned', 'review-requested']`
- **WHEN** the engine refreshes all three sections in one poll cycle
- **THEN** `/api/v4/user` is resolved once and reused across the three filter fetches (shared `ConnectorCaches`)

### Requirement: Connector implementations conform to the SourceConnector contract

The `SourceConnector` interface in `background/connectors/connector.ts` SHALL remain
**shape-stable**: `fetchRuntime` accepts a **resolved single-query** config (the engine expands `queries[]` before
dispatch; a connector never sees a `queries[]` array) plus `ConnectorCaches?`:
`fetchRuntime(cfg: ResolvedSourceConfig, maxItems: number, caches?: ConnectorCaches): Promise<SmartSectionRuntime>`,
where `ResolvedSourceConfig` is `{ source: SmartSource; baseUrl: string; query?: SmartQuery }`
(a single optional query, present for queue sources, absent for rss). `maxItems` is passed
separately. `listingUrl`, `requiredOrigins`, `defaultBaseUrl`, and `mintedIcon` accept the same
resolved config (origins and listing URLs are query-independent for the queue sources).

The engine's `fetchSmartSectionRuntime(cfg: ResolvedSourceConfig, maxItems, caches?)` entry point
dispatches to `CONNECTORS[cfg.source].fetchRuntime(cfg, maxItems, caches)`. The
`resolvedConfigs(node): ResolvedSourceConfig[]` helper performs the `sources[] × queries[]`
expansion and is the single derivation used by the engine fan-out, the origin union, and the
editor's section preview.

#### Scenario: A fetch dispatches through the registry by resolved config

- **WHEN** the engine refreshes a section whose resolved config carries `source: 'gitlab', query: 'authored'`
- **THEN** `CONNECTORS.gitlab.fetchRuntime(cfg, maxItems, caches)` performs the fetch with that single query and the result event reaches the drain

#### Scenario: The registry holds exactly the four shipped sources

- **WHEN** the `CONNECTORS` registry is inspected
- **THEN** its keys are exactly `gitlab`, `github`, `jira`, and `rss`

### Requirement: Smart-item bindings give results pinned-tab activation

`smartItemBindings` is typed as `{ [folderId: FolderId]: { [namespacedItemId: string]: { [windowId: WindowId]: { tabId: TabId; allowGlob: string } } } }` in `AppState`, persisted at schema v9 (raised from v8 by this change). Each `namespacedItemId` SHALL be of the form `${sourceKey}:${nativeId}` where `sourceKey` is the **per-filter** section key (`${source}:${host}:${query}` for queue sections, `${source}:${host}` for rss) and `nativeId` is the connector's native item id. This prevents collisions when two filters of the same instance — or two instances — produce items with the same native id.

All open/close/bind/unbind behavior, the `dropSmartFolderBindings` demote-on-delete behavior, and the `isBound` tab-created guard are unchanged except that every slot read/write uses the per-filter namespaced id form. `openSmartItem` receives a `namespacedItemId` from the sidebar; the SW uses it as the binding key directly.

#### Scenario: Opening a smart item from a multi-filter section uses the per-filter namespaced id

- **GIVEN** a folder with one gitlab instance carrying filters `['authored', 'review-requested']` and an authored item with native id `42`
- **WHEN** `openSmartItem { folderId, itemId: 'gitlab:gitlab.com:authored:42', windowId: 100, spaceId }` is dispatched
- **THEN** a tab opens at the item's URL and is bound under `smartItemBindings[folderId]['gitlab:gitlab.com:authored:42'][100]`

#### Scenario: The same MR in two filter sections binds independently

- **GIVEN** an MR with native id `42` appearing in both the `authored` and `review-requested` sections of one gitlab instance
- **WHEN** the row is activated in each section
- **THEN** `smartItemBindings[folderId]` SHALL hold separate keys `'gitlab:gitlab.com:authored:42'` and `'gitlab:gitlab.com:review-requested:42'`

### Requirement: Smart-folder rendering and the one-glyph restraint

The sidebar SHALL render a smart folder with a sectioned layout when it has ≥ 2 **resolved
sections** (counting each filter of each instance plus each rss feed). A folder with exactly one
resolved section renders identically to today (no section headers, no visual change).

When expanded with ≥ 2 resolved sections, the folder SHALL render, in `node.sources` order and
within each entry in `queries` order: (a) a **section header** row (source icon in `--text-dim` +
a label in `--text-muted`, `--font-size-xs`, 12px height) followed by (b) the section's result
rows using the existing per-kind rules (queue → status dots; feed → unread marks). The header
label SHALL be `host · filter` for a queue section (e.g. `gitlab.com · authored`, the filter using
the per-source query label) and `host` for an rss section. Section headers SHALL be implemented as
`SmartSectionHeader.svelte` (composed of the `Icon` primitive only — no new primitives).

The folder badge SHALL sum per-section attention counts: `Σ (item count for queue sections)
+ Σ (unread count for feed sections)`, counting each resolved section independently (an item
appearing in two filter sections counts in each). The `N+` cap triggers when any section has hit
its `maxItems` cap. The badge never shows 0 (hidden when sum is 0). For a single-section folder
the badge is identical to today.

Empty-state notes, ghost rows (first-fetch), signed-out/error/needs-access states, and the "open
work holds its row" behavior apply per resolved section. A section in `pending` (first-ever fetch)
renders three static ghost rows.

#### Scenario: A single-section folder renders identically to before this change

- **GIVEN** a smart folder with exactly one resolved section (one instance, one filter)
- **WHEN** the folder is expanded
- **THEN** no section header is rendered and the layout is visually identical to the pre-change behavior

#### Scenario: A two-filter instance renders sectioned with host · filter headers

- **GIVEN** a folder with one instance `{ source: 'gitlab', baseUrl: 'https://gitlab.com', queries: ['authored', 'review-requested'] }`, each section `ok` with items
- **WHEN** the folder is expanded
- **THEN** the folder renders: section header "gitlab.com · authored" → authored items → section header "gitlab.com · reviewing" → review-requested items

#### Scenario: The folder badge sums per-section attention counts

- **GIVEN** a folder with a gitlab authored section (7 items) and a gitlab reviewing section (3 items)
- **WHEN** the folder renders
- **THEN** the badge reads `10`

### Requirement: Creation and configuration via the pinned-header menu

The `SmartFolderEditor.svelte` SHALL render a per-**instance** list: each entry shows a source chip
(small coloured pill: source icon + label, `--space-c-soft` background), a host/URL label, a
**filter multi-select** (checkboxes for authored / assigned / review-requested, hidden for rss),
and a remove `×` button. Below the list, an `+ Add source` ghost `Button` opens an inline
add-source panel (source picker → auto-URL → for queue sources a filter multi-select → Add
confirm). Entries can be reordered via `Move up` / `Move down` controls (accessible from keyboard,
same pattern as pinned-row reorder).

The source `Select` and per-source URL field from the existing editor remain in the per-entry form
and the inline add-source panel; the single-query control is replaced by the filter multi-select.
The existing source-adaptive behavior (label "Feed URL" vs "Instance URL", filter control hidden
for rss, hint line, refresh default) applies per-entry. Adding a source whose `source:host` matches
an existing instance SHALL **merge** the new filter selections into that instance rather than being
dropped.

Confirming is blocked when `sources` is empty OR when any queue instance has zero filters selected.
A `baseUrl`, `source`, or `queries` change on an existing entry triggers an immediate refetch of the
affected sections only (`updateSmartFolder` carries the full new `sources[]`; the engine diffs
resolved sections to find added/removed/changed ones).

#### Scenario: Creating a multi-filter folder from the header menu

- **WHEN** the user opens "New smart folder…", adds a GitLab source, ticks "Authored" and "Reviewing", and confirms
- **THEN** `createSmartFolder` is dispatched with `sources: [{ source: 'gitlab', baseUrl: 'https://gitlab.com', queries: ['authored', 'review-requested'] }]`
- **AND** the folder appears with two sections, each pending its first fetch

#### Scenario: Confirming a queue instance with no filters is blocked

- **GIVEN** the editor has a gitlab instance with no filters ticked
- **THEN** the Confirm button SHALL be disabled

#### Scenario: Re-adding an existing instance merges filters

- **GIVEN** a folder already holding `{ source: 'gitlab', baseUrl: 'https://gitlab.com', queries: ['authored'] }`
- **WHEN** the user adds a GitLab source on the same host with "Reviewing" ticked
- **THEN** the existing instance's `queries` becomes `['authored', 'review-requested']` (merged, not a second entry)

#### Scenario: Removing a filter from an existing folder updates it immediately

- **GIVEN** a folder with a gitlab instance carrying `['authored', 'review-requested']`; the user unticks "Reviewing" and confirms
- **THEN** `updateSmartFolder` carries the instance with `queries: ['authored']` and the folder's runtime drops the `gitlab:gitlab.com:review-requested` section

### Requirement: Smart folders honour a per-folder maximum item count

`maxItems` is a folder-level field applied per **resolved section**: each section SHALL show up to
`maxItems` rows (queue cap) or up to `maxItems` unread rows (feed budget). The total visible rows
across all sections can be up to `S × maxItems` where S is the number of resolved sections
(instances × filters, plus feeds). The folder badge sums per-section attention counts; the `N+`
cap triggers when any section has hit its `maxItems` cap. Migrated nodes default `maxItems: 20`
(unchanged). The editor label reads "per section" when the folder has ≥ 2 resolved sections.

#### Scenario: The cap applies per resolved section

- **GIVEN** a folder with `maxItems: 10`, a gitlab instance with filters `['authored', 'review-requested']` returning 15 and 12 items, and an rss section with 20 unread
- **THEN** the authored section renders 10 items (capped), the reviewing section renders 10 items (capped), and the rss section renders 10 unread (budget)
- **AND** the badge reads `30+` (a section hit cap)

#### Scenario: Single-section folder cap is unchanged

- **GIVEN** a folder with exactly one resolved section and `maxItems: 20` returning 25 items
- **THEN** the section renders 20 items and the badge reads `20+`

### Requirement: `SmartSourceConfig` is the per-instance connector unit

`SmartSourceConfig` (`{ source: SmartSource; baseUrl: string; queries: SmartQuery[] }`) SHALL be
exported from `apps/extension/src/shared/types.ts` as the per-**instance** entry type for
`sources[]` on a smart `PinNode`. The per-**section** unit SHALL be `ResolvedSourceConfig`
(`{ source: SmartSource; baseUrl: string; query?: SmartQuery }`), produced by expanding a
`SmartSourceConfig` over its `queries[]`. `ResolvedSourceConfig` is the parameter type for
`SourceConnector.fetchRuntime`, `SourceConnector.requiredOrigins`, `SourceConnector.listingUrl`,
and `requiredOriginsForConfig` in `shared/connector-origins.ts`.

#### Scenario: SmartSourceConfig round-trips through the schema

- **WHEN** a `SmartSourceConfig` `{ source: 'rss', baseUrl: 'https://feeds.example.com/rss', queries: [] }` is persisted and loaded
- **THEN** it SHALL parse cleanly under `SmartSourceConfigSchema` with an empty `queries`

#### Scenario: A queue SmartSourceConfig expands to one ResolvedSourceConfig per filter

- **WHEN** `resolvedConfigs` expands `{ source: 'gitlab', baseUrl: 'https://gitlab.com', queries: ['authored', 'assigned'] }`
- **THEN** it yields two `ResolvedSourceConfig`s `{ source: 'gitlab', baseUrl: 'https://gitlab.com', query: 'authored' }` and `{ …, query: 'assigned' }`

### Requirement: Source key derivation is pure and stable

`sourceKey(cfg: ResolvedSourceConfig): string` in `background/smart-folders.ts` SHALL return
`${cfg.source}:${new URL(cfg.baseUrl).host}:${cfg.query}` when `cfg.query` is present (queue
sections), and `${cfg.source}:${new URL(cfg.baseUrl).host}` when it is absent (rss). It SHALL be
pure and SHALL NOT perform I/O. The same derivation SHALL be used by `setSmartSectionRuntime`,
`smartFolders.result` events, and the `smartItemBindings` namespace.

#### Scenario: Source key includes the filter for a queue section

- **WHEN** a gitlab authored section on `https://gitlab.example.com` produces `sourceKey`
- **THEN** the key is `'gitlab:gitlab.example.com:authored'` and is stable across folder name changes

#### Scenario: An rss source key omits the query

- **WHEN** an rss section on `https://feeds.example.com/rss` produces `sourceKey`
- **THEN** the key is `'rss:feeds.example.com'`

### Requirement: Each connector declares the origins it fetches

The `SourceConnector` contract (`background/connectors/connector.ts`) SHALL include
`requiredOrigins(cfg: ResolvedSourceConfig): string[]`, accepting a resolved single-query config,
returning the host match patterns the connector actually fetches for that config. The derivation is
query-independent: `github` on `github.com` returns `['https://api.github.com/*']`; `gitlab`,
`jira`, and `rss` return the `baseUrl` origin.

The shared utility `requiredOriginsForConfig(cfg: ResolvedSourceConfig): string[]` in
`shared/connector-origins.ts` returns the same result and is the single derivation used by both the
SW gate (via `SourceConnector.requiredOrigins`) and the sidebar/editor (which cannot import
`background/connectors` under the layer DAG).

For a folder, the engine computes the **union** of `requiredOriginsForConfig` across all resolved
sections as the folder-level origin set, used only for the initial `requestHostPermissions` call on
create/edit. Because origins are query-independent, the union is equivalently computed once per
instance (the filters of one instance share an origin). The per-section gate uses the per-config
result (see Requirement: Connector fetches are gated on a runtime host-permission grant).

#### Scenario: GitHub declares the api origin it fetches

- **WHEN** `requiredOrigins` is called for a `github` resolved config on `https://github.com`
- **THEN** it SHALL return `['https://api.github.com/*']`, not `['https://github.com/*']`

#### Scenario: Two filters of one instance share one origin

- **WHEN** the union is computed for a gitlab instance carrying `['authored', 'assigned']` on `https://gitlab.com`
- **THEN** the union contains `https://gitlab.com/*` once (filters do not multiply origins)

### Requirement: Connector fetches are gated on a runtime host-permission grant

The smart-folder engine SHALL check `hasHostPermissions(requiredOriginsForConfig(cfg))`
**per resolved section** (per `ResolvedSourceConfig`, i.e. per instance × filter, or a single
rss section) before dispatching a connector fetch. When any required origin for a section is not
granted, that section SHALL resolve to `'needs-access'` **without performing any network request**.
Other sections whose origins ARE granted SHALL proceed to fetch normally — partial grants are
explicitly supported. Because origins are query-independent, all filter sections of one instance
share the same grant state.

The `onPermissionsChange` behavior, refetch-on-grant, and return-to-needs-access-on-revoke rules
from the original requirement apply per resolved section. A folder whose ALL sections are in
`needs-access` has no granted sections; a folder where SOME sections are granted and some are not
shows mixed states in the sectioned render.

#### Scenario: A section on an ungranted origin shows needs-access while other sections fetch

- **GIVEN** a folder with sections `[gitlab:gitlab.com:authored, github:github.com:authored]` where `https://api.github.com/*` is not granted but `https://gitlab.com/*` is
- **WHEN** a poll is due
- **THEN** the `github:github.com:authored` section resolves to `needs-access` without a network request
- **AND** the `gitlab:gitlab.com:authored` section proceeds to fetch normally

#### Scenario: Granting an instance's origin refetches all its filter sections

- **GIVEN** a folder with a gitlab instance carrying `['authored', 'review-requested']` (both sections `needs-access`) and a granted github section
- **WHEN** the user grants `https://gitlab.com/*`
- **THEN** both gitlab filter sections refetch (they share the instance origin) and the github section is unaffected

### Requirement: Creating or enabling a smart folder requests its host origin

The `SmartFolderEditor` SHALL call `requestHostPermissions(unionOfRequiredOrigins(node))` (a helper
that unions `requiredOriginsForConfig` across `resolvedConfigs(node)`; because origins are
query-independent this is equivalently the union over the distinct instances) when it confirms a
create or an edit that changes any instance's `baseUrl` or `source`. A grant proceeds to a normal
first poll for each resolved section. A denial or dismissal SHALL NOT block the operation: the
folder SHALL still be created/updated and affected sections SHALL sit in `needs-access` with the
inline grant affordance.

#### Scenario: Confirming a new multi-instance folder requests union origins

- **WHEN** the user confirms a new folder with a github instance and a gitlab instance
- **THEN** the editor SHALL call `requestHostPermissions(['https://api.github.com/*', 'https://gitlab.com/*'])` from the confirm handler

#### Scenario: Adding a second filter to a granted instance requests no new origin

- **GIVEN** an existing folder whose gitlab instance (origin already granted) carries `['authored']`
- **WHEN** the user adds the `review-requested` filter and confirms
- **THEN** the union origin set is unchanged, so no new host-permission dialog is shown and the new section polls immediately

#### Scenario: Denying union host still saves the folder with sections in needs-access

- **GIVEN** the user confirms a new multi-instance folder
- **WHEN** the host-permission dialog is denied or dismissed
- **THEN** the folder SHALL still be created and SHALL render all sections in `needs-access`

### Requirement: The needs-access state renders a calm grant prompt

A resolved section in `needs-access` SHALL render a single muted "Lunma needs access to ⟨host⟩" row
with a "Grant access" control (composed from `Button`/`Icon` primitives) **inside that section**,
below the section header (when visible). Other sections in the same folder SHALL render normally.
Activating the grant row SHALL call `requestHostPermissions(requiredOriginsForConfig(cfg))` for that
section's `ResolvedSourceConfig`. The visual treatment (muted, key icon, non-`error` styling) is
unchanged.

#### Scenario: A folder with one granted and one needs-access section renders both

- **GIVEN** a folder with sections `gitlab:gitlab.com:authored` (ok, 5 items) and `github:github.com:authored` (needs-access)
- **WHEN** the folder is expanded
- **THEN** the `gitlab:gitlab.com:authored` section renders its 5 items normally
- **AND** the `github:github.com:authored` section renders one muted "Lunma needs access to api.github.com" row with a "Grant access" control
