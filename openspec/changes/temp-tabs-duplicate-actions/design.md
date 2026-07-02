## Context

Two independent, small gaps in the sidebar's Temporary-tabs area:

1. `tabMenuItems()` in `apps/extension/src/sidebar/TempTabs.svelte:257-298` builds the temp-tab row's right-click menu (`Menu` primitive, `trigger="context"`). Every item (`favorite`, `rename`, `move-up`, `move-down`, `close`) sets an `icon`; `duplicate` (lines 286-290) is the sole exception.
2. The per-Space "Clear" action (`apps/extension/src/sidebar/App.svelte:643-655`, dispatching `clearTempTabs`) is all-or-nothing: it closes every temporary tab in the Space, archiving them first and offering a 5s "Cleared N tabs — Undo" `Toast` (`clearedToast`, `App.svelte:406-422`). There is no way to close only the tabs that duplicate another tab's URL while leaving the rest of the list intact.

There is currently no logic anywhere in the codebase that scans a Space's existing temporary tabs for duplicate URLs. The only existing "dedup" concept, `findTabInActiveSpace` (`apps/extension/src/background/handlers/queries.ts:94-114`), answers "is this URL already open?" for a tab about to be created — it does not group or clean up tabs that already coexist. This change introduces that grouping logic for the first time, scoped narrowly to the new "Clear duplicates" action.

## Goals / Non-Goals

**Goals:**
- Give the temp-tab context menu's Duplicate item an icon, matching every sibling item.
- Let a user close only the duplicate-URL tabs in a Space's Temporary list, via a discoverable, keyboard-reachable secondary action next to Clear, without touching the existing single-click "Clear all" behavior.
- Reuse existing mechanics (archive-then-remove, Undo, Toast, the `Menu` primitive) rather than inventing new ones.

**Non-Goals:**
- No change to the single-click Clear button's behavior, label, or icon.
- No new setting/toggle to control duplicate-detection behavior (it is a single, on-demand user action, not an ongoing policy like `dedupNewTabNavigations`).
- No cross-window or cross-Space duplicate detection — scoped to one Space's temp tabs in the current window, matching every other dedup concept in the codebase (`findTabInActiveSpace`'s "current window, active Space only" scope).
- No URL normalization — exact string match only, matching `findTabInActiveSpace`'s existing "no normalisation, no fragment stripping" convention, for consistency and predictability.
- No new `src/ui` primitive.

## Decisions

**D1 — Duplicate icon: `copy`.** Lucide's `copy` icon is not yet in the generated allowlist (`apps/extension/src/ui/icon-loaders.generated.ts`); the allowlist is regenerated from source literals by `pnpm gen:icons` (`apps/extension/scripts/gen-icon-loaders.mjs`), so adding `icon: 'copy'` to the `duplicate` `MenuItem` and re-running that script is sufficient — no manual allowlist edit. Alternatives considered: `copy-plus` (implies "add", less apt for an action that clones an existing tab), `files`/`layers` (too generic, already evoke other concepts like grouping). `copy` is the direct, unambiguous match for "duplicate this." **Note:** `chevron-down` (D2, the kebab trigger's icon) is equally new to the allowlist and needs the same `pnpm gen:icons` treatment — both icons SHALL be added to source before the single regeneration run (see `tasks.md`).

**D2 — "Clear duplicates" affordance: a `Menu` (`trigger="kebab"`) next to the Clear button, not a new gesture.** The `Menu` primitive's `trigger="kebab"` mode (`apps/extension/src/ui/Menu.svelte`) is exactly a click-opened, portaled dropdown with its own accessible trigger button, roving keyboard nav, and dismissal — already used elsewhere in this sidebar: `apps/extension/src/sidebar/SectionHeader.svelte:56`, which `App.svelte` composes for the Space header's overflow menu. Passing `icon="chevron-down"` overrides the default `⋮` glyph so the trigger reads as "more options for Clear" rather than a generic overflow menu; the primitive already flips the icon to `x` while open, for free. Following `SectionHeader.svelte:56`'s existing precedent, the trigger SHALL pass an explicit, Space-scoped `ariaLabel` (a new message, `sidebar_clearMenuLabel`, parameterised on the Space name — e.g. "Clear options for {spaceName}") rather than relying on `Menu`'s hardcoded English default (`'Open menu'`) — with one such trigger per Space panel, identical unscoped names would be indistinguishable to screen-reader users.
  - *Alternatives considered and rejected:* **Long-press** — not a desktop-idiomatic affordance in this app (no other action anywhere uses long-press), poor discoverability, and no existing primitive supports it. **Right-click on the Clear button itself** — right-click is already semantically reserved for *row* context menus throughout the app (temp rows, pinned rows, favicon tiles, all documented in the `tab-row-menu` capability); overloading it on a bare action button would be inconsistent and has no visual affordance hinting it's available. **A single split-behavior button that changes what a click does based on modifier keys (e.g. Alt+click)** — invisible without documentation, fails the "discoverable" bar outright.
  - The kebab menu contains exactly one item, "Clear duplicates" — a `MenuItem` with `disabled: true` when the Space's temp tabs contain no duplicate URL groups (mirroring the existing `move-up`/`move-down` disabled-at-edges pattern in `tabMenuItems()`), so the action is visible/discoverable at all times but inert when inapplicable, rather than appearing/disappearing (which would make it harder to find and could shift adjacent layout).

**D3 — Survivor selection: earliest-listed tab per URL group.** Confirmed with the user directly (not assumed): when a duplicate-URL group is collapsed, the tab that appears **first** in the Space instance's `tempTabIds` order survives; the rest are archived and closed. This matches existing list-order semantics used elsewhere (e.g. `reorderTemp`'s ordering, the Move up/down "bounds" logic) and is deterministic and simple to test. The rejected alternative — "most recently active tab" — would require tracking last-active timestamps per tab, a new piece of state this change does not otherwise need, for a benefit (guessing which duplicate the user is "using") that is speculative.

**D4 — New `clearDuplicateTempTabs` command, not an extra parameter on `clearTempTabs`.** A boolean flag (e.g. `clearTempTabs({ ..., duplicatesOnly: true })`) would make one command do two semantically different things and would still need its own scenarios in `typed-message-bus`; a sibling command keeps `clearTempTabs`'s contract untouched (no risk to its existing tests/behavior) and follows the codebase's existing pattern of one command per distinct mutation (e.g. `clearTempTabs` / `undoClearTempTabs` / `clearArchivedTabs` are already separate commands rather than one parameterized command).

**D5 — Reuse `undoClearTempTabs` unchanged for undo.** Its payload (`{ windowId, tabIds }`) and handler are already generic over "a batch of tabIds that were archived together" — it doesn't know or care whether the batch came from a full Clear or a duplicates-only Clear. The new handler archives its batch through the same `ctx.store.appendArchivedTab` / `pruneArchivedTabs` calls `clearTempTabs` uses, so the existing restore-most-recent-entry-per-`tabId` logic works unmodified. This avoids a second undo code path entirely.

**D6 — New handler groups by exact URL, keeps first, archives+removes the rest, then runs the same "would this empty the window" survivor check `clearTempTabs` already runs.** Implementation sketch (for `tasks.md`, not prescriptive line-by-line): read the target Space's `tempTabIds` still open in `windowId`; group by `liveTabsById[id].url` (exact string); for each group with `length > 1`, keep index 0 and collect the rest into the archive/remove batch; if the batch is empty, no-op (mirrors `clearTempTabs`'s existing "no temps → no-op" behavior); otherwise archive with one shared `archivedAt`, run the existing "would removing these empty the window" home-tab-open guard, then `chrome.tabs.remove`.

## Visual language

- **Trigger:** the kebab-menu trigger button reuses `Menu`'s built-in trigger styling verbatim (no bespoke CSS) — same size, hover/press/focus-visible treatment, and portal/collision handling as every other kebab trigger in the app (e.g. `SectionHeader.svelte:56`'s Space header menu). It sits directly after the "Clear" `Button` inside the existing `divider-action` span, so the two read as one grouped control (Clear + its overflow), consistent with how a split-button/overflow pairing reads elsewhere in the OS-level Chrome UI this sidebar sits beside.
- **Icon:** `chevron-down` (16px, the primitive's fixed trigger icon size) in place of the default `⋮`, signalling "more options for Clear" rather than a generic overflow menu; flips to `x` while open (built into the primitive, no extra code). Both `copy` and `chevron-down` require the same `pnpm gen:icons` allowlist regeneration as D1 notes.
- **Accessible name:** the trigger passes `ariaLabel={m.sidebar_clearMenuLabel({ spaceName })}` (a new message, "Clear options for {spaceName}") rather than the primitive's default `'Open menu'`, so each Space panel's trigger is independently identifiable to assistive tech — matching `SectionHeader.svelte:56`'s existing per-Space `ariaLabel` precedent.
- **Motion:** the dropdown's open/close reuses the `Menu` primitive's existing fast-tick entrance (`--motion-fast` / `--ease-emphasised`) and its `prefers-reduced-motion` suppression — no new animation is introduced by this change, per the shared invariant already documented in `tab-row-menu`.
- **Colour / hierarchy:** the trigger uses the same quiet, ghost-level treatment as the "Clear" button beside it — neither should visually outrank the other, since Clear is still the primary, one-click default and this is a secondary, one-item overflow. The single "Clear duplicates" item follows the standard `Menu` item styling (no `danger` styling — it is a recoverable action via Undo, same as Clear).
- **Disabled state:** "Clear duplicates" renders with the `Menu` primitive's existing `disabled` item styling (dimmed, `aria-disabled`, not clickable) when the Space has no duplicate temp tabs — same visual language already used for `move-up`/`move-down` at list edges, so no new disabled treatment is introduced.
- **Duplicate icon (temp-tab context menu):** `copy` at the same 14px leading-icon size every sibling item already uses in that menu (`Menu`'s shared `itemBody` snippet) — no new sizing or colour rule.

## Risks / Trade-offs

- **[Risk] A user expects "Clear duplicates" to also consider pinned/bound tabs sharing a URL with a temp tab.** → **Mitigation:** scope is explicitly temp-tabs-only (pinned tabs are never touched by any existing Clear/Undo path either), documented in the spec delta's scenarios; if cross-list dedup is wanted later, that's a distinct, separately-proposed change.
- **[Risk] Exact-URL matching (no normalization) means near-duplicate URLs — e.g. differing only by a trailing slash or fragment — won't be grouped.** → **Mitigation:** this matches the existing, already-shipped `findTabInActiveSpace` convention exactly, so behavior is predictable and consistent with the rest of the app's dedup story; not a regression relative to anything that exists today.
- **[Risk] Disabled-but-visible menu item could read as dead weight when a Space rarely has duplicates.** → **Mitigation:** it's a single low-cost item behind an already-optional kebab trigger (not inline in the always-visible Clear button), so the cost of it being occasionally inert is low; matches the existing `move-up`/`move-down` precedent of showing-but-disabling rather than hiding.

## Migration Plan

Additive only — no data migration, no settings migration, no existing command payload changes. Ships behind no flag; available immediately on update. Rollback is a plain revert (no persisted state format changes to unwind).

## Open Questions

None outstanding — the one open product decision (survivor selection, D3) was confirmed with the user before writing this document.
