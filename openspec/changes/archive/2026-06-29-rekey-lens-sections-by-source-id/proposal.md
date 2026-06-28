## Why

Today a lens that references **two accounts on the same host** silently loses
one of them. `sourceKey` — the per-section identity used by the SW writer, the
sidebar, and the overview page — is `${source}:${host}:${query}`, so a user with
a **work and a personal `github.com`** account (both `authored`) in one lens
produces the identical key `github:github.com:authored` for both: the second
fetch overwrites the first in `LensRuntime.sections`, the two share one collapse
state, their pinned-tab bindings collide, and their feed read-marks merge. The
account model has allowed multiple accounts per `(provider, host)` since
`decouple-source-accounts`, but the section identity never caught up.

This change re-keys lens sections by the **account `sourceId`** (which already
uniquely identifies an account, including its host and — for the upcoming
Bitbucket Cloud support — its workspace), so each referenced account renders as
its own section. It delivers a direct user-visible fix (two same-host accounts in
one lens now coexist) **and** is the named prerequisite for
`add-bitbucket-connector`, whose "one account per Cloud workspace, add several"
pattern would otherwise collide on `bitbucket:bitbucket.org:authored`.

## What Changes

- **`sourceKey(cfg)` keys by `sourceId`, not host.** New format:
  `${cfg.sourceId}:${cfg.query}` for a queue section, `${cfg.sourceId}` for a
  feed (rss). The function stays pure, single-canonical
  (`shared/lens-labels.ts`), and identical across SW / sidebar / overview.
  `cfg.sourceId` is already present on every `ResolvedLensSource` (stamped by
  `resolvedConfigs`), so no surface gains new inputs.
- **Namespaced item ids and read-state ids follow.** Both the
  `${sourceKey}:${nativeId}` `namespacedItemId` (used by `lensItemBindings` and
  the overview activation path) and the persisted `lensReadState` ids
  (`${sourceKey}:${nativeId}`, written by `markLensItemRead`, pruned by
  `sourceKey` prefix) become `${sourceId}:${query}:${nativeId}` (rss:
  `${sourceId}:${nativeId}`).
- **A v14→v15 migration rewrites BOTH persisted slices.** `lensItemBindings`
  and `lensReadState` are both persisted and both embed `sourceKey`. The
  migration rewrites each legacy id/key by **match-first** resolution: for each
  account in `AppState.sources` it tests the `${provider}:${host}:` prefix
  (`host = new URL(baseUrl).host`, port-bearing) against the legacy id, and on a
  unique match rewrites the prefix to that account's `sourceId`. A blind
  `split(':')` is **not** used — a host may carry a port and an rss `nativeId`
  is a URL, both colon-bearing. Ids with **no** matching account, or an
  **ambiguous** match (two accounts on one host — the collision being fixed,
  where the legacy id cannot say which account it belonged to), are **dropped**.
  Dropped *bindings* re-arm via the existing boot/boundary re-arm; dropped *read
  marks* do not self-heal, so those few items reappear unread once (a bounded,
  acceptable one-time cost — documented).
- **Schema:** bump `CURRENT_SCHEMA_VERSION` 14 → 15. The migration is a real
  key-rewrite transform, so it takes a version. `AppStateV15Schema` is a
  structural **alias** of `AppStateV14Schema` (only untyped map-key strings
  change), so every `AppStateV14`/`AppStateV14Schema` reference elsewhere in the
  storage spec (e.g. the salvage path) stays valid.
- The display labels (section header host/name) are unchanged — they derive from
  the referenced account, not from `sourceKey`.

No new `ui/` primitive and no surface redesign — this is a section-identity
correction. No new public type.

## Capabilities

### New Capabilities

_None._ This modifies existing lens behaviour.

### Modified Capabilities

- `lenses`: `sourceKey` derivation and the cross-surface section-identity
  contract re-key by `sourceId`; the `namespacedItemId` (bindings + page
  activation), the collapse-state key, the host-permission-gate / needs-access
  section keys, and the persisted read-state id all follow.
- `storage-and-migrations`: `CURRENT_SCHEMA_VERSION` 14 → 15 with a v14→v15
  transform migration that rewrites persisted `lensItemBindings` and
  `lensReadState` keys/ids; the versioned-envelope, read-state, migrations-list,
  runner, and coherence requirements move to v15.

## Impact

- **Docs:** updates `docs/architecture.md` (the section-identity / `sourceKey`
  description, if present). Leaves `docs/tech-stack.md` untouched.
- **Modified code:** `shared/lens-labels.ts` (`sourceKey`),
  `shared/migrations.ts` (v15 transform over both bindings + read-state),
  `shared/schemas.ts` (`CURRENT_SCHEMA_VERSION` 14 → 15, `AppStateV15Schema`
  alias of `AppStateV14Schema`, `EnvelopeSchema.state` + the runner's validation
  target + the `AssertEqual` coherence target all pointed at `AppStateV15Schema`),
  `shared/store.svelte.ts` (`SCHEMA_VERSION`). Any call site that constructs or
  parses a section key / namespaced id from `source`/`host` rather than calling
  `sourceKey`/the canonical prefix-match is reworked to go through the canonical
  function (audit confirms current call sites already route through `sourceKey`
  and parse match-first).
- **Tests:** every test asserting the old `${source}:${host}:${query}` key/id
  format updates to the `${sourceId}:${query}` form
  (`shared/lens-labels.test.ts` and any binding/runtime/read-state tests); a new
  migration test covers binding-key **and** read-state-id rewrite, the no-match
  drop, the ambiguous-match drop, a **port-bearing host**, an **rss URL
  nativeId**, and idempotency.
- **Downstream:** `add-bitbucket-connector` depends on this change and rebases
  its schema bump to v16; its Bitbucket Cloud workspace accounts then key
  distinctly with no further work.
- **No new runtime dependency.**
