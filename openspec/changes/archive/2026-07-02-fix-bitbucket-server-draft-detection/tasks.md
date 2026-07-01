## 1. Bitbucket Server/DC fix

- [x] 1.1 Add `draft: z.boolean().optional()` to `ServerPrSchema` in `apps/extension/src/background/connectors/bitbucket.ts`.
- [x] 1.2 In `serverChange()`, set `draft: pr.draft === true` instead of the hardcoded `false`.
- [x] 1.3 In `serverItem()`, prefix the `LensItem` title with `Draft: ` when `pr.draft === true` (same ternary `fetchCloud`'s Cloud path already uses).
- [x] 1.4 Add fixtures/assertions to `apps/extension/src/background/connectors/bitbucket.test.ts` covering a Server/DC PR with `draft: true`: assert `change.draft === true` and the title is prefixed `Draft: `.

## 2. Cross-source draft audit

- [x] 2.1 GitHub: confirm `github.test.ts:460` ("a draft PR detail prefixes the title with Draft: ") actually runs and passes as part of `pnpm --filter @lunma/extension vitest run` — no code or test changes expected.
- [x] 2.2 GitLab: add a `draft: true` (and/or `work_in_progress: true`) case to the review-lens change-enrichment test in `apps/extension/src/background/connectors/gitlab.test.ts`, asserting `change.draft === true` — closing the fixture-only-`false` gap. No source change to `gitlab.ts` expected (existing `mr.draft ?? mr.work_in_progress ?? false` logic is already correct).
- [x] 2.3 Bitbucket Cloud: confirm `bitbucket.test.ts:249` ("draft PRs carry the draft flag and a 'Draft:' title prefix") actually runs and passes — no code or test changes expected.
- [x] 2.4 If task 2.1–2.3 surfaces an actual behavioral gap beyond the expected "add a GitLab test" outcome, stop and raise it with the user via AskUserQuestion before changing any code outside the scope already agreed here.

## 3. Docs and spec lockstep

- [x] 3.1 Verify `openspec/specs/lenses/spec.md`'s "The Bitbucket connector fetches canned queries over the Server and Cloud APIs" requirement now matches implemented behavior (this change's spec delta will be applied on archive).
- [x] 3.2 Confirm no other `openspec/specs/**` file (e.g. `connector-accounts`) asserts the old "Server has no draft" behavior (already checked during proposal — none found).

## 4. Verification

- [x] 4.1 Run `pnpm --filter @lunma/extension verify` (tsc, biome, svelte-check, stylelint, vitest — includes the new/updated bitbucket.test.ts and gitlab.test.ts cases).
- [x] 4.2 Run `pnpm verify` at the workspace root before proposing a commit.
