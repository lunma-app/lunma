## Why

Each release today is a tag + changelog with **nothing you can install**: the
`v0.1.0` GitHub release carries zero assets, so to actually run a released
version you must clone and build it. This change makes every release ship a
**downloadable, versioned packaged extension** (`lunma-<version>.zip`) attached
to its GitHub release — a real artifact a maintainer or early tester can sideload
into Chrome (`chrome://extensions` → "Load unpacked" / drag-drop) for review,
QA, or a pre-store install. That is the user-visible value.

It is also the smallest first slice of the **`extension-release-pipeline`**
capability that `semver-enforcement` named as the artifact owner, and it has a
named downstream consumer (user-value policy, shape b): the **Chrome Web Store
publish** — the gating milestone that unblocks `open-source-public-launch`'s
public flip — will upload the very artifact this change starts producing. This
change builds *and attaches* the artifact; the store *upload* is the next phase.

## What Changes

- **Build + attach the packaged extension on release.** `.github/workflows/release-please.yml`
  gains, after the release-please step (now carrying an `id`), a set of steps
  **gated on `release_created == 'true'`** that: provision the pinned toolchain
  (Node 24 + Corepack pnpm + frozen install, the same pattern as `ci.yml`), build
  the extension via the existing `apps/extension` `pack` script (`pnpm build` →
  `extension.zip`), rename it to `lunma-<version>.zip` (version from the
  release-please `tag_name`/`version` output), and upload it to the just-created
  release with `gh release upload` using the existing `GITHUB_TOKEN`.
- **Documented in the release flow.** `docs/releasing.md` and `docs/tech-stack.md`
  state that a merged Release PR now produces a `lunma-<version>.zip` asset on the
  GitHub release (and that the Chrome Web Store publish is still pending).

This change ships **no `src/` code and no user-visible surface** — no `Visual
language` section and no `src/ui/` primitive work apply (explicit exemption per
the visual-quality and component-library policies, same as `semver-enforcement`).

## Capabilities

### New Capabilities
- `extension-release-pipeline`: how Lunma's shippable extension artifact is
  produced and published. **This change covers phase 1 only** — building the
  packaged extension and attaching it to the GitHub release as a versioned asset.
  The Chrome Web Store *upload* (and any store-listing automation) is a later
  phase of this same capability, explicitly out of scope here. Distinct from
  `release-versioning` (owns *what the version is*) and `release-engineering`
  (owns the CI *gate*): this capability owns *building and shipping the artifact*.

### Modified Capabilities
<!-- None. No existing living spec's requirements change. -->

## Impact

- **Modified files:**
  - `.github/workflows/release-please.yml` — add the build-and-attach steps
    (gated on `release_created`); give the release-please-action step an `id`.
  - `docs/releasing.md`, `docs/tech-stack.md` — note the release now carries a
    downloadable `lunma-<version>.zip` (doc-lockstep).
- **New OpenSpec spec:** `openspec/specs/extension-release-pipeline/spec.md` (on archive).
- **Untouched docs (stated per doc-lockstep):** `docs/architecture.md` — no
  import-layer/DAG change; this is release tooling outside the `src/` layer graph.
- **Reused, not added:** the `apps/extension` `pack` script (`pnpm build && cd
  dist && zip -r ../extension.zip .`) already exists; `zip` is present on
  `ubuntu-latest`; `gh` is preinstalled on GitHub runners.
- **CI / required checks:** the build+attach runs inside the existing
  push-to-`main` `Release` workflow (gated on `release_created`), **not** as a PR
  status check — so `open-source-public-launch`'s branch-protection required-check
  set (`verify` + `e2e` + `dco` + `identity`) is **unchanged**.
- **Dependencies:** none added to any `package.json`. No new secrets (uses the
  built-in `GITHUB_TOKEN`; `contents: write` is already granted to the workflow).
- **Out of scope (deferred to a later phase of this capability):** uploading the
  artifact to the **Chrome Web Store** (needs store OAuth credentials as repo
  secrets; it is the gating milestone for `open-source-public-launch`); store
  listing metadata/screenshots; signing beyond what crxjs/Chrome already do;
  versioned release channels (beta/stable).
