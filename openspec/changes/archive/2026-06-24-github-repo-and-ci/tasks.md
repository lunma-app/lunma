## 1. GitHub org and private repository (guided-manual + gh)

- [x] 1.1 **(manual gate)** First confirm the handle is still free
  (`gh api orgs/lunma-app` / `gh api users/lunma-app` → both 404), then create the
  `lunma-app` organization at `https://github.com/organizations/new` (Free plan).
  `gh` cannot create orgs. Verify it exists and you own it:
  `gh api orgs/lunma-app --jq '.login'` returns `lunma-app`. (The unhyphenated
  `lunma` is already a taken GitHub user — verified — hence `lunma-app`.)
- [x] 1.2 Create the **private** repo without pushing yet:
  `gh repo create lunma-app/lunma --private --description "Lunma — spatial tab/bookmark management for Chrome (extension) + its marketing site"`.
  Confirm: `gh repo view lunma-app/lunma --json visibility,isPrivate` shows
  `"isPrivate": true`.
- [x] 1.3 Wire the remote (SSH, matching the `gh` auth protocol):
  `git remote add origin git@github.com:lunma-app/lunma.git`; verify with
  `git remote -v`. Confirm the intended default branch is `main`.
- [x] 1.4 Do the CI work on a dedicated branch (e.g. `chore/ci-bootstrap`) off the
  intended `main`, so this change's commits don't entangle with the in-flight
  `smart-folder-connectors` WIP. (Do **not** push `main` until §5.)

## 2. CI workflow (`.github/workflows/ci.yml`)

- [x] 2.1 Workflow skeleton: `on: [pull_request]` + `push: { branches: [main] }`;
  top-level `permissions: { contents: read }`; `concurrency: { group: "${{ github.workflow }}-${{ github.ref }}", cancel-in-progress: true }`.
- [x] 2.2 `verify` job (ubuntu-latest), in this exact step order (the cache step
  needs a real store path, which only exists after corepack activates pnpm):
  1. `actions/checkout@v6`
  2. `actions/setup-node@v6` with `node-version: 24`
  3. `run: corepack enable` (activates the `packageManager`-pinned `pnpm@11.3.0`;
     do **not** specify a pnpm version anywhere else — no `pnpm/action-setup` with
     a hardcoded version). Set `COREPACK_ENABLE_DOWNLOAD_PROMPT: 0` in the job
     `env` so corepack fetches the pinned pnpm non-interactively.
  4. `id: pnpm-store` → `run: echo "dir=$(pnpm store path --silent)" >> "$GITHUB_OUTPUT"`
     (resolve the store path into a step output — `actions/cache` `path:` is a
     static string, not a shell substitution).
  5. `actions/cache@v5` with `path: ${{ steps.pnpm-store.outputs.dir }}`,
     `key: ${{ runner.os }}-pnpm-${{ hashFiles('**/pnpm-lock.yaml') }}`,
     `restore-keys: ${{ runner.os }}-pnpm-`.
  6. `run: pnpm install --frozen-lockfile`
  7. `run: pnpm -r verify`
  > Note (later change): the single `verify` job was subsequently restructured to
  > fan the extension's verify steps (typecheck / lint / svelte-check / styles /
  > unit tests) plus a `site` job across parallel runners, behind a no-op `verify`
  > aggregator job that gates on them all. The required-check name `verify` is
  > unchanged. See `docs/tech-stack.md` § "Continuous integration".
- [x] 2.3 `e2e` job (ubuntu-latest, parallel to `verify`): same setup steps 1–6 as
  2.2 (checkout → setup-node 24 → corepack → store cache → frozen install), then
  `pnpm --filter @lunma/extension exec playwright install --with-deps chromium`,
  then `xvfb-run -a pnpm test:e2e` (the root `test:e2e` filters to the extension,
  which runs `pnpm build && playwright test` — the build runs under `xvfb-run`,
  which is harmless; `CI=true` is set by GitHub so the config's single retry
  applies).
- [x] 2.4 Pin every third-party action to a major tag (or SHA). Confirm the two
  job names are exactly `verify` and `e2e` (the names §5.4 will require in branch
  protection — keep them in lockstep). _Pins are the current Node-24 majors —
  `checkout@v6`, `setup-node@v6`, `cache@v5`; the originally-drafted `@v4` ran on
  the deprecated Node-20 action runtime (surfaced as a CI warning, agreed bump)._

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

- [x] 4.1 `docs/tech-stack.md` — add a CI/release-engineering note: CI runs the
  same pinned toolchain (Node 24, corepack-pinned `pnpm@11.3.0`) and the same
  `pnpm -r verify` gate as local; the e2e smoke runs under `xvfb-run` (headed-MV3
  requirement); devbox remains the local-dev story only. Cross-reference the
  existing corepack/`packageManager` toolchain rows rather than restating the pin
  (avoid two statements of the same fact drifting apart).
- [x] 4.2 `docs/architecture.md` — add a short "Continuous integration"
  subsection: CI enforces the `architecture-integrity` layer-DAG rules (via
  `biome check` inside `pnpm -r verify`) on every PR, not just locally; merge to
  `main` is gated on `verify` + `e2e`.
- [x] 4.3 Record D1–D5 in this change's `design.md`
  (setup-node+corepack over devbox-in-CI; two jobs; single `pnpm -r verify` over a
  matrix; `xvfb-run` for e2e; imperative branch protection / rulesets).

## 5. First CI run + branch protection

- [x] 5.1 Commit §2–§4 on the `chore/ci-bootstrap` branch and push it; open a PR
  (`gh pr create --base main`). The checks run from the **`pull_request`** event,
  not the branch push (the workflow's `push` trigger is `branches: [main]` only),
  so confirm **both** `verify` and `e2e` checks appear on the PR.
- [x] 5.2 Iterate until both checks are green on the PR (fix any CI-only failures —
  e.g. Playwright deps, lockfile, xvfb). _First run (PR #1): `verify` green; `e2e`
  red on a pre-existing stale spec — `e2e/smart-folder-bindings.spec.ts` single-
  clicked the smart-folder Delete, but `smart-folder-delete-confirm` made it a
  two-step arm+confirm and never updated this e2e spec (`verify` doesn't run e2e,
  so CI was the first to exercise it). Agreed deviation: fixed the spec here to do
  the two-step confirm. `boundary.spec.ts:92` was flaky (passed on retry) — left
  to `retries: 1` per design._
- [x] 5.3 Merge the PR to `main`. _Fast-forwarded `main` to the green commit
  (`git push origin chore/ci-bootstrap:main`) instead of a GitHub merge: a UI/`gh`
  merge authors the merge commit with the operator's GitHub-account display name,
  which would re-introduce a personal name onto `main`; the FF keeps every commit
  `Lunma <dev@lunma.app>`. PR #1 auto-closed as merged._
- [x] 5.4 Applied `main` protection requiring the `verify` + `e2e` checks.
  _Originally deferred (plan-blocked): at first execution GitHub returned HTTP 403
  for both a repository ruleset (`POST …/rulesets`) and classic branch protection
  (`PUT …/branches/main/protection`) on the then **Free org + private** repo
  ("Upgrade to GitHub Pro or make this repository public"), invalidating D5's
  assumption that rulesets are free for private repos. Resolved exactly as §5.4
  anticipated: the repo went **public** under `open-source-public-launch`, and
  branch protection is free on public repos even for a Free org. Classic branch
  protection is now in place on `main`: `required_status_checks.strict: true` with
  contexts `verify` + `e2e` (plus `dco` + `identity` from sibling commit-identity/
  DCO work), `enforce_admins: true`, `allow_force_pushes: false`,
  `allow_deletions: false`._

## 6. Verification (against the spec scenarios)

- [x] 6.1 Local/CI parity: `pnpm -r verify` passes locally and the CI `verify`
  check passes on the PR (spec: "CI runs the workspace verify gate" + "uses the
  repository-pinned toolchain").
- [x] 6.2 Confirm `--frozen-lockfile` is in the install step and would fail on a
  stale lockfile (spec: "Lockfile drift fails the build").
- [x] 6.3 Confirm the `e2e` check ran under `xvfb-run` and passed (spec: "CI runs
  the Playwright MV3 end-to-end smoke headlessly").
- [x] 6.4 Confirmed merges to `main` are gated on green CI (spec: "Merges to main
  are gated on green CI"). _Branch protection on `main` requires the `verify` +
  `e2e` status checks under `strict: true` (must be up to date) and enforces admins,
  so a PR cannot merge while either check is failing or pending and can merge once
  both pass. The earlier "not yet satisfied / do not archive until protection lands"
  caveat is now resolved — protection landed (see §5.4)._
- [x] 6.5 Confirm the workflow token is `contents: read` and a superseding push
  cancels the prior run (spec: "least privilege and cancels superseded runs").
- [x] 6.6 Confirm a dependabot PR (or a manually-forced bump) runs `verify` + `e2e`
  (spec: "Dependency updates … gated by CI"). _Verified by config: `dependabot.yml`
  declares the `npm` + `github-actions` ecosystems, and the workflow's
  `pull_request:` trigger has no branch filter, so a dependabot PR runs both jobs.
  (No live dependabot PR has fired yet on the fresh repo.)_
- [x] 6.7 Confirm the PR/issue templates + `CODEOWNERS` are picked up by GitHub
  (spec: "contributor intake scaffolding").
- [x] 6.8 Confirm the repo is **still private** (`isPrivate: true`) — it must not
  go public until `open-source-public-launch`.
- [x] 6.9 Confirm docs (§4) and this change's artifacts agree with what shipped
  (doc-lockstep); update either side if they drifted. _Reconciled: action pins
  bumped to Node-24 majors (§2.2/2.4, design D1); branch-protection
  deferral recorded (§5.4/§6.4, design D5, docs/tech-stack.md + docs/architecture.md
  softened from "merges gated" to "CI runs on every PR/push; gating deferred")._

## 7. e2e smoke-gesture reliability (assert-and-retry `dragTo`)

- [x] 7.1 Root-cause the intermittent `e2e` failure on
  `pin-temp-into-folder.spec.ts`: the third drag (filing a temp tab into the
  just-renamed folder) pressed on a **stale bounding box** under CI load, so no
  drag started and `savedIds` stayed 2 where 3 was expected. Confirmed unrelated
  to product/CI-config code — it failed off a pure-docs commit and passed on the
  dependabot PRs off the same `main`; `verify` (which doesn't run e2e) is green.
- [x] 7.2 Convert the shared `dragTo` helper into an **assert-and-retry** gesture
  (design D7): scroll both ends into view and re-measure each attempt; accept an
  optional `settled?: () => Promise<boolean>` predicate; verify it via
  `expect.poll(settled, { timeout: 2_000 }).toBe(true)` and replay the pointer
  sequence (bounded — 4 attempts) only when the drop didn't register.
- [x] 7.3 Pass a `settled` predicate (exact `savedIds.length === N`) at each of the
  three drag call sites; keep the existing `expect.poll(...).toBe(N)` assertions
  as the authoritative checks.
- [x] 7.4 Verify determinism locally: `pnpm --filter @lunma/extension build` then
  `playwright test pin-temp-into-folder.spec.ts --repeat-each=3` → 3/3 green.
  _CI-load confirmation lands when the `e2e` job re-runs on the PR._
- [x] 7.5 Record the new `release-engineering` requirement ("End-to-end smoke
  gestures are deterministic under CI load") in this change's spec delta + design
  D7; update the Risks bullet from "quarantine in a follow-up" to "fixed here".
