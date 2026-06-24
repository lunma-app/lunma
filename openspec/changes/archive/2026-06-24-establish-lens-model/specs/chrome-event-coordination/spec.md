# chrome-event-coordination Specification

## MODIFIED Requirements

### Requirement: A parallel lenses refresh kick on state-request

`apps/extension/src/background/lenses.ts` SHALL register its own
`chrome.runtime.onMessage` listener for `'lunma/state-request'` (the sidebar's
boot/open signal) whose only effect is to kick the lenses refresh-due
check (see the `lenses` capability's "Polling and refresh scheduling"
requirement). This listener:

- SHALL NOT call `sendResponse` and SHALL NOT return `true` — it never claims
  the message's response channel, which belongs to the pure-read snapshot
  handler.
- SHALL NOT block, delay, or otherwise interact with the snapshot response.
- SHALL NOT mutate the store or call any coordinator method directly from the
  listener: the kick only schedules connector work, whose fetches run off-drain
  and whose results ride the `lenses.result` event through the normal
  drain (single-writer discipline).

The pure-read snapshot handler module
`apps/extension/src/background/state-snapshot-handler.ts` and its contract
(Requirement: Pure-read state-snapshot channel) are NOT modified by this
change — `'lunma/state-request'` simply gains a second, independent listener.

The `PendingEvent` union extension this capability's extension rule requires —
the new `source: 'connector'` member with the `lenses.result` kind and
its matching handlers-map and `EventPolicy` entries — is specified in the
`lenses` capability spec and ships in the same change.

#### Scenario: The snapshot path is untouched by the kick

- **WHEN** a sidebar sends `{ type: 'lunma/state-request' }` while a lens is past its cadence
- **THEN** the snapshot handler responds with `{ type: 'lunma/state-snapshot', state }` exactly as before, without awaiting any connector work
- **AND** the refresh-kick listener triggers the due lens's refresh independently

#### Scenario: The kick listener never claims the response channel

- **WHEN** the lenses listener receives `'lunma/state-request'`
- **THEN** it SHALL NOT call `sendResponse` and SHALL NOT return `true`

#### Scenario: state-snapshot-handler.ts stays lens-free

- **WHEN** `apps/extension/src/background/state-snapshot-handler.ts` is statically analyzed
- **THEN** it SHALL contain no reference to the lenses module, the refresh-due check, or the `lenses` slice beyond what `store.snapshot()` already carries

## MODIFIED Requirements

### Requirement: Pure-read state-snapshot channel

The service worker SHALL respond to `'lunma/state-request'` messages received via `chrome.runtime.onMessage` by emitting a `'lunma/state-snapshot'` message carrying a snapshot of the current `LunmaStore.state`. The handler module `apps/extension/src/background/state-snapshot-handler.ts` SHALL register this listener during SW boot via `registerStateSnapshotHandler(store)` invoked from [apps/extension/src/background/index.ts](../../../apps/extension/src/background/index.ts), before chrome event listeners are registered.

The handler SHALL be pure-read:

- It SHALL NOT call `coordinator.enqueue`, `coordinator.flush`, `coordinator.markDirty`, or any other coordinator method.
- It SHALL NOT call any `LunmaStore` mutator method.
- It SHALL NOT call `persist` or `broadcast`.
- It SHALL read `store.snapshot()` (the existing `$state.snapshot`-based serialisation method on `LunmaStore`) and SHALL NOT read `store.state` directly to avoid sending `$state` proxy references across `chrome.runtime.sendMessage`.

The handler MAY only emit `'lunma/state-snapshot'` messages. It SHALL NOT emit `'lunma/state-broadcast'`, `'lunma/command-ack'`, or any other message type.

Wire format:

- Request: `{ type: 'lunma/state-request' }` — no payload beyond the type discriminator.
- Response: `{ type: 'lunma/state-snapshot'; state: AppState }` where `state` is the value returned by `store.snapshot()`.

This channel is independent of the coordinator queue. The queue invariants stated elsewhere in this capability spec (single-handler-at-a-time, persist-and-broadcast-once-per-drain, etc.) are NOT relaxed by this requirement — they continue to govern the mutation path. The state-snapshot channel is a parallel read path that does not interact with the queue at all.

#### Scenario: Sidebar requests a snapshot on boot, SW responds with current state

- **WHEN** the sidebar calls `requestStateSnapshot()` (which sends `{ type: 'lunma/state-request' }` via `chrome.runtime.sendMessage`)
- **THEN** the SW handler SHALL respond with `{ type: 'lunma/state-snapshot', state: <store.snapshot()> }`
- **AND** the response SHALL arrive via the same `chrome.runtime.sendMessage` promise resolution path
- **AND** the response `state` field SHALL deep-equal the result of calling `store.snapshot()` at the time the request was received

#### Scenario: Handler does not enqueue on the coordinator queue

- **WHEN** the SW receives `{ type: 'lunma/state-request' }`
- **THEN** the snapshot handler SHALL NOT call `coordinator.enqueue` (the parallel lenses refresh-kick listener — a separate listener on the same message, see Requirement: A parallel lenses refresh kick on state-request — may schedule connector work whose result event enqueues on a later drain)
- **AND** the snapshot response SHALL be emitted synchronously (without awaiting any queue drain)

#### Scenario: Handler does not call any store mutator

- **WHEN** [apps/extension/src/background/state-snapshot-handler.ts](../../../apps/extension/src/background/state-snapshot-handler.ts) is statically analyzed
- **THEN** it SHALL NOT contain references to any `LunmaStore` mutator method (`createSpace`, `renameSpace`, `deleteSpace`, `activateSpace`, `onTabCreated`, `onTabRemoved`, `onTabUpdated`, `bindBookmark`, `unbindBookmark`, `makeBookmarkHomeCurrent`, `applyRestartRecovery`, `registerBookmark`, `setLunmaRootFolderId`, `removeTrashedSpace`, `adoptBookmarkFolder`, `removeAdoptedBookmarkFolder`, `restoreSpaceFromTrash`, `onWindowOpened`, `onWindowClosed`)
- **AND** it SHALL NOT import the `Coordinator` class
- **AND** it SHALL NOT import `persist` or `broadcast` from [apps/extension/src/shared/messages.ts](../../../apps/extension/src/shared/messages.ts)

#### Scenario: Concurrent mutation does not block the snapshot response

- **WHEN** the coordinator queue is mid-drain (a chrome event handler is running)
- **AND** a `'lunma/state-request'` arrives
- **THEN** the snapshot handler SHALL respond with the store's current state without waiting for the drain to complete
- **AND** the snapshot's `state` field reflects the store as observed at handler invocation time (which may be mid-mutation, before the drain's final persist/broadcast)
- **AND** any subsequent `'lunma/state-broadcast'` emitted by the drain SHALL deliver the post-drain state to the sidebar, which assigns it into the sidebar-side store and reconciles any difference

#### Scenario: Snapshot is the same shape as state-broadcast payload

- **WHEN** comparing the `state` field of a `'lunma/state-snapshot'` response to the `state` field of a `'lunma/state-broadcast'` emission
- **THEN** both SHALL be obtained via `store.snapshot()`
- **AND** both SHALL serialise cleanly through `structuredClone` (no `$state` proxy references)
- **AND** both SHALL pass `AppStateV11Schema.parse` (the current-version schema) validation in the receiving sidebar

### Requirement: Sidebar-source handlers for pinTab, unpinTab, reorderPinned, and reorderTemp

The coordinator's `PendingEvent` union SHALL include `pinTab`, `unpinTab`, `reorderPinned`, and `reorderTemp` kinds (sidebar-sourced), each with a matching `EventPolicy` entry and handler, and the handler map SHALL remain exhaustive over `PendingEventKind`. The handlers SHALL run within the normal drain cycle (single persist + single broadcast per cycle) and SHALL be pure orchestration over `LunmaStore` methods — no direct state mutation outside the store.

- `pinTab` → `store.registerSavedTab(...)` + `store.bindSavedTab(...)` + `store.addPinned(...)`.
- `unpinTab` → `store.removePinned(...)` + `store.removeSavedTab(...)` + return the bound tab id to `tempTabIds`.
- `reorderPinned` → `store.setPinned(spaceId, nodes)` — the full post-drop `PinNode[]` tree, all three node kinds (`tab`, `folder`, `lens`) included.
- `reorderTemp` → `store.reorderTemp(windowId, tabIds)`.

#### Scenario: pinTab handler mints and pins within one drain cycle

- **WHEN** a `pinTab` event for tab 42 / Space "work" is drained
- **THEN** exactly one persist and one broadcast SHALL result, carrying a new bound `SavedTab` placed in `pinnedBySpace['work']`

#### Scenario: reorderPinned for an unknown Space throws

- **WHEN** a `reorderPinned` event names a `spaceId` absent from `state.spaces`
- **THEN** the handler SHALL throw a descriptive Error and SHALL NOT persist a partial change

#### Scenario: reorderTemp reorders a window's temporary tabs

- **WHEN** a `reorderTemp` event for window 100 with `tabIds: [22, 17]` is drained
- **THEN** `store.reorderTemp(100, [22, 17])` SHALL run and `spaceInstancesByWindow[100].tempTabIds` SHALL become `[22, 17]` within one drain cycle
