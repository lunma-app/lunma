## Context

`tab-dedup` today has three dedup entry points, all funnelling through the
same pure query, `findTabInActiveSpace(state, windowId, url)`
(`apps/extension/src/background/handlers/queries.ts:94-108` — exact URL
match, current window, active Space only, temp tabs then bound saved tabs):

1. The launcher's `openUrl` handler (always-on).
2. `tabs.onUpdated`'s first-navigation path (`chrome-tabs.ts:130-173`) — a
   blank new tab's first real-URL commit, gated by `!isTrackedTab(...)` and
   the `dedupNewTabNavigations` setting.
3. `duplicateTab` — explicitly *not* deduped (deliberate clone).

The gap: `tabs.onCreated` (`chrome-tabs.ts:27-64`) marks every non-home/
non-lens tab as tracked immediately via `ctx.store.onTabCreated`, *before*
`tabs.onUpdated` ever runs. A tab created with a target URL already present
(`tab.url` non-empty, or `tab.pendingUrl` while the navigation is in flight)
is tracked at birth, so path 2's `!isTrackedTab(...)` gate is always false
for it — it never gets a dedup check. This is exactly how Chrome creates tabs
for: (a) an OS-level "open this URL in Chrome" handoff from another app
(email client, Slack, terminal `open`/`start`), and (b) in-page gestures —
middle-click, `target="_blank"` link clicks, `window.open(url)`. Chrome's
`tabs.onCreated` payload does not distinguish (a) from (b) with a dedicated
field; the current spec resolves the ambiguity by excluding both.

The reported bug is case (a). This design's job was originally "find a
signal that separates (a) from (b)" — see the resolved investigation below —
but concluded no such signal exists, so the shipped design dedupes both (a)
and (b) uniformly, with one deliberate carve-out (`duplicateTab`).

## Goals / Non-Goals

**Goals:**
- Close the dedup gap for tabs created directly with a target URL: closing
  the new tab and focusing the existing match in the active Space, exactly
  as the other `tab-dedup` paths already behave.
- Reuse `findTabInActiveSpace` unchanged — no new query, no new URL
  normalisation.
- Preserve `duplicateTab` (`chrome.tabs.duplicate`) as the one deliberate
  "get a second tab of this page" mechanism — it must never be caught by
  this dedup.
- Gate the new path behind the existing `dedupNewTabNavigations` setting, so
  users who disabled navigation dedup are not surprised by dedup newly firing
  on direct-URL tab creation.

**Non-Goals:**
- Not attempting cross-window or cross-Space dedup (unchanged scope).
- Not introducing a new user-facing setting distinct from
  `dedupNewTabNavigations` (see Decision 3).
- Not attempting to further distinguish "external app opened this" from "an
  in-page gesture opened this" — empirically confirmed Chrome exposes no
  signal for this once the tab lands in an existing window (see Decision 1).

## Decisions

### Decision 1 (resolved): no `openerTabId` gate — Chrome exposes no signal separating external-app opens from in-page gestures

**History:** an earlier draft of this design scoped the new `tabs.onCreated`
check to `tab.openerTabId === undefined`, reasoning that `openerTabId`
(`chrome.tabs.Tab.openerTabId?: number`, documented as "the ID of the tab
that opened this tab, if any") is normally present for an in-page gesture
with a live opener (`target="_blank"`, middle-click, `window.open(url)`) and
normally absent for a tab with no in-browser opener context (external-app
handoffs). Pre-implementation documentation research (preserved below as a
historical addendum) already surfaced doubt about one gesture
(context-menu "open link in new tab", per Chromium issue
`issues.chromium.org/issues/40932303`) and was escalated per the deviations
policy before any code was written.

**Empirical resolution:** the escalation was answered with a live test, not
more documentation guesswork — the real built extension was loaded into a
Playwright-driven Chromium, a `chrome.tabs.onCreated` listener was registered
in the actual service worker, and every in-scope gesture was triggered for
real, including a raw CDP `Target.createTarget` call with no opener
parameter at all (the closest possible simulation of an OS process handing
Chrome a URL with zero renderer relationship). **Result: `openerTabId` is
set to the currently-active tab for every new tab landing in an existing
window, regardless of gesture** — `target="_blank"`, middle-click,
ctrl/cmd-click, `window.open` into a tab, `window.open` with new-window
features, and the no-opener CDP call all produced a defined `openerTabId`.
It came back `undefined`/`null` only for the very first tab of a brand-new
browser window (via CDP `Target.createTarget({ newWindow: true })`).

This means `openerTabId` is not "narrower than hoped" for this fix — it is a
**non-signal** for the case that matters: a URL landing as a new tab in an
already-open window, which is exactly the reported bug's shape (the user
already has a tab/window open). Chrome gives no API-level way to tell
"external app opened this" from "in-page gesture opened this" once both
land in an existing window.

**Decision: drop the `openerTabId` gate. Dedup is unscoped** — the new
`tabs.onCreated` check runs for any tab created with a non-empty target URL
(excluding home/lens pages), regardless of `openerTabId` or gesture, subject
only to the `dedupNewTabNavigations` setting and the `duplicateTab`
exclusion (Decision 4). The new check: in `tabs.onCreated`, before the
existing `isHome`/`isLensPage` branch calls `ctx.store.onTabCreated` /
`ctx.groups.groupNewTab`, if `!isHome && !isLensPage`, the resolved URL
(`tab.url || tab.pendingUrl`) is non-empty, the tab is not a pending
`duplicateTab` clone (Decision 4), and `ctx.dedupNewTabNavigations()` is
true: call `findTabInActiveSpace(ctx.store.state, tab.windowId, url)`. On a
match, run the same focus-then-close-then-flash sequence as the
`tabs.onUpdated` navigation-dedup path (`chrome.tabs.update` on the match →
`chrome.windows.update` to focus the window → `chrome.tabs.remove` on the new
tab → emit `TAB_DEDUP_FLASH`), wrapped in try/catch; on any failure, or when
no match is found, fall through to the existing `onTabCreated` body
unchanged (tab is tracked/grouped normally). No new helper function name is
introduced beyond the `duplicateTab` correlation (Decision 4) — the dedup
branch itself is inline in `tabs.onCreated` in `chrome-tabs.ts`, calling the
existing `findTabInActiveSpace`.

**Disclosed, intentional behavior change:** a deliberate middle-click /
`target="_blank"` / `window.open` / "open in new window" open of a URL
already open in the active Space is now deduped too (previously excluded
under the old spec's blanket "explicit new-tab-to-URL gestures are
excluded"). User-confirmed as acceptable: Chrome's own "Duplicate" tab
action remains available (and excluded, Decision 4) as the explicit way to
deliberately get a second tab of the same page.

**Alternative considered and rejected:** a new heuristic based on tab
creation timing/`tab.active`. No reliable signal exists (both external opens
and in-page opens can be foreground or background depending on user gesture
/ OS focus-stealing settings) — rejected for the same reason `openerTabId`
was rejected: no structural Chrome signal exists to key off.

### Decision 2: Reuse `findTabInActiveSpace` and the existing flash message unchanged

No new query function, no new message type. The new call site is a fourth
caller of `findTabInActiveSpace` and a fourth emitter of
`TAB_DEDUP_FLASH` (`apps/extension/src/shared/bus.ts`), matching the
`openUrl` and navigation-dedup paths exactly. Keeps the dedup scope
(current window, active Space, exact match) identical across all entry
points by construction — there is only one scope-defining function.

### Decision 3: Gate on the existing `dedupNewTabNavigations` setting; no new setting

The new onCreated-time path is conceptually the same promise as the existing
`tabs.onUpdated` navigation-dedup path: "a tab that turns out to already be
open in this Space gets collapsed instead of duplicated." Reusing
`dedupNewTabNavigations` means a user who has turned off navigation dedup
(because they want duplicate tabs, e.g. for comparing two states of the same
page) also keeps that preference for direct-URL tab creation, and no new
option needs to be added to the Options UI or explained to the user.

**Alternative considered:** a distinct setting (e.g.
`dedupExternalTabOpens`) so a user could keep navigation dedup off while
still deduping direct-URL creation (or vice versa). Rejected as premature —
no user signal yet that these two behaviours need independent control, and
it adds Options UI surface (a new toggle, new copy, new Zod schema field)
for a case not yet requested. If usage feedback later shows they should be
decoupled, that is a follow-up change to `tab-dedup` and
`apps/extension/src/shared/settings.ts`.

### Decision 4: `duplicateTab`-created tabs are excluded via an explicit, SW-session-scoped correlation

Since the new dedup check is unscoped (Decision 1), it would otherwise catch
`chrome.tabs.duplicate`'s own output: a duplicated tab's URL is, by
definition, identical to its source tab's URL, and the source tab is (almost
always) still open in the same window/Space — an exact `findTabInActiveSpace`
match every time. Left unhandled, every "Duplicate" action would immediately
close the new clone and refocus the original, silently defeating the
feature.

**No natural exclusion exists.** Candidates considered and rejected:
- `openerTabId` matching the duplicated source tab: rejected. Decision 1's
  empirical finding shows `openerTabId` reflects the **currently-active
  tab**, not the tab actually being duplicated — and Chrome lets you
  right-click "Duplicate" on any tab in the strip, active or not. Duplicating
  a background tab while a different tab is focused would set the new tab's
  `openerTabId` to the *active* tab, not the duplicated source, making this
  signal unreliable exactly when it's needed.
- Waiting on `chrome.tabs.duplicate(tabId)`'s resolved `Tab` and marking its
  `id` after the fact: rejected. `tabs.onCreated` and the `duplicate()`
  promise resolution are not guaranteed to order one before the other
  (a documented extension-developer gotcha for `tabs.create`/`tabs.duplicate`
  generally) — marking the new tab's id only after `await
  chrome.tabs.duplicate(tabId)` resolves could race against `onCreated`
  already having run and deduped the tab away.

**Chosen mechanism:** a new, small, SW-session-scoped module,
`apps/extension/src/background/handlers/pending-duplicate-tabs.ts` (a
sibling of `page-opened-tabs.ts`'s directory level, not the same
directory — `page-opened-tabs.ts` lives directly under `background/`;
the new file lives under `background/handlers/`, alongside its two call
sites, `chrome-tabs.ts` and `temp-tabs.ts`), mirroring `page-opened-tabs.ts`'s
pattern (an in-memory, non-persisted correlation set, cleared
per-consumption). It exports exactly three names, normative per the
deviations policy:
- `markPendingDuplicateTab(windowId: WindowId, url: string): void` — called
  by `duplicateTab` (`handlers/temp-tabs.ts`).
- `consumePendingDuplicateTab(windowId: WindowId, url: string): boolean` —
  called by the new `tabs.onCreated` dedup branch (`handlers/chrome-tabs.ts`).
- `resetPendingDuplicateTabs(): void` — test-only, mirrors
  `page-opened-tabs.ts`'s own test-only reset.

`duplicateTab` records `(windowId, url)` for the tab about to be
duplicated **synchronously, before** calling `chrome.tabs.duplicate(tabId)` —
so the record exists in memory before the async call is even issued,
regardless of whether `tabs.onCreated` ends up firing before or after the
`duplicate()` promise settles. The new `tabs.onCreated` dedup branch checks
this record first: if the newly created tab's `(windowId, resolvedUrl)`
matches a pending record, it is consumed (removed) and the dedup check is
skipped entirely for that tab — it falls through to the existing
`onCreated` adoption logic unchanged, exactly as `duplicateTab`-created tabs
behave today.

Records are given a short TTL (bounded, e.g. a few seconds) and are swept
opportunistically, so a `duplicate()` call that fails before creating a tab
(or any other reason the record is never consumed) cannot leak a stale
record that suppresses dedup for an unrelated, later tab at the same URL —
self-cleaning, no manual "clear on failure" step needed (which would
reintroduce the exact ordering race being avoided). Keyed by exact
`(windowId, url)`, matching the scope-precision of every other `tab-dedup`
entry point; a same-window, same-URL, same-few-seconds duplicate created by
pure coincidence with an unrelated dedup-eligible creation is an accepted,
vanishingly rare, benign edge (worst case: one of the two skips a dedup
opportunity once — no tab is ever lost either way).

## Risks / Trade-offs

- **[Accepted, disclosed behavior change] Deliberate "open a second tab of
  this page" via middle-click / `target="_blank"` / `window.open` / "open in
  new window" is no longer excluded.** Previously the spec's blanket
  "explicit new-tab-to-URL gestures are excluded" protected all of these.
  Empirically, no Chrome signal separates them from the external-app-handoff
  case this change targets, so they are now all deduped uniformly.
  User-confirmed acceptable: `duplicateTab` (Decision 4) remains the explicit
  "give me a second tab of the same page" mechanism.
- **[Trade-off] The `duplicateTab` exclusion is a new, bespoke mechanism**
  (Decision 4), not a reuse of an existing pattern verbatim — though it
  mirrors `page-opened-tabs.ts` closely. It adds one new file and one new
  call site in `duplicateTab`. Judged justified: without it, `duplicateTab`
  would be completely broken by this change (100% of duplicates would
  immediately self-close).
- **[Risk, bounded] The pending-duplicate record could theoretically
  mis-consume** if an unrelated tab at the exact same `(windowId, url)` is
  created within the TTL window while a duplicate is in flight. Accepted:
  bounded blast radius (a missed dedup, not a lost or wrongly-closed tab),
  and requires an implausible coincidence (same window, same exact URL,
  same few-second window, two independent tab-creation events).
- **[Risk, mirror-image of the above, more severe if it occurs] The TTL
  could expire before `chrome.tabs.duplicate`'s own `tabs.onCreated` fires**
  (e.g. a service-worker under heavy load, or Chrome itself being slow to
  spin up the clone) — in that case, unlike the false-positive-consumption
  risk above, the clone's own dedup exclusion is lost, and Decision 4's
  entire purpose (protecting `duplicateTab`) fails for that one call: the
  clone gets caught by the unscoped dedup and self-closes, refocusing its
  source. This is a real functional regression of "Duplicate," not merely a
  missed dedup opportunity — the "no tab is ever lost either way" framing of
  the risk above does NOT hold here. Judged acceptable at a 5-second TTL:
  `tabs.onCreated` fires synchronously as part of Chrome creating the tab
  (not gated on any of the async work the SW does afterward), so the gap
  between `markPendingDuplicateTab` and the corresponding `onCreated` event
  is bounded by Chrome's own tab-creation latency, not by extension-side
  processing — 5 seconds is a wide margin over that. If this is observed in
  practice (e.g. via a bug report), the fix is to raise the TTL, not to
  redesign the mechanism.
- **[Trade-off, unchanged from the original design] Dedup now fires one
  event earlier than the `tabs.onUpdated` path, before the tab has a chance
  to render.** For a match, the new tab is removed before
  `ctx.store.onTabCreated`/`ctx.groups.groupNewTab` ever run on it — cleaner
  than the `tabs.onUpdated` path (which briefly adopts the tab before the
  first-navigation dedup check can undo it), so this path is expected to be
  *less* visually disruptive (no flash-then-close), not more.

## Open Questions

- None outstanding. The prior open questions (additional untested gestures
  such as bookmarks-bar clicks or drag-and-drop; where to record the
  `openerTabId` matrix) are moot now that the dedup is unscoped — there is no
  gesture-classification signal left to refine.

## Addendum: pre-implementation `openerTabId` investigation (historical record)

This section is preserved as the historical record of the investigation
that led to Decision 1's resolution — kept for anyone revisiting why
`openerTabId` was rejected as a scoping signal.

No live Chrome instance was available in the environment doing the initial
documentation-based pass, so that first pass relied on Chrome's official
docs and secondary references:

- Official doc (`developer.chrome.com/docs/extensions/reference/api/tabs`)
  defines `openerTabId` only as "the ID of the tab that opened this tab, if
  any... only present if the opener tab still exists" — no gesture-by-gesture
  behaviour documented.
- External OS "open in Chrome" handoff: assumed **absent** (no opener tab
  exists) — later shown to be **wrong**: it is present, set to the active tab.
- Middle-click, `target="_blank"`, `window.open(url)` (tab mode): assumed
  **present** — this part held up under empirical testing.
- `window.open` new-window features, "open link in new window": assumed
  **absent** — this part also held up.
- "Open link in new tab" (context menu): flagged as **uncertain, plausibly
  absent**, citing Chromium issue `issues.chromium.org/issues/40932303`
  ("chrome.tabs.onCreated object has no openerTabId if right-click → open
  link in new tab") and a secondary report of a storage-based workaround —
  the issue body itself was not retrievable (login-walled, no mirror found).

That uncertainty was escalated to the user per the deviations policy before
any code was written (task 1.2). **The escalation's answer was a live
empirical test** (a real built extension in a Playwright-driven Chromium,
service-worker `tabs.onCreated` listener, every gesture including a raw
CDP no-opener `Target.createTarget` call) that superseded the documentation
guesswork entirely: it showed the doc-based pass's assumption about the
*external-handoff* case itself was wrong (present, not absent), which is a
more fundamental problem than the one flagged case (context-menu "open in
new tab") — see Decision 1 for the resolution (drop the gate; unscoped
dedup with the `duplicateTab` exclusion).
