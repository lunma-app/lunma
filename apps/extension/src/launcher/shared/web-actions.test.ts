import { describe, expect, test } from 'vitest';
import {
  BUILT_IN_ENGINES,
  buildEngineRegistry,
  DEFAULT_SEARCH_ENGINE,
} from '../../shared/search-engines';
import {
  buildSearchUrl,
  buildWebActionResults,
  classifyInput,
  resolveDefaultEngine,
  resolveEngine,
} from './web-actions';

const GOOGLE = DEFAULT_SEARCH_ENGINE;
const REGISTRY = buildEngineRegistry({
  customSearchUrl: 'https://kagi.com/search?q=%s',
  customSearchKeyword: 'k',
});

describe('classifyInput', () => {
  test('an http(s) scheme → url', () => {
    expect(classifyInput('https://example.com/x')).toBe('url');
    expect(classifyInput('http://example.com')).toBe('url');
    expect(classifyInput('  HTTPS://example.com  ')).toBe('url'); // trimmed + case-insensitive
  });

  test('a non-web scheme → search (never navigated)', () => {
    expect(classifyInput('javascript:alert(1)')).toBe('search');
    expect(classifyInput('file:///etc/passwd')).toBe('search');
    expect(classifyInput('chrome://settings')).toBe('search');
  });

  test('a scheme-less dotted token with no whitespace → ambiguous', () => {
    expect(classifyInput('react.dev')).toBe('ambiguous');
    expect(classifyInput('example.com/x')).toBe('ambiguous');
    expect(classifyInput('node.js')).toBe('ambiguous'); // last label ≥ 2 letters
  });

  test('localhost and IPv4 hosts → ambiguous', () => {
    expect(classifyInput('localhost')).toBe('ambiguous');
    expect(classifyInput('127.0.0.1')).toBe('ambiguous');
  });

  test('whitespace, or no dot, or a too-short TLD → search', () => {
    expect(classifyInput('how to center a div')).toBe('search');
    expect(classifyInput('react')).toBe('search');
    expect(classifyInput('a.b')).toBe('search'); // last label only 1 letter
    expect(classifyInput('foo.')).toBe('search'); // empty last label
  });

  test('an empty/whitespace input → search', () => {
    expect(classifyInput('')).toBe('search');
    expect(classifyInput('   ')).toBe('search');
  });
});

describe('buildSearchUrl', () => {
  test('encodeURIComponent-escapes the query into %s (spaces → %20)', () => {
    expect(buildSearchUrl(GOOGLE, 'react hooks')).toBe(
      'https://www.google.com/search?q=react%20hooks',
    );
  });

  test('escapes reserved characters', () => {
    expect(buildSearchUrl(GOOGLE, 'a&b=c?')).toBe('https://www.google.com/search?q=a%26b%3Dc%3F');
  });

  test('uses the engine template (not always Google)', () => {
    const ddg = BUILT_IN_ENGINES.find((e) => e.id === 'duckduckgo');
    if (!ddg) throw new Error('duckduckgo missing');
    expect(buildSearchUrl(ddg, 'lunma')).toBe('https://duckduckgo.com/?q=lunma');
  });
});

describe('resolveEngine', () => {
  test('a unique-prefix keyword recognizes the single engine and returns the remainder', () => {
    const youtube = BUILT_IN_ENGINES.find((e) => e.id === 'youtube');
    const resolved = resolveEngine('yt lofi beats', REGISTRY);
    expect(resolved.candidates).toEqual([youtube]);
    expect(resolved.query).toBe('lofi beats');
    expect(resolved.keywordToken).toBe('yt');
  });

  test('a bare keyword with no remainder recognizes the engine (empty query)', () => {
    const resolved = resolveEngine('yt', REGISTRY);
    expect(resolved.candidates.map((e) => e.id)).toEqual(['youtube']);
    expect(resolved.query).toBe('');
  });

  test('an ambiguous prefix yields every matching engine in registry order (for cycling)', () => {
    // `b` is a prefix of both `bing` and `brave`.
    const resolved = resolveEngine('b hello', REGISTRY);
    expect(resolved.candidates.map((e) => e.id)).toEqual(['bing', 'brave']);
    expect(resolved.query).toBe('hello');
  });

  test('a non-matching leading token returns the raw query with no candidates', () => {
    const resolved = resolveEngine('ytx lofi', REGISTRY);
    expect(resolved.candidates).toEqual([]);
    expect(resolved.query).toBe('ytx lofi');
  });

  test('a name prefix beyond the keyword still matches (go / goo / google → Google)', () => {
    // The bare keyword `g` is now an ambiguous prefix — it also leads chatgpt
    // (keyword `gpt`) and gemini (keyword `gem`/name "Gemini") — so it yields the
    // cycle set in registry order, Google first. Typing further disambiguates.
    expect(resolveEngine('g maps', REGISTRY).candidates.map((e) => e.id)).toEqual([
      'google',
      'chatgpt',
      'gemini',
    ]);
    for (const token of ['go', 'goo', 'goog', 'google']) {
      const resolved = resolveEngine(`${token} maps`, REGISTRY);
      expect(resolved.candidates.map((e) => e.id)).toEqual(['google']);
      expect(resolved.query).toBe('maps');
    }
  });

  test('a name prefix matches an engine whose keyword is not a name prefix (p / per → Perplexity)', () => {
    for (const token of ['p', 'pe', 'per', 'perplexity']) {
      expect(resolveEngine(token, REGISTRY).candidates.map((e) => e.id)).toEqual(['perplexity']);
    }
  });

  test('the short keyword alias still matches even when it is not a name prefix (yt → YouTube)', () => {
    // `yt` is not a prefix of "youtube", but it is the keyword.
    expect(resolveEngine('yt lofi', REGISTRY).candidates.map((e) => e.id)).toEqual(['youtube']);
    // …and the name prefix `you` / `youtube` reaches it too.
    expect(resolveEngine('you', REGISTRY).candidates.map((e) => e.id)).toEqual(['youtube']);
    expect(resolveEngine('duck', REGISTRY).candidates.map((e) => e.id)).toEqual(['duckduckgo']);
  });

  test('recognition is case-insensitive on both keyword and name', () => {
    expect(resolveEngine('YT lofi', REGISTRY).candidates.map((e) => e.id)).toEqual(['youtube']);
    expect(resolveEngine('Google maps', REGISTRY).candidates.map((e) => e.id)).toEqual(['google']);
    expect(resolveEngine('DDG x', REGISTRY).candidates.map((e) => e.id)).toEqual(['duckduckgo']);
  });

  test('a recognized custom keyword prefix resolves to the custom engine', () => {
    const resolved = resolveEngine('k lunma', REGISTRY);
    expect(resolved.candidates.map((e) => e.id)).toEqual(['custom']);
    expect(resolved.query).toBe('lunma');
  });

  test('the custom engine name is matchable by prefix too (cu / custom → custom)', () => {
    expect(resolveEngine('cu lunma', REGISTRY).candidates.map((e) => e.id)).toEqual(['custom']);
  });

  test('the engine-mode row built from buildSearchUrl carries the resolved engine URL', () => {
    const { candidates, query } = resolveEngine('yt lofi', REGISTRY);
    const engine = candidates[0];
    if (!engine) throw new Error('expected youtube to be recognized');
    expect(buildSearchUrl(engine, query)).toBe('https://www.youtube.com/results?search_query=lofi');
  });

  test('an empty / whitespace input recognizes no engine', () => {
    expect(resolveEngine('', REGISTRY).candidates).toEqual([]);
    expect(resolveEngine('   ', REGISTRY)).toEqual({ candidates: [], query: '   ' });
  });
});

describe('resolveDefaultEngine', () => {
  test('a built-in selection resolves to that engine', () => {
    expect(
      resolveDefaultEngine({ defaultSearchEngine: 'duckduckgo', customSearchUrl: '' }).id,
    ).toBe('duckduckgo');
    expect(
      resolveDefaultEngine({ defaultSearchEngine: 'perplexity', customSearchUrl: '' }).id,
    ).toBe('perplexity');
  });

  test('a valid custom template resolves to a custom engine', () => {
    const engine = resolveDefaultEngine({
      defaultSearchEngine: 'custom',
      customSearchUrl: 'https://kagi.com/search?q=%s',
    });
    expect(engine.id).toBe('custom');
    expect(engine.urlTemplate).toBe('https://kagi.com/search?q=%s');
  });

  test('a custom template missing %s falls back to google', () => {
    expect(
      resolveDefaultEngine({ defaultSearchEngine: 'custom', customSearchUrl: 'https://kagi.com' })
        .id,
    ).toBe('google');
  });
});

describe('buildWebActionResults', () => {
  test('a plain query yields only a websearch row (last)', () => {
    const { navigate, websearch } = buildWebActionResults('react hooks', GOOGLE);
    expect(navigate).toBeUndefined();
    expect(websearch.source).toBe('websearch');
    expect(websearch.title).toBe('Search Google for "react hooks"');
    expect(websearch.url).toBe('https://www.google.com/search?q=react%20hooks');
    expect(websearch.score).toBe(0);
  });

  test('a URL-shaped query yields a navigate row to the typed URL', () => {
    const { navigate, websearch } = buildWebActionResults('https://example.com/x', GOOGLE);
    expect(navigate?.source).toBe('navigate');
    expect(navigate?.url).toBe('https://example.com/x');
    expect(navigate?.title).toBe('Go to example.com/x'); // scheme stripped for the scan line
    expect(websearch.source).toBe('websearch'); // the websearch row is still present
  });

  test('an ambiguous token yields BOTH rows (https-prefixed navigate target)', () => {
    const { navigate, websearch } = buildWebActionResults('react.dev', GOOGLE);
    expect(navigate?.url).toBe('https://react.dev');
    expect(navigate?.title).toBe('Go to react.dev');
    expect(websearch.url).toBe('https://www.google.com/search?q=react.dev');
  });

  test('the websearch row echoes the resolved (custom) engine', () => {
    const engine = resolveDefaultEngine({
      defaultSearchEngine: 'custom',
      customSearchUrl: 'https://kagi.com/search?q=%s',
    });
    const { websearch } = buildWebActionResults('lunma', engine);
    expect(websearch.title).toBe('Search Custom for "lunma"');
    expect(websearch.url).toBe('https://kagi.com/search?q=lunma');
  });

  test('a non-web scheme is search-only (no navigate)', () => {
    expect(buildWebActionResults('javascript:alert(1)', GOOGLE).navigate).toBeUndefined();
  });
});
