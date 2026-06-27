import { describe, expect, test } from 'vitest';
import { applyLensFilter, deriveLensFacets, type LensRow } from './lens-filter';
import type { LensItem } from './types';

function changeItem(repo: string, extra?: Partial<LensItem>): LensItem {
  return {
    id: repo,
    title: `PR in ${repo}`,
    url: `https://github.com/${repo}/pull/1`,
    change: {
      author: 'alice',
      repo,
      reviewers: [],
      draft: false,
      updatedAt: 0,
    },
    ...extra,
  };
}

function ticketItem(project?: string, extra?: Partial<LensItem>): LensItem {
  return {
    id: `ticket-${project ?? 'none'}`,
    title: 'Fix bug',
    url: 'https://jira.example.com/browse/PAY-1',
    ticket: {
      key: 'PAY-1',
      statusCategory: 'todo',
      statusLabel: 'To Do',
      project,
      updatedAt: 0,
    },
    ...extra,
  };
}

function articleItem(id = 'a1'): LensItem {
  return {
    id,
    title: 'Tech news',
    url: 'https://example.com/news',
    publishedAt: 0,
  };
}

function genericItem(id = 'g1'): LensItem {
  return { id, title: 'Something', url: 'https://example.com' };
}

function row(item: LensItem, host = 'github.com'): LensRow {
  return { item, host };
}

describe('applyLensFilter — empty filter short-circuits', () => {
  const rows = [row(changeItem('o/a')), row(ticketItem('Pay'))];
  test('empty object returns same reference', () => {
    expect(applyLensFilter(rows, {})).toBe(rows);
  });
  test('all empty arrays returns same reference', () => {
    expect(applyLensFilter(rows, { entities: [], repos: [], projects: [] })).toBe(rows);
  });
  test('empty entities array with populated repos still applies the filter', () => {
    const result = applyLensFilter(rows, { entities: [], repos: ['github.com/o/a'] });
    // entities empty → all types pass; repos filters Changes
    expect(result).toHaveLength(2); // ticket also passes (no repo axis for tickets)
    expect(result.some((r) => r.item.change?.repo === 'o/a')).toBe(true);
  });
});

describe('applyLensFilter — type (entity) axis', () => {
  const rows = [
    row(changeItem('o/a')),
    row(ticketItem('Pay')),
    row(articleItem()),
    row(genericItem()),
  ];

  test('selecting change hides tickets, articles, other', () => {
    const result = applyLensFilter(rows, { entities: ['change'] });
    expect(result).toHaveLength(1);
    expect(result[0]?.item.change?.repo).toBe('o/a');
  });

  test('selecting ticket keeps only tickets', () => {
    const result = applyLensFilter(rows, { entities: ['ticket'] });
    expect(result).toHaveLength(1);
    expect(result[0]?.item.ticket?.project).toBe('Pay');
  });

  test('selecting multiple entities ORs them', () => {
    const result = applyLensFilter(rows, { entities: ['change', 'article'] });
    expect(result).toHaveLength(2);
  });

  test('selecting generic keeps only untyped items', () => {
    const result = applyLensFilter(rows, { entities: ['generic'] });
    expect(result).toHaveLength(1);
    expect(result[0]?.item.id).toBe('g1');
  });
});

describe('applyLensFilter — scope axis, Changes (host-qualified repos)', () => {
  const ghRow = row(changeItem('o/a'), 'github.com');
  const gheRow = row(changeItem('o/a'), 'ghe.acme.com');
  const otherRow = row(changeItem('o/b'), 'github.com');
  const ticketRow = row(ticketItem('Pay'));
  const articleRow = row(articleItem());

  test('host-qualified repo key selects the right host only', () => {
    const result = applyLensFilter([ghRow, gheRow], { repos: ['github.com/o/a'] });
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(ghRow);
  });

  test('non-matching repo is excluded', () => {
    const result = applyLensFilter([ghRow, otherRow], { repos: ['github.com/o/b'] });
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(otherRow);
  });

  test('repo scope does not touch tickets or articles', () => {
    const result = applyLensFilter([ghRow, otherRow, ticketRow, articleRow], {
      repos: ['github.com/o/a'],
    });
    // o/a change + ticket (no repo axis) + article (no repo axis)
    expect(result).toHaveLength(3);
    expect(result.some((r) => r.item.ticket)).toBe(true);
    expect(result.some((r) => r.item.publishedAt !== undefined)).toBe(true);
  });

  test('a generic item (no change bag) passes the repo scope axis (scope is per-entity)', () => {
    // Repo scope only applies to Change rows. A generic item always passes scope.
    const noChangeBag: LensItem = { id: 'x', title: 'X', url: 'https://x.com' };
    const result = applyLensFilter([row(noChangeBag)], { repos: ['github.com/o/a'] });
    expect(result).toHaveLength(1);
  });
});

describe('applyLensFilter — scope axis, Issues (projects)', () => {
  const payRow = row(ticketItem('Pay'));
  const engRow = row(ticketItem('Eng'));
  const noProjectRow = row(ticketItem(undefined));
  const changeRow = row(changeItem('o/a'));

  test('project filter keeps only matching tickets', () => {
    const result = applyLensFilter([payRow, engRow], { projects: ['Pay'] });
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(payRow);
  });

  test('a project-less ticket is excluded by a non-empty projects filter', () => {
    const result = applyLensFilter([payRow, noProjectRow], { projects: ['Pay'] });
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(payRow);
  });

  test('a project-less ticket passes when projects is empty', () => {
    const result = applyLensFilter([payRow, noProjectRow], {});
    expect(result).toHaveLength(2);
  });

  test('project scope does not touch changes', () => {
    const result = applyLensFilter([changeRow, payRow, engRow], { projects: ['Pay'] });
    // change passes (no project axis), only Pay ticket
    expect(result).toHaveLength(2);
    expect(result.some((r) => r.item.change)).toBe(true);
  });
});

describe('applyLensFilter — AND across axes', () => {
  const rows = [
    row(changeItem('o/a'), 'github.com'),
    row(changeItem('o/b'), 'github.com'),
    row(ticketItem('Pay')),
    row(articleItem()),
  ];

  test('entity AND repo narrows to the intersection', () => {
    const result = applyLensFilter(rows, {
      entities: ['change'],
      repos: ['github.com/o/a'],
    });
    expect(result).toHaveLength(1);
    expect(result[0]?.item.change?.repo).toBe('o/a');
  });

  test('entity AND projects narrows Issues to matching project', () => {
    const result = applyLensFilter(rows, {
      entities: ['ticket'],
      projects: ['Pay'],
    });
    expect(result).toHaveLength(1);
    expect(result[0]?.item.ticket?.project).toBe('Pay');
  });
});

describe('deriveLensFacets', () => {
  test('empty rows returns empty facets', () => {
    expect(deriveLensFacets([])).toEqual({ entities: [], repos: [], projects: [] });
  });

  test('collects distinct entities in canonical order', () => {
    const rows = [row(articleItem()), row(changeItem('o/a')), row(ticketItem('Pay'))];
    const { entities } = deriveLensFacets(rows);
    expect(entities).toEqual(['change', 'ticket', 'article']);
  });

  test('emits host-qualified repo keys', () => {
    const rows = [
      row(changeItem('o/a'), 'github.com'),
      row(changeItem('o/a'), 'ghe.acme.com'),
      row(changeItem('o/b'), 'github.com'),
    ];
    const { repos } = deriveLensFacets(rows);
    expect(repos.sort()).toEqual(['ghe.acme.com/o/a', 'github.com/o/a', 'github.com/o/b'].sort());
  });

  test('does not duplicate repos', () => {
    const rows = [row(changeItem('o/a'), 'github.com'), row(changeItem('o/a'), 'github.com')];
    expect(deriveLensFacets(rows).repos).toHaveLength(1);
  });

  test('drops undefined projects (project-less ticket)', () => {
    const rows = [row(ticketItem('Pay')), row(ticketItem(undefined))];
    const { projects } = deriveLensFacets(rows);
    expect(projects).toEqual(['Pay']);
    expect(projects.every((p) => p !== undefined)).toBe(true);
  });

  test('collects distinct projects', () => {
    const rows = [row(ticketItem('Pay')), row(ticketItem('Eng')), row(ticketItem('Pay'))];
    expect(deriveLensFacets(rows).projects.sort()).toEqual(['Eng', 'Pay'].sort());
  });

  test('articles and generic items contribute no repos or projects', () => {
    const rows = [row(articleItem()), row(genericItem())];
    const facets = deriveLensFacets(rows);
    expect(facets.repos).toHaveLength(0);
    expect(facets.projects).toHaveLength(0);
  });
});
