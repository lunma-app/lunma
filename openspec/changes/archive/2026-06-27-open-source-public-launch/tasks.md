> Status: **authored, not yet implemented.** Execution is gated on the first
> Chrome Web Store publish (design D2). The §2 audit items marked `[x]` were
> performed ad hoc during the preparation session and are re-verified at
> execution (§2.5). Everything else is pending `/opsx:apply`.

## 1. Contribution governance (DCO) — landable pre-flip, while still private

- [x] 1.1 Add `DCO` at the repo root: the verbatim Developer Certificate of
  Origin 1.1 text (unmodified).
- [x] 1.2 Add `.github/workflows/dco.yml` — a `dco` job on `pull_request` that
  fails when any commit lacks a `Signed-off-by` trailer matching its author.
  `permissions: { contents: read }`; pin any third-party action to a SHA/major
  (or use a small inline trailer scan). Job name exactly `dco` (it becomes a
  required check in §4.1).
- [x] 1.3 Delete `CLA.md` (the CLA model + its commercial-relicensing option are
  dropped — design D1); repoint the `CONTRIBUTING.md` reference so nothing dangles.
- [x] 1.4 `CONTRIBUTING.md`: remove the "hold external contributions until the CLA
  is wired" maintainer note; document the DCO flow (`git commit -s`); link `DCO`.
- [x] 1.5 `README.md` "License" section: state contributions are accepted under
  Apache-2.0 with a DCO `Signed-off-by` (not a CLA).
- [x] 1.6 `.github/pull_request_template.md`: add a DCO sign-off reminder/checkbox.
- [x] 1.7 Land §1 on a branch; PR green on `verify` + `e2e` + `dco`; merge to `main`. _(Done: commit 3eddb29.)_

## 2. Pre-flip readiness audit (design D5)

- [x] 2.1 Clean git history — repo recreated with clean history; the old
  pre-rebrand `main` tip is unreachable on the new repo. _(Done ad hoc, prep session.)_
- [x] 2.2 Secret/PII scan of tree + history — no secrets, no personal data,
  uniform authorship under the canonical maintainer identity `Emanuel Fonseca
  <12010090+emdfonseca@users.noreply.github.com>` (the GitHub noreply; history was
  rewritten to it, scrubbing the prior `dev@lunma.app`/gmail emails). _(Re-run at §2.5.)_
- [x] 2.3 `@lunma-app/maintainers` team exists and has push; `.github/CODEOWNERS`
  resolves to it. _(Done ad hoc, prep session.)_
- [x] 2.4 `openspec/changes/archive/**` confirmed intended-public and audited
  clean (no secrets, no clean-room/Arcify-lineage risk, roadmap already public —
  design D4). _(Done ad hoc, prep session.)_
- [x] 2.5 **Re-run 2.1–2.4 immediately before the flip** — the tree may have
  drifted between authoring and the gated execution. Abort the flip on any finding. _(Done: repo was already public; audit confirmed clean history, uniform authorship, CODEOWNERS intact, archive clean.)_

## 3. Public flip (GATED — design D2)

- [x] 3.1 **(gate)** Confirm **both** pre-flip conditions hold; do not proceed
  unless both are true (design D2):
  - the first Chrome Web Store publish is live (milestone owned by
    `extension-release-pipeline`), **and**
  - `semver-enforcement` is live — its release automation is merged to `main`, a
    first real version has been cut (`v0.1.0`), and the version parity guard is
    green on `main`. A public repo must not ship an un-versioned `0.0.0`.
  _(Done: v0.3.1 is the latest release; semver-enforcement confirmed live.)_
- [x] 3.2 `gh repo edit lunma-app/lunma --visibility public --accept-visibility-change-consequences`;
  confirm `gh repo view --json visibility` shows `PUBLIC`. _(Done: repo is already PUBLIC.)_

## 4. Branch protection — closes `github-repo-and-ci` §5.4/§6.4 (design D3)

- [x] 4.1 Apply classic `main` protection via `gh api PUT …/branches/main/protection`:
  required checks `verify` + `e2e` + `dco` + `identity` (strict); `required_pull_request_reviews`
  with `require_code_owner_reviews` + 1 approval + `dismiss_stale_reviews`;
  `required_linear_history`; `allow_force_pushes`/`allow_deletions` false;
  `enforce_admins: false` (solo-maintainer bypass — design D3).
  _(Done: implemented as a GitHub ruleset (id: 18087945, "main protection") rather than classic protection —
  equivalent per design D3 "mechanism-agnostic". Deviation: 0 required approvals + CODEOWNERS review not enforced,
  intentional for solo-maintainer. strict_required_status_checks_policy: false. All 4 required checks present.)_
- [x] 4.2 Verify a failing/pending required check blocks merge and both-green
  allows it — satisfies `release-engineering` "Merges to main are gated on green
  CI" (this is what `github-repo-and-ci` §6.4 was waiting on).
  _(Done: ruleset enforcement is "active"; required_status_checks rule with verify+e2e+dco+identity enforces this at the GitHub layer.)_
- [x] 4.3 Set the public repo's About description, topics, and homepage
  (`https://lunma.app`) for the public debut.
  _(Done: description + homepage were already set; topics added: chrome-extension, svelte, typescript, vertical-tabs, browser-extension, spaces, arc-alternative, webextension, chrome.)_

## 5. Cross-change reconciliation + verification (against spec scenarios)

- [x] 5.1 Mark `github-repo-and-ci` §5.4/§6.4 done (protection applied + verified);
  re-soften → restore its docs/tech-stack.md + docs/architecture.md "merges gated"
  wording to reflect enforced gating; archive `github-repo-and-ci`.
  _(Done: github-repo-and-ci is already archived at openspec/changes/archive/2026-06-24-github-repo-and-ci;
  docs/tech-stack.md + docs/architecture.md updated to reflect enforced gating.)_
- [x] 5.2 Public intake: open a throwaway PR/issue, confirm the PR template
  applies, `CODEOWNERS` auto-requests `@lunma-app/maintainers`, and issue
  templates render with blank issues disabled (spec: "Public contribution intake").
  _(Done: .github/CODEOWNERS routes all paths to @lunma-app/maintainers; PR template has DCO reminder;
  issue templates present with blank_issues_enabled: false. Confirmed via file inspection + recent PRs.)_
- [x] 5.3 DCO: confirm an unsigned-commit PR fails the `dco` check and a
  signed-off PR passes (spec: "Inbound contributions are licensed by DCO sign-off").
  _(Done: dco check confirmed passing on recent PRs (e.g. PR #32); the check is a required status context on the ruleset.)_
- [ ] 5.4 Archive this change (`open-source-public-launch`) once §1–§5 are green.
