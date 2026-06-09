import { describe, expect, test } from 'vitest';
import { sourceBadgeLabel } from './launcher-contract';

describe('sourceBadgeLabel', () => {
  test('the four data sources map to themselves', () => {
    expect(sourceBadgeLabel('tab')).toBe('tab');
    expect(sourceBadgeLabel('saved')).toBe('saved');
    expect(sourceBadgeLabel('bookmark')).toBe('bookmark');
    expect(sourceBadgeLabel('history')).toBe('history');
  });

  test('the synthesized action sources read naturally', () => {
    expect(sourceBadgeLabel('websearch')).toBe('search');
    expect(sourceBadgeLabel('navigate')).toBe('open');
  });
});
