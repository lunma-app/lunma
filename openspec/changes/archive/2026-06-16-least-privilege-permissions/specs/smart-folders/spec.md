## MODIFIED Requirements

### Requirement: Smart-folder results are ephemeral runtime state

Query results SHALL live in a broadcast-only `AppState` slice
`smartFolders: { [folderId]: SmartFolderRuntime }` where `SmartFolderRuntime` is
`{ state: 'pending' | 'ok' | 'signed-out' | 'error' | 'needs-access'; items: SmartFolderItem[]; fetchedAt: number | null }`
and `SmartFolderItem` is
`{ id: string; title: string; url: string; status?: { tone: 'ok' | 'pending' | 'warn' | 'fail'; label: string } }`.
The slice SHALL never be persisted (the persistence exclusion is specified in the
`storage-and-migrations` capability) and SHALL be written only by the
coordinator drain: the connector performs network I/O outside the drain and
enqueues the internal event
`{ source: 'connector'; kind: 'smartFolders.result'; payload: { folderId, runtime } }`
— `'connector'` is a new `PendingEvent` source member added per the
`chrome-event-coordination` extension rule, with matching handlers-map and
`EventPolicy` entries (no coalescing) in the same change — whose handler calls
the store mutator `setSmartFolderRuntime(folderId, runtime)`, producing one
broadcast per drain. A refresh that begins while items exist SHALL mark the runtime `pending`
**without clearing `items`** (the list never blinks). After a SW restart the
slice is empty, so a smart folder renders its pending state until the first
fetch lands. The `'needs-access'` state means the folder's host origin is not
granted; it is produced without any network request (see "Connector fetches are
gated on a runtime host-permission grant").

#### Scenario: Results arrive through the single-writer drain

- **WHEN** a connector fetch completes for folder `f1`
- **THEN** the connector enqueues a `smartFolders.result` event and the coordinator handler writes the runtime via `setSmartFolderRuntime`
- **AND** exactly one `state-broadcast` carries the updated slice

#### Scenario: A refresh keeps last-known items visible

- **GIVEN** folder `f1`'s runtime is `ok` with 5 items
- **WHEN** a refresh begins
- **THEN** the runtime state becomes `pending` while `items` still holds the 5 items

#### Scenario: A SW restart costs one pending beat

- **WHEN** the SW restarts and the sidebar renders a smart folder before its first fetch completes
- **THEN** the folder renders the pending state (no stale items from disk)

## ADDED Requirements

### Requirement: Each connector declares the origins it fetches

The `SourceConnector` contract (`background/connectors/connector.ts`) SHALL
include `requiredOrigins(node): string[]`, returning the host match patterns the
connector actually fetches for that node — NOT necessarily the folder's
`baseUrl` origin. A `github` connector on `github.com` SHALL return
`['https://api.github.com/*']` (it fetches `api.github.com`); on GitHub
Enterprise it SHALL return the `baseUrl` origin. A `gitlab`, `jira`, or `rss`
connector SHALL return the `baseUrl` origin (`originPatternForBaseUrl(node.baseUrl)`).
The host-permission gate and the create/enable request SHALL use this set,
never `node.baseUrl` directly. The derivation itself SHALL live in a single pure
`shared/connector-origins.ts` export, `requiredOriginsForNode(node)`: the
`SourceConnector.requiredOrigins` members delegate to it (so the SW gate keys on
the connector member), and the sidebar/editor surfaces — which cannot import
`background/connectors` under the layer DAG — call it directly. There is exactly
one derivation, so the SW gate and the surface request never drift.

#### Scenario: GitHub declares the api origin it fetches

- **WHEN** `requiredOrigins` is called for a `github` folder on `https://github.com`
- **THEN** it SHALL return `['https://api.github.com/*']`, not `['https://github.com/*']`

#### Scenario: Same-origin connectors declare the baseUrl origin

- **WHEN** `requiredOrigins` is called for a `gitlab`, `jira`, or `rss` folder on `https://host.example.com/path`
- **THEN** it SHALL return `['https://host.example.com/*']`

### Requirement: Connector fetches are gated on a runtime host-permission grant

The smart-folder engine in `background/smart-folders.ts` SHALL check
`hasHostPermissions(connector.requiredOrigins(node))` (from
`shared/permissions.ts`) before dispatching a connector fetch for a folder. When
any required origin is not granted, the engine SHALL resolve the folder to the
`'needs-access'` runtime state **without performing any network request**. This
gate runs **before** the connector's auth short-circuit, so a folder that is both
host-ungranted and token-absent SHALL show `needs-access` (host access takes
precedence over `signed-out`); after the origins are granted, the refetch may
then surface `signed-out`. The gate applies to **all** sources, including RSS.
When `onPermissionsChange` reports that a required origin has been granted,
folders whose required origins are now all granted and that are due (or in
`needs-access`) SHALL refetch; when a required origin is revoked, affected
folders SHALL return to `needs-access`. Connectors SHALL remain bounded and SHALL
never throw on a missing grant.

#### Scenario: An ungranted origin short-circuits to needs-access without a fetch

- **GIVEN** a smart folder on `https://gitlab.example.com` whose required origin is not granted
- **WHEN** a poll for that folder is due
- **THEN** the engine SHALL set the runtime to `needs-access` and SHALL NOT issue a network request

#### Scenario: A GitHub folder gates on the api origin it fetches

- **GIVEN** a `github` folder on `https://github.com` with only `https://github.com/*` granted (not `https://api.github.com/*`)
- **WHEN** a poll is due
- **THEN** the engine SHALL resolve to `needs-access` (the connector's required origin `https://api.github.com/*` is ungranted) and SHALL NOT fetch

#### Scenario: An RSS feed on an ungranted origin shows needs-access

- **GIVEN** an `rss` folder whose feed origin is not granted
- **WHEN** a poll is due
- **THEN** the folder SHALL resolve to `needs-access` (not `error`) without a network request

#### Scenario: needs-access precedes signed-out

- **GIVEN** a token-only `github` folder whose api origin is ungranted AND no token is stored
- **WHEN** a poll is due
- **THEN** the folder SHALL show `needs-access` first, and only after the origin is granted MAY the refetch surface `signed-out`

#### Scenario: Granting the origins triggers a refetch

- **GIVEN** a folder in `needs-access` on `https://gitlab.example.com`
- **WHEN** the user grants `https://gitlab.example.com/*`
- **THEN** `onPermissionsChange` fires and the folder refetches, transitioning `needs-access` → `pending` → `ok`

#### Scenario: Revoking a required origin returns the folder to needs-access

- **GIVEN** a folder in `ok` whose required origin is then revoked via Chrome
- **WHEN** `onPermissionsChange` reports the removal
- **THEN** the engine SHALL set the folder to `needs-access`

### Requirement: Creating or enabling a smart folder requests its host origin

The `SmartFolderEditor` SHALL call
`requestHostPermissions(requiredOriginsForNode(node))` (the shared derivation —
the surface cannot import the connector) when it confirms a create or an edit
that changes the required origins (`createSmartFolder` / `updateSmartFolder`) —
it is an extension-page surface with a user gesture. A
grant proceeds to a normal first poll. A denial or dismissal SHALL NOT block the
operation: the folder SHALL still be created/updated and SHALL sit in
`needs-access` with the inline grant affordance. The user's configuration is
never lost to a permission dialog.

#### Scenario: Confirming a new GitHub folder requests the api origin

- **WHEN** the user confirms "New smart folder…" for `https://github.com`
- **THEN** the editor SHALL call `requestHostPermissions(['https://api.github.com/*'])` from the confirm handler
- **AND** on grant the folder begins its first fetch

#### Scenario: Denying the host still saves the folder

- **GIVEN** the user confirms a new smart folder
- **WHEN** the host-permission dialog is denied or dismissed
- **THEN** the folder SHALL still be created and SHALL render in `needs-access` with a "Grant access" affordance

### Requirement: The needs-access state renders a calm grant prompt

A folder in `needs-access` SHALL render quietly, in the calm non-`ok` family
(never a red error card): a single muted row with a key/lock-open `Icon`, the
copy "Lunma needs access to ⟨host⟩", and a "Grant access" control composed from
the `Button`/`Icon` primitives. Activating it from the sidebar SHALL call
`requestHostPermissions(requiredOriginsForNode(node))` (the shared derivation —
the surface cannot import the connector); on grant the folder transitions to
`pending`. `needs-access` SHALL be visually and behaviourally
distinct from `signed-out` (which concerns auth, not host access) and from
`error`. The grant affordance lives on the smart-folder card and in the editor
(which have the folder `node`); the options Connectors section SHALL remain
token management only.

#### Scenario: A needs-access folder shows the grant row

- **GIVEN** a folder on `https://gitlab.example.com` whose runtime is `needs-access`
- **WHEN** the folder is expanded in the sidebar
- **THEN** it renders one muted "Lunma needs access to gitlab.example.com" row with a "Grant access" control, and no red error card
- **AND** activating it calls `requestHostPermissions(['https://gitlab.example.com/*'])`
