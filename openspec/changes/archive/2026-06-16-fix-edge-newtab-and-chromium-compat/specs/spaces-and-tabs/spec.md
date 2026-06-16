## MODIFIED Requirements

### Requirement: Lunma new-tab page is the empty-Space home

Lunma SHALL own the browser's new-tab page via `chrome_url_overrides.newtab` →
`apps/extension/src/launcher/newtab/index.html`, so every tab opened without an explicit URL
(entering an empty Space, the window-can't-be-empty tab Chrome spawns after Clear
or closing the last tab, or a user `Cmd+T`) renders Lunma's page. The page SHALL
render the **active Space's home** for its own window: it resolves its window
(`chrome.windows.getCurrent`), reads SW state through the existing
`state-request` / `state-broadcast` path (read-only — it dispatches no command and
mutates no state, like the sidebar), and displays the window's active Space
identity (name, icon, colour). It SHALL render a calm, identity-first surface (no
loading flash — an unresolved active Space shows a neutral home until the next
broadcast). The full launcher search is out of scope (deferred to `launcher-v1`);
any search affordance on this page is a non-functional placeholder.

A tab whose live URL is the new-tab page (recognised by `isNewTabUrl(url)`) is a
**home tab** — a transient property of the live tab, never persisted. Because each
Chromium fork namespaces its internal pages under its own scheme, `isNewTabUrl`
SHALL match the host browser's own internal new-tab URL across forks —
`chrome://newtab`, `edge://newtab`, or `brave://newtab` (each with an optional
trailing slash, query, or hash) — AND the extension's resolved newtab URL
(`chrome.runtime.getURL(NEWTAB_PAGE_PATH)`). This recognises a fresh tab BOTH
during the transient window when the browser reports its own internal scheme (e.g.
`edge://newtab/` on Edge before the override resolves) AND after it resolves to the
`chrome-extension://` override page. `isNewTabUrl` SHALL NOT match sibling internal
pages (e.g. `chrome://settings`, `edge://settings`) or real web URLs. When the user
navigates a home tab to a real URL it ceases to be a home tab.

#### Scenario: The new-tab page renders the active Space's home

- **GIVEN** window 100's active Space is "Work" (blue, icon `briefcase`)
- **WHEN** a new tab opens in window 100 and renders the Lunma new-tab page
- **THEN** the page SHALL display "Work"'s name, icon, and colour
- **AND** it SHALL dispatch no command and mutate no Lunma state

#### Scenario: A navigated-away home tab stops being a home tab

- **GIVEN** a home tab (URL `chrome://newtab/`) in Space "Work"
- **WHEN** the user navigates it to `https://example.com/`
- **THEN** `isNewTabUrl` SHALL no longer match it and it SHALL be treated as an ordinary tab

#### Scenario: An Edge new tab is recognised as a home tab in its internal-scheme window

- **GIVEN** on a non-Chrome Chromium fork a fresh tab opens against the `chrome_url_overrides.newtab` override and `tabs.onCreated` reports its URL as `edge://newtab/` (Edge) or `brave://newtab/` (Brave) before it resolves to the `chrome-extension://` page
- **THEN** `isNewTabUrl('edge://newtab/')` and `isNewTabUrl('brave://newtab/')` SHALL each be true
- **AND** the tab SHALL be treated as a home tab — grouped into the active Space and NOT added to `tempTabIds`
- **AND** `isNewTabUrl('edge://settings/')` SHALL be false (a sibling internal page is not a home tab)

#### Scenario: A window whose only tab is a home tab still tracks its active Space

- **GIVEN** at boot a window whose only open tab is a home tab
- **THEN** the boot pass SHALL still create the window's active-Space instance (so later-created tabs are adopted + grouped — the home tab being the only tab SHALL NOT leave the Space untracked)
- **AND** the boot reconciliation SHALL group that lone home tab into the active Space (the active Space's group materializes from its home tab), rather than leaving an ungrouped home tab

#### Scenario: Boot groups ALL home tabs in the window (none orphaned)

- **GIVEN** at boot a window with more than one home tab
- **THEN** the boot reconciliation SHALL group EVERY home tab in the window into the active Space — none SHALL be left ungrouped outside the group
- **AND** a stray home tab present alongside an already-live active-Space group SHALL be swept into that group

#### Scenario: A stale persisted group id still materializes at boot

- **GIVEN** the active Space's persisted `groupId` no longer resolves to a live Chrome group (e.g. dissolved across the restart)
- **WHEN** the boot reconciliation runs
- **THEN** it SHALL treat the stale id as "no live group" and materialize a fresh group from the Space's tabs (real + home), rather than skip materialization and leave the tabs ungrouped
