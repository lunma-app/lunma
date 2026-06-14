import { describe, expect, test } from 'vitest';
import { requiredOriginsForNode } from './connector-origins';

// The single source of truth for "which origins does this folder's connector
// fetch" (least-privilege-permissions design D8), shared by the SW gate and the
// surfaces' grant request. The per-connector delegation is exercised in each
// `connectors/*.test.ts`; this covers the derivation directly.

describe('requiredOriginsForNode', () => {
  test('github.com fetches the api origin, not github.com (the headline D8 case)', () => {
    expect(requiredOriginsForNode({ source: 'github', baseUrl: 'https://github.com' })).toEqual([
      'https://api.github.com/*',
    ]);
  });

  test('GitHub Enterprise is same-origin under the baseUrl', () => {
    expect(requiredOriginsForNode({ source: 'github', baseUrl: 'https://ghe.acme.com' })).toEqual([
      'https://ghe.acme.com/*',
    ]);
  });

  test('gitlab / jira / rss each fetch their own baseUrl origin (port preserved)', () => {
    expect(
      requiredOriginsForNode({ source: 'gitlab', baseUrl: 'https://gitlab.example.com:8443/g' }),
    ).toEqual(['https://gitlab.example.com:8443/*']);
    expect(
      requiredOriginsForNode({ source: 'jira', baseUrl: 'https://acme.atlassian.net' }),
    ).toEqual(['https://acme.atlassian.net/*']);
    expect(
      requiredOriginsForNode({ source: 'rss', baseUrl: 'https://blog.example.com/feed.xml' }),
    ).toEqual(['https://blog.example.com/*']);
  });

  test('a malformed baseUrl yields an empty pattern (treated as ungranted), never throws', () => {
    expect(requiredOriginsForNode({ source: 'gitlab', baseUrl: 'not a url' })).toEqual(['']);
    // github with a malformed baseUrl can't be github.com → falls through to ''.
    expect(requiredOriginsForNode({ source: 'github', baseUrl: 'not a url' })).toEqual(['']);
  });
});
