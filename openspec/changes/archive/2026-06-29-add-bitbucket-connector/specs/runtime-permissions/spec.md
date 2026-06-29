## MODIFIED Requirements

### Requirement: The manifest grants least privilege at install, the rest at runtime

The extension manifest SHALL request at install only the permissions the core
workspace needs, and SHALL declare the rest as optional, granted at runtime.

- Required `permissions`: `tabs`, `tabGroups`, `storage`, `sidePanel`, `alarms`,
  `scripting`, `commands`. The two `content_scripts`
  (`src/launcher/overlay.ts`, `src/content/tab-boundary.ts`) SHALL remain on
  `<all_urls>` at `document_start` (load-bearing — the launcher must be
  summonable on any page and the pinned-tab boundary must catch clicks before
  navigation).
- `host_permissions` SHALL NOT include `<all_urls>` (or any blanket host).
- `optional_permissions` SHALL include `history` and `bookmarks`.
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
