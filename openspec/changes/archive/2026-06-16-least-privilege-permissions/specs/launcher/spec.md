## MODIFIED Requirements

### Requirement: Shared search engine and data providers

The launcher SHALL provide a single search engine in `apps/extension/src/launcher/shared/` that
runs **in the service worker** and merges results from up to four data providers. The
engine SHALL be a pure function of its inputs (query string + injected data
sources) with no surface-specific state. The four providers SHALL be:

- **open tabs** — from `chrome.tabs.query({})`, EXCLUDING the active window's
  active tab; each result carries its `tabId` and `windowId`.
- **saved tabs** — from `LunmaStore.state.savedTabs` (pinned + favicon-row records);
  each result carries its `savedTabId` and is matched on `title` and
  `currentURL ?? originalURL`. When the saved tab is **bound to a live tab**
  (`state.tabBindings[savedTabId]` is a tab id), the result ALSO carries that
  `tabId`; its presence is the signal a surface uses to choose `focusSavedTab`
  over `openSavedTab` without itself reading bindings (so the stateless `Alt+L`
  overlay can decide from the result alone).
- **bookmarks** — the service-worker handler
  (`background/launcher-suggestions-handler.ts`) SHALL call
  `chrome.bookmarks.search(query)` **only when `hasApiPermission('bookmarks')`**
  (from `shared/permissions.ts`) is true; when it is not granted the handler
  SHALL skip the call and pass an empty set to the (pure) bookmarks provider,
  which then contributes nothing.
- **history** — the handler SHALL call
  `chrome.history.search({ text: query, maxResults: 100 })` **only when
  `hasApiPermission('history')`** is true; when it is not granted the handler
  SHALL skip the call and pass an empty set to the (pure) history provider.

The launcher's data providers under `launcher/shared/` remain pure functions
over their injected arrays; the permission gate is the **service-worker
handler's** responsibility, not the providers'. The engine SHALL merge whichever
providers have data; an ungranted optional source is simply absent and SHALL NOT
be treated as an error (the open-tabs and saved-tabs sources always run). A `LauncherResult` SHALL carry
at least `{ id, source: 'tab' | 'saved' | 'bookmark' | 'history' | 'websearch'
| 'navigate', title, url, score }` plus the source-specific action fields
(`tabId`/`windowId` for `tab`, `savedTabId` for `saved`). The `'websearch'` and
`'navigate'` sources are **synthesized action results** (see "Synthesized
web-search and navigation results"), not produced by any of the four providers;
each carries a pre-built `url`. An **empty/whitespace query SHALL return no
results.**

#### Scenario: The engine queries all granted sources

- **WHEN** the engine runs a non-empty query with `history` and `bookmarks` granted
- **THEN** it SHALL consult the open-tabs, saved-tabs, bookmarks, and history
  providers and return a single merged result list
- **AND** it SHALL exclude the active window's active tab from the open-tabs results

#### Scenario: An ungranted optional provider is omitted, not failed

- **GIVEN** the `history` permission is not granted
- **WHEN** the engine runs a non-empty query
- **THEN** it SHALL NOT call `chrome.history.*`, SHALL return results from the remaining providers (open tabs, saved tabs, and bookmarks if granted), and SHALL NOT surface an error

#### Scenario: An empty query yields no results

- **WHEN** the engine runs with an empty or whitespace-only query
- **THEN** it SHALL return an empty result list (the surfaces show their idle state)

## ADDED Requirements

### Requirement: The launcher offers to enable ungranted result sources

The launcher SHALL surface a calm inline affordance to enable an ungranted
optional result source (`history` or `bookmarks`) — "Enable history results" /
"Enable bookmark results" — rather than silently hiding the capability. The
service-worker handler SHALL report which optional sources are ungranted via the
`SuggestionsResult.ungrantedSources` field, so both surfaces — and especially the
stateless overlay, which cannot query `chrome.permissions` itself — know which
affordances to render. On the **new-tab launcher surface** (an extension page)
the affordance SHALL be composed from the existing primitives (never a re-rolled
control) and SHALL call `requestApiPermission(name)` directly. In the **Alt+L
overlay** (a content script with no Svelte runtime and a hard gzip budget, which
cannot access `chrome.permissions`) the affordance SHALL be rendered in the
overlay's existing vanilla-DOM idiom and SHALL open the options page to the grant
location — the options **Result sources** section (`#result-sources`) — via a
`lunma/open-options-grant` service-worker message. On grant, `onPermissionsChange`
SHALL cause the open launcher to re-query so the newly available results appear
without a manual reload.

#### Scenario: Enabling history from the new-tab launcher is inline

- **GIVEN** the new-tab launcher with `history` not granted
- **WHEN** the user activates "Enable history results"
- **THEN** the surface SHALL call `requestApiPermission('history')` in the click handler
- **AND** on grant the launcher re-queries and history results appear without a reload

#### Scenario: The overlay routes enabling to the options page

- **GIVEN** the Alt+L overlay with `bookmarks` not granted
- **WHEN** the user activates "Enable bookmark results"
- **THEN** the options page SHALL open to the grant location (the overlay SHALL NOT call `chrome.permissions.request`)
