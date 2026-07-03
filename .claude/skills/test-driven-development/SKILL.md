---
name: test-driven-development
description: Use whenever writing or changing production code — any feature, surface, bugfix, or behaviour change — even if the user never mentions tests. Load BEFORE writing implementation code, especially when executing tasks from an OpenSpec change. Enforces RED-GREEN-REFACTOR with Lunma's actual test gates (Vitest 4, Playwright).
metadata:
  author: lunma
  version: "1.0"
---

# Test-Driven Development

Write the test first. Watch it fail. Write the minimal code to pass. If you didn't watch the test fail, you don't know whether it tests anything.

## The rule

```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

Wrote implementation before the test? Delete it and start from the test. Not "keep as reference", not "adapt while testing" — delete. Code written first biases the tests toward what you built instead of what was required.

**Exceptions (ask the user first):** throwaway prototypes, configuration, and generated code — in this repo that means `apps/extension/src/ui/icon-loaders.generated.ts` (regenerate via `pnpm gen:icons`) and the Paraglide i18n output under `apps/extension/src/shared/paraglide/` (`pnpm gen:i18n`). Never hand-edit generated files anyway; change the source and regenerate.

## The cycle

**RED — write one failing test.**
One behaviour, clear name, real code over mocks. For a bug fix, the test reproduces the bug — never fix a bug without one.

```ts
// Good: names the behaviour, exercises the real reducer, one assertion path
test('moving a tab to another space removes it from the source space', () => {
  const state = withSpaces([spaceA(['t1', 't2']), spaceB([])])
  const next = reduce(state, moveTab('t1', 'spaceB'))
  expect(spaceTabs(next, 'spaceA')).toEqual(['t2'])
  expect(spaceTabs(next, 'spaceB')).toEqual(['t1'])
})

// Bad: vague name, asserts against a mock, proves nothing about the code
test('move', () => {
  const store = { dispatch: vi.fn() }
  store.dispatch(moveTab('t1', 'spaceB'))
  expect(store.dispatch).toHaveBeenCalled()
})
```

**Verify RED — run it and read the failure.**

```bash
pnpm --filter @lunma/extension exec vitest run <file>   # extension
pnpm --filter @lunma/site exec vitest run <file>        # site
```

- Fails for the right reason (behaviour missing), not a compile error or typo.
- Passes immediately? It tests existing behaviour — fix the test.

**GREEN — minimal code to pass.**
No extra options, no speculative parameters, no drive-by refactors. Just enough.

**Verify GREEN — run again, then widen.**

```bash
pnpm --filter @lunma/extension test:run   # full package suite
pnpm verify                               # the whole gate before done
```

Test fails? Fix the code, not the test. Other tests break? Fix now, not later.

**REFACTOR — only while green.** Remove duplication, improve names. No new behaviour.

Repeat per task — an OpenSpec `tasks.md` item is usually one or a few cycles, not one giant test at the end.

## Repo-specific gates the tests must respect

- **Store & reducer**: state transitions are the store's core contract — the change's `tasks.md` typically demands ≥90% branch coverage there. Test the reducer directly against real state, not a mock around `dispatch`.
- **Typed message bus**: a new message type or handler needs a test that exercises the real handler, not a stub. Cross-surface messages are a trust boundary.
- **Zod at boundaries**: storage reads and message receives are validated by Zod schemas (+ migrations) in `shared/`. A new persisted field or message shape needs a schema test — valid input parses, malformed input is rejected/migrated, not silently trusted.
- **New `src/ui/*.svelte` primitive**: ships with its `*.test.harness.svelte` + `*.test.ts` (per `.claude/rules/ui-primitives.md`) AND its `catalog/stories/ui/<Name>.stories.svelte` in the same change. `src/ui/stories-coverage.test.ts` fails `pnpm verify` on a story-less primitive — that guard is part of your RED for a new primitive.
- **`apps/site` surfaces**: user-facing colour must pass the automated WCAG-AA contrast test (`vitest run` in the site package).

## Rationalizations — all of them mean "start over with a test"

| Excuse                         | Reality                                      |
| ------------------------------ | -------------------------------------------- |
| "Too simple to test"           | Simple code breaks. The test costs a minute. |
| "I'll add tests after"         | Tests that pass immediately prove nothing.   |
| "I manually verified it"       | Ad-hoc, unrecorded, not re-runnable.         |
| "Deleting X hours is wasteful" | Sunk cost. Untested code is the debt.        |
| "Hard to test"                 | Then it's hard to use — simplify the design. |
| "Just this once"               | The exception becomes the pattern.           |

## Before marking a task done

Every new behaviour has a test you watched fail, then pass, wrote minimal code in between, and the full relevant suite is green with pristine output. If you can't say all of that, the task isn't done. See the verification-before-completion skill for the evidence bar.
