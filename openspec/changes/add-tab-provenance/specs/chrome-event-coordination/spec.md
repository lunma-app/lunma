## ADDED Requirements

### Requirement: chrome.webNavigation is a coordinated event source

`chrome.webNavigation.onCommitted` SHALL be treated as an event source on equal
terms with `chrome.tabs.*`: its listener SHALL be a thin shim that performs no
work, wrapping the payload into a `PendingEvent` of kind
`webNavigation.onCommitted` and calling `enqueueAfterBoot`, so it drains through
the coordinator's serialized queue after `bootReady` like every other event.

The shim SHALL filter to `frameId === 0` before enqueueing, so subframe
navigations never enter the queue.

#### Scenario: The handler does no work in the listener

- **WHEN** `chrome.webNavigation.onCommitted` fires
- **THEN** the listener SHALL only enqueue via `enqueueAfterBoot`
- **AND** SHALL NOT touch the store directly

#### Scenario: Subframe navigations never reach the queue

- **WHEN** `onCommitted` fires with `frameId` greater than `0`
- **THEN** no event SHALL be enqueued

### Requirement: The webNavigation listener is registered synchronously, conditional on the permission

The listener SHALL be registered synchronously in the service worker's first
top-level turn when the `webNavigation` permission is held, per the existing
MV3 wake-up delivery requirement — a listener registered later cannot receive the
event that woke the worker.

Because the permission may be absent, registration SHALL be guarded by a
synchronous check of listener availability (`chrome.webNavigation?.onCommitted`),
matching the existing optional-chained treatment of `chrome.tabGroups?.onRemoved`
and `chrome.commands?.onCommand`. Granting the permission mid-session SHALL take
effect via `onPermissionsChange` without requiring a browser restart.

#### Scenario: The worker starts without the permission

- **WHEN** the service worker starts and `webNavigation` is not granted
- **THEN** no listener SHALL be registered
- **AND** boot SHALL NOT fail

#### Scenario: Granting mid-session begins collection

- **WHEN** a user grants `webNavigation` while the worker is running
- **THEN** collection SHALL begin without a browser restart

### Requirement: onCommitted coalesces by tabId

The `EventPolicy` table SHALL declare a `coalesceKey` of `tabId` for
`webNavigation.onCommitted`, matching the existing treatment of
`tabs.onUpdated`. `onCommitted` fires for every main-frame navigation in every
tab, and the queue is capped at `QUEUE_CAP = 1000`.

#### Scenario: Rapid navigation in one tab does not flood the queue

- **WHEN** a tab commits several main-frame navigations in quick succession
- **THEN** the queued events SHALL coalesce by `tabId`

### Requirement: Provenance tolerates undefined cross-API event ordering

Ordering between `chrome.tabs.onCreated` and `chrome.webNavigation.onCommitted`
for the same `tabId` is not specified by Chrome. The provenance handler SHALL NOT
depend on `onCreated` having run first.

A missing `liveTabsById[tabId]` at commit time SHALL be treated as "this tab's
first commit", which is the correct resolution branch regardless of which event
arrived first.

#### Scenario: A commit arriving before creation resolves correctly

- **WHEN** `webNavigation.onCommitted` drains for a `tabId` absent from
  `liveTabsById`
- **THEN** the handler SHALL take the first-commit branch
- **AND** SHALL NOT error or drop the event
