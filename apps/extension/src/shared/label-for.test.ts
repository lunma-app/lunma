import { describe, expect, test } from 'vitest';
import { hostOf, labelFor } from './label-for';

describe('labelFor', () => {
  test('returns the title when present', () => {
    expect(labelFor('My Tab', 'https://example.com/')).toBe('My Tab');
  });

  test('falls back to the hostname when the title is empty', () => {
    expect(labelFor('', 'https://figma.com/file/abc')).toBe('figma.com');
  });

  test('falls back to Untitled when the URL is unparseable', () => {
    expect(labelFor('', 'not a url')).toBe('Untitled');
  });
});

describe('hostOf', () => {
  test('returns the hostname of a normal URL', () => {
    expect(hostOf('https://figma.com/file/abc')).toBe('figma.com');
  });

  test('returns the full host including a subdomain', () => {
    expect(hostOf('https://app.figma.com/board/123')).toBe('app.figma.com');
  });

  test('returns "" for an unparseable string', () => {
    expect(hostOf('not a url')).toBe('');
  });

  test('returns the host segment of a chrome:// URL', () => {
    expect(hostOf('chrome://extensions/')).toBe('extensions');
  });

  test('returns "" for a blob: URL (no hostname)', () => {
    expect(hostOf('blob:https://example.com/550e8400')).toBe('');
  });
});
