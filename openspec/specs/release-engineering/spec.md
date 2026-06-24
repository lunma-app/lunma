# release-engineering Specification

## Purpose
TBD - created by archiving change site-continuous-deploy. Update Purpose after archive.
## Requirements
### Requirement: The marketing site is continuously deployed from CI

The repository SHALL build and publish the marketing site (`apps/site`) to its
production host on every push to `main`, driven by this repository's CI — not by
the host's own Git-integration build. The site SHALL be built with the
repository-pinned toolchain (the same Node 24 / corepack-pinned pnpm / frozen
install that the `verify` gate uses), and the resulting static
`apps/site/build/` output SHALL be published with `wrangler pages deploy` so that
the CI build environment is the single source of the deployed bytes. The deploy
SHALL run in a workflow separate from the read-only `verify`/`e2e` gate.

#### Scenario: Push to main publishes production
- **WHEN** a commit is pushed to `main`
- **THEN** a deploy workflow builds `apps/site` with the repository-pinned
  toolchain and publishes `apps/site/build/` to the production deployment serving
  `lunma.app`

#### Scenario: The CI build is the source of the deployed bytes
- **WHEN** the site is deployed
- **THEN** the published output is the artifact built in this repository's CI run
- **AND** the host does not independently build from a connected Git repository

#### Scenario: Deploy is isolated from the read-only gate
- **WHEN** the deploy workflow runs
- **THEN** it is a workflow distinct from the `verify`/`e2e` CI workflow, whose
  jobs remain `contents: read`

### Requirement: Production deploys only from main; previews only from same-repo branches

Production (`lunma.app`) SHALL be published only from `main`. Pushes to other
branches in this repository SHALL publish a non-production preview deployment.
The deploy workflow SHALL NOT be triggered by the `pull_request` event, so that
deploy credentials are never exposed to a pull request — including a fork pull
request once the repository is public.

#### Scenario: A non-main branch publishes a preview, not production
- **WHEN** a commit is pushed to a branch other than `main` in this repository
- **THEN** the deploy publishes a preview deployment (a `*.pages.dev` URL), not
  the production `lunma.app` deployment

#### Scenario: A pull request does not run the deploy
- **WHEN** a pull request is opened or updated (including from a fork)
- **THEN** the deploy workflow does not run, and the deploy credentials are not
  exposed to that pull request

### Requirement: Deploy credentials are least-privilege

The deploy SHALL authenticate to the host with a credential scoped to only the
permission it needs to publish Pages, stored as a repository secret. The
credential MUST NOT carry broader account scope (DNS, Workers, or other
resources), so that a worst-case exposure cannot affect resources beyond Pages
deployment.

#### Scenario: The deploy token is Pages-scoped
- **WHEN** the deploy authenticates to Cloudflare
- **THEN** it uses a token scoped to Pages edit/deploy only
- **AND** the token and account identifier are provided as repository secrets,
  never committed to the tree

### Requirement: A deploy is verified live before it is considered done

After publishing, the production deploy SHALL verify that the site is actually
served and that the load-bearing privacy-policy URL resolves, so a failed or
partial publish fails the workflow rather than silently leaving stale or missing
content. The check SHALL tolerate brief CDN propagation latency with a bounded
retry before failing.

#### Scenario: The privacy URL must resolve
- **WHEN** the production deploy step completes a publish
- **THEN** it requests `https://lunma.app/` and `https://lunma.app/privacy` and
  requires an HTTP `200` from each
- **AND** the workflow fails if either does not resolve within the bounded retry
  window

#### Scenario: A broken publish fails the run
- **WHEN** the publish does not result in the site being served (a binding or
  propagation failure)
- **THEN** the liveness check fails and the deploy workflow is reported red

### Requirement: The deployed site sends hardened response headers

The deployed marketing site SHALL serve a defense-in-depth response-header set so
it is hardened from first paint. It SHALL send `Strict-Transport-Security`,
`X-Content-Type-Options: nosniff`, a `Referrer-Policy`, clickjacking protection
(`X-Frame-Options: DENY`), and a `Permissions-Policy` denying unused powerful
features, and it SHALL apply a **strict same-origin Content-Security-Policy** that
does not permit `'unsafe-inline'` for scripts. The CSP MUST be derived from the
built output (so it stays correct across builds without hand-maintained hashes),
and a passing deploy MUST confirm the live page renders with **zero CSP
violations**.

#### Scenario: Security headers are present on the live site
- **WHEN** the production site is requested at `https://lunma.app/`
- **THEN** the response carries `Strict-Transport-Security`,
  `X-Content-Type-Options: nosniff`, a `Referrer-Policy`, `X-Frame-Options: DENY`,
  and a `Permissions-Policy`
- **AND** a Content-Security-Policy is applied to the page

#### Scenario: The CSP is strict for scripts
- **WHEN** the applied Content-Security-Policy is inspected
- **THEN** its `script-src` does not include `'unsafe-inline'`
- **AND** the policy is same-origin (no third-party script origins)

#### Scenario: The deployed page renders with no CSP violations
- **WHEN** the deployed page is loaded in a browser after a deploy
- **THEN** the browser reports zero Content-Security-Policy violations
- **AND** a deploy that would produce CSP violations is caught (the check fails)
  rather than shipped

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

