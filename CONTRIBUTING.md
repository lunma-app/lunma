# Contributing to Lunma

Thanks for your interest in Lunma. A few things to know before you send a change.

## Licensing & the CLA

- Lunma is released under the **Apache License 2.0** (see [`LICENSE`](LICENSE)).
- The **Lunma name and logo** are not covered by that license — see
  [`TRADEMARK.md`](TRADEMARK.md). Fork the code freely; don't ship it as "Lunma."
- Contributions are accepted under a **Contributor License Agreement**
  ([`CLA.md`](CLA.md)). It lets Lunma stay open source **and** keep the option of a
  future commercial edition, without taking your copyright away — you keep it; you
  grant the project a broad, relicensable license to your contribution.

> **Maintainer note (pre-launch):** the CLA and trademark policy are DRAFTs pending
> legal review, and the acceptance mechanism (a CLA-assistant bot vs. DCO sign-off)
> is still to be wired up. Until that is in place and reviewed, hold external
> contributions. See `the release notes`.

## How the project is built

Lunma uses an **OpenSpec** workflow — non-trivial changes start as a proposal under
`openspec/changes/` before code. See [`CLAUDE.md`](CLAUDE.md) and the docs under
[`docs/`](docs/) for the architecture, the one-way import DAG, and the quality gates.

- Run `pnpm verify` at the workspace root before opening a pull request (it fans out
  to every package: type-check, Biome, svelte-check, Stylelint, and tests).
- Keep code, docs, and OpenSpec artifacts in lockstep — neither leads the other.

## Reporting issues

Bugs, ideas, and brand-impersonation reports are all welcome as issues. For security
reports, please contact the maintainer privately rather than opening a public issue.
