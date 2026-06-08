# lunma-bookmark-bindings Specification

## Purpose
TBD - created by archiving change rebrand-to-lunma. Update Purpose after archive.
## Requirements
### Requirement: Lunma bookmark shape with originalURL and currentURL

A saved tab (a pinned tab or a favicon-row entry) SHALL be a Lunma-owned record persisted in `chrome.storage.local`, NOT a Chrome bookmark. The store SHALL hold saved tabs in a flat map `savedTabs: { [savedTabId: string]: SavedTab }` keyed by a Lunma-generated id (`crypto.randomUUID()`). A `SavedTab` SHALL have the shape:

- `id: string` — the Lunma-generated record id (also the map key).
- `spaceId: string` — the owning Space's id.
- `title: string` — the display title, owned by Lunma (not derived from a bookmark node).
- `originalURL: string` — what the user saved (the record's "home").
- `currentURL: string | null` — where the bound tab is now, or `null` when dormant.

No Chrome bookmark SHALL back a saved tab, and `bookmark.url` SHALL NOT be the source of truth for any saved tab's URL.

#### Scenario: A saved tab carries a Lunma-owned title and id

- **WHEN** the user saves `https://github.com/` titled "GitHub" to Space "Work"
- **THEN** `state.savedTabs[<id>]` SHALL equal `{ id: <id>, spaceId: 'work', title: 'GitHub', originalURL: 'https://github.com/', currentURL: null }`
- **AND** `<id>` SHALL be a `crypto.randomUUID()` value, not a Chrome bookmark id

#### Scenario: No Chrome bookmark is created for a saved tab

- **WHEN** a saved tab is created
- **THEN** Lunma SHALL NOT call `chrome.bookmarks.create`
- **AND** the record SHALL exist only in `state.savedTabs`

### Requirement: Binding table maps bookmarks to tab ids

The store SHALL maintain `tabBindings: { [savedTabId: string]: { [windowId: number]: number } }` mapping each saved tab to a live Chrome tab id **per window** — the inner record holds one tab id for each window in which the saved tab is currently bound. A window's **absence** from the inner record SHALL mean the saved tab is dormant in that window; an **empty or absent** inner record SHALL mean the saved tab is dormant in every window. `tabBindings` SHALL be persisted to `chrome.storage.local` so it survives service-worker termination. The binding SHALL be a separate map, not a field on `SavedTab` (durable record vs session-scoped binding). The per-window shape SHALL apply **uniformly** to all saved tabs (pinned tabs and favicon-row entries alike); there SHALL NOT be a separate single-binding path for any saved-tab type.

#### Scenario: Persisted binding survives SW sleep

- **WHEN** a saved tab is bound to tab id 42 in window 100 and the service worker is terminated
- **THEN** on the next SW wake-up, `tabBindings[savedTabId][100] === 42`

#### Scenario: The same saved tab binds independently in two windows

- **WHEN** a saved tab is bound to tab 42 in window 100 and to tab 77 in window 200
- **THEN** `tabBindings[savedTabId]` SHALL equal `{ 100: 42, 200: 77 }`
- **AND** focusing it from window 200 SHALL activate tab 77, never tab 42

### Requirement: Clicking a dormant bookmark opens a new tab and binds it

When the user activates a saved tab that is dormant **in the focused window** (no slot for that window in `tabBindings[savedTabId]`), Lunma SHALL open a new Chrome tab at `originalURL` in that window, SHALL set `tabBindings[savedTabId][windowId]` to the new tab's id, and SHALL set the record's `currentURL = originalURL`. If the record is coupled (`spaceId !== null`) the new tab SHALL be added to that window's Chrome group for the record's Space; if the record is a favorite (`spaceId === null`) the new tab SHALL be left **ungrouped** (global) via `ensureFavoriteUngrouped` and SHALL NOT be added to any Space's Chrome group. No other window's binding SHALL be created or modified.

#### Scenario: Activating a dormant pinned saved tab

- **WHEN** the user clicks the pinned saved tab for GitHub in window 100's sidebar and it is dormant in window 100
- **THEN** a new tab SHALL open at `https://github.com/` in window 100
- **AND** `tabBindings[<gh-id>][100]` SHALL equal the new tab's id
- **AND** the record's `currentURL` SHALL equal `originalURL`
- **AND** the new tab SHALL be added to window 100's Chrome group for the record's Space

#### Scenario: Activating a dormant favorite opens it ungrouped

- **WHEN** the user clicks a dormant favorite `f1` (`spaceId === null`) in window 100's favicon row
- **THEN** a new tab SHALL open at `f1`'s `originalURL` in window 100 and be bound in window 100
- **AND** the new tab SHALL be left ungrouped (group id `-1`) and SHALL NOT be added to any Space's Chrome group

### Requirement: Clicking an active bookmark focuses its bound tab

When the user activates a saved tab already bound **in the focused window** (`tabBindings[savedTabId][windowId]` resolves to a live tab), Lunma SHALL focus that window's bound tab via `chrome.tabs.update(tabId, { active: true })` and its window via `chrome.windows.update(windowId, { focused: true })`. No new tab SHALL be opened, and no other window's binding SHALL be touched.

#### Scenario: Re-activating a saved tab bound in the focused window

- **WHEN** the user clicks a saved tab in window 100 whose `tabBindings[id][100]` is a valid live tab id
- **THEN** that tab SHALL be activated and window 100 focused
- **AND** no new tab SHALL be created

### Requirement: chrome.tabs.onUpdated keeps currentURL fresh while bound

While a saved tab is bound in any window, every `chrome.tabs.onUpdated` for one of its bound tab ids that includes a URL change SHALL update the record's `currentURL`. The record keeps a single canonical `currentURL` (last-writer-wins across windows). The binding — the window's tab id — SHALL NOT change across in-site or cross-origin navigation.

#### Scenario: Navigation updates currentURL, preserves the binding

- **WHEN** the tab bound to the GitHub saved tab in window 100 navigates to `https://news.ycombinator.com/`
- **THEN** the record's `currentURL` SHALL equal `https://news.ycombinator.com/`
- **AND** `tabBindings[id][100]` SHALL be unchanged

### Requirement: Drift indicator and affordances

A saved tab SHALL be considered drifted **in a window** when it is bound in that window and that window's bound tab's current URL differs from `originalURL`. The sidebar — a per-window surface — SHALL render the drift indicator for its own window's binding only. A saved tab drifted in a window SHALL offer:

- **Go home** — navigates **that window's** bound tab to `originalURL` via `chrome.tabs.update(tabId, { url: originalURL })`; after it lands, that window's binding is no longer drifted and the indicator clears.
- **Make this home** — sets `originalURL := the window's bound tab's current URL` **in Lunma state only** (no Chrome bookmark to update); the indicator clears.

#### Scenario: Make this home updates originalURL in state

- **WHEN** the user invokes "Make this home" on a saved tab drifted in window 100
- **THEN** `originalURL` SHALL be set to window 100's bound tab's current URL
- **AND** Lunma SHALL NOT call `chrome.bookmarks.update`
- **AND** the drift indicator SHALL no longer be rendered in window 100

#### Scenario: Drift is independent per window

- **WHEN** a saved tab's bound tab in window 100 is at `originalURL` but its bound tab in window 200 has navigated away
- **THEN** the saved tab SHALL render no drift indicator in window 100 and a drift indicator in window 200

### Requirement: Closing a bound tab clears the binding

When `chrome.tabs.onRemoved` fires for a tab id present in a window slot of `tabBindings`, Lunma SHALL delete **that window's** slot (`tabBindings[savedTabId][windowId]`). When the saved tab has no remaining window slots, Lunma SHALL set the record's `currentURL = null` and the saved tab becomes dormant everywhere. The saved tab SHALL remain bound in any other window where it still holds a slot.

#### Scenario: Closing a bound tab clears only that window's slot

- **WHEN** the user closes the tab bound to the GitHub saved tab in window 100, while window 200 still has its own bound tab
- **THEN** `tabBindings[<gh-id>][100]` SHALL be absent
- **AND** `tabBindings[<gh-id>][200]` SHALL be unchanged
- **AND** the record's `currentURL` SHALL remain set (still bound in window 200)

#### Scenario: Closing the last bound tab makes the saved tab dormant

- **WHEN** the closed tab was the saved tab's only remaining window slot
- **THEN** `tabBindings[<gh-id>]` SHALL hold no window slots
- **AND** the record's `currentURL` SHALL be `null`

### Requirement: Deleting a bound bookmark closes its tab after confirmation

When the user deletes a saved tab bound in one or more windows, Lunma SHALL prompt for confirmation. On confirmation, Lunma SHALL close **every** bound live tab (across all window slots) via `chrome.tabs.remove` AND remove the `SavedTab` record from `state.savedTabs` and from its placement — which is `pinnedBySpace[spaceId]` when the record is coupled (`spaceId !== null`) or `faviconRow` when the record is a favorite (`spaceId === null`). Record removal SHALL clean the record id from **both** placement families so no dangling id can leak. On dismissal, no changes SHALL be made. Deleting a saved tab dormant in all windows SHALL remove the record without prompting. A `chrome.tabs.remove` rejection SHALL NOT block record removal.

#### Scenario: Deleting a saved tab bound in two windows closes both tabs

- **WHEN** the user confirms deletion of a saved tab whose `tabBindings[id]` is `{ 100: 42, 200: 77 }`
- **THEN** both tab 42 and tab 77 SHALL be closed via `chrome.tabs.remove`
- **AND** the record SHALL be removed from `state.savedTabs` and from `state.pinnedBySpace`

#### Scenario: Deleting a favorite cleans it from faviconRow

- **WHEN** the user confirms deletion of a favorite `f1` (`spaceId === null`) bound to tab 42 in window 100
- **THEN** tab 42 SHALL be closed via `chrome.tabs.remove`
- **AND** the record SHALL be removed from `state.savedTabs` and from `state.faviconRow`
- **AND** `f1` SHALL leave no dangling id in any placement array

#### Scenario: Deleting a dormant saved tab removes it without prompting

- **WHEN** the user deletes a saved tab whose `tabBindings[id]` holds no window slots
- **THEN** the record SHALL be removed without a confirmation prompt

### Requirement: Restart recovery rebinds by URL on SW boot

On SW boot, for each persisted **window slot** in `tabBindings` whose tab id no longer resolves to a live tab in that window, Lunma SHALL rebind by URL **within that window**: query that window's live tabs via `chrome.tabs.query({ windowId })`; match the record's `currentURL` (tiebreak: most recent `tabLastActivity`), else `originalURL`; on a match set `tabBindings[savedTabId][windowId] = matchingTabId` without modifying `currentURL`; on no match remove that window's slot. A tab already claimed earlier in the pass SHALL NOT be reclaimed (first-claim-wins, evaluated per window). `runRestartRecovery` SHALL be exported from `src/background/tab-bindings.ts` and operate per window.

#### Scenario: Restart recovers a window slot by currentURL

- **WHEN** SW boots, a persisted slot `tabBindings[id][100]`'s stored tab id is invalid, and a restored tab exists in window 100 at the record's `currentURL`
- **THEN** `tabBindings[id][100]` SHALL be that restored tab's id
- **AND** `currentURL` SHALL be unchanged

#### Scenario: No matching tab clears that window's slot

- **WHEN** SW boots and neither `currentURL` nor `originalURL` matches any restored tab in window 100
- **THEN** `tabBindings[id][100]` SHALL be absent
- **AND** the saved tab's other window slots SHALL be evaluated independently

### Requirement: Lunma never auto-binds tabs except from explicit user action or restart recovery

A live tab whose URL equals a saved tab's `originalURL` SHALL NOT be auto-bound. The only operations that create a binding SHALL be an explicit activation of a dormant saved tab, or the restart-recovery flow. `chrome.tabs.onCreated` SHALL NOT trigger auto-binding.

#### Scenario: Opening a matching URL via the address bar does not auto-bind

- **WHEN** the user has a dormant pinned GitHub saved tab and opens `https://github.com/` via the address bar in window 100
- **THEN** `tabBindings[<gh-id>]` SHALL have no slot for window 100
- **AND** the new tab SHALL be a temporary tab in the active Space's instance

### Requirement: Bound tabs are not temporary tabs

A tab id present in any window slot of `tabBindings` SHALL NOT appear in that window's `spaceInstancesByWindow[windowId].tempTabIds` list. Lunma SHALL maintain this invariant when adding or removing bindings.

#### Scenario: Binding a tab removes it from tempTabIds

- **WHEN** a tab in window 100's instance becomes bound to a saved tab (`tabBindings[id][100]` set)
- **THEN** the tab id SHALL be removed from `spaceInstancesByWindow[100].tempTabIds`

### Requirement: Pinned tabs and favicon row use the same binding model

All saved-tab behaviours SHALL apply identically to pinned tabs and favicon-row entries. They SHALL differ only by **coupling state and placement**: a pinned tab carries `spaceId = X` and is referenced by `pinnedBySpace[X]`; a favicon-row favorite carries `spaceId = null`, is referenced by the flat `faviconRow` placement, and has an **ungrouped** live tab. There SHALL NOT be separate binding logic per type — per-window binding, drift, restart recovery, and dormant/active activation SHALL be identical, and a record SHALL NOT be duplicated across placements.

#### Scenario: Favicon-row drift behaves like pinned drift

- **WHEN** a favicon-row saved tab's bound tab navigates such that `currentURL !== originalURL`
- **THEN** the same drift indicator and Go home / Make this home affordances SHALL apply as for a pinned saved tab

#### Scenario: A favorite binds per window like a pinned tab

- **WHEN** favorite `f1` is bound to tab 42 in window 100 and to tab 77 in window 200
- **THEN** `tabBindings['f1']` SHALL equal `{ 100: 42, 200: 77 }`
- **AND** focusing `f1` from window 200 SHALL activate tab 77, never tab 42

### Requirement: No content script is used for bookmark binding

Saved-tab binding SHALL NOT depend on any content script, `sessionStorage` marker, or `chrome.scripting.executeScript` call. It SHALL be fully managed by the service worker via the persisted `tabBindings` table and the restart-recovery URL match.

#### Scenario: SW never calls executeScript for binding

- **WHEN** the SW handles any binding-related action
- **THEN** `chrome.scripting.executeScript` SHALL NOT be invoked as part of that handling

### Requirement: Pinned ordering per Space

The store SHALL maintain `pinnedBySpace: { [spaceId: string]: string[] }` — the ordered list of `savedTabId`s pinned in each Space. Order SHALL be the array order. The favicon row, when introduced, SHALL use a sibling placement array over the same `savedTabs` map; a saved tab's record SHALL NOT be duplicated across placements. The sidebar SHALL let the user reorder pinned tabs by dragging; a completed reorder SHALL dispatch a `reorderPinned` command carrying the post-drop order, and the resulting authoritative state broadcast SHALL define the rendered order (no optimistic update is layered on top).

#### Scenario: Pinned order is the array order

- **WHEN** `state.pinnedBySpace['work']` is `['t1', 't2', 't3']`
- **THEN** the sidebar SHALL render the pinned tabs for "Work" as t1, then t2, then t3
- **AND** reordering SHALL be expressed by reordering this array, leaving each `SavedTab` record untouched

#### Scenario: Drag-reorder dispatches reorderPinned and the broadcast is authoritative

- **WHEN** the user drags the pinned row `t3` above `t1` in Space "work"
- **THEN** the sidebar SHALL dispatch `reorderPinned` with the post-drop order `['t3', 't1', 't2']`
- **AND** after the SW broadcast, `pinnedBySpace['work']` SHALL be `['t3', 't1', 't2']` and the sidebar SHALL render that order

### Requirement: Favicons derive at render via the Chrome favicon endpoint

The sidebar SHALL derive a saved tab's favicon at render time and SHALL NOT store
any favicon URL or image on the `SavedTab` record. The rendered favicon SHALL
resolve through staged sources:

1. **Primary** — the bound live tab's Chrome-resolved `favIconUrl`, when present
   and of a loadable scheme (`http`/`https`/`data:`).
2. **Fallback** — the Chrome favicon endpoint
   `chrome-extension://<extension-id>/_favicon/?pageUrl=<encoded currentURL || originalURL>&size=<n>`
   (requiring the `favicon` manifest permission), used both when no loadable
   primary exists AND when the primary source fails to load.
3. **Globe** — a deterministic globe glyph, rendered only when both the primary
   and the `_favicon` endpoint fail.

A `favIconUrl` of an unloadable scheme (`blob:`, `chrome:`, `about:`) SHALL be
treated as absent — an extension document cannot load another origin's
blob/privileged URL — so the primary source is the `_favicon` endpoint directly.
The staged resolution SHALL be provided by the shared `Favicon` primitive
(visual-system: Requirement: A shared Favicon primitive renders an icon with
staged fallback); the favicon `src` SHALL be built by
`faviconFor(url, favIconUrl, size)` and the endpoint fallback by
`faviconUrl(url, size)`.

#### Scenario: Favicon is derived, not stored

- **WHEN** a saved tab is inspected in persisted state
- **THEN** the record SHALL contain no `faviconUrl` or favicon image field
- **AND** the rendered favicon `src` SHALL be derived at render from the live
  `favIconUrl` (when present and of a loadable scheme) or the `_favicon` endpoint
  built from the record's URL

#### Scenario: A CORP-blocked primary favicon falls back to the endpoint

- **GIVEN** a saved tab whose primary `favIconUrl` is a loadable-scheme URL that
  fails to load from the extension page (e.g. a Cross-Origin-Resource-Policy block)
- **WHEN** the tile renders
- **THEN** the surface SHALL retry the `_favicon` page-URL endpoint before any globe
- **AND** the globe glyph SHALL render only if the `_favicon` endpoint also fails

### Requirement: Pinning a live tab creates a bound saved tab

Lunma SHALL provide a user action to pin a live Chrome tab to a Space. When invoked, Lunma SHALL mint a new `SavedTab` from the live tab (`title` and `currentURL`/`originalURL` taken from the live tab's title and URL), bind the new record to that tab id **in the tab's window** (`tabBindings[<new-id>][windowId] = tabId`), and append (or insert at a given index) the record id into `pinnedBySpace[spaceId]`. Binding the tab SHALL remove its id from that window instance's `tempTabIds` (the bound-tab-is-not-temp invariant). Pinning a tab that is already bound to any saved tab SHALL be a no-op (idempotent).

#### Scenario: Dragging a temporary tab into the Pinned section pins it

- **WHEN** the user drags the Temporary row for tab id 42 (title "GitHub", url `https://github.com/`) in window 100 into the Pinned section of Space "work"
- **THEN** a new `SavedTab` SHALL exist with `{ spaceId: 'work', title: 'GitHub', originalURL: 'https://github.com/', currentURL: 'https://github.com/' }`
- **AND** `tabBindings[<new-id>][100]` SHALL equal 42
- **AND** 42 SHALL NOT appear in `spaceInstancesByWindow[100].tempTabIds`
- **AND** `<new-id>` SHALL appear in `pinnedBySpace['work']` at the drop index

#### Scenario: Pinning an already-bound tab is a no-op

- **WHEN** the pin action targets a tab id already present in any window slot of `tabBindings`
- **THEN** no new `SavedTab` SHALL be created and `pinnedBySpace` SHALL be unchanged

### Requirement: Unpinning keeps the tab as a temporary tab

Lunma SHALL provide an unpin action distinct from delete. Unpinning a saved tab SHALL remove its record from `savedTabs`, its entry from `tabBindings` (all window slots), and its id from `pinnedBySpace`, AND — for each window in which the saved tab was bound — SHALL return that window's bound tab id to that window instance's `tempTabIds`. No live tab SHALL be closed.

#### Scenario: Unpinning a bound saved tab returns its tab to Temporary

- **WHEN** the user unpins a saved tab bound to live tab id 42 in window 100
- **THEN** the `SavedTab` record SHALL be removed and absent from `pinnedBySpace`
- **AND** 42 SHALL appear in `spaceInstancesByWindow[100].tempTabIds`
- **AND** tab 42 SHALL remain open (no `chrome.tabs.remove`)

### Requirement: A bound saved tab MAY be confined to a domain boundary

A bound `SavedTab` MAY carry an optional `boundary` that SHALL confine the tab's
**user-initiated, in-tab link navigations** to an **allow-set** of hosts while the
tab is bound to a live Chrome tab. When the user activates an anchor that would
navigate the bound tab (same tab) to a host **outside** the allow-set, Lunma SHALL
leave the bound tab on its current page and SHALL instead open the off-allow URL in
a **new temporary tab** in the tab's window.

The boundary SHALL be enforced **clicks-only and redirect-blind**: Lunma SHALL NOT
intercept server redirects, client (JS) redirects, or programmatic
`location`-style navigations. A navigation the click interceptor does not catch
(a programmatic off-domain navigation, a redirect chain, or a click on a page the
interceptor cannot run on) SHALL fall through to the existing drift behaviour
(`currentURL ≠ originalURL` with the "Go home" / "Make this home" affordances) and
SHALL NOT produce a broken state.

The effective allow-set SHALL be resolved as: `locked` → the boundary's `allow`
list; `off` → no enforcement; **absent** (`undefined`) → a per-record **effective
default**. A **global favorite** (`spaceId === null`) SHALL default to `'domain'`
(the registrable domain of `originalURL`) **regardless** of the global
`pinnedTabBoundaryDefault` setting — favorites are **locked to their own site by
default**, so a favorite stays anchored to its site without any per-record
configuration. A Space-**pinned** tab (`spaceId !== null`) with an absent boundary
SHALL inherit the global `pinnedTabBoundaryDefault` setting (`'domain'` → the
registrable domain of `originalURL`; `'off'` → no enforcement). An explicit
per-record `{ mode: 'off' }` is NOT absent and still wins, so a user MAY unlock a
specific favorite via the boundary editor (the favorite menu's "Lock to its site…"
drill-in). Allow entries are **host globs** — an exact host, or a leading-wildcard
host (`*.example.com`) matching the apex and any subdomain. The registrable domain
is computed by a heuristic (not a bundled Public Suffix List); the glob list is the
user's escape hatch when the heuristic is wrong.

Enforcement applies only to a **same-tab**, **unmodified**, **`http(s)`** anchor
activation. Modified clicks (Cmd/Ctrl/Shift/middle), `target="_blank"` links, and
non-`http(s)` schemes SHALL be left to Chrome. A boundary on a **dormant** (unbound)
saved tab SHALL have no live effect until the tab is next opened/bound. The bound
tab SHALL NOT be navigated by enforcement (the click is prevented before it
starts), so no flash or snap-back occurs.

#### Scenario: Off-allow link click diverts to a new temporary tab

- **WHEN** the user clicks a same-tab `http(s)` link in a bound tab whose boundary is enforced and whose target host is not in the allow-set
- **THEN** the bound tab SHALL remain on its current page
- **AND** Lunma SHALL open the target URL in a new temporary tab in that window

#### Scenario: In-allow link navigates normally

- **WHEN** the user clicks a link whose target host is in the allow-set
- **THEN** the bound tab SHALL navigate normally and no new tab SHALL be opened

#### Scenario: OAuth/redirect chains are not intercepted

- **WHEN** the bound tab is navigated off its allowed domains by a server or client redirect (e.g. an SSO sign-in flow)
- **THEN** Lunma SHALL NOT divert the navigation
- **AND** the navigation SHALL proceed, with drift handled by the existing "Go home" indicator if it lands off-home

#### Scenario: A pinned tab inherits the global default

- **WHEN** a Space-pinned saved tab (`spaceId !== null`) has no explicit `boundary` and the global `pinnedTabBoundaryDefault` is `'domain'`
- **THEN** the effective allow-set SHALL be the registrable domain of the tab's `originalURL`
- **AND** when the global default is `'off'`, the tab SHALL have no boundary enforcement

#### Scenario: A global favorite is locked to its site by default

- **GIVEN** a global favorite (`spaceId === null`) with no explicit `boundary` (`undefined`)
- **THEN** its effective allow-set SHALL be the registrable domain of its `originalURL`, regardless of the global `pinnedTabBoundaryDefault`
- **AND** an off-domain in-tab link click SHALL divert to a new temporary tab

#### Scenario: A favorite can be explicitly unlocked

- **GIVEN** a global favorite whose `boundary` is explicitly `{ mode: 'off' }`
- **THEN** the favorite SHALL have no boundary enforcement (the explicit off overrides the favorites-locked default)

#### Scenario: Modified and new-tab clicks are left to Chrome

- **WHEN** the user Cmd/Ctrl/Shift/middle-clicks an off-allow link, or the link has `target="_blank"`
- **THEN** Lunma SHALL NOT intercept it (Chrome opens it in a new tab, which is the desired outcome)

### Requirement: Saved tabs may be global favorites

A `SavedTab`'s `spaceId` field SHALL be `SpaceId | null`. A `spaceId === null` value SHALL be the **decoupled / global** state and SHALL identify the record as a **global favorite**. A favorite's record SHALL be referenced **only** by the flat global placement array `faviconRow: SavedTabId[]` (a sibling to `pinnedBySpace`, never keyed by Space) and SHALL NOT appear in any `pinnedBySpace[spaceId]`. Conversely, a record referenced by `pinnedBySpace` SHALL carry a non-null `spaceId` and SHALL NOT appear in `faviconRow`. A saved tab's record SHALL NOT be duplicated across placements. A favorite SHALL be identified solely by `savedTabs[id].spaceId === null`; there SHALL NOT be a separate "global" flag on the binding registry. The per-window binding model SHALL apply to favorites **uniformly** with pinned tabs — a favorite binds to a live tab per window via `tabBindings[savedTabId][windowId]`, with no separate binding path.

#### Scenario: A favorite is a null-Space record in faviconRow

- **WHEN** a saved tab `f1` is a global favorite
- **THEN** `state.savedTabs['f1'].spaceId` SHALL be `null`
- **AND** `'f1'` SHALL appear in `state.faviconRow`
- **AND** `'f1'` SHALL NOT appear in any `state.pinnedBySpace[spaceId]`

#### Scenario: A bound favorite is tracked without a new registry field

- **WHEN** favorite `f1` is bound to live tab 42 in window 100 (`tabBindings['f1'][100] === 42`)
- **THEN** `isTrackedTab(42)` and `isBound(42)` SHALL report true via the per-window binding slots
- **AND** no field other than `spaceId === null` SHALL distinguish `f1` as global

### Requirement: A favorite's bound tab is ungrouped (global)

Binding a `spaceId === null` favorite to a live tab SHALL leave that live tab **ungrouped** (Chrome group id `-1`), never adopted into any Space's Chrome tab group. This SHALL be an enforced post-condition of binding, applied via a single coordinator path (`ensureFavoriteUngrouped(tabId)`, fronting a `chrome.tabs.ungroup` wrapper) invoked from **every** path that establishes a favorite's binding — opening a dormant favorite, favoriting a live tab, decoupling, and restart rebind. Ungrouping an already-ungrouped tab SHALL be an idempotent no-op. Because an ungrouped tab is never collapsed when other Spaces' groups are hidden, a favorite's live tab SHALL stay visible across every Space switch. On service-worker boot, for each favorite whose restored bound live tab is still inside a Chrome group (`groupId >= 0`), Lunma SHALL ungroup that tab during the boot group-lifecycle reconciliation pass, before any Space switch can collapse it.

#### Scenario: Opening a favorite leaves its tab ungrouped

- **WHEN** the user activates a dormant favorite `f1` (`spaceId === null`) in window 100
- **THEN** a new tab SHALL open at `originalURL`, be bound (`tabBindings['f1'][100]` set), and be left ungrouped (group id `-1`)
- **AND** Lunma SHALL NOT call `addTabToSpaceGroup` for that tab

#### Scenario: Favorite stays visible across a Space switch

- **WHEN** favorite `f1`'s bound tab is ungrouped in window 100 and the user switches the active Space
- **THEN** collapsing the other Spaces' tracked groups SHALL NOT hide `f1`'s tab
- **AND** `f1`'s tab SHALL remain visible

#### Scenario: Restart reconciliation ungroups a favorite restored still-grouped

- **WHEN** SW boots and a favorite's restored bound tab is still inside its old Chrome group (`groupId >= 0`)
- **THEN** the boot reconciliation pass SHALL ungroup that tab
- **AND** a subsequent Space switch SHALL NOT collapse the favorite invisible

### Requirement: Favoriting an open tab is non-destructive

Lunma SHALL provide a `favoriteTab` action that mints a global favorite from a live Chrome tab. When invoked, Lunma SHALL mint a new `SavedTab` from the live tab (`title`, `originalURL`, and `currentURL` taken from the live tab) with `spaceId === null`, insert the new record id into `faviconRow`, bind the new record to that tab id in the tab's window (`tabBindings[<new-id>][windowId] = tabId`), remove the tab id from that window instance's `tempTabIds`, and ungroup the live tab via `ensureFavoriteUngrouped`. The live tab SHALL stay open — favoriting reads as bookmarking, not moving. Favoriting a tab already bound to any saved tab SHALL be a no-op (idempotent).

#### Scenario: Favoriting an open temp tab mints an ungrouped favorite

- **WHEN** the user favorites live tab 42 (title "GitHub", url `https://github.com/`) in window 100, where 42 is a temporary tab in the active Space's group
- **THEN** a new `SavedTab` SHALL exist with `{ spaceId: null, title: 'GitHub', originalURL: 'https://github.com/', currentURL: 'https://github.com/' }`
- **AND** its id SHALL appear in `state.faviconRow` and in no `pinnedBySpace[spaceId]`
- **AND** `tabBindings[<new-id>][100]` SHALL equal 42, and 42 SHALL be removed from `spaceInstancesByWindow[100].tempTabIds` and ungrouped
- **AND** tab 42 SHALL remain open

#### Scenario: Favoriting an already-bound tab is a no-op

- **WHEN** `favoriteTab` targets a tab id already present in any window slot of `tabBindings`
- **THEN** no new `SavedTab` SHALL be created and `faviconRow` SHALL be unchanged

### Requirement: Coupling and decoupling move a saved tab between pinned and favorite

Lunma SHALL provide `favoriteSavedTab` (decouple a pinned tab into a favorite) and `pinSavedTab` (couple a favorite to the active Space). Each SHALL **move** the record between placements — never copy it — so the no-duplicate-placement rule holds. The store SHALL perform the record move (Chrome-free); the coordinator SHALL perform the group/ungroup I/O for every bound window.

- **Decouple** (`favoriteSavedTab`, pinned → favorite): Lunma SHALL set the record's `spaceId = null`, move the record id from `pinnedBySpace[X]` to `faviconRow`, and call `ensureFavoriteUngrouped(tabId)` for each window in which the record is bound.
- **Couple** (`pinSavedTab`, favorite → active Space): Lunma SHALL set the record's `spaceId = activeSpace`, move the record id from `faviconRow` to `pinnedBySpace[activeSpace]`, and call `addTabToSpaceGroup(windowId, activeSpace, tabId)` for each window in which the record is bound.

#### Scenario: Decoupling a pinned tab makes it a global favorite

- **WHEN** the user decouples pinned saved tab `t1` (`spaceId === 'work'`) bound to tab 42 in window 100
- **THEN** `state.savedTabs['t1'].spaceId` SHALL be `null`
- **AND** `'t1'` SHALL be removed from `pinnedBySpace['work']` and present in `faviconRow`
- **AND** tab 42 SHALL be ungrouped, and the record SHALL exist in exactly one placement

#### Scenario: Coupling a favorite pins it to the active Space

- **WHEN** the user couples favorite `f1` (`spaceId === null`) bound to tab 42 in window 100 while "work" is the active Space
- **THEN** `state.savedTabs['f1'].spaceId` SHALL be `'work'`
- **AND** `'f1'` SHALL be removed from `faviconRow` and appended to `pinnedBySpace['work']`
- **AND** tab 42 SHALL be added to window 100's "work" Chrome group, and the record SHALL exist in exactly one placement

### Requirement: Favorite ordering in the favicon row

The store SHALL maintain `faviconRow: SavedTabId[]` — the ordered, flat, global list of favorite `savedTabId`s. Order SHALL be the array order. Lunma SHALL provide a `reorderFavorites` command carrying the post-drop order; the resulting authoritative state broadcast SHALL define the rendered order (no optimistic update is layered on top). `faviconRow` SHALL NOT be keyed by Space and SHALL NOT nest into folders in v1 (flat `SavedTabId[]`).

#### Scenario: Favicon-row order is the array order

- **WHEN** `state.faviconRow` is `['f1', 'f2', 'f3']`
- **THEN** the favicon row SHALL render the favorites as f1, then f2, then f3

#### Scenario: reorderFavorites broadcast is authoritative

- **WHEN** the user drags favorite `f3` ahead of `f1` and `reorderFavorites` dispatches with `['f3', 'f1', 'f2']`
- **THEN** after the SW broadcast, `state.faviconRow` SHALL be `['f3', 'f1', 'f2']`
- **AND** each `SavedTab` record SHALL be left untouched

### Requirement: The favicon row renders favorites as a responsive grid of plated tiles

The sidebar SHALL render the global favicon row as a **responsive grid of plated
`FaviconTile`s** — one per saved-tab id in `state.faviconRow`, in array order (see
Requirement: Favorite ordering in the favicon row) — that **wraps to multiple rows** and
grows vertically (it SHALL NOT scroll horizontally). Each tile is a soft rounded-square
**plate** (a `--surface` fill) showing only the favorite's favicon (no inline title),
derived via the same staged resolution used by tab and pinned rows (see
Requirement: Favicons derive at render via the Chrome favicon endpoint) — the bound
tab's `favIconUrl`, then the Chrome `_favicon` endpoint, then a globe glyph — when the
favicon is missing or fails to load. `FaviconTile` SHALL be a `src/ui/` primitive
composed by the feature component `FaviconRow.svelte`, and SHALL itself compose the
shared `Favicon` primitive (visual-system) for its image/globe slot; none SHALL re-roll
a tile or favicon `<img>` inline. A favorite's title SHALL be reachable on hover
(tooltip), not rendered inline. When `state.faviconRow` is empty, the grid SHALL render
no tiles. (The **selected** favorite — its bound tab is the focused tab in this window —
SHALL fill its plate with the same `--space-c-soft` selection wash a selected tab row
uses.)

#### Scenario: Favorites render as icon-only tiles in array order

- **GIVEN** `state.faviconRow` is `['f1', 'f2', 'f3']` with matching `savedTabs` records
- **WHEN** the sidebar mounts for any window
- **THEN** the favicon row SHALL render three `FaviconTile`s in the order f1, f2, f3
- **AND** each tile SHALL show its favorite's favicon and SHALL NOT render the title inline
- **AND** the favorite's title SHALL be reachable on hover

#### Scenario: A favicon that fails to load falls back through the endpoint to a globe

- **WHEN** a favorite's primary favicon image is missing or errors
- **THEN** its tile SHALL retry the `_favicon` endpoint
- **AND** it SHALL render the globe fallback glyph — identical to a tab row's fallback —
  only when the endpoint also fails

### Requirement: A favorite tile reflects its bound tab's per-window state

Each `FaviconTile` SHALL reflect the per-window binding state of its favorite in the
sidebar's own window, with full parity to a pinned tab (see Requirement: Pinned tabs
and favicon row use the same binding model). The tile SHALL render:

- **bound + idle** when the favorite is bound to a live tab in this window;
- **active** when that bound tab is the focused tab in this window;
- **loading** (the shared spinner) when the bound tab is loading;
- **drift** (the shared per-tab drift indicator + "Off home" affordance) when the bound
  tab's `currentURL !== originalURL` (see Requirement: Drift indicator and affordances);
- **unbound / dormant** when the favorite has no live tab in this window — the tile
  SHALL render dimmed and SHALL NOT show a drift or active treatment (there is no live
  tab to drift or focus).

The bound / active / loading / drift treatments SHALL reuse the SAME visual primitives
the tab rows use for the identical concepts (one shared language across the sidebar);
the exact tokens, timings, and easings are specified in the change's `design.md`
(`Visual language`). Because a favorite binds per window (see the same-binding-model
requirement), a favorite MAY be active in one window and dormant in another at the same
time, and each window's tile SHALL reflect its own window's slot.

#### Scenario: A favorite bound to the focused tab renders active

- **GIVEN** favorite `f1` is bound to tab 42 in window 100 and tab 42 is the focused tab
- **THEN** `f1`'s tile in window 100 SHALL render in the active treatment

#### Scenario: A favorite with no live tab in this window renders dormant

- **GIVEN** favorite `f1` has no binding slot for window 100 (`tabBindings['f1'][100]` is absent)
- **THEN** `f1`'s tile in window 100 SHALL render dimmed (dormant)
- **AND** SHALL NOT render a drift indicator or the active treatment

#### Scenario: A drifted favorite shows the shared drift indicator

- **GIVEN** favorite `f1`'s bound tab in window 100 has navigated so `currentURL !== originalURL`
- **THEN** `f1`'s tile SHALL show the same drift indicator and "Off home" affordance a pinned tab uses

### Requirement: Couple and decouple favorites by direct manipulation

The sidebar SHALL expose drag affordances that move a saved tab between a Space's
pinned list and the global favicon row, and an affordance to favorite a currently-open
tab — each dispatching the corresponding command from the favicon-row binding model
(see Requirement: Coupling and decoupling move a saved tab between pinned and favorite,
and Requirement: Favoriting an open tab is non-destructive). A single global `favicon`
drag zone SHALL register the strip as a horizontal drop target, alongside the existing
`pinned:<spaceId>` and `temp:<windowId>` zones.

- **Decouple:** dragging a pinned tab from a Space's pinned list into the favicon strip
  SHALL dispatch `favoriteSavedTab` for that record.
- **Couple:** dragging a favorite from the strip into a Space's pinned list SHALL
  dispatch `pinSavedTab` for that record (coupling it to the active Space).
- **Reorder:** dragging a favorite within the strip SHALL dispatch `reorderFavorites`
  with the post-drop order.
- **Favorite an open tab:** favoriting an open (temporary) tab SHALL dispatch
  `favoriteTab` and the tab SHALL stay open. This affordance SHALL be available BOTH from
  the temporary row's overflow menu AND by **dragging the temporary tab onto the favicon
  strip** (the drag equivalent of the menu action; the strip's empty-state placeholder
  SHALL light up as the drop target for a temp drag exactly as it does for a pinned
  decouple drag).
- **Remove a favorite:** dragging a favorite **off the grid** SHALL dispatch `unpinTab`
  for that favorite. Removal is the default outcome of a favicon-sourced drag: the ONLY
  two releases that keep the favorite are a drop landing squarely on the grid (reorder)
  or on a Space's pinned list (couple); **every other release removes it** — dropped onto
  the Temporary list, the content area, a Space chip, or released over no drop zone at all
  (`DropResult.outsideAllZones`). This robust off-grid rule replaces an earlier
  `outsideAllZones`-only removal: a densely-tiled sidebar rarely has reachable empty
  space, so "drop it anywhere that isn't the grid or a pinned list" is the discoverable
  drag-out. Removal is non-destructive: a bound favorite's live tab returns to its
  window's Temporary list (it stays OPEN), a dormant one simply leaves the row. The tiles
  SHALL carry no persistent remove chrome.

These affordances SHALL dispatch the commands and SHALL NOT optimistically mutate
placement state; the authoritative `state-broadcast` defines the rendered result (the
same no-optimistic-update discipline as pinned reorder and chip activation).

#### Scenario: Dragging a pinned tab into the strip decouples it

- **WHEN** the user drags a pinned tab `t1` from a Space's pinned list and drops it on the favicon strip
- **THEN** the sidebar SHALL dispatch `favoriteSavedTab` for `t1`
- **AND** SHALL NOT optimistically move `t1` before the broadcast

#### Scenario: Dragging a favorite into a pinned list couples it

- **WHEN** the user drags favorite `f1` from the strip and drops it into the active Space's pinned list
- **THEN** the sidebar SHALL dispatch `pinSavedTab` for `f1`

#### Scenario: Reordering favorites dispatches reorderFavorites

- **WHEN** the user drags favorite `f3` ahead of `f1` within the strip
- **THEN** the sidebar SHALL dispatch `reorderFavorites` with the post-drop order (e.g. `['f3', 'f1', 'f2']`)

#### Scenario: Favoriting an open tab via the row menu keeps it open

- **WHEN** the user selects the favorite action from an open temporary tab's row menu
- **THEN** the sidebar SHALL dispatch `favoriteTab` for that tab
- **AND** the tab SHALL remain open

#### Scenario: Dragging a temporary tab onto the strip favorites it

- **WHEN** the user drags a temporary tab `t1` from the Temporary list and drops it on the favicon strip
- **THEN** the sidebar SHALL dispatch `favoriteTab` for `t1` (it stays open)
- **AND** SHALL NOT dispatch `pinTab` or `reorderTemp` (it is a favorite, not a pin or a reorder)
- **AND** SHALL NOT optimistically mutate placement before the broadcast

#### Scenario: Dragging a favorite out of the row removes it (non-destructive)

- **WHEN** the user drags favorite `f1` clean out of the favicon row and releases it over no drop zone
- **THEN** the sidebar SHALL dispatch `unpinTab` for `f1`
- **AND** SHALL NOT dispatch `reorderFavorites` (the drag-out is a removal, not an in-strip move)
- **AND** SHALL NOT optimistically remove `f1` before the broadcast

#### Scenario: Dropping a favorite onto a non-grid zone removes it

- **GIVEN** the densely-tiled grid leaves no reachable empty space to release over
- **WHEN** the user drags favorite `f1` and releases it onto the Temporary list, the content area, or a Space chip (any zone that is neither the favicon grid nor a Space's pinned list)
- **THEN** the sidebar SHALL dispatch `unpinTab` for `f1` (the off-grid release is a removal)
- **AND** SHALL NOT dispatch `reorderFavorites` or `pinSavedTab`

### Requirement: A favorite tile exposes a right-click context menu

Right-clicking (the context-menu gesture) a `FaviconTile` SHALL open a `ContextMenu`
primitive anchored at the cursor and SHALL suppress the native browser context menu.
At parity with the pinned-row menu (see the `tab-row-menu` capability), the menu SHALL
offer:

- **Go to tab** (or **Open** when the favorite is dormant in this window) — focus the
  bound tab, or open the favorite, the same outcome as a left-click;
- **Go home** and **Make this home** — shown ONLY when the favorite is drifted
  (`currentURL !== originalURL`), dispatching `goHome` / `makeThisHome`;
- **Copy link** — copy the favorite's current URL to the clipboard (best-effort);
- **Lock to its site…** — a drill-in that morphs the menu in place (a back-arrow header
  + the boundary editor) WITHOUT closing it, so the user can widen or relax the lock
  (see Requirement: A bound saved tab MAY be confined to a domain boundary);
- **Remove from favorites** — dispatch `unpinTab` (non-destructive: a bound tab returns
  to Temporary and stays open);
- **Delete** — a destructive `deleteSavedTab` that removes the record entirely and
  closes its bound live tab.

The menu SHALL be the shared `src/ui/ContextMenu.svelte` primitive composed by the
feature component `FaviconRow.svelte` (one instance, opened at the right-clicked tile's
cursor position); neither SHALL re-roll a menu inline. Right-click removal exists because
drag-out alone proved undiscoverable.

#### Scenario: Right-clicking a favorite opens the menu and suppresses the native one

- **WHEN** the user right-clicks a favorite tile
- **THEN** the sidebar SHALL open the favorite context menu anchored at the cursor
- **AND** SHALL suppress the browser's native context menu

#### Scenario: Remove from favorites dispatches unpinTab

- **WHEN** the user selects **Remove from favorites** from a favorite's context menu
- **THEN** the sidebar SHALL dispatch `unpinTab` for that favorite (non-destructive)

#### Scenario: Delete removes the favorite record

- **WHEN** the user selects **Delete** from a favorite's context menu
- **THEN** the sidebar SHALL dispatch `deleteSavedTab` for that favorite

#### Scenario: Go home and Make this home appear only when drifted

- **GIVEN** a favorite whose bound tab has not drifted (`currentURL === originalURL`)
- **THEN** its context menu SHALL NOT offer **Go home** or **Make this home**
- **WHEN** that favorite's bound tab drifts off home (`currentURL !== originalURL`)
- **THEN** its context menu SHALL offer **Go home** (dispatch `goHome`) and **Make this home** (dispatch `makeThisHome`)

#### Scenario: Lock to its site drills in without closing the menu

- **WHEN** the user selects **Lock to its site…** from a favorite's context menu
- **THEN** the menu SHALL drill into the boundary editor in place (a back-arrow header over the allow-list editor)
- **AND** SHALL NOT close the menu
- **AND** the back-arrow SHALL return to the favorite's action list

### Requirement: A selected global favorite keeps focus across Space switches

A selected global favorite SHALL keep focus and stay visible across a Space switch.
Because it belongs to no Space (`spaceId === null`, ungrouped — see the
same-binding-model requirement), switching Space SHALL NOT move browser focus off a
selected global favorite, and SHALL NOT spawn a blank tab in an empty incoming Space
to land focus on. The sidebar and favicon strip still reflect the new active Space
(its pinned/temp lists, its hue), but the global favorite remains on-screen until the
user explicitly enters the new Space (e.g. clicks one of its tabs, or opens a New Tab
in it). This applies ONLY to a selected global favorite and ONLY to the switch
gesture; a regular (Space-bound) selected tab is displaced normally when its Space is
left. The activation mechanics live in the `spaces-and-tabs` capability — its Space
tab-group orchestration contract, activation sequence point 1b.

#### Scenario: Switching Space while a favorite is selected keeps the favorite on-screen

- **GIVEN** the window's selected tab is a global favorite's live tab and the user activates a different Space
- **THEN** the favorite SHALL remain the selected, visible tab (focus is not moved into the new Space)
- **AND** an empty incoming Space SHALL NOT spawn a blank tab
- **AND** the sidebar SHALL still show the newly-activated Space as active

#### Scenario: Switching Space while a regular tab is selected behaves normally

- **GIVEN** the window's selected tab is an ordinary Space-bound tab (not a global favorite)
- **WHEN** the user activates a different Space
- **THEN** focus SHALL move into the newly-activated Space (the prior, unchanged behaviour)

