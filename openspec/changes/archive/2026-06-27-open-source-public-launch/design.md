## Context

`github-repo-and-ci` established a **private** `lunma-app/lunma` with CI
(`verify` + `e2e`) on every PR, but deliberately deferred two things to a
dedicated open-sourcing change: applying `main` branch protection (blocked
because classic protection is not free on a Free-plan *private* repo) and the
public flip itself. That change's design names this one — `open-source-public-launch`
— as the owner of "CLA/DCO enforcement, history squash, archive exclusion, public
flip."

Several of those mechanics were already performed **ad hoc during the
preparation session** and are recorded here so this change reflects reality, not
a fresh start:
- The repo was **recreated with clean history** (the "squash" equivalent): the
  pre-rebrand/codename commits no longer exist server-side — verified that the
  old `main` tip is unreachable on the new repo.
- A **content + history audit** ran (no secrets, uniform authorship, OSS
  scaffolding present) and **passed**. _(History was later rewritten to the
  canonical maintainer identity `Emanuel Fonseca
  <12010090+emdfonseca@users.noreply.github.com>` — the GitHub noreply that keeps
  personal emails out of the tree; the §2.5 re-audit checks for that identity.)_
- The **`@lunma-app/maintainers`** team was created and granted push, so
  `CODEOWNERS` resolves.
- The repo was briefly flipped public, then **reverted to private** so the launch
  could be done properly here. So the flip is known to work mechanically; what
  remains is doing it *through* this change, *after the gating milestone*.

The original launch checklist orders the public flip **after the first Chrome Web
Store publish**. That ordering is kept (D2): authoring now, executing later.

This change ships no `src/` code and no user-visible surface, so the
visual-quality and component-library policies do not apply (explicit exemption).

## Goals / Non-Goals

**Goals:**
- A repeatable, audited private→public flip, gated on the first store publish.
- `main` protection enforced once public — closing `github-repo-and-ci` §5.4/§6.4.
- A lawyer-free, best-effort inbound contribution-licensing model that lets
  outside contributions open safely.
- Public contribution intake live (issues/PRs/CODEOWNERS routing).

**Non-Goals:**
- The Chrome Web Store publish (the gating milestone; `extension-release-pipeline`).
- Any paid org-plan upgrade (unneeded — protection is free once public).
- A lawyer-reviewed CLA or any commercial-relicensing grant (explicitly dropped, D1).
- Trademark-policy changes (`TRADEMARK.md` stands).
- Re-squashing history (already clean from the recreation).

## Decisions

### D1 — Developer Certificate of Origin, not a CLA

Adopt **DCO** (contributors add `Signed-off-by` via `git commit -s`; a CI check
enforces it) and **drop the drafted CLA**.

- **Why:** The project has no budget for legal review, and an unreviewed CLA —
  especially one granting broad *relicensing* rights — is both risky to rely on
  and a contributor deterrent. DCO is the established no-lawyer open-source
  convention (Linux kernel, CNCF): a standard, unmodified text, no external app,
  no rights assignment, inbound-equals-outbound under Apache-2.0.
- **The tradeoff (accepted, surfaced):** the drafted `CLA.md` preserved "the
  option of a future commercial edition" — i.e. relicensing contributors' work.
  DCO grants **no** such right, so that option is **forgone**: a future
  relicense would require every contributor's permission. The maintainer
  accepted this ("it's open source… best effort… accept flaws"). Recorded so the
  strategic shift is not silent; reversible only by re-introducing a (reviewed)
  CLA in a later change before accepting contributions under it.
- **CLA-assistant bot — rejected:** needs finalized, reviewed CLA text and adds
  an external GitHub App with broad permissions; contradicts the no-lawyer,
  minimal-surface reality.

### D2 — Gate the flip on the first Chrome Web Store publish *and* on versioning being live

Author now; execute the `gh repo edit --visibility public` step only after **both**
pre-flip conditions hold:

1. the first Chrome Web Store listing is live, **and**
2. `semver-enforcement` is live — release automation merged to `main`, a first
   real version cut (`v0.1.0`), and the version parity guard green on `main`.

- **Why (store publish):** Keeps the documented launch ordering — a public source
  repo should accompany a real product listing, not precede it by an indefinite
  pre-release window. It also means the public debut coincides with something users
  can install. The store publish is owned by `extension-release-pipeline`; this
  change's execution waits on that milestone.
- **Why (versioning):** A repo that ships `0.0.0` forever is not a credible
  open-source project; the maintainer's constraint is that Lunma must not go public
  while it is un-versioned. The `semver-enforcement` change adds honest, automatic,
  monotonic versioning; this flip is gated on it being live. The gate is recorded
  in that change (its tasks §5) and here so the ordering is explicit, not tribal.
- **Consequence:** `github-repo-and-ci` stays unarchived (its §5.4/§6.4 open)
  until this executes. Accepted — that change is already parked on this exact gate.

### D3 — Classic branch protection (free once public), admin-bypassable

On flip, apply classic `main` protection via `gh api`: required checks
`verify` + `e2e` (+ the DCO check, D6), `required_pull_request_reviews` with
CODEOWNERS review, `required_linear_history`, no force-push/deletion, and
**`enforce_admins: false`**.

- **Why classic, not a ruleset:** classic branch protection is free for *public*
  repos, and `github-repo-and-ci` D5 already declared the spec mechanism-agnostic
  ("if classic protection is free by then, it is an equivalent substitute"). Once
  public, classic is the simplest sufficient mechanism.
- **Why `enforce_admins: false`:** with a solo maintainer, requiring a CODEOWNERS
  review would deadlock the maintainer's own PRs (you cannot approve your own).
  Admin-bypass lets the maintainer merge own work while the gate still binds
  outside contributors; CI gating applies to everyone regardless. Revisit when a
  second maintainer exists.

### D4 — Ship `openspec/changes/archive/**` publicly

Keep the archived OpenSpec changes in the public tree.

- **Why:** The audit trail showcases the spec-driven-development process the
  project markets, and the content was audited clean (no secrets, no
  clean-room/Arcify-lineage risk, only an already-public roadmap). Its
  redundancy with git history is acceptable; deletion would buy nothing (history
  retains it anyway) and lose browsability.
- **Exclude it — rejected:** discards a selling point for no real privacy gain.

### D5 — Reversible-checked flip: a pre-flip audit gate

The flip step is preceded by a documented audit that MUST pass: no
secrets/credentials/personal data in tree or history, uniform git authorship,
intake scaffolding present, CODEOWNERS → a valid team. The session's audit
already satisfies this; the task re-runs it immediately before the flip (state
can drift between authoring and the gated execution).

- **Why:** Going public is hard to reverse cleanly (forks, caches, indexing).
  A re-run-at-execution gate ensures the audit reflects the tree as it will ship,
  not as it looked months earlier.

### D6 — DCO enforced by a CI check, pinned and least-privilege

Enforce sign-off with a small `dco.yml` workflow (a pinned third-party DCO action
or an inline commit-trailer scan), `permissions: { contents: read }`, named so it
becomes a third required status context alongside `verify`/`e2e` once protection
applies.

- **Why a check, not honor-system:** required-status enforcement is the whole
  point of DCO — an unenforced sign-off note is decoration. Keeping it a workflow
  (not an app) matches the no-external-app posture of D1.

## Risks / Trade-offs

- **[Dropping the commercial-edition option (D1)]** → Accepted by the maintainer.
  The only clean reversal is a future reviewed CLA *before* accepting
  contributions under it; contributions taken under DCO cannot be retroactively
  relicensed without each contributor's consent.
- **[No legal review of the licensing posture]** → Explicitly accepted
  ("best effort"). Apache-2.0 + unmodified DCO is the lowest-risk lawyer-free
  baseline; the project carries the residual risk knowingly.
- **[Public exposure of roadmap + archive]** → Audited and accepted (D4); nothing
  competitively sensitive or secret.
- **[Solo-maintainer review requirement]** → Mitigated by `enforce_admins: false`
  (D3); CI gating still binds all.
- **[Flip is hard to undo]** → Mitigated by D5's pre-flip audit and the fact that
  the dry-run flip already succeeded and was cleanly reverted this session.
- **[Required-check coupling]** → If the DCO job is renamed, the protection's
  required contexts must update in the same change (as with `verify`/`e2e`).

## Migration Plan

Additive; nothing in `src/` changes, so there is nothing to roll back in product
code. Execution order (gated on the store publish):

1. Land the governance files on a branch: add `DCO` + `.github/workflows/dco.yml`,
   delete `CLA.md`, edit `CONTRIBUTING.md` + `README.md`. PR → green (`verify`,
   `e2e`, `dco`) → merge to `main`.
2. Re-run the pre-flip audit (D5); abort on any finding.
3. After the first Chrome Web Store publish (D2): `gh repo edit lunma-app/lunma
   --visibility public --accept-visibility-change-consequences`.
4. Apply branch protection via `gh api` (D3); confirm a failing/pending check
   blocks merge and both-green allows it — closing `github-repo-and-ci` §5.4/§6.4.
5. Archive `github-repo-and-ci`, then this change.

**Rollback:** before the flip, everything is ordinary commits. After the flip,
re-private via `gh repo edit --visibility private` (protection auto-disables on
Free private) — the dry run this session confirms this path works.

## Open Questions

- **DCO action choice (D6):** a specific pinned third-party action vs. a small
  inline script — settled at implementation; does not affect the spec (which
  requires sign-off to be enforced, not how).
- **None blocking.** Execution timing is externally gated (the store publish),
  not an open design question.
