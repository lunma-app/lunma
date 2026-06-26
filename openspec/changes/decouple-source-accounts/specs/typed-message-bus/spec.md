<!-- NOTE: the living "Lens lifecycle commands" requirement is several changes stale
     (it still describes the flat single-source/query payload, predating
     multi-source-smart-folders' `sources: LensSource[]` and review-lens's `lensKind`).
     This MODIFIED block rebases it onto current reality AND applies this change's
     reference-shape payloads — so it reconciles that pre-existing drift in passing. -->

## MODIFIED Requirements

### Requirement: Lens lifecycle commands

The `SidebarCommand` union SHALL include four lens lifecycle kinds; update/delete/refresh address `{ spaceId, folderId }`, matching the existing folder-command convention. After this change a lens's sources are **references to connected Accounts** (see the `connector-accounts` capability), so the create/update payloads carry `sources: LensSourceRef[]` (`{ sourceId: SourceId; queries: LensQuery[] }`) rather than embedded connector configs:

- `createLens` — `{ spaceId: SpaceId; sources: LensSourceRef[]; name: string; maxItems: number; refreshMinutes: number; lensKind?: LensKind }`. The SW mints the node id (`crypto.randomUUID`) and the `icon` (the first referenced account's provider `mintedIcon` when all referenced accounts share a provider, else `'layers'`), validates that every `sourceId` resolves to an existing `AppState.sources` account, clamps `refreshMinutes` to the floor of 5, inserts the node at the top of the Space's pinned list via `store.addLens(spaceId, node)`, stamps `lensKind` (defaulting to `'general'` when absent), retunes the poll alarm, and triggers an immediate first fetch. Unknown `spaceId`, an empty `sources`, or any unresolved `sourceId` SHALL throw (error ack).
- `updateLens` — `{ spaceId: SpaceId; folderId: FolderId; sources: LensSourceRef[]; name: string; maxItems: number; refreshMinutes: number; lensKind?: LensKind }`. Edits the node in place via `store.updateLens`; a `sources` (reference set) or filter change invalidates `fetchedAt` for the affected resolved sections and triggers an immediate refetch of those only. An absent `lensKind` preserves the existing kind. Unknown `spaceId`/`folderId`, an empty `sources`, or an unresolved `sourceId` SHALL throw.
- `deleteLens` — `{ spaceId: SpaceId; folderId: FolderId }`. Removes the node and drops its `lenses` runtime entry via `store.deleteLens`, then retunes (or clears) the poll alarm. No tabs are closed. Unknown `spaceId`/`folderId` SHALL throw.
- `refreshLens` — `{ spaceId: SpaceId; folderId: FolderId }`. Refreshes that folder unconditionally and acks `ok` once underway; the fetch **outcome** lands via the runtime slice and the state broadcast, never via the ack. Unknown `spaceId`/`folderId` SHALL throw.

All four payloads SHALL be validated by Zod schemas in the `bus.ts` discriminated union (`LensQuery` and the account `provider` as `z.enum`s over `['gitlab', 'github', 'jira', 'rss']`; `lensKind` over `['general', 'review']`). Connector fetch failures SHALL never reject any command ack.

#### Scenario: createLens references accounts and inserts a SW-minted node

- **WHEN** the sidebar dispatches `createLens` with `sources: [{ sourceId: 'acc-1', queries: ['review-requested'] }]` referencing an existing `github` account
- **THEN** the handler SHALL insert a `lens` node with a SW-minted id, the referenced account's minted icon, and the stamped `lensKind` at the top of `pinnedBySpace.work`, and trigger an immediate first fetch and ack `ok`

#### Scenario: createLens with an unresolved sourceId rejects

- **WHEN** a `createLens` payload carries a `sourceId` absent from `AppState.sources`
- **THEN** `SidebarCommandSchema` validation passes but the handler SHALL throw and the ack SHALL carry `{ error }`, and no node SHALL be persisted

#### Scenario: refreshLens acks before the fetch resolves

- **WHEN** the sidebar dispatches `refreshLens` for an existing folder
- **THEN** the ack SHALL be `ok` without awaiting the network fetch, and a subsequent `state-broadcast` SHALL carry the fetch outcome in the runtime slice

#### Scenario: Lifecycle commands on an unknown folder reject

- **WHEN** `updateLens`, `deleteLens`, or `refreshLens` is dispatched with a `spaceId` absent from `state.spaces`, or a `folderId` matching no lens node
- **THEN** the handler SHALL throw and the ack SHALL carry `{ error }`

## ADDED Requirements

### Requirement: Account lifecycle commands

The `SidebarCommand` union SHALL include three account lifecycle kinds operating on the persisted `AppState.sources` map (the token is NOT carried over the bus — it is written directly via `setAccountToken`; see the `connector-accounts` capability):

- `createAccount` — `{ id: SourceId; provider: LensProvider; baseUrl: string; name?: string }`. The `id` is **client-minted** (a UUID generated on the surface) so a surface can reference the new account inline in a following `createLens` without awaiting the `void` ack. The SW SHALL normalize/validate `baseUrl` (absolute http(s), trailing slash stripped; invalid throws), reject a duplicate `id` (error ack), and store the account via the single-writer store.
- `renameAccount` — `{ id: SourceId; name: string }`. Sets the account's display name. Unknown `id` SHALL throw.
- `deleteAccount` — `{ id: SourceId }`. Removes the account from `AppState.sources`. Lens references to the removed `sourceId` are left dangling and render the calm "account removed" state (the surface pairs this with `setAccountToken(id, null)` to clear the secret). Unknown `id` SHALL throw.

All three payloads SHALL be validated by Zod schemas in the `bus.ts` discriminated union, with `provider` as a `z.enum` over `['gitlab', 'github', 'jira', 'rss']`.

#### Scenario: createAccount persists a client-minted account

- **WHEN** the sidebar dispatches `createAccount` with `{ id: 'acc-1', provider: 'github', baseUrl: 'https://github.com/' }`
- **THEN** `AppState.sources['acc-1']` SHALL be stored with `baseUrl` normalized to `https://github.com`, and a subsequent `createLens` referencing `acc-1` SHALL resolve

#### Scenario: A duplicate account id rejects

- **WHEN** `createAccount` is dispatched with an `id` already present in `AppState.sources`
- **THEN** the handler SHALL throw and the ack SHALL carry `{ error }`

#### Scenario: deleteAccount removes the entity and leaves refs dangling

- **WHEN** `deleteAccount` is dispatched for an account referenced by a lens
- **THEN** `AppState.sources` drops the account and the referencing lens section renders the calm "account removed" state (no crash, no error ack)
