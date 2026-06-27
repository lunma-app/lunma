## ADDED Requirements

### Requirement: The repository goes public only after the first store publish

The repository SHALL be flipped from private to public only after the first
Chrome Web Store publish of the extension; until that milestone it remains
private. This keeps the public source debut aligned with an installable product
listing rather than an indefinite pre-release window.

#### Scenario: Flip is withheld before the store publish
- **WHEN** the open-sourcing work is complete but the extension has not yet been
  published to the Chrome Web Store
- **THEN** the repository remains private and the visibility flip is not executed

#### Scenario: Flip proceeds after the store publish
- **WHEN** the first Chrome Web Store publish is live and the pre-flip audit has
  passed
- **THEN** the repository is set to public visibility

### Requirement: A readiness audit precedes the public flip

A readiness audit MUST pass immediately before the public flip, and the flip MUST
NOT proceed on any failing check. The audit confirms that the working tree and
git history carry no secrets, credentials, or personal data; that git authorship
is the project identity throughout; that the contributor-intake scaffolding is
present; and that `.github/CODEOWNERS` routes to a team that exists. Content that
is intentionally public (the OpenSpec `changes/archive/**` audit trail and the
roadmap it contains) is confirmed as a deliberate, reviewed inclusion.

#### Scenario: A failing audit blocks the flip
- **WHEN** the pre-flip audit detects a secret, personal datum, or an unresolved
  `CODEOWNERS` owner in the tree or history
- **THEN** the visibility flip is aborted and the finding is resolved before any
  retry

#### Scenario: A clean audit clears the flip
- **WHEN** the pre-flip audit finds no secrets or personal data, uniform project
  authorship, intake scaffolding present, and `CODEOWNERS` resolving to a valid
  team
- **THEN** the flip is cleared to proceed

### Requirement: Inbound contributions are licensed by DCO sign-off

Contributions SHALL be accepted under the project's Apache-2.0 license and
certified with a Developer Certificate of Origin `Signed-off-by` trailer; a
required CI check MUST fail any pull request whose commits lack sign-off. The
project does NOT use a Contributor License Agreement and grants itself no
relicensing rights over contributions (inbound-equals-outbound).

#### Scenario: Unsigned commits fail the check
- **WHEN** a pull request contains a commit with no `Signed-off-by` trailer
  matching its author
- **THEN** the DCO check fails and the pull request is not mergeable

#### Scenario: Signed-off commits pass the check
- **WHEN** every commit in a pull request carries a valid `Signed-off-by` trailer
- **THEN** the DCO check passes

### Requirement: Public contribution intake is functional

Once public, the repository SHALL accept community issues and pull requests
through the intake scaffolding shipped earlier — issue templates render with
blank issues disabled, the pull-request template is applied, and `CODEOWNERS`
auto-requests review from the maintainers team. This is the public-facing intake
behaviour that `github-repo-and-ci` deferred to this change.

#### Scenario: A new pull request routes review automatically
- **WHEN** a contributor opens a pull request against the public repository
- **THEN** the pull-request template is applied and review is auto-requested from
  the `@lunma-app/maintainers` team via `CODEOWNERS`

#### Scenario: Issue creation offers the templates
- **WHEN** a visitor starts a new issue
- **THEN** the bug-report and feature-request templates are offered and blank
  issues are disabled
