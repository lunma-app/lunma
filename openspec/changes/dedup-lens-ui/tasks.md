## 1. Shared module

- [x] 1.1 Create `apps/extension/src/shared/lens-labels.ts` exporting the canonical `sourceKey(cfg: ResolvedLensSource): string` (port-bearing host; malformed `baseUrl` degrades to the raw string for the host segment per design D1/D3).
- [x] 1.2 Add `ICON_BY_SOURCE` + `sourceIcon(source): string` and `filterLabel(source, query): string` to `lens-labels.ts`, moved verbatim from `sidebar/LensSectionHeader.svelte`.
- [x] 1.3 Re-export `hostOf` from `shared/label-for.ts` via `lens-labels.ts` (or have callers import `label-for` directly) so there is exactly one `hostOf`.
- [x] 1.4 Add `apps/extension/src/shared/lens-labels.test.ts`: `sourceKey` parity for cloud, self-hosted-with-non-default-port, filtered (`source:host:query`), and malformed-URL inputs; `sourceIcon`/`filterLabel` mapping coverage.

## 2. Rewire surfaces

- [x] 2.1 `background/lenses.ts` — delete local `sourceKey`; import from `shared/lens-labels.ts`; keep its public export (re-export) so existing background callers are unaffected.
- [x] 2.2 `launcher/lenspage/overview-vm.ts` — delete local `sourceKey` and local `hostOf`; import both from `shared/` (this is where the section-key fix lands).
- [x] 2.3 `sidebar/Lens.svelte` — delete local `sourceKey`; import from `shared/lens-labels.ts`.
- [x] 2.4 `sidebar/LensSectionHeader.svelte` — delete local `ICON_BY_SOURCE` and `filterLabel`; import from `shared/lens-labels.ts`.

## 3. Tests & verification

- [x] 3.1 Update `overview-vm.test.ts`, `LensSectionHeader.test.ts`, and `background/lenses.test.ts` to source the helpers from `shared/lens-labels.ts` (drop assertions on the deleted local copies).
- [x] 3.2 Add/extend a test asserting the overview page and the SW agree on `sourceKey` for a self-hosted source on a non-default port (the spec's consistency scenario).
- [x] 3.3 `pnpm verify` clean (tsc, biome incl. layer DAG + import-cycle, svelte-check, lint:styles, vitest); `pnpm test:e2e` smoke unaffected.
