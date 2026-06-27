import { describe, expect, test } from 'vitest';
import { deriveLensKind, entitiesForSource, entityForItem, entityForSource } from './lens-entity';
import type {
  ChangeData,
  LensItem,
  LensSourceRef,
  SourceAccount,
  SourceId,
  TicketData,
} from './types';

// The canonical entity + derived kind mappings (sources-redesign, D4/D5),
// shared by the overview page, the editor preview, the create/update handler,
// and the boot re-derivation. Pure provider→semantics — tested directly here.

describe('entityForSource', () => {
  test('github and gitlab are the Change entity', () => {
    expect(entityForSource('github')).toBe('change');
    expect(entityForSource('gitlab')).toBe('change');
  });

  test('rss is the Article entity', () => {
    expect(entityForSource('rss')).toBe('article');
  });

  test('jira is the Ticket entity (Issues section)', () => {
    expect(entityForSource('jira')).toBe('ticket');
  });
});

describe('entitiesForSource', () => {
  test('git providers emit both Change and Ticket (PRs + issues)', () => {
    expect(entitiesForSource('github')).toEqual(['change', 'ticket']);
    expect(entitiesForSource('gitlab')).toEqual(['change', 'ticket']);
  });
  test('jira emits Ticket only', () => {
    expect(entitiesForSource('jira')).toEqual(['ticket']);
  });
  test('rss emits Article only', () => {
    expect(entitiesForSource('rss')).toEqual(['article']);
  });
});

describe('entityForItem (the overview router — by populated bag)', () => {
  const base: LensItem = { id: 'i', title: 't', url: 'https://x' };
  const change: ChangeData = {
    author: 'a',
    repo: 'o/r',
    reviewers: [],
    draft: false,
    updatedAt: 0,
  };
  const ticket: TicketData = {
    key: 'PAY-1',
    statusCategory: 'todo',
    statusLabel: 'To Do',
    updatedAt: 0,
  };

  test('a change bag → change', () => {
    expect(entityForItem({ ...base, change })).toBe('change');
  });
  test('a ticket bag → ticket (jira issue or git issue)', () => {
    expect(entityForItem({ ...base, ticket })).toBe('ticket');
  });
  test('an rss field cluster (publishedAt / excerpt / genre) → article', () => {
    expect(entityForItem({ ...base, publishedAt: 1 })).toBe('article');
    expect(entityForItem({ ...base, excerpt: 'x' })).toBe('article');
    expect(entityForItem({ ...base, genre: 'CSS' })).toBe('article');
  });
  test('no typed bag → generic', () => {
    expect(entityForItem(base)).toBe('generic');
    expect(entityForItem({ ...base, status: { tone: 'ok', label: 'Open' } })).toBe('generic');
  });
  test('precedence is change > ticket > article > generic for a multi-bag item', () => {
    expect(entityForItem({ ...base, change, ticket, publishedAt: 1 })).toBe('change');
    expect(entityForItem({ ...base, ticket, publishedAt: 1 })).toBe('ticket');
  });
});

describe('deriveLensKind', () => {
  const ACCOUNTS: Record<SourceId, SourceAccount> = {
    gh: { id: 'gh', provider: 'github', baseUrl: 'https://github.com' },
    gl: { id: 'gl', provider: 'gitlab', baseUrl: 'https://gitlab.com' },
    jira: { id: 'jira', provider: 'jira', baseUrl: 'https://acme.atlassian.net' },
    rss: { id: 'rss', provider: 'rss', baseUrl: 'https://news.example.com/rss' },
  };
  const getAccount = (id: SourceId): SourceAccount | undefined => ACCOUNTS[id];
  const refs = (...ids: SourceId[]): LensSourceRef[] =>
    ids.map((sourceId) => ({ sourceId, queries: sourceId === 'rss' ? [] : ['authored'] }));

  test('a git-only source set derives review', () => {
    expect(deriveLensKind(refs('gh'), getAccount)).toBe('review');
    expect(deriveLensKind(refs('gl'), getAccount)).toBe('review');
  });

  test('a feed-only source set derives general', () => {
    expect(deriveLensKind(refs('rss'), getAccount)).toBe('general');
  });

  test('a jira-only source set derives general (not a git provider)', () => {
    expect(deriveLensKind(refs('jira'), getAccount)).toBe('general');
  });

  test('a mixed set with any git source derives review', () => {
    expect(deriveLensKind(refs('rss', 'gh'), getAccount)).toBe('review');
    expect(deriveLensKind(refs('jira', 'gl', 'rss'), getAccount)).toBe('review');
  });

  test('an empty or all-dangling set derives general', () => {
    expect(deriveLensKind([], getAccount)).toBe('general');
    expect(deriveLensKind([{ sourceId: 'ghost', queries: ['authored'] }], getAccount)).toBe(
      'general',
    );
  });
});
