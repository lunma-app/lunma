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
  test('cloud source (no port, no query)', () => {
    expect(sourceKey(cfg())).toBe('github:github.com');
  });

  test('cloud source with query', () => {
    expect(sourceKey(cfg({ query: 'authored' }))).toBe('github:github.com:authored');
    expect(sourceKey(cfg({ query: 'review-requested' }))).toBe(
      'github:github.com:review-requested',
    );
  });

  test('self-hosted on a non-default port includes the port', () => {
    const selfHosted = cfg({
      source: 'gitlab',
      baseUrl: 'https://git.example.com:8443',
      query: 'review-requested',
    });
    expect(sourceKey(selfHosted)).toBe('gitlab:git.example.com:8443:review-requested');
  });

  test('self-hosted on non-default port without query', () => {
    expect(sourceKey(cfg({ source: 'gitlab', baseUrl: 'https://git.example.com:8443' }))).toBe(
      'gitlab:git.example.com:8443',
    );
  });

  test('malformed baseUrl degrades to the raw string as host segment', () => {
    expect(sourceKey(cfg({ baseUrl: 'not-a-url' }))).toBe('github:not-a-url');
    expect(sourceKey(cfg({ baseUrl: 'not-a-url', query: 'authored' }))).toBe(
      'github:not-a-url:authored',
    );
  });

  test('parity: cloud source key matches across github/gitlab/jira/rss', () => {
    const providers = ['github', 'gitlab', 'jira', 'rss'] as const;
    for (const source of providers) {
      const k = sourceKey(cfg({ source, baseUrl: `https://${source}.com` }));
      expect(k).toBe(`${source}:${source}.com`);
    }
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
