# typed-message-bus Specification

## Purpose

Typed sidebar→service-worker command channel. Every interactive sidebar
control dispatches a `SidebarCommand` through `bus.send(...)`; the SW
translates it to a `PendingEvent` and rides the same coordinator queue as
chrome events. The bus is ack-only — promises resolve on successful drain
or reject on handler throw / timeout / transport failure. Sidebars read
mutation results off the existing `state-broadcast` channel.
## Requirements
### Requirement: Sidebar-facing bus client

A `bus` client SHALL be exported as a singleton from `apps/extension/src/shared/bus.ts` with the shape `bus.send(cmd: SidebarCommand): Promise<void>`. The same module SHALL export a `createBus(transport)` factory used by the singleton and by tests. The sidebar SHALL import `bus` from this module and SHALL NOT call `chrome.runtime.sendMessage` directly for command dispatch.

The `SidebarCommand` discriminated union SHALL be exported from the same module and SHALL cover, in this release, exactly the following kinds: `createSpace`, `renameSpace`, `recolourSpace`, `changeSpaceIcon`, `deleteSpace`, `restoreSpaceFromTrash`, `activateSpace`, `openSavedTab`, `focusSavedTab`, `goHome`, `makeThisHome`, `deleteSavedTab`.

Each `SidebarCommand` variant SHALL carry only plain-data fields — no functions, no Chrome objects, no Promises. Confirmation flows that previously took a callback (e.g. `deleteBookmark`) SHALL be resolved on the sidebar side before `bus.send` is called.

The `SidebarCommand['createSpace']` payload SHALL have the shape `{ name: string; color: SpaceColor; icon: IconName; windowId: WindowId }`. The `IconName` type is the lucide-icon string-literal union exported from `apps/extension/src/shared/icon-names.ts`. The SW handler creates the underlying bookmark folder, adopts it as a Space with the user-supplied colour and icon, and auto-activates it in the supplied window — all within a single coordinator drain cycle.

The `SidebarCommand['recolourSpace']` payload SHALL have the shape `{ spaceId: SpaceId; color: SpaceColor }`. The SW handler SHALL call `store.recolourSpace(spaceId, color)`. The handler SHALL throw a descriptive Error when `spaceId` is not present in `state.spaces`.

The `SidebarCommand['changeSpaceIcon']` payload SHALL have the shape `{ spaceId: SpaceId; icon: IconName }`. The SW handler SHALL call `store.changeSpaceIcon(spaceId, icon)`. The handler SHALL throw a descriptive Error when `spaceId` is not present in `state.spaces`.

The `SIDEBAR_COMMAND_KINDS` set SHALL include `recolourSpace` and `changeSpaceIcon` alongside the existing kinds, so the runtime guard in the SW adapter recognises them.

> User-visible sidebar consumers of the bus are TBD pending the frontend redesign. The bus contracts above are the durable boundary; future frontend changes will re-introduce dispatchers and their scenarios.

#### Scenario: SW handler for recolourSpace mutates state and is atomic

- **WHEN** the coordinator drain processes a sidebar-source `recolourSpace` event with payload `{ spaceId: 'work', color: 'red' }`
- **AND** Space `work` exists in `state.spaces`
- **THEN** the handler SHALL call `store.recolourSpace('work', 'red')`
- **AND** the drain SHALL emit exactly one persist and exactly one `state-broadcast`
- **AND** the broadcast's `state.spaces` SHALL contain the Space with `color: 'red'`

#### Scenario: SW handler for changeSpaceIcon mutates state and is atomic

- **WHEN** the coordinator drain processes a sidebar-source `changeSpaceIcon` event with payload `{ spaceId: 'work', icon: 'briefcase' }`
- **AND** Space `work` exists in `state.spaces`
- **THEN** the handler SHALL call `store.changeSpaceIcon('work', 'briefcase')`
- **AND** the drain SHALL emit exactly one persist and exactly one `state-broadcast`
- **AND** the broadcast's `state.spaces` SHALL contain the Space with `icon: 'briefcase'`

#### Scenario: recolourSpace with unknown spaceId throws and acks with error

- **WHEN** the coordinator drain processes a sidebar-source `recolourSpace` event with `spaceId: 'ghost'` (not in `state.spaces`)
- **THEN** the handler SHALL throw a descriptive Error
- **AND** the drain SHALL emit a `'lunma/command-ack'` with `{ result: { error: <message> } }` for the corresponding correlation id
- **AND** no `state-broadcast` SHALL be emitted for this failed drain iteration

#### Scenario: changeSpaceIcon with unknown spaceId throws and acks with error

- **WHEN** the coordinator drain processes a sidebar-source `changeSpaceIcon` event with `spaceId: 'ghost'` (not in `state.spaces`)
- **THEN** the handler SHALL throw a descriptive Error
- **AND** the drain SHALL emit a `'lunma/command-ack'` with `{ result: { error: <message> } }`
- **AND** no `state-broadcast` SHALL be emitted

#### Scenario: SIDEBAR_COMMAND_KINDS includes the new kinds

- **WHEN** the SW adapter receives a `lunma/command` message with `cmd.kind: 'recolourSpace'`
- **THEN** the adapter's `SIDEBAR_COMMAND_KINDS.has('recolourSpace')` check SHALL return `true`
- **AND** the message SHALL be enqueued as a sidebar event with kind `'recolourSpace'`

- **WHEN** the SW adapter receives a `lunma/command` message with `cmd.kind: 'changeSpaceIcon'`
- **THEN** the adapter's `SIDEBAR_COMMAND_KINDS.has('changeSpaceIcon')` check SHALL return `true`
- **AND** the message SHALL be enqueued as a sidebar event with kind `'changeSpaceIcon'`

### Requirement: Ack-only promise resolution

`bus.send` SHALL return a `Promise<void>` that resolves when the drain cycle processing the command completes successfully, and SHALL reject when (a) the coordinator handler throws, (b) the bus timeout elapses before an ack arrives, or (c) the underlying transport fails to deliver the message.

The bus SHALL NOT expose result payloads. Sidebar callers SHALL read mutation results off the next `state-broadcast` message via the existing broadcast channel.

The bus timeout SHALL default to 10000 milliseconds. The constant SHALL be configurable in `apps/extension/src/shared/bus.ts` but SHALL NOT accept per-call overrides.

Rejected promises SHALL carry an `Error` whose `message` is descriptive of the failure, and SHALL be enriched by the bus client with the failing command's `kind` (the bus client holds the correlation entry and knows the kind even when the SW's ack carries only `{ error: string }`).

#### Scenario: Successful command resolves the promise

- **WHEN** the sidebar calls `bus.send({ kind: 'createSpace', payload: { ... } })`
- **AND** the coordinator handler completes without throwing
- **AND** the drain cycle finishes
- **THEN** the returned promise SHALL resolve with `undefined`

#### Scenario: Handler throw rejects the promise

- **WHEN** the sidebar calls `bus.send({ kind: 'openBookmark', payload: { bookmarkId, windowId } })`
- **AND** the coordinator handler throws (e.g. `chrome.tabs.create` rejects)
- **THEN** the returned promise SHALL reject with an `Error` whose message describes the failure
- **AND** the error message or a wrapper field SHALL identify the failing command kind

#### Scenario: Timeout rejects the promise

- **WHEN** the sidebar calls `bus.send(cmd)` and no ack arrives within 10000 ms
- **THEN** the returned promise SHALL reject with a `BusTimeoutError` exposing the timed-out command's `kind`
- **AND** an ack arriving after the timeout SHALL be logged at `debug` and dropped (an expected race, not a bug)

#### Scenario: Transport failure rejects immediately

- **WHEN** the sidebar calls `bus.send(cmd)` and `transport.sendMessage` throws or its returned promise rejects (e.g. "Extension context invalidated")
- **THEN** the returned promise SHALL reject with a `BusSendError` exposing the command's `kind` and the underlying cause
- **AND** the bus SHALL NOT wait for the timeout to fire
- **AND** the correlation entry SHALL be removed

### Requirement: Wire format and correlation

The bus SHALL emit messages of type `'lunma/command'` carrying `{ type: 'lunma/command'; id: string; cmd: SidebarCommand }`. The SW SHALL emit acks of type `'lunma/command-ack'` carrying `{ type: 'lunma/command-ack'; id: string; result: 'ok' | { error: string } }`. The wire `id` is a string of the form `${sessionId}:${counter}` allocated by the bus client (cross-instance stale-ack mitigation per the change's design Risks).

The bus client SHALL allocate correlation ids from a monotonic counter local to the bus instance, mixed with a per-bus-session nonce so that acks emitted for a prior sidebar session cannot resolve a current session's pending promises. UUIDs SHALL NOT be required.

The bus client SHALL listen for `'lunma/command-ack'` messages and SHALL resolve or reject the matching pending promise based on `result`. Acks whose `id` is not in the bus client's correlation map SHALL be logged at `warn` with code `BUS_ACK_UNKNOWN_ID` (real-bug bucket — stale-session crosstalk, malformed SW emission, etc.). Acks whose `id` was once in the map but has been cleared (timeout fired or transport error) SHALL be logged at `debug` (expected race bucket).

#### Scenario: Ack with result: 'ok' resolves

- **WHEN** the SW emits `{ type: 'lunma/command-ack', id: 'abc:7', result: 'ok' }`
- **AND** the bus client has a pending promise registered for `id: 'abc:7'`
- **THEN** that promise SHALL resolve with `undefined`
- **AND** the bus client SHALL remove the entry from its correlation map

#### Scenario: Ack with result: error rejects

- **WHEN** the SW emits `{ type: 'lunma/command-ack', id: 'abc:7', result: { error: 'no such window' } }`
- **AND** the bus client has a pending promise registered for `id: 'abc:7'`
- **THEN** that promise SHALL reject with an `Error` whose message is `'no such window'`
- **AND** the bus client SHALL remove the entry from its correlation map

### Requirement: SW adapter translates messages into coordinator enqueues

`apps/extension/src/background/bus-adapter.ts` SHALL export an `installBusAdapter(coordinator)` function (or equivalent registration entry point) that registers exactly one `chrome.runtime.onMessage` listener. The listener SHALL filter for `msg.type === 'lunma/command'`, validate the embedded `cmd.kind`, and call `coordinator.enqueue` with a `PendingEvent` whose `source === 'sidebar'`, `kind` matches the command, `payload` matches the command's payload, and `correlationId` matches the message's `id`.

The adapter SHALL NOT own any state. The coordinator owns correlation-to-ack bookkeeping.

#### Scenario: Adapter forwards a valid command

- **WHEN** the SW receives `{ type: 'lunma/command', id: 'abc:7', cmd: { kind: 'createSpace', payload: { ... } } }`
- **THEN** the adapter SHALL call `coordinator.enqueue({ source: 'sidebar', kind: 'createSpace', payload: { ... }, correlationId: 'abc:7' })`

#### Scenario: Adapter rejects messages with unknown kind

- **WHEN** the SW receives a message with `type: 'lunma/command'` but `cmd.kind` not in the known set
- **THEN** the adapter SHALL NOT call `coordinator.enqueue`
- **AND** the adapter SHALL log at `error` with code `BUS_UNKNOWN_KIND`
- **AND** the adapter SHALL emit `{ type: 'lunma/command-ack', id, result: { error: 'unknown command kind' } }` so the sidebar's promise rejects rather than timing out

### Requirement: Coalescing resolves dropped promises

When a coalesce policy causes a previously-enqueued command to be removed from the queue (a newer command supersedes it), the dropped command's correlation id SHALL be recorded for ack-as-success at end of drain. The dropped command's promise SHALL **resolve** with `undefined`, NOT reject.

#### Scenario: Two rapid renameSpace commands coalesce; both promises resolve

- **WHEN** the sidebar calls `bus.send({ kind: 'renameSpace', payload: { spaceId: 'a', newName: 'X' } })` and immediately calls `bus.send({ kind: 'renameSpace', payload: { spaceId: 'a', newName: 'Y' } })`
- **AND** both events queue before any drain runs
- **THEN** the first event SHALL be coalesced out per `EventPolicy['renameSpace'].coalesceKey`
- **AND** both promises SHALL resolve with `undefined`
- **AND** the resulting space name SHALL be `'Y'`

### Requirement: Coordinator escape hatches are removed

`Coordinator.flush()` and `Coordinator.markDirty()` SHALL NOT exist on the `Coordinator` class. No caller in the codebase SHALL invoke them.

`runRestartRecovery` SHALL NOT call coordinator methods. The SW boot path SHALL call `persist(store.snapshot())` once after `loadState`, `runBookmarkBootstrap`, and `runRestartRecovery` complete.

#### Scenario: Coordinator surface area excludes flush and markDirty

- **WHEN** a developer inspects the `Coordinator` class's public methods
- **THEN** `flush` and `markDirty` SHALL NOT be present
- **AND** `pnpm exec tsc --noEmit` SHALL fail if any code attempts to call them

#### Scenario: SW boot persists once after bootstrap and recovery

- **WHEN** the SW boots and runs `loadState → runBookmarkBootstrap → runRestartRecovery`
- **THEN** `persist(store.snapshot())` SHALL be called exactly once after `runRestartRecovery` returns
- **AND** no broadcast SHALL be emitted at boot time
- **AND** the coordinator SHALL NOT be invoked for boot-time mutations

### Requirement: Bookmark commands replace the bookmark-bindings.ts free functions

The saved-tab flows `openSavedTab`, `focusSavedTab`, `goHome`, `makeThisHome`, and `deleteSavedTab` SHALL exist as coordinator handlers (named identically or inlined, at the implementer's discretion within the constraint that all `chrome.*` work and store mutation happen inside the handler). They SHALL NOT exist as free functions in `apps/extension/src/background/tab-bindings.ts`.

The sidebar SHALL invoke these flows exclusively through `bus.send({ kind: 'openSavedTab' | 'focusSavedTab' | 'goHome' | 'makeThisHome' | 'deleteSavedTab', payload: { savedTabId, ... } })`. The command payload key SHALL be `savedTabId` (replacing the former `bookmarkId`).

`runRestartRecovery` SHALL remain exported from `tab-bindings.ts` but SHALL NOT call coordinator methods.

**Handler error contract:** if a handler cannot produce the effect its command name implies, it SHALL throw; the error becomes the ack's `result: { error }` and the sidebar's `await bus.send(...)` rejects. Per command:

- `openSavedTab` throws on: unknown `savedTabId`, `chrome.tabs.create` rejection, created tab has no `id`.
- `focusSavedTab` throws on: unknown `savedTabId`, binding is `null`/undefined (dormant), `chrome.tabs.update` or `chrome.windows.update` rejection.
- `goHome` throws on: unknown `savedTabId`, binding is `null`/undefined (dormant), `chrome.tabs.update` rejection.
- `makeThisHome` throws on: unknown `savedTabId`, `currentURL` is `null`. It sets `originalURL := currentURL` in Lunma state only and SHALL NOT call `chrome.bookmarks.update`.
- `deleteSavedTab` throws on failure to remove the `SavedTab` record. A `chrome.tabs.remove` rejection on the bound tab SHALL NOT throw (the user wants the saved tab gone regardless of tab state).

#### Scenario: Sidebar opens a saved tab via the bus

- **WHEN** the sidebar dispatches `bus.send({ kind: 'openSavedTab', payload: { savedTabId: 't-1', windowId: 100 } })`
- **THEN** the coordinator handler SHALL call `chrome.tabs.create` for the record's `originalURL` in window 100
- **AND** the handler SHALL call `store.bindSavedTab(savedTabId, newTabId, originalURL)`
- **AND** the drain cycle SHALL emit one `state-broadcast` and one `'lunma/command-ack'` with `result: 'ok'`

#### Scenario: Open of an unknown saved tab rejects the promise

- **WHEN** the sidebar dispatches `bus.send({ kind: 'openSavedTab', payload: { savedTabId: 'nope', windowId: 100 } })`
- **AND** no record with id `'nope'` exists in `store.state.savedTabs`
- **THEN** the handler SHALL throw and the resulting ack SHALL be `{ result: { error: '<message>' } }`
- **AND** the sidebar's promise SHALL reject with an `Error` enriched with `kind: 'openSavedTab'`

#### Scenario: focusSavedTab on a dormant saved tab rejects

- **WHEN** the sidebar dispatches `bus.send({ kind: 'focusSavedTab', payload: { savedTabId: 't-1' } })`
- **AND** `store.state.tabBindings['t-1']` is `null` or undefined
- **THEN** the handler SHALL throw and the sidebar's promise SHALL reject

#### Scenario: makeThisHome updates originalURL without touching Chrome bookmarks

- **WHEN** the sidebar dispatches `bus.send({ kind: 'makeThisHome', payload: { savedTabId: 't-1' } })`
- **AND** `store.state.savedTabs['t-1'].currentURL` is non-null
- **THEN** the handler SHALL set `originalURL := currentURL` on the record
- **AND** the handler SHALL NOT call `chrome.bookmarks.update`

#### Scenario: deleteSavedTab tolerates a tab-close failure

- **WHEN** the sidebar dispatches `bus.send({ kind: 'deleteSavedTab', payload: { savedTabId: 't-1' } })`
- **AND** the saved tab is bound to a tab that has already closed and `chrome.tabs.remove` rejects
- **AND** the record removal succeeds
- **THEN** the ack SHALL be `result: 'ok'` and the sidebar's promise SHALL resolve

### Requirement: focusTab command

The typed message bus SHALL define a `focusTab` command with payload `{ tabId: TabId }`. The coordinator's handler SHALL focus the tab by calling `chrome.tabs.update(tabId, { active: true })` and bringing its window forward via `chrome.windows.update(<tab.windowId>, { focused: true })`. The handler SHALL NOT mutate Lunma-owned records; the resulting active-tab change SHALL reach the sidebar through the normal `tabs.onActivated` → `setActiveTab` → broadcast path, not via an optimistic update. On failure the handler SHALL throw, and the coordinator SHALL emit a `lunma/command-ack` carrying `{ error }`.

#### Scenario: focusTab activates the tab and focuses its window

- **WHEN** a sidebar dispatches `bus.send({ kind: 'focusTab', payload: { tabId: 22 } })` and tab 22 is in window 100
- **THEN** the handler SHALL call `chrome.tabs.update(22, { active: true })`
- **AND** SHALL call `chrome.windows.update(100, { focused: true })`
- **AND** SHALL NOT modify any Lunma-owned record

#### Scenario: focusTab failure surfaces as a rejected ack

- **WHEN** `chrome.tabs.update` rejects for `focusTab`
- **THEN** the handler SHALL throw
- **AND** the coordinator SHALL emit a `lunma/command-ack` whose payload includes an `error`

### Requirement: closeTab command

The typed message bus SHALL define a `closeTab` command with payload `{ tabId: TabId }`. The coordinator's handler SHALL close the tab via `chrome.tabs.remove(tabId)`. The handler SHALL NOT directly mutate `tempTabIds` or `liveTabsById`; removal SHALL propagate through the existing `tabs.onRemoved` → `removeLiveTab` path so a single source maintains state. On failure the handler SHALL throw and the coordinator SHALL emit a `lunma/command-ack` carrying `{ error }`.

#### Scenario: closeTab removes the Chrome tab

- **WHEN** a sidebar dispatches `bus.send({ kind: 'closeTab', payload: { tabId: 22 } })`
- **THEN** the handler SHALL call `chrome.tabs.remove(22)`
- **AND** SHALL NOT directly delete `liveTabsById[22]` (the `onRemoved` listener does that)

#### Scenario: closeTab failure surfaces as a rejected ack

- **WHEN** `chrome.tabs.remove` rejects for `closeTab`
- **THEN** the handler SHALL throw
- **AND** the coordinator SHALL emit a `lunma/command-ack` whose payload includes an `error`

### Requirement: pinTab command

The `SidebarCommand` union SHALL include a `pinTab` kind with payload `{ tabId: TabId; windowId: WindowId; spaceId: SpaceId; targetIndex: number }`. The sidebar SHALL dispatch it when the user drags a temporary tab into the Pinned section (drop index → `targetIndex`) or triggers the pin shortcut (active tab, `targetIndex` = end). The SW handler SHALL mint a bound `SavedTab` and place it per the `lunma-bookmark-bindings` "Pinning a live tab creates a bound saved tab" requirement. The command carries only plain data.

#### Scenario: Sidebar dispatches pinTab on drop

- **WHEN** the user drops the temporary row for tab 42 at index 1 of Space "work" in window 100
- **THEN** the sidebar SHALL call `bus.send({ kind: 'pinTab', payload: { tabId: 42, windowId: 100, spaceId: 'work', targetIndex: 1 } })`

### Requirement: unpinTab command

The `SidebarCommand` union SHALL include an `unpinTab` kind with payload `{ savedTabId: SavedTabId; windowId: WindowId }`. The SW handler SHALL unpin per the `lunma-bookmark-bindings` "Unpinning keeps the tab as a temporary tab" requirement (remove the record, return any bound tab to `tempTabIds`, do not close the tab). The command carries only plain data.

#### Scenario: Sidebar dispatches unpinTab from the row menu

- **WHEN** the user chooses "Unpin" on a pinned row for saved tab `st-1` in window 100
- **THEN** the sidebar SHALL call `bus.send({ kind: 'unpinTab', payload: { savedTabId: 'st-1', windowId: 100 } })`

### Requirement: reorderPinned command

The `SidebarCommand` union SHALL include a `reorderPinned` kind with payload `{ spaceId: SpaceId; ids: SavedTabId[] }` carrying the full post-drop order. The SW handler SHALL call `store.setPinned(spaceId, ids)`. The sidebar SHALL NOT mutate its local order optimistically; the custom pointer-drag controller leaves the rendered list untouched during a drag, and the resulting broadcast is authoritative (ADR 0006, supersedes ADR 0003). The handler SHALL throw a descriptive Error if `spaceId` is absent from `state.spaces`.

#### Scenario: Sidebar dispatches reorderPinned with the post-drop order

- **WHEN** the user reorders Space "work" pinned tabs to `['t3','t1','t2']`
- **THEN** the sidebar SHALL call `bus.send({ kind: 'reorderPinned', payload: { spaceId: 'work', ids: ['t3','t1','t2'] } })`

### Requirement: reorderTemp command

The `SidebarCommand` union SHALL include a `reorderTemp` kind with payload `{ windowId: WindowId; tabIds: TabId[] }` carrying the full post-drop tab-id order of a window's Temporary list. The SW handler SHALL call `store.reorderTemp(windowId, tabIds)`, which reorders `spaceInstancesByWindow[windowId].tempTabIds` to match (ignoring ids no longer present and appending any present id the payload omitted). The sidebar SHALL NOT mutate its local order optimistically; the resulting broadcast is authoritative (ADR 0006). The command carries only plain data.

#### Scenario: Sidebar dispatches reorderTemp with the post-drop order

- **WHEN** the user drags temporary tab 17 below tab 22 in window 100 so the post-drop order is `[22, 17]`
- **THEN** the sidebar SHALL call `bus.send({ kind: 'reorderTemp', payload: { windowId: 100, tabIds: [22, 17] } })`

### Requirement: newTab command

The `SidebarCommand` union SHALL include a `newTab` kind with payload `{ windowId: WindowId; spaceId?: SpaceId }`. The sidebar SHALL dispatch it when the user activates a carousel panel's "New Tab" affordance, carrying that panel's `spaceId`. The coordinator's handler SHALL, when `spaceId` is present and is NOT the window's active Space, activate that Space first (the same sequence as `activateSpace`) so the newly created — and focused — tab is visible in it; when `spaceId` is absent or already the active Space, no activation occurs and behaviour is unchanged. The handler SHALL then open a tab via `chrome.tabs.create({ windowId, active: true })` (or focus the window's existing home tab when one is open). The handler SHALL NOT directly mutate Lunma-owned records — the new tab SHALL be adopted into the (now-)active Space and grouped through the existing `tabs.onCreated` path, so a single source maintains state. On failure the handler SHALL throw and the coordinator SHALL emit a `lunma/command-ack` carrying `{ error }`.

#### Scenario: newTab opens a tab in the window

- **WHEN** a sidebar dispatches `bus.send({ kind: 'newTab', payload: { windowId: 100, spaceId: 'work' } })` where "work" is the active Space
- **THEN** the handler SHALL call `chrome.tabs.create({ windowId: 100, active: true })`
- **AND** SHALL NOT directly mutate `tempTabIds` or `liveTabsById` (the `tabs.onCreated` listener adopts + groups the tab)

#### Scenario: newTab on a non-active target Space activates it first

- **GIVEN** window 100's active Space is "work"
- **WHEN** a sidebar dispatches `bus.send({ kind: 'newTab', payload: { windowId: 100, spaceId: 'side' } })`
- **THEN** the handler SHALL activate "side" (expand its group, collapse the outgoing) BEFORE creating the tab
- **AND** SHALL then open the tab via `chrome.tabs.create({ windowId: 100, active: true })`

#### Scenario: newTab failure surfaces as a rejected ack

- **WHEN** `chrome.tabs.create` rejects for `newTab`
- **THEN** the handler SHALL throw
- **AND** the coordinator SHALL emit a `lunma/command-ack` whose payload includes an `error`

### Requirement: clearTempTabs command

The `SidebarCommand` union SHALL include a `clearTempTabs` kind with payload `{ windowId: WindowId; spaceId?: SpaceId }`. The sidebar SHALL dispatch it when the user activates a carousel panel's "Clear" affordance, carrying that panel's `spaceId`. The coordinator's handler SHALL close every **temporary** tab of the **targeted** Space — that Space instance's `tempTabIds` that are still open in `windowId` — via a single `chrome.tabs.remove(ids)`; when `spaceId` is absent it SHALL fall back to the window's active Space. Clearing a background Space's temps in place SHALL NOT switch the active Space. Pinned/bound (saved) tabs SHALL NOT be closed (they are not in `tempTabIds`). The handler SHALL NOT directly mutate `tempTabIds` or `liveTabsById`; removal SHALL propagate through the existing `tabs.onRemoved` path. The handler SHALL be a no-op when the resolved Space is null or has no temporary tabs open in the window. On failure the handler SHALL throw and the coordinator SHALL emit a `lunma/command-ack` carrying `{ error }`.

#### Scenario: clearTempTabs closes the targeted Space's temporary tabs only

- **GIVEN** window 100's active Space "work" has temporary tab 17 and a non-active Space "side" has temporary tabs 30 and 31
- **WHEN** a sidebar dispatches `bus.send({ kind: 'clearTempTabs', payload: { windowId: 100, spaceId: 'side' } })`
- **THEN** the handler SHALL call `chrome.tabs.remove` with [30, 31]
- **AND** SHALL NOT close the active Space's temporary tab 17
- **AND** SHALL NOT switch the active Space away from "work"

#### Scenario: clearTempTabs is a no-op with no temporary tabs

- **WHEN** the resolved Space has no temporary tabs open and `clearTempTabs` is dispatched
- **THEN** the handler SHALL NOT call `chrome.tabs.remove`

#### Scenario: clearTempTabs failure surfaces as a rejected ack

- **WHEN** `chrome.tabs.remove` rejects for `clearTempTabs`
- **THEN** the handler SHALL throw
- **AND** the coordinator SHALL emit a `lunma/command-ack` whose payload includes an `error`

### Requirement: Command vocabulary covers all sidebar-driven mutations

The `SidebarCommand` discriminated union SHALL enumerate every sidebar-initiated mutation as a `{ kind, payload }` variant. The vocabulary SHALL include the Space lifecycle commands (`createSpace`, `renameSpace`, `recolourSpace`, `changeSpaceIcon`, `deleteSpace`, `restoreSpaceFromTrash`, `activateSpace`), the saved-tab commands (`openSavedTab`, `focusSavedTab`, `goHome`, `makeThisHome`, `deleteSavedTab`), the pinned-tab commands (`pinTab`, `unpinTab`, `reorderPinned`), the pinned-tab **folder** commands (`createFolder`, `createFolderFromTabs`, `renameFolder`, `setFolderIcon`, `setFolderColor`, `deleteFolder`), the temporary-tab commands (`reorderTemp`, `focusTab`, `closeTab`, `newTab`, `clearTempTabs`), and SHALL carry typed payloads referencing `SpaceId`, `SavedTabId`, `FolderId`, `TabId`, `WindowId`, `IconName`, and `SpaceColor` as appropriate.

The `reorderPinned` payload SHALL be `{ spaceId: SpaceId; nodes: PinNode[] }` — the full post-drop pinned tree — so that one command expresses reorder, move-into-folder, move-out-of-folder, and move-between-folders. The folder commands carrying new folder identity (`createFolder`, `createFolderFromTabs`) SHALL NOT carry a sidebar-minted `FolderId`; the service worker mints it.

#### Scenario: Every sidebar mutation has a command variant

- **WHEN** the sidebar needs to mutate persisted or window state
- **THEN** there SHALL be a matching `SidebarCommand` variant with a typed payload
- **AND** no sidebar mutation SHALL bypass the bus by mutating storage directly

#### Scenario: Command kinds are a closed set

- **WHEN** the coordinator processes a command
- **THEN** its `kind` SHALL be one of the enumerated `SidebarCommandKind` values
- **AND** unknown kinds SHALL be rejected by the type system at compile time

#### Scenario: Folder commands carry typed payloads

- **WHEN** the sidebar constructs a folder command
- **THEN** `createFolder` SHALL carry `{ spaceId }`
- **AND** `createFolderFromTabs` SHALL carry `{ spaceId; tabIdA: SavedTabId; tabIdB: SavedTabId; index: number }`
- **AND** `renameFolder` SHALL carry `{ spaceId; folderId: FolderId; name: string }`
- **AND** `setFolderIcon` SHALL carry `{ spaceId; folderId: FolderId; icon: IconName }`
- **AND** `setFolderColor` SHALL carry `{ spaceId; folderId: FolderId; color: SpaceColor }`
- **AND** `deleteFolder` SHALL carry `{ spaceId; folderId: FolderId }`

#### Scenario: reorderPinned carries the full tree

- **WHEN** the user completes a structural pinned-tab drag
- **THEN** the sidebar SHALL dispatch `reorderPinned` with `{ spaceId, nodes }` where `nodes` is the complete post-drop `PinNode[]`

### Requirement: openUrl command

The typed message bus SHALL define an `openUrl` command with payload
`{ url: string; windowId: WindowId }`. It is dispatched by the launcher to open a
**bookmark** or **history** result — results with no live tab or saved-tab record
to focus. The coordinator's handler SHALL open the URL in the given window via
`chrome.tabs.create({ url, windowId })`. The handler SHALL NOT directly mutate
`tempTabIds` or `liveTabsById`; the created tab SHALL reach Lunma state through the
existing `tabs.onCreated` path (which adopts + groups it into the window's active
Space). On failure the handler SHALL throw and the coordinator SHALL emit a
`lunma/command-ack` carrying `{ error }`.

The `openUrl` kind SHALL be added to the `SidebarCommand` discriminated union in
`apps/extension/src/shared/bus.ts`, with matching `PendingEvent` union, handlers-map, and
`EventPolicy` entries in the coordinator (per the `chrome-event-coordination`
capability's extension rule).

#### Scenario: openUrl opens the URL in the target window

- **WHEN** a client dispatches `bus.send({ kind: 'openUrl', payload: { url: 'https://example.com/', windowId: 100 } })`
- **THEN** the coordinator handler SHALL call `chrome.tabs.create({ url: 'https://example.com/', windowId: 100 })`
- **AND** it SHALL NOT directly mutate `tempTabIds` or `liveTabsById` (the `tabs.onCreated` path adopts the new tab)
- **AND** the coordinator SHALL emit a `lunma/command-ack` with result `'ok'`

#### Scenario: openUrl failure acks with an error

- **WHEN** `chrome.tabs.create` rejects for an `openUrl` command
- **THEN** the handler SHALL throw
- **AND** the coordinator SHALL emit a `lunma/command-ack` whose result includes an `error`

### Requirement: Sidebar bus carries the reorderSpaces command

The `SidebarCommand['reorderSpaces']` payload SHALL have the shape
`{ spaceIds: SpaceId[] }`. The SW handler SHALL call `store.reorderSpaces(spaceIds)`
within a single coordinator drain cycle and SHALL NOT coalesce (each reorder applies
its own full post-drop order). The `SIDEBAR_COMMAND_KINDS` set SHALL include
`reorderSpaces` so the SW adapter recognises a `lunma/command` message with
`cmd.kind: 'reorderSpaces'` and enqueues it as a sidebar event of that kind.

#### Scenario: SIDEBAR_COMMAND_KINDS includes reorderSpaces

- **WHEN** the SW adapter receives a `lunma/command` message with `cmd.kind: 'reorderSpaces'`
- **THEN** the kind SHALL be recognised as present in `SIDEBAR_COMMAND_KINDS`
- **AND** the message SHALL be enqueued as a sidebar event with kind `'reorderSpaces'`

#### Scenario: reorderSpaces applies and persists the new order

- **WHEN** the sidebar calls `bus.send({ kind: 'reorderSpaces', payload: { spaceIds } })`
- **THEN** the SW handler SHALL call `store.reorderSpaces(spaceIds)`
- **AND** the resulting state SHALL be persisted and broadcast to every surface

### Requirement: `setTabBoundary` command sets a pinned tab's domain boundary

The `SidebarCommand` union SHALL gain
`setTabBoundary { savedTabId: SavedTabId; boundary: TabBoundary | null }`. A `null`
payload SHALL clear the tab back to **inherit** (remove the `boundary` field); a
`{ mode: 'off' }` or `{ mode: 'locked'; allow }` payload SHALL set it explicitly.
The coordinator handler SHALL apply the change through a synchronous store mutator
`store.setTabBoundary(savedTabId, boundary)` (thin-store rule: plain data, no
`chrome.*`), then — if the saved tab is currently bound — re-resolve the effective
allow-set and push the updated configuration to that tab's content script. The
payload SHALL carry plain data only (no functions, Chrome objects, or Promises).

Per the throw-on-cannot-fulfill rule, if `savedTabId` names no saved tab the
handler SHALL throw, and the error SHALL reach the sidebar caller's `.catch`.

#### Scenario: Locking a pinned tab pushes config to its bound tab

- **WHEN** `setTabBoundary { savedTabId, boundary: { mode: 'locked', allow: ['*.example.com'] } }` is dispatched for a bound saved tab
- **THEN** the store SHALL record the boundary
- **AND** the coordinator SHALL push the resolved allow-set to that tab's content script so enforcement takes effect without re-opening the tab

#### Scenario: Clearing a boundary returns the tab to inherit

- **WHEN** `setTabBoundary { savedTabId, boundary: null }` is dispatched
- **THEN** the saved tab's `boundary` field SHALL be removed (absent ⇒ inherit the global default)

#### Scenario: Unknown saved tab id throws

- **WHEN** `setTabBoundary` names a `savedTabId` with no saved-tab record
- **THEN** the handler SHALL throw and the sidebar SHALL receive the error

### Requirement: restoreArchivedTab command

The `SidebarCommand` union (`apps/extension/src/shared/bus.ts`) SHALL include a `restoreArchivedTab` kind with payload `{ archivedAt: number; tabId: number; windowId: WindowId }`, and `SIDEBAR_COMMAND_KINDS` SHALL include `'restoreArchivedTab'` so the SW adapter recognises and enqueues it as a sidebar event. The payload carries only plain data. The entry is identified by the composite `(archivedAt, tabId)` — `archivedAt` alone is NOT unique (a single sweep stamps every tab it archives with the same `now`), but a tab is archived at most once per sweep and sweeps carry distinct timestamps, so the pair is unique. The coordinator handler SHALL implement the restore contract defined by the `auto-archive` capability: locate the `archivedTabs` entry by the `(archivedAt, tabId)` pair, open its URL in `windowId` via `chrome.tabs.create` (adopted through the existing `tabs.onCreated` path, like `openUrl` — it SHALL NOT directly mutate `tempTabIds` or `liveTabsById`), and remove the entry via `store.removeArchivedTab(archivedAt, tabId)`. Per the throw-on-cannot-fulfill rule, if no entry matches the pair the handler SHALL throw and the sidebar's `bus.send` promise SHALL reject.

The matching `PendingEvent` union, handlers-map, and `EventPolicy` entries SHALL be added in the coordinator (per the `chrome-event-coordination` extension rule). `restoreArchivedTab` SHALL NOT define coalescing (each restore is a distinct intent).

#### Scenario: SIDEBAR_COMMAND_KINDS includes restoreArchivedTab

- **WHEN** the SW adapter receives a `lunma/command` message with `cmd.kind: 'restoreArchivedTab'`
- **THEN** `SIDEBAR_COMMAND_KINDS.has('restoreArchivedTab')` SHALL return `true`
- **AND** the message SHALL be enqueued as a sidebar event with kind `'restoreArchivedTab'`

#### Scenario: restoreArchivedTab opens the URL and removes the record

- **WHEN** the sidebar dispatches `bus.send({ kind: 'restoreArchivedTab', payload: { archivedAt: 123, tabId: 5, windowId: 100 } })`
- **AND** an `archivedTabs` entry with `archivedAt: 123` and `tabId: 5` points at `https://example.com/`
- **THEN** the handler SHALL call `chrome.tabs.create({ url: 'https://example.com/', windowId: 100 })`
- **AND** SHALL call `store.removeArchivedTab(123, 5)`
- **AND** the drain SHALL emit one `state-broadcast` and one `'lunma/command-ack'` with `result: 'ok'`

#### Scenario: restoreArchivedTab on an unknown entry rejects

- **WHEN** the sidebar dispatches `bus.send({ kind: 'restoreArchivedTab', payload: { archivedAt: 999, tabId: 5, windowId: 100 } })`
- **AND** no `archivedTabs` entry matches the `(archivedAt: 999, tabId: 5)` pair
- **THEN** the handler SHALL throw and the ack SHALL be `{ result: { error: <message> } }`
- **AND** the sidebar's promise SHALL reject with an `Error` enriched with `kind: 'restoreArchivedTab'`

### Requirement: setSpaceAutoArchive command

The `SidebarCommand` union (`apps/extension/src/shared/bus.ts`) SHALL include a `setSpaceAutoArchive` kind with payload `{ spaceId: SpaceId; autoArchive: SpaceAutoArchive | null }`, and `SIDEBAR_COMMAND_KINDS` SHALL include `'setSpaceAutoArchive'`. A `null` payload SHALL clear the Space back to **inherit** (remove the `autoArchive` field); a `{ mode: 'off' }` or `{ mode: 'custom'; idleMinutes }` payload SHALL set it explicitly. The payload carries plain data only. The coordinator handler SHALL apply the change through the synchronous store mutator `store.setSpaceAutoArchive(spaceId, autoArchive)` (thin-store rule: plain data, no `chrome.*`); the next sweep reads the updated override (no live re-resolution push is required). Per the throw-on-cannot-fulfill rule, if `spaceId` names no Space the handler SHALL throw and the sidebar caller's `bus.send` promise SHALL reject. `setSpaceAutoArchive` SHALL NOT define coalescing.

#### Scenario: SIDEBAR_COMMAND_KINDS includes setSpaceAutoArchive

- **WHEN** the SW adapter receives a `lunma/command` message with `cmd.kind: 'setSpaceAutoArchive'`
- **THEN** `SIDEBAR_COMMAND_KINDS.has('setSpaceAutoArchive')` SHALL return `true`
- **AND** the message SHALL be enqueued as a sidebar event with kind `'setSpaceAutoArchive'`

#### Scenario: Setting a custom override persists and broadcasts

- **WHEN** the Space editor dispatches `bus.send({ kind: 'setSpaceAutoArchive', payload: { spaceId: 'work', autoArchive: { mode: 'custom', idleMinutes: 15 } } })` for an existing Space `work`
- **THEN** the handler SHALL call `store.setSpaceAutoArchive('work', { mode: 'custom', idleMinutes: 15 })`
- **AND** the drain SHALL emit one persist and one `state-broadcast` carrying the updated Space

#### Scenario: Null clears the override back to inherit

- **WHEN** the Space editor dispatches `setSpaceAutoArchive` with `autoArchive: null` for Space `work`
- **THEN** the Space's `autoArchive` field SHALL be removed (absent ⇒ inherit the global setting)

#### Scenario: Unknown spaceId throws

- **WHEN** `setSpaceAutoArchive` names a `spaceId` not present in `state.spaces`
- **THEN** the handler SHALL throw and the sidebar SHALL receive the error

### Requirement: clearArchivedTabs command

The `SidebarCommand` union (`apps/extension/src/shared/bus.ts`) SHALL include a `clearArchivedTabs` kind with an empty payload (`Record<string, never>`), and `SIDEBAR_COMMAND_KINDS` SHALL include `'clearArchivedTabs'`. The coordinator handler SHALL discard EVERY archived-tab record via the synchronous store mutator `store.clearArchivedTabs()` (global — not scoped to a Space), emitting one persist and one `state-broadcast` when anything was cleared. When `archivedTabs` is already empty the handler SHALL be a no-op (no persist/broadcast) but SHALL still ack `ok`. `clearArchivedTabs` SHALL NOT define coalescing. It is dispatched from the options "Recently archived" subpage's "Clear all" affordance.

#### Scenario: SIDEBAR_COMMAND_KINDS includes clearArchivedTabs

- **WHEN** the SW adapter receives a `lunma/command` message with `cmd.kind: 'clearArchivedTabs'`
- **THEN** `SIDEBAR_COMMAND_KINDS.has('clearArchivedTabs')` SHALL return `true` and it SHALL enqueue as a sidebar event

#### Scenario: Clear all empties archivedTabs

- **WHEN** `clearArchivedTabs` is handled and `state.archivedTabs` is non-empty
- **THEN** the handler SHALL call `store.clearArchivedTabs()` so `archivedTabs` becomes empty
- **AND** the drain SHALL emit one persist and one `state-broadcast`

#### Scenario: Clear all on an empty list is a no-op that still acks

- **WHEN** `clearArchivedTabs` is handled and `state.archivedTabs` is already empty
- **THEN** no persist or `state-broadcast` SHALL be emitted
- **AND** the ack SHALL still be `ok`

### Requirement: deleteArchivedTab command

The `SidebarCommand` union (`apps/extension/src/shared/bus.ts`) SHALL include a `deleteArchivedTab` kind with payload `{ archivedAt: number; tabId: number }`, and `SIDEBAR_COMMAND_KINDS` SHALL include `'deleteArchivedTab'`. It permanently discards ONE archived record WITHOUT restoring it (the per-row delete in the options Recently-archived view), identified by the same unique `(archivedAt, tabId)` composite as `restoreArchivedTab`. The coordinator handler SHALL call `store.removeArchivedTab(archivedAt, tabId)` (the same mutator restore uses) and SHALL NOT open a tab; it is **idempotent** — a no-op (no persist/broadcast) when no entry matches, but it SHALL still ack `ok` (unlike `restoreArchivedTab`, which throws on a missing entry, since the user expects a tab to open). `deleteArchivedTab` SHALL NOT define coalescing.

#### Scenario: deleteArchivedTab removes the record without reopening it

- **WHEN** `deleteArchivedTab` is handled for an `(archivedAt, tabId)` that matches an entry
- **THEN** the handler SHALL call `store.removeArchivedTab(archivedAt, tabId)` so the entry leaves `archivedTabs`
- **AND** it SHALL NOT call `chrome.tabs.create`
- **AND** the drain SHALL emit one persist and one `state-broadcast`

#### Scenario: deleteArchivedTab on a missing entry is a no-op that still acks

- **WHEN** `deleteArchivedTab` names an `(archivedAt, tabId)` matching no entry
- **THEN** no persist or `state-broadcast` SHALL be emitted, and the ack SHALL still be `ok`

