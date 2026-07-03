---
name: systematic-debugging
description: Use when anything behaves unexpectedly — a bug report, failing or flaky test, CI failure, error message, wrong output, or "why is this happening" — BEFORE proposing or attempting any fix, even one that seems obvious. Root-cause investigation first; no patching symptoms.
metadata:
  author: lunma
  version: "1.0"
---

# Systematic Debugging

Find the root cause before touching code. A fix applied to a symptom masks the real problem and usually creates a second bug.

## The rule

```
NO FIX WITHOUT A ROOT-CAUSE INVESTIGATION FIRST
```

This holds hardest exactly when it's most tempting to skip: under time pressure, when the fix "seems obvious", and after previous attempts failed.

## Phase 1 — Investigate

1. **Read the whole error.** Full message, full stack trace, exact file:line. The answer is often literally in the text.
2. **Reproduce reliably.** Exact steps, consistent trigger. Intermittent → gather more evidence before theorizing.
3. **Check what changed.** `git log`, recent commits, new dependencies, migrations, config.
4. **Locate the failing layer with evidence, not intuition.** Instrument each boundary (surface → message bus → background → store → storage) and run once to see _where_ it breaks, then investigate that layer.
5. **Trace bad values upstream.** Where does the wrong value originate? Fix at the source, not where the symptom surfaces.

### Lunma-specific first checks

These account for a disproportionate share of "mysterious" failures here:

- **Stale extension**: after editing `background/` (the service worker) you must reload the extension in `chrome://extensions` — HMR does not reload the worker. A change that "isn't taking effect" is usually this. Use the `dev-load` skill's persistent-profile launch.
- **Store looks wrong across surfaces**: dispatch is serialized through the store; two Chrome events racing the reducer produce inconsistent `spaces[]`. Check the dispatch path, not the surface.
- **Message never arrives**: the typed message bus targets specific surfaces — confirm the message type is registered and the receiving surface is actually listening, before suspecting the payload.
- **Persisted state parses wrong / disappears**: a Zod schema change without a matching migration in `shared/` drops or rejects stored state on read. `chrome.storage` is async — a value read "too early" reads stale.
- **Svelte 5 reactivity**: a value not updating is usually `$state`/`$derived`/`$effect` misuse — a plain (non-`$state`) variable mutated, or a `$derived` read outside the reactive graph — not a data bug.
- **Biome / DAG failure**: an import that fails `biome check` is a layer-DAG or import-cycle violation, not a missing module — read the rule it names before "fixing" the import.
- **Stale generated code**: `apps/extension/src/ui/icon-loaders.generated.ts` out of sync with its source.

## Phase 2 — Compare

Find analogous code that works. List _every_ difference between working and broken — don't pre-filter for "relevant" ones; the cause is usually in a difference you'd have dismissed.

## Phase 3 — Hypothesize and test

State it precisely: "X causes this because Y." Test with the smallest possible change — one variable at a time, never a bundle. Wrong? New hypothesis, not a second change stacked on the first. If you don't understand something, say so instead of papering over it.

## Phase 4 — Fix

1. Write a failing test reproducing the bug (see the test-driven-development skill).
2. Apply the single fix targeting the root cause. No bundled improvements, no drive-by refactors.
3. Verify: the new test passes, `pnpm verify` stays green.

**After 3 failed fix attempts, stop.** Each fix breaking something else, or requiring ever-wider changes, signals a design problem — not a missing fourth patch. Per the project rules: if the right fix is deeper than the symptom suggests, say so before patching the symptom. Surface it to the user.

## Red flags — return to Phase 1

- "Quick fix now, investigate later"
- "Let me just try changing X"
- Changing several things at once, then running the suite
- Proposing fixes before tracing the data
- "One more attempt" after two failures
- Silently catching the error, special-casing the failing input, or reaching for `--no-verify` / `SKIP_VERIFY=1` — these are workarounds; flag them, don't ship them

Symptom-patching feels faster. It isn't: systematic investigation typically resolves in minutes what guess-and-check burns hours on, and it doesn't leave the real bug behind.
