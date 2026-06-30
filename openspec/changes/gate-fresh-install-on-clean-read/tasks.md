# Tasks

## 1. Gate fresh-install conversion

- [x] 1.1 `apps/extension/src/background/index.ts`: derive `freshInstall =
  store.state.spaces.length === 0 && outcome === 'clean'` (was `&&
  !bootUnavailable`), with a comment explaining why recovery/salvage are excluded.

## 2. Regression tests

- [x] 2.1 `index.test.ts`: a `corrupt` (recovered) read asserts
  `reconcileTabGroupsOnBoot` is called with `freshInstall === false`.
- [x] 2.2 `index.test.ts`: a `clean` empty read asserts `freshInstall === true`
  (genuine first install still converts).

## 3. Spec + gates

- [x] 3.1 `specs/spaces-and-tabs/spec.md`: MODIFY the "Fresh-install conversion of
  Chrome groups into Spaces" requirement — redefine `freshInstall` as outcome
  `'clean'`; add a "Conversion does not run after a corruption recovery" scenario.
- [x] 3.2 `pnpm verify` green at the workspace root.
