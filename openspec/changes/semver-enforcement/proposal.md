## Why

Lunma is about to become a public, installable product, and a public product
needs **honest, monotonic, automatic versions** — the number a user sees in the
Chrome Web Store listing and in "what changed", the tag a contributor checks out,
the thing a changelog is keyed to. Today every `package.json` and the extension's
`public/manifest.json` are frozen at `0.0.0` with **no single source of truth**
(crxjs reads the version straight from `public/manifest.json`, independent of
`package.json`, so they can silently drift), **no tags**, and **no derivation** —
the version would be hand-edited, forgettably and inconsistently, forever.

This change is the smallest plumbing that fixes that, and it has two **named
downstream consumers**, so it is not stranded infrastructure (user-value policy,
shape b):

- **`open-source-public-launch`** — its public flip (tasks §3.1) becomes
  **gated on this**: Lunma does not go public until versioning is enforced and
  automatic. A repo that ships `0.0.0` forever is not a credible open-source
  project. This change adds that gate to the public-launch artifacts.
- **`extension-release-pipeline`** (unstarted) — the future build/upload-to-store
  pipeline consumes the version this capability produces. It owns *shipping the
  artifact*; this change owns *what the version is and that it is correct*.

## What Changes

- **Single source of truth.** `package.json` (the extension's, at
  `apps/extension/package.json`) becomes the canonical extension version;
  `apps/extension/public/manifest.json` is kept in lockstep with it. The two are
  no longer independently editable.
- **Automated next-version derivation from Conventional Commits.** A
  release-please-style **Release PR** is opened/maintained on every push to
  `main`: it reads the Conventional-Commit history, computes the next semver
  (`feat`→minor, `fix`→patch, `!`/`BREAKING CHANGE`→major), bumps `package.json`
  **and** `public/manifest.json` together, regenerates `CHANGELOG.md`, and — when
  merged — creates the `vX.Y.Z` git tag and GitHub release. Monotonic increase and
  tag↔version agreement hold **by construction**, not by a separate audit.
- **A parity guard in the existing gate.** A check that the extension's
  `package.json` version equals its `manifest.json` version and is valid semver
  runs inside `pnpm verify` (so it rides the existing `verify` job — **no new
  required CI context**, no new coupling to the branch-protection rule
  `open-source-public-launch` applies). `verify` runs on every PR today; it
  becomes a *required* status check only once `open-source-public-launch` applies
  branch protection — so the guard is enforced on every PR now and gating after
  that flip. See design D2 for why this is folded into `verify` rather than a
  standalone `version` job.
- **Documented bump policy.** A new `docs/releasing.md` states the
  Conventional-Commit → semver mapping, the squash-merge convention release
  derivation relies on, and the Release-PR flow.
- **Cross-change gate edit.** `open-source-public-launch` gains an explicit
  second pre-flip gate: its tasks §3.1 and design D2 are amended so the flip is
  blocked on *both* the first Chrome Web Store publish **and** this change being
  live; its proposal's gate wording is updated to match.

This change ships **no `src/` code and no user-visible surface** — no `Visual
language` section and no `src/ui/` primitive work apply (explicit exemption per
the visual-quality and component-library policies, same as
`open-source-public-launch`).

## Capabilities

### New Capabilities
- `release-versioning`: how Lunma's shippable version is defined and kept honest
  — the single source of truth (`package.json` ↔ `manifest.json`), semver +
  parity enforced in the `verify` gate, and the automated Conventional-Commit →
  semver derivation that opens a Release PR and tags on merge. Distinct from the
  (not-yet-live) `release-engineering` capability, which owns the CI *gate* and,
  later, deploy; and from the future `extension-release-pipeline`, which builds
  and uploads the artifact. This capability owns *what the version is*.

### Modified Capabilities
<!-- None as a spec delta. The gate added to `open-source-public-launch` is an
edit to that change's in-flight artifacts, not to a living spec under
openspec/specs/. No existing spec's requirements change. -->

## Impact

- **New files:**
  - `.github/workflows/release-please.yml` — runs on push to `main`; maintains the
    Release PR and tags/releases on merge. `permissions` least-privilege
    (`contents: write` + `pull-requests: write`); any third-party action pinned to
    a SHA/major (consistent with `open-source-public-launch`'s `dco.yml`).
  - `release-please-config.json` + `.release-please-manifest.json` (repo root) —
    release-please config (`release-type: node`, since `package.json` is canonical
    — D4); the manifest seeds the current version and the config declares the
    `extra-files` updater that bumps `public/manifest.json` alongside `package.json`.
  - `CHANGELOG.md` (repo root) — generated and maintained by release-please.
  - `apps/extension/src/version-parity.test.ts` — the parity guard. It MUST live
    under `src/` (vitest discovers `src/**/*.test.ts`) and reads both
    `apps/extension/package.json` and `apps/extension/public/manifest.json` at
    runtime via `readFileSync` resolved from the package root (`new
    URL('../…', import.meta.url)`) — **not** a static JSON import, which would pull
    non-`src` files into the tsconfig/Biome import graph (D2). Rides the package's
    existing `vitest run`, so it is already inside `pnpm verify`.
  - `docs/releasing.md` — the bump policy + release flow.
- **Modified files:**
  - `apps/extension/package.json` and `apps/extension/public/manifest.json` — the
    seed version, brought into agreement (initial `0.0.0` → first real release is
    cut by the first merged Release PR).
  - `docs/tech-stack.md` — add release-please as the pinned versioning/release
    tool (doc-lockstep).
  - `openspec/changes/open-source-public-launch/{proposal,design,tasks}.md` — the
    second pre-flip gate (cross-change edit above).
- **Untouched docs (stated per doc-lockstep):** `docs/architecture.md` — no
  import-layer or DAG change; this is CI/release tooling, outside the
  `apps/extension/src/` layer graph.
- **Deliberately left at `0.0.0`:** the root, `apps/site`, and `packages/tokens`
  `package.json` versions stay `0.0.0` and `private` — none is a shipped artifact,
  so they are intentionally outside this change's single-source-of-truth (the
  shippable extension only). Stated so a reviewer scanning for stray `0.0.0`s sees
  the intent.
- **CI / required checks:** the parity guard rides the existing `verify` job;
  `release-please.yml` runs only on push to `main` and is **not** a PR-required
  context. So `open-source-public-launch`'s branch-protection required-check set
  (`verify` + `e2e` + `dco`) is **unchanged** by this work (design D2).
- **Dependencies:** none added to any `package.json` at runtime. release-please is
  a pinned GitHub Action; the parity test uses existing vitest.
- **Out of scope:** building/uploading the extension artifact to the Chrome Web
  Store (the gating milestone + the pipeline — `extension-release-pipeline`);
  versioning `apps/site` or `packages/tokens` (the shippable artifact is the
  extension; the site is build-time-only and the tokens package does not publish);
  enforcing Conventional-Commit *format* with a new required CI check (relied on
  via the squash-merge PR-title convention — design D3); pre-release /
  build-metadata versions (e.g. `1.2.0-rc.1`) — the Chrome manifest `version`
  grammar forbids them, so releases stay plain `MAJOR.MINOR.PATCH` (design D4).
