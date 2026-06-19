> Status: **authored, not yet implemented.** All tasks pending `/opsx:apply`.
> Phase 1 (this change) = build + attach the GitHub release artifact. The Chrome
> Web Store upload is a deferred later phase of this capability (design D4).

## 1. Build + attach the release artifact

- [x] 1.1 In `.github/workflows/release-please.yml`, give the
  `googleapis/release-please-action@v4` step an `id` (e.g. `id: release`) so its
  outputs (`release_created`, `tag_name`, `version`) are referenceable.
- [x] 1.2 Add toolchain-setup steps after the release-please step, each gated on
  `if: ${{ steps.release.outputs.release_created == 'true' }}`: `actions/checkout@v6.0.3`,
  `actions/setup-node@v6` (node 24), `corepack enable` (with
  `COREPACK_ENABLE_DOWNLOAD_PROMPT: 0`), the pnpm store-path + `actions/cache@v5`
  step, and `pnpm install --frozen-lockfile` — same pinned-toolchain pattern as
  `ci.yml` (design D1).
- [x] 1.3 Add a build step (gated): `pnpm --filter @lunma/extension run pack` →
  produces `apps/extension/extension.zip` (reuses the existing `pack` script;
  `run` is required so pnpm runs the script, not its built-in `pack` — design D2).
- [x] 1.4 Add an upload step (gated): rename to `lunma-<version>.zip` using
  `steps.release.outputs.tag_name`/`version`, then
  `gh release upload "<tag>" "lunma-<version>.zip" --clobber` with
  `GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}` (design D2/D3) (spec: "Each release
  ships a downloadable packaged extension").
- [x] 1.5 Confirm the build steps run **only** on `release_created` (no build on
  Release-PR-only pushes) and that no new secret / no `package.json` dependency /
  no PR-required status context was introduced (spec: "Artifact build adds no
  PR-required check, secret, or runtime dependency").

## 2. Documentation (doc-lockstep)

- [x] 2.1 `docs/releasing.md`: in the Release-PR flow, note that merging the
  Release PR now also attaches a downloadable `lunma-<version>.zip` to the GitHub
  release, and that the Chrome Web Store publish is still pending (a later phase).
- [x] 2.2 `docs/tech-stack.md`: in the "Versioning and releases" section, note the
  release carries the packaged `lunma-<version>.zip` asset. Confirm
  `docs/architecture.md` needs no change (release tooling, no DAG impact) —
  stated, not edited.

## 3. Land + verify against spec scenarios

- [ ] 3.1 Land §1–§2 on a branch; PR green on `verify` + `e2e`; merge to `main`
  (clean noreply identity).
- [ ] 3.2 On the next cut release, confirm a `lunma-<version>.zip` asset appears
  on the GitHub release and its `manifest.json` version equals the release version
  (spec: "The attached artifact matches the released version"). Optionally
  back-fill `v0.1.0` (design Open Questions).
- [ ] 3.3 Archive this change once §1–§3 are green; the
  `extension-release-pipeline` spec then becomes live. (The Chrome Web Store
  upload remains a future phase / change, and the gating milestone for
  `open-source-public-launch`'s flip.)
