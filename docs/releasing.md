# Releasing

How Lunma's shippable version is defined, derived, and cut. The extension is the
only shipped artifact, so this is about *its* version — the number a user sees in
the Chrome Web Store listing, the `vX.Y.Z` tag a contributor checks out, and the
key a changelog entry hangs off. The version is **produced from commit history**,
never hand-edited.

## Single source of truth

`apps/extension/package.json` `version` is canonical. `apps/extension/public/manifest.json`
`version` (what crxjs ships to Chrome) MUST equal it and MUST be a strict
`MAJOR.MINOR.PATCH` semver. The two are kept in lockstep by automation (below) and
guarded by a test (`apps/extension/src/version-parity.test.ts`) that runs inside
`pnpm verify` — so an accidental edit to only one file fails the `verify` check
and blocks the PR.

The root, `apps/site`, and `packages/tokens` `package.json` versions stay `0.0.0`
and `private` on purpose: none is a shipped artifact, so none is versioned here.

## Conventional Commits → semver

The next version is derived by [release-please](https://github.com/googleapis/release-please)
from the Conventional-Commit history on `main` since the last release:

| Commit type | Example | Bump |
|---|---|---|
| `fix:` | `fix: stop pinned tabs duplicating on reload` | **patch** (`0.1.0` → `0.1.1`) |
| `feat:` | `feat: add RSS smart-folder connector` | **minor** (`0.1.0` → `0.2.0`) |
| breaking | `feat!: …` or any commit with a `BREAKING CHANGE:` footer | **major** (`0.1.0` → `1.0.0`) |
| `docs:`, `chore:`, `ci:`, `test:`, `refactor:`, `style:`, `build:` | — | **no bump** |

If only non-releasing commits have landed since the last release, no Release PR is
proposed.

### How the commit history stays clean

release-please is only as good as the commits it reads. PRs are **squash-merged**,
and the **PR title becomes the squashed commit** — so write the PR title as a
Conventional Commit. This matches the repo's `required_linear_history` and needs no
extra CI gate: a misclassified commit at worst produces a wrong-magnitude bump,
visible and fixable in the reviewable Release PR before it merges, and
self-correcting in the next release.

## The Release-PR flow

1. On every push to `main`, the `Release` workflow
   (`.github/workflows/release-please.yml`) runs release-please. It opens — and
   keeps updating — a single **Release PR** that bumps the canonical version,
   bumps `public/manifest.json` to match (release-please's `extra-files` updater),
   and regenerates `apps/extension/CHANGELOG.md` from the commits (release-please
   forbids a changelog path above the package, so it lives with the package, not
   at the repo root).
2. Review that PR. The diff shows the proposed version, the changelog entries, and
   both version bumps in lockstep.
3. **Merge the Release PR.** That creates the `vX.Y.Z` git tag and the matching
   GitHub release. (release-please opens the PR with the default `GITHUB_TOKEN`,
   so once `main` branch protection is in force the solo maintainer merges it via
   admin bypass — `enforce_admins: false`, per `open-source-public-launch`.)

The tag always equals the version in `package.json`/`manifest.json` at that commit,
and each release after the first is strictly greater than the previous — both hold
**by construction** (release-please computes the next version from the last tag and
tags exactly what it bumped), not by a separate audit.

## First release: bootstrapped to `0.1.0`

The seed version is `0.0.0` and no `v0.0.0` tag exists, so the first release has no
predecessor to bump from. It is bootstrapped explicitly to **`0.1.0`** — never a
literal `0.0.0` release — by landing the first release-eligible change with a
`Release-As: 0.1.0` footer on its squash commit:

```
feat: <first shipped change>

Release-As: 0.1.0
```

Pre-1.0 honestly signals "pre-stable" for a first store listing; `1.0.0` is
reserved for a deliberate stability commitment. After this, versions derive
normally and monotonicity holds against the now-existing `0.1.0`.

## No pre-release or build-metadata versions

Releases are plain `MAJOR.MINOR.PATCH`. The Chrome manifest `version` grammar
forbids SemVer pre-release/build-metadata suffixes (e.g. `1.2.0-rc.1`), and the
parity guard asserts a strict `MAJOR.MINOR.PATCH` — so a pre-release would both
break the manifest and fail `verify`. release-please is configured without
`prerelease` accordingly.
