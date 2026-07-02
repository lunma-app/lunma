## MODIFIED Requirements

### Requirement: A blank new tab navigating to an already-open URL is deduplicated

Lunma SHALL deduplicate a tab's navigation to an already-open URL while that tab is still within its **initial load chain** — either because it is still fully untracked (the original "untracked home tab → adopt into Temporary" path in `handlers/chrome-tabs.ts`: a blank new tab committing its first real `http(s)` URL) OR because it has not yet reached `status: 'complete'` even once since it was created (redirect-chain tab dedup: a tab born at, or later redirected through, an intermediate URL — e.g. a corporate mail/security link-rewriter, an SSO hop, any redirector — that only reaches its real destination after `tabs.onCreated` already tracked it). A BOUND (pinned) tab is excluded from this requirement entirely, regardless of load state. When the `dedupNewTabNavigations` setting is enabled and a navigation is eligible per the above, the handler SHALL query the current window's active Space for a DIFFERENT tab already at that exact URL (via `findTabInActiveSpace`, the same query the `openUrl` handler uses: temp + pinned tabs, exact match, current window + active Space only, excluding the navigating tab's own id via `excludeTabId` so it can never self-match its own just-synced URL).

If a matching tab is found, the handler
SHALL focus it (`chrome.tabs.update(found, { active: true })` +
`chrome.windows.update(windowId, { focused: true })`), close the navigated tab
(`chrome.tabs.remove`), and SHALL NOT adopt the navigated tab into the Temporary list.
The focus/close sequence SHALL be wrapped in try/catch; on any failure it SHALL fall
through to normal adoption so a tab is never lost.

When the `dedupMovesTabToTop` setting is enabled and the focused tab is a temp
tab, the handler SHALL ALSO move it to the top of its instance's `tempTabIds`
(`LunmaStore.promoteTempTab`), calling `ctx.markDirty()` itself for that
mutation. No effect for a matched pinned tab or when the setting is disabled.

If no matching tab is found, the navigated tab SHALL be adopted normally (unchanged
behaviour).

The scope is deliberately narrow and exact, matching the `openUrl` dedup: current
window, active Space, exact URL (no normalisation). It does NOT apply cross-window or
cross-Space.

A tab's eligibility for this requirement SHALL be tracked by a SW-session-scoped
(not persisted) set: a tab is added on `tabs.onCreated` (any non-home, non-lens
tab) and removed on its first `status: 'complete'` or on `tabs.onRemoved`. Once
a tab has completed its first load, a LATER navigation is ordinary browsing and
is never eligible again, even if it still carries a pinned/temp classification.

Tabs created directly with a target URL are ALSO covered by the separate "A
tab created directly with a target URL is deduplicated" requirement above,
which runs at `tabs.onCreated` (before this one) and is unscoped by gesture
(no `openerTabId` distinction) — that requirement catches a match at the
tab's BIRTH URL; this one catches a match at any LATER URL reached before
the tab's first `complete`, closing the gap a redirect/rewrite chain leaves
between the two.

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

#### Scenario: A tab redirected through an intermediate URL is deduped before it ever completes

- **GIVEN** the active Space has a temp tab at `https://example.com/`
- **AND** a NEW tab is created directly at an intermediate/rewriter URL (not
  matching anything — the onCreated-time dedup check finds no match, so the
  tab is tracked normally)
- **WHEN** that tab redirects (a `tabs.onUpdated` URL change) to
  `https://example.com/` before ever reaching `status: 'complete'`
- **THEN** Lunma SHALL focus the existing tab and close the redirected tab
- **AND** SHALL NOT leave a second `https://example.com/` row in the Temporary list

#### Scenario: Once a tab completes its first load, a later re-navigation is not deduped

- **GIVEN** a tab was tracked at creation and has since reached `status: 'complete'` at least once
- **WHEN** the user (or the page) later navigates it to a URL already open in another tab of the active Space
- **THEN** Lunma SHALL NOT close or dedup it — only navigations within the tab's initial load chain, before its first completion, are eligible

#### Scenario: The navigating tab never self-matches its own URL

- **GIVEN** a tab is already tracked (in `tempTabIds`) and still mid-initial-load
- **WHEN** it navigates to a new URL and `tabs.onUpdated` mirrors that URL into `liveTabsById` for this same tab before the dedup lookup runs
- **THEN** the dedup lookup SHALL exclude this tab's own id from its search (`findTabInActiveSpace`'s `excludeTabId`)
- **AND** SHALL NOT focus/close the tab against itself, even though its own live URL now matches the URL being searched for

#### Scenario: A bound (pinned) tab is never eligible via this requirement

- **GIVEN** a tab is bound to a saved tab from the moment it was created
- **WHEN** it navigates to a URL already open elsewhere in the active Space, regardless of whether it has completed a load yet
- **THEN** Lunma SHALL NOT dedup it via this requirement — a bound tab's navigation is never "adopt as temporary," load state notwithstanding

#### Scenario: Re-navigating an already-listed tab is not deduped

- **GIVEN** an existing Temporary (tracked) tab that has already reached `status: 'complete'` at least once
- **WHEN** the user navigates it via the address bar to a URL already open in another tab of the active Space
- **THEN** Lunma SHALL NOT close or dedup it (only navigations within a tab's initial load chain, before its first completion, are eligible)

#### Scenario: A URL open only in a different Space or window is not deduped

- **GIVEN** `https://example.com/` is open only in a different Space (or a different window)
- **WHEN** a blank new tab in the current window's active Space navigates to `https://example.com/`
- **THEN** Lunma SHALL adopt the new tab normally (dedup does not cross Spaces or windows)

#### Scenario: Focus/close failure falls through to adoption

- **WHEN** dedup finds a match but the focus or close call rejects (e.g. the existing tab just closed)
- **THEN** the handler SHALL fall through and adopt the navigated tab normally, so no tab is lost

#### Scenario: dedupMovesTabToTop promotes the focused temp tab

- **GIVEN** the active Space has `tempTabIds: [1, 42, 2]` and `dedupMovesTabToTop` is enabled
- **WHEN** a blank new tab's first navigation matches temp tab 42 and focuses it
- **THEN** `tempTabIds` SHALL become `[42, 1, 2]`

#### Scenario: dedupMovesTabToTop disabled — position unchanged

- **GIVEN** `dedupMovesTabToTop` is disabled
- **WHEN** a blank new tab's first navigation matches and focuses an existing temp tab
- **THEN** its position in `tempTabIds` SHALL remain unchanged
