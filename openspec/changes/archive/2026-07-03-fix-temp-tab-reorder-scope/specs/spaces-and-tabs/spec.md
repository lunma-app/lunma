## MODIFIED Requirements

### Requirement: Temporary tabs list rendering and interaction

When the active Space has one or more temporary tabs, the sidebar SHALL render the Temporary section as a list of rows — one `TabRow` per temporary tab in `tempTabIds` array order. Each row SHALL show the tab's favicon (resolved by `faviconFor(url, favIconUrl)` as the **primary** source, with the `_favicon` page-URL endpoint — `faviconUrl(url)` — retried as the **fallback** when the primary fails to load, and a neutral globe icon only when both fail; this staged fallback is provided by the shared `Favicon` primitive that `TabRow` composes), the tab's `title`, a hover-revealed **close (`✕`)** button in the row's trailing slot, and a **right-click action menu** — the SAME interaction the global favicon tiles use: a floating `Menu` (`trigger: 'context'`) popover anchored at the pointer, opened on a `contextmenu` event. There SHALL be no on-row kebab menu. The row for the window's active tab SHALL render with the active treatment defined in the sidebar shell's colour identity.

A **home tab** SHALL NEVER appear in this list — home tabs are not added to `tempTabIds` (see "Home tabs are not listed as temporary tabs"), so an empty Space showing only its home renders no temporary rows (the divider + New Tab affordance from the sidebar shell remain).

Clicking a row SHALL dispatch `bus.send({ kind: 'focusTab', payload: { tabId } })`. The hover-revealed `✕` SHALL close the tab directly — dispatching `bus.send({ kind: 'closeTab', payload: { tabId } })` — and SHALL NOT also trigger the row's focus or start a drag (it stops pointer/click propagation); this restores the one-click inline close (reversing the favicon-row change that had folded close into the overflow menu). Right-clicking a row SHALL open the action menu at the cursor, suppressing the browser's native context menu, and SHALL NOT focus or switch to the tab. The right-click menu SHALL carry, top to bottom: a non-destructive **Favorite** action that dispatches `bus.send({ kind: 'favoriteTab', payload: { tabId, windowId } })` and leaves the tab open (see the `lunma-bookmark-bindings` capability, Requirement: Couple and decouple favorites by direct manipulation); a **Rename** action that opens the row's inline rename; **Move up** and **Move down** actions that reorder the row one position within the Temporary list — dispatching `reorderTemp` carrying `{ windowId, spaceId, tabIds }`, where `spaceId` is the Space this `TempTabs` panel is displaying (not necessarily the window's active Space) and `tabIds` is the full post-move order — each rendered disabled (the standard disabled treatment, not hidden) when the row is already at that end of the list, so reordering is reachable from the keyboard (the context-menu key / `Shift+F10` opens this menu) and from touch long-press; and a **Close tab** action that dispatches `bus.send({ kind: 'closeTab', payload: { tabId } })` and SHALL NOT also trigger the row's focus. A single `Menu` (`trigger: 'context'`) instance SHALL be shared across the Temporary list, opened for whichever row was right-clicked. A drag that begins on a temporary row and ends without crossing into the Pinned section SHALL be treated as a reorder within Temporary (dispatching `reorderTemp` with the same `{ windowId, spaceId, tabIds }` shape); a drag that ends inside the Pinned section SHALL pin the tab (dispatching `pinTab`). A pointer interaction that does not pass the drag threshold SHALL remain a click, not a drag; a secondary (right) button press SHALL NOT start a drag. The sidebar SHALL NOT optimistically update — it SHALL wait for the next `state-broadcast`. Rows SHALL be keyed by `tabId`. The Temporary list SHALL only render tabs present in `liveTabsById`; a `tempTabId` with no `liveTabsById` entry SHALL be skipped rather than rendered blank.

#### Scenario: Active Space with temp tabs renders a row list

- **GIVEN** window 100's active Space has `tempTabIds: [17, 22]` with matching `liveTabsById` entries
- **WHEN** the sidebar renders
- **THEN** the Temporary section SHALL contain two `TabRow` elements in that order

#### Scenario: Clicking a temp row focuses; the hover close closes

- **WHEN** the user clicks a temporary row, then on another row activates the hover-revealed `✕`
- **THEN** the row click SHALL dispatch `focusTab` and the `✕` SHALL dispatch `closeTab` without also dispatching `focusTab`

#### Scenario: Right-click opens the action menu without focusing

- **WHEN** the user right-clicks a temporary row
- **THEN** the floating action menu SHALL open at the cursor, the browser's native context menu SHALL be suppressed, and `focusTab` SHALL NOT be dispatched

#### Scenario: The right-click menu's Favorite action keeps the tab open

- **WHEN** the user right-clicks a temporary row and selects **Favorite**
- **THEN** the sidebar SHALL dispatch `favoriteTab` for that tab
- **AND** the tab SHALL remain open (no `closeTab` is dispatched)

#### Scenario: Move down reorders a temporary row by one

- **GIVEN** window 100's active Space (`spaceId: 'work'`) has `tempTabIds: [17, 22, 31]`
- **WHEN** the user selects **Move down** from tab 17's context menu
- **THEN** the sidebar SHALL dispatch `reorderTemp` carrying `{ windowId: 100, spaceId: 'work', tabIds: [22, 17, 31] }`
- **AND** the rendered order SHALL update from the next `state-broadcast` (no optimistic update)

#### Scenario: Move up is disabled on the first temporary row

- **GIVEN** tab 17 is first in `tempTabIds`
- **WHEN** its context menu opens
- **THEN** **Move up** SHALL render disabled and activating it SHALL dispatch nothing

#### Scenario: A home tab is excluded from the Temporary list

- **GIVEN** the active Space's only tab in the window is its home tab
- **THEN** the Temporary list SHALL render no rows (the home tab is not a temporary tab)

#### Scenario: A temp id without a live entry is skipped

- **GIVEN** `tempTabIds` contains `7` but `liveTabsById[7]` is absent
- **THEN** the Temporary section SHALL NOT render a row for `7`

#### Scenario: A CORP-blocked temp-tab favicon falls back to the endpoint

- **GIVEN** a temporary tab whose `favIconUrl` is a loadable-scheme URL that fails to load from the extension page (e.g. a Cross-Origin-Resource-Policy block)
- **WHEN** its `TabRow` renders
- **THEN** the row SHALL retry the `_favicon` page-URL endpoint before any globe
- **AND** the neutral globe icon SHALL render only if the `_favicon` endpoint also fails

### Requirement: Manual temporary tab ordering

The sidebar's Temporary list SHALL render a Space's temporary tabs, in a given window, in the order of `spaceInstancesByWindow[windowId][spaceId].tempTabIds` (the array order). The user SHALL be able to reorder temporary tabs by dragging (or via the context menu's Move up/Move down); a completed reorder SHALL dispatch a `reorderTemp` command carrying `{ windowId, spaceId, tabIds }` — `spaceId` identifying the Space instance the reorder applies to (the Space the issuing `TempTabs` panel is displaying, which is NOT necessarily the window's active Space — every carousel panel dispatches for its own Space) and `tabIds` the full post-drop tab-id order — and the resulting authoritative state broadcast SHALL define the rendered order (no optimistic update is layered on top). Reordering SHALL be expressed by reordering the `tempTabIds` array; no separate order field SHALL be persisted, and no `chrome.tabs.onMoved` listener SHALL be required for this ordering.

A tab id present in the live `tempTabIds` at the time `reorderTemp` is applied but absent from the dispatched `tabIds` (a tab closed since the client's snapshot was taken, or — most commonly — a brand-new tab `onTabCreated` has since `unshift`ed to the top) SHALL keep its current position; it SHALL NOT be relocated to the end of the list. Only ids present in both the dispatched `tabIds` and the live `tempTabIds` are reordered among themselves, at the positions they collectively already occupy.

> Supersedes the prior most-recent-first ordering (archived `sidebar-temp-tabs`, which ordered by `tabLastActivity` via a pure `orderTempTabs` helper). The sidebar redesign moved the Temporary list to a directly drag-reorderable model alongside the Pinned list; `orderTempTabs` is removed. A future `tab-sort-options` change MAY reintroduce alternate sort modes layered over the array order.

#### Scenario: Temp tabs render in tempTabIds array order

- **WHEN** window 100's active Space has `tempTabIds: [17, 22]` with matching `liveTabsById` entries
- **THEN** the Temporary list SHALL render tab 17 first, then tab 22

#### Scenario: Drag-reorder dispatches reorderTemp and the broadcast is authoritative

- **WHEN** the user drags temporary tab 17 below tab 22 in window 100's active Space (`spaceId: 'work'`)
- **THEN** the sidebar SHALL dispatch `reorderTemp` with the post-drop order `{ windowId: 100, spaceId: 'work', tabIds: [22, 17] }`
- **AND** after the SW broadcast, `spaceInstancesByWindow[100].work.tempTabIds` SHALL be `[22, 17]` and the sidebar SHALL render that order

#### Scenario: A reorder is scoped to the Space that issued it, not the window's active Space

- **GIVEN** window 100 has two Spaces with instances — the active Space `active` (`tempTabIds: [10, 20]`) and a non-active Space `background` (`tempTabIds: [30, 40]`) both visible in the sidebar's carousel
- **WHEN** the background Space's `TempTabs` panel dispatches `reorderTemp` with `{ windowId: 100, spaceId: 'background', tabIds: [40, 30] }`
- **THEN** `spaceInstancesByWindow[100].background.tempTabIds` SHALL become `[40, 30]`
- **AND** `spaceInstancesByWindow[100].active.tempTabIds` SHALL remain `[10, 20]`, unchanged

#### Scenario: A tab that arrives after the client's snapshot keeps its position

- **GIVEN** window 100's active Space has `tempTabIds: [3, 1, 2]`, where tab `3` was `unshift`ed to the top by `onTabCreated` after the sidebar took its drag snapshot of `[1, 2]`
- **WHEN** the stale `reorderTemp` command drains with `{ windowId: 100, spaceId: <active>, tabIds: [2, 1] }` (reordering only the two tabs the client knew about)
- **THEN** `tempTabIds` SHALL become `[3, 2, 1]`
- **AND** tab `3` SHALL NOT be relocated to the end of the list
