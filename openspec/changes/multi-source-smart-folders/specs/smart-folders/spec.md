## MODIFIED Requirements

### Requirement: Smart-folder configuration persists as a pinned-tree node

A smart folder SHALL persist as a third `PinNode` kind in `pinnedBySpace`:
`{ kind: 'smart'; id: FolderId; name: string; icon: string; sources: SmartSourceConfig[]; maxItems: number; hideRead: boolean; refreshMinutes: number }`,
where `SmartSourceConfig` is `{ source: SmartSource; baseUrl: string; query?: SmartQuery }`.
The `sources` array SHALL contain at least one entry; the editor SHALL prevent confirming
with an empty list. The flat `source`, `baseUrl`, and `query?` fields on the smart node
are **removed** and replaced by `sources`.

`SmartSource` (`'gitlab' | 'github' | 'jira' | 'rss'`) and `SmartQuery`
(`'authored' | 'assigned' | 'review-requested'`) are unchanged. The same per-source
rules for `baseUrl` (normalized, trailing slash stripped, absolute http(s) only), `query`
(optional for feed sources, required for queue sources), and defaults per source apply to
each `SmartSourceConfig` entry, enforced by the SW's create/update handlers. The SW SHALL
throw when any entry's `baseUrl` does not parse as an absolute http(s) URL, or when a
`query` entry is omitted for a queue source.

The node persists **configuration only** — it SHALL NOT carry a `children` field; results
are ephemeral runtime state (see Requirement: Smart-folder results are ephemeral sectioned
runtime state). The node orders among pins exactly like a `folder` node and round-trips
`reorderPinned` losslessly; drag/drop and expand/collapse semantics are unchanged.

`icon` is minted by the SW on create from the **first** source entry's connector
`mintedIcon` when all sources share the same connector kind, otherwise from a new compound
icon: `'layers'` (a lucide glyph in the curated `ICON_NAMES` list). `refreshMinutes` and
`hideRead` are unchanged folder-level fields. `maxItems` applies per section (see
Requirement: Smart folders honour a per-section maximum item count).

#### Scenario: A smart folder survives restart as config only

- **WHEN** the SW boots with a persisted smart node in `pinnedBySpace`
- **THEN** the node is restored with its `sources`, `maxItems`, `hideRead`, and `refreshMinutes` intact
- **AND** no result items are read from storage

#### Scenario: A multi-source folder persists with two sources

- **WHEN** `createSmartFolder` is dispatched with `sources: [{ source: 'gitlab', baseUrl: 'https://gitlab.com', query: 'authored' }, { source: 'github', baseUrl: 'https://github.com', query: 'authored' }]` and the SW restarts
- **THEN** the node is restored with both sources intact and validates under the current-version schema

#### Scenario: baseUrl is normalized and validated per entry

- **WHEN** `createSmartFolder` is dispatched with a sources entry whose `baseUrl` is `'https://gitlab.example.com/'`
- **THEN** the stored entry's `baseUrl` SHALL be `https://gitlab.example.com` (trailing slash stripped)
- **AND** a dispatch with any entry's `baseUrl` not parsing as an absolute http(s) URL SHALL throw, with the ack carrying the error

#### Scenario: A queue source entry without query is rejected

- **WHEN** `createSmartFolder` is dispatched with a `gitlab` sources entry that omits `query`
- **THEN** the SW SHALL throw and the ack SHALL carry the error
- **AND** no node SHALL be persisted

#### Scenario: A feed source entry omits query

- **WHEN** `createSmartFolder` is dispatched with an `rss` sources entry that omits `query`
- **THEN** the stored entry SHALL have no `query` field
- **AND** the node is restored with `source: 'rss'` intact after a SW restart

#### Scenario: An empty sources array is rejected

- **WHEN** `createSmartFolder` is dispatched with `sources: []`
- **THEN** the SW SHALL throw and the ack SHALL carry the error

#### Scenario: A smart folder reorders among pins like a folder

- **WHEN** the user drags a smart folder above a pinned tab and the sidebar dispatches `reorderPinned` with the full post-drop tree
- **THEN** the smart node persists at its new position with all config fields unchanged

### Requirement: Smart-folder results are ephemeral sectioned runtime state

Query results SHALL live in a broadcast-only `AppState` slice
`smartFolders: { [folderId]: SmartFolderRuntime }` where `SmartFolderRuntime` is
`{ sections: { [sourceKey: string]: SmartSectionRuntime } }` and `SmartSectionRuntime` is
`{ state: 'pending' | 'ok' | 'signed-out' | 'error' | 'needs-access'; items: SmartFolderItem[]; fetchedAt: number | null }`.
`sourceKey` is derived as `${source}:${new URL(baseUrl).host}` from a `SmartSourceConfig`
entry and is the stable identity key for that section within the folder.

The slice SHALL never be persisted and SHALL be written only by the coordinator drain: a
connector fetch completes and enqueues the internal event
`{ source: 'connector'; kind: 'smartFolders.result'; payload: { folderId, sourceKey, runtime: SmartSectionRuntime } }`
whose handler calls `store.setSmartSectionRuntime(folderId, sourceKey, runtime)`, producing
one broadcast per drain (unchanged broadcast contract). A refresh that begins while items
exist SHALL mark each section's runtime `pending` **without clearing `items`** (no blink).
After a SW restart the slice is empty, so each section renders pending until its first fetch.

#### Scenario: Results arrive through the single-writer drain per section

- **WHEN** a connector fetch completes for folder `f1`, source key `gitlab:gitlab.com`
- **THEN** the connector enqueues a `smartFolders.result` event carrying `{ folderId: 'f1', sourceKey: 'gitlab:gitlab.com', runtime }` and the coordinator handler writes it via `setSmartSectionRuntime`
- **AND** exactly one `state-broadcast` carries the updated section

#### Scenario: A refresh keeps last-known items visible per section

- **GIVEN** folder `f1`'s section `gitlab:gitlab.com` runtime is `ok` with 5 items
- **WHEN** a refresh begins for that folder
- **THEN** the section state becomes `pending` while `items` still holds the 5 items

#### Scenario: A SW restart costs one pending beat per section

- **WHEN** the SW restarts and the sidebar renders a multi-source smart folder before its first fetches complete
- **THEN** each section renders the pending state (no stale items from disk)

### Requirement: Each connector declares the origins it fetches for a SmartSourceConfig

The `SourceConnector` contract (`background/connectors/connector.ts`) SHALL include
`requiredOrigins(cfg: SmartSourceConfig): string[]`, accepting a `SmartSourceConfig` (not
a full node), returning the host match patterns the connector actually fetches for that
config entry. The per-config derivation is unchanged: `github` on `github.com` returns
`['https://api.github.com/*']`; `gitlab`, `jira`, and `rss` return the `baseUrl` origin.

The shared utility `requiredOriginsForConfig(cfg: SmartSourceConfig): string[]` (renamed
from `requiredOriginsForNode` in `shared/connector-origins.ts`) returns the same result
and is the single derivation used by both the SW gate (via `SourceConnector.requiredOrigins`)
and the sidebar/editor (which cannot import `background/connectors` under the layer DAG).

For a multi-source folder, the engine computes the **union** of `requiredOriginsForConfig`
across all `sources[]` entries as the folder-level origin set, used only for the initial
`requestHostPermissions` call on create/edit. The per-section gate uses the per-config
result (see Requirement: Connector fetches are gated per-section on host-permission grants).

#### Scenario: GitHub declares the api origin it fetches

- **WHEN** `requiredOrigins` is called for a `github` config on `https://github.com`
- **THEN** it SHALL return `['https://api.github.com/*']`, not `['https://github.com/*']`

#### Scenario: Same-origin connectors declare the baseUrl origin

- **WHEN** `requiredOrigins` is called for a `gitlab`, `jira`, or `rss` config on `https://host.example.com/path`
- **THEN** it SHALL return `['https://host.example.com/*']`

#### Scenario: requiredOriginsForConfig is the sole derivation (no drift)

- **WHEN** the SW gate and the sidebar editor both resolve required origins for the same SmartSourceConfig
- **THEN** they SHALL use `requiredOriginsForConfig` from `shared/connector-origins.ts` and produce identical results

### Requirement: Connector fetches are gated per-section on host-permission grants

The smart-folder engine SHALL check `hasHostPermissions(requiredOriginsForConfig(cfg))`
**per section** (per `SmartSourceConfig` entry) before dispatching a connector fetch. When
any required origin for a section is not granted, that section SHALL resolve to
`'needs-access'` **without performing any network request**. Other sections whose origins
ARE granted SHALL proceed to fetch normally — partial grants are explicitly supported.

The `onPermissionsChange` behavior, refetch-on-grant, and return-to-needs-access-on-revoke
rules from the original requirement apply per-section. A folder whose ALL sections are in
`needs-access` has no granted sections; a folder where SOME sections are granted and some
are not shows mixed states in the sectioned render.

#### Scenario: A section on an ungranted origin shows needs-access while other sections fetch

- **GIVEN** a folder with sources `[gitlab:gitlab.com, github:github.com]` where `https://api.github.com/*` is not granted but `https://gitlab.com/*` is
- **WHEN** a poll is due
- **THEN** the `github:github.com` section resolves to `needs-access` without a network request
- **AND** the `gitlab:gitlab.com` section proceeds to fetch normally

#### Scenario: Granting one section's origin triggers only that section's refetch

- **GIVEN** a multi-source folder with `gitlab:gitlab.com` in `ok` and `github:github.com` in `needs-access`
- **WHEN** the user grants `https://api.github.com/*`
- **THEN** only the `github:github.com` section refetches (the gitlab section is unaffected)

### Requirement: Creating or enabling a smart folder requests the union of its sections' origins

The `SmartFolderEditor` SHALL call
`requestHostPermissions(unionOfRequiredOrigins(node.sources))` (a helper that unions
`requiredOriginsForConfig` across all `sources[]` entries) when it confirms a create or an
edit that changes any source entry's `baseUrl`. A grant proceeds to a normal first poll
for each section. A denial or dismissal SHALL NOT block the operation: the folder SHALL
still be created/updated and affected sections SHALL sit in `needs-access` with the inline
grant affordance.

#### Scenario: Confirming a new multi-source folder requests union origins

- **WHEN** the user confirms a new folder with `sources: [github, gitlab]`
- **THEN** the editor SHALL call `requestHostPermissions(['https://api.github.com/*', 'https://gitlab.com/*'])` from the confirm handler

#### Scenario: Denying union host still saves the folder with sections in needs-access

- **GIVEN** the user confirms a new multi-source folder
- **WHEN** the host-permission dialog is denied or dismissed
- **THEN** the folder SHALL still be created and SHALL render all sections in `needs-access`

### Requirement: The needs-access state renders a calm per-section grant prompt

A section in `needs-access` SHALL render a single muted "Lunma needs access to ⟨host⟩"
row with a "Grant access" control (composed from `Button`/`Icon` primitives) **inside
that section**, below the section header (when visible). Other sections in the same folder
SHALL render normally. Activating the grant row SHALL call
`requestHostPermissions(requiredOriginsForConfig(cfg))` for that section's config. The
visual treatment (muted, key icon, non-`error` styling) is unchanged.

#### Scenario: A folder with one granted and one needs-access section renders both

- **GIVEN** a folder with sections `gitlab:gitlab.com` (ok, 5 items) and `github:github.com` (needs-access)
- **WHEN** the folder is expanded
- **THEN** the `gitlab:gitlab.com` section renders its 5 items normally
- **AND** the `github:github.com` section renders one muted "Lunma needs access to api.github.com" row with a "Grant access" control

### Requirement: Connector implementations conform to the SourceConnector contract

The `SourceConnector` interface in `background/connectors/connector.ts` SHALL be updated:
`fetchRuntime` accepts `SmartSourceConfig` (not a full node) plus `ConnectorCaches?`:
`fetchRuntime(cfg: SmartSourceConfig, maxItems: number, caches?: ConnectorCaches): Promise<SmartSectionRuntime>`.
`maxItems` is passed separately (it is a folder-level field, not per-config).
`listingUrl` accepts `SmartSourceConfig` (unchanged semantics).
`requiredOrigins` accepts `SmartSourceConfig` (updated from full node — see Requirement: Each
connector declares the origins it fetches for a SmartSourceConfig).
`defaultBaseUrl` and `mintedIcon` are unchanged.

The engine's `fetchSmartSectionRuntime(cfg: SmartSourceConfig, maxItems: number, caches?)` entry
point dispatches to `CONNECTORS[cfg.source].fetchRuntime(cfg, maxItems, caches)`.

#### Scenario: A fetch dispatches through the registry by source config

- **WHEN** the engine refreshes a section whose config carries `source: 'rss'`
- **THEN** `CONNECTORS.rss.fetchRuntime(cfg, maxItems, caches)` performs the fetch and the result event reaches the drain

#### Scenario: The registry holds exactly the four shipped sources

- **WHEN** the `CONNECTORS` registry is inspected
- **THEN** its keys are exactly `gitlab`, `github`, `jira`, and `rss`

### Requirement: Polling and refresh scheduling (multi-source)

The single repeating alarm (`lunma/smart-folders-poll`) and cadence logic are unchanged.
On each tick, the engine fans out per `SmartSourceConfig` entry across all due folders,
fetching each section independently. `startSmartFolderRefresh(deps, node, caches?)` SHALL
iterate `node.sources`, derive each `sourceKey`, and call
`fetchSmartSectionRuntime(cfg, node.maxItems, caches)` for each entry in parallel (bounded
by the existing concurrency model). `refreshSmartFolder { spaceId, folderId }` SHALL
unconditionally refresh ALL sections of that folder.

#### Scenario: Only due folders refresh on a tick

- **GIVEN** folder A (`refreshMinutes: 5`, last fetched 6 minutes ago) with 2 sources, and folder B (`refreshMinutes: 30`, last fetched 10 minutes ago)
- **WHEN** the poll alarm fires
- **THEN** both of folder A's sections refresh and folder B's sections do not

### Requirement: Smart-item bindings give results namespaced pinned-tab activation

`smartItemBindings` is typed as `{ [folderId: FolderId]: { [namespacedItemId: string]: { [windowId: WindowId]: { tabId: TabId; allowGlob: string } } } }` in `AppState`, persisted at schema v8 (raised from v7 by this change). Each `namespacedItemId` SHALL be of the form `${sourceKey}:${nativeId}` where `sourceKey` is derived from the section's `SmartSourceConfig` and `nativeId` is the connector's native item id. This prevents collisions when two sources produce items with the same native id.

All open/close/bind/unbind behavior, the `dropSmartFolderBindings` demote-on-delete behavior, and the `isBound` tab-created guard are unchanged except that every slot read/write uses the namespaced id form. `openSmartItem` receives a `namespacedItemId` from the sidebar; the SW uses it as the binding key directly.

#### Scenario: Opening a smart item from a multi-source folder uses namespaced id

- **GIVEN** a folder with sources `[gitlab:gitlab.com, github:github.com]` and a gitlab item with native id `42`
- **WHEN** `openSmartItem { folderId, itemId: 'gitlab:gitlab.com:42', windowId: 100, spaceId }` is dispatched
- **THEN** a tab opens at the item's URL and is bound under `smartItemBindings[folderId]['gitlab:gitlab.com:42'][100]`

#### Scenario: Items from two sources with the same native id do not collide

- **GIVEN** a gitlab item `{ id: '42', ... }` and a jira item `{ id: '42', ... }` in the same folder
- **WHEN** both items are bound
- **THEN** `smartItemBindings[folderId]` SHALL hold separate keys `'gitlab:gitlab.com:42'` and `'jira:acme.atlassian.net:42'`

### Requirement: Smart-folder rendering with sectioned layout

The sidebar SHALL render a smart folder with a sectioned layout when it has ≥ 2 sources.
A single-source folder renders identically to today (no section headers, no visual change).

When expanded with ≥ 2 sources, the folder SHALL render, for each `SmartSourceConfig`
entry in `node.sources` order: (a) a **section header** row (source icon in `--text-dim` +
host label in `--text-muted`, `--font-size-xs`, 12px height) followed by (b) the section's
result rows using the existing per-kind rules (queue → status dots; feed → unread marks).
Section headers SHALL be implemented as `SmartSectionHeader.svelte` (a new component
composed of the `Icon` primitive only — no new primitives).

The folder badge SHALL sum per-section attention counts: `Σ (item count for queue sections)
+ Σ (unread count for feed sections)`. The `N+` cap triggers when any section has hit its
`maxItems` cap. The badge never shows 0 (hidden when sum is 0). For a single-source folder
the badge is identical to today.

Empty-state notes, ghost rows (first-fetch), signed-out/error/needs-access states, and
the "open work holds its row" behavior apply per section. A section in `pending`
(first-ever fetch) renders three static ghost rows.

#### Scenario: A single-source folder renders identically to before this change

- **GIVEN** a smart folder with exactly one source entry
- **WHEN** the folder is expanded
- **THEN** no section header is rendered and the layout is visually identical to the pre-change behavior

#### Scenario: A two-source folder renders sectioned

- **GIVEN** a smart folder with sources `[gitlab:gitlab.com, github:github.com]`, each `ok` with items
- **WHEN** the folder is expanded
- **THEN** the folder renders: section header "gitlab.com" → gitlab items → section header "api.github.com" → github items

#### Scenario: The folder badge sums per-section attention counts

- **GIVEN** a folder with a queue section (7 items) and a feed section (3 unread of 10)
- **WHEN** the folder renders
- **THEN** the badge reads `10`

#### Scenario: A section in needs-access renders inline while other sections render normally

- **GIVEN** a folder with sections `gitlab:ok:5items` and `github:needs-access`
- **WHEN** the folder is expanded
- **THEN** the gitlab section renders its 5 items; the github section renders one "Lunma needs access to api.github.com" row

### Requirement: Creation and configuration via the pinned-header menu (multi-source editor)

The `SmartFolderEditor.svelte` SHALL render a sub-source list: each entry shows a source
chip (small coloured pill: source icon + label, `--space-c-soft` background), a host/URL
label, and a remove `×` button. Below the list, an `+ Add source` ghost `Button` opens
an inline add-source panel (source picker → auto-URL → optional query picker → Add confirm).
Entries can be reordered via `Move up` / `Move down` controls (accessible from keyboard,
same pattern as pinned-row reorder).

The source `Select` and per-source URL/query fields from the existing editor are moved into
the per-entry form and the inline add-source panel. The existing source-adaptive behavior
(label "Feed URL" vs "Instance URL", query control hidden for rss, hint line, refresh
default) applies per-entry.

Confirming is blocked when `sources` is empty. A `baseUrl` or `source` change on an
existing entry triggers an immediate refetch of that section only (`updateSmartFolder`
carries the full new `sources[]`; the engine diffs to find changed entries).

#### Scenario: Creating a multi-source folder from the header menu

- **WHEN** the user opens "New smart folder…", adds a GitLab source and a GitHub source, and confirms
- **THEN** `createSmartFolder` is dispatched with `sources: [{ source: 'gitlab', ... }, { source: 'github', ... }]`
- **AND** the folder appears with two sections, each pending its first fetch

#### Scenario: Confirming with no sources is blocked

- **GIVEN** the editor is open with all sources removed
- **THEN** the Confirm button SHALL be disabled

#### Scenario: Removing a source from an existing folder updates it immediately

- **GIVEN** a folder with 3 sources; the user removes the second and confirms
- **THEN** `updateSmartFolder` carries `sources: [first, third]` and the folder's runtime drops the removed section

### Requirement: Smart folders honour a per-section maximum item count

`maxItems` is a folder-level field applied per section: each section shows up to `maxItems`
rows (queue cap) or up to `maxItems` unread rows (feed budget). The total visible rows
across all sections can be up to `N × maxItems` where N is the number of sources. The
folder badge sums per-section attention counts; the `N+` cap triggers when any section
has hit its `maxItems` cap. Migrated nodes default `maxItems: 20` (unchanged). The editor
label reads "per section" when the folder has ≥ 2 sources.

#### Scenario: The cap applies per section

- **GIVEN** a folder with `maxItems: 10`, a gitlab section returning 15 items, and an rss section with 20 unread
- **THEN** the gitlab section renders 10 items (capped) and the rss section renders 10 unread (budget)
- **AND** the badge reads `20+` (any section hit cap)

#### Scenario: Single-source folder cap is unchanged

- **GIVEN** a folder with exactly one source and `maxItems: 20` returning 25 items
- **THEN** the section renders 20 items and the badge reads `20+`

## ADDED Requirements

### Requirement: `SmartSourceConfig` is the per-section connector unit

`SmartSourceConfig` (`{ source: SmartSource; baseUrl: string; query?: SmartQuery }`) is
exported from `apps/extension/src/shared/types.ts` as the per-entry type for `sources[]`
on a smart `PinNode`. It is also the parameter type for `SourceConnector.fetchRuntime`,
`SourceConnector.requiredOrigins`, `SourceConnector.listingUrl`, and `requiredOriginsForConfig`
in `shared/connector-origins.ts`.

#### Scenario: SmartSourceConfig round-trips through the schema

- **WHEN** a `SmartSourceConfig` `{ source: 'rss', baseUrl: 'https://feeds.example.com/rss' }` is persisted and loaded
- **THEN** it SHALL parse cleanly under `SmartSourceConfigSchema` with no `query` field

### Requirement: Source key derivation is pure and stable

`sourceKey(cfg: SmartSourceConfig): string` in `background/smart-folders.ts` SHALL return
`${cfg.source}:${new URL(cfg.baseUrl).host}`. It SHALL be pure and SHALL NOT perform I/O.
The same derivation SHALL be used by `setSmartSectionRuntime`, `smartFolders.result` events,
and the `smartItemBindings` namespace.

#### Scenario: Source key is stable across renames

- **WHEN** a gitlab source on `https://gitlab.example.com` produces `sourceKey`
- **THEN** the key is `'gitlab:gitlab.example.com'` and is stable across folder name changes

### Requirement: `hideRead` and feed menu actions apply only to feed sections

`hideRead` and the "Mark all read" / "Show recently read" folder menu actions SHALL apply
only to sections whose `SmartSourceConfig` has `source: 'rss'`. Queue sections (gitlab /
github / jira) are unaffected. When a folder has NO feed sections, the "Mark all read"
and "Show recently read" menu items SHALL be absent from the folder menu.

#### Scenario: Mark all read on a mixed folder marks only feed sections

- **GIVEN** a folder with a gitlab section (4 items) and an rss section (6 unread)
- **WHEN** the user selects "Mark all read"
- **THEN** the rss section's items are all marked read (badge drops to 0 for that section)
- **AND** the gitlab section is unaffected
