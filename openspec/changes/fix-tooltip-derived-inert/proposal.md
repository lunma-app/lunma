## Why

The shared `Tooltip` primitive (`apps/extension/src/ui/Tooltip.svelte`) backs
per-row hover affordances across the sidebar — smart-folder status dots, favorite
tiles, Space chips, drifted-row "Return to <host>". Those rows unmount
**asynchronously** (a Space switch, a smart-folder refresh broadcast, hide-read,
an item dropping out of a connector result set), so a tooltip can still be open
the instant its trigger row is torn down. Today the primitive passes `forceMount`
to `<Bits.Content>` and gates presence with a manual `{#if open}`, which keeps
bits-ui's floating/presence layer (and its scheduled `requestAnimationFrame` /
`autoUpdate` callbacks) **mounted past the trigger's teardown**. Those callbacks
then re-read a `$derived` whose owning effect is already `DESTROYED`/`INERT`,
which Svelte 5.55.3+ reports as the `derived_inert` warning the user is seeing on
Edge (`https://svelte.dev/e/derived_inert`).

The user-visible value: the tooltip's positioned layer is guaranteed to tear down
**with** its trigger — no stale tooltip can linger on the sidebar's
asynchronous row churn, and the `derived_inert` console noise (which buries real
errors during development) is removed. It also realigns the primitive with the
documented stance that bits-ui "provides only behaviour"
(`docs/tech-stack.md`). The observable tooltip behaviour (shows on hover,
transform-only instant-feel entrance, reduced-motion suppression, ARIA) is
preserved unchanged, so no caller is affected.

## What Changes

- **`ui/Tooltip.svelte`**: remove `forceMount` from `<Bits.Content>` and remove the
  manual `{#if open}` presence gate; let bits-ui own presence (mount/unmount). With
  `forceMount` gone, bits-ui routes Content through its non-force popper layer,
  which wraps the floating subtree in `{#if shouldRender}` — so the
  floating/presence reactive graph (and its pending RAF/`autoUpdate` callbacks)
  unmounts atomically with the trigger, closing the read-after-destroy window.
- **`ui/Tooltip.svelte` (CSS)**: re-anchor the transform-only `.lunma-tooltip`
  entrance animation from "fires on `{#if open}` mount" to bits-ui's presence
  attributes (`[data-state]` / `[data-starting-style]`; with
  `delayDuration`/`skipDelayDuration` `0` the open state resolves to
  `instant-open`). Keep the `@media (prefers-reduced-motion: reduce) { animation:
  none }` guard and the `var(--motion-fast)` / `var(--ease-emphasised)` token
  references intact.
- **`ui/Tooltip.test.ts`**: update the now-stale comment (~lines 44–45) that
  describes the `forceMount` + open-guard mechanism. The existing assertions
  (closed-state renders nothing, `enabled`/disabled branches, ARIA spread) remain
  unchanged and still pass.
- **No caller changes.** `SmartFolder`, `SpaceSwitcher`, `FaviconTile`, and
  `TabRow` keep their `<Tooltip>` usage as-is; the Trigger child-snippet props
  contract (`label`, `side`, `enabled`, `children`) is untouched.
- **No dependency change.** bits-ui stays at `2.18.1` (already the latest release;
  there is no upstream fix to upgrade to).

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `visual-system`: ADD a requirement codifying the shared `Tooltip` primitive's
  hover affordance — its transform-only, reduced-motion-suppressed entrance, and
  the guarantee that its floating/positioned content layer is owned by the
  headless tooltip behaviour and unmounts together with its trigger (leaving no
  stale tooltip and no reactive read surviving the trigger's teardown). This is a
  behavioural guarantee not previously spelled out; the requirement is stated in
  observable terms, not in terms of bits-ui internals.

## Impact

- **Code:** `apps/extension/src/ui/Tooltip.svelte` (presence mechanism + entrance
  CSS re-anchor) and `apps/extension/src/ui/Tooltip.test.ts` (stale comment).
- **Primitives:** modifies the existing `Tooltip` primitive in place; composes no
  new primitive and adds none. Callers continue to compose `Tooltip` unchanged.
- **New public types/files/methods:** none. The `Tooltip` `Props` interface and
  exports are unchanged.
- **`docs/`:** no doc content changes. `docs/tech-stack.md` ("Bits provides
  only behaviour") and `docs/architecture.md` (primitive list) already describe
  this primitive accurately and are left untouched; the change reaffirms rather
  than alters them.
- **Dependencies/systems:** bits-ui `2.18.1` unchanged; Svelte `5.55.9` unchanged
  (a 5.56.x bump was considered as a runtime-only mitigation and rejected as
  non-durable and out of scope).
- **Exit gates:** `pnpm verify` (tsc, biome, svelte-check, `lint:styles`, vitest)
  and `pnpm test:e2e` green; the entrance animation and reduced-motion behaviour
  re-verified.
