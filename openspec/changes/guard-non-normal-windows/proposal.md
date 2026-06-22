## Why

Chrome's `chrome.tabs.group` rejects with `"Grouping is not supported by tabs in this window."` for any window whose `type` is not `'normal'` (popups, PWA/app windows, devtools, picture-in-picture) — tab groups only exist in normal browser windows. Lunma currently seeds `activeSpaceByWindow` for **every** window (`seedExistingWindows` over `chrome.windows.getAll()`, whose default filter includes `'popup'`; `windows.onCreated` for any new window), with no window-type guard anywhere in the background layer. So the Space tab-group machinery engages on windows that cannot support grouping, the grouping call rejects, and the failure is logged at `error` level — user-visible console noise with overstated severity. The bug surfaces prominently on **Edge**, which spawns more auxiliary non-normal windows (Copilot/sidebar panes, split-screen, web-app windows) than Chrome.

## What Changes

- Lunma SHALL manage Spaces only in **normal** browser windows. Both window-entry points exclude non-normal windows at the source:
  - `seedExistingWindows` queries only normal windows (`chrome.windows.getAll({ windowTypes: ['normal'] })`).
  - The `windows.onCreated` handler ignores a window whose `type !== 'normal'` (no `onWindowOpened`, no `markDirty`).
- Consequently `activeSpaceByWindow` / `spaceInstancesByWindow` never gain entries for non-normal windows, so the downstream group-orchestration paths (`groupNewTab`, `groupHomeTab`, `orchestrateActivation`) naturally no-op there — `chrome.tabs.group` is never invoked in a window that would reject it, and the spurious `error` log disappears.
- A small background-layer predicate centralizes the "window type Lunma manages" decision so the literal is not duplicated across the two call sites.

No behavior change for normal windows. No new permissions. Not a breaking change.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `spaces-and-tabs`: Constrain window seeding/defaulting to normal windows — modify "New windows default to the last-activated Space" and add a requirement scoping Space management (seeding + group orchestration) to normal browser windows only.

## Impact

- `apps/extension/src/background/seed-existing-windows.ts` — filter `getAll` to normal windows.
- `apps/extension/src/background/handlers/chrome-groups-windows.ts` — `windows.onCreated` window-type guard.
- New `apps/extension/src/background/window-types.ts` — `isManagedWindow` predicate + `MANAGED_WINDOW_TYPES` constant (single source of truth).
- Tests: `seed-existing-windows.test.ts`, the coordinator handler tests for `windows.onCreated`, and a unit test for the new predicate.
- No store (`shared/`) changes — the guard stays in the chrome-aware background layer; `onWindowOpened` remains chrome-free.
