## Why

A reviewer who connects `github.com` for a Review lens, then wants a Tickets lens
on the same host, re-enters the URL and (today) re-discovers that the token lives
in a different surface entirely. Sources are **embedded and duplicated** inside
each lens (`lens.sources: LensSource[]`), and the only thing shared across lenses
is the host-keyed token — invisibly. This change makes a connected **Account** a
first-class object you configure once and reuse: a lens **references** accounts
instead of re-declaring hosts, you **connect an account inline** (no trip to
Options to finish a GitHub lens), and one Options surface shows every account and
its reach ("feeds 3 lenses"). It also unlocks **multiple accounts per host**
(personal + work `github.com`), which the current host-keyed token model cannot
express.

This is the source↔lens decoupling the lenses vision describes (type moves off
the source onto the lens `kind`; sources become reusable adapters) carried into
the data model: `Source 1—* ref *—1 Lens`, a true many-to-many.

**Docs touched by this change:** `docs/lenses-vision.md` (record Accounts as the
first-class source entity and the reference-based lens↔source model — the vision
currently shows `LensSource` embedded in the lens); `docs/architecture.md` (the
surface/storage table — the secrets store is re-keyed by `sourceId`, the
persisted `sources` slice is added, and the sidebar/launcher now write tokens
inline via the shared helper, not only Options). **Left untouched:**
`docs/tech-stack.md` (no stack/dependency change).

## What Changes

- **`Account` (the `SourceAccount` entity).** A new persisted, broadcast-safe
  record `{ id, provider, baseUrl, name? }` in `AppState.sources`. It carries **no
  secret** (tokens never enter `AppState`/broadcast) and **no stored auth method** —
  the method is derived (see next bullet). Because it is portable user
  configuration (not a secret, not machine-bound), the **data-backup** portable
  subset (`PortableAppState`/`buildBackup`) carries `AppState.sources` so a restored
  backup's lens references resolve (tokens are still excluded — they stay in the
  machine-bound `lunma.connectors` store). *(Agreed during apply: the backup path is
  not in the original task list but otherwise a restore would dangle every lens; see
  `design.md` "Backup portability".)*
- **Each provider declares its auth methods; piggy-back is the zero-config
  default.** The `SourceConnector` contract gains a declared `authMethods` list —
  GitHub `['pat']`, GitLab `['session', 'pat']`, Jira `['session']`, RSS `[]`
  (public). An account's **effective method is derived, never manually set**: when
  the provider supports `session` (riding your existing browser sign-in), that is
  the **default and needs no token to start**; a PAT is an optional upgrade, or the
  only method for PAT-only providers like GitHub. Auth status
  (`connected | browser-session | needs-token | signed-out`) derives from the
  provider's `authMethods` plus whether a per-source token exists — a token always
  wins over session (today's gitlab PAT-then-cookies ladder, generalised).
- **Lenses reference accounts. BREAKING (persisted).** `lens.sources` changes from
  `LensSource[]` (`{ provider, baseUrl, queries[], name? }`) to
  `LensSourceRef[]` (`{ sourceId, queries[] }`). Filters stay per-reference (one
  account feeds `review-requested` in one lens, `authored` in another). The
  `LensSource` type is **retained** (exported) as the legacy embedded shape — the
  v13 migration reads it to extract accounts, and the OPML import path mints rss
  accounts from it; it is no longer a lens-node field.
- **Per-source tokens (multi-account). BREAKING (secrets store).** The secrets
  record is re-keyed from **host** to **`sourceId`** so two accounts on the same
  host (personal + work `github.com`) hold distinct tokens. The connector reads
  the token by the resolved source's `sourceId`, so `ResolvedLensSource` gains a
  `sourceId` field.
- **Schema bump 12 → 13** with a migration that (a) extracts the distinct
  `(provider, baseUrl)` pairs embedded across every lens into `Account` records,
  (b) rewrites each lens's `sources` to `sourceId` references, and (c) re-keys the
  existing host-keyed tokens onto the minted accounts' ids.
- **Connect inline — the one bold beat.** A reusable connect affordance (password
  field + "Connect") appears in three places, all writing the same per-source
  token: the editor's account picker ("+ Connect an account"), the signed-out lane
  ("Reconnect {host}", which then `refreshLens`), and the Options Accounts
  manager. The affordance is **method-aware**: for a session-capable provider
  (GitLab/Jira) adding an account just works via the browser session — the token
  field is an optional "add a token" upgrade; for a PAT-only provider (GitHub) the
  token is required in the same beat. A token is only ever *requested* when the
  derived status is `needs-token` or a session-capable account has gone
  `signed-out`.
- **A Source is an Account or a Feed (presentation split).** The uniform
  `SourceAccount` model is kept internally, but the two kinds are surfaced
  distinctly so a public RSS feed never reads as a "connected account": **Accounts**
  (github/gitlab/jira, auth) live in the Options **Accounts** manager and the
  editor's "+ Connect an account"; **Feeds** (rss, a public URL) live in the Options
  **Feed subscriptions** card (OPML import/export) and the editor's "+ Add a feed".
  See `design.md` D12. *(Agreed during apply — the original framing surfaced rss as
  an account, which read wrong, and the editor rework had dropped OPML import; this
  restores it.)*
- **Editor becomes assembly, not a URL form.** The lens editor picks from
  connected accounts and feeds, sets per-account filters, with inline connect for a
  new account and inline "add a feed" for a new RSS subscription. Creating a lens no
  longer types hosts.
- **Options ConnectorsCard → Accounts manager.** The existing card evolves into
  the management home: list accounts with their reach, connect / rename /
  disconnect, replace a token. Disconnecting an account warns when it still feeds
  lenses.
- **New `ui/` primitives.** `AccountChip` (provider glyph + host/name + status
  pip) and `AccountConnectField` (the password connect beat); both compose
  existing primitives.

No behaviour change to what a lens *shows*: the queue/grid, the connectors' fetch
logic, and the runtime slice are unchanged — only how sources are addressed
(by reference) and where auth is keyed (by source) move.

## Capabilities

### New Capabilities

- `connector-accounts`: the first-class connected **Account** entity
  (`SourceAccount`), its per-source secrets store (keyed by `sourceId`, kept out
  of `AppState`/broadcast/logs), the **provider-declared `authMethods`** model and
  the **derived** auth method/status (session-default zero-config; PAT optional or
  required by provider), the account lifecycle (connect / reconnect / rename /
  disconnect) over the bus, the reusable method-aware inline connect affordance,
  and the Options Accounts manager.

### Modified Capabilities

- `lenses`: `lens.sources` becomes `LensSourceRef[]` (`{ sourceId, queries }`);
  `ResolvedLensSource` gains `sourceId` (auth resolves by source, not host); the
  `SourceConnector` contract gains a declared `authMethods` list driving the
  session-default vs token-required behaviour; the editor becomes an account-picker
  with inline connect; the `signed-out` affordance becomes an inline "Reconnect
  {host}" unlock (was a navigate-to-Options signpost); the `createLens`/`updateLens`
  payloads carry source references.
- `storage-and-migrations`: `CURRENT_SCHEMA_VERSION` 12 → 13; `AppStateV13Schema`
  adds the `sources` slice and the referenced `LensSourceRef` lens shape; the
  `{ toVersion: 13 }` migration extracts embedded sources into accounts, rewrites
  lens references, and re-keys the secrets store host → `sourceId`.
- `typed-message-bus`: the `SidebarCommand` union gains `createAccount` /
  `renameAccount` / `deleteAccount` (client-minted account ids); the
  `createLens`/`updateLens` payloads carry `sources: LensSourceRef[]` (references,
  not embedded configs). The stale "Lens lifecycle commands" requirement is also
  rebased onto current reality (multi-source + `lensKind`) in passing.
- `opml-import-export`: `buildOpml` resolves each lens's `LensSourceRef`s against
  `AppState.sources` to find rss feeds; `importOpml` find-or-mints an rss
  `SourceAccount` per feed and references it (was: embedded `{ source: 'rss', baseUrl }`).
  The Feed-subscriptions export-button presence keys on a referenced rss account.

## Impact

- **`apps/extension/src/shared/`** — `types.ts` (`SourceId`, `SourceAccount`,
  `LensSourceRef`, `AppState.sources`, `ResolvedLensSource.sourceId`, the lens
  node's `sources` type), `schemas.ts` (`SourceAccountSchema`,
  `LensSourceRefSchema`, `AppStateV13Schema`, `CURRENT_SCHEMA_VERSION` 13),
  `migrations.ts` (the `{ toVersion: 13 }` entry), `connectors.ts` (the secrets
  store + `read/​setAccountToken` re-keyed by `sourceId`), `bus.ts` (account
  lifecycle commands + `createLens`/`updateLens` reference payloads).
- **`apps/extension/src/background/`** — the store gains `sources` mutators
  (single-writer); `handlers/lenses.ts` resolves references → `ResolvedLensSource`
  with `sourceId`; `background/lenses.ts` `resolvedConfigs` reads the account for
  `provider`/`baseUrl`; each connector declares `authMethods` on the
  `SourceConnector` contract (`connectors/connector.ts`) and looks up the token by
  `sourceId`. No coordinator/bus *contract* break beyond the new commands.
- **`apps/extension/src/sidebar/`** — `LensEditor.svelte` becomes account
  assembly + inline connect; `Lens.svelte` `signed-out` row becomes inline
  reconnect; source labels read the referenced account.
- **`apps/extension/src/launcher/lenspage/`** — `GeneralLens.svelte` /
  `ReviewQueue.svelte` signed-out reconnect; section/lane labels read the account.
- **`apps/extension/src/options/`** — `ConnectorsCard.svelte` → the Accounts
  manager (list + reach + connect/rename/disconnect); `FeedSubscriptions.svelte`
  export-button presence keys on a referenced rss account.
- **OPML (`shared/opml.ts` + the `importOpml` handler)** — `buildOpml` resolves
  refs against `AppState.sources`; `importOpml` find-or-mints rss accounts then
  references them (the embedded `LensSource[]` reads are replaced).
- **`apps/extension/src/ui/`** — new `AccountChip` + `AccountConnectField`
  primitives (compose `TextInput type=password`, `Button`, `Chip`, `Icon`,
  `Select`), with tests + harnesses.
- **No new dependencies; no `manifest`/permission change** (same connector
  origins; the host-permission grant flow is unchanged).
</content>
