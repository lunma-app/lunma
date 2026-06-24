import type { LauncherResult } from '../../../shared/launcher-contract';
import type { FolderId, LensRuntime, SpaceId } from '../../../shared/types';

/**
 * Map the live lens runtime slice (`LunmaStore.state.lenses`) to
 * candidate `lens` results (launcher-fuzzy-smart-folders, design D5). Flattens
 * **every** lens's items across **all** sections (sections keyed by sourceKey
 * `${source}:${host}`) — each item is link-shaped (`{ id, title, url, status? }`)
 * and becomes a result with `source: 'lens'`, `id: 'lens:<namespacedId>'`,
 * carrying no binding and no `tabId`/`savedTabId`, so `act()` routes it through
 * the existing `openUrl` branch.
 *
 * Items are taken **regardless of the section's runtime `state`**: a `pending`
 * refresh keeps last-known items (they stay matchable and never blink out), while
 * `signed-out`/`error` carry `items: []` and so contribute nothing — no state
 * filter is needed. Volume is bounded by each section's `maxItems` cap and the
 * engine's global result cap.
 *
 * `folderNames` (optional) maps a `FolderId` to its lens node's display name
 * (from `buildFolderNameIndex().lens`); when present each result carries
 * its lens's name as the matchable `folderName` field. `folderSpaces`
 * (optional, from `buildFolderNameIndex().lensSpace`) maps a `FolderId` to
 * its owning `SpaceId`; when present each result carries `spaceId` for the
 * launcher's current-Space scope (design D9). Pure over its inputs.
 */
export function lensesProvider(
  lenses: Record<FolderId, LensRuntime>,
  folderNames: Record<FolderId, string> = {},
  folderSpaces: Record<FolderId, SpaceId> = {},
): LauncherResult[] {
  const results: LauncherResult[] = [];
  for (const [folderId, runtime] of Object.entries(lenses)) {
    const folderName = folderNames[folderId];
    const spaceId = folderSpaces[folderId];
    for (const [sectionKey, section] of Object.entries(runtime.sections)) {
      for (const item of section.items) {
        if (!item.url) continue;
        const result: LauncherResult = {
          // Namespaced id matches the `openLensItem` handler's expected format.
          id: `lens:${sectionKey}:${item.id}`,
          source: 'lens',
          title: item.title || item.url,
          url: item.url,
          score: 0,
        };
        if (folderName !== undefined) result.folderName = folderName;
        if (spaceId !== undefined) result.spaceId = spaceId;
        results.push(result);
      }
    }
  }
  return results;
}
