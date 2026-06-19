## Context

`semver-enforcement` made the version honest and automatic: release-please opens
a Release PR, and merging it cuts a `vX.Y.Z` tag + GitHub release. But the
release carries **no artifact** — `v0.1.0` has zero assets. The extension already
has a `pack` script (`pnpm build && cd dist && zip -r ../extension.zip .`) that
produces a loadable zip; nothing wires it to the release.

The release workflow (`.github/workflows/release-please.yml`) runs on push to
`main` and uses the `googleapis/release-please-action@v4` action, which exposes
outputs including `release_created` (true when a release was just cut),
`tag_name`, and `version`. Those outputs are the hook for building and attaching
an artifact exactly when a release happens.

This change ships no `src/` code and no user-visible surface, so the
visual-quality and component-library policies do not apply (explicit exemption,
matching `semver-enforcement`).

## Goals / Non-Goals

**Goals:**
- Every cut release carries a `lunma-<version>.zip` asset built from the
  production build, downloadable for sideload/QA/review.
- Reuse the existing toolchain + `pack` script; no new secrets, no new runtime
  dependency, no new required CI check.
- Build only when a release is actually created (no wasted builds on every push).

**Non-Goals:**
- Uploading to the Chrome Web Store (the gating milestone for
  `open-source-public-launch`; needs store OAuth credentials — a later phase of
  this capability).
- Store listing metadata, screenshots, signing beyond crxjs/Chrome defaults,
  or release channels (beta/stable).
- Attaching source archives or changelog files (GitHub already generates those).

## Decisions

### D1 — Build inside the existing Release workflow, gated on `release_created`

Add the build-and-attach steps to `release-please.yml` after the release-please
step (given an `id`), each `if: ${{ steps.<id>.outputs.release_created == 'true' }}`.

- **Why not a separate `on: release` workflow:** a `release`-triggered workflow
  would be a second moving part and a second token surface, and it would fire on
  *any* release (including ones created by hand). Keeping it in the one workflow
  that already owns releases — gated on release-please's own
  `release_created` — means the artifact is produced by exactly the same run that
  cut the release, with no duplicate setup or race.
- **Why gate on `release_created`:** the workflow runs on every push to `main`;
  most pushes only update the Release PR. Building unconditionally would waste a
  full build per push. The gate builds only when there is a release to attach to.

### D2 — Reuse the `pack` script; rename to a versioned asset

Run `pnpm --filter @lunma/extension pack` (the existing script) to produce
`apps/extension/extension.zip`, then rename/upload it as `lunma-<version>.zip`
using the release-please `tag_name`/`version` output, via
`gh release upload "<tag>" "lunma-<version>.zip" --clobber`.

- **Why reuse `pack`:** it already encodes the correct build (`pnpm build` →
  `dist` → zip); duplicating the zip logic in YAML would risk drift from the
  local artifact. `zip` is present on `ubuntu-latest`; `gh` is preinstalled.
- **Why a versioned name:** `lunma-0.1.0.zip` is self-describing on the releases
  page and as a downloaded file, where a bare `extension.zip` is not.
- **`--clobber`:** makes a re-run idempotent (re-attaching overwrites rather than
  erroring), so a retried release job is safe.

### D3 — Built-in `GITHUB_TOKEN`, no new secret

`gh release upload` needs `contents: write`, which the workflow already grants.
No PAT, no App token, no store credential is introduced — this phase never leaves
GitHub.

- **Consequence:** the Chrome Web Store upload, which *does* need credentials, is
  deliberately a separate later phase; this keeps phase 1 credential-free and
  immediately landable.

### D4 — Chrome Web Store upload is a later phase, not this change

The store publish is the milestone `open-source-public-launch`'s flip waits on
(D2 there). It needs store OAuth secrets and a publish step. Scoping it out keeps
this change small, secret-free, and shippable now, while still delivering a real
installable artifact.

## Risks / Trade-offs

- **[release-please output name drift]** → If the action's output keys change
  across majors, the gate/asset name could break. Mitigated by pinning the action
  to `@v4` (as today) and the build being a no-op when `release_created` is unset.
- **[A build failure after the tag is already created]** → release-please creates
  the tag/release first; if the subsequent build fails, the release exists without
  an asset. Mitigated by `--clobber` + the job being re-runnable (re-running
  attaches the asset to the existing release); the version guard already ensures
  the build is valid. Acceptable: a missing asset is fixable by re-run, not a
  corrupt release.
- **[Wasted minutes if gating is wrong]** → If the `if` condition is mis-wired,
  the build runs on every push. Caught immediately in the first runs; low blast
  radius (CI-only).

## Migration Plan

Additive; no `src/` changes, nothing to roll back in product code.

1. Extend `release-please.yml` with the gated build-and-attach steps.
2. The next merged Release PR cuts a release and attaches `lunma-<version>.zip`.
   (The already-published `v0.1.0` can optionally be back-filled by running
   `pnpm --filter @lunma/extension pack` locally and `gh release upload v0.1.0`,
   or simply left asset-less since the next release will carry one.)

**Rollback:** remove the added steps; releases revert to tag + changelog only.

## Open Questions

- **Back-fill `v0.1.0`?** Optional, non-blocking — settle at apply time (default:
  leave it; the next release carries the asset).
- **None blocking.**
