## MODIFIED Requirements

### Requirement: The manifest grants least privilege at install, the rest at runtime

The extension manifest SHALL request at install only the permissions the core
workspace needs, and SHALL declare the rest as optional, granted at runtime.

- Required `permissions`: `tabs`, `tabGroups`, `storage`, `sidePanel`, `alarms`,
  `scripting`, `commands`. The three `content_scripts`
  (`src/launcher/overlay.ts`, `src/content/tab-boundary.ts`, `src/content/tab-token.ts`) SHALL remain on
  `<all_urls>` at `document_start` (load-bearing — the launcher must be
  summonable on any page and the pinned-tab boundary must catch clicks before
  navigation).
- `host_permissions` SHALL NOT include `<all_urls>` (or any blanket host).
- `optional_permissions` SHALL include `history` and `bookmarks`, `webNavigation`.
- `optional_host_permissions` SHALL include the known connector SaaS hosts
  (`https://github.com/*`, `https://api.github.com/*`, `https://gitlab.com/*`,
  `https://api.bitbucket.org/*`, `https://*.atlassian.net/*`) AND the self-hosted
  fallback patterns `https://*/*` and `http://*/*`, so an arbitrary user-entered
  connector `baseUrl` — including a Bitbucket Server / Data Center host — can be
  requested at runtime.
- The `favicon` permission SHALL be removed unless a verification step
  demonstrates that `tab.favIconUrl` and the `_favicon/*` web-accessible path
  stop resolving without it on the supported Chrome floor; if it is retained,
  the reason SHALL be recorded in `design.md`.

#### Scenario: The install prompt does not ask for all-sites or browsing data

- **WHEN** a user installs the extension
- **THEN** the install prompt SHALL NOT request access to all websites, browsing
  history, or bookmarks
- **AND** the manifest's `host_permissions` SHALL NOT contain `<all_urls>`

#### Scenario: Optional capabilities are declared but not granted at install

- **WHEN** the manifest is inspected after install
- **THEN** `history` and `bookmarks` SHALL appear under `optional_permissions`
  and SHALL NOT be granted until requested
- **AND** the connector hosts SHALL appear under `optional_host_permissions`

#### Scenario: The Bitbucket Cloud API host is requestable at runtime

- **WHEN** a user connects a Bitbucket Cloud account and creates a lens on it
- **THEN** `https://api.bitbucket.org/*` SHALL appear under `optional_host_permissions`
  and be requested via a user-gesture-bound `requestHostPermissions`
- **AND** a Bitbucket Server host SHALL be requestable via the `https://*/*` fallback pattern

#### Scenario: The favicon permission is resolved by verification, not assumption

- **WHEN** the built extension is loaded without the `favicon` permission on the
  supported Chrome floor
- **THEN** if `tab.favIconUrl` and `_favicon/*` still resolve, `favicon` SHALL be
  absent from the manifest; otherwise it SHALL be retained with the reason
  recorded in `design.md`

`webNavigation` is requested only from the `trackTabProvenance` toggle, inside the
user gesture. It is REQUIRED rather than convenient: an external application
handoff commits with a live `openerTabId` pointing at an unrelated tab, and
`transitionType` — available only through `chrome.webNavigation` — is the only
signal that distinguishes it. `src/content/tab-token.ts` declares the same
`matches` patterns as the other two scripts and stays dormant until messaged.

#### Scenario: webNavigation is optional, never installed-time

- **WHEN** `public/manifest.json` is read
- **THEN** `webNavigation` SHALL appear in `optional_permissions` and SHALL NOT appear in `permissions`

### Requirement: A single foundation module gates chrome.permissions

All `chrome.permissions` access SHALL go through one foundation module
`apps/extension/src/shared/permissions.ts`. It SHALL be a thin, typed wrapper
carrying no policy beyond origin-pattern derivation, and SHALL export:
`hasApiPermission(name)`, `requestApiPermission(name)` for
`name: 'history' | 'bookmarks' | 'webNavigation'`; `hasHostPermissions(origins: string[])` (true
only when **every** origin in the set is granted) and
`requestHostPermissions(origins: string[])`; `originPatternForBaseUrl(baseUrl)`
(which returns `new URL(baseUrl).origin + '/*'`); and
`onPermissionsChange(listener)` wrapping `chrome.permissions.onAdded`/`onRemoved`
and returning an unsubscribe. The module SHALL NOT export programmatic removal
(revocation is observed via `onPermissionsChange`, never initiated by Lunma).
No other module SHALL call `chrome.permissions.*` directly.

#### Scenario: A host origin pattern is derived from a connector baseUrl

- **WHEN** `originPatternForBaseUrl('https://gitlab.example.com/group/repo')` is called
- **THEN** it SHALL return `https://gitlab.example.com/*`

#### Scenario: A non-default port is preserved in the derived pattern

- **WHEN** `originPatternForBaseUrl('https://gitlab.example.com:8443/group')` is called
- **THEN** it SHALL return `https://gitlab.example.com:8443/*`

#### Scenario: Permission changes notify subscribers

- **GIVEN** a subscriber registered via `onPermissionsChange`
- **WHEN** a host or API permission is granted or removed
- **THEN** the subscriber SHALL be invoked, and its returned unsubscribe SHALL stop further notifications

The module SHALL still NOT export programmatic removal: turning the provenance
toggle off stops commit handling and clears its data but does NOT revoke the grant,
so revocation remains something Lunma observes. Carrying no policy, the module
SHALL NOT host the provenance effective-state helper; `effectiveProvenanceState()`
lives in `shared/settings.ts` and merely calls `hasApiPermission('webNavigation')`.

#### Scenario: Turning provenance off does not revoke the grant

- **WHEN** the user sets `trackTabProvenance` to `false`
- **THEN** Lunma SHALL NOT call any permission-removal API, and the grant SHALL remain until the user revokes it in Chrome
