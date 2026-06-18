# Contributing to Lunma

Thanks for your interest in Lunma. A few things to know before you send a change.

## Licensing & sign-off (DCO)

- Lunma is released under the **Apache License 2.0** (see [`LICENSE`](LICENSE)).
  Contributions are accepted on the same terms — inbound equals outbound; the
  project takes no copyright assignment and no relicensing rights (there is **no**
  Contributor License Agreement).
- The **Lunma name and logo** are not covered by that license — see
  [`TRADEMARK.md`](TRADEMARK.md). Fork the code freely; don't ship it as "Lunma."
- We use the **Developer Certificate of Origin** ([`DCO`](DCO)): by signing off a
  commit you certify you wrote the change (or have the right to submit it) under
  the project's license. Add the trailer with the `-s` flag:

  ```sh
  git commit -s -m "feat: ..."
  ```

  This appends a `Signed-off-by: Your Name <your@email>` line whose name and
  email must match the commit author. To sign off commits you already made, run
  `git rebase --signoff <base>`. A required `dco` CI check fails any pull request
  whose commits are missing or mismatch their sign-off.

## How the project is built

Lunma uses an **OpenSpec** workflow — non-trivial changes start as a proposal under
`openspec/changes/` before code. See [`CLAUDE.md`](CLAUDE.md) and the docs under
[`docs/`](docs/) for the architecture, the one-way import DAG, and the quality gates.

- The OpenSpec workflow (and the repo's Claude Code skills under `.claude/skills/`)
  drive the `openspec` CLI. Install it globally before working a change:
  `npm i -g @fission-ai/openspec`.

- Run `pnpm verify` at the workspace root before opening a pull request (it fans out
  to every package: type-check, Biome, svelte-check, Stylelint, and tests).
- Keep code, docs, and OpenSpec artifacts in lockstep — neither leads the other.
- **Dependency cooldown.** `pnpm-workspace.yaml` sets a `minimumReleaseAge`, so a
  package version published too recently is rejected by `pnpm install
  --frozen-lockfile` (and therefore by CI). Don't hand-bump a dependency to a
  brand-new (e.g. same-day) release — let it age past the cooldown first.
  Dependency updates normally arrive via Dependabot (weekly; routine minor/patch
  bumps batched into one PR, majors solo), which carries a matching 7-day
  `cooldown` so it never proposes a version that would fail the frozen install.

## Reporting issues

Bugs, ideas, and brand-impersonation reports are all welcome as issues. For security
reports, please contact the maintainer privately rather than opening a public issue.
