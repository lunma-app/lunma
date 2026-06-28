## Context

`sourceKey(cfg: ResolvedLensSource): string` (`shared/lens-labels.ts:11`) is the
single canonical section-identity function shared by the SW (the single writer
that drains results), the sidebar, and the overview page. It returns
`${source}:${new URL(baseUrl).host}:${query}` for a queue section and
`${source}:${host}` for a feed. Two normative requirements pin this format
("Source key derivation is pure and stable", "Section identity is computed
identically across surfaces"), and it is embedded in `namespacedItemId`
(`${sourceKey}:${nativeId}`) used by the **persisted** `lensItemBindings` (schema
v9) AND in the **persisted** `lensReadState` ids (`${sourceKey}:${nativeId}`,
written by `markLensItemRead`, pruned by `sourceKey` prefix). The per-window
collapse map and other ephemeral slices are also `sourceKey`-keyed but recompute.

Since `decouple-source-accounts` the account model allows multiple `SourceAccount`s
per `(provider, baseUrl)` (e.g. a work and a personal `github.com`), but
`sourceKey` keys by host, so two such accounts in one lens collapse to one
section, sharing runtime, bindings, collapse state, and read marks.
`add-bitbucket-connector` makes this acute: a Cloud bitbucket user adds one
account per workspace (all on `bitbucket.org`). `ResolvedLensSource` already
carries `sourceId` (stamped by `resolvedConfigs`), so the fix needs no new
plumbing.

## Goals / Non-Goals

**Goals:**
- Each referenced account renders as its own lens section, even when two accounts
  share a `(provider, host)`.
- One canonical, pure `sourceKey` keyed by `sourceId`, identical on every surface.
- Both persisted `sourceKey`-embedding slices (`lensItemBindings`,
  `lensReadState`) survive the key change (rewritten where unambiguous, dropped
  where not) with no value-shape change.

**Non-Goals:**
- Any change to how section **labels** (host/name) render — those derive from the
  account, not the key.
- Bitbucket itself (a separate, dependent change).
- Allowing duplicate identical accounts (same id) — `createAccount` already
  rejects duplicate ids.

## Decisions

### D1 — Key by `sourceId`, dropping host from the key

`sourceKey` becomes `${cfg.sourceId}:${cfg.query}` (queue) / `${cfg.sourceId}`
(feed). `sourceId` is a client-minted UUID that uniquely identifies an account
including its host and workspace, so two same-host accounts now key distinctly.
The function stays pure and canonical in `shared/lens-labels.ts`.

The base "Source key derivation is pure and stable" requirement names the
function as living in `background/lenses.ts`; the actual canonical location is
`shared/lens-labels.ts` (`lenses.ts:47` only re-exports it; the sidebar/overview
cannot import `background/` under the layer DAG). This change's delta corrects
that location reference to match the code — a normative-name fix, recorded here
per the names-are-normative policy.

**Alternative considered:** append `workspace` to the key for Cloud bitbucket
only. Rejected — it fixes only the bitbucket sub-case and leaves the identical
pre-existing github collision unaddressed; keying by `sourceId` fixes the root
cause once.

### D2 — Migrate BOTH persisted slices (v14 → v15) with match-first parsing

`lensItemBindings[folderId]` (keys) and `lensReadState[folderId][]` (id strings)
both embed `sourceKey`. The v15 migration rewrites both with one shared helper.

A legacy id is `${source}:${host}:${query}:${nativeId}` (queue) or
`${source}:${host}:${nativeId}` (rss, no query). It **cannot** be recovered by a
blind `split(':')`: a host may carry a port (`git.example.com:8443`) and an rss
`nativeId` is `entry.id ?? entry.url` — a URL full of colons. The rewrite is
therefore **match-first** (mirroring how the sidebar already parses,
`Lens.svelte` `startsWith(\`${sk}:\`)` + `slice`):

1. for each account in `state.sources`, compute its prefix
   `${account.provider}:${new URL(account.baseUrl).host}:`;
2. find accounts whose prefix the legacy id `startsWith`;
3. **longest-matching-prefix wins** — among the matches, pick the account with
   the **longest** prefix, strip it, and re-prepend `${account.id}:`, yielding
   `${account.id}:${query}:${nativeId}` (queue) or `${account.id}:${nativeId}`
   (rss — the remainder, a URL, is preserved verbatim);
4. **no** match (account deleted) → **drop**; a **tie at the maximal prefix
   length** (two accounts whose `${provider}:${host}:` are *identical* — i.e. the
   genuinely same-origin collision this change exists to fix, where the legacy id
   cannot say which account it belonged to) → **drop**.

**Why longest-prefix, not "exactly-one match".** A port-less host is a string
prefix of its port-bearing sibling: `acc-A` on `git.example.com` has prefix
`gitlab:git.example.com:`, which `startsWith`-matches `acc-B`'s id
`gitlab:git.example.com:8443:authored:99` *as well as* `acc-B`'s own longer
prefix `gitlab:git.example.com:8443:`. These are **distinct origins** that the old
key format already kept distinct, so they must NOT be treated as an ambiguous
collision. Longest-prefix routes `acc-B`'s id to `acc-B` (its `…:8443:` prefix is
longer), and `acc-A`'s id `gitlab:git.example.com:authored:99` matches only
`acc-A` (the next segment is `authored`, not `8443:`). A true drop arises only
when two accounts share an *identical* `provider:host:` prefix (same host, same
port) — the real same-origin case. Queue queries (`authored`/`assigned`/
`review-requested`) and rss URL nativeIds never numerically alias a port segment,
so no false tie occurs.

Drop semantics differ by slice: a dropped **binding** re-arms via the existing
boot/boundary re-arm for lens-item tabs (no loss — a binding only maps an open
tab to an item). A dropped **read mark** does not self-heal, so the few affected
items reappear unread once — a bounded, acceptable one-time cost (only the
genuinely same-origin two-account case, plus deleted-account orphans).

**Idempotency (D2a).** A re-run must be a no-op. An id is **already migrated**
iff its first colon-delimited segment is a key of `state.sources` (a `sourceId`).
The helper skips such ids unchanged. (Legacy ids never collide with this test —
their first segment is a provider enum value, never a minted account id.)

The binding/read-state **value** shapes are unchanged, so `AppStateV15Schema` is
structurally identical to `AppStateV14Schema` and is defined as a re-exported
**alias** (`export const AppStateV15Schema = AppStateV14Schema`). This keeps every
`AppStateV14`/`AppStateV14Schema` reference elsewhere in the storage spec (the
partial-corruption salvage path, typed at `AppStateV14`) valid without a churn
edit — the names still exist and denote the current schema.

**Alternative considered:** drop all `lensReadState` on migration (simplest,
zero ambiguity). Rejected — it marks every read feed item unread on upgrade for
*every* user, a far worse UX than the match-first rewrite which only loses the
genuinely-ambiguous minority.

**Alternative considered:** no migration — let every old key go stale and
re-arm. Rejected — read marks don't re-arm, and it leaves dead persisted entries
that never prune (the prune-by-prefix never matches the new keys).

### D3 — Schema v14 → v15; add-bitbucket rebases to v16

`CURRENT_SCHEMA_VERSION` 14 → 15, `SCHEMA_VERSION` in lockstep, a real
`{ toVersion: 15 }` transform migration. `EnvelopeSchema.state` and the migration
runner's validation target both point at `AppStateV15Schema` (the alias).
`add-bitbucket-connector` (previously targeting v15) rebases its identity
migration to **v16** and depends on this change.

**Schema-base note.** The living `storage-and-migrations` spec is internally
drifted: "Versioned local-storage envelope" still says "current version SHALL be
13", while "Partial-corruption salvage" already names `AppStateV14`/
`AppStateV14Schema` — the consequence of `lens-view-filters` (v14, unarchived)
landing v14 in code while its delta only ADDed a requirement and never updated
the version-pinning requirements. This change is the first to MODIFY those
requirements since the drift, so it brings **all** of them into coherence at v15:
the versioned-envelope version, the migrations-list count/chain, the runner's
schema target, the read-state id form, the coherence assertion, and the
**corruption-quarantine** Zod-failure branch (whose two scenarios + prose still
named the long-stale `AppStateV12Schema`, re-pointed to `AppStateV15Schema`).
(Partial-corruption salvage's `AppStateV14` names stay valid via the V15-alias,
D2.)

**Ordering note (N2).** `lens-view-filters` uses ADDED-only for storage (verified
— no MODIFIED on these requirements), so there is no header-overwrite race with
this change. If `lens-view-filters` is later edited to MODIFY the
migrations-list/runner/coherence requirements, those edits MUST NOT revert the
v15 corrections this change introduces.

## Risks / Trade-offs

- **Ambiguous/orphan read marks dropped** → for a user who already had two
  same-host accounts in one lens (already broken — sections overwrote) or a
  deleted account, the affected read marks can't be remapped and are dropped;
  those items reappear unread once. Mitigation: bounded, one-time, and only the
  already-lossy minority; documented.
- **Ambiguous/orphan bindings dropped** → re-arm covers it (boot/boundary re-arm
  for lens-item tabs).
- **Stale-key tests** → many tests assert the old format. Mitigation: a single
  canonical function means a focused, mechanical update; the migration test pins
  the new behaviour incl. port and rss-URL cases.
- **Downgrade** → a v15 envelope opened by a pre-v15 build quarantines on the
  version gate (newer-data quarantine), not Zod-rejected.

## Migration Plan

The v15 migration rewrites `lensItemBindings` keys and `lensReadState` ids once
on boot when `persistedVersion < 15`, then the envelope is written back as
`{ schemaVersion: 15, state }`. Rollback: none needed (binding loss self-heals
via re-arm; read-mark loss is bounded and cosmetic). `docs/architecture.md`
updated in the same change. Ship this change before `add-bitbucket-connector`.

## Open Questions

None.
