## 1. Re-key sourceKey by sourceId

- [x] 1.1 Change `sourceKey(cfg)` in `shared/lens-labels.ts` to return `${cfg.sourceId}:${cfg.query}` for a queue section and `${cfg.sourceId}` for a feed (rss). Keep it pure, no I/O
- [x] 1.2 Audit every `sourceKey` call site and any code that constructs/parses a section key or `namespacedItemId` (bindings AND read-state) from `source`/`host` directly (`background/lenses.ts`, `background/handlers/lenses.ts`, the coordinator drain, `sidebar/Lens.svelte`, `launcher/lenspage` overview, collapse-state writers, `markLensItemRead`/`pruneLensReadState`); route all through the canonical function / new format (current code already parses match-first via `startsWith(\`${sk}:\`)` — verify it still holds)
- [x] 1.3 Confirm `ResolvedLensSource.sourceId` is populated at every `sourceKey` call (stamped by `resolvedConfigs`); no surface needs new inputs

## 2. Schema bump & binding/read-state migration

- [x] 2.1 Bump `CURRENT_SCHEMA_VERSION` 14 → 15 in `shared/schemas.ts`; add `AppStateV15Schema` as a re-exported **alias** of `AppStateV14Schema` (`export const AppStateV15Schema = AppStateV14Schema`); add the `AppStateV15` type export; point `EnvelopeSchema.state` at `AppStateV15Schema`; point the runner's validation target at `AppStateV15Schema`; and update the coherence assertion target to `AssertEqual<AppStateV15, AppState>` (schemas.ts:719)
- [x] 2.2 Verify `SCHEMA_VERSION` in `shared/store.svelte.ts` tracks `CURRENT_SCHEMA_VERSION` (it is `export const SCHEMA_VERSION = CURRENT_SCHEMA_VERSION` — a re-export alias, so task 2.1 already advances it; no literal `15` to edit)
- [x] 2.3 Append `{ toVersion: 15, migrate }` to `shared/migrations.ts`. Write ONE shared helper that rewrites a legacy namespaced id **match-first by longest prefix**: for each account in `state.sources`, test the prefix `${account.provider}:${new URL(account.baseUrl).host}:` against the id with `startsWith`; among matches pick the **longest** prefix and replace it with `${account.id}:`; drop (return null) only when no account matches OR two accounts share an identical `provider:host:` prefix (same host+port). **Do NOT use "exactly-one match → rewrite"** — a port-less host (`git.example.com`) is a string prefix of its port-bearing sibling (`git.example.com:8443`), so a plain `startsWith` double-matches and would wrongly drop the port-bearing account's data; longest-prefix routes each to its own account. Do NOT `split(':')` (host carries ports; rss nativeIds are URLs). Apply to (a) every `lensItemBindings[folderId]` **key** and (b) every `lensReadState[folderId][]` **id**. Idempotent: if an id's first segment is already a key of `state.sources`, leave it unchanged. Synchronous, pure

## 3. Tests

- [x] 3.1 Update `shared/lens-labels.test.ts` and any runtime/binding/read-state tests asserting the old `${source}:${host}:${query}` key/id to the `${sourceId}:${query}` form
- [x] 3.2 Add a migration test covering: a single-account binding key AND read-state id rewrite onto the `sourceId`; idempotent on re-run; an unmappable id (no matching account) dropped; a same-origin-ambiguous id (two accounts with identical `provider:host:`) dropped; a **port-bearing host coexisting with a port-less sibling** (`git.example.com` + `git.example.com:8443`) where the port-bearing id rewrites onto its own account and is NOT dropped (longest-prefix); an **rss URL nativeId** (`https://x.com/post/1`) rewritten correctly (match-first, not colon-split)
- [x] 3.3 Add a test proving two same-host accounts in one lens produce distinct `sourceKey`s and distinct runtime sections (no overwrite), and distinct read sets

## 4. Docs & verify

- [x] 4.1 Update `docs/architecture.md` if it describes the `sourceKey`/section-identity format (re-key by `sourceId`; binding + read-state migration)
- [x] 4.2 Run `pnpm verify` (extension) — all gates green
- [x] 4.3 Run `openspec validate rekey-lens-sections-by-source-id --strict`
