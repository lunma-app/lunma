---
name: verification-before-completion
description: Use before stating that any work is done, fixed, passing, or working — including in passing remarks like "that should fix it" — and before committing, creating a PR, or marking an OpenSpec task done. Requires running the verification commands fresh and reading their output. Evidence before claims, always.
metadata:
  author: lunma
  version: "1.0"
---

# Verification Before Completion

Claiming work is complete without verification is dishonesty, not efficiency. Every "done", "fixed", or "passing" must be backed by a command you just ran and whose output you read.

## The gate

Before any completion claim:

1. **Identify** the narrowest command that would prove the claim.
2. **Run** it fresh — earlier runs don't count if anything changed since.
3. **Read** the full output and exit code, not just the last line.
4. **Confirm** the output actually supports the claim.
5. **Then** state the claim, quoting the decisive line.

No fresh evidence → no claim. Say "implemented but not yet verified" instead — that's a legitimate status; a false "done" is not.

## What proves what (this repo)

| Claim                              | Evidence                                                                                      |
| ---------------------------------- | --------------------------------------------------------------------------------------------- |
| Extension change works             | `pnpm --filter @lunma/extension exec vitest run <file>` (targeted), then `test:run` (full)     |
| Site change works                  | `pnpm --filter @lunma/site exec vitest run <file>`, then the package `verify`                  |
| Whole change is sound              | `pnpm verify` (root → `pnpm -r verify`: tsc, biome+DAG, svelte-check, stylelint, catalog, vitest) |
| Code + layer DAG are clean         | `pnpm --filter @lunma/extension exec biome check src` (also enforces the import DAG)           |
| A new/changed `ui/` primitive is complete | `stories-coverage.test.ts` passes — i.e. its `catalog/stories/ui/<Name>.stories.svelte` exists |
| Design values are tokenized        | `lint:styles` (Stylelint) passes — no raw font-size/z-index/colour                            |
| Site colour meets WCAG-AA          | the site package's contrast `vitest run` passes                                               |
| Critical flow works end-to-end     | `pnpm test:e2e` (Playwright smoke)                                                             |
| Bug is fixed                       | the reproducing test (which you watched fail) now passes                                       |
| OpenSpec task complete             | its verification step ran, plus `pnpm verify` green                                           |
| Ready to commit                    | `pnpm verify` green on the staged state; the `.githooks/pre-commit` gate re-runs it, but the hook is the backstop, not the verification |

Exit code 0 with warnings or noise in the output is not pristine — read what it says.

## Red flags — stop and run the gate

- "Should work", "probably passes", "seems right"
- "Done!" / "Fixed!" before any command ran
- Relying on an earlier run after further edits
- Relying on a subagent's report without independent confirmation
- Verifying one package and claiming the whole change works
- Counting on the pre-commit hook or CI to catch it — discovering failure at commit time means the "done" was false
- Reaching for `SKIP_VERIFY=1` or `--no-verify` to get past a red gate

## Rationalizations

| Excuse                           | Reality                                                                           |
| -------------------------------- | --------------------------------------------------------------------------------- |
| "It's a trivial change"          | Trivial changes break builds constantly. The check costs seconds.                 |
| "I ran it before this last edit" | Then it verified different code.                                                  |
| "The tests are slow"             | Run the targeted subset now, the full gate before done. Skipping isn't an option. |
| "I'm confident"                  | Confidence is not evidence.                                                       |

## Reporting

Report faithfully, per the project rules: if tests fail, say so with the decisive output line; if a step was skipped, say which and why. When it's done and verified, state it plainly — with the evidence — and without hedging.
