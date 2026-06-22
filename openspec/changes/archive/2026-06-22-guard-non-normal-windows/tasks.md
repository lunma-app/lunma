## 1. Window-type predicate (single source of truth)

- [x] 1.1 Add `apps/extension/src/background/window-types.ts` exporting `MANAGED_WINDOW_TYPES = ['normal'] as const` and `isManagedWindow(window: chrome.windows.Window): boolean` (`window.type === 'normal'`). Imports nothing else in the app (pure chrome-type predicate, background layer).
- [x] 1.2 Add `window-types.test.ts`: `isManagedWindow` true for `'normal'`, false for `'popup' | 'panel' | 'app' | 'devtools'` and `undefined`.

## 2. Boot seed guard

- [x] 2.1 In `seed-existing-windows.ts`, change `chrome.windows.getAll()` → `chrome.windows.getAll({ windowTypes: MANAGED_WINDOW_TYPES })`.
- [x] 2.2 In `seed-existing-windows.test.ts`, assert the `getAll` call passes `{ windowTypes: ['normal'] }`, and that a popup already open at boot is not seeded into `activeSpaceByWindow` (normal window still seeded).

## 3. Runtime onCreated guard

- [x] 3.1 In `handlers/chrome-groups-windows.ts`, guard `'windows.onCreated'`: `if (!isManagedWindow(event.payload.window)) return;` before `onWindowOpened` / `markDirty`.
- [x] 3.2 In the coordinator handler tests, add cases: a `'popup'` `windows.onCreated` does NOT call `onWindowOpened` and does NOT mark dirty; a `'normal'` window still does both (no regression).

## 4. Verify orchestration no-op consequence

- [x] 4.1 Add/extend a test asserting that with no `activeSpaceByWindow` entry for a popup window, `groupNewTab` / `groupHomeTab` no-op and `chrome.tabs.group` is never invoked (the `ensureGroupForSpace failed` error no longer fires for the non-normal-window case).

## 5. Gates

- [x] 5.1 `pnpm verify` green (tsc, biome incl. layer DAG, svelte-check, stylelint, vitest).
- [x] 5.2 Manual sanity on Edge: open a Copilot/web-app/popup window, confirm no `ensureGroupForSpace failed` console error; normal windows still get their Space + group.
- [x] 5.3 Docs/artifacts in lockstep: confirm no [docs/](../../../docs/) edits needed (background-internal change, no architecture-DAG or public-contract shift); if any surfaced during implementation, update them + this change's artifacts in the same change.
