## 1. Implementation

- [x] 1.1 In `apps/extension/src/shared/chrome/storage.ts`, import `disambiguateSpaceName` alongside the existing `normalizeSpaceName` from `../space-names`.
- [x] 1.2 In `dedupePersistedState`, after the id-dedup builds the de-duplicated `spaces` list, run a normalized-name pass: iterate in order, seed a `taken` set with each kept Space's normalized name, and for any later Space whose `normalizeSpaceName` is already in `taken`, set its name to `disambiguateSpaceName(space.name, taken)` and add the result's normalized form to `taken`. Set `changed = true` when any name was rewritten; build a new `spaces` array only if a rename occurred (preserve the same-reference-when-unchanged contract).
- [x] 1.3 Ensure the renamed Space is a new object (`{ ...space, name }`) so the input state is never mutated (the function is pure), matching the existing dedupe branches.

## 2. Tests

- [x] 2.1 In `apps/extension/src/shared/chrome/storage.test.ts`, add a `dedupePersistedState` unit test: a state with two distinct-id Spaces both named "Default" plus a third "Default 2" → first keeps "Default", second becomes "Default 3", third stays "Default 2"; `changed === true`; all `pinnedBySpace` entries preserved.
- [x] 2.2 Add an idempotence test: feeding the healed output back through `dedupePersistedState` renames nothing and returns `changed === false`.
- [x] 2.3 Add a no-collision test: a state with already-unique Space names returns the same `spaces` reference and `changed === false`.
- [x] 2.4 Add a combined test that an id-duplicate AND a name-duplicate in the same state are both healed in one pass (the name pass runs on the id-deduped list, not the raw input).

## 3. Verify

- [x] 3.1 Run `pnpm --filter @lunma/extension verify` (tsc, biome, svelte-check, lint:styles, vitest) and confirm green, including the new tests.
- [x] 3.2 Run `openspec validate dedupe-space-names-on-load --strict` and confirm the change validates.
