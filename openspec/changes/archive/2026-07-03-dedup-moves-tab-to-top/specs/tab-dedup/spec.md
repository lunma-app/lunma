## MODIFIED Requirements

### Requirement: openUrl focuses an existing tab when the URL is already open in the active Space

When the `openUrl` handler runs without `force: true`, it SHALL query the current
window's active Space for a tab whose URL exactly matches the requested URL before
creating a new tab. The lookup covers both temporary tabs and pinned (saved) tabs
bound in that window whose `savedTabs` record has `spaceId` equal to the active
Space. The URL comparison is exact — no normalisation, no fragment stripping.

If a matching tab is found, the handler SHALL call `chrome.tabs.update(tabId, {
active: true })` and `chrome.windows.update(windowId, { focused: true })` to focus
it (wrapped in a try/catch; if the tab no longer exists it falls through to the
create path). It SHALL NOT call `chrome.tabs.create`. The dedup lookup SHALL be
implemented as a pure function `findTabInActiveSpace(state, windowId, url): TabId |
null` in `apps/extension/src/background/handlers/queries.ts`.

When the `dedupMovesTabToTop` setting is enabled and the focused tab is a temp
tab (present in the active Space's `tempTabIds`), the handler SHALL ALSO move
it to the top of that instance's `tempTabIds` (`LunmaStore.promoteTempTab`),
matching where a brand-new tab would land. This has no effect when the
focused tab is a bound/pinned saved tab (no `tempTabIds` position to move) or
when the setting is disabled.

If no matching tab is found, or if `force: true` is set, the handler SHALL fall
through to `chrome.tabs.create({ url, windowId })` unchanged.

Dedup applies only within the current window's active Space. It does NOT apply
cross-window or cross-Space.

#### Scenario: URL already open in active Space — tab is focused, not created

- **GIVEN** the current window's active Space has a temp tab at `https://example.com/`
- **WHEN** `openUrl { url: 'https://example.com/', windowId }` is dispatched without `force`
- **THEN** the handler SHALL call `chrome.tabs.update` to focus the existing tab
- **AND** SHALL NOT call `chrome.tabs.create`

#### Scenario: URL open as a pinned tab in the active Space — focused, not created

- **GIVEN** a saved tab in the active Space is bound in the current window at `https://example.com/`
- **WHEN** `openUrl { url: 'https://example.com/', windowId }` is dispatched without `force`
- **THEN** the handler SHALL focus the bound saved tab's live tab
- **AND** SHALL NOT call `chrome.tabs.create`

#### Scenario: URL is open in a different Space — new tab is created

- **GIVEN** the current window has a tab at `https://example.com/` in Space B
- **AND** the active Space is Space A with no tab at that URL
- **WHEN** `openUrl { url: 'https://example.com/', windowId }` is dispatched
- **THEN** the handler SHALL call `chrome.tabs.create` (dedup does not cross Spaces)

#### Scenario: URL is open in a different window — new tab is created

- **GIVEN** another window has a tab at `https://example.com/`
- **AND** the current window has no tab at that URL in its active Space
- **WHEN** `openUrl { url: 'https://example.com/', windowId }` is dispatched
- **THEN** the handler SHALL call `chrome.tabs.create` (dedup does not cross windows)

#### Scenario: force:true bypasses dedup — new tab always created

- **GIVEN** the current window's active Space has a tab at `https://example.com/`
- **WHEN** `openUrl { url: 'https://example.com/', windowId, force: true }` is dispatched
- **THEN** the handler SHALL call `chrome.tabs.create` even though the URL is already open

#### Scenario: Focused tab no longer exists — falls through to create

- **GIVEN** dedup finds tabId 42 at `https://example.com/` but the tab closes before `chrome.tabs.update` runs
- **WHEN** `chrome.tabs.update(42, { active: true })` rejects
- **THEN** the handler SHALL fall through and call `chrome.tabs.create({ url, windowId })`

#### Scenario: dedupMovesTabToTop promotes the focused temp tab

- **GIVEN** the active Space has `tempTabIds: [1, 42, 2]` and `dedupMovesTabToTop` is enabled
- **WHEN** `openUrl { url }` matches temp tab 42 and focuses it
- **THEN** `tempTabIds` SHALL become `[42, 1, 2]`

#### Scenario: dedupMovesTabToTop disabled — position unchanged

- **GIVEN** the active Space has `tempTabIds: [1, 42, 2]` and `dedupMovesTabToTop` is disabled
- **WHEN** `openUrl { url }` matches temp tab 42 and focuses it
- **THEN** `tempTabIds` SHALL remain `[1, 42, 2]`

#### Scenario: A focused pinned tab is never promoted

- **WHEN** `openUrl { url }` matches a bound/pinned saved tab and focuses it, regardless of `dedupMovesTabToTop`
- **THEN** no instance's `tempTabIds` SHALL change (a pinned tab has no Temporary-list position)

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

When the `dedupMovesTabToTop` setting is enabled and the focused tab is a
temp tab, the handler SHALL ALSO move it to the top of its instance's
`tempTabIds` (`LunmaStore.promoteTempTab`), mutating state directly and
therefore calling `ctx.markDirty()` itself (the surrounding focus/close does
not, since `tabs.onActivated`/`onRemoved` reconcile that part of state on
their own). No effect for a matched pinned tab or when the setting is
disabled.

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

#### Scenario: A blank tab is excluded from this check

- **GIVEN** a tab already exists at `about:blank` in the active Space
- **WHEN** a second tab is created with `url: 'about:blank'` (or no `url`,
  which Chrome reports as `about:blank`)
- **THEN** this onCreated-time dedup check SHALL NOT run — `about:blank` is
  Chrome's placeholder for "not yet navigated," not a real destination —
  and the new tab SHALL be tracked/grouped normally, never focused/closed
  against the existing blank tab

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

#### Scenario: dedupMovesTabToTop promotes the focused temp tab

- **GIVEN** the active Space has `tempTabIds: [1, 42, 2]` and `dedupMovesTabToTop` is enabled
- **WHEN** this check matches temp tab 42, focuses it, and closes the newly created tab
- **THEN** `tempTabIds` SHALL become `[42, 1, 2]`

#### Scenario: dedupMovesTabToTop disabled — position unchanged

- **GIVEN** `dedupMovesTabToTop` is disabled
- **WHEN** this check matches and focuses an existing temp tab
- **THEN** its position in `tempTabIds` SHALL remain unchanged

#### Scenario: A focused pinned tab is never promoted

- **WHEN** this check matches and focuses a bound/pinned saved tab, regardless of `dedupMovesTabToTop`
- **THEN** no instance's `tempTabIds` SHALL change

### Requirement: A blank new tab navigating to an already-open URL is deduplicated

Lunma SHALL deduplicate a blank new tab's first real navigation. When a tab that began as the blank new-tab page (the Lunma home) commits its **first** real `http(s)` URL — the existing "untracked home tab → adopt into Temporary" path in `handlers/chrome-tabs.ts` — and the `dedupNewTabNavigations` setting is enabled, the handler SHALL query the current window's active Space for a different tab already at that exact URL (via `findTabInActiveSpace`, the same query the `openUrl` handler uses: temp + pinned tabs, exact match, current window + active Space only).

If a matching tab is found (and it is **not** the navigating tab itself), the handler
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

#### Scenario: dedupMovesTabToTop promotes the focused temp tab

- **GIVEN** the active Space has `tempTabIds: [1, 42, 2]` and `dedupMovesTabToTop` is enabled
- **WHEN** a blank new tab's first navigation matches temp tab 42 and focuses it
- **THEN** `tempTabIds` SHALL become `[42, 1, 2]`

#### Scenario: dedupMovesTabToTop disabled — position unchanged

- **GIVEN** `dedupMovesTabToTop` is disabled
- **WHEN** a blank new tab's first navigation matches and focuses an existing temp tab
- **THEN** its position in `tempTabIds` SHALL remain unchanged
