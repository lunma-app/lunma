## 1. Setting

- [x] 1.1 Add `dedupMovesTabToTop: boolean` to the `Settings` interface in `apps/extension/src/shared/settings.ts`.
- [x] 1.2 Add its declaration to the `SETTINGS` array (`type: 'toggle'`, `default: true`, group `'Tabs'`, label + description).
- [x] 1.3 Add its default to `DEFAULTS`.
- [x] 1.4 Add `options_label_dedupMovesTabToTop` / `options_desc_dedupMovesTabToTop` to `apps/extension/src/options/labels.ts`'s label/description maps.
- [x] 1.5 Add the English source strings to `apps/extension/messages/en.json` and translated strings to the other 8 locale files (de, es, fr, ja, ko, pt, ru, zh-CN); regenerate the Paraglide runtime (`pnpm gen:i18n`).

## 2. Store

- [x] 2.1 Add `LunmaStore.promoteTempTab(windowId, spaceId, tabId)`: move a temp tab to the top of its instance's `tempTabIds`; no-op if absent or already at the top.

## 3. Coordinator plumbing

- [x] 3.1 Add a cached `dedupPromotesToTop` mirror + `setDedupMovesTabToTop` to `Coordinator`, mirroring the existing `dedupNavigations`/`setDedupNewTabNavigations` pattern.
- [x] 3.2 Add `dedupMovesTabToTop(): boolean` to `HandlerContext` and wire the coordinator's closure into the handlers map.
- [x] 3.3 Seed the mirror at boot and push it from the settings watcher in `apps/extension/src/background/index.ts`.

## 4. Dedup call sites

- [x] 4.1 `openUrl` handler (`temp-tabs.ts`): after focusing a match, promote it when enabled; call `ctx.markDirty()`.
- [x] 4.2 onCreated-time direct-URL dedup (`chrome-tabs.ts`): same, after focus/close.
- [x] 4.3 Navigation dedup (`chrome-tabs.ts`): same, after focus/close.

## 5. Tests

- [x] 5.1 `store.tabs.test.ts`: new `LunmaStore.promoteTempTab` suite (middle→top, already-at-top no-op, not-a-temp-tab no-op, no-instance no-op).
- [x] 5.2 `settings.test.ts`: new `dedupMovesTabToTop` suite mirroring the `dedupNewTabNavigations` one (default, declaration, malformed-value fallback, read, round-trip).
- [x] 5.3 `auto-archive.test.ts` and `Options.test.ts`: update fixture/expected-object literals for the new required `Settings` field.
- [x] 5.4 `coordinator.handlers.test.ts`: add promote + setting-off tests to all three dedup describe blocks (`openUrl`, onCreated-time, navigation), plus a pinned-tab-not-promoted assertion.

## 6. Verification

- [x] 6.1 `tsc --noEmit` passes with no errors.
- [x] 6.2 `pnpm verify` (typecheck, biome, svelte-check, stylelint, catalog gate, i18n parity, full vitest suite) passes clean.
