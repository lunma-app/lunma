## ADDED Requirements

### Requirement: A tab created directly with a target URL is deduplicated

Lunma SHALL deduplicate a tab created by `chrome.tabs.onCreated` that already
carries a target URL at creation time (`tab.url || tab.pendingUrl` non-empty),
when the tab is not a home tab and not a lens page, when the tab is not a
pending `duplicateTab` clone (see the "duplicateTab-created tabs are excluded
from onCreated-time dedup" requirement below), and when the
`dedupNewTabNavigations` setting is enabled. This check SHALL run before the
existing `onCreated` adoption logic (`ctx.store.onTabCreated`,
`ctx.groups.groupNewTab`) so a matched tab is never tracked or grouped.

This check is deliberately **unscoped by gesture or by `openerTabId`** —
Chrome exposes no reliable signal to distinguish a tab created by an
external OS-level "open in Chrome" handoff from a tab created by an in-page
gesture (`target="_blank"`, middle-click, `window.open`, "open link in new
window") once the tab lands in an already-open window; both are deduplicated
identically. (`design.md` Decision 1 records the empirical investigation
that ruled out `openerTabId` as a scoping signal.)

The lookup SHALL use the existing `findTabInActiveSpace(state, windowId,
url)` (current window, active Space only, temp tabs then bound saved tabs,
exact URL match, no normalisation) — the same query used by `openUrl` and
navigation dedup.

If a matching tab is found, the handler SHALL focus it
(`chrome.tabs.update(found, { active: true })` +
`chrome.windows.update(windowId, { focused: true })`), close the newly
created tab (`chrome.tabs.remove`), and SHALL NOT run the existing
`onCreated` adoption logic for it. The focus/close sequence SHALL be wrapped
in try/catch; on any failure it SHALL fall through to the existing
`onCreated` adoption logic unchanged, so a tab is never lost.

If no matching tab is found, if the tab is a pending `duplicateTab` clone, if
the tab is a home or lens page, or if `dedupNewTabNavigations` is disabled,
the tab SHALL be created/tracked/grouped via the existing `onCreated` logic,
unchanged.

#### Scenario: A directly-created URL already open in the active Space is deduplicated

- **GIVEN** the active Space has a temp tab at `https://example.com/`
- **AND** `dedupNewTabNavigations` is enabled
- **WHEN** a tab is created directly with `url: 'https://example.com/'`
  (simulating any direct-URL creation — an external OS-level "open in
  Chrome" handoff, middle-click, `target="_blank"`, `window.open`, or "open
  in new window")
- **THEN** Lunma SHALL focus the existing tab and close the newly created tab
- **AND** SHALL NOT call `ctx.store.onTabCreated` or `ctx.groups.groupNewTab`
  for the newly created tab

#### Scenario: URL already open as a pinned tab in the active Space

- **GIVEN** a saved tab in the active Space is bound at `https://example.com/`
- **AND** `dedupNewTabNavigations` is enabled
- **WHEN** a tab is created with `url: 'https://example.com/'`
- **THEN** Lunma SHALL focus the bound pinned tab and close the newly created
  tab

#### Scenario: URL not already open — the tab is created normally

- **GIVEN** the active Space has no tab at `https://new.example/`
- **WHEN** a tab is created with `url: 'https://new.example/'`
- **THEN** the tab SHALL be tracked/grouped via the existing `onCreated`
  logic (no dedup)

#### Scenario: Home and lens pages are excluded from this check

- **WHEN** a tab is created whose URL is the Lunma home (new-tab) URL or a
  lens-page URL
- **THEN** this onCreated-time dedup check SHALL NOT run

#### Scenario: dedupNewTabNavigations disabled — tab is created normally

- **GIVEN** `dedupNewTabNavigations` is `false`
- **AND** `https://example.com/` is open in the active Space
- **WHEN** a tab is created with `url: 'https://example.com/'`
- **THEN** Lunma SHALL create/track the new tab normally, without focusing or
  closing anything

#### Scenario: A URL open only in a different Space or window is not deduped

- **GIVEN** `https://example.com/` is open only in a different Space (or a
  different window)
- **WHEN** a tab is created in the current window with `url:
  'https://example.com/'`
- **THEN** Lunma SHALL create/track the new tab normally (dedup does not
  cross Spaces or windows)

#### Scenario: Focus/close failure falls through to normal creation

- **WHEN** this check finds a match but the focus or close call rejects
  (e.g. the existing tab just closed)
- **THEN** the handler SHALL fall through and track/group the newly created
  tab via the existing `onCreated` logic, so no tab is lost

#### Scenario: onCreated-time dedup flashes the focused row

- **WHEN** this check focuses tab 42 and closes the newly created tab
- **THEN** `chrome.runtime.sendMessage({ type: 'lunma/tab-dedup-flash',
  tabId: 42 })` SHALL be emitted as a side effect, identical to the other
  `tab-dedup` paths

### Requirement: duplicateTab-created tabs are excluded from onCreated-time dedup

Lunma SHALL exclude tabs created via `chrome.tabs.duplicate` from the
onCreated-time dedup check above, since that check is unscoped by gesture and
would otherwise catch `chrome.tabs.duplicate`'s own output (a duplicated
tab's URL is, by definition, identical to its still-open source tab's URL —
an exact `findTabInActiveSpace` match every time). The `duplicateTab` handler
(`apps/extension/src/background/handlers/temp-tabs.ts`) SHALL record the
source tab's `(windowId, url)` in a pending-duplicate correlation set
**before** calling `chrome.tabs.duplicate(tabId)`, so the record exists
regardless of the relative ordering between `tabs.onCreated` firing and the
`chrome.tabs.duplicate` promise resolving.

The onCreated-time dedup check SHALL consult this record before running its
`findTabInActiveSpace` lookup: if the newly created tab's `(windowId,
resolvedUrl)` matches a pending record, the record SHALL be consumed
(removed) and the dedup check SHALL be skipped for that tab, falling through
to the existing `onCreated` adoption logic unchanged — identical to
`duplicateTab`'s pre-existing behaviour.

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
- **AND** the clone SHALL be tracked/grouped via the existing `onCreated`
  logic, exactly as `duplicateTab` behaves today

#### Scenario: The pending-duplicate record is consumed, not reused

- **GIVEN** `duplicateTab { tabId: 42 }` has already produced its clone (the
  pending record was consumed)
- **WHEN** a second, unrelated tab is later created directly at the same URL
  `https://example.com/` in the same window
- **THEN** that second tab SHALL be evaluated by the ordinary onCreated-time
  dedup check (no leftover record suppresses it)

## MODIFIED Requirements

### Requirement: A blank new tab navigating to an already-open URL is deduplicated

Lunma SHALL deduplicate a blank new tab's first real navigation. When a tab that began as the blank new-tab page (the Lunma home) commits its **first** real `http(s)` URL — the existing "untracked home tab → adopt into Temporary" path in `handlers/chrome-tabs.ts` — and the `dedupNewTabNavigations` setting is enabled, the handler SHALL query the current window's active Space for a different tab already at that exact URL (via `findTabInActiveSpace`, the same query the `openUrl` handler uses: temp + pinned tabs, exact match, current window + active Space only).

If a matching tab is found (and it is **not** the navigating tab itself), the handler
SHALL focus it (`chrome.tabs.update(found, { active: true })` +
`chrome.windows.update(windowId, { focused: true })`), close the navigated tab
(`chrome.tabs.remove`), and SHALL NOT adopt the navigated tab into the Temporary list.
The focus/close sequence SHALL be wrapped in try/catch; on any failure it SHALL fall
through to normal adoption so a tab is never lost.

If no matching tab is found, the navigated tab SHALL be adopted normally (unchanged
behaviour).

The scope is deliberately narrow and exact, matching the `openUrl` dedup: current
window, active Space, exact URL (no normalisation). It does NOT apply cross-window or
cross-Space.

This requirement covers only tabs that reach `tabs.onUpdated` untracked — i.e.
tabs that began blank (the Lunma home page) and later navigated. Tabs created
directly with a target URL are covered by the separate "A tab created directly
with a target URL is deduplicated" requirement above, which runs at
`tabs.onCreated` and is unscoped by gesture (no `openerTabId` distinction).

#### Scenario: Blank new tab navigates to a URL already open in the active Space

- **GIVEN** the active Space has a temp tab at `https://example.com/`
- **AND** the user opens a blank new tab and navigates it (address bar) to `https://example.com/`
- **WHEN** the new tab commits that URL
- **THEN** Lunma SHALL focus the existing tab and close the new tab
- **AND** SHALL NOT add a second `https://example.com/` row to the Temporary list

#### Scenario: URL already open as a pinned tab in the active Space

- **GIVEN** a saved tab in the active Space is bound at `https://example.com/`
- **WHEN** a blank new tab navigates to `https://example.com/`
- **THEN** Lunma SHALL focus the bound pinned tab and close the new tab

#### Scenario: URL not already open — the tab is adopted normally

- **GIVEN** the active Space has no tab at `https://new.example/`
- **WHEN** a blank new tab navigates to `https://new.example/`
- **THEN** the tab SHALL be adopted into the Temporary list as before (no dedup)

#### Scenario: Explicit new-tab-to-URL gestures are no longer excluded (accepted behavior change)

- **WHEN** a tab is opened directly to a URL (middle-click, `target="_blank"`,
  `window.open`, or "open link in new window") that is already open in the
  active Space
- **THEN** Lunma SHALL NOT dedup it via **this** requirement — it is
  adopted/tracked at creation and never reaches this first-navigation path
- **AND** it IS deduped by the "A tab created directly with a target URL is
  deduplicated" requirement above instead, which runs at `tabs.onCreated` and
  applies uniformly regardless of gesture — this is a deliberate, disclosed
  behavior change from the previous blanket exclusion (see `design.md`
  Decision 1 and Risks), not a bug. The one exception is a tab created via
  `chrome.tabs.duplicate` (the "Duplicate" tab action), which remains
  excluded per the "duplicateTab-created tabs are excluded from
  onCreated-time dedup" requirement above.

#### Scenario: Re-navigating an already-listed tab is not deduped

- **GIVEN** an existing Temporary (tracked) tab
- **WHEN** the user navigates it via the address bar to a URL already open in another tab of the active Space
- **THEN** Lunma SHALL NOT close or dedup it (only untracked first-navigations are eligible)

#### Scenario: A URL open only in a different Space or window is not deduped

- **GIVEN** `https://example.com/` is open only in a different Space (or a different window)
- **WHEN** a blank new tab in the current window's active Space navigates to `https://example.com/`
- **THEN** Lunma SHALL adopt the new tab normally (dedup does not cross Spaces or windows)

#### Scenario: Focus/close failure falls through to adoption

- **WHEN** dedup finds a match but the focus or close call rejects (e.g. the existing tab just closed)
- **THEN** the handler SHALL fall through and adopt the navigated tab normally, so no tab is lost

### Requirement: duplicateTab command handler duplicates the tab via Chrome API

The `duplicateTab` coordinator handler SHALL record the source tab's
`(windowId, url)` in the pending-duplicate correlation set (see the
"duplicateTab-created tabs are excluded from onCreated-time dedup"
requirement) **before** calling `chrome.tabs.duplicate(tabId)`. The handler
SHALL then call `chrome.tabs.duplicate(tabId)`. The resulting cloned tab is
adopted into the active Space's temp tab list via the existing
`tabs.onCreated` path (now skipping the onCreated-time dedup check via the
pending-duplicate record) — the handler itself SHALL NOT mutate
`tempTabIds`, `liveTabsById`, or any other store state. If
`chrome.tabs.duplicate` rejects (tab no longer exists), the handler SHALL
throw so the sidebar's `bus.send` promise rejects with an error, and no
pending record is left to leak (bounded by the TTL in any case).

#### Scenario: Duplicating a temp tab creates a clone in the active Space

- **WHEN** `duplicateTab { tabId: 42 }` is dispatched
- **THEN** the source tab's `(windowId, url)` SHALL be recorded before
  `chrome.tabs.duplicate(42)` is called
- **AND** `chrome.tabs.duplicate(42)` SHALL be called
- **AND** the resulting tab SHALL be adopted into the active Space via `tabs.onCreated`, unaffected by the new onCreated-time dedup check
- **AND** the handler SHALL NOT directly mutate `tempTabIds` or `liveTabsById`

#### Scenario: Duplicating a non-existent tab rejects

- **WHEN** `duplicateTab { tabId: 999 }` is dispatched and tab 999 does not exist
- **THEN** `chrome.tabs.duplicate` rejects
- **AND** the handler SHALL throw, causing `bus.send` to reject
