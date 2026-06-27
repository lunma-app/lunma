// Space lifecycle handlers (split-coordinator-handlers): create / rename /
// recolour / change-icon / delete / restore / activate / reorder. Sidebar-source
// handlers throw when they cannot produce the effect the command's name implies
// (D7-bis). Verbatim moves of the former coordinator closures.

import { closeGroupsForSpace } from '../tab-groups';
import { activateSpaceInWindow } from './activation';
import type { HandlersMap } from './context';
import { spaceExists } from './queries';

export function spaceHandlers(): Pick<
  HandlersMap,
  | 'createSpace'
  | 'renameSpace'
  | 'recolourSpace'
  | 'changeSpaceIcon'
  | 'deleteSpace'
  | 'restoreSpaceFromTrash'
  | 'activateSpace'
  | 'reorderSpaces'
> {
  return {
    createSpace: async (ctx, event) => {
      const { name, color, icon, windowId, autoArchive } = event.payload;
      const before = new Set(ctx.store.state.spaces.map((s) => s.id));
      // The Space active in the window before this create — its home-only tab
      // (if any) is tidied when activation moves off it (see D4 close-on-leave).
      const outgoing = ctx.store.state.activeSpaceByWindow[windowId] ?? undefined;
      ctx.store.createSpace({ name, color, icon, autoArchive });
      const newSpace = ctx.store.state.spaces.find((s) => !before.has(s.id));
      if (!newSpace) {
        throw new Error('createSpace: new Space not found after creation');
      }
      ctx.store.activateSpace(windowId, newSpace.id);
      // Materialize the new Space's group (forms from the focused/opened tab)
      // and collapse the others — same sequence as a plain activation.
      await ctx.groups.orchestrateActivation(windowId, newSpace.id, outgoing ?? undefined);
      ctx.markDirty();
    },
    renameSpace: async (ctx, event) => {
      const { spaceId, newName } = event.payload;
      const space = ctx.store.state.spaces.find((s) => s.id === spaceId);
      if (!space) {
        throw new Error(`renameSpace: unknown spaceId '${spaceId}'`);
      }
      const prevName = space.name;
      ctx.store.renameSpace(spaceId, newName);
      try {
        await ctx.groups.propagateGroupIdentity(spaceId);
      } catch (err) {
        // Rename atomicity: a failed chrome.tabGroups.update reverts the name.
        ctx.store.renameSpace(spaceId, prevName);
        throw new Error(
          `renameSpace: group update failed for '${spaceId}', reverted: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }
      ctx.markDirty();
    },
    recolourSpace: async (ctx, event) => {
      const { spaceId, color } = event.payload;
      const space = ctx.store.state.spaces.find((s) => s.id === spaceId);
      if (!space) {
        throw new Error(`recolourSpace: unknown spaceId '${spaceId}'`);
      }
      const prevColor = space.color;
      ctx.store.recolourSpace(spaceId, color);
      try {
        await ctx.groups.propagateGroupIdentity(spaceId);
      } catch (err) {
        // Mirror rename atomicity so state and the Chrome group never drift.
        ctx.store.recolourSpace(spaceId, prevColor);
        throw new Error(
          `recolourSpace: group update failed for '${spaceId}', reverted: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }
      ctx.markDirty();
    },
    changeSpaceIcon: (ctx, event) => {
      const { spaceId, icon } = event.payload;
      if (!spaceExists(ctx.store.state, spaceId)) {
        throw new Error(`changeSpaceIcon: unknown spaceId '${spaceId}'`);
      }
      ctx.store.changeSpaceIcon(spaceId, icon);
      ctx.markDirty();
    },
    deleteSpace: async (ctx, event) => {
      const { spaceId } = event.payload;
      if (!spaceExists(ctx.store.state, spaceId)) {
        throw new Error(`deleteSpace: unknown spaceId '${spaceId}'`);
      }
      // Capture the live group ids BEFORE the store deletes the instances.
      const groupIds = ctx.groups.liveGroupIdsForSpace(spaceId);
      ctx.store.deleteSpace(spaceId);
      // The store refuses to delete the last Space (no-op); only close groups
      // when the record actually moved to trash.
      if (!spaceExists(ctx.store.state, spaceId)) {
        await closeGroupsForSpace(groupIds);
      }
      ctx.markDirty();
    },
    restoreSpaceFromTrash: (ctx, event) => {
      const { spaceId } = event.payload;
      if (!ctx.store.state.trash[spaceId]) {
        throw new Error(`restoreSpaceFromTrash: unknown spaceId '${spaceId}'`);
      }
      ctx.store.restoreSpaceFromTrash(spaceId);
      ctx.markDirty();
    },
    activateSpace: async (ctx, event) => {
      const { windowId, spaceId } = event.payload;
      if (!spaceExists(ctx.store.state, spaceId)) {
        throw new Error(`activateSpace: unknown spaceId '${spaceId}'`);
      }
      // The shared helper owns the outgoing capture (D4 close-on-leave), the
      // store activation, and the group orchestration (preserving a selected
      // global favorite's focus — sidebar-favicon-row); it no-ops when `spaceId`
      // is already this window's active Space.
      await activateSpaceInWindow(ctx, windowId, spaceId);
      ctx.markDirty();
    },
    reorderSpaces: (ctx, event) => {
      ctx.store.reorderSpaces(event.payload.spaceIds);
      ctx.markDirty();
    },
  };
}
