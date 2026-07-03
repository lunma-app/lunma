## Why

Two small, user-visible improvements to the Temporary-tabs area of the sidebar. First, the temp-tab right-click menu's "Duplicate" item is the only entry with no icon, which reads as an oversight next to Favorite/Rename/Move up/Move down/Close (all iconed) — a one-field fix that restores visual consistency. Second, "Clear" is currently all-or-nothing: a user who opened the same page a few times (a common outcome of the app's own "open in new tab" gestures) has to nuke the entire Temporary list to tidy it up, even when they want to keep browsing. Adding a lower-risk "Clear duplicates" option next to Clear lets a user dedupe without losing unrelated tabs, while leaving the fast single-click "Clear all" path completely unchanged.

## What Changes

- Add `icon: 'copy'` to the `duplicate` entry in `tabMenuItems()` (`apps/extension/src/sidebar/TempTabs.svelte`), matching every other entry in that menu.
- Add a small `Menu` (`trigger="kebab"`, a custom `kebabIcon` rather than the default ⋮ glyph) next to the existing "Clear" `Button` in each Space panel's divider row (`apps/extension/src/sidebar/App.svelte`). Its single item, "Clear duplicates", closes only the Space's temp tabs that duplicate another temp tab's exact URL, keeping the earliest-listed tab in each duplicate group. It renders **disabled** (not hidden) when the Space currently has no duplicate temp tabs.
- Add a new `clearDuplicateTempTabs` `SidebarCommand` (payload `{ windowId: WindowId; spaceId?: SpaceId }`, mirroring `clearTempTabs`) and its background handler in `apps/extension/src/background/handlers/temp-tabs.ts`, reusing the existing archive-then-remove-then-survivor-check flow `clearTempTabs` already uses.
- Reuse the **existing** `undoClearTempTabs` command/handler and the sidebar's `Toast`/`clearedToast` plumbing for undo — no new undo path. Add three new i18n messages: `sidebar_clearedDuplicateTabs` ("Cleared N duplicate tabs — Undo", alongside the existing `sidebar_clearedTabs`), `sidebar_tempClearDuplicates` ("Clear duplicates", the menu item's label), and `sidebar_clearMenuLabel` (the kebab trigger's accessible name, parameterised on the Space name — e.g. "Clear options for {spaceName}" — so multiple panels' triggers aren't indistinguishable to screen readers).
- The single-click "Clear" button's existing behavior (clear ALL of a Space's temp tabs) is **unchanged** — this change is additive only.

No new `src/ui` primitive is introduced — this composes the existing `Menu` (`trigger="kebab"`), `Button`, and `Toast` primitives, so the catalog-story requirement (binding for new/modified `src/ui/*.svelte` primitives) does not apply to this change.

`docs/architecture.md` and `docs/tech-stack.md` are unaffected (no new layer, dependency, or primitive) and are left untouched. No other `docs/` file documents this behavior today, so none require an update.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `tab-dedup`: the existing "Temp tab right-click menu includes a Duplicate action" requirement gains an icon detail (`icon: 'copy'`).
- `spaces-and-tabs`: the existing "New Tab and Clear temporary-tab actions" requirement is extended with a new, distinct "Clear duplicates" action alongside Clear (new requirement, own scenarios), sharing the existing Undo/Toast/archive mechanics.
- `typed-message-bus`: a new `clearDuplicateTempTabs` command joins the vocabulary (new requirement, own scenarios), and the "Command vocabulary covers all sidebar-driven mutations" requirement's "Temporary-tab and navigation" family list is updated to include it.

## Impact

- **Code:** `apps/extension/src/sidebar/TempTabs.svelte` (icon), `apps/extension/src/sidebar/App.svelte` (kebab menu + dispatch + toast copy), `apps/extension/src/shared/bus.ts` (new command + Zod schema), `apps/extension/src/background/handlers/temp-tabs.ts` (new handler), `apps/extension/src/background/coordinator.ts` (register the new handler alongside `clearTempTabs`), `apps/extension/src/background/handlers/context.ts` (extend the `HandlersMap` closed union with a `clearDuplicateTempTabs` arm), `apps/extension/messages/en.json` (+ other locale catalogs, per the i18n pipeline) for the three new message keys, `apps/extension/src/ui/icon-loaders.generated.ts` (regenerated via `pnpm gen:icons` to add both `copy` and `chevron-down` to the allowlist).
- **Tests:** `TempTabs.svelte`/menu tests for the icon; `App.svelte` tests + `temp-tabs.ts` handler tests + `bus.ts` schema tests for the new command and its handler behavior (grouping, survivor choice, disabled state, undo reuse).
- **No breaking changes.** No new setting, no new primitive, no changes to existing command payloads.
