# release-versioning Specification

## Purpose
TBD - created by archiving change semver-enforcement. Update Purpose after archive.
## Requirements
### Requirement: Single source of truth for the extension version

The extension's version SHALL have one canonical source: the `version` field of
`apps/extension/package.json`. The `version` field of
`apps/extension/public/manifest.json` (which crxjs ships to Chrome) MUST equal it
and MUST be a valid semantic version (`MAJOR.MINOR.PATCH`). The two values MUST
NOT be independently editable in a way that lets them diverge without the gate
failing.

#### Scenario: Parity and format are enforced by the gate

- **WHEN** `pnpm verify` runs (locally or as the `verify` CI status check)
- **THEN** it SHALL fail if `apps/extension/package.json` `version` and
  `apps/extension/public/manifest.json` `version` differ, or if either is not a
  valid `MAJOR.MINOR.PATCH` semantic version

#### Scenario: A stray manual version edit is caught

- **WHEN** a contributor edits the version in only one of the two files
- **THEN** the parity check fails the pull request before it can merge

### Requirement: Automated next-version derivation from Conventional Commits

The next release version SHALL be derived automatically from the
Conventional-Commit history rather than hand-edited. On every push to `main`, an
automated process SHALL maintain a Release pull request that bumps the canonical
version, applying the mapping: `fix` → patch, `feat` → minor, and any commit
marked breaking (`!` or a `BREAKING CHANGE` footer) → major. The same Release PR
SHALL update both `apps/extension/package.json` and
`apps/extension/public/manifest.json` in lockstep and regenerate `CHANGELOG.md`.

#### Scenario: A feature commit proposes a minor bump

- **WHEN** a `feat:` commit lands on `main` since the last release
- **THEN** the Release PR proposes the next minor version, with both
  `package.json` and `manifest.json` bumped together and the change recorded in
  `CHANGELOG.md`

#### Scenario: A breaking change proposes a major bump

- **WHEN** a commit on `main` carries `!` or a `BREAKING CHANGE` footer
- **THEN** the Release PR proposes the next major version

#### Scenario: No release-worthy commits

- **WHEN** only non-releasing commits (e.g. `docs`, `chore`, `ci`) have landed
  since the last release
- **THEN** no version bump is proposed

### Requirement: Releases are tagged and monotonic

Merging the Release pull request SHALL create a `vX.Y.Z` git tag and a
corresponding GitHub release matching the bumped version. Each released version
after the first MUST be strictly greater than the previous released version, and
the tag name MUST agree with the version in `package.json` and `manifest.json` at
that commit. The first release has no predecessor: it is bootstrapped to a fixed
initial version (`0.1.0`) with no `v0.0.0` release ever published.

#### Scenario: Merging the Release PR tags the release

- **WHEN** the Release pull request is merged into `main`
- **THEN** a `vX.Y.Z` tag and GitHub release are created where `X.Y.Z` equals the
  canonical version at that commit

#### Scenario: The first release is bootstrapped, not compared

- **WHEN** the first Release PR is cut and no prior release/tag exists
- **THEN** the version is the fixed initial `0.1.0` (no `v0.0.0` is published)

#### Scenario: Subsequent versions never go backwards

- **WHEN** a new release is cut after the first
- **THEN** its version is strictly greater than the most recent prior release's
  version

### Requirement: The version pipeline adds no PR-required CI context and no runtime dependency

Enforcing versioning SHALL NOT introduce a new required pull-request status check
beyond the existing `verify` + `e2e` (so the branch-protection required-check set
applied by the public-launch change is unaffected), and SHALL NOT add any runtime
dependency to any `package.json`. The release automation runs as a pinned
GitHub Action with a least-privilege token, triggered on push to `main` rather
than as a PR gate.

#### Scenario: Required-check set is unchanged

- **WHEN** branch protection requiring `verify` + `e2e` (+ `dco`) is in force
- **THEN** versioning enforcement adds no further required status context; its
  parity guard rides the existing `verify` check and its release automation is not
  a required PR context

#### Scenario: No runtime dependency is added

- **WHEN** versioning enforcement is in place
- **THEN** no entry is added to the `dependencies` of any workspace `package.json`
  to support it

### Requirement: Documented bump policy

The repository SHALL document, at `docs/releasing.md`, the Conventional-Commit →
semver mapping, the squash-merge-with-conventional-title convention the
derivation relies on, and the Release-PR flow, so contributors know what effect a
commit type has on the version.

#### Scenario: A contributor can find the bump policy

- **WHEN** a contributor needs to know how their commit affects the version
- **THEN** `docs/releasing.md` states the `fix`/`feat`/breaking → patch/minor/major
  mapping and the release flow

