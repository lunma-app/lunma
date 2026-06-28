// Shared catalog fixtures (component-catalog R5): one realistic data set reused
// across stories — PR titles, repo/people names, reviewer verdicts, tabs,
// favicons — so primitives are shown with meaningful content, never per-story
// lorem. Types come from `@/shared` (the same contract the surfaces consume),
// keeping the catalog's import edges to `ui` + `shared` only.
import type { LauncherResult } from '@/shared/launcher-contract';

// The canonical Space palette — re-exported from the shared schema so the
// catalog's swatches/identity matrices never drift from what the surfaces render.
export { SPACE_COLORS } from '@/shared/schemas';

import type { SourceAccount, Space, SpaceColor } from '@/shared/types';

/** A do-nothing handler for the many required `on*` callbacks in a static catalog. */
export const noop = (): void => undefined;

/** A small set of Spaces with distinct hues/icons for hue-driven stories. */
export const SPACES: readonly Space[] = [
  { id: 'sp-work', name: 'Work', color: 'blue', icon: 'briefcase' },
  { id: 'sp-reading', name: 'Reading', color: 'orange', icon: 'book-open' },
  { id: 'sp-design', name: 'Design', color: 'purple', icon: 'palette' },
  { id: 'sp-home', name: 'Home', color: 'green', icon: 'house' },
];

/** A connected source account (lens/connector stories). */
export const ACCOUNT: SourceAccount = {
  id: 'acc-gh',
  provider: 'github',
  baseUrl: 'https://github.com',
  name: 'octocat',
};

/** Reviewer discs with blocking-wins verdicts — drives Avatar + ReviewerRail. */
export interface MockReviewer {
  initials: string;
  state?: 'approved' | 'changes' | 'pending';
  title?: string;
}
export const REVIEWERS: MockReviewer[] = [
  { initials: 'AK', state: 'approved', title: 'Ada Kale — approved' },
  { initials: 'JR', state: 'changes', title: 'Jun Reyes — changes requested' },
  { initials: 'MO', state: 'pending', title: 'Mira Osei — review pending' },
  { initials: 'LP', state: 'approved', title: 'Lon Park — approved' },
  { initials: 'TS', state: 'pending', title: 'Teo Saito — review pending' },
  { initials: 'NV', state: 'approved', title: 'Noa Vela — approved' },
];

/** A favicon URL for a host, via Google's s2 endpoint (matches in-app resolver shape). */
export function favicon(host: string, size = 32): string {
  return `https://www.google.com/s2/favicons?domain=${host}&sz=${size}`;
}

/** Sample tabs for TabRow / FaviconTile / Favicon stories. */
export interface MockTab {
  title: string;
  host: string;
  url: string;
}
export const TABS: readonly MockTab[] = [
  {
    title: 'svelte/svelte · Pull Request #14201',
    host: 'github.com',
    url: 'https://github.com/sveltejs/svelte/pull/14201',
  },
  {
    title: 'Designing the immersive shell — Figma',
    host: 'figma.com',
    url: 'https://figma.com/file/abc/immersive-shell',
  },
  { title: 'OKLCH colour picker', host: 'oklch.com', url: 'https://oklch.com' },
  { title: 'Vite 8 release notes', host: 'vite.dev', url: 'https://vite.dev/blog/vite-8' },
  { title: 'Mona Sans — GitHub Next', host: 'github.com', url: 'https://github.com/mona-sans' },
];

/** A realistic launcher result set spanning every source for ResultList/ResultRow. */
export const RESULTS: LauncherResult[] = [
  {
    id: 'r-tab',
    source: 'tab',
    title: 'svelte/svelte · Pull Request #14201',
    url: 'https://github.com/sveltejs/svelte/pull/14201',
    score: 0.98,
    tabId: 1201,
  },
  {
    id: 'r-saved',
    source: 'saved',
    title: 'Immersive shell — Figma',
    url: 'https://figma.com/file/abc/immersive-shell',
    score: 0.91,
    savedTabId: 'saved-1',
    folderName: 'Design',
  },
  {
    id: 'r-lens',
    source: 'lens',
    title: 'Add component catalog (#312)',
    url: 'https://github.com/lunma/lunma/pull/312',
    score: 0.88,
    folderName: 'Review requested',
  },
  {
    id: 'r-bookmark',
    source: 'bookmark',
    title: 'OKLCH colour picker',
    url: 'https://oklch.com',
    score: 0.74,
  },
  {
    id: 'r-history',
    source: 'history',
    title: 'Vite 8 release notes',
    url: 'https://vite.dev/blog/vite-8',
    score: 0.61,
    lastVisitTime: 1_719_500_000_000,
  },
  {
    id: 'r-foreign',
    source: 'saved',
    title: 'Reading list — Longform',
    url: 'https://longform.org',
    score: 0.55,
    savedTabId: 'saved-2',
    spaceId: 'sp-reading',
    spaceName: 'Reading',
    spaceColor: 'oklch(0.73 0.16 55)',
  },
  {
    id: 'r-websearch',
    source: 'websearch',
    title: 'Search DuckDuckGo for "svelte 5 runes"',
    url: 'https://duckduckgo.com/?q=svelte+5+runes',
    score: 0,
  },
];

/** Lens rows for the LensRow story. */
export interface MockLens {
  name: string;
  icon: string;
  color: SpaceColor;
  badge?: string;
}
export const LENSES: readonly MockLens[] = [
  { name: 'Review requested', icon: 'git-pull-request', color: 'purple', badge: '4' },
  { name: 'Assigned to me', icon: 'user-check', color: 'blue', badge: '2' },
  { name: 'Authored', icon: 'git-commit-horizontal', color: 'green' },
];

/** A handful of curated icon names for Icon / IconButton / RowButton stories. */
export const ICON_NAMES: readonly string[] = [
  'house',
  'briefcase',
  'book-open',
  'palette',
  'search',
  'settings',
  'star',
  'bell',
];
