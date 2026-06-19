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

