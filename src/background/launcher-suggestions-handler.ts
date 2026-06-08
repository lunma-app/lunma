import { bookmarksProvider } from '../launcher/shared/providers/bookmarks';
import { historyProvider } from '../launcher/shared/providers/history';
import { openTabsProvider } from '../launcher/shared/providers/open-tabs';
import { savedTabsProvider } from '../launcher/shared/providers/saved-tabs';
import { runSearch } from '../launcher/shared/search-engine';
import { buildWebActionResults, resolveDefaultEngine } from '../launcher/shared/web-actions';
import { respondWithLauncherSuggestions } from '../shared/messages';
import { readSettings } from '../shared/settings';
import type { LunmaStore } from '../shared/store.svelte';

/**
 * Pure-read launcher-suggestions handler. Registers a chrome.runtime.onMessage
 * listener that answers 'lunma/launcher-suggestions-request' by sourcing the
 * four providers — saved tabs from the store, the other three via read-only
 * chrome APIs — running the shared search engine, and replying with the merged,
 * scored results.
 *
 * Pure-read per the chrome-event-coordination contract (like the state-snapshot
 * handler): it NEVER enqueues onto the coordinator queue, mutates LunmaStore,
 * persists, or broadcasts. It reads `store.state.savedTabs` and the user's
 * settings (`readSettings`, for the default engine) and may call read-only chrome
 * APIs (`chrome.tabs.query`, `chrome.bookmarks.search`, `chrome.history.search`).
 * It runs independently of the coordinator queue, so a response never blocks on
 * an in-flight drain.
 *
 * For a non-empty query it composes `[ websearch, navigate?, …providerResults ]`
 * (launcher-web-search): the search row leads (it is the preselected default, so
 * Enter web-searches the query), the go-to row follows for a URL-shaped input,
 * then the provider results. The synthesized action rows are additive — not
 * scored, deduped, or capped with the four-provider results. An empty/whitespace
 * query still yields no results (the idle home is unchanged).
 *
 * Returns an unregister function.
 */
export function registerLauncherSuggestionsHandler(store: LunmaStore): () => void {
  return respondWithLauncherSuggestions(async ({ query, windowId }) => {
    if (query.trim() === '') return [];
    const settings = await readSettings();
    const engine = resolveDefaultEngine(settings);
    const [tabs, bookmarks, history] = await Promise.all([
      chrome.tabs.query({}),
      chrome.bookmarks.search(query),
      chrome.history.search({ text: query, maxResults: 100 }),
    ]);
    const providerResults = runSearch(query, {
      tabs: openTabsProvider(tabs, windowId),
      saved: savedTabsProvider(store.state.savedTabs, store.state.tabBindings, windowId),
      bookmarks: bookmarksProvider(bookmarks),
      history: historyProvider(history),
    });
    const { navigate, websearch } = buildWebActionResults(query, engine);
    return [websearch, ...(navigate ? [navigate] : []), ...providerResults];
  });
}
