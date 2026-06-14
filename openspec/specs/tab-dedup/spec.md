# tab-dedup Specification

## Purpose
TBD - created by archiving change tab-dedup-and-duplicate. Update Purpose after archive.
## Requirements
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

### Requirement: Dedup emits a flash signal to the sidebar

When the `openUrl` handler focuses an existing tab via dedup, it SHALL emit a
`chrome.runtime.sendMessage({ type: 'lunma/tab-dedup-flash', tabId })` call,
floated as a `ctx.runSideEffect`. This message is delivered to all open extension
pages; the sidebar listens for it to trigger a visual flash on the focused tab row.

The message type `'lunma/tab-dedup-flash'` SHALL be a literal string constant
exported from `apps/extension/src/shared/bus.ts` (or a co-located constants file)
so sender and listener share the same value without string duplication.

#### Scenario: Dedup focus emits the flash message

- **WHEN** dedup focuses tab 42 instead of creating a new tab
- **THEN** `chrome.runtime.sendMessage({ type: 'lunma/tab-dedup-flash', tabId: 42 })` SHALL be called as a side effect

#### Scenario: Normal create path does not emit flash

- **WHEN** the URL is not already open and a new tab is created
- **THEN** no `lunma/tab-dedup-flash` message SHALL be sent

### Requirement: Sidebar flashes the focused tab row on dedup

The sidebar (`TempTabs.svelte`) SHALL register a `chrome.runtime.onMessage` listener
for `lunma/tab-dedup-flash` messages. On receipt, it SHALL apply a transient CSS
class (`flash`) to the matching temp tab row's `.row-wrap` element for the duration
of one keyframe animation play (`animation-iteration-count: 1`). An `animationend`
event on the row SHALL clear the class. If the tabId in the message does not
correspond to any row in the currently rendered temp tab list, the message SHALL be
silently ignored.

The flash animation SHALL be a background-color pulse from `var(--surface-2)` (the
row-hover wash — `@lunma/tokens` has no `--surface-hovered` token) to transparent
over `var(--motion-base)` (`200ms`) using `var(--ease-emphasised)`. Under
`prefers-reduced-motion: reduce`, the keyframe duration SHALL be `0ms`, causing the
class to be applied and cleared without visible motion.

#### Scenario: Flash animates the correct row

- **WHEN** a `lunma/tab-dedup-flash` message arrives with `tabId: 42`
- **AND** the sidebar is rendering a temp tab row for tab 42
- **THEN** a `flash` CSS class SHALL be applied to that row's `.row-wrap`
- **AND** the class SHALL be removed when the keyframe animation ends

#### Scenario: Flash is suppressed under reduced motion

- **WHEN** `prefers-reduced-motion: reduce` is active
- **AND** a `lunma/tab-dedup-flash` message arrives
- **THEN** the class is applied and cleared without visible animation

#### Scenario: Unknown tabId is silently ignored

- **WHEN** a `lunma/tab-dedup-flash` message arrives with a tabId not in the temp list
- **THEN** no visual change occurs

### Requirement: Temp tab right-click menu includes a Duplicate action

The temp tab context menu (`tabMenuItems()` in `TempTabs.svelte`) SHALL include a
"Duplicate" menu item. Activating it SHALL dispatch `bus.send({ kind:
'duplicateTab', payload: { tabId } })` for the right-clicked row's tab. The item
SHALL be placed after "Move down" and before "Close tab" in the menu order.

#### Scenario: Duplicate appears in the temp tab context menu

- **WHEN** the user right-clicks a temp tab row
- **THEN** the context menu SHALL include a "Duplicate" item

#### Scenario: Activating Duplicate dispatches duplicateTab

- **WHEN** the user selects "Duplicate" for tab 42
- **THEN** `bus.send({ kind: 'duplicateTab', payload: { tabId: 42 } })` SHALL be dispatched

### Requirement: duplicateTab command handler duplicates the tab via Chrome API

The `duplicateTab` coordinator handler SHALL call `chrome.tabs.duplicate(tabId)`.
The resulting cloned tab is adopted into the active Space's temp tab list via the
existing `tabs.onCreated` path — the handler itself SHALL NOT mutate
`tempTabIds`, `liveTabsById`, or any other store state. If `chrome.tabs.duplicate`
rejects (tab no longer exists), the handler SHALL throw so the sidebar's `bus.send`
promise rejects with an error.

#### Scenario: Duplicating a temp tab creates a clone in the active Space

- **WHEN** `duplicateTab { tabId: 42 }` is dispatched
- **THEN** `chrome.tabs.duplicate(42)` SHALL be called
- **AND** the resulting tab SHALL be adopted into the active Space via `tabs.onCreated`
- **AND** the handler SHALL NOT directly mutate `tempTabIds` or `liveTabsById`

#### Scenario: Duplicating a non-existent tab rejects

- **WHEN** `duplicateTab { tabId: 999 }` is dispatched and tab 999 does not exist
- **THEN** `chrome.tabs.duplicate` rejects
- **AND** the handler SHALL throw, causing `bus.send` to reject

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

#### Scenario: Explicit new-tab-to-URL gestures are excluded

- **WHEN** a tab is opened directly to a URL (middle-click, `target="_blank"`, `window.open`) that is already open in the active Space
- **THEN** Lunma SHALL NOT dedup it — it is adopted/tracked at creation and never reaches the first-navigation path

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

### Requirement: Navigation dedup is gated by the dedupNewTabNavigations setting

Navigation deduplication SHALL run only when the `dedupNewTabNavigations` setting is
`true`. When it is `false`, a blank new tab navigating to an already-open URL SHALL be
adopted normally (a duplicate row), exactly as before this change. The launcher's
`openUrl` dedup is unaffected by this setting — it remains always-on.

The handler SHALL read the setting from a coordinator-side cached mirror (pushed by the
SW settings watcher, like `pinnedTabBoundaryDefault`) so the drain stays synchronous.

#### Scenario: Setting off restores duplicate behaviour

- **GIVEN** `dedupNewTabNavigations` is `false`
- **AND** `https://example.com/` is open in the active Space
- **WHEN** a blank new tab navigates to `https://example.com/`
- **THEN** Lunma SHALL adopt the new tab (a second row) without focusing or closing anything

#### Scenario: Setting does not affect launcher dedup

- **GIVEN** `dedupNewTabNavigations` is `false`
- **WHEN** the user opens `https://example.com/` from the launcher and it is already open in the active Space
- **THEN** the `openUrl` dedup SHALL still focus the existing tab (launcher dedup is always-on)

### Requirement: Navigation dedup flashes the focused row

When navigation dedup focuses an existing tab, it SHALL emit the existing
`lunma/tab-dedup-flash` runtime message (`TAB_DEDUP_FLASH`) for the focused tab, so the
sidebar flashes that row — identical to the `openUrl` dedup path. No new message or
animation is introduced.

#### Scenario: Navigation dedup emits the flash

- **WHEN** navigation dedup focuses tab 42 and closes the navigated tab
- **THEN** `chrome.runtime.sendMessage({ type: 'lunma/tab-dedup-flash', tabId: 42 })` SHALL be emitted as a side effect

