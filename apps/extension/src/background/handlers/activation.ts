// Shared Space-activation sequence (cross-space-tab-switch, design D1). The two
// steps a Space switch always runs — `store.activateSpace` then
// `groups.orchestrateActivation` (show the target group, hide the outgoing one,
// tidy the outgoing home-only tab) — factored into one helper so the
// `activateSpace` command handler and the cross-Space saved-tab handlers share
// exactly one path and never drift. Effectful (mutates the store + drives Chrome
// groups), so it lives here rather than in `queries.ts` (pure read predicates).

import type { SpaceId, WindowId } from '../../shared/types';
import type { HandlerContext } from './context';

/**
 * Activate `spaceId` in `windowId`: store activation + Chrome group
 * orchestration, the same sequence a manual Space switch runs. Captures the
 * outgoing Space BEFORE activation so orchestration can close its home-only tab
 * on leave (D4). Preserves a selected global favorite's focus across the switch
 * (`preserveFavoriteFocus`).
 *
 * Idempotent: when `spaceId` is already the window's active Space this no-ops
 * (no store write, no orchestration), so callers can invoke it unconditionally
 * for a coupled record (design D1/D2). Does NOT call `markDirty` — the caller
 * owns the drain's dirty/broadcast lifecycle.
 */
export async function activateSpaceInWindow(
  ctx: HandlerContext,
  windowId: WindowId,
  spaceId: SpaceId,
): Promise<void> {
  const outgoing = ctx.store.state.activeSpaceByWindow[windowId] ?? undefined;
  if (outgoing === spaceId) return;
  ctx.store.activateSpace(windowId, spaceId);
  await ctx.groups.orchestrateActivation(windowId, spaceId, outgoing, true);
}
