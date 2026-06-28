import { cleanup, fireEvent, render } from '@testing-library/svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';
import type { LensEntity } from '../../shared/lens-entity';
import type { LensItem, PinNode, ResolvedLensSource } from '../../shared/types';
import OverviewPage from './OverviewPage.svelte';
import type { Tagged } from './overview-vm';

type LensNode = Extract<PinNode, { kind: 'lens' }>;

// OverviewPage (lens-overview): the lens identity row + scoped chips + one
// COLLAPSIBLE section per non-empty entity (Changes → Issues → Articles → Other),
// rendered from pre-bucketed props. A single inline page — no drill-down sub-pages.

const NODE: LensNode = {
  kind: 'lens',
  lensKind: 'review',
  id: 'sf-1',
  name: 'Payments',
  icon: 'folder-git-2',
  sources: [],
  maxItems: 20,
  hideRead: false,
  refreshMinutes: 10,
};

function cfg(
  source: ResolvedLensSource['source'],
  over: Partial<ResolvedLensSource> = {},
): ResolvedLensSource {
  return {
    source,
    baseUrl: `https://${source}.com`,
    sourceId: source,
    lensKind: 'review',
    ...over,
  };
}
function tagged(
  item: LensItem,
  source: ResolvedLensSource['source'] = 'github',
  over: Partial<ResolvedLensSource> = {},
): Tagged {
  return { item, cfg: cfg(source, over), sk: `${source}:host` };
}

const PR = tagged({
  id: '42',
  title: 'Idempotency keys for refunds',
  url: 'u',
  status: { tone: 'ok', label: 'ok' },
  change: {
    author: 'me',
    repo: 'payments-api',
    reviewers: [{ login: 'a', state: 'approved' }],
    draft: false,
    additions: 142,
    deletions: 18,
    updatedAt: 1,
  },
  refs: [{ kind: 'ticket', key: 'PAY-88', url: '', label: 'PAY-88' }],
});
const ISSUE = tagged(
  {
    id: 'i1',
    title: 'PAY-91 3DS step-up flakiness',
    url: 'u',
    ticket: {
      key: 'PAY-91',
      statusCategory: 'todo',
      statusLabel: 'To Do',
      priority: 'urgent',
      project: 'Payments',
      updatedAt: 1,
    },
  },
  'jira',
);
const ARTICLE = tagged(
  {
    id: 'a1',
    title: 'The hidden cost of abstraction',
    url: 'u',
    excerpt: 'x',
    publishedAt: 1,
    categories: ['Engineering'],
  },
  'rss',
);

function empty(): Record<LensEntity, Tagged[]> {
  return { change: [], ticket: [], article: [], generic: [] };
}

function renderOverview(
  byEntity: Record<LensEntity, Tagged[]>,
  openItem = vi.fn(),
  toggleRead = vi.fn(),
  setFilter = vi.fn(),
  facets = { entities: [] as LensEntity[], repos: [] as string[], projects: [] as string[] },
) {
  const taggedItems = [
    ...byEntity.change,
    ...byEntity.ticket,
    ...byEntity.article,
    ...byEntity.generic,
  ];
  return {
    openItem,
    toggleRead,
    setFilter,
    ...render(OverviewPage, {
      props: {
        node: NODE,
        tagged: taggedItems,
        facets,
        lensSub: 'GitHub & Jira',
        readSet: new Set<string>(),
        openItem,
        toggleRead,
        setFilter,
      },
    }),
  };
}

afterEach(() => cleanup());

describe('OverviewPage', () => {
  test('renders the lens identity (name + sub)', () => {
    const { getByTestId, getByText } = renderOverview(empty());
    expect(getByTestId('lens-name').textContent).toBe('Payments');
    expect(getByText('GitHub & Jira')).toBeTruthy();
  });

  test('Changes: a relation-grouped row composing the reviewer rail + diffstat, no state pill', () => {
    const { container, getByText } = renderOverview({ ...empty(), change: [PR] });
    expect(
      container.querySelector('[data-testid="overview-section"][data-entity="change"]'),
    ).not.toBeNull();
    expect(container.querySelector('[data-testid="change-row"]')).not.toBeNull();
    // No query on the cfg → grouped under "Authored".
    expect(getByText('Authored')).toBeTruthy();
    // Reviewers render through the ReviewerRail primitive (not inline avatars).
    expect(container.querySelector('[data-testid="reviewer-rail"]')).not.toBeNull();
    // Diff size renders through the Diffstat primitive.
    const diff = container.querySelector('[data-testid="diffstat"]');
    expect(diff?.textContent).toContain('+142');
    expect(diff?.textContent).toContain('18'); // −18
    // The state pill is gone — the rail verdict glyph is the single review signal.
    expect(container.querySelector('[data-testid="verdict"]')).toBeNull();
    expect(container.querySelector('[data-testid="ticket-ref"]')?.textContent).toBe('PAY-88');
  });

  test('Changes: a draft change shows a hollow CI light and no pill', () => {
    const draft = tagged({
      id: '43',
      title: 'WIP: webhook retries',
      url: 'u',
      status: { tone: 'pending', label: 'pending' },
      change: {
        author: 'me',
        repo: 'payments-api',
        reviewers: [],
        draft: true,
        updatedAt: 1,
      },
    });
    const { container } = renderOverview({ ...empty(), change: [draft] });
    const ci = container.querySelector('.ci.hollow');
    expect(ci?.getAttribute('title')).toBe('Draft');
    expect(container.querySelector('[data-testid="verdict"]')).toBeNull();
  });

  test('Issues: status-grouped, key + priority pill, title stripped of its key prefix', () => {
    const { container, getByText } = renderOverview({ ...empty(), ticket: [ISSUE] });
    expect(
      container.querySelector('[data-testid="overview-section"][data-entity="ticket"]'),
    ).not.toBeNull();
    expect(container.querySelector('[data-testid="issue-row"]')).not.toBeNull();
    expect(getByText('3DS step-up flakiness')).toBeTruthy(); // prefix stripped
    expect(getByText('urgent')).toBeTruthy();
    // Status is the GROUP header now (not a per-row pill).
    expect(getByText('To do')).toBeTruthy();
  });

  test('Articles: a grid card by default, switchable to a list row, with a read toggle', async () => {
    const { container, getByText, toggleRead } = renderOverview({ ...empty(), article: [ARTICLE] });
    expect(
      container.querySelector('[data-testid="overview-section"][data-entity="article"]'),
    ).not.toBeNull();
    expect(container.querySelector('[data-testid="article-card"]')).not.toBeNull();
    // Unread (empty readSet) → the mail toggle is in the corner (off the image).
    const toggleBtn = container.querySelector(
      '[data-testid="article-read-toggle"]',
    ) as HTMLButtonElement;
    expect(toggleBtn).not.toBeNull();
    expect(toggleBtn.getAttribute('aria-label')).toBe('Mark as read');
    // Clicking it marks the (unread) item read.
    await fireEvent.click(toggleBtn);
    expect(toggleRead).toHaveBeenCalledWith(ARTICLE, true);

    expect(container.querySelector('[data-testid="article-row"]')).toBeNull();
    await fireEvent.click(getByText('List'));
    expect(container.querySelector('[data-testid="article-row"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="article-card"]')).toBeNull();
  });

  test('sections render in canonical order (Changes → Issues → Articles)', () => {
    const { container } = renderOverview({
      change: [PR],
      ticket: [ISSUE],
      article: [ARTICLE],
      generic: [],
    });
    const order = [...container.querySelectorAll('[data-testid="overview-section"]')].map((s) =>
      s.getAttribute('data-entity'),
    );
    expect(order).toEqual(['change', 'ticket', 'article']);
  });

  test('a section header collapses + expands its body', async () => {
    const { container } = renderOverview({ ...empty(), change: [PR] });
    const head = container.querySelector('[data-entity="change"] .sec-head') as HTMLButtonElement;
    expect(head.getAttribute('aria-expanded')).toBe('true');
    expect(container.querySelector('[data-testid="change-row"]')).not.toBeNull();
    await fireEvent.click(head);
    expect(head.getAttribute('aria-expanded')).toBe('false');
    expect(container.querySelector('[data-testid="change-row"]')).toBeNull();
  });

  test('clicking a row fires openItem', async () => {
    const { container, openItem } = renderOverview({ ...empty(), change: [PR] });
    await fireEvent.click(
      container.querySelector('[data-testid="change-row"]') as HTMLButtonElement,
    );
    expect(openItem).toHaveBeenCalledWith(PR);
  });

  test('empty buckets → a calm empty note', () => {
    const { getByTestId } = renderOverview(empty());
    expect(getByTestId('overview-empty')).toBeTruthy();
  });

  test('repo chips render inside the Changes card when facets.repos is non-empty', () => {
    const { container } = renderOverview({ ...empty(), change: [PR] }, vi.fn(), vi.fn(), vi.fn(), {
      entities: ['change'],
      repos: ['github.com/acme/api'],
      projects: [],
    });
    const scopeFilter = container.querySelector('[data-testid="change-scope-filter"]');
    expect(scopeFilter).not.toBeNull();
    expect(container.querySelector('[data-testid="repo-chip"]')).not.toBeNull();
  });

  test('project chips render inside the Issues card when facets.projects is non-empty', () => {
    const { container } = renderOverview(
      { ...empty(), ticket: [ISSUE] },
      vi.fn(),
      vi.fn(),
      vi.fn(),
      { entities: ['ticket'], repos: [], projects: ['Payments'] },
    );
    const scopeFilter = container.querySelector('[data-testid="issue-scope-filter"]');
    expect(scopeFilter).not.toBeNull();
    expect(container.querySelector('[data-testid="project-chip"]')).not.toBeNull();
  });

  test('scope filters do not appear in the other entity card', () => {
    const { container } = renderOverview(
      { ...empty(), change: [PR], ticket: [ISSUE] },
      vi.fn(),
      vi.fn(),
      vi.fn(),
      { entities: ['change', 'ticket'], repos: ['github.com/acme/api'], projects: ['Payments'] },
    );
    // repo chip only inside Changes card
    const changeCard = container.querySelector('[data-entity="change"]');
    const ticketCard = container.querySelector('[data-entity="ticket"]');
    expect(changeCard?.querySelector('[data-testid="repo-chip"]')).not.toBeNull();
    expect(ticketCard?.querySelector('[data-testid="repo-chip"]')).toBeNull();
    // project chip only inside Issues card
    expect(ticketCard?.querySelector('[data-testid="project-chip"]')).not.toBeNull();
    expect(changeCard?.querySelector('[data-testid="project-chip"]')).toBeNull();
  });
});
