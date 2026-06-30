import { describe, expect, test } from 'vitest';
import type {
  AppState,
  ChangeData,
  LensItem,
  LensProvider,
  LensQuery,
  ResolvedLensSource,
} from '../../shared/types';
import {
  bucketByEntity,
  changeMeta,
  changeVerdict,
  chipsFor,
  ciGlyph,
  ciLight,
  collectItems,
  initialsOf,
  isStale,
  type LensNode,
  priorityHue,
  relTime,
  reviewersForRail,
  reviewState,
  statusVM,
  stripKeyPrefix,
  type Tagged,
  waitingOnYou,
} from './overview-vm';

// The pure overview view-model (lens-overview): the synthesized Change verdict,
// the Ticket/priority/status mappings, item bucketing, scoped chips, and relative
// time — tested directly so the Svelte components stay declarative.

const item = (over: Partial<LensItem> = {}): LensItem => ({
  id: 'i',
  title: 't',
  url: 'u',
  ...over,
});
const change = (over: Partial<ChangeData> = {}): ChangeData => ({
  author: 'a',
  repo: 'o/r',
  reviewers: [],
  draft: false,
  updatedAt: 0,
  ...over,
});

describe('reviewState', () => {
  test('any "changes" reviewer wins', () => {
    expect(
      reviewState([
        { login: 'a', state: 'approved' },
        { login: 'b', state: 'changes' },
      ]),
    ).toBe('changes');
  });
  test('all-approved → approved', () => {
    expect(
      reviewState([
        { login: 'a', state: 'approved' },
        { login: 'b', state: 'approved' },
      ]),
    ).toBe('approved');
  });
  test('a pending reviewer blocks "approved"', () => {
    expect(
      reviewState([
        { login: 'a', state: 'approved' },
        { login: 'b', state: 'pending' },
      ]),
    ).toBeUndefined();
    expect(reviewState([])).toBeUndefined();
  });
});

describe('changeVerdict (priority-ordered, synthesized from real data)', () => {
  test('CI fail beats everything', () => {
    const v = changeVerdict(
      item({
        status: { tone: 'fail', label: 'x' },
        change: change({ reviewers: [{ login: 'a', state: 'approved' }] }),
      }),
    );
    expect(v.label).toBe('CI failing');
    expect(v.hue).toBe(25);
  });
  test('changes requested', () => {
    expect(
      changeVerdict(item({ change: change({ reviewers: [{ login: 'a', state: 'changes' }] }) }))
        .label,
    ).toBe('Changes requested');
  });
  test('ready to merge (all approved, CI not failing)', () => {
    const v = changeVerdict(
      item({
        status: { tone: 'ok', label: 'x' },
        change: change({ reviewers: [{ login: 'a', state: 'approved' }] }),
      }),
    );
    expect(v.label).toBe('Ready to merge');
    expect(v.hue).toBe(150);
  });
  test('CI running', () => {
    expect(
      changeVerdict(item({ status: { tone: 'pending', label: 'x' }, change: change() })).label,
    ).toBe('CI running');
  });
  test('draft (no CI signal, not approved)', () => {
    const v = changeVerdict(item({ change: change({ draft: true }) }));
    expect(v.label).toBe('Draft');
    expect(v.hue).toBeUndefined();
  });
  test('awaiting review (default)', () => {
    expect(changeVerdict(item({ change: change() })).label).toBe('Awaiting review');
  });
});

describe('changeMeta', () => {
  test('is the repo slug (diffstat is owned by the Diffstat primitive)', () => {
    expect(changeMeta(change({ repo: 'acme/api' }))).toBe('acme/api');
    expect(changeMeta(change({ repo: 'acme/api', additions: 142, deletions: 18 }))).toBe(
      'acme/api',
    );
  });
});

describe('ciGlyph', () => {
  test('maps tone → icon + hue', () => {
    expect(ciGlyph('ok')).toMatchObject({ icon: 'check', hue: 150 });
    expect(ciGlyph('fail')).toMatchObject({ icon: 'x', hue: 25 });
    expect(ciGlyph('pending')).toMatchObject({ icon: 'circle' });
    expect(ciGlyph(undefined)).toBeNull();
  });
});

describe('ciLight (the Changes-row light, draft-aware)', () => {
  test('draft takes the locus as a hollow glyph, over any CI tone', () => {
    expect(
      ciLight(item({ status: { tone: 'fail', label: 'x' }, change: change({ draft: true }) })),
    ).toMatchObject({ glyph: '○', label: 'Draft', draft: true });
  });
  test('maps the status tone when not a draft', () => {
    expect(ciLight(item({ status: { tone: 'ok', label: 'x' }, change: change() }))).toMatchObject({
      glyph: '✓',
      hue: 150,
      draft: false,
    });
    expect(ciLight(item({ status: { tone: 'fail', label: 'x' }, change: change() }))).toMatchObject(
      {
        glyph: '✕',
        draft: false,
      },
    );
  });
  test('null when neither draft nor a known tone', () => {
    expect(ciLight(item({ change: change() }))).toBeNull();
  });
});

describe('initialsOf', () => {
  test('first char of each of the first two parts', () => {
    expect(initialsOf('jane-doe')).toBe('JD');
    expect(initialsOf('ada_lovelace')).toBe('AL');
  });
  test('first two chars of a single token', () => {
    expect(initialsOf('octocat')).toBe('OC');
    expect(initialsOf('x')).toBe('X');
  });
  test('empty login degrades to a placeholder', () => {
    expect(initialsOf('   ')).toBe('?');
  });
});

describe('reviewersForRail', () => {
  test('maps each reviewer to initials + state + name title', () => {
    expect(
      reviewersForRail(
        change({
          reviewers: [
            { login: 'jane-doe', state: 'approved' },
            { login: 'bob', state: undefined },
          ],
        }),
      ),
    ).toEqual([
      { initials: 'JD', state: 'approved', title: 'jane-doe' },
      { initials: 'BO', state: undefined, title: 'bob' },
    ]);
  });
});

describe('ticket view-model', () => {
  test('priorityHue maps each bucket; undefined when absent', () => {
    expect(priorityHue('urgent')).toBe(25);
    expect(priorityHue('high')).toBe(40);
    expect(priorityHue('med')).toBe(75);
    expect(priorityHue('low')).toBe(210);
    expect(priorityHue(undefined)).toBeUndefined();
  });
  test('statusVM labels + hues', () => {
    expect(statusVM('todo')).toEqual({ label: 'To do' });
    expect(statusVM('in-progress')).toEqual({ label: 'In progress', hue: 233 });
    expect(statusVM('done')).toEqual({ label: 'Done', hue: 150 });
  });
  test('stripKeyPrefix removes a leading "KEY " only', () => {
    expect(stripKeyPrefix('PAY-91 Flaky 3DS', 'PAY-91')).toBe('Flaky 3DS');
    expect(stripKeyPrefix('No prefix here', 'PAY-91')).toBe('No prefix here');
  });
});

describe('relTime', () => {
  const now = 1_000_000_000_000;
  test('formats buckets', () => {
    expect(relTime(now, now)).toBe('now');
    expect(relTime(now - 5 * 60_000, now)).toBe('5m');
    expect(relTime(now - 2 * 3_600_000, now)).toBe('2h');
    expect(relTime(now - 3 * 86_400_000, now)).toBe('3d');
  });
});

describe('collectItems + bucketByEntity', () => {
  const node: LensNode = {
    kind: 'lens',
    id: 'f1',
    name: 'Payments',
    icon: 'star',
    lensKind: 'review',
    sources: [
      { sourceId: 'gh', queries: ['authored'] },
      { sourceId: 'feed', queries: [] },
    ],
    maxItems: 20,
    hideRead: false,
    refreshMinutes: 10,
  };
  const appState = {
    sources: {
      gh: { id: 'gh', provider: 'github', baseUrl: 'https://github.com', name: 'Work' },
      feed: { id: 'feed', provider: 'rss', baseUrl: 'https://news.example.com/rss', name: 'HN' },
    },
    lenses: {
      f1: {
        sections: {
          'gh:authored': {
            state: 'ok',
            fetchedAt: 1,
            items: [
              { id: 'pr1', title: 'A PR', url: 'u', change: change() },
              {
                id: 'is1',
                title: '#5 An issue',
                url: 'u',
                ticket: { key: '#5', statusCategory: 'todo', statusLabel: 'Open', updatedAt: 0 },
              },
            ],
          },
          feed: {
            state: 'ok',
            fetchedAt: 1,
            items: [{ id: 'a1', title: 'An article', url: 'u', publishedAt: 1 }],
          },
        },
      },
    },
    lensReadState: {},
  } as unknown as AppState;

  test('flattens OK sections and buckets a github section into both change and ticket', () => {
    const tagged: Tagged[] = collectItems(node, appState);
    expect(tagged).toHaveLength(3);
    const b = bucketByEntity(tagged);
    expect(b.change).toHaveLength(1);
    expect(b.ticket).toHaveLength(1);
    expect(b.article).toHaveLength(1);
    expect(b.generic).toHaveLength(0);
  });

  test('a re-fetching (pending, cleared) section falls back to the held items', () => {
    const ghItems = appState.lenses.f1?.sections['gh:authored']?.items ?? [];
    // The github section is mid-refresh: pending, items cleared.
    const refetching = {
      ...appState,
      lenses: {
        f1: {
          sections: {
            ...appState.lenses.f1?.sections,
            'gh:authored': { state: 'pending', fetchedAt: null, items: [] },
          },
        },
      },
    } as unknown as AppState;

    // No held → the pending github section drops out; only the rss article remains.
    expect(collectItems(node, refetching)).toHaveLength(1);

    // With held (last-known github items) → they're shown through the refresh, so
    // the overview never blanks (lens-overview hold; mirrors the sidebar).
    const tagged = collectItems(node, refetching, { 'gh:authored': ghItems });
    expect(tagged).toHaveLength(3);
    const b = bucketByEntity(tagged);
    expect(b.change).toHaveLength(1);
    expect(b.ticket).toHaveLength(1);
    expect(b.article).toHaveLength(1);
  });
});

describe('chipsFor', () => {
  const node: LensNode = {
    kind: 'lens',
    id: 'f1',
    name: 'Payments',
    icon: 'star',
    lensKind: 'review',
    sources: [
      { sourceId: 'gh', queries: ['authored', 'review-requested'] },
      { sourceId: 'feed', queries: [] },
    ],
    maxItems: 20,
    hideRead: false,
    refreshMinutes: 10,
  };
  const accounts = {
    gh: { id: 'gh', provider: 'github' as const, baseUrl: 'https://github.com', name: 'Work' },
    feed: { id: 'feed', provider: 'rss' as const, baseUrl: 'https://news.example.com/rss' },
  };

  test('one chip per connection; scope = humanised queries, or host for a feed', () => {
    const chips = chipsFor(node, accounts);
    expect(chips).toHaveLength(2);
    expect(chips[0]).toMatchObject({
      provider: 'github',
      mono: 'GH',
      name: 'Work',
      scope: 'Authored, Review requests',
    });
    expect(chips[1]).toMatchObject({
      provider: 'rss',
      mono: 'RSS',
      name: 'news.example.com',
      scope: 'news.example.com',
    });
  });
});

// A tagged overview row for the lane tests: an item plus the section config that
// surfaced it (its `query` is the relation axis the lane reads).
function tagged(
  over: Partial<LensItem>,
  query?: LensQuery,
  source: LensProvider = 'gitlab',
): Tagged {
  const cfg: ResolvedLensSource = {
    source,
    baseUrl: 'https://host.example',
    name: 'acct',
    sourceId: 's',
    lensKind: 'review',
    ...(query ? { query } : {}),
  };
  return { item: item(over), cfg, sk: `s:${over.id ?? 'i'}` };
}

describe('isStale (1-week freshness threshold)', () => {
  const now = 1_700_000_000_000;
  test('older than a week is stale; within a week is fresh', () => {
    expect(isStale(now - 8 * 86_400_000, now)).toBe(true);
    expect(isStale(now - 3 * 86_400_000, now)).toBe(false);
    expect(isStale(now, now)).toBe(false);
  });
});

describe('waitingOnYou (cross-entity actionable lane)', () => {
  test('surfaces review-requested changes, CI-failing authored changes, assigned non-done tickets — in that order', () => {
    const reviewCh = tagged({ id: 'r', change: change() }, 'review-requested');
    const ciCh = tagged({ id: 'c', change: change(), status: { tone: 'fail', label: 'CI' } }); // authored (no query)
    const assignedTk = tagged(
      {
        id: 'a',
        ticket: { key: 'K-1', statusCategory: 'todo', statusLabel: 'To Do', updatedAt: 0 },
      },
      'assigned',
    );
    const res = waitingOnYou([assignedTk, ciCh, reviewCh]);
    expect(res.items.map((i) => i.reason)).toEqual(['review', 'ci', 'assigned']);
    expect(res.items.map((i) => i.entity)).toEqual(['change', 'change', 'ticket']);
    expect(res.overflow).toBe(0);
  });

  test('excludes passing authored changes and done assigned tickets', () => {
    const okCh = tagged({ id: 'c', change: change(), status: { tone: 'ok', label: 'ok' } });
    const doneTk = tagged(
      { id: 'd', ticket: { key: 'K', statusCategory: 'done', statusLabel: 'Done', updatedAt: 0 } },
      'assigned',
    );
    expect(waitingOnYou([okCh, doneTk]).items).toEqual([]);
  });

  test('caps at the limit and reports overflow', () => {
    const many = Array.from({ length: 8 }, (_, i) =>
      tagged({ id: `r${i}`, change: change() }, 'review-requested'),
    );
    const res = waitingOnYou(many, 6);
    expect(res.items).toHaveLength(6);
    expect(res.overflow).toBe(2);
  });
});
