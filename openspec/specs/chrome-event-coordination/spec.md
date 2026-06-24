# chrome-event-coordination Specification

## Purpose

Serializes all mutation entry points (chrome.* event listeners and sidebar
commands) through a single FIFO queue. Owns persist and broadcast and enforces
the thin-store architectural rule: `LunmaStore` mutators are synchronous,
take only plain data, and never touch `chrome.*`, `persist`, or `broadcast`.
## Requirements
### Requirement: PendingEvent shape and exhaustiveness

The exported `PendingEvent` type SHALL be a TypeScript discriminated union with a `source` discriminant and a `kind` discriminant. The valid `source` values SHALL be `'chrome'` and `'sidebar'`.

For `source: 'chrome'`, the union SHALL cover exactly:

- `tabs.onCreated`, `tabs.onRemoved`, `tabs.onUpdated`, `tabs.onActivated`,
- `tabGroups.onRemoved`, `tabGroups.onUpdated`,
- `windows.onCreated`, `windows.onRemoved`.

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

### Requirement: Single sequencer and thin store

The `Coordinator` SHALL be the only path that mutates `LunmaStore.state`. "The Coordinator" denotes the **coordinator module**: `apps/extension/src/background/coordinator.ts`, the handler-slice files under `apps/extension/src/background/handlers/**`, and the orchestration collaborators it constructs and owns (`apps/extension/src/background/group-orchestrator.ts`, `apps/extension/src/background/boundary-controller.ts`). The drain loop runs handlers one at a time in FIFO order, invoking each kind's slice handler with a `HandlerContext`; two coordinator handlers SHALL never interleave. Chrome listeners and the bus adapter enqueue events; they SHALL NOT mutate `store.state` directly.

`LunmaStore` mutator methods SHALL be synchronous and SHALL return `void`. Each mutator SHALL accept only plain-data arguments — values containing no `Promise`, no function, no `chrome.*` object (e.g. `chrome.tabs.Tab`, `chrome.bookmarks.BookmarkTreeNode`, `chrome.windows.Window`), and no other runtime handle. Each mutator SHALL mutate the `$state` tree and return. Each mutator SHALL NOT:

- call any `chrome.*` API,
- call `persist`,
- call `broadcast`,
- `await` any value,
- schedule asynchronous work.

The `LunmaStore` constructor SHALL NOT accept `persist` or `broadcast` options. Ownership of `persist` and `broadcast` SHALL live in `Coordinator`.

Self-vs-chrome filtering (e.g. `isSelfCreatedFolder`, `isSelfTaggedBookmarkUpdate`) lives in a coordinator-module handler slice or collaborator, not on the store.

#### Scenario: Mutations only flow through the coordinator module

- **WHEN** code outside the coordinator module (i.e. outside `apps/extension/src/background/coordinator.ts`, `apps/extension/src/background/handlers/**`, and the collaborators `group-orchestrator.ts` / `boundary-controller.ts`) and outside the SW boot path attempts to mutate `store.state`
- **THEN** that path SHALL be considered a layering violation (caught by review)

#### Scenario: Chrome listener enqueues rather than mutating directly

- **WHEN** a `chrome.tabs.onCreated` listener registered in `apps/extension/src/background/index.ts` fires
- **THEN** the listener SHALL call `coordinator.enqueue({ source: 'chrome', kind: 'tabs.onCreated', payload: { tab } })`
- **AND** the listener SHALL NOT call any `LunmaStore` mutator method

#### Scenario: Two Chrome events interleave in FIFO order

- **WHEN** a `chrome.tabs.onCreated` event is enqueued at time T and a `chrome.windows.onCreated` event is enqueued at time T+ε
- **THEN** the coordinator handler for `tabs.onCreated` SHALL run to completion before the handler for `windows.onCreated` begins
- **AND** the resulting `$state` SHALL reflect the `tabs.onCreated` mutation followed by the `windows.onCreated` mutation in that order

#### Scenario: Mutator returns void synchronously

- **WHEN** a test calls a `LunmaStore` mutator (e.g. `store.createSpace('Work', 'blue', 'folder-1')`)
- **THEN** the call SHALL return `undefined` (not a Promise)
- **AND** the `$state` mutation SHALL be visible immediately on the next line of the caller

#### Scenario: Mutator with a Chrome object as input fails the build

- **WHEN** a developer adds a `LunmaStore` mutator method whose parameter type includes `chrome.tabs.Tab` or any other `chrome.*` runtime type
- **THEN** the spec SHALL be considered violated
- **AND** the code review SHALL reject the change, or a future TS-level lint SHALL fail the build

#### Scenario: Store constructor rejects persist/broadcast options

- **WHEN** a caller attempts to construct `new LunmaStore({ persist: ..., broadcast: ... })`
- **THEN** `pnpm exec tsc --noEmit` SHALL fail because the constructor options type SHALL NOT declare those fields

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

All other kinds have empty policy entries (no coalescing).

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

### Requirement: Coordinator owns I/O and batches per drain cycle

`Coordinator` SHALL own all I/O performed in response to mutations. Specifically:

- All `chrome.*` API calls required to resolve a `PendingEvent` into plain data SHALL be performed inside a coordinator-module handler slice or one of its orchestration collaborators, never inside a `LunmaStore` mutator.
- `persist(state)` SHALL be called by the coordinator at most once per drain cycle, after the queue becomes empty and at least one mutator ran during the cycle. The state passed to `persist` SHALL be a non-reactive snapshot (via `LunmaStore.snapshot()`), not the raw `$state` proxy, so it round-trips cleanly through `chrome.storage.local.set`'s structured-clone serializer.
- `broadcast({ method, state })` SHALL be called by the coordinator at most once per drain cycle with `method` set to a stable string identifying the batched cycle and `state` set to the same snapshot used for persist.
- For every `PendingEvent` with `source: 'sidebar'` processed during the drain cycle, the coordinator SHALL emit exactly one `'lunma/command-ack'` message via `chrome.runtime.sendMessage` carrying the event's `correlationId` and a `result` of `'ok'` (handler returned successfully or the event was coalesced out) or `{ error: <message> }` (handler threw). Ack emission SHALL occur as part of the drain cycle's tail, after persist and broadcast.
- When `enqueue` removes a prior sidebar event from the queue due to coalesce, the coordinator SHALL record `{ id: dropped.correlationId, result: 'ok' }` into the same per-drain ack buffer that the drain's tail will flush. Coalesce-time ack push and end-of-drain ack flush are the only two ack-emission sites.
- Ack emission SHALL be wrapped in a per-ack try/catch; emission failures SHALL log at `error` with code `ACK_EMIT_FAILED` and SHALL NOT block subsequent acks or the next drain cycle. The "Receiving end does not exist" error (sidebar closed) SHALL log at `debug` (code `ACK_EMIT_NO_LISTENER`), not `error`, matching the existing `broadcastState` treatment.

A "drain cycle" SHALL begin when `enqueue` is called against an empty queue and no drain is in progress, and SHALL end when the queue becomes empty and the current handler has returned.

The `Coordinator` class SHALL NOT expose public `flush()` or `markDirty()` methods to mutation sources outside the coordinator module. The drain's per-cycle persist/broadcast SHALL instead be triggered by handler slices via an internal `HandlerContext.markDirty()` that the drain hands only to the in-module slices it invokes; `HandlerContext.markDirty()` is the sanctioned mechanism by which a slice signals that its mutation must be persisted and broadcast this cycle, and SHALL be set imperatively (set-as-you-go) rather than returned, so a handler that mutates state and then awaits I/O that throws still has its mutation persisted. Mutation sources outside the coordinator module (e.g. SW boot-time recovery) SHALL either mutate `$state` directly during boot before any enqueued event is processed, or SHALL ride the coordinator queue via `enqueue`.

**Synchronous listener registration (MV3 wake-up delivery).** The wake-critical listeners — the bus adapter's `chrome.runtime.onMessage` listener AND the `chrome.*` event listeners (`tabs.*`, `windows.*`, `commands.onCommand`) — SHALL be registered **synchronously in the service worker's first top-level turn**, i.e. NOT inside the asynchronous boot chain. This is required because MV3 routes the message or event that spun a dormant SW back up only to listeners that already exist in that first turn; a listener added after an `await` misses the wake-up, and the sender observes "Could not establish connection. Receiving end does not exist" (commands) or the event is silently dropped (chrome events). To preserve the boot-ordering guarantee, each synchronously-registered listener SHALL defer its `coordinator.enqueue` until a boot-readiness promise (`bootReady`) resolves; message validation and error-acks for unknown command kinds MAY occur synchronously. Deferred enqueues SHALL preserve arrival order. Because enqueue is deferred (not the registration), `chrome.*` events that fire during boot are no longer dropped — they are queued and run after boot mutations, on top of the reconciled state; the relevant handlers are idempotent against the boot-time seed (`onTabCreated` de-dupes by tab id, etc.). The pure-read state-snapshot handler is the exception: it registers post-boot (inside the boot chain), because it answers synchronously with `store.snapshot()` and must not reply with the empty pre-`loadState` default; a cold-start request is covered by the sidebar's retry loop plus the boot broadcast.

**Boot broadcast.** After boot mutations complete and `persist` runs, the SW SHALL emit exactly one `broadcast({ method: 'boot', state })` carrying the post-boot snapshot. This is required because boot mutations bypass the coordinator's per-drain broadcast, so a sidebar that is ALREADY open when the SW wakes (e.g. the user opens a tab after the SW idled out) would otherwise never learn about boot-time reconciliation and would keep rendering stale state.

#### Scenario: No public markDirty/flush on the Coordinator surface

- **WHEN** a mutation source outside the coordinator module references `coordinator.markDirty` or `coordinator.flush`
- **THEN** `pnpm exec tsc --noEmit` SHALL fail because the `Coordinator` class SHALL NOT declare those public methods
- **AND** the dirty signal SHALL be reachable only via `HandlerContext.markDirty()` handed to in-module handler slices

#### Scenario: A mutate-then-await-throw handler still persists its mutation

- **GIVEN** a handler slice mutates `store.state`, calls `ctx.markDirty()`, then awaits a `chrome.*` call that rejects
- **WHEN** the drain processes that event
- **THEN** the drain SHALL still persist + broadcast the mutation that ran before the rejection (the imperative `markDirty` is not undone by the later throw)

#### Scenario: Listeners are registered synchronously and defer enqueue until boot completes

- **WHEN** the SW module is evaluated
- **THEN** the bus adapter (`installBusAdapter(coordinator, bootReady)`) and the `chrome.*` event listeners SHALL be registered synchronously, before the boot chain resolves (the snapshot handler registers post-boot)
- **AND** a command or `chrome.*` event delivered before `bootReady` resolves SHALL NOT call `coordinator.enqueue` yet
- **AND** once `bootReady` resolves, each SHALL be enqueued, in the order it arrived

#### Scenario: A tab opened while the SW was dormant reaches an already-open sidebar

- **GIVEN** the sidebar is open and the SW has idled out
- **WHEN** the user opens a new tab, waking the SW
- **THEN** boot SHALL adopt the tab (`seedExistingTabs` over `chrome.tabs.query`) into the Space instance that owns the tab's live Chrome group — group-aware seeding, see the `spaces-and-tabs` "Boot tab ownership reconciliation" requirement — falling back to the window's **active** Space instance for an ungrouped tab such as a freshly-opened one
- **AND** the SW SHALL emit one `broadcast({ method: 'boot', state })` after boot
- **AND** the open sidebar SHALL receive that broadcast and render the new Temporary row (no stale empty list)

### Requirement: In-memory queue, not persisted across SW termination

The pending-event queue SHALL be in-memory only and SHALL NOT be persisted across SW termination. Reconciliation on wake runs via `runRestartRecovery` plus `chrome.tabs.query()`, not by replaying queued events.

#### Scenario: SW termination drops in-flight queue

- **WHEN** the SW is terminated while events are queued
- **THEN** those events SHALL be lost (no replay on next wake)
- **AND** state convergence SHALL rely on `runRestartRecovery` reading actual chrome state on the next boot

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

### Requirement: Sidebar-source handlers for recolourSpace and changeSpaceIcon

The coordinator SHALL implement handlers for the new sidebar command kinds `recolourSpace` and `changeSpaceIcon`. Both handlers SHALL be synchronous (return `void`, not `Promise<void>`) and SHALL throw a descriptive Error when the addressed `spaceId` is not present in `state.spaces` — consistent with the D7-bis throw-on-cannot-fulfill rule for sidebar-source handlers.

Both handlers SHALL run in a single coordinator drain iteration. Each handler SHALL set `this.dirty = true` so the drain emits exactly one persist and exactly one `state-broadcast` per command.

Neither command's `EventPolicy` entry SHALL declare a `coalesceKey` in the initial release — every recolour click and every icon pick is per-click distinct. The handlers SHALL be added to `EventPolicy` with empty entries (`recolourSpace: {}`, `changeSpaceIcon: {}`).

#### Scenario: recolourSpace handler mutates state and dirties the drain

- **GIVEN** the coordinator has been initialised with a store containing Space `work` (color `'blue'`)
- **WHEN** the coordinator drain processes a sidebar-source event `{ source: 'sidebar', kind: 'recolourSpace', payload: { spaceId: 'work', color: 'red' }, correlationId: 'c1' }`
- **THEN** the handler SHALL call `store.recolourSpace('work', 'red')`
- **AND** `store.state.spaces[<i>].color` SHALL equal `'red'` after the handler returns
- **AND** the drain SHALL persist + broadcast exactly once

#### Scenario: changeSpaceIcon handler mutates state and dirties the drain

- **GIVEN** the coordinator has been initialised with a store containing Space `work` (icon `'star'`)
- **WHEN** the coordinator drain processes a sidebar-source event `{ source: 'sidebar', kind: 'changeSpaceIcon', payload: { spaceId: 'work', icon: 'briefcase' }, correlationId: 'c1' }`
- **THEN** the handler SHALL call `store.changeSpaceIcon('work', 'briefcase')`
- **AND** `store.state.spaces[<i>].icon` SHALL equal `'briefcase'` after the handler returns
- **AND** the drain SHALL persist + broadcast exactly once

#### Scenario: recolourSpace handler throws on unknown spaceId

- **WHEN** the drain processes `{ source: 'sidebar', kind: 'recolourSpace', payload: { spaceId: 'ghost', color: 'red' }, correlationId: 'c1' }`
- **AND** `state.spaces` does not contain a Space with id `'ghost'`
- **THEN** the handler SHALL throw an Error whose message identifies the missing spaceId
- **AND** the drain SHALL emit a `'lunma/command-ack'` with `{ result: { error: <message> } }`
- **AND** no `state-broadcast` SHALL be emitted

#### Scenario: changeSpaceIcon handler throws on unknown spaceId

- **WHEN** the drain processes `{ source: 'sidebar', kind: 'changeSpaceIcon', payload: { spaceId: 'ghost', icon: 'star' }, correlationId: 'c1' }`
- **AND** `state.spaces` does not contain a Space with id `'ghost'`
- **THEN** the handler SHALL throw an Error whose message identifies the missing spaceId
- **AND** the drain SHALL emit a `'lunma/command-ack'` with `{ result: { error: <message> } }`
- **AND** no `state-broadcast` SHALL be emitted

#### Scenario: Per-click distinctness — no coalescing of rapid recolour clicks

- **GIVEN** the user clicks two different swatches in rapid succession
- **WHEN** two `recolourSpace` events are enqueued before the first drain iteration begins
- **THEN** both events SHALL be processed (the second is NOT coalesced)
- **AND** the final `state.spaces[<i>].color` SHALL equal the second click's color
- **AND** the drain SHALL emit exactly one persist + broadcast (the dirty flag batches the two mutations within one drain)

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

### Requirement: chrome.commands is an event source for pinning the active tab

The SW SHALL register a `chrome.commands.onCommand` listener for the `pin-active-tab` command (declared in the manifest). On fire, it SHALL resolve the focused window's active tab via `chrome.tabs.query({ active: true, lastFocusedWindow: true })`, look up that window's active Space, and enqueue a `pinTab` event for it. If there is no focused window, no active tab, no active Space, or the tab is already bound, the listener SHALL log and enqueue nothing.

#### Scenario: Pressing the shortcut enqueues a pinTab for the active tab

- **WHEN** `chrome.commands.onCommand` fires with `'pin-active-tab'`, the focused window 100 has active tab 42, and window 100's active Space is "work"
- **THEN** the coordinator SHALL receive a `pinTab` event `{ tabId: 42, windowId: 100, spaceId: 'work', targetIndex: <end> }`

#### Scenario: Shortcut with no active Space is a no-op

- **WHEN** the shortcut fires but the focused window has no active Space
- **THEN** no event SHALL be enqueued

### Requirement: Pinned-tab folder command handling

The coordinator SHALL handle the pinned-tab folder commands, each as a `SidebarVariant` `PendingEvent` with a handler in the handlers map and an `EventPolicy` entry. They are recognised by `SIDEBAR_COMMAND_KINDS` (so the bus adapter enqueues them) and carry empty `EventPolicy` entries (no coalescing), persisting + broadcasting per the standard drain cycle. For `createFolder`, it SHALL mint a `FolderId` via the store's id factory and insert an empty folder node (default name "New Folder") at the top of `pinnedBySpace[spaceId]`. For `createFolderFromTabs`, it SHALL mint a `FolderId`, remove `tabIdA` and `tabIdB` from their current positions, and insert a folder node with `children` `[tabIdB, tabIdA]` at the requested index. For `renameFolder` / `setFolderIcon` / `setFolderColor`, it SHALL update the named folder node's `name` / `icon` / `color`. For `deleteFolder`, it SHALL remove the folder node and splice its `children` (as tab nodes) into the top-level list at the folder's former position. Each handler SHALL run inside the serialized queue.

#### Scenario: createFolder mints an empty folder

- **WHEN** a `createFolder` command is processed for a Space
- **THEN** a folder node with a freshly-minted `FolderId`, name "New Folder", and empty `children` SHALL be inserted at the top of `pinnedBySpace[spaceId]`
- **AND** a persist + broadcast SHALL follow

#### Scenario: createFolderFromTabs wraps two tabs

- **WHEN** a `createFolderFromTabs` command is processed with `{ spaceId, tabIdA, tabIdB, index }`
- **THEN** `tabIdA` and `tabIdB` SHALL be removed from their prior positions
- **AND** a folder node with `children` `[tabIdB, tabIdA]` SHALL be inserted at `index`

#### Scenario: deleteFolder spills children to top level

- **WHEN** a `deleteFolder` command is processed for a non-empty folder
- **THEN** the folder node SHALL be removed
- **AND** its children SHALL appear as top-level tab nodes at the folder's former position

#### Scenario: Folder metadata commands update the node

- **WHEN** a `renameFolder`, `setFolderIcon`, or `setFolderColor` command is processed
- **THEN** the named folder node's `name`, `icon`, or `color` SHALL be updated
- **AND** a persist + broadcast SHALL follow

### Requirement: Pure-read launcher-suggestions channel

The service worker SHALL respond to `'lunma/launcher-suggestions-request'` messages
received via `chrome.runtime.onMessage` by running the launcher search engine and
emitting a `'lunma/launcher-suggestions-response'` message carrying the merged,
scored results. The request SHALL carry `{ type: 'lunma/launcher-suggestions-request';
requestId: string; query: string; windowId: WindowId }` and the response SHALL carry
`{ type: 'lunma/launcher-suggestions-response'; requestId: string; results:
LauncherResult[] }`, echoing the request's `requestId` so a client can drop stale
(out-of-order) responses (latest-wins). The handler module
`apps/extension/src/background/launcher-suggestions-handler.ts` SHALL register this listener during
SW boot via `registerLauncherSuggestionsHandler(store)` invoked from
`apps/extension/src/background/index.ts`.

The handler SHALL be **pure-read**, exactly like the state-snapshot channel:

- It SHALL NOT call `coordinator.enqueue`, mutate `LunmaStore` state, persist, or
  broadcast.
- It SHALL read `store.snapshot()` / `store.state` only to source the saved-tabs
  provider, and it MAY call read-only chrome APIs (`chrome.tabs.query`,
  `chrome.bookmarks.search`, `chrome.history.search`) to source the other providers.
- It MAY only emit `'lunma/launcher-suggestions-response'` messages. It SHALL NOT
  emit `'lunma/state-broadcast'`, `'lunma/state-snapshot'`, `'lunma/command-ack'`,
  or any other message type.

This channel is independent of the coordinator queue. The queue invariants stated
elsewhere in this capability (single-handler-at-a-time, persist-and-broadcast-once-
per-drain, etc.) are NOT relaxed by this requirement — they continue to govern the
mutation path. The launcher-suggestions channel is a parallel read path that does
not interact with the queue at all.

#### Scenario: A surface requests suggestions and the SW responds with scored results

- **WHEN** a launcher surface sends `{ type: 'lunma/launcher-suggestions-request', requestId: 'r1', query: 'docs', windowId: 100 }`
- **THEN** the SW SHALL respond with `{ type: 'lunma/launcher-suggestions-response', requestId: 'r1', results: <merged scored LauncherResult[]> }`
- **AND** the response `requestId` SHALL equal the request's `requestId`

#### Scenario: The suggestions handler is pure-read

- **WHEN** `apps/extension/src/background/launcher-suggestions-handler.ts` is statically analyzed
- **THEN** it SHALL NOT call `coordinator.enqueue`, any `LunmaStore` mutator, `persist`, or `broadcast`
- **AND** it SHALL NOT import `persist` or `broadcast` from `apps/extension/src/shared/messages.ts`

#### Scenario: A concurrent mutation does not block a suggestions response

- **WHEN** a suggestions request arrives while a coordinator drain is in flight
- **THEN** the handler SHALL respond without waiting for the drain to complete (it reads the store as observed at handler-invocation time)

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

