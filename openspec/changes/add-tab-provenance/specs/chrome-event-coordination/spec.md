## MODIFIED Requirements

### Requirement: PendingEvent shape and exhaustiveness

The exported `PendingEvent` type SHALL be a TypeScript discriminated union with a `source` discriminant and a `kind` discriminant. The valid `source` values SHALL be `'chrome'` and `'sidebar'`.

For `source: 'chrome'`, the union SHALL cover exactly:

- `tabs.onCreated`, `tabs.onRemoved`, `tabs.onUpdated`, `tabs.onActivated`,
- `tabGroups.onRemoved`, `tabGroups.onUpdated`,
- `windows.onCreated`, `windows.onRemoved`.
- `webNavigation.onCommitted` — carrying `{ tabId, frameId, url, transitionType, transitionQualifiers }`, present only while the `webNavigation` optional permission is granted (see `tab-provenance`).

The `tabGroups.onRemoved` payload SHALL carry the removed group's id (`{ groupId: number }`); the `tabGroups.onUpdated` payload SHALL carry the updated group descriptor (`{ group: chrome.tabGroups.TabGroup }`). These are the lifecycle-hint events Lunma observes so a user's manual ungroup/close or Chrome-side rename of a Lunma-tracked group reconciles (see the `spaces-and-tabs` "Chrome tab-group lifecycle reconciliation" requirement). Lunma SHALL register the corresponding `chrome.tabGroups.onRemoved` / `chrome.tabGroups.onUpdated` listeners in `apps/extension/src/background/index.ts`, deferring their enqueue until boot completes like the other chrome listeners.

The `bookmarks.onCreated` and `bookmarks.onRemoved` kinds SHALL NOT exist — Lunma no longer observes the Chrome bookmark tree (Spaces and saved tabs are Lunma-owned; see ADR 0001). Their `EventPolicy` entries and coordinator handlers SHALL be removed.

For `source: 'sidebar'`, the union SHALL cover the kinds enumerated by the `typed-message-bus` capability spec. Variants with `source: 'sidebar'` SHALL additionally carry a `correlationId: string` field (the sessionId-prefixed wire id allocated by the bus client); chrome variants SHALL NOT.

Every coordinator handler SHALL be looked up by `kind`. The handlers map SHALL be typed such that omitting any `kind` causes `pnpm exec tsc --noEmit` to fail. The `HandlersMap` MAY be assembled at runtime from one typed fragment per handler-slice file (each fragment typed `Pick<HandlersMap, …>` for the kinds it owns); the assembled object SHALL be annotated `HandlersMap` at its single assembly site in the coordinator module, so exhaustiveness over `PendingEventKind` is enforced at that site (omitting any `kind` from the union of fragments fails `tsc --noEmit`). The `EventPolicy` record SHALL have one entry per `kind` regardless of `source`. `tabGroups.onUpdated` SHALL coalesce by `groupId` (last-write-wins within a drain), like `tabs.onUpdated`.

Future capabilities (e.g. an options-page command channel, the Arcify importer) extend the `PendingEvent` union with additional `source` values and `kind` entries in their own spec deltas, and SHALL add matching handlers map entries and `EventPolicy` entries in the same change.

#### Scenario: Handlers map is exhaustive

- **WHEN** a developer adds a new `kind` to the `PendingEvent` union without adding a matching entry to the handlers map
- **THEN** `pnpm exec tsc --noEmit` SHALL fail with a missing-key error on the handlers record

#### Scenario: Exhaustiveness holds across sliced fragments

- **WHEN** the handlers map is assembled from per-slice `Pick<HandlersMap, …>` fragments and one slice omits a `kind` it should own (so no fragment provides it)
- **THEN** the `HandlersMap`-annotated assembly site SHALL fail `pnpm exec tsc --noEmit` with a missing-key error

#### Scenario: Tab-group lifecycle kinds are present

- **WHEN** the `PendingEvent` union is inspected
- **THEN** it SHALL contain `tabGroups.onRemoved` and `tabGroups.onUpdated` for `source: 'chrome'`
- **AND** the coordinator SHALL register `chrome.tabGroups.onRemoved` and `chrome.tabGroups.onUpdated` listeners

#### Scenario: No bookmark event kinds remain

- **WHEN** the `PendingEvent` union is inspected
- **THEN** it SHALL NOT contain `bookmarks.onCreated` or `bookmarks.onRemoved`
- **AND** the coordinator SHALL register no `chrome.bookmarks.*` listeners

#### Scenario: Sidebar variants carry correlationId; chrome variants do not

- **WHEN** a developer narrows a `PendingEvent` to `source: 'sidebar'`
- **THEN** the narrowed type SHALL include a `correlationId: string` field
- **AND** narrowing to `source: 'chrome'` SHALL exclude `correlationId`

The `webNavigation.onCommitted` listener SHALL be registered synchronously at top
level, guarded on `chrome.webNavigation` being **defined**. An optional permission
gates whether the API object exists, so availability is exactly the permission
check and it is answerable in the synchronous turn; an asynchronous
`permissions.contains` guard SHALL NOT be used, because it cannot complete before
the registration window closes and the worker would miss commits on wake.

The listener SHALL enqueue only main-frame commits (`frameId === 0`); subframe
commits SHALL be discarded at the listener and never enter the queue.

Because the grant outlives the toggle (Lunma never revokes it), a registered
listener MAY exist while the effective provenance state is off. The handler SHALL
then return without recording anything, reading the state from the coordinator's
cached synchronous mirror `ctx.provenanceEnabled()` — the same shape as the
existing `ctx.dedupNewTabNavigations()`. The gate SHALL NOT be an `await` on
`hasApiPermission`, which is async and would break the handler's purity.

#### Scenario: Registration is synchronous and needs no async permission query

- **GIVEN** the `webNavigation` permission is granted
- **WHEN** the service worker evaluates its top level
- **THEN** the listener SHALL be registered in that synchronous turn, guarded only on `chrome.webNavigation` being defined

#### Scenario: A subframe commit never enters the queue

- **GIVEN** provenance is on
- **WHEN** `chrome.webNavigation.onCommitted` fires with `frameId !== 0`
- **THEN** the listener SHALL discard it and no `PendingEvent` SHALL be enqueued

#### Scenario: A commit arriving with provenance off records nothing

- **GIVEN** the grant is held but `ctx.provenanceEnabled()` is false
- **WHEN** a main-frame commit is drained
- **THEN** the handler SHALL return without recording an edge or stamping a token

### Requirement: Bounded queue with per-kind coalescing

The pending-event queue SHALL have a depth cap of **1000** entries. When the cap is exceeded, the oldest event SHALL be dropped and `log.error` SHALL be called with code `EVENT_DROPPED` carrying the dropped event's `kind`. When the dropped event is a `source: 'sidebar'` variant, the coordinator SHALL additionally record an error ack into the per-drain ack buffer so the sidebar's promise rejects rather than waiting out the timeout.

The `EventPolicy` table SHALL allow per-kind coalescing via an optional `coalesceKey(ev) → string | number` function. On `enqueue`, if a coalesce key is defined for the incoming event's kind AND a prior queued event of the same kind has the same key, the prior event SHALL be removed from the queue before the new event is appended. When the removed event is a `source: 'sidebar'` variant, the coordinator SHALL push `{ id: removed.correlationId, result: 'ok' }` into the per-drain ack buffer at the moment of removal (coalesce-time ack push).

Coalescing SHALL be either **replace** or **merge**, declared per kind. An `EventPolicy` entry MAY define an optional `mergePayload(prevPayload, nextPayload) → payload`. When coalescing removes a prior event:

- If the kind defines `mergePayload`, the appended event's payload SHALL be `mergePayload(prior.payload, incoming.payload)` — a field-wise merge where the incoming event's present fields win and fields absent from the incoming event retain the prior event's value. This preserves partial-delta events (e.g. Chrome's `tabs.onUpdated` `changeInfo`, which carries only the fields that changed) so an earlier `status` is not lost when a later event carries only `favIconUrl`.
- If the kind does NOT define `mergePayload`, coalescing SHALL replace (the incoming payload wins wholesale, last-write-wins) — correct for sidebar commands whose payload is a complete intent.

`tabs.onUpdated` and `tabGroups.onUpdated` SHALL define `mergePayload` (field-wise merge of their `changeInfo` / `group` payloads). `renameSpace` and `activateSpace` SHALL NOT define `mergePayload` (they remain replace / last-write-wins).

Initial coalescing entries in this capability:

- `tabs.onUpdated` coalesces by `tabId`, **merging** `changeInfo` field-wise.
- `tabGroups.onUpdated` coalesces by `groupId`, **merging** its payload field-wise.
- `renameSpace` coalesces by `spaceId` (sidebar-source), replace.
- `activateSpace` coalesces by `windowId` (sidebar-source), replace.

All other kinds have empty policy entries (no coalescing) — including `webNavigation.onCommitted`. It SHALL NOT coalesce: the FIRST commit for a tab is the one carrying the opener attribution an edge resolves from, so `replace` would discard exactly the event provenance depends on, and no third mode exists. Its volume is bounded by the queue cap like any other uncoalesced kind, and its handler is pure and synchronous against in-memory state.

#### Scenario: Queue cap drops oldest and logs

- **WHEN** the queue holds `QUEUE_CAP` events and a new event is enqueued
- **THEN** the oldest event SHALL be removed
- **AND** `log.error` SHALL be called with code `EVENT_DROPPED` and the dropped event's `kind`

#### Scenario: Successive tabs.onUpdated for the same tab coalesce by merging fields

- **WHEN** two `tabs.onUpdated` events for tabId `42` are enqueued in succession — first `changeInfo: { status: 'complete' }`, then `changeInfo: { favIconUrl: 'https://x/icon.png' }`
- **THEN** after the second enqueue, the queue SHALL contain exactly one `tabs.onUpdated` event for tabId `42`
- **AND** its `changeInfo` SHALL be `{ status: 'complete', favIconUrl: 'https://x/icon.png' }` (the earlier `status` is preserved, not discarded)

#### Scenario: Later field wins on conflict

- **WHEN** two `tabs.onUpdated` events for tabId `42` are enqueued with `changeInfo: { status: 'loading' }` then `changeInfo: { status: 'complete' }`
- **THEN** the single coalesced event's `changeInfo.status` SHALL be `'complete'`

#### Scenario: Coalescing does not affect unrelated events

- **WHEN** events A (`tabs.onCreated`), B (`tabs.onUpdated` for tabId 42), and C (`tabs.onUpdated` for tabId 42) are enqueued in that order
- **THEN** the queue SHALL contain A followed by the single coalesced `tabs.onUpdated` for tabId 42
- **AND** the relative order of A vs. the coalesced event SHALL be preserved (A first)
- **AND** the coalesced event's `changeInfo` SHALL be the field-wise merge of B's and C's

#### Scenario: Sidebar keyed coalescing stays replace, not merge

- **WHEN** two `renameSpace` events for the same `spaceId` are enqueued with `newName: 'X'` then `newName: 'Y'`
- **THEN** the single coalesced event's payload SHALL be the second one (`newName: 'Y'`), not a merge

#### Scenario: Adding a new event kind without a policy entry fails the build

- **WHEN** a developer extends the `PendingEvent` union with a new `kind` and does not add a matching `EventPolicy` entry
- **THEN** `pnpm exec tsc --noEmit` SHALL fail with a missing-key error on the `EventPolicy` record

The `webNavigation.onCommitted` handler SHALL perform no `chrome.*` I/O. The
cross-origin re-stamp it may require is a side effect and SHALL be dispatched
through the coordinator's existing side-effect channel.

#### Scenario: Commits are not coalesced

- **GIVEN** the queue holds a pending `webNavigation.onCommitted` for tab 42
- **WHEN** another commit for tab 42 arrives before the drain
- **THEN** both SHALL remain queued in arrival order, so the first commit's opener attribution is not discarded

#### Scenario: The re-stamp leaves the handler pure

- **GIVEN** a commit requiring a cross-origin re-stamp
- **WHEN** the handler runs
- **THEN** it SHALL record state synchronously and dispatch the re-stamp through the side-effect channel, performing no `chrome.*` call itself
