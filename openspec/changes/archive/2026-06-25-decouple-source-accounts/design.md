# Decouple sources into Accounts — design

## Context

Today a source is **embedded** in each lens: the `lens` `PinNode` carries
`sources: LensSource[]` where `LensSource = { source, baseUrl, queries[], name? }`
(`shared/types.ts`). Two lenses on `github.com` each re-declare the host; the only
thing shared is the access token, held **host-keyed** in a separate
`chrome.storage.local` record `lunma.connectors` (`{ [host]: token }`,
`shared/connectors.ts:26`) — invisible and one-token-per-host.

The lenses vision (`docs/lenses-vision.md`) describes sources decoupling from
lenses: type moves off the source onto the lens `kind`, sources become reusable
adapters. This change carries that into the data model — a connected **Account**
is a first-class entity (`Source 1—* ref *—1 Lens`) — and fixes the two felt
problems: finishing a GitHub lens forces a trip to Options, and you cannot hold
two accounts on one host.

Constraints this design plugs into (verified against the code):
- **Secrets never broadcast.** `lunma.connectors` is separate from `lunma.state`,
  never in `AppState`, never logged (`connectors.ts:50`), never echoed to UI. Any
  persisted Account entity (which IS broadcast) therefore must carry no token.
- **`AppState` mutations are single-writer.** The SW store owns `AppState`; surfaces
  mutate only via the bus. So the Account *entity* needs bus commands, while the
  *token* (not in `AppState`) keeps its direct `chrome.storage.local` write.
- **The `SourceConnector` contract is shape-stable** (`connectors/connector.ts:37`):
  `fetchRuntime(cfg: ResolvedLensSource, maxItems, caches?)`, plus
  `requiredOrigins`/`listingUrl`/`defaultBaseUrl`/`mintedIcon`. We add to the
  contract (a declared `authMethods`) and to `ResolvedLensSource` (a `sourceId`),
  without changing `fetchRuntime`'s arity.
- **Auth is already a per-connector strategy.** GitLab runs a PAT-then-cookies
  ladder; GitHub is token-only (`connectors/{gitlab,github}.ts`). This change
  *names* that as a declared capability rather than inventing it.

## Goals / Non-Goals

**Goals:**
- A first-class `SourceAccount` entity in `AppState.sources`, referenced by lenses.
- Per-source tokens (multiple accounts per host), secrets re-keyed `host → sourceId`.
- Providers declare `authMethods`; the effective method is derived; session
  (piggy-back) is the zero-config default when supported — no token to start.
- Inline, method-aware connect from the editor, the signed-out lane, and Options.
- The Options ConnectorsCard becomes the Accounts manager (list · reach · connect /
  rename / disconnect).
- A `v12 → v13` migration that extracts embedded sources, rewrites lens references,
  and re-keys existing tokens — losing no data.

**Non-Goals:**
- OAuth / device-flow auth. Methods in v1 are exactly `session` (cookies) and `pat`.
  OAuth is a later method the declared-`authMethods` model already accommodates.
- Changing connector fetch/normalize logic or the runtime `lenses` slice.
- Changing the host-permission grant flow (`requiredOrigins` stays host-based).
- A standalone sidebar Accounts surface (management stays in Options for v1; the
  inline connect covers the in-flow need).
- Cross-device token sync (tokens stay `chrome.storage.local`, machine-bound).

## Decisions

### D1 — `SourceAccount` is persisted and broadcast-safe; the token is not on it
```ts
type SourceId = string;
interface SourceAccount { id: SourceId; provider: LensProvider; baseUrl: string; name?: string }
// AppState.sources: { [id: SourceId]: SourceAccount }
```
The token stays in the secrets store (D4), never on the entity, so `AppState` (which
broadcasts) carries no secret. Auth status is **derived** (D3), never stored.
*Alternative:* token on the account → rejected, it would broadcast secrets to every
surface and into backups.

### D2 — A lens references accounts; filters stay on the reference
```ts
interface LensSourceRef { sourceId: SourceId; queries: LensQuery[] }
// lens node: sources: LensSourceRef[]   (was LensSource[])
```
Filters live on the *reference*, not the account: one account feeds
`review-requested` in a Review lens and `authored` in another. This is the
many-to-many seam.
*Alternative:* filters on the account → rejected, it would force one filter-set per
account and defeat reuse.

### D3 — Providers declare `authMethods`; the effective method is derived
The `SourceConnector` contract gains `readonly authMethods: AuthMethod[]` where
`type AuthMethod = 'session' | 'pat'`. Declarations:
`github ['pat']`, `gitlab ['session','pat']`, `jira ['session']`, `rss []` (public).
The effective method for an account is **derived, never stored**, by this precedence:
1. provider has no methods (`rss`) → `public` (no auth, always ready);
2. a per-source token exists → `pat` (a token always wins — generalises gitlab's
   PAT-then-cookies ladder);
3. provider supports `session` → `session` (rides the browser sign-in, **zero-config
   default**);
4. otherwise (`pat`-only, no token) → `needs-token`.
A surface computes this from `connector.authMethods` + token-presence; the connector
applies the same precedence at fetch time. So a GitLab/Jira account is **ready the
moment it's added**; only a `pat`-only provider (or a session account whose cookies
fail at runtime) ever asks for a token.
*Alternative:* a stored `authMethod` field on the account → rejected, it would have to
be set manually and could drift from the provider's real capability; deriving keeps
"piggy-back by default, no setup" true for free.

### D4 — Secrets store re-keyed `host → sourceId` (multi-account per host)
`ConnectorsRecord` becomes `{ [sourceId: SourceId]: string }`; the API renames to
`readAccountTokens()` / `setAccountToken(sourceId, token | null)` (same file, same
`chrome.storage.local` key, same never-logged/never-broadcast guarantees). The
connector reads `tokens[cfg.sourceId]`. Two accounts on `github.com` now hold
distinct tokens.
*Alternative:* keep host-keying → rejected, it cannot express personal + work on one
host, which was the chosen requirement.

### D5 — `ResolvedLensSource` gains `sourceId`; `resolvedConfigs` reads the account
`resolvedConfigs(node)` now resolves each `LensSourceRef` against `AppState.sources`
to produce `{ source: account.provider, baseUrl: account.baseUrl, query?, name?,
sourceId: account.id, lensKind }`. `source`/`baseUrl` are still present (derived from
the account) so the connectors and `sourceKey`/`requiredOrigins` are unchanged; auth
lookup uses the new `sourceId`. A ref whose `sourceId` is missing from `sources`
(dangling) resolves to nothing and the section renders a calm "account removed"
state (D9), never a crash — mirroring the existing dedupe tolerance.

### D6 — Account lifecycle over the bus; token write stays direct; ids are client-minted
The Account entity is in `AppState`, so its lifecycle is bus commands:
`createAccount`, `renameAccount`, `deleteAccount`. The **token** (not in `AppState`)
keeps the direct `setAccountToken` write any surface may call (the Options card
already writes the secrets store this way — DAG-legal, same layer tier). Connecting
pairs them: `createAccount` + (if a token was entered) `setAccountToken`. Reconnect =
`setAccountToken` + `refreshLens`. Disconnect = `deleteAccount` + `setAccountToken(…,
null)`.

Account **ids are client-minted** (`crypto.randomUUID()` on the surface) and passed
in the `createAccount` payload. Rationale: bus acks are `void`, so a SW-minted id
can't be read back to reference inline during lens creation; a client UUID lets the
editor mint the account and reference its id in the same `createLens` without a
round-trip. The SW validates uniqueness and rejects a collision.
*Alternative:* a `createLens` payload that inlines new-account definitions for the SW
to mint atomically → rejected for v1 as a heavier payload contract; client-UUID is
simpler and collision-safe. Recorded as an open question (could revisit if atomicity
bites).

### D7 — `v12 → v13` migration: extract, rewrite, then reconcile secrets
**State migration (pure, in `migrations.ts`):** walk every lens node's embedded
`sources: LensSource[]`; for each distinct `(provider, baseUrl)` across all lenses,
mint one `SourceAccount` (UUID id) into a new top-level `sources` map (dedupe by the
composite key); rewrite each lens's `sources` entry to `{ sourceId, queries }`. The
node's other fields are untouched. A source's `name` migrates onto the account.

**Secrets reconcile (boot chain, NOT the pure migrate fn):** the `lunma.connectors`
record lives under a *different, unversioned* storage key, so it can't be rewritten
inside the state migrate function. A one-time boot step `reconcileAccountSecrets`
runs after load when it detects legacy **host** keys (a key that is a bare host, not a
known `sourceId`): for each legacy host token it finds the account on that host (at
migration time there is exactly one account per host, so the mapping is unambiguous),
moves the token to `[sourceId]`, and removes the host key. Idempotent; logs at
`debug` without token material.
*Alternative:* version the secrets store too → rejected as over-engineering for a
one-time host→id move that the account set already disambiguates.

### D8 — frontend-design: Accounts as living identities (the connect beat is the signature)
Lunma's visual language is fixed; the design work here is information + interaction.
Two new `ui/` primitives, composing existing ones:
- `AccountChip` — provider glyph (`Icon`) + host/name + a **status pip**; reused by
  the Accounts manager, the editor picker rows, and the signed-out lane. The pip pairs
  a colour with a word (never colour-only): `Connected` (`--success`),
  `Browser session` (`--text-dim`), `Add a token` / `Reconnect` (`--warning`).
- `AccountConnectField` — the **connect beat**: a `TextInput type="password"` + a
  `Connect` `Button`, a "How to create one ↗" helper, and the bad-token error. It is
  **method-aware**: rendered as an optional "Add a token" for `session`-capable
  providers and as a required field for `pat`-only providers. When a token already
  exists it collapses to a `Token set · Replace` chip (never echoes the value).

The editor stops being a URL form — it is **assembly**: checkable account rows + a
per-account filter `Select`/chips, with "+ Connect an account" opening the beat
inline and returning to the picker. The Options card becomes the manager: accounts
listed with their **reach** ("feeds 3 lenses"), connect / rename / disconnect, with a
disconnect-while-in-use warning.

### D9 — Calm states for dangling and unauthed references
A lens section whose account was disconnected/deleted renders a calm "Account removed
— reconnect or pick another" row (reusing the signed-out treatment), never an error
card. A `needs-token` section renders the inline reconnect beat. Creating a GitHub
lens **without** a token is allowed — the account exists in `needs-token` and the lane
shows the reconnect beat — so account/lens creation is never hard-blocked on a secret.

### D10 — Backup portability of accounts (agreed during apply)
The data-backup portable subset (`PortableAppState`, `PortableAppStateSchema`,
`buildBackup`) is widened to include `AppState.sources`. Accounts are portable user
configuration carrying no secret (the token stays in the machine-bound
`lunma.connectors` store and is never exported), so a backup that omitted them would
restore every lens with a **dangling** reference. The schema gets a
`sources: z.record(z.string(), SourceAccountSchema).default({})` (so a pre-v13
backup, migrated forward, parses), and `parseBackup` validates against
`AppStateV13Schema`. *Not in the original task list; agreed via AskUserQuestion
because the alternative ships a visibly-broken backup.*

### D11 — Where the derived-method + surface helpers live
`deriveAuthMethod` / `deriveAuthStatus` (D3) and the `PROVIDER_AUTH_METHODS` map
live in **`shared/auth-method.ts`** — DAG-legal for both the connectors
(`background/`) and the surfaces. The connectors' `SourceConnector.authMethods`
field references the same map (one source of truth; no drift). Surface presentation
helpers (provider labels, default base URLs, `tokenRequirement`, `tokenHelpUrl`,
`accountLabel`/`hostLabel`) live in **`shared/account-ui.ts`**, shared by the editor
picker, the Options Accounts manager, and the signed-out reconnect lanes. The
reusable `AccountConnectField` is used by the signed-out reconnect lanes (all three
surfaces), the Options per-account replace-token control, and the editor's "+ Connect
an account" flow (for the token rung; a no-token "Add account/feed" button covers
the session/public path). The editor's connect form **drops the prior inline OPML
importer** — OPML import stays in Options (`FeedSubscriptions` → `importOpml`, which
now find-or-mints rss accounts), consistent with "the editor is assembly, not a URL
form."

### D12 — A Source is an Account or a Feed (presentation split; agreed during apply)
The uniform `SourceAccount` model collapsed two genuinely different things, which
read wrong in the UI (a public RSS feed shown as a "connected account"). The data
model stays uniform — both are `SourceAccount` in `AppState.sources`, referenced by
`LensSourceRef`, resolved through one path — but they are **presented and managed as
two kinds**:

- an **Account** — a connected identity with derived auth (`github`/`gitlab`/`jira`).
  Managed in **Options → Accounts** (the manager lists auth providers ONLY), added
  inline via the editor's **"+ Connect an account"** beat (token-aware).
- a **Feed** — a public RSS subscription (`rss`): just a URL, no auth, no "account".
  Managed in **Options → Feed subscriptions** (OPML **import** + export), added inline
  via the editor's **"+ Add a feed"** affordance (URL only). A `review` lens has no
  feed affordance (auth accounts only); a `general` lens has both.

`shared/account-ui.ts` carries `ACCOUNT_PROVIDERS` (the auth set) and
`isFeedProvider`; the `AccountChip`'s `status` is optional (a feed shows just its
glyph + identity, no auth pip). **`importOpml` is wired to the Feed subscriptions
card** (it had been only in the old editor's inline importer, which the account-picker
rework removed — restoring it un-breaks OPML import, and matches the
`opml-import-export` spec, which already places the import flow in
`FeedSubscriptions.svelte`).

## Risks / Trade-offs

- **Breaking persisted lens shape + secrets re-key** → the v13 migration + the boot
  reconcile cover existing data; downgrade past v13 hits the standard
  quarantine/salvage path (the v13 `lens` shape rejects under v12). Forward-only,
  accepted.
- **Secrets reconcile maps the wrong token** → at migration time there is exactly one
  account per host, so the host→sourceId map is unambiguous; the step is idempotent
  and a mis-map's worst case is a re-entered token, never a leak.
- **Client-minted account id collision** → UUIDv4; the SW rejects a duplicate id on
  `createAccount`. Negligible.
- **Self-hosted instance disallows cookie API despite `session` being declared** →
  the session attempt fails at runtime → `signed-out` → the lane offers a PAT (the
  `pat` method is also declared for gitlab). Graceful; no config error.
- **Disconnecting an account that feeds lenses** → guarded by a warning; the affected
  sections fall to the calm "account removed" state (D9), other lenses untouched.
- **OPML build/import read the embedded source shape** → the ref model breaks them at
  compile time, so they are migrated in this change (not deferred): `buildOpml` resolves
  each `LensSourceRef` against `AppState.sources`; `importOpml` find-or-mints an rss
  `SourceAccount` per feed (dedupe by URL) then references it. `LensSource` is retained
  as the legacy shape the v13 migration and OPML import read. See the
  `opml-import-export` and `typed-message-bus` spec deltas.

## Migration Plan

1. Land together: `SourceAccount`/`LensSourceRef` types + `AppStateV13Schema` +
   the `{ toVersion: 13 }` state migration + `CURRENT_SCHEMA_VERSION = 13` + the
   `reconcileAccountSecrets` boot step + the secrets API rename.
2. On first boot after update: state migrates v12→v13 (accounts extracted, lenses
   rewritten, written back as `{ schemaVersion: 13, state }`); then
   `reconcileAccountSecrets` moves host-keyed tokens onto account ids.
3. No connector fetch-logic change; the first poll after boot reads tokens by
   `sourceId`.
4. Rollback: forward-only (a v12 build quarantines a v13 lens node). No data rewrite
   step beyond the migration.

## Open Questions

- **Account id minting** — client-UUID (chosen, D6) vs a `createLens` payload that
  inlines account definitions for atomic SW minting. Revisit only if the
  create-account-then-create-lens sequence proves racy in practice.
- **Disconnect semantics** — hard warning + leave dangling refs (chosen), vs cascade
  to strip the refs from lenses on disconnect. Leaving refs keeps the lens intact for
  a later reconnect; cascading is cleaner but loses the filter config. Leaning
  leave-dangling; confirm during apply.
- **`name` default** — show `host` when an account is unnamed (chosen), vs require a
  name. Unnamed-defaults-to-host keeps adding an account one step.

## Visual language

The Accounts surfaces inherit Lunma's atmosphere but read as **global
infrastructure**, so — unlike a lens page — they are **not** tinted by a Space hue;
they sit on the neutral `--surface`/glass ramp. Boldness is spent in one place: the
connect beat.

- **Motion.** The connect beat expands with `--motion-base` `--ease-emphasised`;
  the Options account rows reuse the existing card-list rise. Status pips are a
  **static colour step**, not a pulse. The picker checkbox + filter chips animate on
  `--motion-fast` `--ease-standard`. All collapse under `prefers-reduced-motion`
  (the beat appears instantly; no rise).
- **Colour.** The only saturated colour is the status pip, always paired with a word
  (WCAG-AA): `--success` (Connected), `--text-dim` (Browser session), `--warning`
  (Add a token / Reconnect). Provider glyphs and identity text are the neutral
  `--text-*` ramp; the connect field uses the standard accent focus halo and a
  `--danger` border on a bad token. No Space hue here.
- **Hierarchy.** In the manager, the account identity (provider glyph + name/host,
  Mona Sans medium) leads; the **reach** subline ("feeds 3 lenses", `--text-dim`,
  reach-not-config) recedes; the pip + a `⋯` menu sit right in a fixed column so the
  list reads as a clean ledger. In the editor, accounts are quiet checkable rows;
  filters are secondary chips that only appear once an account is picked.
- **Interaction feedback.** Account row hover → `--surface-2`; focus-visible → the
  standard `--focus-color` ring; the connect field's bad-token error states what to
  fix in the interface's voice — "That token didn't work — check it can read pull
  requests." Disconnect routes through a confirm with the in-use warning. Adding a
  session-capable account shows an immediate `Connected` pip with no field — the
  zero-config default made visible.

Arc's vertical workspace informs the atmosphere; Lunma diverges by treating a
connected account as a **reusable object you assemble lenses from**, surfaced as an
identity with a reach, not a buried setting.
