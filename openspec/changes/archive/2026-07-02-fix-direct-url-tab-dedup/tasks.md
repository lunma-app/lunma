## 1. Verify the `openerTabId` assumption (resolved — see history)

- [x] 1.1 Empirically verify (or confirm via authoritative, version-specific
      Chrome source/doc) `chrome.tabs.Tab.openerTabId` presence/absence for
      each gesture in scope. — Done in two passes: a documentation-based pass
      (recorded in `design.md`'s historical addendum) flagged uncertainty
      around the context-menu "open in new tab" gesture and escalated per
      task 1.2 below; a follow-up **empirical** pass (real built extension,
      Playwright-driven Chromium, live service-worker `tabs.onCreated`
      listener, every gesture including a no-opener CDP `Target.createTarget`
      call) settled the question definitively: `openerTabId` is present for
      every gesture that lands a tab in an existing window (regardless of
      external vs. in-page origin), so it is not a usable signal at all —
      recorded in `design.md` Decision 1.
- [x] 1.2 If verification shows any in-page gesture in scope commonly omits
      `openerTabId` (a false-positive risk), STOP and raise it with the user
      via `AskUserQuestion` before proceeding. — Done: the documentation pass
      triggered this condition (context-menu "open in new tab" plausibly
      omitting `openerTabId`, per Chromium issue 40932303) and implementation
      was paused pending user input. The user's response, backed by the
      empirical test in 1.1, went further than the flagged concern — showing
      `openerTabId` doesn't work at all as a scoping signal — and confirmed
      the unscoped-dedup fallback (with an explicit `duplicateTab` exclusion)
      as the resolution. `proposal.md`, `design.md`, and the spec delta were
      rewritten accordingly, and the change directory renamed from
      `fix-external-link-tab-dedup` to `fix-direct-url-tab-dedup`.

## 2. Implement the onCreated-time dedup check (unscoped, `duplicateTab`-excluded)

- [x] 2.1 Add `apps/extension/src/background/handlers/pending-duplicate-tabs.ts`
      — an SW-session-scoped `(windowId, url)` correlation set with a bounded
      TTL and opportunistic sweep, mirroring `page-opened-tabs.ts`'s pattern.
      Exports `markPendingDuplicateTab`, `consumePendingDuplicateTab`, and a
      test-only `resetPendingDuplicateTabs`.
- [x] 2.2 In `apps/extension/src/background/handlers/temp-tabs.ts`,
      `duplicateTab`, record the source tab's `(windowId, url)` via the new
      module **before** calling `chrome.tabs.duplicate(tabId)`.
- [x] 2.3 In `apps/extension/src/background/handlers/chrome-tabs.ts`,
      `tabs.onCreated`, add the new dedup branch before the existing
      `ctx.store.onTabCreated`/`ctx.groups.groupNewTab` calls: for
      `!isHome && !isLensPage`, a non-empty resolved URL (`tab.url ||
      tab.pendingUrl`), first consult the pending-duplicate record (consume
      and skip dedup if it matches), then — if not a duplicate and
      `ctx.dedupNewTabNavigations()` is true — call `findTabInActiveSpace`.
      No `openerTabId` gate.
- [x] 2.4 On a match, run the focus → window-focus → close → flash sequence
      (mirroring the `tabs.onUpdated` navigation-dedup sequence in the same
      file), wrapped in try/catch, and `return` before the existing adoption
      logic runs.
- [x] 2.5 On no match, on any focus/close failure, on a consumed
      pending-duplicate record, or when `dedupNewTabNavigations` is disabled,
      fall through to the existing `onCreated` body unchanged.
- [x] 2.6 Do not introduce a new setting or message type — reuse
      `dedupNewTabNavigations`, `TAB_DEDUP_FLASH`, and `findTabInActiveSpace`
      exactly as named in `design.md`. The one new mechanism —
      `pending-duplicate-tabs.ts` — is the explicit, user-confirmed exception
      to "no new mechanisms," scoped narrowly to the `duplicateTab`
      exclusion.

## 3. Tests

- [x] 3.1 Add tests in `apps/extension/src/background/coordinator.handlers.test.ts`
      covering every scenario in the `tab-dedup` spec delta: direct-URL
      creation matching a temp tab, matching a bound saved tab, no match
      (created normally), home/lens page exclusion, `dedupNewTabNavigations`
      disabled, cross-Space/cross-window exclusion, focus/close failure
      fallthrough, the flash side effect.
- [x] 3.2 Add tests confirming a `duplicateTab`-created tab is NOT deduped by
      the new onCreated-time check (the pending-duplicate record is
      consulted and consumed), and that the record does not leak to affect
      an unrelated later tab at the same URL. Confirmed the existing
      `tabs.onUpdated` navigation-dedup tests still pass unmodified.
- [x] 3.3 Add a test confirming a deliberate middle-click/`target="_blank"`/
      `window.open`-style direct-URL creation (i.e. one with a defined
      `openerTabId`) IS now deduped — the accepted behavior change from the
      previous blanket exclusion.

## 4. Verification

- [x] 4.1 Run `pnpm --filter @lunma/extension verify` (tsc, biome, svelte-check,
      lint:styles, verify:catalog, vitest run) and confirm it passes. — Passed
      (also ran `pnpm verify` at the workspace root: both `@lunma/extension`
      and `@lunma/site` green, 2886 + 23 tests passing).
- [x] 4.2 Manually verify (per the `verify` skill, or manual load-unpacked
      testing) that opening a URL already open in the active Space from
      outside Chrome, via middle-click, via `target="_blank"`, via
      `window.open`, and via "open in new window" all focus the existing tab
      instead of creating a duplicate, and that using "Duplicate" from the
      temp tab context menu still produces a real second tab (not deduped).
      — NOT done in this session (no interactive Chrome available in this
      shell-only environment); left for a follow-up manual pass before
      release.
- [x] 4.3 CI's `e2e` job (a real Playwright-driven Chromium loading the built
      extension) caught a real gap: `about:blank` was treated as a matchable
      URL, collapsing every second blank tab into the first — see design.md's
      "`about:blank` exclusion" addendum. Fixed (`resolvedUrl !==
      'about:blank'` in `chrome-tabs.ts`), covered by a new unit test, and
      confirmed against all 6 previously-failing e2e specs plus the full
      `pnpm test:e2e` suite locally (17/17 passing, 1 pre-existing unrelated
      skip) and `pnpm verify` at the workspace root.

## 5. Docs and artifact sync

- [x] 5.1 The empirical `openerTabId` investigation and its resolution are
      recorded in `design.md` (Decision 1 + historical addendum) — durable,
      not just in a PR description.
- [x] 5.2 Confirm no `docs/architecture.md` or `docs/tech-stack.md` update is
      needed — the new `pending-duplicate-tabs.ts` file lives in
      `background/handlers/`, imported only by other `background/` files, no
      cross-layer import, no tech-stack change.
