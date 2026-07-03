## MODIFIED Requirements

### Requirement: duplicateTab-created tabs are excluded from onCreated-time dedup

Lunma SHALL exclude tabs created via `chrome.tabs.duplicate` from the
onCreated-time dedup check above, since that check is unscoped by gesture and
would otherwise catch `chrome.tabs.duplicate`'s own output (a duplicated
tab's URL is, by definition, identical to its still-open source tab's URL —
an exact `findTabInActiveSpace` match every time). The `duplicateTab` handler
(`apps/extension/src/background/handlers/temp-tabs.ts`) SHALL record the
source tab's `(windowId, url, tabId)` in a pending-duplicate correlation set
**before** calling `chrome.tabs.duplicate(tabId)`, so the record exists
regardless of the relative ordering between `tabs.onCreated` firing and the
`chrome.tabs.duplicate` promise resolving.

The onCreated-time handler SHALL consult this record BEFORE the dedup gate,
whenever the newly created tab carries a resolved URL — unconditionally,
not gated on the `dedupNewTabNavigations` setting (the record informs both
dedup exclusion and placement, and placement must not depend on that
setting): if the tab's `(windowId, resolvedUrl)` matches a pending record,
the record SHALL be consumed (removed) and its source tab id returned. When
a record is consumed, the onCreated-time dedup check SHALL be skipped for
that tab entirely, falling through to adoption — identical to
`duplicateTab`'s pre-existing behaviour except for WHERE the clone is
adopted (see "duplicateTab command handler duplicates the tab via Chrome
API" below).

This exclusion SHALL extend for the clone's entire initial-load window, not
only the single `tabs.onCreated` check: immediately after the clone is
placed (see "duplicateTab command handler duplicates the tab via Chrome
API"), its redirect-chain-tab-dedup eligibility (the "A blank new tab
navigating to an already-open URL is deduplicated" requirement's
`initial-load` tracking) SHALL be cleared, so no LATER `tabs.onUpdated`
event for the clone can be evaluated by that check either. Without this, a
clone — tracked immediately at creation and therefore "tracked but not yet
`complete`," exactly the condition that requirement's widened eligibility
targets — would self-exclude only from matching ITSELF (via that
requirement's `excludeTabId` guard) but could still match its own
still-open SOURCE on a later URL-carrying `tabs.onUpdated` event (e.g. a
coalesced "confirmation" update while the duplicate finishes restoring,
before ever reaching `status: 'complete'`), silently dedup-collapsing the
clone and undoing "Duplicate" entirely.

Pending records SHALL be scoped to the current service-worker session
(in-memory, not persisted) and SHALL expire after a bounded TTL so a
`chrome.tabs.duplicate` call that fails before creating a tab cannot leave a
stale record that suppresses dedup for a later, unrelated tab at the same
URL.

#### Scenario: Duplicating a tab is never deduped by the onCreated-time check

- **GIVEN** a temp tab 42 is open at `https://example.com/` in the active Space
- **WHEN** `duplicateTab { tabId: 42 }` is dispatched and Chrome fires
  `tabs.onCreated` for the resulting clone with `url: 'https://example.com/'`
  in the same window
- **THEN** the onCreated-time dedup check SHALL NOT focus tab 42 or close the
  clone
- **AND** the clone SHALL be tracked/grouped, exactly as `duplicateTab` behaves today

#### Scenario: The pending-duplicate record is consumed, not reused

- **GIVEN** `duplicateTab { tabId: 42 }` has already produced its clone (the
  pending record was consumed)
- **WHEN** a second, unrelated tab is later created directly at the same URL
  `https://example.com/` in the same window
- **THEN** that second tab SHALL be evaluated by the ordinary onCreated-time
  dedup check (no leftover record suppresses it)

#### Scenario: The record is consumed regardless of the dedupNewTabNavigations setting

- **GIVEN** `dedupNewTabNavigations` is `false`
- **WHEN** `duplicateTab { tabId: 42 }` is dispatched and its clone's `tabs.onCreated` fires
- **THEN** the pending-duplicate record SHALL still be consumed (returning source tab id 42)
- **AND** the clone SHALL still be placed adjacent to its source (see "duplicateTab command handler duplicates the tab via Chrome API" below) — placement does not depend on this setting

#### Scenario: The clone is never dedup-collapsed by a later onUpdated event

- **GIVEN** `duplicateTab { tabId: 42 }` has produced its clone, already placed adjacent to tab 42
- **WHEN** a later `tabs.onUpdated` event fires for the clone carrying `changeInfo.url` equal to its (unchanged) URL, before the clone ever reaches `status: 'complete'`
- **THEN** the redirect-chain-tab-dedup check SHALL NOT run for the clone (its initial-load eligibility was cleared at placement)
- **AND** the clone SHALL NOT be focused/closed against tab 42, and tab 42 SHALL NOT be promoted

### Requirement: duplicateTab command handler duplicates the tab via Chrome API

The `duplicateTab` coordinator handler SHALL record the source tab's
`(windowId, url, tabId)` in the pending-duplicate correlation set (see the
"duplicateTab-created tabs are excluded from onCreated-time dedup"
requirement) **before** calling `chrome.tabs.duplicate(tabId)`. The handler
SHALL then call `chrome.tabs.duplicate(tabId)`. The handler itself SHALL NOT
mutate `tempTabIds`, `liveTabsById`, or any other store state.

The resulting cloned tab's `tabs.onCreated` event SHALL consume the pending
record (unaffected by the onCreated-time dedup check, which is skipped for
this tab) and insert the clone immediately after its source tab in the
active Space's `tempTabIds` (`LunmaStore.insertTempTabAfter`) — NOT at the
ordinary newest-first top-of-list every other new tab gets. Immediately
after placement, the clone's initial-load eligibility for the
redirect-chain-tab-dedup check SHALL be cleared (see "duplicateTab-created
tabs are excluded from onCreated-time dedup"), so it is permanently exempt
from that check for the rest of its lifetime, not only at this one
`tabs.onCreated` event. If the source tab is no longer present in the
instance's `tempTabIds` by the time the clone's `tabs.onCreated` fires (e.g.
closed in the window between the duplicate being issued and the clone
landing), the clone SHALL fall back to the ordinary top-of-list placement
instead of being lost.

If `chrome.tabs.duplicate` rejects (tab no longer exists), the handler SHALL
throw so the sidebar's `bus.send` promise rejects with an error, and no
pending record is left to leak (bounded by the TTL in any case).

#### Scenario: Duplicating a temp tab creates a clone in the active Space, adjacent to its source

- **GIVEN** the active Space has `tempTabIds: [1, 42, 2]`
- **WHEN** `duplicateTab { tabId: 42 }` is dispatched
- **THEN** the source tab's `(windowId, url, tabId: 42)` SHALL be recorded before `chrome.tabs.duplicate(42)` is called
- **AND** `chrome.tabs.duplicate(42)` SHALL be called
- **AND** once the clone's `tabs.onCreated` fires, `tempTabIds` SHALL become `[1, 42, <clone>, 2]`
- **AND** the handler itself SHALL NOT directly mutate `tempTabIds` or `liveTabsById`

#### Scenario: Falls back to top-of-list when the source has been closed by the time the clone lands

- **GIVEN** `duplicateTab { tabId: 42 }` is dispatched and its pending record is recorded
- **AND** tab 42 is closed before the clone's `tabs.onCreated` fires
- **WHEN** the clone's `tabs.onCreated` fires
- **THEN** the clone SHALL be adopted at the top of the active Space's `tempTabIds` (the ordinary `onTabCreated` placement), not lost

#### Scenario: Duplicating a non-existent tab rejects

- **WHEN** `duplicateTab { tabId: 999 }` is dispatched and tab 999 does not exist
- **THEN** `chrome.tabs.duplicate` rejects
- **AND** the handler SHALL throw, causing `bus.send` to reject
