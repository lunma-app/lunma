## 1. GitHub org and private repository (guided-manual + gh)

- [ ] 1.1 **(manual gate)** Create the `lunma-app` organization at
  `https://github.com/organizations/new` (Free plan). `gh` cannot create orgs.
  Verify it exists and you own it: `gh api orgs/lunma-app --jq '.login'` returns
  `lunma-app`.
- [ ] 1.2 Create the **private** repo without pushing yet:
  `gh repo create lunma-app/lunma --private --description "Lunma — spatial tab/bookmark management for Chrome (extension) + its marketing site"`.
  Confirm: `gh repo view lunma-app/lunma --json visibility,isPrivate` shows
  `"isPrivate": true`.
- [ ] 1.3 Wire the remote (SSH, matching the `gh` auth protocol):
  `git remote add origin git@github.com:lunma-app/lunma.git`; verify with
  `git remote -v`. Confirm the intended default branch is `main`.
- [ ] 1.4 Do the CI work on a dedicated branch (e.g. `chore/ci-bootstrap`) off the
  intended `main`, so this change's commits don't entangle with the in-flight
  `smart-folder-connectors` WIP. (Do **not** push `main` until §5.)

## 2. CI workflow (`.github/workflows/ci.yml`)

- [ ] 2.1 Workflow skeleton: `on: [pull_request]` + `push: { branches: [main] }`;
  top-level `permissions: { contents: read }`; `concurrency: { group: "${{ github.workflow }}-${{ github.ref }}", cancel-in-progress: true }`.
- [ ] 2.2 `verify` job (ubuntu-latest): `actions/checkout` → `actions/setup-node@v4`
  (`node-version: 24`) → `corepack enable` (activates the `packageManager`-pinned
  `pnpm@11.3.0`; do **not** specify a pnpm version anywhere else) → cache the pnpm
  store via `actions/cache` keyed on `hashFiles('**/pnpm-lock.yaml')` (path from
  `pnpm store path`) → `pnpm install --frozen-lockfile` → `pnpm -r verify`.
- [ ] 2.3 `e2e` job (ubuntu-latest, parallel to `verify`): same setup/install
  steps, then `pnpm --filter @lunma/extension exec playwright install --with-deps chromium`,
  then `xvfb-run -a pnpm test:e2e` (the root `test:e2e` filters to the extension,
  which runs `pnpm build && playwright test`; `CI=true` is set by GitHub so the
  config's single retry applies).
- [ ] 2.4 Pin every third-party action to a major tag (or SHA). Confirm the two
  job names are exactly `verify` and `e2e` (the names §5.4 will require in branch
  protection — keep them in lockstep).

## 3. Repo hygiene files

- [ ] 3.1 `.github/pull_request_template.md` — summary / linked OpenSpec change /
  `pnpm -r verify` + `pnpm test:e2e` run locally / doc-lockstep checkbox.
- [ ] 3.2 `.github/ISSUE_TEMPLATE/bug_report.md` and
  `.github/ISSUE_TEMPLATE/feature_request.md`, plus
  `.github/ISSUE_TEMPLATE/config.yml` with `blank_issues_enabled: false`.
- [ ] 3.3 `.github/CODEOWNERS` — route all paths to the owner (`* @lunma-app/maintainers`).
- [ ] 3.4 `.github/dependabot.yml` — two ecosystems at `/`: `npm` (pnpm) and
  `github-actions`, weekly, grouped where sensible.

## 4. Documentation (doc-lockstep — required this change)

- [ ] 4.1 `docs/02-tech-stack.md` — add a CI/release-engineering note: CI runs the
  same pinned toolchain (Node 24, corepack-pinned `pnpm@11.3.0`) and the same
  `pnpm -r verify` gate as local; the e2e smoke runs under `xvfb-run` (headed-MV3
  requirement); devbox remains the local-dev story only.
- [ ] 4.2 `docs/03-architecture.md` — add a short "Continuous integration"
  subsection: CI enforces the `architecture-integrity` layer-DAG rules (via
  `biome check` inside `pnpm -r verify`) on every PR, not just locally; merge to
  `main` is gated on `verify` + `e2e`.
- [ ] 4.3 New ADR `docs/adr/0016-ci-on-github-actions.md` recording D1–D5
  (setup-node+corepack over devbox-in-CI; two jobs; single `pnpm -r verify` over a
  matrix; `xvfb-run` for e2e; imperative branch protection / rulesets). Add it to
  `docs/adr/README.md`.

## 5. First CI run + branch protection

- [ ] 5.1 Commit §2–§4 on the `chore/ci-bootstrap` branch and push it; open a PR
  (`gh pr create --base main`). Confirm **both** `verify` and `e2e` checks appear
  and run.
- [ ] 5.2 Iterate until both checks are green on the PR (fix any CI-only failures —
  e.g. Playwright deps, lockfile, xvfb).
- [ ] 5.3 Merge the PR to `main`.
- [ ] 5.4 Apply `main` protection requiring the `verify` + `e2e` checks via
  `gh api` — use a **repository ruleset** (`POST /repos/lunma-app/lunma/rulesets`
  with `required_status_checks` for `verify` + `e2e`, plus `pull_request`), since
  rulesets work on **Free private** repos (classic branch protection on private
  repos needs a paid plan). The check contexts must already exist from §5.1.
  Verify: `gh api repos/lunma-app/lunma/rulesets`.

## 6. Verification (against the spec scenarios)

- [ ] 6.1 Local/CI parity: `pnpm -r verify` passes locally and the CI `verify`
  check passes on the PR (spec: "CI runs the workspace verify gate" + "uses the
  repository-pinned toolchain").
- [ ] 6.2 Confirm `--frozen-lockfile` is in the install step and would fail on a
  stale lockfile (spec: "Lockfile drift fails the build").
- [ ] 6.3 Confirm the `e2e` check ran under `xvfb-run` and passed (spec: "CI runs
  the Playwright MV3 end-to-end smoke headlessly").
- [ ] 6.4 Confirm merging is blocked while a required check is failing/pending and
  allowed when both pass (spec: "Merges to main are gated on green CI").
- [ ] 6.5 Confirm the workflow token is `contents: read` and a superseding push
  cancels the prior run (spec: "least privilege and cancels superseded runs").
- [ ] 6.6 Confirm a dependabot PR (or a manually-forced bump) runs `verify` + `e2e`
  (spec: "Dependency updates … gated by CI").
- [ ] 6.7 Confirm the PR/issue templates + `CODEOWNERS` are picked up by GitHub
  (spec: "contributor intake scaffolding").
- [ ] 6.8 Confirm the repo is **still private** (`isPrivate: true`) — it must not
  go public until `open-source-public-launch`.
- [ ] 6.9 Confirm docs (§4) and this change's artifacts agree with what shipped
  (doc-lockstep); update either side if they drifted.
