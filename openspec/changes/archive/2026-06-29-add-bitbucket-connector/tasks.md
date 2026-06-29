## 0. Prerequisite

- [x] 0.1 Confirm `rekey-lens-sections-by-source-id` has landed (schema at v15; `sourceKey` keyed by `sourceId`). This change builds on it — do not start before it is applied

## 1. Shared types, schema & migration (foundation)

- [x] 1.1 Add `'bitbucket'` to `LensProvider` in `shared/types.ts` (`'gitlab' | 'github' | 'bitbucket' | 'jira' | 'rss'`), and add the optional `workspace?: string` field to the `SourceAccount` type
- [x] 1.2 Add `'bitbucket'` to `LensProviderSchema` enum in `shared/bus.ts` and add optional `workspace?` to the `createAccount` payload schema
- [x] 1.3 Widen **only** the current-version provider enum `SourceAccountSchema.provider` (schemas.ts:139) to include `'bitbucket'`, and add an optional `workspace: z.string().optional()` field to `SourceAccountSchema`. **Leave the historical `LensSourceSchema` (125) and `SmartSourceConfigV8Schema` (158) enums at four members** — they are frozen V6–V12 parse targets; `LensSourceRefSchema` (148) has no provider enum and is untouched
- [x] 1.4 Add `AppStateV16Schema` as a re-exported **alias** of `AppStateV15Schema` (the provider/`workspace` widening lives in the shared `SourceAccountSchema` from task 1.3, so no new AppState object shape is needed), bump `CURRENT_SCHEMA_VERSION` 15 → 16 (the prerequisite `rekey-lens-sections-by-source-id` brings it to 15), point `EnvelopeSchema.state` / the runner's validation target at `AppStateV16Schema`, add the `AppStateV16` type export, and update the coherence assertion `_schemaMatchesAppState: AssertEqual<AppStateV15, AppState>` → `AssertEqual<AppStateV16, AppState>` (schemas.ts:719) in `shared/schemas.ts`. (Because the widening is in the shared `SourceAccountSchema`, the existing `AppStateV14Schema` validators in `backup.ts`/`messages.ts` and the partial-corruption salvage path need no rename)
- [x] 1.5 Verify `SCHEMA_VERSION` in `shared/store.svelte.ts` tracks `CURRENT_SCHEMA_VERSION` (it is `export const SCHEMA_VERSION = CURRENT_SCHEMA_VERSION` — a re-export alias, so task 1.4 already advances it; no literal `16` to edit)
- [x] 1.6 Append `{ toVersion: 16, migrate: (raw) => raw }` (identity) to the `migrations` array in `shared/migrations.ts`
- [x] 1.7 Run `tsc --noEmit`; fix every `Record<LensProvider, …>` that now misses `bitbucket` (these are compile errors). Note: the provider `if`-chains in `lens-entity.ts` are NOT exhaustiveness-checked by `tsc`, so they must be updated by hand in §2 — do not rely on the compiler to flag them

## 2. Shared connector helpers

- [x] 2.1 Add `bitbucket: ['pat']` to `PROVIDER_AUTH_METHODS` in `shared/auth-method.ts`
- [x] 2.2 Insert `'bitbucket'` into `PROVIDERS` and `ACCOUNT_PROVIDERS` (between `gitlab` and `jira`) in `shared/account-ui.ts` (Account, not Feed; `isFeedProvider` stays `=== 'rss'`)
- [x] 2.3 Add `PROVIDER_LABEL['bitbucket'] = 'Bitbucket'` and `DEFAULT_BASE_URL['bitbucket'] = 'https://bitbucket.org'` in `shared/account-ui.ts`
- [x] 2.4 Add the `bitbucket` case to `tokenHelpUrl()` (link to Bitbucket access-token docs) in `shared/account-ui.ts`
- [x] 2.5 Add `bitbucket` to the `if`-chains in `entityForSource()` (→ `'change'`), `entitiesForSource()` (→ `['change', …]` as appropriate), and `deriveLensKind()` (git-source set) in `shared/lens-entity.ts`
- [x] 2.6 Add the Bitbucket origin derivation to `requiredOriginsForConfig()` in `shared/connector-origins.ts`: host `bitbucket.org` → `https://api.bitbucket.org/*`; any other host (Server/DC) → `baseUrl` origin
- [x] 2.7 Add `bitbucket` entries to `ICON_BY_SOURCE` (`'folder-git-2'`) and the `filterLabel()` provider handling in `shared/lens-labels.ts`

## 3. Bitbucket connector (SW)

- [x] 3.1 Create `background/connectors/bitbucket.ts` implementing `SourceConnector` with `source: 'bitbucket'`, `authMethods: ['pat']`, `defaultBaseUrl: 'https://bitbucket.org'`, `mintedIcon: 'folder-git-2'`; branch on `new URL(cfg.baseUrl).host === 'bitbucket.org'`
- [x] 3.2 Implement the Server/DC path: `GET {baseUrl}/rest/api/1.0/dashboard/pull-requests?state=OPEN&role=AUTHOR|REVIEWER` with `start`/`limit`/`isLastPage` pagination; no identity lookup; reviewers read inline from `reviewers[]`
- [x] 3.3 Implement the Cloud path (authored-only): resolve caller `uuid` via `GET /2.0/user` (cached in `ConnectorCaches` keyed by **`cfg.sourceId`**, storing the in-flight promise — NOT `baseUrl`, since multiple Cloud accounts share `bitbucket.org` but have distinct tokens/users), then `GET /2.0/workspaces/{cfg.workspace}/pullrequests/{uuid}?q=state="OPEN"` with `next`-cursor pagination
- [x] 3.4 Implement the Cloud per-PR reviewer fetch: for each listed PR (capped at `maxItems`), fetch PR detail to read `participants[]`, mapping to the reviewer bag (Cloud omits reviewers from the collection)
- [x] 3.5 Normalise both paths onto `LensItem`/`LensSectionRuntime`, slice to `maxItems`, and build the `change: ChangeData` bag (author, repo, targetBranch, draft [Cloud flag; Server `false`], additions/deletions where available, updatedAt) with reviewers mapped onto `approved | changes | pending`
- [x] 3.6 Implement token-only auth: Bearer header + `credentials: 'omit'`; look up token by `cfg.sourceId`; no token → short-circuit to `signed-out` without a request; route every request through `boundedFetch` (20s timeout → quiet `error`)
- [x] 3.7 Implement `requiredOrigins(cfg)` (matching `requiredOriginsForConfig`) and `listingUrl(cfg)` (Cloud `https://bitbucket.org/dashboard/pullrequests`; Server `{baseUrl}/dashboard`)
- [x] 3.8 Enforce the deployment-dependent query set: Server/DC supports `authored` + `review-requested`; Cloud supports `authored` only. A Cloud `review-requested` config resolves to the quiet `error` state without a request (defensive; the SW already rejects it at create/update — see 3.10)
- [x] 3.9 Import `bitbucketConnector` and register it in the `CONNECTORS` map in `background/lenses.ts`
- [x] 3.10 Add SW create/update validation rejecting a Cloud bitbucket source (host `bitbucket.org`) that carries `review-requested`, and ensure `resolvedConfigs` stamps `workspace?` from the referenced account onto `ResolvedLensSource`

## 4. UI surfaces

- [x] 4.1 Insert `'bitbucket'` ("Bitbucket", between GitLab and Jira) into `SERVICE_OPTIONS`, add the token-placeholder hint (Bearer access token, required), and add the **conditional `workspace` field** shown only when the chosen service is Bitbucket and the host resolves to `bitbucket.org` (required for Cloud) in `ui/ServiceConnectPicker.svelte`; commit passes `workspace` into `createAccount` for a Cloud bitbucket account
- [x] 4.2 Add `PROVIDER_GLYPH['bitbucket'] = 'folder-git-2'` in `ui/AccountChip.svelte`
- [x] 4.3 Add `MONO['bitbucket'] = 'BB'` in `launcher/lenspage/overview-vm.ts`
- [x] 4.4 Add `PROVIDER_ABBREV['bitbucket'] = 'BB'` in `options/ConnectionsCard.svelte` (`Record<LensProvider, string>` — fails `tsc` without it)
- [x] 4.5 Update the catalog stories for both edited primitives (component-library policy — required): `catalog/stories/ui/AccountChip.stories.svelte` (bitbucket glyph variant) and `catalog/stories/ui/ServiceConnectPicker.stories.svelte` (Bitbucket option + Cloud workspace field). Create either file if it does not yet exist

## 5. Tests

- [x] 5.1 Update the `CONNECTORS` registry test in `background/lenses.test.ts` to expect five keys (incl. `bitbucket`) and `bitbucket.authMethods === ['pat']`
- [x] 5.2 Add `bitbucket` coverage for `ICON_BY_SOURCE` and `filterLabel()` in `shared/lens-labels.test.ts` (extend the existing per-provider coverage; if there is no parametrized list, add explicit bitbucket cases)
- [x] 5.3 In `shared/bus.test.ts`: change the existing "createAccount rejects an out-of-vocabulary provider" case (line ~875) to use a still-invalid provider (e.g. `'mercurial'`) so rejection coverage is preserved, and add a new case asserting `provider: 'bitbucket'` is **accepted** (with `workspace` for Cloud). (`bus-adapter.test.ts` does not exist — do not reference it)
- [x] 5.4 Add `background/connectors/bitbucket.test.ts`: Server/DC fetch (dashboard role=AUTHOR/REVIEWER, both queries, inline reviewers), Cloud fetch (uuid lookup + `/2.0/workspaces/{ws}/pullrequests/{uuid}`, authored-only, per-PR reviewer fetch capped at maxItems), PR→`ChangeData` normalization for both shapes, no-token → `signed-out` without request, Bearer + `credentials: 'omit'`, Cloud `review-requested` → `error` without request, timeout → `error`, `requiredOrigins`/`listingUrl` for Cloud and Server
- [x] 5.5 Add tests: the migration chain holds `toVersion 2…16` and the v16 entry is an identity pass-through round-tripping a v15 envelope; `AppStateV16Schema` accepts a Cloud bitbucket account with `workspace` and a non-bitbucket account without it
- [x] 5.6 Add SW tests for create/update rejecting a Cloud bitbucket `review-requested` source and a Cloud bitbucket account created without `workspace`

## 6. Docs & verify

- [x] 6.1 Update `docs/architecture.md`: add Bitbucket to the connector roster; note the Server/DC (`/rest/api/1.0` dashboard, both queries) vs Cloud (`api.bitbucket.org/2.0`, workspace-scoped, authored-only, per-PR reviewer fetch) split; the `workspace?` account field; Bearer-token auth
- [x] 6.2 Run `pnpm verify` (extension): `tsc`, `biome check` (DAG + cycles), `svelte-check`, `lint:styles`, `verify:catalog`, `vitest run` (incl. story-parity guard) — all green
- [x] 6.3 Run `openspec validate add-bitbucket-connector --strict`
