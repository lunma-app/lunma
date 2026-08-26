## MODIFIED Requirements

### Requirement: Live tab metadata slice

Lunma SHALL maintain an ephemeral `liveTabsById: { [tabId: TabId]: LiveTab }` map on `AppState`, mirroring live Chrome-tab metadata for rendering. A `LiveTab` SHALL be `{ tabId: TabId, windowId: WindowId, title: string, url: string, active: boolean, status: 'loading' | 'complete' }`. The slice SHALL be maintained entirely by the service worker from Chrome tab events and SHALL be broadcast to the sidebar as part of `AppState`. It SHALL NOT be persisted (see the storage-and-migrations capability). On service-worker boot, after `loadState()` and recovery and before listener registration, the SW SHALL rebuild it from `chrome.tabs.query({})` via `store.rebuildLiveTabs(tabs)`.

The store SHALL expose `syncLiveTab(tab)` (insert/update from `onCreated` / `onUpdated`), `removeLiveTab(tabId)` (from `onRemoved`), `setActiveTab(windowId, tabId)` (from `onActivated`), and `rebuildLiveTabs(tabs)` (boot seed). `syncLiveTab` SHALL be a no-op broadcast-wise when none of the visible fields (`title`, `url`, `active`, `status`) change.

#### Scenario: Boot rebuilds liveTabsById from chrome.tabs.query

- **WHEN** the SW boots and `chrome.tabs.query({})` returns two tabs (ids 17 and 22)
- **THEN** `store.rebuildLiveTabs` SHALL populate `state.liveTabsById` with a `LiveTab` for 17 and 22
- **AND** each `LiveTab` SHALL carry that tab's `windowId`, `title`, `url`, `active`, and a `status` of `'loading'` or `'complete'`

#### Scenario: onActivated updates the active flag

- **WHEN** tab 22 becomes active in window 100 and `setActiveTab(100, 22)` runs
- **THEN** `state.liveTabsById[22].active` SHALL be `true`
- **AND** any other `LiveTab` in window 100 that was previously `active` SHALL become `false`

#### Scenario: onRemoved prunes the entry

- **WHEN** tab 17 is closed and `removeLiveTab(17)` runs
- **THEN** `state.liveTabsById` SHALL NOT contain key `17`

#### Scenario: Unchanged visible fields do not force a broadcast

- **WHEN** `syncLiveTab` is called for tab 17 with the same `title`, `url`, `active`, and `status` it already holds
- **THEN** the slice SHALL be unchanged and no redundant broadcast SHALL be required for this event

**Provenance addition.** `LiveTab` SHALL additionally carry two optional fields —
`provenanceToken?: string` (the token the tab's page reports) and
`provenanceParentTabId?: TabId` (the resolved parent's live tab id). Both SHALL be
declared on `LiveTabSchema`, which is a `z.strictObject` parsed on every broadcast,
so an undeclared field would reject the entire broadcast. Both are ephemeral like
the rest of the slice and are never persisted; the durable record is
`provenanceByToken`.

`syncLiveTab`'s broadcast gate SHALL additionally treat a change to either field as
material. Without this the gate would swallow a token report and a parent
resolution — neither is one of `title|url|active|status` — and the sidebar would
never re-indent a tab whose lineage has just resolved.

#### Scenario: A token report reaches the surfaces

- **GIVEN** a live tab whose `provenanceToken` is unset
- **WHEN** its content script reports a token and `syncLiveTab` runs
- **THEN** the change SHALL be treated as material and a state broadcast SHALL be emitted

#### Scenario: The provenance fields are not persisted

- **GIVEN** live tabs carrying `provenanceToken` and `provenanceParentTabId`
- **WHEN** the persisted projection is taken
- **THEN** both fields SHALL be absent, exactly as the rest of `liveTabsById` is

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

**Provenance nesting.** When the effective provenance state is on, the Temporary
list SHALL indent a row under the row of the tab named by its
`provenanceParentTabId`, while remaining ONE flat scrolling list. Nesting SHALL be
expressed by indentation and a hairline lineage rule, NOT by nested containers: row
height, hit area, drag behaviour and the existing menu SHALL be identical at every
depth, and `TabRow` SHALL take the indent through a `depth?: number` prop.

**Depth is computed by this surface**, by following `provenanceParentTabId` among
the rows it is actually rendering. The service worker resolves the edge; the panel
resolves the layout, because only the panel knows which rows it displays — a panel
may render a Space that is not the active one. A row whose
`provenanceParentTabId` is absent from the rendered rows SHALL render at depth `0`
with no lineage rule: a rule SHALL never point at a row that is not there. Depth
SHALL be capped at `PROVENANCE_MAX_DEPTH` (5); beyond the cap rows SHALL share the
deepest indent rather than continuing to indent.

A parent row SHALL NOT gain an expand/collapse control in this change; the tree is a
reading aid, not a navigation control. Ordering SHALL remain `tempTabIds` order —
provenance changes indentation, never position — so a manual reorder and the
Group-by-site action continue to mean exactly what they mean today.

When the effective state is off, or when no parent resolves, the list SHALL render
exactly as it does today: flat, with no lineage rule and no reserved indent gutter.

**Motion.** `flip` animates any measured box movement, so a provenance-driven
indent change would animate unless suppressed. `TempTabs` already passes a duration
function (`animate:flip={{ duration: () => reorderFlipMs() }}`); a Svelte `animate:`
directive cannot be applied conditionally, so the mechanism SHALL be that duration
returning **0** while no drag is in progress. A late-arriving parent then applies
with no transition; a drag keeps `reorderFlipMs()`.

#### Scenario: A child renders indented under its parent

- **GIVEN** provenance is on and tab `C` carries `provenanceParentTabId` naming tab `P`, both rendered in this list
- **WHEN** the Temporary list renders
- **THEN** `C`'s row SHALL render one indent step deeper than `P`'s, in `tempTabIds` order, in the same flat scroll container

#### Scenario: With provenance off the list is unchanged

- **GIVEN** the effective provenance state is off
- **WHEN** the Temporary list renders
- **THEN** every row SHALL render at depth 0 with no lineage rule and no reserved indent gutter

#### Scenario: Provenance changes indentation, never order

- **GIVEN** a Space whose `tempTabIds` order is `X`
- **WHEN** parents resolve for some of those tabs
- **THEN** the rendered order SHALL remain `X`

#### Scenario: A parent outside the rendered rows yields a flat row

- **GIVEN** a row whose `provenanceParentTabId` names a tab not rendered in this list
- **WHEN** the list renders
- **THEN** that row SHALL render at depth 0 with no lineage rule

#### Scenario: Depth is capped

- **GIVEN** a chain of rendered rows deeper than `PROVENANCE_MAX_DEPTH`
- **WHEN** the list renders
- **THEN** rows beyond the cap SHALL share the deepest indent

#### Scenario: A late-arriving parent applies without animation

- **GIVEN** no drag is in progress
- **WHEN** a restored tab reports its token and a parent resolves after the list has rendered
- **THEN** the `flip` duration SHALL resolve to 0 and the row's indent SHALL change with no transition
