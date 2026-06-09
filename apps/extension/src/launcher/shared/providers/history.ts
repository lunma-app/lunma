import type { LauncherResult } from '../../../shared/launcher-contract';

/** The slice of a `chrome.history.HistoryItem` the provider reads. */
export interface HistoryInput {
  url?: string | undefined;
  title?: string | undefined;
  lastVisitTime?: number | undefined;
}

/**
 * Map Chrome history items (from `chrome.history.search({ text, maxResults })`)
 * to candidate `history` results. `lastVisitTime` rides along as the recency
 * term for scoring. Acted on by the `openUrl` command.
 */
export function historyProvider(items: HistoryInput[]): LauncherResult[] {
  const results: LauncherResult[] = [];
  for (const item of items) {
    const url = item.url;
    if (!url) continue;
    const result: LauncherResult = {
      id: `history:${url}`,
      source: 'history',
      title: item.title || url,
      url,
      score: 0,
    };
    if (item.lastVisitTime !== undefined) result.lastVisitTime = item.lastVisitTime;
    results.push(result);
  }
  return results;
}
