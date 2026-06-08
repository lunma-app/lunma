import type { LauncherResult } from '../../../shared/launcher-contract';

/** The slice of a `chrome.bookmarks.BookmarkTreeNode` the provider reads. */
export interface BookmarkInput {
  id: string;
  title?: string | undefined;
  url?: string | undefined;
}

/**
 * Map Chrome bookmark nodes (from `chrome.bookmarks.search(query)`) to candidate
 * `bookmark` results. Folder nodes (no `url`) are dropped. Acted on by the
 * `openUrl` command — bookmarks have no live tab to focus.
 */
export function bookmarksProvider(nodes: BookmarkInput[]): LauncherResult[] {
  const results: LauncherResult[] = [];
  for (const node of nodes) {
    const url = node.url;
    if (!url) continue;
    results.push({
      id: `bookmark:${node.id}`,
      source: 'bookmark',
      title: node.title || url,
      url,
      score: 0,
    });
  }
  return results;
}
