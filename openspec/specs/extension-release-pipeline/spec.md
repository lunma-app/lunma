# extension-release-pipeline Specification

## Purpose
TBD - created by archiving change extension-release-pipeline. Update Purpose after archive.
## Requirements
### Requirement: Each release ships a downloadable packaged extension

When the release automation cuts a release, the workflow SHALL build the
extension and attach a packaged artifact named `lunma-<version>.zip` to that
GitHub release, where `<version>` is the released version. The artifact MUST be a
zip of the production build (the same output `apps/extension` produces via its
`pack` script), loadable into Chrome as an unpacked extension. Building and
attaching the artifact runs only when a release is actually cut.

#### Scenario: Merging the Release PR attaches the artifact

- **WHEN** a Release pull request is merged and the release automation creates a
  GitHub release for the new version
- **THEN** a `lunma-<version>.zip` asset is built from the production build and
  attached to that release, with `<version>` equal to the released version

#### Scenario: No artifact is built when no release is cut

- **WHEN** the release automation runs on a push that does not create a release
  (only a Release PR is opened or updated, or nothing is releasable)
- **THEN** no extension build runs and no artifact is produced

#### Scenario: The attached artifact matches the released version

- **WHEN** the release for version `X.Y.Z` is created
- **THEN** the attached asset is named `lunma-X.Y.Z.zip` and contains the build
  whose `manifest.json` version is `X.Y.Z`

### Requirement: Artifact build adds no PR-required check, secret, or runtime dependency

Producing the release artifact SHALL NOT introduce a new required pull-request
status check, SHALL NOT add any new secret, and SHALL NOT add any runtime
dependency to any `package.json`. The build-and-attach steps run inside the
existing push-triggered release workflow (gated on a release being created),
using the built-in `GITHUB_TOKEN`.

#### Scenario: Required-check set is unchanged

- **WHEN** the artifact build-and-attach is in place
- **THEN** it adds no new required pull-request status context; it runs in the
  push-triggered release workflow, not as a PR gate

#### Scenario: No new secret or runtime dependency

- **WHEN** the artifact is built and uploaded
- **THEN** it uses only the built-in `GITHUB_TOKEN`, adds no new repository
  secret, and adds no entry to any workspace `package.json` `dependencies`

