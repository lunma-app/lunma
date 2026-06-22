## Context

`chrome.tabs.group` rejects with `"Grouping is not supported by tabs in this window."` for any window whose `type` is not `'normal'` — tab groups are a normal-window-only feature. Lunma seeds `activeSpaceByWindow` for every window it learns about, with no window-type filter:

- Boot: `seedExistingWindows` (`apps/extension/src/background/seed-existing-windows.ts`) iterates `chrome.windows.getAll()`. The default `windowTypes` filter is `['normal', 'popup']`, so popups are seeded.
- Runtime: the `windows.onCreated` handler (`apps/extension/src/background/handlers/chrome-groups-windows.ts:70`) calls `ctx.store.onWindowOpened(id)` for any window.

Once a non-normal window has an `activeSpaceByWindow` entry, a tab created there flows into `groupNewTab` / `groupHomeTab` → `addTabToSpaceGroup` → `ensureGroupForSpace`, where `chrome.tabs.group` rejects. The rejection is caught and swallowed (`tab-groups.ts:91`, returns `null`) but logged at `error` level. Functionally benign, but it produces user-visible console noise — and surfaces prominently on Edge, which creates more non-normal auxiliary windows (Copilot/sidebar panes, split-screen, web-app windows) than Chrome.

The architecture keeps the store (`shared/`) chrome-free; window-type is a chrome concern, so the guard belongs in the chrome-aware background layer.

## Goals / Non-Goals

**Goals:**
- Never invoke `chrome.tabs.group` in a window that cannot support grouping.
- Keep `activeSpaceByWindow` / `spaceInstancesByWindow` free of non-normal-window keys, so all downstream orchestration no-ops there with no per-site guards.
- Single source of truth for "which window types Lunma manages."
- Zero behavior change for normal windows.

**Non-Goals:**
- Reworking `ensureGroupForSpace`'s catch/log (it stays as defense-in-depth; with the entry-point guard it should no longer fire for this case). Not downgrading that log line — fixing the root cause makes it moot.
- Supporting Spaces in popup/app windows (out of scope; tab groups don't exist there).
- Any store / `shared/` change. `onWindowOpened` stays chrome-free.

## Decisions

**D1 — Guard at the two window-entry points, not at each grouping call.**
The clean fix is to keep non-normal windows out of `activeSpaceByWindow` entirely. Every orchestration path already gates on "window has an active Space / instance," so excluding the window at entry transitively disables grouping, focus moves, home-tab spawning, and collapse — all of it — without scattering `type === 'normal'` checks through the orchestrator. Alternative (guard inside `ensureGroupForSpace` / `addTabToSpaceGroup`): rejected — it would still seed bogus `activeSpaceByWindow` entries, still render an active Space for a popup, and require a window-type lookup (async `chrome.windows.get`) deep in a hot path.

**D2 — `seedExistingWindows` uses the API filter.**
Change `chrome.windows.getAll()` → `chrome.windows.getAll({ windowTypes: MANAGED_WINDOW_TYPES })`. Cheaper and more idiomatic than fetching all and filtering, and it documents intent at the query.

**D3 — `windows.onCreated` uses the predicate.**
The `onCreated` payload is a `chrome.windows.Window` carrying `type`. Guard: `if (!isManagedWindow(event.payload.window)) return;` before `onWindowOpened` / `markDirty`. Window type is fixed at creation, so a one-time check at `onCreated` is sufficient — no need to watch for type changes.

**D4 — One shared predicate module.**
New `apps/extension/src/background/window-types.ts`:
```ts
export const MANAGED_WINDOW_TYPES = ['normal'] as const;
export function isManagedWindow(window: chrome.windows.Window): boolean {
  return window.type === 'normal';
}
```
`MANAGED_WINDOW_TYPES` feeds `getAll`'s typed `windowTypes` option; `isManagedWindow` guards the `onCreated` payload. Single source of truth, unit-testable, no magic string duplicated. Lives in `background/` (imports nothing else in the app — pure chrome-type predicate), consistent with the layer DAG.

**D5 — Spec home.** The behavior is `spaces-and-tabs`: modify "New windows default to the last-activated Space" to scope it to normal windows, and add "Space management is scoped to normal browser windows" capturing both entry points + the orchestration consequence.

## Risks / Trade-offs

- **A legitimately-grouped tab in a non-normal window** → Not a real case: such windows can't have groups, which is the entire reason for the guard.
- **Edge/Chrome reporting a window as a type we'd want to manage** → `MANAGED_WINDOW_TYPES` is the single knob; widening it later is a one-line change. Only `'normal'` supports tab groups today across both browsers.
- **Defense-in-depth left in place** → `ensureGroupForSpace`'s catch remains, so even if a non-normal window slipped through (e.g. a future code path that seeds directly), the failure is still swallowed — now it just won't be hit on the known paths.

## Migration Plan

Pure background-logic change; no data/state migration, no schema bump, no permission change. Ships in the extension bundle; existing persisted state is unaffected (entries for non-normal windows were ephemeral and pruned on window close anyway). Rollback is a straight revert.
