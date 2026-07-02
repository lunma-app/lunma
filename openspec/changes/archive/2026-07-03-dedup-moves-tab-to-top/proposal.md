## Why

When `tab-dedup` focuses an already-open tab instead of creating a duplicate,
the reused tab stays wherever it already was in the Temporary list. Users
expect the tab they just "opened" (even though it was really a dedup-focus)
to appear where a brand-new tab would — at the top — matching the mental
model "the thing I just interacted with is at the top of my recent list."
Leaving it in place makes the reused tab hard to find again if it was
buried lower in a long Temporary list. This is directly user-felt: the
whole point of dedup is "don't make me hunt for the tab I already have
open," and leaving it buried undercuts that.

## What Changes

- A new setting, `dedupMovesTabToTop` (Tabs group, toggle, default On),
  controls whether a dedup-focused **temp** tab is also promoted to the top
  of its (window, Space) instance's Temporary list. Default On matches the
  "smart by default" precedent set by `dedupNewTabNavigations`.
- All three existing `tab-dedup` focus paths — the launcher's `openUrl`,
  the onCreated-time direct-URL check, and the address-bar navigation
  check — apply the same promotion when the setting is on and the focused
  tab is a temp tab (a bound/pinned tab has no `tempTabIds` position and is
  left untouched either way).
- New `LunmaStore.promoteTempTab(windowId, spaceId, tabId)`: moves an
  already-present temp tab to the top of its instance's `tempTabIds`,
  no-op if it isn't a temp tab there or is already at the top.
- No new UI surface — the setting renders via the existing generic
  `toggle` settings-declaration renderer (`Options.svelte`), the same
  primitive every other Tabs-group toggle already uses.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `tab-dedup`: each of the three existing focus-instead-of-create
  requirements (`openUrl` dedup, onCreated-time direct-URL dedup,
  navigation dedup) gains a conditional promotion step, gated by the new
  `dedupMovesTabToTop` setting.

## Impact

- Code: `apps/extension/src/shared/settings.ts` (new `dedupMovesTabToTop`
  setting: interface field, declaration, default), `apps/extension/src/options/labels.ts`
  (label/description mapping), `apps/extension/messages/*.json` (all 9
  locales — new `options_label_dedupMovesTabToTop` / `options_desc_dedupMovesTabToTop`
  keys, English source + translated), `apps/extension/src/shared/store.svelte.ts`
  (new `promoteTempTab`), `apps/extension/src/background/coordinator.ts`
  (cached `dedupMovesTabToTop` mirror + `setDedupMovesTabToTop`, mirroring
  the existing `dedupNavigations`/`setDedupNewTabNavigations` plumbing),
  `apps/extension/src/background/handlers/context.ts` (`HandlerContext.dedupMovesTabToTop()`),
  `apps/extension/src/background/index.ts` (seed at boot + push from the
  settings watcher), `apps/extension/src/background/handlers/temp-tabs.ts`
  (`openUrl`), `apps/extension/src/background/handlers/chrome-tabs.ts`
  (onCreated-time + navigation dedup).
- Tests: `apps/extension/src/shared/store.tabs.test.ts` (new `promoteTempTab`
  suite), `apps/extension/src/shared/settings.test.ts` (new setting suite),
  `apps/extension/src/background/auto-archive.test.ts` and
  `apps/extension/src/options/Options.test.ts` (updated fixture/expected
  objects for the new `Settings` field), `apps/extension/src/background/coordinator.handlers.test.ts`
  (new promote/setting-off tests in all three dedup describe blocks).
- `docs/`: no narrative doc changes — `docs/architecture.md` and
  `docs/tech-stack.md` don't enumerate individual settings; the settings
  engine's declarative single-source-of-truth (`settings.ts`) is itself the
  documentation for what settings exist.
- No new dependencies, no data migration (new setting key resolves to its
  declared default `true` when absent from a user's existing stored
  settings object, per the existing per-field `.catch(default)` pattern).
