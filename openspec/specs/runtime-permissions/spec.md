# runtime-permissions Specification

## Purpose

Request least-privilege permissions at install and grant the rest at runtime
through one foundation module that gates `chrome.permissions` — so the extension
asks for host/feature access only on a user gesture and only when a feature
needs it, with a calm, reversible inline grant.

## Requirements

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
  `https://*.atlassian.net/*`) AND the self-hosted fallback patterns
  `https://*/*` and `http://*/*`, so an arbitrary user-entered connector
  `baseUrl` can be requested at runtime.
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

#### Scenario: The favicon permission is resolved by verification, not assumption

- **WHEN** the built extension is loaded without the `favicon` permission on the
  supported Chrome floor
- **THEN** if `tab.favIconUrl` and `_favicon/*` still resolve, `favicon` SHALL be
  absent from the manifest; otherwise it SHALL be retained with the reason
  recorded in `design.md`

### Requirement: A single foundation module gates chrome.permissions

All `chrome.permissions` access SHALL go through one foundation module
`apps/extension/src/shared/permissions.ts`. It SHALL be a thin, typed wrapper
carrying no policy beyond origin-pattern derivation, and SHALL export:
`hasApiPermission(name)`, `requestApiPermission(name)` for
`name: 'history' | 'bookmarks'`; `hasHostPermissions(origins: string[])` (true
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

### Requirement: Permission requests are user-gesture-bound and minimally scoped

`requestApiPermission` / `requestHostPermissions` SHALL be invoked only from a
user-gesture handler in an extension-page context (sidebar, options, or the
new-tab launcher). The background service worker SHALL NOT call any `request*`
function — it SHALL only `has*`-query and observe via `onPermissionsChange`. A
request SHALL be scoped to the minimum needed: a single API permission, or the
origin set a connector declares via `requiredOrigins(node)` (never `<all_urls>`).
Surfaces obtain that origin set from the shared `requiredOriginsForNode(node)`
derivation in `shared/connector-origins.ts` (they cannot import
`background/connectors` under the layer DAG); the connector `requiredOrigins`
members delegate to the same derivation, so the SW gate and the surface request
never diverge.

#### Scenario: The background never requests, only queries and observes

- **WHEN** the service worker needs to decide whether a gated feature may run
- **THEN** it SHALL call a `has*` query (and may observe `onPermissionsChange`)
- **AND** it SHALL NOT call `requestApiPermission` or `requestHostPermissions`

#### Scenario: A host request is scoped to the connector's required origins

- **WHEN** the user grants access for a GitHub folder on `https://github.com`
- **THEN** the request SHALL carry `https://api.github.com/*` (the origin the connector fetches), not `https://github.com/*` and not a blanket host

### Requirement: An ungranted feature offers a calm, reversible inline grant

A surface that gates a feature on an ungranted optional permission SHALL render
a calm "Enable" / "Grant access to ⟨host⟩" control composed from
the existing `Button`/`IconButton`/`Icon`/`Surface` primitives (no re-rolled
primitive, no new primitive). In an extension-page context the control SHALL
call the matching `request*` function directly. In a content-script context
(the Alt+L overlay), which cannot access `chrome.permissions` and runs under a
hard gzip budget with no Svelte runtime, the control SHALL instead be rendered
in the overlay's existing vanilla-DOM idiom (its established mirror of the
primitives — it imports neither `ui/` primitives nor `shared/permissions.ts`)
and SHALL open the options page to the grant location via a service-worker
message. A grant SHALL be reversible (the user can revoke via Chrome and the
feature returns to its gated state), and the control SHALL never present as an
error.

#### Scenario: Granting from an extension page is inline

- **GIVEN** a gated feature on the sidebar, options, or new-tab launcher
- **WHEN** the user clicks "Grant access"
- **THEN** the surface SHALL call the matching `request*` function in the click handler
- **AND** on grant the feature SHALL become active without a manual reload

#### Scenario: The overlay routes to options because content scripts lack chrome.permissions

- **GIVEN** the Alt+L launcher overlay showing an "Enable" affordance
- **WHEN** the user activates it
- **THEN** the options page SHALL open to the grant location (the overlay SHALL NOT call `chrome.permissions.request`)

#### Scenario: A revoked grant returns the feature to its gated state

- **GIVEN** a previously granted optional permission
- **WHEN** the user revokes it via Chrome
- **THEN** `onPermissionsChange` SHALL fire and the feature SHALL return to showing its grant affordance
