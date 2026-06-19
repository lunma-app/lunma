> Status: **authored, not yet implemented.** All tasks pending `/opsx:apply`.
> §4 amends the in-flight `open-source-public-launch` change; §5 verifies against
> the `release-versioning` spec scenarios.

## 1. Version source of truth + parity guard

- [x] 1.1 Align the seed version: set `apps/extension/package.json` and
  `apps/extension/public/manifest.json` `version` to the same valid semver
  (`0.0.0` until the first Release PR cuts a real version — design D4).
- [x] 1.2 Add `apps/extension/src/version-parity.test.ts` (under `src/` so vitest's
  `src/**/*.test.ts` discovers it; rides `pnpm verify`). It reads
  `apps/extension/package.json` and `apps/extension/public/manifest.json` at
  **runtime via `readFileSync`** resolved from the package root (`new
  URL('../package.json', import.meta.url)`, `new URL('../public/manifest.json',
  import.meta.url)`) — **not** a static JSON import (which would pull non-`src`
  files into the tsconfig/Biome graph — design D2). Assert `package.json` `version`
  === `manifest.json` `version` AND both match a strict `MAJOR.MINOR.PATCH` pattern
  (no pre-release/build suffix) (spec: "Single source of truth for the extension
  version").
- [x] 1.3 Confirm `pnpm verify` runs the new test and **fails** when the two
  versions are made to disagree (sanity-check the guard, then revert).

## 2. Automated derivation (release-please)

- [x] 2.1 Add `release-please-config.json` (repo root): single package at
  `apps/extension`, `release-type: node` (treats `package.json` as the version
  anchor — design D4), no `prerelease`, and an `extra-files` entry that bumps the
  `version` field of `apps/extension/public/manifest.json` in lockstep with
  `package.json` (design D4).
- [x] 2.2 Add `.release-please-manifest.json` (repo root) seeding `apps/extension`
  at the current `0.0.0`. Bootstrap the first real version to **`0.1.0`** (a
  `Release-As: 0.1.0` directive or the `release-as` config — design D4a); no
  `v0.0.0` release is ever published.
- [x] 2.3 Add `.github/workflows/release-please.yml`: trigger on push to `main`;
  least-privilege `permissions` (`contents: write`, `pull-requests: write`); pin
  the release-please action to a SHA/major (consistent with `dco.yml`). The job
  maintains the Release PR and, on its merge, creates the `vX.Y.Z` tag + GitHub
  release (spec: "Automated next-version derivation…" + "Releases are tagged and
  monotonic").
- [x] 2.4 Add a seed `CHANGELOG.md` (repo root) that release-please will maintain.
- [x] 2.5 Confirm the workflow does **not** add a PR-required status context and
  no runtime dependency was added to any `package.json` (spec: "…adds no
  PR-required CI context and no runtime dependency").

## 3. Documentation (doc-lockstep)

- [x] 3.1 Add `docs/releasing.md`: the `fix`/`feat`/breaking → patch/minor/major
  mapping, the squash-merge-with-conventional-title convention derivation relies
  on (design D3), the Release-PR flow, the first-release `0.1.0` bootstrap (design
  D4a), and that pre-release/build-metadata versions are unsupported (manifest
  constraint, design D4) (spec: "Documented bump policy").
- [x] 3.2 Update `docs/tech-stack.md`: add release-please as the pinned
  versioning/release tool. Confirm `docs/architecture.md` needs no change (no
  import-layer/DAG impact) — stated, not edited.

## 4. Cross-change gate: amend `open-source-public-launch` (design D5)

- [x] 4.1 `open-source-public-launch/tasks.md` §3.1: add the second pre-flip gate
  — the flip is blocked on **both** the first Chrome Web Store publish **and**
  `semver-enforcement` being live (automation merged, first real version cut,
  parity guard green on `main`).
- [x] 4.2 `open-source-public-launch/design.md` D2: amend the gate rationale to
  name versioning enforcement as the second condition.
- [x] 4.3 `open-source-public-launch/proposal.md`: update the gate wording
  (the "gated… only after the first Chrome Web Store publish" sentences) to
  include the versioning-enforcement condition.
- [x] 4.4 Re-confirm `open-source-public-launch`'s branch-protection required-check
  set (§4.1: `verify` + `e2e` + `dco`) is **unchanged** by this change (design D2)
  — no edit needed there; verify and note it.

## 5. Land + verify against spec scenarios

- [ ] 5.1 Land §1–§4 on a branch; PR green on `verify` + `e2e`; merge to `main`.
- [ ] 5.2 Confirm release-please opens a Release PR after merge; review it bumps
  `package.json` + `manifest.json` together and updates `CHANGELOG.md` (spec:
  "Automated next-version derivation…").
- [ ] 5.3 Merge the first Release PR; confirm it cuts the bootstrapped `v0.1.0`
  tag + GitHub release matching the version (no `v0.0.0` published), and that a
  later release would be strictly greater (spec: "Releases are tagged and
  monotonic").
- [ ] 5.4 Confirm the parity guard, run on `main` after the bump, is green (spec:
  "Single source of truth…").
- [ ] 5.5 Archive this change (`semver-enforcement`) once §1–§5 are green; the
  `release-versioning` spec then becomes live, and `open-source-public-launch`'s
  versioning gate is satisfiable.
