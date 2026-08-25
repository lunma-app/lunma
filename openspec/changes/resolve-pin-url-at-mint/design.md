## Context

See [proposal.md](proposal.md) — Why, including the reproduction data.

Three facts fix the shape of the fix:

1. **Chrome knows the URL when the mirror does not.** The e2e's existing pre-drag
   poll queries `chrome.tabs.query({})` and finds the URL, and the pin *still*
   captures `''`. So at pin time the authoritative value is available — the gap
   is purely the SW's own mirror lagging.
2. **`originalURL` is immutable post-pin.** Nothing rewrites it; `currentURL`
   tracks navigation, `originalURL` is the frozen home. A wrong value at mint is
   permanent.
3. **The dispatch is not at fault.** Instrumenting the sidebar console across a
   25× CI repeat caught zero `TAB_BOUNDARY_DISPATCH_FAILED`, zero bus timeouts,
   and zero transport rejections across 4 reproductions. `log.error` writes to
   `console.error` unconditionally (`shared/logger.ts:41`), so those would have
   been captured had they occurred.

## Goals / Non-Goals

**Goals:**

- A pinned tab's `originalURL` is the tab's real URL whenever Chrome knows it.
- The boundary editor can always seed for a tab pinned from a real page.
- The e2e stops needing retry scaffolding to pass.

**Non-Goals:**

- Healing saved tabs already carrying `originalURL: ''` on disk. That is a
  migration over existing user data, with its own question (heal from
  `currentURL`? from the bound tab? leave alone?). It deserves its own change,
  and shipping it inside a defect fix would hide a data rewrite in a bugfix.
- Making `originalURL` mutable. The frozen-home semantics are load-bearing for
  drift detection (`currentURL !== originalURL`).
- Fixing the fire-and-forget dispatch path. That is a separate, still-unproven
  concern for the reorder report; this investigation actively **ruled it out**
  as the cause here.
- Eliminating the SW mirror's lag in general. Other consumers tolerate it; only
  `pinTab` freezes a value forever.

## Decisions

**D1 — Resolve at mint, not heal after.**
The alternative was to keep the synchronous capture and backfill `originalURL`
when the mirror later reports a URL. Rejected: it makes a field documented as
immutable quietly mutable, it races the user opening the boundary editor in the
interim, and it needs a second mechanism to decide when backfilling is safe.
Resolving once, at the only moment the value is written, needs no new state.

**D1-bis — Both write sites take the resolved URL.**
`currentURL` is written twice on the pin path: once by `registerSavedTab` at mint
and again by `bindSavedTab(id, windowId, tabId, url)` immediately after. Both now
take the resolved value; feeding the stale mirror value to the second would
re-zero `currentURL` right after the mint fixed it, which is exactly what the
first run of the new test caught.

**D2 — Query Chrome only when the mirror is empty.**
Not on every pin. The mirror is right in the overwhelming majority of pins, and
an unconditional `chrome.tabs.get` adds an await to the hot path for no benefit.
The spec states this explicitly so a test can assert the query does *not* happen
on the populated path.

**D3 — `pinTab` becomes `async`.**
It was synchronous. The coordinator already `await`s every handler in a serial
drain (`coordinator.ts:493`), so introducing an await point cannot interleave
another event into this handler — the drain processes one event at a time. No
ordering guarantee changes.

**D4 — A failed or URL-less resolution still pins.**
The alternative was to refuse the pin. Rejected: the user asked for the tab to be
pinned, and refusing would turn a cosmetic degradation (no boundary seed) into a
lost action. An empty `originalURL` for a tab that genuinely has no URL is honest.

**D5 — Delete the e2e scaffolding in the same change.**
Both the chip-retry `toPass` loop and the pre-drag URL poll exist only to mask
this defect. Leaving them would mean the test still passes if the fix regresses —
the scaffolding *is* the regression risk. Removing them makes the e2e a real
guard for this bug. If it flakes after the fix, the fix is wrong and should be
seen to be wrong.

**Docs.** No `docs/` file describes the pin handler's URL capture; it is specified
in `openspec/specs/lunma-bookmark-bindings/spec.md`, which this change updates.
[docs/architecture.md](../../../docs/architecture.md) and
[docs/tech-stack.md](../../../docs/tech-stack.md) are untouched.

## Risks / Trade-offs

- **`chrome.tabs.get` could itself return a stale or empty URL** → Then the
  record mints empty exactly as today (D4), so the change is never worse than the
  status quo. The reproduction shows Chrome does hold the URL at pin time.
- **Removing the e2e retries could expose a *different* residual flake** →
  Accepted, and deliberately: a test that retries until green cannot tell us
  whether the fix worked. The change is verified by a repeat-heavy CI run before
  merge, not by a single green tick.
- **Existing broken records stay broken** → Called out in Non-Goals. Users who
  hit this keep a saved tab whose boundary cannot seed; the workaround is to
  unpin and re-pin. A healing migration is a follow-up worth proposing.
