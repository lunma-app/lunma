> Status: **authored, not yet implemented.** Execution is gated on the first
> Chrome Web Store publish (design D2). The §2 audit items marked `[x]` were
> performed ad hoc during the preparation session and are re-verified at
> execution (§2.5). Everything else is pending `/opsx:apply`.

## 1. Contribution governance (DCO) — landable pre-flip, while still private

- [ ] 1.1 Add `DCO` at the repo root: the verbatim Developer Certificate of
  Origin 1.1 text (unmodified).
- [ ] 1.2 Add `.github/workflows/dco.yml` — a `dco` job on `pull_request` that
  fails when any commit lacks a `Signed-off-by` trailer matching its author.
  `permissions: { contents: read }`; pin any third-party action to a SHA/major
  (or use a small inline trailer scan). Job name exactly `dco` (it becomes a
  required check in §4.1).
- [ ] 1.3 Replace `CLA.md` with a short DCO pointer (the CLA model + its
  commercial-relicensing option are dropped — design D1).
- [ ] 1.4 `CONTRIBUTING.md`: remove the "hold external contributions until the CLA
  is wired" maintainer note; document the DCO flow (`git commit -s`); link `DCO`.
- [ ] 1.5 `README.md` "License" section: state contributions are accepted under
  Apache-2.0 with a DCO `Signed-off-by` (not a CLA).
- [ ] 1.6 `.github/pull_request_template.md`: add a DCO sign-off reminder/checkbox.
- [ ] 1.7 Land §1 on a branch; PR green on `verify` + `e2e` + `dco`; merge to `main`.

## 2. Pre-flip readiness audit (design D5)

- [x] 2.1 Clean git history — repo recreated with clean history; the old
  pre-rebrand `main` tip is unreachable on the new repo. _(Done ad hoc, prep session.)_
- [x] 2.2 Secret/PII scan of tree + history — no secrets, no personal data,
  uniform `Lunma <dev@lunma.app>` authorship. _(Done ad hoc; re-run at §2.5.)_
- [x] 2.3 `@lunma-app/maintainers` team exists and has push; `.github/CODEOWNERS`
  resolves to it. _(Done ad hoc, prep session.)_
- [x] 2.4 `openspec/changes/archive/**` confirmed intended-public and audited
  clean (no secrets, no clean-room/Arcify-lineage risk, roadmap already public —
  design D4). _(Done ad hoc, prep session.)_
- [ ] 2.5 **Re-run 2.1–2.4 immediately before the flip** — the tree may have
  drifted between authoring and the gated execution. Abort the flip on any finding.

## 3. Public flip (GATED — design D2)

- [ ] 3.1 **(gate)** Confirm the first Chrome Web Store publish is live (milestone
  owned by `extension-release-pipeline`). Do not proceed otherwise.
- [ ] 3.2 `gh repo edit lunma-app/lunma --visibility public --accept-visibility-change-consequences`;
  confirm `gh repo view --json visibility` shows `PUBLIC`.

## 4. Branch protection — closes `github-repo-and-ci` §5.4/§6.4 (design D3)

- [ ] 4.1 Apply classic `main` protection via `gh api PUT …/branches/main/protection`:
  required checks `verify` + `e2e` + `dco` (strict); `required_pull_request_reviews`
  with `require_code_owner_reviews` + 1 approval + `dismiss_stale_reviews`;
  `required_linear_history`; `allow_force_pushes`/`allow_deletions` false;
  `enforce_admins: false` (solo-maintainer bypass — design D3).
- [ ] 4.2 Verify a failing/pending required check blocks merge and both-green
  allows it — satisfies `release-engineering` "Merges to main are gated on green
  CI" (this is what `github-repo-and-ci` §6.4 was waiting on).
- [ ] 4.3 Set the public repo's About description, topics, and homepage
  (`https://lunma.app`) for the public debut.

## 5. Cross-change reconciliation + verification (against spec scenarios)

- [ ] 5.1 Mark `github-repo-and-ci` §5.4/§6.4 done (protection applied + verified);
  re-soften → restore its docs/tech-stack.md + docs/architecture.md "merges gated"
  wording to reflect enforced gating; archive `github-repo-and-ci`.
- [ ] 5.2 Public intake: open a throwaway PR/issue, confirm the PR template
  applies, `CODEOWNERS` auto-requests `@lunma-app/maintainers`, and issue
  templates render with blank issues disabled (spec: "Public contribution intake").
- [ ] 5.3 DCO: confirm an unsigned-commit PR fails the `dco` check and a
  signed-off PR passes (spec: "Inbound contributions are licensed by DCO sign-off").
- [ ] 5.4 Archive this change (`open-source-public-launch`) once §1–§5 are green.
