## Context

The extension's version reaches Chrome via crxjs, which imports
`apps/extension/public/manifest.json` directly in `vite.config.ts` and feeds it to
`crx({ manifest })`. The version there is **not** derived from any `package.json`
— it is a hand-maintained literal, currently `0.0.0` everywhere (root,
`apps/extension`, `apps/site`, `packages/tokens`, and `public/manifest.json`).
There are no git tags. The repo already uses Conventional Commits (the
`commit`/`caveman-commit` skills produce them).

Two in-flight changes depend on versioning being real:

- `open-source-public-launch` flips the repo public (gated, today only on the
  first Chrome Web Store publish). The maintainer's constraint is that Lunma must
  not go public while it ships an un-versioned `0.0.0` — so versioning enforcement
  becomes a **second pre-flip gate**.
- `extension-release-pipeline` (not yet authored) will build the extension and
  upload it to the store; it needs a trustworthy version + tag to ship and to name
  its uploads.

This change ships no `src/` code and no user-visible surface, so the
visual-quality and component-library policies do not apply (explicit exemption,
matching `open-source-public-launch`).

## Goals / Non-Goals

**Goals:**
- One canonical extension version with `package.json` ↔ `manifest.json` kept in
  agreement and that agreement enforced by the existing gate.
- The next version derived automatically from Conventional-Commit history — no
  hand-editing — with a changelog and a `vX.Y.Z` tag per release.
- Monotonic increase and tag↔version agreement guaranteed structurally.
- A documented bump policy so contributors know what their commit type does.
- The pre-flip gate added to `open-source-public-launch` so the constraint is
  recorded, not implicit.

**Non-Goals:**
- Building or uploading the artifact to the Chrome Web Store (the gating milestone
  + `extension-release-pipeline`).
- Versioning `apps/site` (build-time-only, nothing ships) or `packages/tokens`
  (not published). Only the extension is the shippable artifact.
- A standalone required `version` CI status check (D2) or a Conventional-Commit
  *format* required check (D3).
- Any runtime dependency.

## Decisions

### D1 — release-please for derivation, not changesets or manual bumps

Use **release-please** (run as a pinned GitHub Action on push to `main`) to derive
the next semver from Conventional Commits, maintain a rolling **Release PR** that
bumps the version + regenerates `CHANGELOG.md`, and — on merge — cut the `vX.Y.Z`
tag and GitHub release.

- **Why release-please:** it consumes Conventional Commits directly (which the
  repo already produces), targets a *single shippable artifact* cleanly, needs no
  contributor-authored changeset files, and ships as a pinned Action with no
  runtime dependency. Versioning lives in commit history, which the project
  already treats as the record.
- **changesets — rejected:** built for multi-package npm *publishing*; it expects
  hand-written changeset files per change (friction for outside contributors) and
  its value (independent per-package versions, npm release) is moot here — Lunma
  ships one extension, not npm packages.
- **Hand-edited version + a lint — rejected:** that is the status quo's failure
  mode (forgettable, inconsistent). "Enforcement" the maintainer asked for means
  the version is *produced*, not just *checked*.

### D2 — Parity guarded inside `verify`; monotonicity/tags owned by release-please — no new required check

The only thing that can drift is `package.json` version vs `manifest.json`
version (release-please bumps both via an **extra-files** updater, but a guard
keeps an accidental manual edit from going unnoticed). That guard is a **vitest
test at `apps/extension/src/version-parity.test.ts`** asserting the two versions
are equal and valid semver. Because it runs under the extension's existing
`vitest run`, it is already inside `pnpm verify` (which runs on every PR today and
becomes the **`verify`** *required* status check once `open-source-public-launch`
applies branch protection).

- **Where the test lives + how it reads the files (load-bearing):** vitest only
  discovers `src/**/*.test.ts` (`vite.config.ts`) and tsconfig `include` covers
  only `src/` — so the test MUST sit under `src/`, yet the two files it checks
  (`apps/extension/package.json`, `apps/extension/public/manifest.json`) live
  *outside* `src/`. It therefore reads both at **runtime via `readFileSync`**
  resolved from the package root (`new URL('../package.json', import.meta.url)`,
  `new URL('../public/manifest.json', import.meta.url)`), **not** a static JSON
  import — a static import would pull non-`src` JSON into the tsconfig/`svelte-check`
  graph and risk Biome `noRestrictedImports`. The runtime read sidesteps the import
  graph entirely and needs no tsconfig/vitest `include` change.

Monotonic increase and tag↔version agreement are **not** separately checked —
release-please guarantees them by construction (it computes the next version from
the last tag and tags exactly what it bumped).

- **Deviation surfaced (vs the stated scope's "a new job alongside `verify` +
  `e2e`"):** folding the parity guard into `verify` instead of standing up a
  separate `version` job is deliberate. A standalone job would become a **new
  required status context**, which would force `open-source-public-launch`'s
  branch-protection rule (§4.1, required checks `verify` + `e2e` + `dco`) to grow
  a fourth context — extra cross-change coupling for no added safety, since the
  check is a pure, fast, local-friendly assertion that belongs in the dev gate
  anyway. The monotonic-bump/tag checks the "new job" framing implied are
  redundant with release-please. Net: stronger guarantees, *fewer* moving CI
  parts, and the public-launch required-check set is left **unchanged**.
- **Reversible:** if a standalone required `version` context is later wanted, it
  is additive and would update `open-source-public-launch` §4.1 in that change.

### D3 — Rely on squash-merge + Conventional PR title, not a commit-format gate

release-please's derivation is only as good as the commit messages it reads.
Rather than add a Conventional-Commit *format* required check (another CI context,
more contributor friction), rely on the project's existing convention: PRs are
**squash-merged** with the PR title as the resulting Conventional Commit. The bump
policy doc (D4) states this; release-please reads the squashed commits on `main`.

- **Why:** the squash-merge + conventional-title path is the lightest reliable
  feed for release-please and matches `required_linear_history` (which
  `open-source-public-launch` already enforces). A misclassified commit at worst
  produces a wrong-magnitude bump, correctable in the next release — not a
  release-blocking failure worth a required gate.
- **Considered:** a PR-title lint action (e.g. `amannn/action-semantic-pull-request`)
  — deferred as optional; documented as a possible later hardening, not shipped
  here, to keep the required-check surface and contributor friction minimal.

### D4 — `package.json` is the source of truth; `manifest.json` follows it

`apps/extension/package.json` `version` is canonical, configured as release-please
`release-type: node` (the type that treats `package.json` as the version anchor).
release-please's `extra-files` config rewrites the `version` field in
`apps/extension/public/manifest.json` in the same Release-PR bump, so crxjs keeps
reading a correct (now-derived) value with **no change to `vite.config.ts`**. The
parity test (D2) is the backstop against the two diverging.

- **Why not switch crxjs to read `package.json`:** unnecessary `src`/build churn;
  release-please already supports bumping arbitrary JSON files, so the simplest
  correct thing is to let it keep both in lockstep and assert that in `verify`.
- **Plain `MAJOR.MINOR.PATCH` only — no pre-releases:** the Chrome manifest
  `version` grammar forbids SemVer pre-release/build-metadata suffixes (e.g.
  `-rc.1`), and the parity test asserts a strict `MAJOR.MINOR.PATCH`. So
  release-please is configured **without** `prerelease`; pre-release versions are
  a non-goal (would invalidate the manifest *and* fail the guard).

### D4a — Seed `0.0.0`, bootstrap the first real version to `0.1.0`

`.release-please-manifest.json` seeds `apps/extension` at the current `0.0.0`. No
`v0.0.0` tag exists, so the first Release PR's "previous" has no published
release — its bump is bootstrapped explicitly to **`0.1.0`** (via a `Release-As:
0.1.0` directive on a commit, or the equivalent `release-as` config), so the first
public cut is `0.1.0`, never a literal `0.0.0` release. Thereafter the next
version is derived normally from Conventional Commits, and monotonicity holds
against the now-existing prior release.

- **Why `0.1.0`, not `1.0.0`:** pre-1.0 signals "pre-stable", honest for a first
  store listing; `1.0.0` is reserved for a deliberate stability commitment. A
  content choice, fixed here so the bootstrap is unambiguous for the implementer.

### D5 — This change becomes a second pre-flip gate on `open-source-public-launch`

`open-source-public-launch`'s flip (tasks §3.1, design D2) is amended so it is
gated on **both** the first Chrome Web Store publish **and** `semver-enforcement`
being live (release automation merged, a first real version cut, the parity guard
green on `main`). The public-launch proposal's gate wording is updated to match.

- **Why edit the other change's artifacts:** the gate is a hard ordering
  constraint the maintainer stated; the no-silent-deviations + doc-lockstep rules
  require it be written into the artifacts it constrains, in this same change, not
  left as tribal knowledge. `open-source-public-launch` is in-flight (not
  archived), so amending its artifacts is allowed.

## Risks / Trade-offs

- **[release-please mis-derives a version from a misclassified commit]** →
  Mitigated by D3's squash-merge + conventional-title discipline and the bump-policy
  doc; the Release PR is reviewable before merge, so a wrong bump is caught there,
  and any miss self-corrects in the next release.
- **[`package.json`/`manifest.json` drift via a stray manual edit]** → The D2 parity
  test fails `verify` (and thus the PR) the moment they disagree.
- **[A pinned release-please action goes stale / is yanked]** → Pin to a SHA or
  major and bump deliberately; the action has no runtime blast radius (CI-only,
  least-privilege token).
- **[Coupling to `open-source-public-launch` (D5 edits its artifacts)]** → Both
  changes are in-flight and co-owned; the edit is small and surfaced. If
  public-launch archives first, this change instead lands the gate as a verified
  historical note — but ordering (versioning before public) is the maintainer's
  explicit intent, so public-launch is expected to wait.
- **[First release is `0.0.0`-seeded / no prior release to compare]** → D4a
  bootstraps the first cut to `0.1.0` via `Release-As`; no `v0.0.0` release is
  ever published, and monotonicity is well-defined from `0.1.0` onward.

## Migration Plan

Additive; no `src/` code changes, nothing to roll back in product code.

1. Land the versioning plumbing on a branch: add `release-please.yml`,
   `release-please-config.json`, `.release-please-manifest.json` (seeded at the
   current version), the parity vitest test, `CHANGELOG.md`, and `docs/releasing.md`;
   align the seed `package.json`/`manifest.json` versions. PR → green (`verify` +
   `e2e`) → merge to `main`.
2. release-please opens the first Release PR; merging it cuts the first real
   version + tag + changelog. Versioning is now "live".
3. Amend `open-source-public-launch` (proposal/design/tasks) with the second
   pre-flip gate (D5).
4. `open-source-public-launch` proceeds (its own gating) only after this is live.

**Rollback:** before any release, the workflow can be removed and versions revert
to literals. After releases exist, tags/changelog remain valid history; disabling
the workflow only stops *future* automated bumps.

## Open Questions

- **First-release magnitude** — settled (D4a): bootstrap to `0.1.0`.
- **Optional PR-title lint (D3)** — left as a documented future hardening; does
  not affect this change's spec.
- **None blocking.**
