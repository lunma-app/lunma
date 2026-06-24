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

The `SidebarCommand` discriminated union SHALL be exported from the same module. Its full vocabulary — the closed set of `{ kind, payload }` variants — is owned by the *Command vocabulary covers all sidebar-driven mutations* requirement, with `apps/extension/src/shared/bus.ts` as the authoritative source; this requirement SHALL NOT pin a fixed count of kinds.

Each `SidebarCommand` variant SHALL carry only plain-data fields — no functions, no Chrome objects, no Promises. Confirmation flows that previously took a callback (e.g. `deleteBookmark`) SHALL be resolved on the sidebar side before `bus.send` is called.

The `SidebarCommand['createSpace']` payload SHALL have the shape `{ name: string; color: SpaceColor; icon: IconName; windowId: WindowId }`. The `IconName` type is the lucide-icon string-literal union exported from `apps/extension/src/shared/icon-names.ts`. The SW handler mints a Lunma-owned Space record (`store.createSpace`) with the user-supplied colour and icon, and auto-activates it in the supplied window — all within a single coordinator drain cycle. No Chrome bookmark folder is created; Spaces are Lunma-owned records per ADR 0001.

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

`apps/extension/src/background/bus-adapter.ts` SHALL export an `installBusAdapter(coordinator, whenReady?)` function that registers exactly one `chrome.runtime.onMessage` listener **synchronously** in the SW's first top-level turn (so an MV3 wake-up command is not missed), and defers each command's `coordinator.enqueue` until `whenReady` resolves — the existing boot-order contract, **unchanged** by this change. The listener SHALL verify `sender.id === chrome.runtime.id`, filter for `msg.type === 'lunma/command'`, and validate the embedded `cmd` against the `SidebarCommand` **schema** — a Zod discriminated union keyed on `kind`, exhaustive against the `SidebarCommand` union by a compile-time `satisfies` check. Only a command whose `kind` is recognised AND whose full `payload` validates SHALL be forwarded: the adapter enqueues (after readiness) a `PendingEvent` whose `source === 'sidebar'`, `kind` matches the command, `payload` matches the validated payload, and `correlationId` matches the message's `id`. Validation and error-acks happen **synchronously** (not deferred), as today.

A command whose `kind` is unknown OR whose payload fails schema validation SHALL NOT be enqueued; the adapter SHALL emit a `{ type: 'lunma/command-ack', id, result: { error } }` (via the existing ack emitter) so the sidebar's promise rejects rather than timing out, and SHALL log the rejection.

The adapter SHALL NOT own any state. The coordinator owns correlation-to-ack bookkeeping.

#### Scenario: Adapter forwards a valid command

- **WHEN** the SW receives `{ type: 'lunma/command', id: 'abc:7', cmd: { kind: 'createSpace', payload: { ... } } }` whose payload validates against the schema
- **THEN** the adapter SHALL call `coordinator.enqueue({ source: 'sidebar', kind: 'createSpace', payload: { ... }, correlationId: 'abc:7' })`

#### Scenario: Adapter rejects messages with unknown kind

- **WHEN** the SW receives a message with `type: 'lunma/command'` but `cmd.kind` not in the known set
- **THEN** the adapter SHALL NOT call `coordinator.enqueue`
- **AND** the adapter SHALL log at `error` with code `BUS_UNKNOWN_KIND`
- **AND** the adapter SHALL emit `{ type: 'lunma/command-ack', id, result: { error: 'unknown command kind' } }` so the sidebar's promise rejects rather than timing out

#### Scenario: Adapter rejects a command whose payload fails schema validation

- **WHEN** the SW receives `{ type: 'lunma/command', id: 'abc:8', cmd: { kind: 'createSpace', payload: { /* missing or wrong-typed fields */ } } }`
- **THEN** the adapter SHALL NOT call `coordinator.enqueue`
- **AND** the adapter SHALL log the validation failure at `error` (e.g. code `BUS_INVALID_PAYLOAD`)
- **AND** the adapter SHALL emit `{ type: 'lunma/command-ack', id: 'abc:8', result: { error: <validation message> } }` so the sidebar's promise rejects with a descriptive error

#### Scenario: The command schema is exhaustive against the union at compile time

- **WHEN** a new variant is added to the `SidebarCommand` union without a matching schema variant
- **THEN** the `satisfies` guard SHALL fail `tsc`, so the schema can never silently fall behind the vocabulary

### Requirement: Fire-and-forget dispatch helper

The bus module SHALL export a `dispatch(cmd: SidebarCommand): void` helper alongside the `bus` singleton. `dispatch` SHALL call `bus.send(cmd)` and route any rejection through the shared logger (never an unhandled rejection). It is the single sanctioned path for sidebar UI actions that do not await the ack; confirmation flows that need the ack SHALL continue to `await bus.send(...)` directly.

No **sidebar** surface SHALL re-implement its own `bus.send(...).catch(...)` wrapper or call `chrome.runtime.sendMessage` directly for command dispatch; sidebar surfaces SHALL use `dispatch` (fire-and-forget) or `bus.send` (awaited).

The **launcher overlay** (`launcher/overlay.ts`) is a documented exception: as a `<all_urls>` content script under a `<15KB`-gzip byte budget it MUST NOT import the `bus` singleton (which bundles the logger) and wires no bus ack listener (so a `bus.send` there would only ever time out). It SHALL therefore dispatch commands by sending the `lunma/command` wire envelope directly via `chrome.runtime.sendMessage`, fire-and-forget. This is the ONLY sanctioned raw-`sendMessage` command path; the SW adapter validates the overlay's payloads identically, so the security boundary is unchanged.

#### Scenario: A failed fire-and-forget dispatch is logged, not unhandled

- **WHEN** a surface calls `dispatch(cmd)` and the resulting `bus.send` promise rejects (timeout, transport error, or an `{ error }` ack)
- **THEN** the rejection SHALL be caught and logged via the shared logger
- **AND** no unhandled promise rejection SHALL surface

#### Scenario: Surfaces do not re-roll the catch-wrapper

- **WHEN** the codebase is checked for command dispatch
- **THEN** sidebar surfaces SHALL dispatch via `dispatch` or `bus.send`
- **AND** no sidebar surface SHALL carry its own duplicated `bus.send(...).catch(...)` wrapper or a raw `chrome.runtime.sendMessage` command send
- **AND** the launcher overlay SHALL be the sole documented exception, sending the `lunma/command` envelope directly (byte-budget + no-ack-listener rationale), with its payloads still validated by the SW adapter

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

`openSavedTab`'s payload MAY additionally carry an optional `replaceTabId: number` (the `newtab-hearth` in-place open): when present, the handler SHALL open the saved tab by navigating that existing tab (`chrome.tabs.update(replaceTabId, …)`) and binding it, instead of creating a new tab. When `replaceTabId` is stale — the tab no longer exists or the update rejects — the handler SHALL fall back to the create path (the command's effect is "open the saved tab"; the in-place navigation is a refinement, not a precondition). When `replaceTabId` is absent, behaviour is unchanged.

`runRestartRecovery` SHALL remain exported from `tab-bindings.ts` but SHALL NOT call coordinator methods.

**Handler error contract:** if a handler cannot produce the effect its command name implies, it SHALL throw; the error becomes the ack's `result: { error }` and the sidebar's `await bus.send(...)` rejects. Per command:

- `openSavedTab` throws on: unknown `savedTabId`, `chrome.tabs.create` rejection, created tab has no `id`. With a `replaceTabId` present, a `chrome.tabs.update` rejection or stale tab does NOT itself throw — the handler falls back to the create path and throws only if that path throws.
- `focusSavedTab` throws on: unknown `savedTabId`, binding is `null`/undefined (dormant), `chrome.tabs.update` or `chrome.windows.update` rejection.
- `goHome` throws on: unknown `savedTabId`, binding is `null`/undefined (dormant), `chrome.tabs.update` rejection.
- `makeThisHome` throws on: unknown `savedTabId`, `currentURL` is `null`. It sets `originalURL := currentURL` in Lunma state only and SHALL NOT call `chrome.bookmarks.update`.
- `deleteSavedTab` throws on failure to remove the `SavedTab` record. A `chrome.tabs.remove` rejection on the bound tab SHALL NOT throw (the user wants the saved tab gone regardless of tab state).

#### Scenario: Sidebar opens a saved tab via the bus

- **WHEN** the sidebar dispatches `bus.send({ kind: 'openSavedTab', payload: { savedTabId: 't-1', windowId: 100 } })`
- **THEN** the coordinator handler SHALL call `chrome.tabs.create` for the record's `originalURL` in window 100
- **AND** the handler SHALL call `store.bindSavedTab(savedTabId, newTabId, originalURL)`
- **AND** the drain cycle SHALL emit one `state-broadcast` and one `'lunma/command-ack'` with `result: 'ok'`

#### Scenario: Open with replaceTabId navigates that tab instead of creating one

- **WHEN** the new-tab home dispatches `bus.send({ kind: 'openSavedTab', payload: { savedTabId: 't-1', windowId: 100, replaceTabId: 42 } })`
- **AND** tab 42 is live in window 100
- **THEN** the handler SHALL call `chrome.tabs.update(42, …)` for the record's `originalURL` and SHALL NOT call `chrome.tabs.create`
- **AND** the handler SHALL bind the saved tab to tab 42

#### Scenario: A stale replaceTabId falls back to the create path

- **WHEN** `openSavedTab` is dispatched with `replaceTabId: 42` and tab 42 no longer exists (the update rejects)
- **THEN** the handler SHALL fall back to `chrome.tabs.create` and bind the created tab
- **AND** the ack SHALL be `result: 'ok'` (no rejection from the stale id alone)

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

The `SidebarCommand` union SHALL include a `reorderPinned` kind with payload `{ spaceId: SpaceId; nodes: PinNode[] }` carrying the full post-drop pinned tree (all three node kinds — `tab`, `folder`, `lens` — round-trip losslessly). The SW handler SHALL call `store.setPinned(spaceId, nodes)`. The sidebar SHALL NOT mutate its local order optimistically; the custom pointer-drag controller leaves the rendered list untouched during a drag, and the resulting broadcast is authoritative (supersedes the earlier dnd-library drag model). The handler SHALL throw a descriptive Error if `spaceId` is absent from `state.spaces`.

#### Scenario: Sidebar dispatches reorderPinned with the post-drop tree

- **WHEN** the user reorders Space "work" pins so the post-drop tree is `[{ kind: 'tab', id: 't3' }, { kind: 'lens', id: 'sf1', … }, { kind: 'tab', id: 't1' }]`
- **THEN** the sidebar SHALL call `bus.send({ kind: 'reorderPinned', payload: { spaceId: 'work', nodes: <that tree> } })`
- **AND** the SW handler SHALL call `store.setPinned('work', nodes)`

### Requirement: reorderTemp command

The `SidebarCommand` union SHALL include a `reorderTemp` kind with payload `{ windowId: WindowId; tabIds: TabId[] }` carrying the full post-drop tab-id order of a window's Temporary list. The SW handler SHALL call `store.reorderTemp(windowId, tabIds)`, which reorders `spaceInstancesByWindow[windowId].tempTabIds` to match (ignoring ids no longer present and appending any present id the payload omitted). The sidebar SHALL NOT mutate its local order optimistically; the resulting broadcast is authoritative. The command carries only plain data.

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

The `SidebarCommand` discriminated union in `apps/extension/src/shared/bus.ts` SHALL be the single authoritative source for the sidebar command vocabulary: it SHALL enumerate every sidebar-initiated mutation as a `{ kind, payload }` variant carrying only plain data, and no sidebar mutation SHALL bypass it by mutating storage directly. This requirement SHALL NOT pin an exact count of kinds — the union is the source of truth and grows as new sidebar mutations are added; the closed-set guarantee is enforced at compile time (see "Command kinds are a closed set"), not by a fixed list duplicated in prose.

The vocabulary SHALL cover, at minimum, these command families:

- **Space lifecycle:** `createSpace`, `renameSpace`, `recolourSpace`, `changeSpaceIcon`, `deleteSpace`, `restoreSpaceFromTrash`, `activateSpace`, `reorderSpaces`.
- **Saved-tab:** `openSavedTab`, `focusSavedTab`, `goHome`, `makeThisHome`, `deleteSavedTab`, `renameTab`, `setTabBoundary`.
- **Pinned-tab and favourites:** `pinTab`, `unpinTab`, `reorderPinned`, `pinSavedTab`, `favoriteTab`, `favoriteSavedTab`, `reorderFavorites`.
- **Pinned-tab folder:** `createFolder`, `createFolderFromTabs`, `renameFolder`, `setFolderIcon`, `setFolderColor`, `deleteFolder`.
- **Lens:** `createLens`, `updateLens`, `deleteLens`, `refreshLens` (see Requirement: Lens lifecycle commands), `openLensItem` (see Requirement: Lens-item activation command).
- **Temporary-tab and navigation:** `reorderTemp`, `focusTab`, `closeTab`, `newTab`, `clearTempTabs`, `undoClearTempTabs`, `renameTempTab`, `openUrl`.
- **Archive and auto-archive:** `restoreArchivedTab`, `deleteArchivedTab`, `clearArchivedTabs`, `setSpaceAutoArchive`.

Each variant SHALL carry typed payloads referencing `SpaceId`, `SavedTabId`, `FolderId`, `TabId`, `WindowId`, `IconName`, and `SpaceColor` as appropriate.

The `reorderPinned` payload SHALL be `{ spaceId: SpaceId; nodes: PinNode[] }` — the full post-drop pinned tree — so that one command expresses reorder, move-into-folder, move-out-of-folder, and move-between-folders. The `bus.ts` `PinNode` payload schema SHALL admit all three node kinds (`tab`, `folder`, `lens`) so a tree containing a lens round-trips `reorderPinned` losslessly, with the lens node's config fields intact. The folder commands carrying new folder identity (`createFolder`, `createFolderFromTabs`, `createLens`) SHALL NOT carry a sidebar-minted `FolderId`; the service worker mints it.

#### Scenario: Every sidebar mutation has a command variant

- **WHEN** the sidebar needs to mutate persisted or window state
- **THEN** there SHALL be a matching `SidebarCommand` variant with a typed payload
- **AND** no sidebar mutation SHALL bypass the bus by mutating storage directly

#### Scenario: Command kinds are a closed set

- **WHEN** the coordinator processes a command
- **THEN** its `kind` SHALL be one of the enumerated `SidebarCommandKind` values
- **AND** unknown kinds SHALL be rejected by the type system at compile time
- **AND** the `SIDEBAR_COMMAND_KINDS` runtime guard SHALL stay exhaustive against `SidebarCommandKind` (e.g. `satisfies Record<SidebarCommandKind, true>`), so a kind added to the union without updating the guard fails `tsc`

#### Scenario: Previously-unspecified kinds are part of the vocabulary

- **WHEN** the sidebar dispatches `renameTab`, `renameTempTab`, `favoriteTab`, `favoriteSavedTab`, `pinSavedTab`, `reorderFavorites`, or `undoClearTempTabs`
- **THEN** each SHALL be a recognised `SidebarCommand` kind in the authoritative union
- **AND** the SW adapter's `SIDEBAR_COMMAND_KINDS` SHALL accept it

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
- **AND** a `lens` node present in the tree SHALL round-trip with its config fields intact

### Requirement: openUrl command

The typed message bus SHALL define an `openUrl` command with payload
`{ url: string; windowId: WindowId; force?: boolean }`.

The optional `force` field defaults to absent (falsy). When absent or `false`,
the coordinator handler applies tab deduplication (see `tab-dedup` capability).
When `true`, dedup is bypassed and a new tab is always created.

The `openUrl` kind SHALL remain in the `SidebarCommand` discriminated union in
`apps/extension/src/shared/bus.ts`. The Zod schema for `openUrl` SHALL use
`z.optional(z.boolean())` for `force`.

Existing callers that omit `force` require no changes — the field is optional and
backward-compatible.

#### Scenario: openUrl without force deduplicates

- **WHEN** a client dispatches `bus.send({ kind: 'openUrl', payload: { url: 'https://example.com/', windowId: 100 } })`
- **AND** a tab at that URL is already open in the active Space
- **THEN** the handler focuses the existing tab rather than creating a new one

#### Scenario: openUrl with force:true always creates

- **WHEN** a client dispatches `bus.send({ kind: 'openUrl', payload: { url: 'https://example.com/', windowId: 100, force: true } })`
- **THEN** `chrome.tabs.create` is called regardless of whether that URL is already open

#### Scenario: openUrl failure acks with an error

- **WHEN** `chrome.tabs.create` rejects for an `openUrl` command (non-dedup path)
- **THEN** the drain SHALL emit a `'lunma/command-ack'` with `{ result: { error: <message> } }`
- **AND** `bus.send`'s returned promise SHALL reject

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
The `locked` `allow` list SHALL remain a `string[]` on the wire (shape unchanged);
its entries are **URL globs** (a bare host meaning the whole host, or a URL pattern
with a path), resolved and matched by the boundary subsystem — the bus carries them
as opaque strings. The coordinator handler SHALL apply the change through a
synchronous store mutator `store.setTabBoundary(savedTabId, boundary)` (thin-store
rule: plain data, no `chrome.*`), then — if the saved tab is currently bound —
re-resolve the effective allow-set and push the updated configuration to that tab's
content script. The payload SHALL carry plain data only (no functions, Chrome
objects, or Promises).

Per the throw-on-cannot-fulfill rule, if `savedTabId` names no saved tab the
handler SHALL throw, and the error SHALL reach the sidebar caller's `.catch`.

#### Scenario: Locking a pinned tab pushes config to its bound tab

- **WHEN** `setTabBoundary { savedTabId, boundary: { mode: 'locked', allow: ['*.example.com'] } }` is dispatched for a bound saved tab
- **THEN** the store SHALL record the boundary
- **AND** the coordinator SHALL push the resolved allow-set to that tab's content script so enforcement takes effect without re-opening the tab

#### Scenario: A URL-pattern allow-set is carried and pushed unchanged

- **WHEN** `setTabBoundary { savedTabId, boundary: { mode: 'locked', allow: ['https://gitlab.com/dashboard/merge_requests*'] } }` is dispatched for a bound saved tab
- **THEN** the store SHALL record the URL-pattern allow-set verbatim
- **AND** the coordinator SHALL push that allow-set to the tab's content script (the bus does not reject or rewrite path-bearing entries)

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

### Requirement: importState command applies a validated backup

The bus SHALL carry an `importState` command — `{ kind: 'importState'; payload: { backup: BackupEnvelope } }`
— dispatched by the options surface and handled by the background coordinator (the owner
of the store). The command SHALL be registered in every guarded site that the typed bus
requires so a missing registration fails `tsc`: the `SidebarCommand` union, the
`SIDEBAR_COMMAND_KINDS` set, the `_kindExhaustiveness` record, the `COMMAND_SCHEMAS` Zod
map (validating the `backup` payload against `BackupEnvelopeSchema`), and the
`SidebarCommandSchema` union; plus the coordinator-side `PendingEvent` union and an
`EventPolicy` entry. Its `EventPolicy` SHALL treat each invocation as distinct (no
coalescing).

The handler SHALL validate + migrate the backup (per the `data-backup` capability) and, on
success, replace the store state and `markDirty()` so the coordinator persists and
broadcasts the replacement in one atomic cycle. On a validation failure the handler SHALL
NOT mutate, persist, or broadcast, and the dispatcher's `bus.send` SHALL reject so the
options page can surface the failure.

#### Scenario: A dispatched importState with an invalid payload is rejected at the boundary

- **WHEN** an `importState` is dispatched whose `backup` payload does not match `BackupEnvelopeSchema`
- **THEN** the bus adapter SHALL reject it at the validation boundary and the coordinator SHALL NOT run the handler

#### Scenario: A valid importState replaces and broadcasts state

- **WHEN** an `importState` carrying a valid backup is handled
- **THEN** the store state SHALL be replaced and a single persist + `state-broadcast` SHALL deliver the new state to every open surface

### Requirement: duplicateTab command

The typed message bus SHALL define a `duplicateTab` command with payload
`{ tabId: TabId }`. The `duplicateTab` kind SHALL be added to the `SidebarCommand`
discriminated union and to `SIDEBAR_COMMAND_KINDS`. The coordinator handler (in
`temp-tabs.ts`) calls `chrome.tabs.duplicate(tabId)`.

#### Scenario: duplicateTab is a recognised sidebar command

- **WHEN** the sidebar dispatches `bus.send({ kind: 'duplicateTab', payload: { tabId: 42 } })`
- **THEN** the SW adapter SHALL recognise the kind (`SIDEBAR_COMMAND_KINDS.has('duplicateTab')` returns `true`)
- **AND** the drain SHALL invoke the `duplicateTab` coordinator handler

#### Scenario: duplicateTab resolves on success

- **WHEN** `chrome.tabs.duplicate(42)` succeeds
- **THEN** the `bus.send` promise SHALL resolve

#### Scenario: duplicateTab rejects on failure

- **WHEN** `chrome.tabs.duplicate` rejects (tab does not exist)
- **THEN** the handler SHALL throw
- **AND** `bus.send` SHALL reject with a descriptive error

### Requirement: requestStateSnapshot validates its response payload

The `requestStateSnapshot()` function exported from `apps/extension/src/shared/messages.ts` SHALL validate the `state` field of the SW's response against `AppStateV7Schema` before returning. If validation fails, it SHALL throw a descriptive `Error` whose message begins with `'requestStateSnapshot: invalid state payload'` and includes a summary of the first Zod issue. It SHALL NOT return an unvalidated `msg.state` directly.

The function SHALL NOT return `msg.state` by casting (`msg.state as AppState`). After the schema fix in the `storage-and-migrations` capability (`liveTabsById` / `smartFolders` gaining `.default({})`), the parse result SHALL be directly assignable to `AppState` without any cast.

#### Scenario: A valid state snapshot parses and is returned without a cast

- **WHEN** the SW responds with a valid `lunma/state-snapshot` message whose `state` passes `AppStateV7Schema.safeParse`
- **THEN** `requestStateSnapshot` SHALL return `stateResult.data` directly, typed as `AppState`, with no `as AppState` or `as unknown as AppState` cast required

#### Scenario: A malformed state snapshot throws a descriptive error

- **WHEN** the SW responds with a `lunma/state-snapshot` message whose `state` fails `AppStateV7Schema.safeParse` (e.g. a field has the wrong type)
- **THEN** `requestStateSnapshot` SHALL throw an `Error` whose `message` starts with `'requestStateSnapshot: invalid state payload'`
- **AND** the caller's `await requestStateSnapshot()` promise SHALL reject with that error

### Requirement: Lens-item activation command

The `SidebarCommand` union SHALL include `openLensItem` —
`{ spaceId: SpaceId; folderId: FolderId; itemId: string; windowId: WindowId }`
— validated by a Zod schema in the `bus.ts` discriminated union. The payload
carries **identity only**: the SW resolves the item's URL from its own
`lenses` runtime slice and SHALL NOT accept a URL on the wire (the
`openUrl` scheme-hardening questions never arise; the attack surface is a
lookup key).

Handler semantics: when `lensItemBindings[folderId][itemId][windowId]`
exists, focus that tab (the `focusSavedTab` shape); otherwise resolve the
item from `state.lenses[folderId].items`, create the tab, bind it in
the same drain, seed the live-tab record, and join the Space's Chrome group
(the `openSavedTab` ordering). An unknown `spaceId`, `folderId`, or an
`itemId` that is neither bound nor listed SHALL throw (error ack) — the
unknown-id convention. Closing a bound tab rides the existing
`closeTab { tabId }` command; no new close plumbing ships.

#### Scenario: Activation carries identity, never a URL

- **WHEN** the sidebar dispatches `bus.send({ kind: 'openLensItem', payload: { spaceId: 'work', folderId: 'sf-1', itemId: '42', windowId: 100 } })`
- **THEN** `SidebarCommandSchema` validation succeeds and the handler resolves the URL from the SW's runtime slice
- **AND** a payload carrying an extra `url` field SHALL fail validation (strict payload)

#### Scenario: Bound items focus, unbound items open

- **GIVEN** item `42` bound to tab 7 in window 100
- **WHEN** `openLensItem` is dispatched for it
- **THEN** tab 7 is focused and no tab is created
- **AND** for an unbound listed item a tab is created, bound, and grouped in one drain

#### Scenario: An unknown item rejects

- **WHEN** `openLensItem` is dispatched with an `itemId` that is neither bound nor present in the folder's runtime items
- **THEN** the handler SHALL throw and the ack SHALL carry `{ error }`

### Requirement: Lens lifecycle commands

The `SidebarCommand` union SHALL include four lens lifecycle kinds with flat payloads (no nested config object); update/delete/refresh address `{ spaceId, folderId }`, matching the existing folder-command convention (`renameFolder`, `deleteFolder`, …):

- `createLens` — `{ spaceId: SpaceId; source: LensProvider; name: string; baseUrl: string; query: 'authored' | 'assigned' | 'review-requested'; refreshMinutes: number }`. The SW mints the node id (`crypto.randomUUID`) and the `icon` (the source connector's `mintedIcon` — `'folder-git-2'` for the git forges, `'folder-kanban'` for Jira), normalizes `baseUrl` (absolute http(s) URL required, trailing slash stripped; invalid SHALL throw), clamps `refreshMinutes` to the floor of 5, inserts the node at the top of the Space's pinned list via `store.addLens(spaceId, node)` (matching `createFolder`'s top insertion), retunes the poll alarm, and triggers an immediate first fetch. Unknown `spaceId` SHALL throw (error ack).
- `updateLens` — `{ spaceId: SpaceId; folderId: FolderId; source: LensProvider; name: string; baseUrl: string; query: 'authored' | 'assigned' | 'review-requested'; refreshMinutes: number }`. Edits the node in place via `store.updateLens(spaceId, folderId, config)`; a `baseUrl`, `query`, or `source` change invalidates `fetchedAt` and triggers an immediate refetch. Unknown `spaceId` or `folderId` SHALL throw.
- `deleteLens` — `{ spaceId: SpaceId; folderId: FolderId }`. Removes the node from its pinned list and drops its `lenses` runtime entry via `store.deleteLens(spaceId, folderId)`, then retunes (or clears) the poll alarm. Unknown `spaceId` or `folderId` SHALL throw. No tabs are closed.
- `refreshLens` — `{ spaceId: SpaceId; folderId: FolderId }`. Refreshes that folder unconditionally. The handler SHALL ack `ok` once the refresh is underway; the fetch **outcome** (ok / signed-out / error) lands via the runtime slice and the state broadcast, never via the ack. Unknown `spaceId` or `folderId` SHALL throw.

All four payloads SHALL be validated by Zod schemas in the `bus.ts` discriminated union, with `query` and `source` as `z.enum`s (`source` over `['gitlab', 'github', 'jira']`) and `refreshMinutes` as a number. The `bus.ts` `PinNode` mirror's lens member SHALL admit all three `source` values, so a tree containing a lens node of any source round-trips `reorderPinned` losslessly. Connector fetch failures SHALL never reject any command ack.

#### Scenario: createLens inserts a SW-minted node at the top and fetches

- **WHEN** the sidebar dispatches `bus.send({ kind: 'createLens', payload: { spaceId: 'work', source: 'github', name: 'My pull requests', baseUrl: 'https://github.com', query: 'review-requested', refreshMinutes: 10 } })`
- **THEN** the handler SHALL insert a `lens` node with a SW-minted id, `source: 'github'`, and the source's minted icon at the top of `pinnedBySpace.work`
- **AND** SHALL trigger an immediate first fetch and ack `ok`

#### Scenario: A jira createLens is accepted and mints the kanban icon

- **WHEN** the sidebar dispatches `bus.send({ kind: 'createLens', payload: { spaceId: 'work', source: 'jira', name: 'My reported issues', baseUrl: 'https://acme.atlassian.net', query: 'authored', refreshMinutes: 10 } })`
- **THEN** `SidebarCommandSchema` validation SHALL pass and the handler SHALL insert a `lens` node with `source: 'jira'` and `icon: 'folder-kanban'` at the top of `pinnedBySpace.work`
- **AND** a tree containing that node SHALL round-trip `reorderPinned` losslessly

#### Scenario: refreshLens acks before the fetch resolves

- **WHEN** the sidebar dispatches `refreshLens` for an existing folder
- **THEN** the ack SHALL be `ok` without awaiting the network fetch
- **AND** a subsequent `state-broadcast` SHALL carry the fetch outcome in the runtime slice

#### Scenario: Lifecycle commands on an unknown folder reject

- **WHEN** `updateLens`, `deleteLens`, or `refreshLens` is dispatched with a `spaceId` absent from `state.spaces`, or a `folderId` that matches no lens node in `pinnedBySpace[spaceId]`
- **THEN** the handler SHALL throw and the ack SHALL carry `{ error }`

#### Scenario: An out-of-vocabulary source is rejected at the bus boundary

- **WHEN** a `createLens` payload carries `source: 'bitbucket'` (a source the registry does not hold)
- **THEN** `SidebarCommandSchema` validation SHALL fail and the command is never enqueued

