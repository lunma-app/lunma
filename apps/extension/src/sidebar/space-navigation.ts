import type { Space, SpaceId } from '../shared/types';

/**
 * Resolve the SpaceId you'd land on by stepping `delta` positions from the
 * currently active Space. Returns `null` at the edges (no wrap-around) — past
 * the last Space or before the first, the gesture is a no-op. Also `null` on
 * empty list or when the only Space is already active.
 *
 * Pure function; tested exhaustively for both edges, no-current, and the
 * single-item case.
 */
export function nextSpaceId(
  spaces: ReadonlyArray<Pick<Space, 'id'>>,
  currentId: SpaceId | null,
  delta: 1 | -1,
): SpaceId | null {
  const n = spaces.length;
  if (n === 0) return null;
  const currentIdx = currentId === null ? -1 : spaces.findIndex((s) => s.id === currentId);
  // When no current Space is set, treat the move as stepping in from the edge:
  // delta=+1 lands on the first Space, delta=-1 lands on the last.
  if (currentIdx === -1) {
    const idx = delta === 1 ? 0 : n - 1;
    return spaces[idx]?.id ?? null;
  }
  const nextIdx = currentIdx + delta;
  if (nextIdx < 0 || nextIdx >= n) return null;
  const next = spaces[nextIdx];
  if (!next || next.id === currentId) return null;
  return next.id;
}
