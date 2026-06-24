import { isDedupEligibleSource, isUrlOpenInActiveSpace } from '../launcher/shared/already-open';
import { buildFolderNameIndex } from '../launcher/shared/folder-names';
import { bookmarksProvider } from '../launcher/shared/providers/bookmarks';
import { historyProvider } from '../launcher/shared/providers/history';
import { lensesProvider } from '../launcher/shared/providers/lenses';
import { openTabsProvider } from '../launcher/shared/providers/open-tabs';
import { savedTabsProvider } from '../launcher/shared/providers/saved-tabs';
import { runSearch } from '../launcher/shared/search-engine';
import { buildWebActionResults, resolveDefaultEngine } from '../launcher/shared/web-actions';
import type { LauncherResult, OptionalResultSource } from '../shared/launcher-contract';
import { respondWithLauncherSuggestions } from '../shared/messages';
import { hasApiPermission } from '../shared/permissions';
import { readSettings } from '../shared/settings';
import { colourToOklch } from '../shared/space-hue';
import type { LunmaStore } from '../shared/store.svelte';
import type { Space, SpaceId } from '../shared/types';

/**
 * Tag each Space-placed result whose owning Space differs from the window's active
 * Space with a cross-Space marker — `spaceName` + a ready-to-paint `spaceColor`
 * `oklch(…)` string (launcher-fuzzy-smart-folders, design D10). Presence is the
 * surfaces' render signal; in-active-Space and global rows stay unmarked. No-op
 * when the window has no active Space (nothing is "foreign"). Mutates in place —
 * the arrays are freshly built per request.
 */
function markCrossSpace(
  results: LauncherResult[],
  activeSpaceId: SpaceId | undefined,
  spaces: Space[],
): void {
  if (activeSpaceId === undefined) return;
  for (const r of results) {
    if (r.spaceId === undefined || r.spaceId === activeSpaceId) continue;
    const space = spaces.find((s) => s.id === r.spaceId);
    if (!space) continue;
    const { l, c, h } = colourToOklch(space.color);
    r.spaceName = space.name;
    r.spaceColor = `oklch(${l} ${c} ${h})`;
  }
}

/**
 * Pure-read launcher-suggestions handler. Registers a chrome.runtime.onMessage
 * listener that answers 'lunma/launcher-suggestions-request' by sourcing the
 * five providers — saved tabs and smart-folder items from the store, the other
 * three via read-only chrome APIs — running the shared search engine, and
 * replying with the merged, scored results.
 *
 * Pure-read per the chrome-event-coordination contract (like the state-snapshot
 * handler): it NEVER enqueues onto the coordinator queue, mutates LunmaStore,
 * persists, or broadcasts. It reads `store.state.savedTabs`,
 * `store.state.lenses`, `store.state.pinnedBySpace` (for the folder-name
 * index), `store.state.activeSpaceByWindow` (for the current-Space scope), and the
 * user's settings (`readSettings`, for the default engine + `launcherScope`), and
 * may call read-only chrome APIs (`chrome.tabs.query`, `chrome.bookmarks.search`,
 * `chrome.history.search`). It runs independently of the coordinator queue, so a
 * response never blocks on an in-flight drain.
 *
 * The `launcherScope` setting (design D9) governs how cross-Space items rank:
 * `global` (no preference), `prefer-current-space` (in-Space results boosted —
 * the active Space is forwarded to scoring), or `current-space-only` (cross-Space
 * Lunma items — smart items + pinned saved tabs from other Spaces — are filtered
 * out; global favorites/tabs/bookmarks/history remain).
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
    if (query.trim() === '') return { results: [] };
    const settings = await readSettings();
    const engine = resolveDefaultEngine(settings);
    // The bookmarks/history sources are OPTIONAL permissions (least-privilege-
    // permissions design D5): gate each `chrome.*` call on its grant and, when
    // ungranted, skip the call entirely and pass an empty set to the (pure)
    // provider — it then contributes nothing, never an error. The open-tabs and
    // saved-tabs sources always run. The two `hasApiPermission` checks are cheap
    // and run alongside the data reads.
    const [bookmarksGranted, historyGranted] = await Promise.all([
      hasApiPermission('bookmarks'),
      hasApiPermission('history'),
    ]);
    // The ungranted optional sources a surface can offer to enable (design D5).
    // History first, then bookmarks (the affordance order).
    const ungrantedSources: OptionalResultSource[] = [];
    if (!historyGranted) ungrantedSources.push('history');
    if (!bookmarksGranted) ungrantedSources.push('bookmarks');
    const [tabs, bookmarks, history] = await Promise.all([
      chrome.tabs.query({}),
      bookmarksGranted
        ? chrome.bookmarks.search(query)
        : Promise.resolve<chrome.bookmarks.BookmarkTreeNode[]>([]),
      historyGranted
        ? chrome.history.search({ text: query, maxResults: 100 })
        : Promise.resolve<chrome.history.HistoryItem[]>([]),
    ]);
    const idx = buildFolderNameIndex(store.state.pinnedBySpace);
    // Current-Space scope (launcher-fuzzy-smart-folders, design D9). `activeSpaceId`
    // is the requesting window's active Space (null/absent → undefined).
    const scope = settings.launcherScope;
    const activeSpaceId = store.state.activeSpaceByWindow[windowId] ?? undefined;
    let saved = savedTabsProvider(
      store.state.savedTabs,
      store.state.tabBindings,
      windowId,
      idx.savedTabFolder,
    );
    let lens = lensesProvider(store.state.lenses, idx.lens, idx.lensSpace);
    // `current-space-only` hides cross-Space Lunma items (a result whose owning
    // Space is set and differs from the active one); global rows keep their place —
    // favicon-row favorites (no `spaceId`), open tabs, bookmarks, history. With no
    // active Space resolved, the filter is a no-op (fall back to global).
    if (scope === 'current-space-only' && activeSpaceId !== undefined) {
      const inScope = (r: LauncherResult) => r.spaceId === undefined || r.spaceId === activeSpaceId;
      saved = saved.filter(inScope);
      lens = lens.filter(inScope);
    }
    // Mark whatever cross-Space Lunma items remain (design D10) so the rows show
    // a "lives in another Space" chip. Independent of scope mode — in
    // `current-space-only` the filter above already removed them, so this no-ops.
    markCrossSpace(saved, activeSpaceId, store.state.spaces);
    markCrossSpace(lens, activeSpaceId, store.state.spaces);
    // `prefer-current-space` boosts in-Space results during scoring; `global` and
    // `current-space-only` pass no active Space, so no boost applies.
    const boostSpaceId = scope === 'prefer-current-space' ? activeSpaceId : undefined;
    const providerResults = runSearch(
      query,
      {
        tabs: openTabsProvider(tabs, windowId),
        saved,
        lens,
        bookmarks: bookmarksProvider(bookmarks),
        history: historyProvider(history),
      },
      undefined,
      boostSpaceId,
    );
    const { navigate, websearch } = buildWebActionResults(query, engine);
    const results = [websearch, ...(navigate ? [navigate] : []), ...providerResults];
    // tab-dedup (design D4): tell the stateless overlay which result URLs are
    // already open in the active Space so it can flag those rows. Only
    // dedup-eligible sources contribute (a `tab`/`saved` row is never flagged);
    // de-duplicated so each URL appears once.
    const openUrls = [
      ...new Set(
        results
          .filter(
            (r) =>
              isDedupEligibleSource(r.source) &&
              isUrlOpenInActiveSpace(store.state, windowId, r.url),
          )
          .map((r) => r.url),
      ),
    ];
    return { results, openUrls, ungrantedSources };
  });
}
