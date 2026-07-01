import type { AppState, SpaceId } from './types';

/**
 * Whether a Space holds no data worth preserving: no pinned tabs and no
 * temporary tabs in any window instance. Shared by `LunmaStore.removeEmptySpace`,
 * the load-path duplicate-name self-heal, and the boot-time duplicate cleanup,
 * so "empty" can never mean something different in three places.
 */
export function isSpaceEmpty(
  state: Pick<AppState, 'pinnedBySpace' | 'spaceInstancesByWindow'>,
  spaceId: SpaceId,
): boolean {
  if ((state.pinnedBySpace[spaceId]?.length ?? 0) > 0) return false;
  for (const windowMap of Object.values(state.spaceInstancesByWindow)) {
    if ((windowMap?.[spaceId]?.tempTabIds.length ?? 0) > 0) return false;
  }
  return true;
}
