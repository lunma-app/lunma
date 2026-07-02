## Why

When a link that is already open in a Lunma tab is clicked from outside the
browser — an email client, Slack, a terminal, any OS-level "open with Chrome"
handoff — Chrome opens a brand-new duplicate tab instead of Lunma finding and
focusing the tab that's already there. The user ends up with two tabs open on
the same page and has to notice and manually close the duplicate. This is the
same "don't make me a second tab of something I already have open" promise
`tab-dedup` already makes for the launcher (`openUrl`) and for blank-new-tab
address-bar navigations — this change closes the one remaining gap: tabs that
arrive at `chrome.tabs.onCreated` with their target URL already populated
(no blank-new-tab phase to intercept).

Root cause: `tabs.onCreated` (`apps/extension/src/background/handlers/chrome-tabs.ts`)
tracks every non-home/non-lens tab immediately via `ctx.store.onTabCreated`,
which makes `isTrackedTab` true right away. The dedup lookup
(`findTabInActiveSpace`, `handlers/queries.ts`) is only invoked from the
`tabs.onUpdated` first-navigation path, gated on `!isTrackedTab(...)` — so a
tab that is *born* with a URL (as external-app opens are) is tracked before
that gate is ever reached and never gets deduped.

## What Changes

- Add a dedup check inside the `tabs.onCreated` handler, run before
  `ctx.store.onTabCreated`/`ctx.groups.groupNewTab`, for tabs created with a
  non-empty target URL (`tab.url || tab.pendingUrl`, excluding home/lens
  pages, same as the existing checks in that handler).
- The check reuses the existing `findTabInActiveSpace(state, windowId, url)`
  query unchanged — same scope as every other `tab-dedup` path: current
  window, active Space only, exact URL match, no normalisation.
- On a match, the new tab is closed (`chrome.tabs.remove`) and the existing
  matching tab is focused (`chrome.tabs.update` + `chrome.windows.update`),
  mirroring the existing `tabs.onUpdated` navigation-dedup sequence
  (try/catch; on any failure, fall through to normal `onTabCreated` adoption
  so a tab is never lost). The existing `lunma/tab-dedup-flash` message is
  emitted on the hit path, matching every other dedup path.
- **Behavior-changing decision, flagged explicitly (not a silent deviation)
  — this proposal's scoping mechanism changed mid-implementation, based on
  empirical evidence, not a silent substitution:** an earlier draft of this
  change scoped the new check to `tab.openerTabId === undefined`, on the
  theory that Chrome's `openerTabId` field distinguishes an external-app
  handoff (no live in-page opener) from a deliberate in-page gesture
  (middle-click, `target="_blank"`, `window.open`), which normally sets
  `openerTabId`. **This was empirically tested against a live,
  Playwright-driven Chromium running the real built extension** — a
  `chrome.tabs.onCreated` listener registered in the actual service worker,
  exercising every gesture including a raw CDP `Target.createTarget` call
  with no opener parameter at all (the closest possible simulation of an
  OS-level process handing Chrome a URL with no renderer relationship).
  **Result: `openerTabId` is set to the currently-active tab for every new
  tab landing in an existing window, regardless of gesture** —
  `target="_blank"`, middle-click, ctrl/cmd-click, `window.open` into a tab,
  `window.open` with new-window features, and the no-opener CDP call all
  produced a defined `openerTabId`. It came back `undefined`/`null` only for
  the first tab of a brand-new browser window. Chrome exposes no API signal
  that distinguishes "an external app opened this" from "an in-page gesture
  opened this" once the tab lands in an already-open window — which is
  exactly the case the reported bug lives in (the user already has a
  tab/window open). The `openerTabId` gate is therefore not a viable signal
  for this fix, not merely narrower than hoped.
  - **Resolution, user-confirmed: unscoped dedup.** The new `tabs.onCreated`
    check applies uniformly to any tab created directly with a URL matching
    one already open in the active Space, regardless of the gesture that
    created it — external-app handoff, middle-click, `target="_blank"`,
    `window.open`, "open in new window", etc. There is no known signal to
    scope it more narrowly. **This is a disclosed, intentional behavior
    change:** a deliberate middle-click/`target="_blank"`/`window.open` open
    of a URL already open in the active Space will now also be deduped
    (previously excluded).
  - **The one exception, preserved:** Chrome's native right-click →
    "Duplicate" tab action (the existing `duplicateTab` capability,
    `chrome.tabs.duplicate`) remains excluded from this dedup, unchanged —
    it is the deliberate, explicit way to get two tabs of the same page on
    purpose. Chrome gives no reliable API signal at `tabs.onCreated` time to
    distinguish a `chrome.tabs.duplicate`-created tab from any other
    direct-URL tab creation (`openerTabId` doesn't help here either — it
    reflects the *active* tab, not the duplicated source, and a background
    tab can be duplicated while a different tab is active). A new, explicit,
    SW-session-scoped correlation is introduced for this one case (see
    `design.md` Decision 4): the `duplicateTab` handler records the source
    tab's `(windowId, url)` *before* calling `chrome.tabs.duplicate` (so the
    record exists regardless of event/promise ordering), and the new
    `tabs.onCreated` dedup check consumes that record — if present, for that
    one tab — to skip the dedup check and fall through to normal adoption.
- Update the `tab-dedup` spec: replace the current "explicit new-tab-to-URL
  gestures are excluded" scenario (a blanket exclusion for any direct-URL
  creation) with the new unscoped-but-`duplicateTab`-excluded behavior, and
  add the new onCreated-time dedup requirement and its scenarios.
- No new user-facing setting: the new path is gated by the existing
  `dedupNewTabNavigations` setting (`apps/extension/src/shared/settings.ts`)
  — the same toggle that already gates the `tabs.onUpdated` navigation-dedup
  path. Rationale and the alternative considered (a separate setting) are in
  `design.md`.

## Capabilities

### Modified Capabilities

- `tab-dedup`: adds a fourth dedup entry point (direct-URL tab creation via
  `tabs.onCreated`) alongside the existing `openUrl` and blank-new-tab
  navigation paths; replaces the previous "explicit new-tab-to-URL gestures
  are excluded" scenario with an unscoped dedup that applies to any
  direct-URL tab creation, with `duplicateTab`-created tabs as the one
  preserved exclusion.

## Impact

- `apps/extension/src/background/handlers/chrome-tabs.ts` — `tabs.onCreated`
  handler gains the new dedup branch.
- `apps/extension/src/background/handlers/temp-tabs.ts` — `duplicateTab`
  gains a call recording the pending-duplicate correlation before invoking
  `chrome.tabs.duplicate`.
- `apps/extension/src/background/handlers/pending-duplicate-tabs.ts` — new
  file: an SW-session-scoped `(windowId, url)` correlation set (with a
  bounded TTL, self-cleaning), mirroring the pattern of the existing
  `apps/extension/src/background/page-opened-tabs.ts` (a sibling of
  `handlers/`, not the same directory — the new file lives under
  `background/handlers/` alongside `chrome-tabs.ts` and `temp-tabs.ts`, its
  two call sites). Exports exactly three names, normative per the deviations
  policy: `markPendingDuplicateTab(windowId: WindowId, url: string): void`
  (called by `duplicateTab` before `chrome.tabs.duplicate`),
  `consumePendingDuplicateTab(windowId: WindowId, url: string): boolean`
  (called by the new `tabs.onCreated` dedup branch), and a test-only
  `resetPendingDuplicateTabs(): void` (mirroring `page-opened-tabs.ts`'s own
  test-only reset).
- `apps/extension/src/background/handlers/queries.ts` — no signature change;
  `findTabInActiveSpace` is reused as-is.
- `openspec/specs/tab-dedup/spec.md` — requirement/scenario updates via delta
  spec in this change.
- `docs/` — no `docs/architecture.md` or `docs/tech-stack.md` changes; this is
  a behavior fix within the existing background/coordinator layer. The new
  `pending-duplicate-tabs.ts` file lives in `background/handlers/`, imported
  only by other `background/` files — no new cross-layer dependency, no
  layer-DAG change.
- No new primitives, no UI surface changes (the existing sidebar flash
  behavior is reused unchanged).

## Change history

- This change was originally proposed and named `fix-external-link-tab-dedup`,
  scoped around an `openerTabId`-gated design meant to isolate
  external-app-only opens. Mid-implementation empirical testing (see above)
  showed that scoping mechanism doesn't work, and the user confirmed
  unscoped dedup (with the `duplicateTab` exception) as the resolution. The
  change directory was renamed to `fix-direct-url-tab-dedup` to reflect that
  the fix is no longer external-link-specific — it dedupes any direct-URL
  tab creation.
