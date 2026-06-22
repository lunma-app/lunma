## 1. Schema + migration (storage-and-migrations)

- [x] 1.1 In `apps/extension/src/shared/schemas.ts`: add `name: z.string().optional()` to `SmartSourceConfigSchema`; bump `CURRENT_SCHEMA_VERSION` to `10`; add `AppStateV10Schema` (= v9 schema with the optional `name`) as the current-version schema; keep the schema↔type coherence check green.
- [x] 1.2 In `apps/extension/src/shared/migrations.ts`: append `{ toVersion: 10, migrate: (raw) => raw }` (additive/identity — `name` is optional, nothing to transform).
- [x] 1.3 Update migration/schema tests for the v10 chain length + an additive-passthrough case; confirm a pre-v10 envelope round-trips.

## 2. Types + bus

- [x] 2.1 `apps/extension/src/shared/types.ts`: `SmartSourceConfig.name?: string | undefined`; add `name?` to `ResolvedSourceConfig`.
- [x] 2.2 `apps/extension/src/shared/bus.ts`: the command `SmartSourceConfigSchema` gains `name: z.string().optional()`.

## 3. Editor + rendering (smart-folders)

- [x] 3.1 `SmartFolderEditor.svelte`: a per-card optional Name `TextInput` (placeholder = host) bound to `s.name`; the card header identity prefers `name`; `confirm`/`dedupedSources` carry the trimmed `name`, omitting it when blank. Preserve merge/validation.
- [x] 3.2 `SmartFolder.svelte`: the `sections` derivation copies `cfg.name` onto each `ResolvedSourceConfig`.
- [x] 3.3 `SmartSectionHeader.svelte`: the label uses `cfg.name?.trim() || host` (queue still appends `· filter`).
- [x] 3.4 Background handlers: ensure `normalizeAndValidateSources` / create+update pass `name` through to the persisted node unchanged.

## 4. Tests

- [x] 4.1 Editor: a Name field renders per card; setting it dispatches `name` in the source; a blank name is omitted; the card header shows the name.
- [x] 4.2 Section header: a named source renders its name (rss: `name`; queue: `name · filter`); an unnamed source renders the host.

## 5. Verify

- [x] 5.1 Run `pnpm --filter @lunma/extension verify` and ensure green.
