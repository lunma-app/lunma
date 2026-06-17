## Why

Lunma is positioned, end to end, as a public open-source project — the marketing
site, the `README`, the Apache-2.0 license, the clean-room story, and the
contributor-intake scaffolding all assume a public repository that anyone can
read, fork, and file issues against. This change performs that flip: it takes
`lunma-app/lunma` from private to **public**, stands up the lightweight
contribution governance that makes outside contribution safe, and turns on the
merge protection that has been deferred since `github-repo-and-ci`. The
user-visible value is the open-source project itself — a real, inspectable,
forkable codebase behind the product — which the whole "local-first, honest,
open" positioning depends on.

This is the last of the four sequenced release-engineering changes named in
`github-repo-and-ci` (`site-continuous-deploy`, `extension-release-pipeline`,
then this). It is **gated**: the flip executes only **after the first Chrome Web
Store publish** (the original launch-checklist ordering — a public source repo
should accompany, not precede, a real listing). Authoring it now captures the
procedure and governance while they are fresh; execution waits for the store
milestone. Until then the repo stays private and `github-repo-and-ci`'s deferred
merge-gating (its tasks §5.4/§6.4) remains open — this change is what closes it.

## What Changes

- **Visibility flip (gated).** `lunma-app/lunma` goes public via
  `gh repo edit --visibility public`, executed only after the first Chrome Web
  Store publish. Reversible-checked: a pre-flip audit (below) must pass first.
- **Merge protection, finally enforced.** With the repo public, classic branch
  protection is free, so `main` protection requiring the `verify` + `e2e` checks,
  a CODEOWNERS review, and linear history is applied — satisfying the
  `release-engineering` requirement "Merges to main are gated on green CI" that
  `github-repo-and-ci` left deferred. That change can then archive.
- **Contribution licensing → DCO (best-effort, no CLA).** The repo adopts the
  **Developer Certificate of Origin**: contributors certify origin with a
  `Signed-off-by` trailer (`git commit -s`); a CI check enforces sign-off on PR
  commits. This **replaces the drafted CLA**. See the explicit tradeoff in
  `design.md` (D1): DCO needs no legal review and no external app, but — unlike
  the CLA — it does **not** grant Lunma relicensing rights, so the CLA's stated
  "option of a future commercial edition" is **dropped**. Contributions are
  inbound-equals-outbound under Apache-2.0.
- **Contributions open.** `CONTRIBUTING.md` loses its "hold external
  contributions until the CLA is wired" maintainer note and documents the DCO
  sign-off flow. `CLA.md` is replaced by a short DCO reference (`DCO` +
  pointer), the `dco.txt` standard text is vendored, and `TRADEMARK.md` stays
  unchanged (trademark policy is independent and needs no lawyer).
- **Pre-flip audit gate.** A documented, repeatable check that the public tree
  and its history carry no secrets, credentials, or personal data, that git
  authorship is uniform, and that the intake scaffolding (PR/issue templates,
  CODEOWNERS → a valid team) renders. *Most of this was already performed and
  passed this session* (clean-history repo recreation, content scan, the
  `@lunma-app/maintainers` team) — those tasks are recorded as done, with the
  flip itself remaining the gated step.
- **Archive stays public.** Per the earlier decision, `openspec/changes/archive/**`
  ships publicly (audit trail / spec-driven-development showcase); this change
  records that as a deliberate, audited choice rather than excluding it.

This change ships **no `src/` code and no user-visible surface** — no `Visual
language` section and no `src/ui/` primitive work apply (explicit exemption per
the visual-quality and component-library policies).

## Capabilities

### New Capabilities
- `open-source-governance`: how Lunma exists as a public open-source project —
  the gated private→public flip and its pre-flip readiness audit, the inbound
  contribution-licensing model (DCO sign-off, enforced in CI), and the public
  contribution intake. Distinct from `release-engineering` (which owns the CI
  *gate* and, later, deploy/release): this capability owns *being open source*
  and *accepting outside work safely*.

### Modified Capabilities
<!-- None as a spec delta. This change makes `release-engineering`'s deferred
"Merges to main are gated on green CI" requirement TRUE (by applying branch
protection once public) but does not change its text — so it is satisfied, not
modified. That requirement only becomes a living spec when `github-repo-and-ci`
archives, which this change unblocks. -->

## Impact

- **External / account state (not files):** repository visibility flipped to
  public; `main` branch-protection rule applied (required checks `verify`+`e2e`,
  CODEOWNERS review, linear history, `enforce_admins: false`). Captured as exact
  `gh` commands in `tasks.md`.
- **New files:**
  - `.github/workflows/dco.yml` — a DCO sign-off check on pull requests (added
    to the `e2e`/`verify` set; a new required context once protection is applied).
  - `DCO` — the verbatim Developer Certificate of Origin 1.1 text.
- **Modified files:**
  - `CONTRIBUTING.md` — drop the "hold contributions" note; document `git commit
    -s` / DCO; point at `DCO`.
  - `CLA.md` — replaced with a short DCO pointer (the CLA model is dropped).
  - `README.md` — the "License" section: contributions under Apache-2.0 + DCO
    (not a CLA).
- **New OpenSpec spec:** `openspec/specs/open-source-governance/spec.md` (on archive).
- **Cross-change effect:** closes `github-repo-and-ci` tasks §5.4 and §6.4 (branch
  protection + its verification) — that change archives once this one executes.
- **Docs:** no files under `docs/` change (this touches governance + repo state,
  not architecture or stack). Stated explicitly per the doc-lockstep rule.
- **Dependencies:** none added to any `package.json`. The DCO check is a CI
  workflow (a pinned action or a small inline script), not a runtime dependency.
- **Out of scope:** the Chrome Web Store publish itself (the gating milestone,
  owned by `extension-release-pipeline`); any change to `TRADEMARK.md`; any
  paid-plan org upgrade (branch protection is free once public).
