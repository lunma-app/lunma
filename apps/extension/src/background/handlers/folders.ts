// Pinned-tab folder handlers (split-coordinator-handlers, pinned-tab-folders).
// Structural moves ride reorderPinned; these mint ids / edit folder metadata /
// delete. Verbatim moves of the former coordinator closures.

import type { HandlersMap } from './context';
import { spaceExists } from './queries';

export function folderHandlers(): Pick<
  HandlersMap,
  | 'createFolder'
  | 'createFolderFromTabs'
  | 'renameFolder'
  | 'setFolderIcon'
  | 'setFolderColor'
  | 'deleteFolder'
> {
  return {
    createFolder: (ctx, event) => {
      const { spaceId } = event.payload;
      if (!spaceExists(ctx.store.state, spaceId)) {
        throw new Error(`createFolder: unknown spaceId '${spaceId}'`);
      }
      ctx.store.createFolder(spaceId);
      ctx.markDirty();
    },
    createFolderFromTabs: (ctx, event) => {
      const { spaceId, tabIdA, tabIdB, index } = event.payload;
      if (!spaceExists(ctx.store.state, spaceId)) {
        throw new Error(`createFolderFromTabs: unknown spaceId '${spaceId}'`);
      }
      ctx.store.createFolderFromTabs(spaceId, tabIdA, tabIdB, index);
      ctx.markDirty();
    },
    renameFolder: (ctx, event) => {
      const { spaceId, folderId, name } = event.payload;
      ctx.store.renameFolder(spaceId, folderId, name);
      ctx.markDirty();
    },
    setFolderIcon: (ctx, event) => {
      const { spaceId, folderId, icon } = event.payload;
      ctx.store.setFolderIcon(spaceId, folderId, icon);
      ctx.markDirty();
    },
    setFolderColor: (ctx, event) => {
      const { spaceId, folderId, color } = event.payload;
      ctx.store.setFolderColor(spaceId, folderId, color);
      ctx.markDirty();
    },
    deleteFolder: (ctx, event) => {
      const { spaceId, folderId } = event.payload;
      ctx.store.deleteFolder(spaceId, folderId);
      ctx.markDirty();
    },
  };
}
