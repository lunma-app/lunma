## Context

`ui/Tooltip.svelte` wraps bits-ui's headless `Tooltip` and is the only primitive
built on bits-ui (`docs/02-tech-stack.md`: "Bits provides only behaviour"). Today
it renders, **per instance**, a full `Provider → Root → Trigger → Portal →
Content` tree, with `<Bits.Content forceMount>` plus a manual presence gate
inside the content child snippet:

```svelte
<Bits.Content {side} sideOffset={6} forceMount class="lunma-tooltip-content">
  {#snippet child({ props, open })}
    {#if open}<div {...props} class="lunma-tooltip">{label}</div>{/if}
  {/snippet}
</Bits.Content>
```

`forceMount` routes Content through bits-ui's **force-mount popper layer**
(`popper-layer-force-mount.svelte`), which renders the inner floating layer
**unconditionally** — unlike the non-force `popper-layer.svelte`, which wraps it
in `{#if shouldRender}`. So with `forceMount` the floating/positioning reactive
class (`FloatingContentState`) and its scheduled `requestAnimationFrame` /
`autoUpdate` / `watch` callbacks stay mounted and pending **through the close
window**. When the trigger's host (a sidebar row) unmounts asynchronously, one of
those still-pending callbacks re-reads a `$derived` (a svelte-toolbelt `boxWith`
`get current`, e.g. `collisionBoundary.current` / `open.current` / the content
ref) on a tick **after** the trigger's parent effect has flipped
`DESTROYED`/`INERT`. Svelte 5.55.3+ (`PR sveltejs/svelte#17921`) reports that as
the `derived_inert` warning. This was confirmed against the exact production
bundle the user runs (matching chunk hashes), and the call chain
`get → update_derived → execute_derived → derived_inert` was mapped frame-by-frame.

Constraints: bits-ui is pinned at `2.18.1` and is **already the latest release**
(no upstream fix exists); Svelte is pinned via the workspace catalog. The visual
contract (instant, transform-only entrance; reduced-motion suppression; WCAG-AA)
and the `Props` contract (`label`, `side`, `enabled`, `children`) must be
preserved so no caller changes.

## Goals / Non-Goals

**Goals:**

- Eliminate the `derived_inert` read-after-destroy at its substrate by making the
  tooltip's floating/presence layer unmount **atomically** with its trigger.
- Keep observable tooltip behaviour identical: shows on hover/focus, instant
  transform-only entrance, reduced-motion suppression, WCAG-AA, ARIA, `side` /
  `sideOffset`, portal, `enabled={false}` plain pass-through.
- Fix all call sites at once by changing only the shared primitive; zero caller
  edits.

**Non-Goals:**

- Upgrading bits-ui (impossible — already latest) or bumping Svelte (a
  runtime-only, non-durable mitigation that does not change the read-after-destroy;
  out of scope and against the pinned-stack policy without a separate proposal).
- Hoisting a single shared `<Bits.Provider>` to the surface roots. It is a sound
  follow-up toward bits-ui's intended topology but has a larger blast radius
  (touches App roots across surfaces) and does not by itself close the race, so it
  is explicitly deferred.
- Replacing per-row tooltips in `SmartFolder` with native `title`. Rejected — a
  visual-quality downgrade and only a partial mitigation.

## Decisions

### Decision: Drop `forceMount` and the manual `{#if open}`; let bits-ui own presence

Remove `forceMount` from `<Bits.Content>` and remove the `{#if open}` gate inside
the content child snippet, rendering the content directly:

```svelte
<Bits.Content {side} sideOffset={6} class="lunma-tooltip-content">
  {#snippet child({ props })}
    <div {...props} class="lunma-tooltip">{label}</div>
  {/snippet}
</Bits.Content>
```

Without `forceMount`, Content routes through `popper-layer.svelte`, which gates
the entire floating subtree behind `{#if shouldRender}`. bits-ui's
`PresenceManager` flips `shouldRender` to `false` as part of the close transition,
so `FloatingContentState`, the `useFloating` effects, the `autoUpdate`
animation-frame loop, and the presence/`AnimationsComplete` RAF callbacks unmount
**within the same teardown** as the trigger — their `$effect`/`onDestroy`
cleanups fire and cancel the pending RAF. That removes the later tick on which a
`boxWith` `get current` derived would be re-read while its parent effect is
`(parent.f & (DESTROYED | INERT)) !== 0`, which is the exact `execute_derived`
warning condition.

**Alternatives considered:**
- _Keep `forceMount`, guard reads manually_ — not possible from app code; the
  reads live in bits-ui internals.
- _Single hoisted Provider_ — reduces the number of reactive graphs but does not
  close an individual tooltip's race; deferred as a follow-up (Non-Goals).
- _Native `title` on transient rows_ — visual downgrade, partial fix; rejected.
- _Svelte 5.56.3 bump_ — only might silence the warning, does not remove the
  read-after-destroy, non-durable; rejected (Non-Goals).

### Decision: Anchor the transform-only entrance to bits-ui's presence state

The entrance is bound to bits-ui's presence attribute, **not** to the incidental
fact that `.lunma-tooltip` mounts fresh per open. The `props` spread onto
`.lunma-tooltip` carries `data-state`; with `delayDuration`/`skipDelayDuration`
`0`, an open resolves to `instant-open` (confirmed against bits-ui 2.18.1). The
`lunma-tooltip-in` keyframe is applied via that presence selector:

```css
:global(.lunma-tooltip[data-state='instant-open']) {
  animation: lunma-tooltip-in var(--motion-fast) var(--ease-emphasised);
}
```

This is the **single binding form** — there is no "keep it on bare
`.lunma-tooltip`, fall back to the attribute selector if it doesn't fire"
alternative (a fork would leave the CSS contract unsettled, which
names-are-normative forbids). The `var(--motion-fast)` / `var(--ease-emphasised)`
tokens and the `@media (prefers-reduced-motion: reduce) { animation: none }`
guard are retained unchanged; no new tokens or hard-coded values are introduced
(component-library policy). The keyframe plays once when the element mounts open
(state `instant-open`); on close `data-state` flips to `closed`, the rule stops
matching, and nothing animates out — matching today's no-exit-animation behaviour.

**Alternatives considered:**
- _Keep the keyframe on bare `.lunma-tooltip`, relying on the fresh per-open mount
  to trigger it_ — rejected: couples the visual contract to an implementation
  incidental rather than the presence state this change hands to bits-ui, and
  leaves the entrance under-specified.
- _Drop the entrance entirely_ — rejected; the instant transform-only entrance is
  part of the existing visual contract.
- _If apply reveals the open state is `delayed-open` rather than `instant-open`
  (it should not, given delay 0)_ — that is a genuine deviation to surface via
  AskUserQuestion and amend here, not a pre-authorised fallback.

### Decision: Update the stale test comment; keep assertions

`ui/Tooltip.test.ts` (~lines 44–45) comments that "Bits uses forceMount + an open
guard". After the change, the closed state still renders nothing (non-force
unmounts the subtree when closed), so the assertion (`.lunma-tooltip` is null when
closed) still passes; only the comment is updated for doc-code coherence. The
`enabled`/disabled and ARIA-spread assertions are unaffected. Per the spec delta's
disabled-tooltip scenario, the `enabled={false}` path (plain pass-through, no
provider/root wrappers, no tooltip ARIA) is unchanged and remains covered.

### Decision: No `docs/` changes

`docs/02-tech-stack.md` (bits-ui "provides only behaviour") and
`docs/03-architecture.md` (primitive list, includes `Tooltip`) already describe
the primitive correctly; moving presence ownership fully to bits-ui reaffirms the
tech-stack stance rather than altering it. No doc section is edited. (Recorded per
the deviation policy: if implementation reveals a doc that describes the old
`forceMount` mechanism, it must be updated in this same change.)

## Risks / Trade-offs

- **Entrance animation may not fire on the presence mount, or an exit could clip**
  → Mitigation: the tooltip has no exit animation today (transform-only, instant
  by design), and bits-ui's `AnimationsComplete` waits for `getAnimations()` to
  settle before unmounting, so close behaves equivalently. The
  `[data-state]`/`[data-starting-style]` anchor is the recorded fallback. Verify
  visually (hover) and confirm `lint:styles` keyframe/token contract.
- **Reduced-motion regression** → Mitigation: keep the
  `prefers-reduced-motion: reduce { animation: none }` guard; covered by the spec
  scenario.
- **Behaviour parity (delay 0, `side`, `sideOffset`, portal, ARIA)** → Mitigation:
  `Provider` (`delayDuration`/`skipDelayDuration` `0`), `Root`, `Trigger`,
  `Portal`, and the Trigger child-snippet props contract are all untouched; only
  presence ownership changes.
- **Warning relocates rather than disappears** → Assessed as no: the warned
  deriveds live inside the floating/presence graph that now unmounts atomically;
  there is no surviving reader outside the unmounted subtree.

## Migration Plan

No data, storage, or state migration. Implementation is a single-file primitive
edit plus a test update. Rollback is a straight revert of the change.

**Verification split (recorded so the gap is not an unstated decision).** The
spec's "unmounts with its trigger" scenario has two halves with different reach:

- _Observable, automatable half_ — after a tooltip's host unmounts, the
  `.lunma-tooltip` portal node is gone. This is asserted by a unit test (task 3.3)
  to the extent jsdom can drive the open state (focus the trigger under
  `delayDuration` 0). If bits-ui's open state proves not drivable under jsdom (no
  real RAF/floating/`getAnimations`), the test records that in a comment and the
  guarantee falls to the manual check — that limitation is this recorded decision,
  not an apply-time surprise.
- _`derived_inert`-free half_ — verified **manually** in a real Chromium build
  (task 4.3), because jsdom cannot reproduce bits-ui's `requestAnimationFrame` /
  `autoUpdate` / floating-layer teardown timing that produces the warning. There
  is no automated assertion for the console warning itself, by necessity.

Other validation: `pnpm verify` (tsc, biome, svelte-check, `lint:styles`, vitest)
and `pnpm test:e2e` green; manual hover check that the entrance plays and that
reduced-motion suppresses it; confirm no `derived_inert` in the console when
sidebar rows churn (Space switch / smart-folder refresh).

## Visual language

- **Motion:** the tooltip keeps its single transform-only entrance —
  `translateY(-2px) → 0` with `opacity 0.6 → 1` over `var(--motion-fast)` on
  `var(--ease-emphasised)`. With `delayDuration`/`skipDelayDuration` `0` it reads
  as instantaneous (the existing intent). No exit animation (the content is
  removed on close). Under `prefers-reduced-motion: reduce` the keyframe is
  disabled and the content simply appears (identical end state).
- **Colour / tokens:** unchanged — `--surface-3` fill, `--text` ink,
  `--border-soft` hairline, `--shadow-md` lift, `--r-sm` radius,
  `var(--z-dropdown)` layer, `--font-sans` at `--text-xs`/`--weight-medium`. No
  Space-hue dependence; semantic surface tokens only, so WCAG-AA holds at every
  tint level.
- **Interaction feedback:** appears on trigger hover/focus, hides on leave/blur;
  `pointer-events: none` so it never intercepts the pointer; positioned to `side`
  with a 6px offset, portaled to `document.body`.
- **Hierarchy:** a small, single-line (`white-space: nowrap`) glass chip that sits
  above the trigger without shifting layout.
- **Arc reference / Lunma divergence:** Arc's lightweight, instant hover hints
  inform the instant-feel entrance. Lunma's deliberate improvement is robustness
  under its **asynchronous, multi-window** sidebar: tooltips ride per-row
  affordances on lists that churn from background broadcasts, so the primitive
  guarantees its positioned layer tears down with its trigger — no stranded
  tooltip, no orphaned reactive read — which is exactly the failure this change
  removes.
