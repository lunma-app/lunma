# launcher Specification — delta for launcher-fuzzy-smart-folders

## MODIFIED Requirements

### Requirement: Shared search engine and data providers

The launcher SHALL provide a single search engine in `apps/extension/src/launcher/shared/` that
runs **in the service worker** and merges results from **five** data providers. The
engine SHALL be a pure function of its inputs (query string + injected data
sources) with no surface-specific state. The five providers SHALL be:

- **open tabs** — from `chrome.tabs.query({})`, EXCLUDING the active window's
  active tab; each result carries its `tabId` and `windowId`.
- **saved tabs** — from `LunmaStore.state.savedTabs` (pinned + favicon-row records);
  each result carries its `savedTabId` and is matched on `title` and
  `currentURL ?? originalURL`. When the saved tab is **bound to a live tab**
  (`state.tabBindings[savedTabId]` is a tab id), the result ALSO carries that
  `tabId`; its presence is the signal a surface uses to choose `focusSavedTab`
  over `openSavedTab` without itself reading bindings (so the stateless `Alt+L`
  overlay can decide from the result alone). When the saved tab is placed in a
  regular `folder` node, the result ALSO carries that folder's name as
  `folderName`, a matchable field (see Requirement: Result de-duplication,
  scoring, and ordering). When the saved tab is **pinned** (non-null `spaceId`),
  the result ALSO carries that `spaceId` (its owning Space, for the current-Space
  scope — see Requirement: Launcher Space scope); a favicon-row favorite
  (`spaceId === null`) is global and carries none.
- **smart-folder items** — from `LunmaStore.state.smartFolders` (the ephemeral,
  broadcast-only connector-results slice), flattening **every** smart folder's
  `items` across **all** sources (GitLab, GitHub, Jira, RSS). Each item is
  link-shaped (`{ id, title, url, status? }`) and maps to a result with
  `source: 'smart'`, carrying no binding and no `tabId`/`savedTabId`, plus the
  smart folder's name as `folderName` and the smart folder's owning Space as
  `spaceId` (for the current-Space scope — see Requirement: Launcher Space scope).
  Items SHALL be taken regardless of the folder's runtime `state` — a `pending`
  refresh keeps last-known items (so they remain matchable and never blink out),
  while `signed-out`/`error` carry none and contribute nothing.
- **bookmarks** — from `chrome.bookmarks.search(query)`.
- **history** — from `chrome.history.search({ text: query, maxResults: 100 })`.

A `LauncherResult` SHALL carry at least `{ id, source: 'tab' | 'saved' | 'smart' |
'bookmark' | 'history' | 'websearch' | 'navigate', title, url, score }` plus the
source-specific action fields (`tabId`/`windowId` for `tab`, `savedTabId` for
`saved`) and an OPTIONAL `folderName` (set for a `saved` result placed in a folder
and for every `smart` result) and an OPTIONAL `spaceId` (the owning Space — set
for a pinned `saved` result and every `smart` result; absent for global
favicon-row favorites and `tab`/`bookmark`/`history`) and OPTIONAL
`spaceName`/`spaceColor` (a **cross-Space marker** — set by the engine ONLY when
the result's owning Space differs from the requesting window's active Space; see
Requirement: Launcher Space scope). The `'smart'` source drives the result-row source
badge via the existing `sourceBadgeLabel` (the badge reads `smart`) and acts
through `openUrl` (see Requirement: Acting on a launcher result). The `'websearch'`
and `'navigate'` sources are **synthesized action results** (see "Synthesized
web-search and navigation results"), not produced by any of the five providers;
each carries a pre-built `url`. An **empty/whitespace query SHALL return no
results.**

#### Scenario: The engine queries all five sources

- **WHEN** the engine runs a non-empty query
- **THEN** it SHALL consult the open-tabs, saved-tabs, smart-folder-items,
  bookmarks, and history providers and return a single merged result list
- **AND** it SHALL exclude the active window's active tab from the open-tabs results

#### Scenario: Smart-folder items are searchable

- **GIVEN** a smart folder named "Work PRs" holds a connector item titled
  "Fix the parser" at `https://github.com/o/r/pull/12`
- **WHEN** the engine runs a query matching that title
- **THEN** the merged list SHALL include a result with `source: 'smart'`, that
  title and URL, carrying `folderName: "Work PRs"`

#### Scenario: An empty query yields no results

- **WHEN** the engine runs with an empty or whitespace-only query
- **THEN** it SHALL return an empty result list (the surfaces show their idle state)

### Requirement: Result de-duplication, scoring, and ordering

The engine SHALL de-duplicate results that share a URL with this precedence:
**open tab > saved tab > smart-folder item > bookmark > history** (the
higher-precedence result is kept, the lower suppressed). It SHALL score each
surviving result **deterministically** by **fuzzy, typo-tolerant** matching of the
query against the result's `title`, `url`, and (when present) `folderName`,
combined with field weight (title over url; folderName no greater than url) and
source weight (tab > saved > smart > bookmark > history), and SHALL return results
sorted by score descending with a stable tie order (insertion order = source
precedence breaks ties). Matching SHALL be subsequence-based and tolerant of a
single per-term typo, SHALL still rank an exact prefix above a word-boundary match
above a scattered match, and SHALL drop any candidate the query does not match at
all (score 0). The fuzzy matcher MAY be backed by a library (uFuzzy); the scoring
module runs **only in the service worker** and SHALL NOT be imported by the `Alt+L`
overlay content script, so the overlay's no-Svelte/`<15KB` bundle budget is
unaffected. History results SHALL retain a mild recency boost capped below the
smallest source gap (it reorders history among itself but never flips source
ordering). The merged list SHALL be capped to a fixed maximum; when results are
truncated the engine SHALL emit a `log` line (never a silent cap).

This de-duplication, scoring, and cap apply to the **five-provider (data) results**
only. The **synthesized action results** (`websearch`/`navigate`) SHALL NOT be
scored, SHALL NOT be de-duplicated against data results, and SHALL NOT count
against the cap; they occupy fixed positions ahead of the data results (websearch
first, then navigate) per "Synthesized web-search and navigation results".

Folders themselves SHALL NOT be emitted as results — a `folder` or `smart` node's
name only widens what its child results match against; there is no folder result
row and no folder-activation action.

#### Scenario: A URL open as a tab suppresses its history entry

- **GIVEN** `https://example.com/` is both an open tab and a history entry matching the query
- **WHEN** the engine merges results
- **THEN** the list SHALL contain the open-tab result for that URL and SHALL NOT contain a duplicate history result for it

#### Scenario: A saved tab suppresses its bookmark duplicate

- **GIVEN** `https://example.com/` is both a Lunma saved tab and a Chrome bookmark matching the query
- **WHEN** the engine merges results
- **THEN** the list SHALL contain the saved-tab result and SHALL NOT contain a duplicate bookmark result

#### Scenario: A smart item suppresses its bookmark duplicate

- **GIVEN** `https://github.com/o/r/pull/12` is both a smart-folder item and a Chrome bookmark matching the query
- **WHEN** the engine merges results
- **THEN** the list SHALL contain the smart-folder (`source: 'smart'`) result and SHALL NOT contain a duplicate bookmark result for that URL

#### Scenario: Fuzzy subsequence matching finds a non-contiguous query

- **GIVEN** a result titled "PRs: fix parser"
- **WHEN** the user types `prsfix`
- **THEN** the engine SHALL match that result (the query characters occur in order)
- **AND** a result whose title/url/folderName the query cannot be threaded through SHALL score 0 and be dropped

#### Scenario: A single-character typo still matches

- **GIVEN** a result titled "Receive webhook"
- **WHEN** the user types `recieve`
- **THEN** the engine SHALL still match that result

#### Scenario: A result matches the name of its folder

- **GIVEN** a saved tab "Standup doc" placed in a regular folder named "Work", and a smart item placed in a smart folder named "Work PRs"
- **WHEN** the user types `work`
- **THEN** the engine SHALL include both results, each matched via its `folderName`, even though neither result's title nor url contains "work"
- **AND** no "Work" / "Work PRs" folder row SHALL appear in the results

#### Scenario: An exact prefix outranks a scattered fuzzy match

- **GIVEN** two same-source results, one whose title begins with the query and one where the query matches only as scattered subsequence characters
- **WHEN** both are scored for the same query
- **THEN** the prefix match SHALL score higher than the scattered match

#### Scenario: Results are ordered by score, capped, and truncation is logged

- **WHEN** more matches exist than the result cap
- **THEN** the returned list SHALL be the highest-scored results in descending score order, no longer than the cap
- **AND** a `log` line SHALL record that results were truncated

#### Scenario: Synthesized action results are not capped

- **GIVEN** the provider results already fill the `MAX_RESULTS` cap
- **WHEN** the response is composed for a non-empty query
- **THEN** the `websearch` (and any `navigate`) action result SHALL still be present
  beyond the cap, and SHALL NOT displace a scored data result

### Requirement: Acting on a launcher result

Selecting a result SHALL dispatch through the existing typed message bus, never by
mutating Lunma state directly:

- a `tab` result SHALL dispatch `focusTab { tabId }`;
- a `saved` result SHALL dispatch `focusSavedTab` when the saved tab is bound to a
  live tab (i.e. the result carries a `tabId`), else `openSavedTab`;
- a `smart`, `bookmark`, `history`, `websearch`, or `navigate` result SHALL
  dispatch `openUrl { url, windowId }`. A smart-folder item is link-shaped (a
  pre-built `url`, no binding), so it reuses this branch and requires **no new
  dispatch logic** in either surface's `act()` — exactly like a bookmark/history
  result.

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

## ADDED Requirements

### Requirement: Launcher Space scope

The launcher SHALL honour a single global user setting **`launcherScope`** (in the
settings registry's `Search` group; default `prefer-current-space`) that governs
how results owned by a Space relate to the **requesting window's active Space**
(`activeSpaceByWindow[windowId]`). Only Space-placed Lunma results carry an owning
`spaceId` — a pinned `saved` result and every `smart` result; global rows (open
tabs, bookmarks, history, favicon-row favorites, and the synthesized actions)
carry none and are NEVER down-ranked or filtered by scope. The three modes:

- **`global`** — results are ranked purely by match strength and source weight;
  the active Space has no effect.
- **`prefer-current-space`** (default) — a result whose `spaceId` equals the
  active Space SHALL receive a bounded **current-Space scoring boost** (additive,
  alongside the history-recency term), so in-Space results surface above their
  cross-Space peers while **everything remains reachable**. The boost MAY raise an
  in-Space result above a higher-source cross-Space one (that is its purpose); it
  SHALL NOT resurrect a non-matching candidate (a score-0 result stays dropped).
- **`current-space-only`** — Space-placed Lunma results whose owning Space differs
  from the active Space SHALL be **excluded** from the merged list; in-Space
  Space-placed results and all global rows (including favicon-row favorites)
  remain. When the window has **no** active Space, this mode SHALL behave as
  `global` (no items are hidden).

Scope is resolved **service-worker-side** in the suggestions handler; the setting
reads from the settings registry and the active Space from store state. No new
message field is required.

Independently of the scope **mode**, any result that survives to the merged list
whose owning Space differs from the active Space SHALL carry a **cross-Space
marker** — `spaceName` (the foreign Space's name) and `spaceColor` (its canonical
Space colour as a paintable value) — so a surface renders a "lives in another
Space" affordance from the result alone; in-active-Space and global rows carry no
marker. When the window has no active Space, no result is marked. (In
`current-space-only` the cross-Space rows are already excluded, so none are
marked.)

#### Scenario: Global scope ignores the active Space

- **GIVEN** `launcherScope` is `global`, the active Space is "Work", and two smart
  items match a query equally — one in "Work", one in "Home"
- **WHEN** the engine scores them
- **THEN** both SHALL appear and SHALL receive equal scores (no current-Space boost)

#### Scenario: Prefer-current-space boosts the in-Space result

- **GIVEN** `launcherScope` is `prefer-current-space`, the active Space is "Work",
  and two equally-matching same-source smart items — one in "Work", one in "Home"
- **WHEN** the engine scores them
- **THEN** the "Work" item SHALL score higher than the "Home" item
- **AND** the "Home" item SHALL still be present (reachable)

#### Scenario: Current-space-only hides cross-Space items but keeps globals

- **GIVEN** `launcherScope` is `current-space-only` and the active Space is "Work"
- **WHEN** the engine merges results
- **THEN** a `smart` item or pinned `saved` result owned by "Home" SHALL be excluded
- **AND** a favicon-row favorite, open tab, bookmark, or history result matching
  the query SHALL still be included

#### Scenario: A cross-Space item is marked; an in-Space one is not

- **GIVEN** the active Space is "Work" and `launcherScope` is `prefer-current-space`
  (or `global`), with a matching smart item in "Work" and another in "Home"
- **WHEN** the engine returns the merged list
- **THEN** the "Home" result SHALL carry `spaceName: "Home"` and a `spaceColor`
- **AND** the "Work" result SHALL carry neither (no marker for an in-Space row)
