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
- Doc-lockstep: `docs/tech-stack.md` and `docs/architecture.md` record the CI choices.

**Non-Goals:**

- Any deploy or release (site → `site-continuous-deploy`; extension version
  injection / build-zip / GitHub Releases → `extension-release-pipeline`).
- Chrome Web Store upload automation (later phase of
  `extension-release-pipeline`; first publish is manual).
- Open-sourcing: CLA/DCO enforcement, history squash, archive exclusion, public
  flip (→ `open-source-public-launch`).
- CI build caching beyond the pnpm store (Turborepo task-graph caching is
  explicitly deferred per the workspace ADR / `docs/tech-stack.md`).
- Multi-OS or multi-Node matrices — Linux + Node 24 only.

## Decisions

### D1 — `actions/setup-node` + corepack, not devbox-in-CI

Provision Node with `actions/setup-node@v6` (`node-version: 24`) and enable
corepack to activate the pnpm version pinned in `packageManager`. Cache the pnpm
store keyed on `pnpm-lock.yaml`.

- **Why:** It reuses the *exact* pins the repo already declares, so CI cannot
  drift from local. It is the lightest path with first-class caching.
- **devbox-in-CI — rejected:** `jetify-com/devbox-install-action` works but adds
  a Nix bootstrap + cold-cache latency for zero gain here — devbox's value is
  reproducing the *local* shell, and CI doesn't need the local shell, only the
  pinned Node + pnpm, which setup-node + corepack give directly. devbox stays the
  local-dev story (`docs/tech-stack.md`).
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
  and is deferred (the workspace ADR).
- **Matrix per package — rejected (for now):** premature at two packages; the
  decision is reversible without changing the spec (the spec requires the gate to
  run, not how it is sharded).

### D4 — `xvfb-run` for the e2e job

Install Chromium with `pnpm --filter @lunma/extension exec playwright install
--with-deps chromium`, then run `xvfb-run pnpm test:e2e`. `test:e2e` already does
`pnpm build && playwright test`, so the build is covered; `CI=true` is set by
GitHub so the config applies its single retry.

- **Why:** Mandated by the headed-MV3 constraint above; it is the project's own
  prescribed approach, not a new invention. Note the fixture
  (`apps/extension/e2e/fixtures.ts`) currently hardcodes `headless: false` and
  does **not** read any env switch (its `PWHEADLESS=new` comment is presently
  inaccurate — the code ignores it), so xvfb is not merely *preferred* for CI: it
  is the *only* path without a fixture change. This strengthens, rather than
  weakens, the decision.
- **`--headless=new` instead of xvfb — rejected (for now):** plausible, but it
  would require editing the fixture to actually honour a headless switch (it
  doesn't today), which is out of this change's scope. If e2e proves flaky under
  xvfb, making the fixture honour `--headless=new` is a follow-up, not a blocker.
- **Note on the `xvfb-run` command:** `pnpm test:e2e` is `pnpm build && playwright
  test`, so the Vite build also runs inside `xvfb-run` — harmless (the build needs
  no display) and it keeps the project's single `test:e2e` entry point as the one
  source of truth for how e2e runs. The job uses `xvfb-run -a` (auto servernum).

### D5 — Imperative `main` protection (`gh api`); ruleset intended, classic protection landed

Configure `main` protection (require the `verify` + `e2e` checks, require a PR)
with a `gh api` call documented in `tasks.md`, using a **repository ruleset**
(`POST /repos/lunma-app/lunma/rulesets`) rather than classic branch protection.

- **Why a ruleset, not classic protection:** classic branch protection on a
  *private* repo requires a paid plan (Pro/Team/Enterprise), whereas repository
  **rulesets** are available on **Free** for private repos. Since the repo is Free
  + private now, the ruleset is the only no-cost mechanism that meets the
  "merges gated on green CI" requirement. *(GitHub plan limits move — re-verify
  current availability at execution time; if classic protection is free by then,
  it is an equivalent substitute, the spec being mechanism-agnostic.)*
- **Why imperative `gh api`:** rulesets / branch protection are *account state*,
  not a file in the repo, so they cannot be committed. Capturing the exact
  `gh api` invocation in `tasks.md` makes the state reproducible and keeps the
  required check contexts in lockstep with the workflow's job names (`verify`,
  `e2e`).
- **A third-party "settings as code" app (e.g. Probot Settings) — rejected:** it
  adds an external GitHub App + a config file for one branch's rules; overkill,
  and it wants broad repo permissions this private solo repo shouldn't grant.

- **Execution-time outcome — initially DEFERRED (plan-blocked):** at apply time
  GitHub returned HTTP 403 for **both** the ruleset *and* classic branch protection
  on the Free + private repo ("Upgrade to GitHub Pro or make this repository
  public") — rulesets are **no longer free for private repos**, contradicting the
  assumption above (the hedge anticipated exactly this). So `main` protection was
  deferred until the org upgrades (Team) or the repo goes public
  (`open-source-public-launch`), when protection is free.
- **Resolution — protection LANDED (mechanism: classic branch protection):** the
  repo went **public** under `open-source-public-launch`, which made protection
  free even on the Free org. Per the mechanism-agnostic hedge above, the landed
  mechanism is **classic branch protection** (`PUT …/branches/main/protection`),
  the now-free equivalent substitute — not a ruleset. `main` requires the `verify`
  + `e2e` status checks under `strict: true` (must be up to date), with
  `enforce_admins: true`, `allow_force_pushes: false`, `allow_deletions: false`.
  The protection additionally requires the `dco` and `identity` contexts (from the
  sibling commit-identity/DCO work) — additive to, and not in conflict with, this
  change's `verify` + `e2e` requirement. The spec's "Merges to main are gated on
  green CI" requirement is now satisfied.

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

### D7 — Harden flaky smoke gestures with assert-and-retry, not quarantine

The `pin-temp-into-folder` smoke began failing the `e2e` check intermittently in
CI: its third drag — filing a temp tab into a just-renamed folder — pressed on a
stale bounding box under load, so no drag started and the pin was never minted
(`savedIds` stayed 2 where 3 was expected). Rather than quarantine the spec or
lean harder on Playwright's run-level `retries`, the shared `dragTo` helper
becomes an **assert-and-retry gesture**: it re-measures both ends each attempt and
verifies a caller-supplied "drop registered" predicate (the exact expected
`savedIds` count), replaying the pointer sequence (bounded, 4 attempts) only when
nothing committed — safe because a stale-box no-op changed no state.

- **Why not quarantine:** the spec guards a shipped no-orphan guarantee; skipping
  it would blind the gate to a real regression class.
- **Why not just raise `retries`:** run-level retries re-run the *whole* spec and
  read as "flaky-but-passing"; an in-gesture retry targets the exact fragile step
  and keeps a real regression failing fast — the predicate asserts exact state, so
  a broken drop exhausts retries and fails.
- **Backward-compatible signature (deviation, recorded):** `dragTo` gains an
  optional fourth `settled?: () => Promise<boolean>` argument; call shapes without
  it keep the original single-pass behaviour. This helper is named in neither the
  proposal nor prior design, so its addition is logged here per the deviation
  policy.

### D8 — Fan-out `verify` into parallel extension jobs + no-op aggregator

The `verify` CI job was implemented as a parallel matrix of five extension jobs
(`typecheck`, `lint`, `check`, `lint:styles`, `test:run`) plus a separate `site`
job, unified by a no-op `verify` aggregator that goes green only when every leg
passes — rather than the single `pnpm -r verify` job described in D3.

- **Why:** `tsc --noEmit` and `svelte-check` are the slowest steps and run
  serially inside a single `pnpm -r verify` pass; fanning them out to separate
  runners lets them overlap, cutting wall-clock time with no change to the
  required check name or branch-protection config. The `verify` aggregator is the
  single required status check in both structures.
- **D3 (`pnpm -r verify` as one job) — superseded:** D3's rationale (simplicity
  at current repo size) was outweighed by the easy parallelism win. The spec delta
  in `specs/release-engineering/spec.md` is updated to describe this structure.
- **Deviation (recorded per policy):** the tasks.md §2.2 note logged this at
  implementation time; this decision entry is the design-artifact record.

## Risks / Trade-offs

- **[`gh` cannot create orgs]** → The org is a guided manual web step
  (`github.com/organizations/new`); `tasks.md` documents it as a manual gate
  before the `gh repo create` step. Everything after the org exists is scripted.
- **[Playwright e2e flakiness under xvfb / MV3 service-worker timing]** → The
  config sets `retries: 1` under CI and `workers: 1`; `trace: retain-on-failure`
  aids debugging. The first flake to actually surface — `pin-temp-into-folder`'s
  stale-box drag — is fixed in this change via the assert-and-retry `dragTo`
  gesture (D7), not quarantined; should another spec prove irreducibly flaky it
  gets the same gesture-level hardening. The `e2e` check staying required
  (D2/spec) means flakiness is visible, not hidden.
- **[Private-repo Actions minutes consumption]** → Private repos draw on the
  account's included Actions minutes. The two-job-per-push cost is modest;
  `concurrency: cancel-in-progress` curbs waste from rapid pushes. Re-verify the
  current free-tier minute allowance before relying on it (figures move).
- **[Pushing the full history (≈231 commits on `main`) with old-codename refs to
  GitHub]** → Acceptable while **private**; the references live only in
  `openspec/changes/archive/**` and are removed by the squash in
  `open-source-public-launch` *before* the public flip. This change MUST NOT make
  the repo public. (The CI work is pushed from a `chore/ci-bootstrap` branch off
  `main`, not from the in-flight `smart-folder-connectors` WIP branch.)
- **[Lockfile-drift failures]** → `--frozen-lockfile` fails CI when
  `pnpm-lock.yaml` is out of sync with the `package.json` manifests' declared
  specifiers (or is missing) — this is intended and is the spec requirement. It
  does *not* fail merely because a transitive dependency has a newer publish
  available; keeping deps fresh is dependabot's job (it bumps the manifest *and*
  the lockfile together in one PR, which then runs the same frozen install).
- **[Branch-protection check-name coupling]** → The required check names in the
  `gh api` ruleset must exactly match the workflow job names (`verify`, `e2e`).
  If a job is renamed, the protection must be updated in the same change — called
  out in `tasks.md`.

## Migration Plan

This is additive infrastructure; there is nothing to roll back in `src/`.

1. Create the `lunma-app` org (manual web UI).
2. `gh repo create lunma-app/lunma --private` (no `--source`/`--push` — we control
   what gets pushed and when), then `git remote add origin
   git@github.com:lunma-app/lunma.git`.
3. Land `.github/**` (workflow + hygiene files) + docs on a `chore/ci-bootstrap`
   branch off `main`, push that branch, open a PR, and confirm both `verify` and
   `e2e` checks run and pass.
4. After the first green run, apply branch protection via `gh api` (the required
   check contexts must exist first, which is why this step follows the first run).
5. Push `main`.

**Rollback:** delete the `.github/workflows/ci.yml` (or disable the workflow in
repo settings) and remove the branch-protection ruleset; no code is affected.

## Open Questions

- **None blocking.** Whether to later shard `verify` into a matrix (D3) or switch
  e2e to `--headless=new` (D4) are explicitly deferred and reversible without spec
  changes. The CI tooling decisions are recorded in this `design.md` rather than a
  standalone ADR.
