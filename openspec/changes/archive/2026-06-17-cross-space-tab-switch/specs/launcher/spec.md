# launcher Specification — delta for cross-space-tab-switch

## MODIFIED Requirements

### Requirement: Acting on a launcher result

Selecting a result SHALL dispatch through the existing typed message bus, never by
mutating Lunma state directly:

- a `tab` result SHALL dispatch `focusTab { tabId }`;
- a `saved` result SHALL dispatch `focusSavedTab` when the saved tab is bound to a
  live tab (i.e. the result carries a `tabId`), else `openSavedTab`;
- a `smart`, `bookmark`, `history`, `websearch`, or `navigate` result SHALL
  dispatch `openUrl { url, windowId }` on a plain Enter press (primary action). A
  smart-folder item is link-shaped (a pre-built `url`, no binding), so it reuses
  this branch and requires **no new dispatch logic** in either surface's `act()` —
  exactly like a bookmark/history result;
- a `smart`, `bookmark`, `history`, `websearch`, or `navigate` result whose URL is
  already open in the active Space (detected by `isUrlOpenInActiveSpace`) SHALL
  dispatch `openUrl { url, windowId, force: true }` when Shift+Enter is pressed
  (secondary action — force a new tab regardless of dedup).

Cross-reference (non-normative): when a selected `saved` result is **coupled**
(carries a non-null `spaceId`) and its owning Space differs from the requesting
window's active Space — the cross-Space marker case — the dispatched
`openSavedTab`/`focusSavedTab` switches the window to that Space as part of
activation, so the opened/focused tab is visible in its now-active group. This is
emergent behaviour of the `lunma-bookmark-bindings` handlers
(`background/handlers/pinned-tabs.ts`), **not** a new launcher dispatch — the
launcher keeps sending the same two commands. Favicon-row favorites (no `spaceId`)
and `smart`/`tab`/`bookmark`/`history` results never switch the window's Space.

`isUrlOpenInActiveSpace(state, windowId, url): boolean` is a pure helper in
`apps/extension/src/launcher/shared/already-open.ts` that mirrors the logic of
`findTabInActiveSpace` in `handlers/queries.ts` (same scope: current window, active
Space, exact URL, temp + pinned tabs). The one-way import DAG forbids `launcher/`
from importing `background/`, so the scan is re-stated rather than shared.

The two launcher surfaces detect "already open" differently because their access to
state differs:

- the **new-tab surface** holds a read-only `AppState` mirror and calls
  `isUrlOpenInActiveSpace(state, windowId, url)` directly per row;
- the **in-page overlay is stateless** (no `AppState`), so the suggestions response
  carries `openUrls?: string[]` — the subset of `results[].url` the SW computed as
  already open (via the same helper, over dedup-eligible sources only) — and the
  overlay flags a row by membership. `SuggestionsResult` and
  `LauncherSuggestionsResponseMessage` carry this optional field.

#### Scenario: Selecting an open-tab result focuses that tab

- **WHEN** the user acts on a `tab` result for tab 22
- **THEN** the surface SHALL dispatch `bus.send({ kind: 'focusTab', payload: { tabId: 22 } })`

#### Scenario: Selecting a bookmark result opens its URL

- **WHEN** the user acts on a `bookmark` result for `https://example.com/` in window 100
- **THEN** the surface SHALL dispatch `bus.send({ kind: 'openUrl', payload: { url: 'https://example.com/', windowId: 100 } })`

#### Scenario: Selecting a smart-folder result opens its URL

- **WHEN** the user acts on a `smart` result for `https://github.com/o/r/pull/12` in window 100
- **THEN** the surface SHALL dispatch `bus.send({ kind: 'openUrl', payload: { url: 'https://github.com/o/r/pull/12', windowId: 100 } })`

#### Scenario: Selecting a dormant saved tab opens it, a bound one focuses it

- **WHEN** the user acts on a `saved` result whose saved tab is dormant
- **THEN** the surface SHALL dispatch `openSavedTab`
- **WHEN** the saved tab is bound to a live tab
- **THEN** the surface SHALL dispatch `focusSavedTab`

#### Scenario: Selecting the web-search action opens the search URL

- **WHEN** the user acts on a `websearch` result whose `url` is
  `https://www.google.com/search?q=react%20hooks` in window 100
- **THEN** the surface SHALL dispatch `openUrl { url: 'https://www.google.com/search?q=react%20hooks', windowId: 100 }`

#### Scenario: Selecting the go-to action navigates to the URL

- **WHEN** the user acts on a `navigate` result whose `url` is `https://react.dev` in window 100
- **THEN** the surface SHALL dispatch `openUrl { url: 'https://react.dev', windowId: 100 }`

#### Scenario: Shift+Enter on an already-open result forces a new tab

- **GIVEN** a `navigate` result for `https://example.com/` whose URL is already open in the active Space
- **WHEN** the user presses Shift+Enter on that result
- **THEN** the surface SHALL dispatch `openUrl { url: 'https://example.com/', windowId, force: true }`
- **AND** the handler SHALL create a new tab regardless of the existing open tab
