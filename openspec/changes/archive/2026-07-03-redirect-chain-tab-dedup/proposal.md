## Why

A user reported that link/tab dedup silently fails for links opened through
Microsoft Edge specifically (any external app — Outlook, VS Code, or other
tools handing a URL to the browser), while Chrome deduplicates the same
kind of link correctly. Root cause: their organization routes external
links through a link-rewriting/interstitial layer (a corporate mail-security
proxy, SmartScreen-style check, or similar redirector) that is applied to
Edge but not their Chrome profile. A tab created at — or later redirected
through — an intermediate URL is tracked into `tempTabIds` immediately at
`tabs.onCreated` (the existing onCreated-time dedup check only compares the
URL the tab is BORN with). Once tracked, the existing navigation-dedup gate
(`tabs.onUpdated`) only re-checks a tab that is still fully **untracked** —
so the later redirect hop to the real, already-open destination is
invisible to dedup, and a duplicate tab is kept. This is directly
user-felt: it's the same "don't make me a second tab of something I
already have open" promise the rest of `tab-dedup` makes, just failing for
one more real-world case (any URL-rewriting layer, not specific to any one
vendor).

## What Changes

- Widen the navigation-dedup eligibility gate in `tabs.onUpdated`: a
  navigation is now dedup-eligible either while its tab is still fully
  untracked (existing behavior — a blank new tab's first commit) OR, new,
  while the tab has not yet reached `status: 'complete'` even once since it
  was created — i.e. anywhere within its initial load chain, not just
  before first adoption. A BOUND (pinned) tab is excluded either way; a
  once-completed tab's later re-navigation (ordinary browsing) is still
  never eligible.
- New SW-session-scoped tracking (`initial-load-tabs.ts`): marks a tab at
  creation, clears it on the tab's first `status: 'complete'` or on
  removal.
- Fixes a related latent gap this change would otherwise have exposed:
  `findTabInActiveSpace` gains an optional `excludeTabId` parameter — once
  a TRACKED tab can be the one navigating (new to this change; the
  previous navigation-dedup caller's tab was always untracked), the lookup
  must exclude the navigating tab's own id, or it would immediately
  self-match its own just-synced URL before ever finding a genuinely
  different already-open tab.
- Adds diagnostic-only `log.debug` logging on the onCreated-time and
  navigation dedup "no match found" paths (previously silent), so a user
  can inspect the SW console and see the exact URL Lunma resolved when
  dedup didn't fire — the fastest way to confirm whether a link-rewriting
  layer is in play for a given miss, without needing this fix at all to
  diagnose it.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `tab-dedup`: the "A blank new tab navigating to an already-open URL is
  deduplicated" requirement is widened to cover any tab within its initial
  load chain, not only fully-untracked tabs.

## Impact

- Code: `apps/extension/src/background/initial-load-tabs.ts` (new),
  `apps/extension/src/background/handlers/chrome-tabs.ts` (mark/clear calls,
  widened eligibility condition, diagnostic logging), `apps/extension/src/background/handlers/queries.ts`
  (`findTabInActiveSpace`'s new `excludeTabId` param).
- Tests: `apps/extension/src/background/initial-load-tabs.test.ts` (new),
  `apps/extension/src/background/handlers/queries.test.ts` (new
  `excludeTabId` cases), `apps/extension/src/background/coordinator.handlers.test.ts`
  (new "redirect-chain tab dedup" describe block + a file-level
  `resetInitialLoadTabs()` beforeEach to keep the module's session-scoped
  state isolated between tests that reuse tab ids).
- `docs/`: no narrative doc changes.
- No new dependencies, no data migration (the new tracking is in-memory,
  SW-session-scoped, not persisted).
