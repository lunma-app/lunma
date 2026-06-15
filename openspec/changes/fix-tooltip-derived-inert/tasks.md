## 1. Tooltip primitive: hand presence to bits-ui

- [x] 1.1 In `apps/extension/src/ui/Tooltip.svelte`, remove `forceMount` from
  `<Bits.Content>`.
- [x] 1.2 In the `<Bits.Content>` child snippet, remove the manual `{#if open}`
  presence gate and render the content directly
  (`{#snippet child({ props })}<div {...props} class="lunma-tooltip">{label}</div>{/snippet}`),
  dropping `open` from the snippet params now that it is unused.
- [x] 1.3 Confirm `Provider` (`delayDuration`/`skipDelayDuration` `0`), `Root`,
  `Trigger`, `Portal`, `side`, `sideOffset={6}`, and the `enabled={false}` plain
  pass-through branch are all unchanged, and the `Props` contract (`label`,
  `side`, `enabled`, `children`) is untouched.

## 2. Entrance animation re-anchor (visual contract)

- [x] 2.1 Anchor the transform-only `lunma-tooltip-in` keyframe to the single
  binding selector `:global(.lunma-tooltip[data-state='instant-open'])` (the
  decision in design.md), keeping `var(--motion-fast)` / `var(--ease-emphasised)`
  — no new tokens or hard-coded values, no bare-`.lunma-tooltip` fallback. If the
  open state turns out to be `delayed-open` rather than `instant-open` (it should
  not, given `delayDuration`/`skipDelayDuration` `0`), STOP and amend
  design.md/spec via AskUserQuestion before committing.
- [x] 2.2 Confirm the `@media (prefers-reduced-motion: reduce) { animation: none }`
  guard remains and suppresses the entrance (identical end state). (Agreed
  deviation: guard moved onto the same `[data-state='instant-open']` selector so
  it wins on specificity; recorded in design.md.)

## 3. Tests

- [x] 3.1 Update the stale comment at `apps/extension/src/ui/Tooltip.test.ts`
  (~lines 44–45) so it no longer references `forceMount` + open-guard; describe
  the bits-ui-owned presence (closed → subtree unmounted → no `.lunma-tooltip`).
- [x] 3.2 Confirm the existing assertions still pass: closed-state renders no
  `.lunma-tooltip`, `enabled`/disabled branches, and the ARIA-spread test.
- [x] 3.3 Add a test for the observable teardown half of the spec's "unmounts with
  its trigger" scenario: open the tooltip (focus the trigger under `delayDuration`
  `0`), unmount its host, and assert the `.lunma-tooltip` portal node is gone. If
  bits-ui's open state is not drivable under jsdom (no real RAF/floating/
  `getAnimations`), record that in a test comment and rely on manual check 4.3 for
  the `derived_inert` half — this split is the recorded decision in design.md, not
  an apply-time deviation.

## 4. Verify (exit gates)

- [x] 4.1 `pnpm --filter @lunma/extension verify` green (tsc, biome, svelte-check,
  `lint:styles`, vitest). 2105 unit tests pass, including the new teardown test.
- [ ] 4.2 `pnpm test:e2e` (root) green. NOTE: `boundary.spec.ts:92/:124` (and
  intermittently `pin-temp-into-folder`) are pre-existing flaky headed-MV3 smokes
  under load — they fail identically on a clean tree (stashed changes + clean
  rebuild) and pass in isolation, so this change causes no e2e regression. The
  failing specs do not touch the `Tooltip` primitive. Not greenable locally due
  to that environmental flakiness; left unchecked pending CI.
- [ ] 4.3 Manual check in a Chromium build: hover a tooltip (entrance plays;
  reduced-motion suppresses it), then churn sidebar rows that carry tooltips
  (Space switch, smart-folder refresh / hide-read) and confirm the console emits
  **no** `derived_inert` warning and no tooltip lingers after its trigger unmounts.

## 5. Close out

- [x] 5.1 Confirm no caller (`SmartFolder`, `SpaceSwitcher`, `FaviconTile`,
  `TabRow`) needed changes; if any did, that is a deviation — STOP and confirm
  with the user, then update artifacts/docs in this same change. (All four
  compose `<Tooltip>` unchanged; verify suite green.)
- [x] 5.2 Re-confirm no `docs/` file describing the old `forceMount` mechanism
  remains; if one surfaces, update it in this change (per the design's recorded
  no-docs-change decision). (No `forceMount` reference in `docs/` or anywhere
  in `src` after the edit.)
