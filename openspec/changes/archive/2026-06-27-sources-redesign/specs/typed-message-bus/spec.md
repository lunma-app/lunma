## MODIFIED Requirements

### Requirement: Lens lifecycle commands

The `SidebarCommand` union SHALL include four lens lifecycle kinds; update/delete/refresh address `{ spaceId, folderId }`, matching the existing folder-command convention. A lens's sources are **references to connected Accounts** (see the `connector-accounts` capability), so the create/update payloads carry `sources: LensSourceRef[]` (`{ sourceId: SourceId; queries: LensQuery[] }`) rather than embedded connector configs. The payloads SHALL **not** carry `lensKind`; the SW **derives** it from the source set (see the `lenses` capability — any `github`/`gitlab` source ⇒ `'review'`, else `'general'`):

- `createLens` — `{ spaceId: SpaceId; id?: FolderId; sources: LensSourceRef[]; name: string; maxItems: number; refreshMinutes: number }`. The node id is the **optional client-minted `id`** when present (mirroring `createAccount`'s client-minted id, so the editor can open the new lens's overview page without awaiting an ack), else the SW mints `crypto.randomUUID()`. The SW mints the `icon` (the first referenced account's provider `mintedIcon` when all referenced accounts share a provider, else `'layers'`), validates that every `sourceId` resolves to an existing `AppState.sources` account, clamps `refreshMinutes` to the floor of 5, inserts the node at the top of the Space's pinned list via `store.addLens(spaceId, node)`, **derives and stamps `lensKind` from the sources**, retunes the poll alarm, and triggers an immediate first fetch. Unknown `spaceId`, an empty `sources`, or any unresolved `sourceId` SHALL throw (error ack).
- `updateLens` — `{ spaceId: SpaceId; folderId: FolderId; sources: LensSourceRef[]; name: string; maxItems: number; refreshMinutes: number }`. Edits the node in place via `store.updateLens`; a `sources` (reference set) or filter change invalidates `fetchedAt` for the affected resolved sections and triggers an immediate refetch of those only. The SW **re-derives `lensKind` from the (possibly edited) sources**. Unknown `spaceId`/`folderId`, an empty `sources`, or an unresolved `sourceId` SHALL throw.
- `deleteLens` — `{ spaceId: SpaceId; folderId: FolderId }`. Removes the node and drops its `lenses` runtime entry via `store.deleteLens`, then retunes (or clears) the poll alarm. No tabs are closed. Unknown `spaceId`/`folderId` SHALL throw.
- `refreshLens` — `{ spaceId: SpaceId; folderId: FolderId }`. Refreshes that folder unconditionally and acks `ok` once underway; the fetch **outcome** lands via the runtime slice and the state broadcast, never via the ack. Unknown `spaceId`/`folderId` SHALL throw.

All four payloads SHALL be validated by Zod schemas in the `bus.ts` discriminated union (`LensQuery` and the account `provider` as `z.enum`s over `['gitlab', 'github', 'jira', 'rss']`); `lensKind` SHALL NOT appear in any lens-command payload schema (it is derived by the SW, never sent). The `createLens` payload MAY carry an optional client-minted `id` (the SW uses it, else mints one). Connector fetch failures SHALL never reject any command ack.

#### Scenario: createLens references accounts and the SW derives the kind

- **WHEN** the sidebar dispatches `createLens` with `sources: [{ sourceId: 'acc-1', queries: ['review-requested'] }]` referencing an existing `github` account (and no `lensKind`)
- **THEN** the handler SHALL insert a `lens` node with a SW-minted id, the referenced account's minted icon, and a **derived `lensKind: 'review'`** at the top of `pinnedBySpace.work`, and trigger an immediate first fetch and ack `ok`

#### Scenario: createLens with an unresolved sourceId rejects

- **WHEN** a `createLens` payload carries a `sourceId` absent from `AppState.sources`
- **THEN** `SidebarCommandSchema` validation passes but the handler SHALL throw and the ack SHALL carry `{ error }`, and no node SHALL be persisted

#### Scenario: lensKind is not part of the lens-command contract

- **WHEN** the `bus.ts` `createLens`/`updateLens` payload schemas are inspected
- **THEN** neither declares a `lensKind` field, and the handler SHALL derive the kind from the sources irrespective of any extraneous field a caller might send

#### Scenario: refreshLens acks before the fetch resolves

- **WHEN** the sidebar dispatches `refreshLens` for an existing folder
- **THEN** the ack SHALL be `ok` without awaiting the network fetch, and a subsequent `state-broadcast` SHALL carry the fetch outcome in the runtime slice

#### Scenario: Lifecycle commands on an unknown folder reject

- **WHEN** `updateLens`, `deleteLens`, or `refreshLens` is dispatched with a `spaceId` absent from `state.spaces`, or a `folderId` matching no lens node
- **THEN** the handler SHALL throw and the ack SHALL carry `{ error }`
