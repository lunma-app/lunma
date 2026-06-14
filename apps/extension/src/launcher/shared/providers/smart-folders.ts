import type { LauncherResult } from '../../../shared/launcher-contract';
import type { FolderId, SmartFolderRuntime, SpaceId } from '../../../shared/types';

/**
 * Map the live smart-folder runtime slice (`LunmaStore.state.smartFolders`) to
 * candidate `smart` results (launcher-fuzzy-smart-folders, design D5). Flattens
 * **every** folder's `items` across **all** sources (GitLab/GitHub/Jira/RSS) —
 * each item is link-shaped (`{ id, title, url, status? }`) and becomes a result
 * with `source: 'smart'`, `id: 'smart:<itemId>'`, carrying no binding and no
 * `tabId`/`savedTabId`, so `act()` routes it through the existing `openUrl`
 * branch.
 *
 * Items are taken **regardless of the folder's runtime `state`**: a `pending`
 * refresh keeps last-known items (they stay matchable and never blink out), while
 * `signed-out`/`error` carry `items: []` and so contribute nothing — no state
 * filter is needed. Volume is bounded by each folder's `maxItems` cap and the
 * engine's global result cap.
 *
 * `folderNames` (optional) maps a `FolderId` to its smart node's display name
 * (from `buildFolderNameIndex().smartFolder`); when present each result carries
 * its folder's name as the matchable `folderName` field. `folderSpaces`
 * (optional, from `buildFolderNameIndex().smartFolderSpace`) maps a `FolderId` to
 * its owning `SpaceId`; when present each result carries `spaceId` for the
 * launcher's current-Space scope (design D9). Pure over its inputs.
 */
export function smartFoldersProvider(
  smartFolders: Record<FolderId, SmartFolderRuntime>,
  folderNames: Record<FolderId, string> = {},
  folderSpaces: Record<FolderId, SpaceId> = {},
): LauncherResult[] {
  const results: LauncherResult[] = [];
  for (const [folderId, runtime] of Object.entries(smartFolders)) {
    const folderName = folderNames[folderId];
    const spaceId = folderSpaces[folderId];
    for (const item of runtime.items) {
      if (!item.url) continue;
      const result: LauncherResult = {
        id: `smart:${item.id}`,
        source: 'smart',
        title: item.title || item.url,
        url: item.url,
        score: 0,
      };
      if (folderName !== undefined) result.folderName = folderName;
      if (spaceId !== undefined) result.spaceId = spaceId;
      results.push(result);
    }
  }
  return results;
}
