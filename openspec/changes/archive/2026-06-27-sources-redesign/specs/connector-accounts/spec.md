## MODIFIED Requirements

### Requirement: The inline connect affordance is reusable and method-aware

A reusable connect affordance SHALL let a user provide an account's token in place,
without navigating to the options page. It SHALL reuse a `ui/` primitive composing
`TextInput type="password"` and SHALL appear in the shared **Service-dropdown connect
picker** (used by both the lens editor and the Connections manager — see `Connecting a
service is a single Service-dropdown picker`), and in a lens's `signed-out` section (as
an inline "Reconnect {host}"). It SHALL be **method-aware**: for a `session`-capable
provider the token field SHALL be framed as an optional upgrade ("add a token"); for a
`pat`-only provider the token SHALL be required to reach a ready state. The affordance
SHALL request a token only when the derived status is `needs-token`, or when a
session-capable account has resolved to `signed-out` at runtime. On a successful
write from a `signed-out` lens section, the surface SHALL dispatch `refreshLens` so the
section re-fetches without navigation. A stored token SHALL render as a
"Token set · Replace" control and SHALL NOT echo the value.

#### Scenario: Reconnecting a signed-out section fills it in place

- **GIVEN** a GitHub lens section in `state: 'signed-out'`
- **WHEN** the user enters a token in the inline reconnect affordance and confirms
- **THEN** `setAccountToken` writes the token AND `refreshLens` is dispatched
- **AND** the section re-fetches and renders its rows without any navigation

#### Scenario: A session-capable account shows no required field

- **GIVEN** a `gitlab` account being added
- **WHEN** the connect affordance renders
- **THEN** the token field is an optional "add a token" upgrade, not a required step

### Requirement: A Source is an Account or a Feed

A lens **Source** SHALL be one of two KINDS, persisted uniformly as `SourceAccount` in
`AppState.sources` and referenced uniformly by `LensSourceRef`, but **presented and
managed distinctly within one Connections surface**:

- an **Account** — a connected identity with derived auth: `github`, `gitlab`, or
  `jira` (`ACCOUNT_PROVIDERS`). Managed in the **Accounts** group of the Options
  **Connections** manager; added via the shared Service-dropdown connect picker.
- a **Feed** — a public RSS subscription (`rss`): a URL with no auth. Managed in the
  **Feeds** group of the Options **Connections** manager (per-feed rows, plus OPML
  import/export — see the `opml-import-export` capability); added via the same connect
  picker (RSS feed branch).

A single lens MAY include both Accounts and Feeds (see the `lenses` capability). The
shared `isFeedProvider(provider)` (`provider === 'rss'`) is the single discriminator,
and decides which group a source renders in. The `AccountChip` renders an auth status
only for Accounts; a Feed shows just its provider glyph + identity (no status pip).

#### Scenario: Accounts and feeds render in their respective groups

- **WHEN** the Connections manager renders
- **THEN** github/gitlab/jira sources SHALL appear in the **Accounts** group and rss sources in the **Feeds** group — never the reverse

### Requirement: The options page manages accounts and shows their reach

The options page SHALL present a single **Connections** manager (anchor `#connectors`,
retained so existing deep-links resolve) composed of an **Accounts** group and a
**Feeds** group, replacing the prior separate Connectors and Feed-subscriptions cards.
The Accounts group SHALL list every connected **Account** (auth providers — rss is in
the Feeds group) with its provider, host/name, derived status, and its **reach**; the
Feeds group SHALL list every **Feed** with its name, URL, and reach. **Reach** SHALL be
the count of distinct lens nodes — across **every** `pinnedBySpace[*]` (all Spaces, not
the active one) — whose `sources[].sourceId` includes the source's id; computing reach
requires the options page to read `pinnedBySpace`. A single **"+ Connect"** affordance
SHALL open the shared Service-dropdown connect picker. Each row SHALL expose its
lifecycle via a per-row `⋯` menu: for an Account, replace/add token, rename, and
disconnect; for a Feed, rename, copy URL, and remove (rename/remove reuse the existing
`renameAccount`/`deleteAccount` lifecycle, since a Feed is a `SourceAccount`).
Disconnecting or removing a source whose reach is greater than zero SHALL warn the user
before proceeding. The token value SHALL never be displayed.

#### Scenario: The Accounts group lists accounts with reach

- **GIVEN** an account referenced by three lenses
- **WHEN** the Connections manager renders
- **THEN** the account row shows its identity, derived status, and "feeds 3 lenses" in the Accounts group

#### Scenario: The Feeds group lists per-feed rows

- **GIVEN** two connected rss feeds
- **WHEN** the Connections manager renders
- **THEN** the Feeds group shows one row per feed with its name, URL, and reach, each with a `⋯` menu offering Rename / Copy URL / Remove

#### Scenario: Disconnecting an in-use source warns first

- **WHEN** the user disconnects an account (or removes a feed) that still feeds at least one lens
- **THEN** a warning SHALL be shown before it proceeds

## ADDED Requirements

### Requirement: Connecting a service is a single Service-dropdown picker

Connecting a new source SHALL be a single **Service-dropdown picker**
(`apps/extension/src/ui/ServiceConnectPicker.svelte`, a cross-surface `ui/`
primitive), shared by the Options Connections manager and the lens editor. It SHALL present a **Service** `Select`
whose options are `GitHub`, `GitLab`, `Jira`, and `RSS feed`, and SHALL show the
provider-appropriate fields for the chosen service: for an account service, a host field
(with the per-provider placeholder) and the method-aware inline connect affordance
(token required for a `pat`-only provider, optional for a session-capable one); for the
RSS feed service, a feed-URL field only (no host, no token). Committing SHALL mint the
source via `createAccount` (client-minted id) and, for an account with a token, write it
via `setAccountToken`. The RSS feed branch SHALL additionally offer **OPML import** as
the bulk feed-add path (see the `opml-import-export` capability), in one of two host-set
**modes**: when the host passes target `spaces` (the Options Connections manager) the
confirm step picks a Space and dispatches `importOpml` (one standalone feed-folder lens);
when the host passes an **`onImportFeeds`** callback (the lens editor) the confirm step
hands the valid parsed feeds to that callback — to add them **into the lens being
assembled** — instead of dispatching `importOpml`, so no separate lens is spawned.
`onImportFeeds` takes precedence over the `spaces` path; when neither is given the RSS
branch hides the OPML option. The picker SHALL replace the prior always-visible
per-provider connect form.

#### Scenario: Selecting a service shows its fields

- **WHEN** the user opens the connect picker and selects "GitLab"
- **THEN** a host field and an optional "add a token" field are shown (session-capable), and committing mints a gitlab `SourceAccount`
- **AND WHEN** the user instead selects "RSS feed", only a feed-URL field is shown, with an "Import OPML" bulk option

#### Scenario: The picker is shared by editor and manager

- **WHEN** the user opens "+ Connect a service" in the lens editor or "+ Connect" in the Connections manager
- **THEN** both surfaces present the same Service-dropdown picker and mint sources via the same `createAccount`/`setAccountToken` path

#### Scenario: OPML import mode follows the host surface

- **WHEN** the user chooses "Import OPML" in the Connections manager (host passed `spaces`) and confirms
- **THEN** the confirm step picks a target Space and dispatches `importOpml` (one standalone feed-folder lens)
- **AND WHEN** the user chooses "Import OPML" in the lens editor (host passed `onImportFeeds`) and confirms
- **THEN** the confirm step shows no Space picker and calls `onImportFeeds` with the valid feeds — adding them into the lens being assembled — and does NOT dispatch `importOpml`
