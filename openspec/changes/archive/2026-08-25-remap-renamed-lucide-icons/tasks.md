## 1. Dependency bump

- [x] 1.1 Bump `@lucide/svelte` to `1.31.0` in `apps/extension/package.json` and refresh `pnpm-lock.yaml`
- [x] 1.2 Confirm the five successors ship in the installed package (`face-slightly-frowning`, `face-slightly-smiling`, `face-slightly-smiling-plus`, `mic-signal`, `rotate-ccw-clock` resolve under `@lucide/svelte/icons/`)

## 2. Icon names (RED first)

- [x] 2.1 Add the failing test asserting `ICON_NAMES` carries none of `frown`/`smile`/`smile-plus`/`podcast`/`history` and all five successors
- [x] 2.2 Rename the five entries in `apps/extension/src/shared/icon-names.ts`, keeping each name in its existing alphabetical neighbourhood (the list is near-sorted, not strictly sorted)
- [x] 2.3 Point the sidebar "Reset name" menu item at `rotate-ccw-clock` in `apps/extension/src/sidebar/PinnedTabs.svelte`
- [x] 2.4 Run `pnpm --filter @lunma/extension gen:icons` and confirm `src/ui/icon-loaders.generated.test.ts` passes

## 3. Schema v18

- [x] 3.1 Raise `CURRENT_SCHEMA_VERSION` to `18` and add `AppStateV18Schema` as a structural alias of `AppStateV17Schema` in `apps/extension/src/shared/schemas.ts`; point `EnvelopeSchema` at it
- [x] 3.2 Export `AppStateV18` type alongside the existing per-version type exports

## 4. Migration v18 (RED first)

- [x] 4.1 Add failing `migrations.test.ts` cases: a Space icon remaps, a `kind: 'folder'` `PinNode` icon remaps, an unaffected/unknown name is untouched, the transform is idempotent, and malformed slices (missing, non-array, non-object node) pass through without throwing
- [x] 4.2 Add module-private `RENAMED_ICONS: Record<string, string>` and the `{ toVersion: 18 }` entry to `apps/extension/src/shared/migrations.ts`
- [x] 4.3 Confirm `assertMigrationsTerminal(migrations, CURRENT_SCHEMA_VERSION)` passes and any test asserting the chain length/entry list is updated to seventeen entries ending at 18

## 5. Verify

- [x] 5.1 `pnpm verify` at the workspace root is green (typecheck, biome, svelte-check, stylelint, catalog gate, vitest, site)
- [x] 5.2 `pnpm test:e2e` is green
- [x] 5.3 `openspec validate remap-renamed-lucide-icons --strict` passes
