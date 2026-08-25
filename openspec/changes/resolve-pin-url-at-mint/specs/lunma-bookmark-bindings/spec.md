## MODIFIED Requirements

### Requirement: Pinning a live tab creates a bound saved tab

Lunma SHALL provide a user action to pin a live Chrome tab to a Space. When invoked, Lunma SHALL mint a new `SavedTab` from the live tab (`title` and `currentURL`/`originalURL` taken from the live tab's title and URL, resolved per the rule below), bind the new record to that tab id **in the tab's window** (`tabBindings[<new-id>][windowId] = tabId`), and append (or insert at a given index) the record id into `pinnedBySpace[spaceId]`. Binding the tab SHALL remove its id from that window instance's `tempTabIds` (the bound-tab-is-not-temp invariant). Pinning a tab that is already bound to any saved tab SHALL be a no-op (idempotent).

#### Scenario: Dragging a temporary tab into the Pinned section pins it

- **WHEN** the user drags the Temporary row for tab id 42 (title "GitHub", url `https://github.com/`) in window 100 into the Pinned section of Space "work"
- **THEN** a new `SavedTab` SHALL exist with `{ spaceId: 'work', title: 'GitHub', originalURL: 'https://github.com/', currentURL: 'https://github.com/' }`
- **AND** `tabBindings[<new-id>][100]` SHALL equal 42
- **AND** 42 SHALL NOT appear in `spaceInstancesByWindow[100].tempTabIds`
- **AND** `<new-id>` SHALL appear in `pinnedBySpace['work']` at the drop index

#### Scenario: Pinning an already-bound tab is a no-op

- **WHEN** the pin action targets a tab id already present in any window slot of `tabBindings`
- **THEN** no new `SavedTab` SHALL be created and `pinnedBySpace` SHALL be unchanged

**Authoritative URL resolution at mint.** `originalURL` is **immutable after
pinning** and is what the tab's domain boundary later seeds from, so it SHALL NOT
be frozen from a value the service worker has not yet populated. The service
worker's live-tab mirror (`liveTabsById`) lags Chrome — a temporary row renders
from the tab's title, which arrives independently of its URL — so a user can pin
a row whose URL the mirror does not yet hold.

Therefore, when the mirror's `url` for the tab is empty, Lunma SHALL query Chrome
for the tab (`chrome.tabs.get(tabId)`) and mint `originalURL`/`currentURL` from
Chrome's value. When the mirror's `title` is empty, the same resolved tab SHALL
supply the title, so the record is not assembled from two different points in
time. When the mirror already carries a non-empty `url`, Lunma SHALL use it and
SHALL NOT query Chrome.

If the Chrome query fails, or Chrome itself reports no URL (a tab that has
genuinely not committed a navigation), Lunma SHALL still create the record rather
than discard the user's action — the pin is what the user asked for, and a
URL-less tab has nothing to capture.

#### Scenario: An empty mirror URL is resolved from Chrome at pin time

- **GIVEN** the live-tab mirror holds tab 42 with `url: ''` while Chrome reports `https://example.com/a`
- **WHEN** the user pins tab 42
- **THEN** the minted `SavedTab` SHALL carry `originalURL` and `currentURL` of `https://example.com/a`

#### Scenario: A populated mirror URL is used without querying Chrome

- **GIVEN** the live-tab mirror holds tab 42 with `url: 'https://example.com/a'`
- **WHEN** the user pins tab 42
- **THEN** the minted record SHALL carry that URL
- **AND** `chrome.tabs.get` SHALL NOT be called

#### Scenario: A tab with no URL anywhere still pins

- **GIVEN** the live-tab mirror holds tab 42 with `url: ''` and the Chrome query fails or returns no URL
- **WHEN** the user pins tab 42
- **THEN** the record SHALL still be created and placed, carrying an empty `originalURL`
