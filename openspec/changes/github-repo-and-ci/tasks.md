## 1. GitHub org and private repository (guided-manual + gh)

- [ ] 1.1 **(manual gate)** First confirm the handle is still free
  (`gh api orgs/lunma-app` / `gh api users/lunma-app` → both 404), then create the
  `lunma-app` organization at `https://github.com/organizations/new` (Free plan).
  `gh` cannot create orgs. Verify it exists and you own it:
  `gh api orgs/lunma-app --jq '.login'` returns `lunma-app`. (The unhyphenated
  `lunma` is already a taken GitHub user — verified — hence `lunma-app`.)
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

- [x] 2.1 Workflow skeleton: `on: [pull_request]` + `push: { branches: [main] }`;
  top-level `permissions: { contents: read }`; `concurrency: { group: "${{ github.workflow }}-${{ github.ref }}", cancel-in-progress: true }`.
- [x] 2.2 `verify` job (ubuntu-latest), in this exact step order (the cache step
  needs a real store path, which only exists after corepack activates pnpm):
  1. `actions/checkout@v4`
  2. `actions/setup-node@v4` with `node-version: 24`
  3. `run: corepack enable` (activates the `packageManager`-pinned `pnpm@11.3.0`;
     do **not** specify a pnpm version anywhere else — no `pnpm/action-setup` with
     a hardcoded version). Set `COREPACK_ENABLE_DOWNLOAD_PROMPT: 0` in the job
     `env` so corepack fetches the pinned pnpm non-interactively.
  4. `id: pnpm-store` → `run: echo "dir=$(pnpm store path --silent)" >> "$GITHUB_OUTPUT"`
     (resolve the store path into a step output — `actions/cache` `path:` is a
     static string, not a shell substitution).
  5. `actions/cache@v4` with `path: ${{ steps.pnpm-store.outputs.dir }}`,
     `key: ${{ runner.os }}-pnpm-${{ hashFiles('**/pnpm-lock.yaml') }}`,
     `restore-keys: ${{ runner.os }}-pnpm-`.
  6. `run: pnpm install --frozen-lockfile`
  7. `run: pnpm -r verify`
- [x] 2.3 `e2e` job (ubuntu-latest, parallel to `verify`): same setup steps 1–6 as
  2.2 (checkout → setup-node 24 → corepack → store cache → frozen install), then
  `pnpm --filter @lunma/extension exec playwright install --with-deps chromium`,
  then `xvfb-run -a pnpm test:e2e` (the root `test:e2e` filters to the extension,
  which runs `pnpm build && playwright test` — the build runs under `xvfb-run`,
  which is harmless; `CI=true` is set by GitHub so the config's single retry
  applies).
- [x] 2.4 Pin every third-party action to a major tag (or SHA). Confirm the two
  job names are exactly `verify` and `e2e` (the names §5.4 will require in branch
  protection — keep them in lockstep).

## 3. Repo hygiene files

- [x] 3.1 `.github/pull_request_template.md` — summary / linked OpenSpec change /
  `pnpm -r verify` + `pnpm test:e2e` run locally / doc-lockstep checkbox.
- [x] 3.2 `.github/ISSUE_TEMPLATE/bug_report.md` and
  `.github/ISSUE_TEMPLATE/feature_request.md`, plus
  `.github/ISSUE_TEMPLATE/config.yml` with `blank_issues_enabled: false`.
- [x] 3.3 `.github/CODEOWNERS` — route all paths to the owner: `* @lunma-app/maintainers`
  (the authenticated `gh` account — verified). If the org is owned by a different
  account/team, use that handle instead, since GitHub silently no-ops an unknown
  owner (see spec scenario "CODEOWNERS names a valid owner").
- [x] 3.4 `.github/dependabot.yml` — two ecosystems at `/`: `npm` (pnpm) and
  `github-actions`, weekly, grouped where sensible.

## 4. Documentation (doc-lockstep — required this change)

- [x] 4.1 `docs/02-tech-stack.md` — add a CI/release-engineering note: CI runs the
  same pinned toolchain (Node 24, corepack-pinned `pnpm@11.3.0`) and the same
  `pnpm -r verify` gate as local; the e2e smoke runs under `xvfb-run` (headed-MV3
  requirement); devbox remains the local-dev story only. Cross-reference the
  existing corepack/`packageManager` toolchain rows rather than restating the pin
  (avoid two statements of the same fact drifting apart).
- [x] 4.2 `docs/03-architecture.md` — add a short "Continuous integration"
  subsection: CI enforces the `architecture-integrity` layer-DAG rules (via
  `biome check` inside `pnpm -r verify`) on every PR, not just locally; merge to
  `main` is gated on `verify` + `e2e`.
- [x] 4.3 New ADR `docs/adr/0016-ci-on-github-actions.md` recording D1–D5
  (setup-node+corepack over devbox-in-CI; two jobs; single `pnpm -r verify` over a
  matrix; `xvfb-run` for e2e; imperative branch protection / rulesets). Add it to
  `docs/adr/README.md`.

## 5. First CI run + branch protection

- [ ] 5.1 Commit §2–§4 on the `chore/ci-bootstrap` branch and push it; open a PR
  (`gh pr create --base main`). The checks run from the **`pull_request`** event,
  not the branch push (the workflow's `push` trigger is `branches: [main]` only),
  so confirm **both** `verify` and `e2e` checks appear on the PR.
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
