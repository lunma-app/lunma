## Why

Lunma has no GitHub home and no continuous integration: there is no remote, no
org, and the `pnpm -r verify` gate only ever runs on the author's machine. This
change is **plumbing** — it ships no user-visible surface — but it is the
smallest plumbing required by three *named* upcoming changes that do reach users:
`site-continuous-deploy` (deploys `lunma.app` from this repo's CI, which in turn
unblocks the Chrome Web Store privacy-policy URL), `extension-release-pipeline`
(builds and versions the published extension), and `open-source-public-launch`
(flips the repo public after the first store publish). Each of those needs a
GitHub repo with a trustworthy, automated green gate to build on. Establishing
that gate now also means the eventual *public* repo arrives with every PR already
proven against the same checks a developer runs locally — the credibility a
local-only, open-source-positioned project depends on.

Per the launch checklist the repo stays **private** now and is open-sourced only
after the first Chrome Web Store publish; the contributor-facing files this change
adds are therefore plumbing for that named `open-source-public-launch` change.

## What Changes

- **New GitHub home.** A `lunma-app` organization (the unhyphenated `lunma` is
  already a taken GitHub user) and a **private** repo `lunma-app/lunma`, with the
  existing local history pushed as `origin`. (Org creation is a guided manual web
  step — `gh` cannot create orgs; everything after is `gh`/`git`.)
- **CI workflow** (`.github/workflows/ci.yml`) on every pull request and push to
  `main`:
  - a `verify` job running the workspace gate — Node 24 via `actions/setup-node`,
    the repo-pinned `pnpm@11.3.0` via corepack, pnpm-store caching,
    `pnpm install --frozen-lockfile`, then `pnpm -r verify` (fans out to the
    extension's `tsc`/`biome`/`svelte-check`/`stylelint`/`vitest` and the site's
    `biome`/`svelte-check`/`vitest`/`build`);
  - an `e2e` job running the Playwright MV3 smoke under `xvfb-run pnpm test:e2e`
    (the extension fixture launches a *headed* persistent context via
    `--load-extension`, which Chromium permits only headed or `--headless=new`);
  - `concurrency` with cancel-in-progress per ref, and least-privilege
    `permissions: contents: read`.
- **Branch protection** on `main` requiring the `verify` and `e2e` checks to pass
  before merge — configured imperatively via `gh api` (GitHub branch rules are
  account state, not a repo file), documented in `tasks.md` so it is reproducible.
- **Repo hygiene files:** `.github/pull_request_template.md`,
  `.github/ISSUE_TEMPLATE/` (a bug report + a feature request), `.github/CODEOWNERS`,
  and `.github/dependabot.yml` (the `npm` package ecosystem for pnpm + the
  `github-actions` ecosystem).

This change introduces **no `host_permissions`, no manifest, no `src/` code, and
no user-visible surface** — so there is no `Visual language` section and no
`src/ui/` primitive work (none is applicable; stated here to satisfy the
component-library and visual-quality policies by explicit exemption).

## Capabilities

### New Capabilities
- `release-engineering`: how Lunma's code reaches production — the automated
  quality gate on every change, and (in later changes) how the site is deployed
  and the extension is released. This change establishes the **CI** half:
  the requirement that the same `pnpm -r verify` gate plus the Playwright e2e
  smoke run on every pull request and push to `main`, gating merge to `main`.
  The capability grows in `site-continuous-deploy` (deploy requirements) and
  `extension-release-pipeline` (release/versioning requirements).

### Modified Capabilities
<!-- None. No existing capability's requirements change. -->

## Impact

- **New files (all repo-root / `.github/`, no `src/` impact):**
  - `.github/workflows/ci.yml`
  - `.github/pull_request_template.md`
  - `.github/ISSUE_TEMPLATE/bug_report.md`
  - `.github/ISSUE_TEMPLATE/feature_request.md`
  - `.github/ISSUE_TEMPLATE/config.yml` (disable blank issues, point elsewhere)
  - `.github/CODEOWNERS`
  - `.github/dependabot.yml`
- **New OpenSpec spec:** `openspec/specs/release-engineering/spec.md` (on archive).
- **External / account state (not files):** the `lunma-app` org, the private
  `lunma-app/lunma` repo, the `origin` remote, and the `main` branch-protection
  ruleset. Recorded as reproducible `gh`/`git` commands in `tasks.md`.
- **Docs updated in this change (doc-lockstep):**
  - `docs/02-tech-stack.md` — add a CI/release-engineering note (the toolchain is
    pinned for both local `verify` and CI; corepack-pinned pnpm, Node 24, the
    xvfb requirement for e2e).
  - `docs/03-architecture.md` — a short "Continuous integration" subsection
    noting CI runs the same `pnpm -r verify` gate the layer-DAG rules are checked
    by, so architecture-integrity is enforced on every PR, not just locally.
  - `docs/adr/0016-ci-on-github-actions.md` — a new ADR recording the CI tooling
    choices (setup-node+corepack over devbox-in-CI; xvfb for MV3 e2e; single
    `pnpm -r verify` job over a per-package matrix; imperative branch protection
    via a ruleset). `0016` is the next free number (0001–0015 exist); also added
    to `docs/adr/README.md`.
- **Docs explicitly left untouched:** `docs/01-vision.md`, `docs/04-capabilities.md`,
  `docs/05-roadmap.md`, `docs/06-migration.md`, `the distribution notes`,
  `docs/07-brand-identity.md` (no product behaviour, roadmap, or brand surface
  changes here).
- **Dependencies:** none added to any `package.json`. CI consumes the existing
  pinned toolchain and the already-present `@playwright/test`; Playwright's
  browser binary is installed in CI at job time, not vendored.
- **Out of scope (deferred to named changes):**
  - Cloudflare Pages deploy of `apps/site` / `lunma.app` → `site-continuous-deploy`.
  - Extension version injection (the `0.0.0` → real-version blocker B1),
    `build`+zip artifacting, GitHub Releases → `extension-release-pipeline`.
  - Chrome Web Store *upload automation* → a later phase of
    `extension-release-pipeline`; the **first** publish is a manual dashboard
    submission per the approval checklist.
  - CLA/DCO enforcement, git-history squash, `openspec/changes/archive/`
    exclusion, and flipping the repo public → `open-source-public-launch`.
