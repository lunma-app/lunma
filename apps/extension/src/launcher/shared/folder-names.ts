import type { FolderId, PinNode, SavedTabId, SpaceId } from '../../shared/types';

/**
 * Two folder-name lookups derived from the pinned trees (launcher-fuzzy-smart-folders,
 * design D6):
 *
 * - `savedTabFolder` — a `SavedTabId` ↦ the name of the regular `folder` node it
 *   lives in. A favicon-row or top-level (unfoldered) saved tab has **no** entry.
 * - `lens` — a lens node's `FolderId` ↦ its name.
 * - `lensSpace` — a lens node's `FolderId` ↦ the `SpaceId` whose pinned
 *   tree holds it (the lens item's owning Space, for the current-Space scope,
 *   design D9). Saved tabs need no parallel map — a `SavedTab` carries its own
 *   `spaceId`.
 *
 * Consumed as a matchable field + scope hint: `savedTabsProvider` reads
 * `savedTabFolder` and `lensesProvider` reads `lens` +
 * `lensSpace`, setting `folderName`/`spaceId` on the results they emit (see
 * Requirement: Result de-duplication, scoring, and ordering). The folder names
 * only widen what a child matches against — folders never become result rows.
 */
export interface FolderNameIndex {
  savedTabFolder: Record<SavedTabId, string>;
  lens: Record<FolderId, string>;
  lensSpace: Record<FolderId, SpaceId>;
}

/**
 * Build the folder-name index from `AppState.pinnedBySpace`. Pure — scans every
 * Space's `PinNode[]`, mapping each `folder` node's children to its name and each
 * `lens` node's id to its name + owning Space. `tab` nodes (and favicon-row
 * entries, which are not in `pinnedBySpace` at all) contribute nothing. Imports
 * `shared` types only.
 */
export function buildFolderNameIndex(pinnedBySpace: Record<SpaceId, PinNode[]>): FolderNameIndex {
  const savedTabFolder: Record<SavedTabId, string> = {};
  const lens: Record<FolderId, string> = {};
  const lensSpace: Record<FolderId, SpaceId> = {};
  for (const [spaceId, nodes] of Object.entries(pinnedBySpace)) {
    for (const node of nodes) {
      if (node.kind === 'folder') {
        for (const childId of node.children) savedTabFolder[childId] = node.name;
      } else if (node.kind === 'lens') {
        lens[node.id] = node.name;
        lensSpace[node.id] = spaceId;
      }
    }
  }
  return { savedTabFolder, lens, lensSpace };
}
