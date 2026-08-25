## Why

Pin a tab quickly after opening it and its **Lock to its site** silently never
works — the tab's boundary can never seed, permanently, for the life of that
saved tab. `pinTab` freezes `originalURL` from the service worker's live-tab
mirror (`liveTabsById[tabId].url`, `background/handlers/pinned-tabs.ts:240`)
without checking it is populated. That mirror lags Chrome: a temporary row
renders off the tab's **title**, which arrives independently of its URL, so a
user can see and drag a row whose URL the SW has not yet recorded. The pin then
mints `originalURL: ''`, and `originalURL` is immutable after pinning — so
`pageGlob('')` yields nothing, the boundary locks with an empty allow-list, and
no seeded-domain chip ever appears.

This is measured, not theoretical. Repeating the boundary e2e 25× on CI
reproduced it **4 times (16%)**, and instrumenting the sidebar console proved no
bus dispatch error and no ack timeout occurred — the command delivered fine and
captured an empty URL.

The e2e has been worked around **six times** instead
(`de-flake…`, `widen retry budget for heavy-CI runs`, `self-heal chip wait via
toPass retry`, `heal dropped-dispatch flakes`, `gate pin on tab URL`), most
recently with a poll that checks **Chrome's** view of the URL and then trusts the
drag gesture to give the SW "ample time to sync its mirror" — a hope, not a
guarantee, and the residual gap is the 16%.

## What Changes

- `pinTab` SHALL resolve the tab's URL authoritatively when the live-tab mirror
  has none: if `liveTab.url` is empty, query Chrome (`chrome.tabs.get(tabId)`)
  and mint from that. The handler becomes `async` to do so.
- Mint `title` from the same resolved tab when the mirror's title is empty, so
  the record is not half-populated from two different points in time.
- Remove the e2e scaffolding this defect forced: the chip-retry `toPass` loop and
  the pre-drag URL poll in `apps/extension/e2e/boundary.spec.ts`. If the fix is
  right, the test no longer needs either.

No **BREAKING** change: no persisted shape changes, so no schema-version bump. An
existing saved tab already carrying `originalURL: ''` is not healed by this
change — see Non-Goals in `design.md`.

## Capabilities

### Modified Capabilities

- `lunma-bookmark-bindings`: the "Pinning a live tab creates a bound saved tab"
  requirement gains the URL-resolution rule and its failure behaviour.

## Impact

**Code**

- `apps/extension/src/background/handlers/pinned-tabs.ts` — `pinTab` becomes
  `async` and resolves the URL/title before minting. No new exported symbol.
- `apps/extension/e2e/boundary.spec.ts` — delete `selectOnUntilChipSeeds`'s retry
  loop and the pre-drag URL poll; both existed only to mask this defect.

**New public symbols** (the complete list this change introduces)

_None._ The change is confined to one handler's body plus test deletions.

**Tests**

- `apps/extension/src/background/coordinator.handlers.test.ts` — pinning a tab
  whose mirror URL is empty mints the Chrome-resolved URL; pinning when Chrome
  also reports no URL still pins (with an empty `originalURL`) rather than
  dropping the user's action; the existing populated-mirror path is unchanged and
  does not call `chrome.tabs.get`.

**Docs**

- Updates: none. No `docs/` file describes the pin handler's URL capture; it is
  specified in `openspec/specs/lunma-bookmark-bindings/spec.md`, which this
  change updates.
- Left untouched: `docs/architecture.md`, `docs/tech-stack.md`.

**UI primitives**

- None touched. No `src/ui/*.svelte` change, so no catalog story is added or
  updated.
