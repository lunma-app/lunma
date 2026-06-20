## ADDED Requirements

### Requirement: CI runs the workspace verify gate on every change

The repository SHALL run the full workspace verify gate in continuous integration
on every pull request and on every push to `main`. The gate covers the same work
as the local `pnpm -r verify`: the extension's `tsc --noEmit`, `biome check src`
(which includes the layer-DAG and import-cycle rules of the `architecture-integrity`
capability), `svelte-check`, `lint:styles`, and `vitest run`; and the site's
`biome check src`, `svelte-check`, `vitest run`, and static `build`.

In CI the extension steps run as parallel jobs in a matrix (one runner each for
`typecheck`, `lint`, `check`, `lint:styles`, and `test:run`), with a separate `site`
job, unified by a no-op `verify` aggregator job that reports success only when every
leg and the site job pass. `verify` is the single required status check; its job
name is stable regardless of how the work behind it is sharded.

#### Scenario: Pull request triggers the gate
- **WHEN** a pull request is opened or updated against any branch
- **THEN** CI runs the extension matrix jobs and the site job in parallel, and
  reports the unified result as the `verify` required status check
- **AND** the `verify` aggregator goes green only when every leg passed

#### Scenario: Push to main triggers the gate
- **WHEN** a commit is pushed to `main`
- **THEN** CI runs the same parallel matrix + site + aggregator against that commit

#### Scenario: A failing gate is surfaced red
- **WHEN** any extension or site verify step exits non-zero (a type error, lint
  violation, failed test, broken site build, or layer-DAG violation)
- **THEN** the failing leg is reported red and the `verify` aggregator fails,
  surfacing the failure as a failing required status check

### Requirement: CI uses the repository-pinned toolchain

CI SHALL build on the exact toolchain the repository pins, so CI and local
results cannot silently diverge. It MUST use Node 24, obtain pnpm through
corepack from the root `package.json` `packageManager` field (not an
independently specified pnpm version), and install with a frozen lockfile.

#### Scenario: Node and pnpm match the repo pins
- **WHEN** the `verify` or `e2e` job sets up its environment
- **THEN** it provisions Node 24 and the corepack-activated pnpm matching the
  `packageManager` field in the root `package.json`

#### Scenario: Lockfile drift fails the build
- **WHEN** dependencies are installed in CI
- **THEN** the install runs with `--frozen-lockfile`
- **AND** the job fails if `pnpm-lock.yaml` is out of date with the manifests

### Requirement: CI runs the Playwright MV3 end-to-end smoke headlessly

CI SHALL run the extension's Playwright end-to-end smoke on every pull request
and push to `main`. Because the e2e fixture loads the unpacked MV3 extension via
`--load-extension` — which Chromium permits only in a headed or `--headless=new`
context — the suite MUST run under a virtual display (`xvfb-run`).

#### Scenario: e2e runs under a virtual display
- **WHEN** the `e2e` job runs
- **THEN** it installs the Playwright Chromium browser with its OS dependencies
- **AND** it executes `pnpm test:e2e` wrapped in `xvfb-run`

#### Scenario: A failing smoke is surfaced red
- **WHEN** any Playwright e2e spec fails
- **THEN** the `e2e` check fails and is reported as a failing status

### Requirement: End-to-end smoke gestures are deterministic under CI load

Multi-step pointer gestures in the Playwright MV3 smoke SHALL be **assert-and-retry**:
each attempt re-measures its target geometry and verifies the exact expected
post-gesture state committed before proceeding, and MUST replay the pointer
sequence a bounded number of times when it did not. The smoke is the gate's most
timing-sensitive
layer — it drives a real pointer against a live, rAF-rendered side panel — so this
keeps a transient under-load stall (a pointer-down landing on a stale bounding
box, so no drag starts) from failing the required `e2e` check, while a genuine
product regression still fails because the success predicate asserts the exact
expected state, not merely that a gesture ran.

#### Scenario: A stale-layout drag self-heals
- **WHEN** a smoke drag is issued against a row whose bounding box has shifted
  (e.g. immediately after an inline-rename commit re-renders the list) so the
  initial pointer-down lands off-row and no drag starts
- **THEN** the gesture helper observes the expected state did not commit and
  replays the pointer sequence against freshly-measured geometry
- **AND** the spec passes without consuming a Playwright-level retry

#### Scenario: A real regression still fails
- **WHEN** the underlying drop behaviour is broken so the expected state never
  commits regardless of geometry
- **THEN** the gesture helper exhausts its bounded retries and the spec fails,
  surfacing the regression on the `e2e` check

### Requirement: Merges to main are gated on green CI

The `main` branch SHALL be protected so that changes cannot be merged unless the
`verify` and `e2e` status checks have passed for the merging commit.

#### Scenario: Failing checks block merge
- **WHEN** a pull request targets `main` with a failing or pending `verify` or
  `e2e` check
- **THEN** the pull request cannot be merged

#### Scenario: Passing checks allow merge
- **WHEN** a pull request targets `main` with both `verify` and `e2e` passing on
  the latest commit
- **THEN** the pull request is eligible to merge

### Requirement: CI runs with least privilege and cancels superseded runs

The CI workflow SHALL request the minimum token permissions it needs and SHALL
cancel an in-flight run for a ref when a newer commit supersedes it, so review
feedback reflects the latest commit and the workflow token cannot mutate the repo.

#### Scenario: Read-only workflow token
- **WHEN** the workflow runs
- **THEN** its `GITHUB_TOKEN` permissions are `contents: read` (no write scope)

#### Scenario: Superseded runs are cancelled
- **WHEN** a new commit is pushed to a ref that already has a CI run in progress
- **THEN** the in-progress run for that ref is cancelled and the new commit's run
  proceeds

### Requirement: Dependency updates are proposed automatically and gated by CI

The repository SHALL automatically propose dependency updates (for both the npm
package ecosystem used by pnpm and the GitHub Actions used by the workflow), and
those proposals MUST flow through the same CI gate as any other change.

#### Scenario: Automated dependency pull requests run CI
- **WHEN** the dependency-update bot opens a pull request bumping a dependency or
  a workflow action
- **THEN** the `verify` and `e2e` checks run against that pull request before it
  is mergeable

### Requirement: The repository ships contributor intake scaffolding

The repository SHALL contain the standard contributor-intake scaffolding files —
a pull request template, bug-report and feature-request issue templates (with
blank issues disabled), and a `CODEOWNERS` file — so that when it is later opened
to the public (the `open-source-public-launch` change), GitHub renders consistent
intake forms and routes review automatically. This requirement governs the
*presence and shape* of these repository files; the public-facing intake
*behaviour* they enable is owned by `open-source-public-launch`.

#### Scenario: Intake scaffolding files are present
- **WHEN** the repository tree is inspected
- **THEN** `.github/pull_request_template.md`, `.github/ISSUE_TEMPLATE/bug_report.md`,
  `.github/ISSUE_TEMPLATE/feature_request.md`, `.github/ISSUE_TEMPLATE/config.yml`
  (with `blank_issues_enabled: false`), and `.github/CODEOWNERS` all exist

#### Scenario: CODEOWNERS names a valid owner
- **WHEN** `.github/CODEOWNERS` is read
- **THEN** every pattern maps to a GitHub account/team that exists, so review
  routing is not silently a no-op
