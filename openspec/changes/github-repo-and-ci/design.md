## Context

The repository is a pnpm workspace (`apps/extension`, `apps/site`,
`packages/tokens`) with a single quality gate, `pnpm -r verify`, that today runs
only on the author's machine. There is no git remote, no GitHub org, and no CI.
The root `package.json` pins the toolchain: `engines.node >= 24`,
`packageManager: pnpm@11.3.0`, and `verify` is `pnpm -r --workspace-concurrency=1 verify`.
Local development uses devbox (Node 24 + corepack), but devbox is a developer
convenience, not a CI requirement.

This is the first of four sequenced release-engineering changes. It establishes
**CI only**. The downstream consumers are named in the proposal:
`site-continuous-deploy`, `extension-release-pipeline`, and
`open-source-public-launch`. The launch checklist requires the repo to remain
**private** until after the first Chrome Web Store publish, so this change creates
a private repo and pushes the existing history as-is (the old-codename references
that survive only in `openspec/changes/archive/**` are irrelevant while private;
they are scrubbed by the squash in `open-source-public-launch`).

A load-bearing constraint comes from `apps/extension/playwright.config.ts`: the
e2e fixture launches a **headed** persistent Chromium context via
`--load-extension`, because Chromium loads MV3 extensions only in a headed or
`--headless=new` context, never the default headless shell. The config's own
comment prescribes the CI answer: *"on a headless CI box run under
`xvfb-run pnpm test:e2e`."* So the e2e approach is not an open question — it is
already chosen by the codebase.

This change ships no `src/` code and no user-visible surface, so the
visual-quality and component-library policies do not apply (no `Visual language`
section, no `src/ui/` primitive work) — noted here by explicit exemption.

## Goals / Non-Goals

**Goals:**

- A GitHub home: the `lunma-app` org and a **private** `lunma-app/lunma` repo,
  with local history pushed and `origin` wired.
- CI that runs the *same* `pnpm -r verify` gate plus the Playwright e2e smoke on
  every pull request and push to `main`, on the repo-pinned toolchain, gating
  merge to `main`.
- Reproducibility: the manual/account steps (org, repo, branch protection) are
  captured as exact `gh`/`git` commands in `tasks.md`, not tribal knowledge.
- Doc-lockstep: `docs/02`, `docs/03`, and a new ADR record the CI choices.

**Non-Goals:**

- Any deploy or release (site → `site-continuous-deploy`; extension version
  injection / build-zip / GitHub Releases → `extension-release-pipeline`).
- Chrome Web Store upload automation (later phase of
  `extension-release-pipeline`; first publish is manual).
- Open-sourcing: CLA/DCO enforcement, history squash, archive exclusion, public
  flip (→ `open-source-public-launch`).
- CI build caching beyond the pnpm store (Turborepo task-graph caching is
  explicitly deferred per ADR 0012 / `docs/02`).
- Multi-OS or multi-Node matrices — Linux + Node 24 only.

## Decisions

### D1 — `actions/setup-node` + corepack, not devbox-in-CI

Provision Node with `actions/setup-node@v4` (`node-version: 24`) and enable
corepack to activate the pnpm version pinned in `packageManager`. Cache the pnpm
store keyed on `pnpm-lock.yaml`.

- **Why:** It reuses the *exact* pins the repo already declares, so CI cannot
  drift from local. It is the lightest path with first-class caching.
- **devbox-in-CI — rejected:** `jetify-com/devbox-install-action` works but adds
  a Nix bootstrap + cold-cache latency for zero gain here — devbox's value is
  reproducing the *local* shell, and CI doesn't need the local shell, only the
  pinned Node + pnpm, which setup-node + corepack give directly. devbox stays the
  local-dev story (`docs/02`).
- **A separate `pnpm/action-setup` with a hardcoded version — rejected:** it
  would duplicate the pnpm version outside `packageManager` and invite drift; the
  drift-prevention requirement in the spec is the whole point.

### D2 — Two jobs: `verify` and `e2e`

Split the gate into a `verify` job (`pnpm -r verify`) and an `e2e` job
(`xvfb-run pnpm test:e2e`), running in parallel.

- **Why:** They have different shapes — `verify` is pure Node, `e2e` needs a
  browser + system libraries + a virtual display and is slower and serial
  (`workers: 1`, `fullyParallel: false` in the Playwright config). Separating
  them gives independent, legible status checks (the two checks branch protection
  requires) and lets `verify` finish fast without waiting on the browser install.
- **One combined job — rejected:** it muddles the two failure modes into one
  check and serializes the fast gate behind the slow browser setup.

### D3 — Single `pnpm -r verify` job, not a per-package matrix

Run the workspace gate as one recursive command, not a matrix of one job per
package.

- **Why:** The root `verify` already serializes with `--workspace-concurrency=1`,
  the two packages' gates are quick, and a matrix adds fan-out/caching complexity
  for marginal wall-clock benefit at this repo size. Keep it simple; revisit if
  CI gets slow. Turborepo-style task-graph caching is the documented escape hatch
  and is deferred (ADR 0012).
- **Matrix per package — rejected (for now):** premature at two packages; the
  decision is reversible without changing the spec (the spec requires the gate to
  run, not how it is sharded).

### D4 — `xvfb-run` for the e2e job

Install Chromium with `pnpm --filter @lunma/extension exec playwright install
--with-deps chromium`, then run `xvfb-run pnpm test:e2e`. `test:e2e` already does
`pnpm build && playwright test`, so the build is covered; `CI=true` is set by
GitHub so the config applies its single retry.

- **Why:** Mandated by the headed-MV3 constraint above; it is the project's own
  prescribed approach, not a new invention.
- **`--headless=new` instead of xvfb — rejected (for now):** plausible, but the
  fixture and config are written around a headed context and the config comment
  commits to xvfb; changing the launch mode is a fixture change outside this
  change's scope. If e2e proves flaky under xvfb, switching launch mode is a
  follow-up, not a blocker here.

### D5 — Imperative branch protection via `gh api`

Configure `main` protection (require `verify` + `e2e` checks, require a PR) with
a `gh api` call documented in `tasks.md`.

- **Why:** GitHub branch protection / rulesets are *account state*, not a file in
  the repo, so they cannot be committed. Capturing the exact `gh api` invocation
  makes the state reproducible and reviewable, and keeps the check names in lock
  step with the workflow's job names.
- **A third-party "settings as code" app (e.g. Probot Settings) — rejected:** it
  adds an external GitHub App + a config file for one branch's rules; overkill,
  and it wants broad repo permissions this private solo repo shouldn't grant.

### D6 — Contributor scaffolding now, even without a public consumer yet

Ship the PR template, issue templates (+ `config.yml` disabling blank issues),
and `CODEOWNERS` in this change though their real consumer is
`open-source-public-launch`.

- **Why:** The user explicitly opted to include them now; they are static, inert
  while private, and cost nothing to carry. `CODEOWNERS` also starts auto-routing
  review to the owner immediately.
- **Defer to the public launch — considered, not chosen:** would be the strict
  "smallest plumbing" reading, but the user's call governs and the files are
  harmless. Recorded so the inclusion is not a silent deviation.

## Risks / Trade-offs

- **[`gh` cannot create orgs]** → The org is a guided manual web step
  (`github.com/organizations/new`); `tasks.md` documents it as a manual gate
  before the `gh repo create` step. Everything after the org exists is scripted.
- **[Playwright e2e flakiness under xvfb / MV3 service-worker timing]** → The
  config already sets `retries: 1` under CI and `workers: 1`; `trace:
  retain-on-failure` aids debugging. If a spec is irreducibly flaky in CI it can
  be quarantined in a follow-up — out of scope to fix specs here. The `e2e` check
  staying required (D2/spec) means flakiness is visible, not hidden.
- **[Private-repo Actions minutes consumption]** → Private repos draw on the
  account's included Actions minutes. The two-job-per-push cost is modest;
  `concurrency: cancel-in-progress` curbs waste from rapid pushes. Re-verify the
  current free-tier minute allowance before relying on it (figures move).
- **[Pushing 244 commits with old-codename refs to GitHub]** → Acceptable while
  **private**; the references live only in `openspec/changes/archive/**` and are
  removed by the squash in `open-source-public-launch` *before* the public flip.
  This change MUST NOT make the repo public.
- **[Lockfile-drift false failures]** → `--frozen-lockfile` will fail CI if
  `pnpm-lock.yaml` lags the manifests; this is intended (it is a spec
  requirement), and dependabot PRs keep the lockfile current.
- **[Branch-protection check-name coupling]** → The required check names in the
  `gh api` ruleset must exactly match the workflow job names (`verify`, `e2e`).
  If a job is renamed, the protection must be updated in the same change — called
  out in `tasks.md`.

## Migration Plan

This is additive infrastructure; there is nothing to roll back in `src/`.

1. Create the `lunma-app` org (manual web UI).
2. `gh repo create lunma-app/lunma --private --source=. --remote=origin`.
3. Land `.github/**` (workflow + hygiene files) on a branch, open a PR, and
   confirm both `verify` and `e2e` checks run and pass.
4. After the first green run, apply branch protection via `gh api` (the required
   check contexts must exist first, which is why this step follows the first run).
5. Push `main`.

**Rollback:** delete the `.github/workflows/ci.yml` (or disable the workflow in
repo settings) and remove the branch-protection ruleset; no code is affected.

## Open Questions

- **None blocking.** Whether to later shard `verify` into a matrix (D3) or switch
  e2e to `--headless=new` (D4) are explicitly deferred and reversible without spec
  changes. The next free ADR number (after `0015`) is assigned when the ADR file
  is written in this change.
