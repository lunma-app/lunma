import { describe, expect, test } from 'vitest';
import { filterLabel, hostOf, ICON_BY_SOURCE, sourceIcon, sourceKey } from './lens-labels';
import type { ResolvedLensSource } from './types';

const cfg = (over: Partial<ResolvedLensSource> = {}): ResolvedLensSource => ({
  source: 'github',
  baseUrl: 'https://github.com',
  lensKind: 'general',
  sourceId: 'acc-1',
  ...over,
});

describe('sourceKey', () => {
  test('feed source (no query) keys by sourceId alone', () => {
    expect(sourceKey(cfg({ sourceId: 'acc-feed' }))).toBe('acc-feed');
  });

  test('queue source keys by sourceId and query', () => {
    expect(sourceKey(cfg({ query: 'authored' }))).toBe('acc-1:authored');
    expect(sourceKey(cfg({ query: 'review-requested' }))).toBe('acc-1:review-requested');
  });

  test('key is host-independent (port/baseUrl do not affect it)', () => {
    const selfHosted = cfg({
      source: 'gitlab',
      baseUrl: 'https://git.example.com:8443',
      sourceId: 'acc-self',
      query: 'review-requested',
    });
    expect(sourceKey(selfHosted)).toBe('acc-self:review-requested');
    // A malformed baseUrl no longer affects the key — the account id carries identity.
    expect(sourceKey(cfg({ baseUrl: 'not-a-url', sourceId: 'acc-x', query: 'authored' }))).toBe(
      'acc-x:authored',
    );
  });

  test('two same-host accounts derive distinct keys (no collision)', () => {
    const work = cfg({ sourceId: 'acc-work', query: 'authored' });
    const personal = cfg({ sourceId: 'acc-personal', query: 'authored' });
    expect(sourceKey(work)).toBe('acc-work:authored');
    expect(sourceKey(personal)).toBe('acc-personal:authored');
    expect(sourceKey(work)).not.toBe(sourceKey(personal));
  });
});

describe('sourceIcon', () => {
  test('known sources return the right icon', () => {
    expect(sourceIcon('github')).toBe('folder-git-2');
    expect(sourceIcon('gitlab')).toBe('folder-git-2');
    expect(sourceIcon('jira')).toBe('folder-kanban');
    expect(sourceIcon('rss')).toBe('rss');
  });

  test('unknown source falls back to folder', () => {
    expect(sourceIcon('unknown')).toBe('folder');
  });

  test('ICON_BY_SOURCE covers all known providers', () => {
    expect(ICON_BY_SOURCE).toMatchObject({
      gitlab: 'folder-git-2',
      github: 'folder-git-2',
      jira: 'folder-kanban',
      rss: 'rss',
    });
  });
});

describe('filterLabel', () => {
  test('"authored" → "authored" for all sources', () => {
    expect(filterLabel('github', 'authored')).toBe('authored');
    expect(filterLabel('jira', 'authored')).toBe('authored');
  });

  test('"assigned" → "assigned" for all sources', () => {
    expect(filterLabel('github', 'assigned')).toBe('assigned');
    expect(filterLabel('jira', 'assigned')).toBe('assigned');
  });

  test('"review-requested" → "reviewing" for github/gitlab, "Watching" for jira', () => {
    expect(filterLabel('github', 'review-requested')).toBe('reviewing');
    expect(filterLabel('gitlab', 'review-requested')).toBe('reviewing');
    expect(filterLabel('jira', 'review-requested')).toBe('Watching');
  });
});

describe('hostOf (re-exported from label-for)', () => {
  test('returns hostname (no port) for standard URLs', () => {
    expect(hostOf('https://github.com')).toBe('github.com');
    expect(hostOf('https://git.example.com:8443')).toBe('git.example.com');
  });

  test('returns empty string for malformed URLs', () => {
    expect(hostOf('not-a-url')).toBe('');
  });
});
