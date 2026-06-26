<!-- Sequencing: this change builds on `review-lens` (v12, lensKind 'general'|'review',
     ResolvedLensSource.lensKind). Archive `review-lens` BEFORE applying this change so
     the deltas land on the correct living spec. -->

## 1. Schema, types & migration (foundation)

- [ ] 1.1 Add `SourceId` and the `SourceAccount` interface (`{ id, provider, baseUrl, name? }`) and `LensSourceRef` (`{ sourceId, queries }`) to `apps/extension/src/shared/types.ts`; add `AppState.sources: { [id: SourceId]: SourceAccount }`.
- [ ] 1.2 Change the lens `PinNode`'s `sources` from `LensSource[]` to `LensSourceRef[]`; add `sourceId: SourceId` to `ResolvedLensSource`; add `type AuthMethod = 'session' | 'pat'`. **Keep `LensSource` exported** as the legacy embedded shape (the v13 migration + the OPML import path read it); it is just no longer a lens-node field.
- [ ] 1.3 Add `SourceAccountSchema` (`z.strictObject`, no token field) and `LensSourceRefSchema` to `apps/extension/src/shared/schemas.ts`; add the `sources` slice (`z.record(z.string(), SourceAccountSchema).default({})`) and the lens branch `sources: z.array(LensSourceRefSchema).min(1)` in `AppStateV13Schema` (= V12 + these); freeze `AppStateV12Schema`/`PinNodeV12Schema`. Bump `CURRENT_SCHEMA_VERSION` to `13`; update the `AssertEqual` guard to `AppStateV13`.
- [ ] 1.4 Point the runtime validators at `AppStateV13Schema` (`messages.ts`, `backup.ts`, `chrome/storage.ts`); update the `AppStateV11/V12` type usages in `storage.ts`/tests to `AppStateV13`.
- [ ] 1.5 Append the `{ toVersion: 13 }` migration in `migrations.ts`: for every lens node, mint one `SourceAccount` per distinct `(provider, baseUrl)` across all lenses (dedupe; carry source `name` onto the account; UUID id), add to `state.sources`, rewrite each lens's `sources` to `{ sourceId, queries }`.
- [ ] 1.6 Re-key the secrets store: rename `ConnectorsRecord` to `{ [sourceId]: string }`, `readConnectors`→`readAccountTokens`, `setConnectorToken(host,…)`→`setAccountToken(sourceId,…)` in `shared/connectors.ts` (same key, same never-log/never-broadcast guarantees).
- [ ] 1.7 Add a boot-chain `reconcileAccountSecrets` step: when `lunma.connectors` still holds bare-host keys, move each onto the `sourceId` of the account on that host (unambiguous post-migration), remove the host key; idempotent, `debug`-logged without token material. Wire it after `readPersistedState` in the boot sequence.
- [ ] 1.8 Tests: v13 migration (extract + dedupe + rewrite; two lenses share one account); a v12 embedded-source node is rejected under `AppStateV13Schema`; the migrations list has twelve entries; `reconcileAccountSecrets` re-keys host→sourceId and is idempotent; round-trip of an `AppState.sources` account; salvage covers the `sources` slice + ref-shaped lens nodes.

## 2. Connector contract, auth methods & resolution

- [ ] 2.1 Add `readonly authMethods: AuthMethod[]` to `SourceConnector` (`connectors/connector.ts`); declare `github ['pat']`, `gitlab ['session','pat']`, `jira ['session']`, `rss []`.
- [ ] 2.2 `resolvedConfigs(node)` (`background/lenses.ts`): resolve each `LensSourceRef` against `appState.sources` → `ResolvedLensSource` carrying `source`/`baseUrl`/`name?` (from the account), `query?`, `lensKind`, `sourceId`; drop refs whose account is missing (dangling). Thread the store's `sources` to the engine.
- [ ] 2.3 Connectors look up the token by `cfg.sourceId` (`github.ts`, `gitlab.ts`) via `readAccountTokens()[cfg.sourceId]`; gitlab's PAT-then-session ladder keys on `sourceId`; jira unchanged (session-only).
- [ ] 2.4 Add a shared `deriveAuthMethod(provider, hasToken)` / `deriveAuthStatus` helper (precedence: `public` → `pat` → `session` → `needs-token`) used by both the connectors and the surfaces.
- [ ] 2.5 Sweep `ResolvedLensSource` literal constructions for the now-required `sourceId` (connector test fixtures, `lenses.test.ts`, the page/sidebar local section-expansion copies) so `tsc`/`svelte-check` stay green.
- [ ] 2.6 Connector tests: token resolves by `sourceId` (two same-host accounts hold distinct tokens); `authMethods` declared per provider; `deriveAuthStatus` precedence; a dangling ref yields no section.

## 3. Account lifecycle (bus + store + handlers)

- [ ] 3.1 Add `createAccount` / `renameAccount` / `deleteAccount` to the `SidebarCommand` union + Zod command schemas in `shared/bus.ts` (`createAccount` carries a client-minted `id`, `provider`, `baseUrl`, optional `name`).
- [ ] 3.2 Add single-writer `sources` mutators to the store (`addSource`/`renameSource`/`removeSource`), seeding `state.sources = {}` in `createInitialState`.
- [ ] 3.3 Add `background/handlers/accounts.ts` (or extend `handlers/lenses.ts`): stamp the account on `createAccount` (validate baseUrl, reject duplicate id), rename, delete; `deleteAccount` leaves dangling lens refs (design D9 / open question) and is paired by the surface with `setAccountToken(id, null)`.
- [ ] 3.4 Thread `sources: LensSourceRef[]` through the `createLens`/`updateLens` payloads (replace embedded `LensSource[]`); the handler validates each `sourceId` resolves.
- [ ] 3.5 Handler tests: `createAccount` persists + rejects duplicate id + normalizes baseUrl; `deleteAccount` removes the entity; `createLens` with an unknown `sourceId` errors; `updateLens` ref/filter change refetches affected sections only.
- [ ] 3.6 OPML under accounts (`shared/opml.ts` + `importOpml` handler): `buildOpml(nodes, sources)` resolves each `LensSourceRef` against the account map and emits one `<outline>` per rss-resolving ref (skips dangling); `importOpml` find-or-mints an rss `SourceAccount` per valid feed (dedupe by normalized baseUrl) and builds the lens with `LensSourceRef[]`. Update `FeedSubscriptions.svelte` export-button presence to key on a referenced rss account.
- [ ] 3.7 OPML tests: build resolves refs (and skips a dangling ref); import mints+references rss accounts, reuses an existing account for a repeated feed URL, and the export button presence follows a referenced rss account.

## 4. ui/ primitives (token-driven)

- [ ] 4.1 `apps/extension/src/ui/AccountChip.svelte` — `{ provider; label; status: 'connected'|'browser-session'|'needs-token'|'signed-out'|'public'; title? }`, provider glyph + label + a status pip paired with a word (never colour-only). Composes `Icon`. + harness + test.
- [ ] 4.2 `apps/extension/src/ui/AccountConnectField.svelte` — `{ host; method-aware (required|optional); hasToken; onConnect; onReplace; error? }`, composing `TextInput type=password` + `Button`; "Token set · Replace" collapse; never echoes; "How to create one ↗" helper. + harness + test.
- [ ] 4.3 Stylelint passes for both primitives (token/primitive contract); none hard-code design values.

## 5. Editor — account assembly

- [ ] 5.1 Rework `sidebar/LensEditor.svelte` Sources list into an **account picker**: connected accounts (filtered to the kind's allowed providers) as pickable rows with per-reference filter chips; remove the URL/host card form.
- [ ] 5.2 "+ Connect an account" flow: capture provider + baseUrl (+ name) + the inline `AccountConnectField`; mint via `createAccount` (client UUID) + `setAccountToken`; return pre-selected to the picker.
- [ ] 5.3 Confirm dispatches `createLens`/`updateLens` with `sources: LensSourceRef[]`; block when no account selected / a queue account has no filters / a connect flow is incomplete.
- [ ] 5.4 Editor tests: assembling from a connected account dispatches refs; inline connect mints an account and pre-selects it; review kind shows only github/gitlab accounts; no-account-selected disables confirm.

## 6. Signed-out inline reconnect + dangling state

- [ ] 6.1 `sidebar/Lens.svelte`: the `signed-out` row becomes method-aware — session-capable → "Sign in to {host}" (+ optional add-token); pat-only/bad-token → inline `AccountConnectField` reconnect that writes `setAccountToken(sourceId,…)` then dispatches `refreshLens`. Add the calm "Account removed — reconnect or pick another" state for a dangling ref.
- [ ] 6.2 Mirror the reconnect + dangling states in `launcher/lenspage/GeneralLens.svelte` and `ReviewQueue.svelte` (replace the "Add a token in Settings → Connectors" / `openConnectorsSettings` path).
- [ ] 6.3 Tests: a signed-out github section reconnects inline (writes token + refreshLens, no navigation); a session lens still shows "Sign in to {host}"; a dangling ref shows the calm removed state; bad-token copy renders.

## 7. Options — Accounts manager

- [ ] 7.1 Evolve `options/ConnectorsCard.svelte` into the Accounts manager: list accounts with provider/name/host, derived status (`AccountChip`), and **reach** (distinct lens nodes across **all** `pinnedBySpace[*]` referencing the account — the options page now reads `pinnedBySpace`); connect / rename / disconnect / replace-token; never echo a token.
- [ ] 7.2 Disconnect warns when the account still feeds lenses; disconnect = `deleteAccount` + `setAccountToken(id, null)`.
- [ ] 7.3 Tests: the manager lists accounts + reach; setting a token writes by `sourceId` + takes effect next poll; disconnect-in-use warns; token never in the DOM.

## 8. Docs & artifact sync

- [ ] 8.1 Update `docs/lenses-vision.md`: record Accounts as the first-class source entity and the reference-based lens↔source model (the `LensSource = { provider, baseUrl, filters }` line becomes a referenced `SourceAccount` + `LensSourceRef`).
- [ ] 8.2 Update `docs/architecture.md`: the surface/storage table (the secrets store is keyed by `sourceId`; `AppState.sources` is added; sidebar/launcher write tokens inline via `shared/connectors.ts`, not only Options).
- [ ] 8.3 Confirm `proposal.md` / `design.md` / specs match the landed code (names, files, fields); reconcile any implementation-forced rename in the same change.

## 9. Quality gates & exit criteria

- [ ] 9.1 `pnpm --filter @lunma/extension verify` is green (tsc, biome incl. layer DAG, svelte-check, stylelint, vitest).
- [ ] 9.2 `pnpm verify` at the workspace root is green.
- [ ] 9.3 `pnpm test:e2e` passes (connect an account inline; a lens referencing it renders; the generic + review pages are unaffected).
- [ ] 9.4 New `ui/` primitives, the schema/migration, and the account lifecycle meet the repo's coverage bar; a persist test asserts `AppState.sources` persists (accounts) while **no token** ever reaches `AppState`/broadcast, and the secrets store is keyed by `sourceId`.
