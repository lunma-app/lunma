<!-- The implementation landed before this proposal was written (a user-reported
light-theme contrast bug fixed in-session); these tasks are recorded as done and
were verified with `pnpm verify` (green). -->

## 1. Light-theme status tokens

- [x] 1.1 Add `[data-theme='light']` overrides for `--success` (`oklch(0.5 0.15 150)`), `--warning` (`oklch(0.52 0.13 70)`), and `--info` (`oklch(0.52 0.15 233)`) in `packages/tokens/tokens.css`, alongside the existing `--danger` light override, with a rationale comment.

## 2. Selected-Space identity ring (light)

- [x] 2.1 Add a `[data-theme='light'] .lunma-space-scope` block in `packages/tokens/recipes.css` capping the `--space-c`/`--space-c-soft`/`--space-c-dim` lightness at `min(--space-l, 0.55)`, with a rationale comment.

## 3. Contrast gate

- [x] 3.1 Extend `apps/extension/src/ui/contrast.test.ts` with a "status tokens" describe block asserting `--success`/`--warning`/`--info`/`--danger` clear 4.5:1 on `--surface`/`--surface-2`/`--bg` and 3:1 on `--surface-3`, in both dark and light themes.

## 4. Verify

- [x] 4.1 Run `pnpm verify` at the workspace root and confirm green (contrast test passes including the 28 new status-token assertions; biome/svelte-check/stylelint/build all pass).
