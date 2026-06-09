import { describe, expect, test } from 'vitest';
import { disambiguateSpaceName, normalizeSpaceName } from './space-names';

describe('normalizeSpaceName', () => {
  test('trims surrounding whitespace', () => {
    expect(normalizeSpaceName('  Work  ')).toBe('work');
    expect(normalizeSpaceName('Work\t')).toBe('work');
  });

  test('case-folds to lower case', () => {
    expect(normalizeSpaceName('WORK')).toBe('work');
    expect(normalizeSpaceName('Work')).toBe('work');
    expect(normalizeSpaceName('wOrK')).toBe('work');
  });

  test('trim + casefold together treat "Work", "work", " work " as one name', () => {
    const forms = ['Work', 'work', ' work ', 'WORK', '  WoRk'];
    const normalized = new Set(forms.map(normalizeSpaceName));
    expect(normalized.size).toBe(1);
    expect([...normalized][0]).toBe('work');
  });
});

describe('disambiguateSpaceName', () => {
  test('returns the desired name unchanged when its normalized form is free', () => {
    expect(disambiguateSpaceName('Work', new Set())).toBe('Work');
    expect(disambiguateSpaceName('Work', new Set(['personal']))).toBe('Work');
  });

  test('detects a collision under normalization (casefold + trim)', () => {
    // The taken-set holds normalized forms; a differently-cased desired collides.
    expect(disambiguateSpaceName('Work', new Set(['work']))).toBe('Work 2');
    expect(disambiguateSpaceName('  WORK ', new Set(['work']))).toBe('  WORK  2');
  });

  test('suffixing starts at 2', () => {
    expect(disambiguateSpaceName('Work', new Set(['work']))).toBe('Work 2');
  });

  test('walks past multiple taken suffixes to the lowest free one', () => {
    expect(disambiguateSpaceName('Work', new Set(['work', 'work 2']))).toBe('Work 3');
    expect(disambiguateSpaceName('Work', new Set(['work', 'work 2', 'work 3']))).toBe('Work 4');
  });

  test('skips a taken middle suffix and returns the first free one', () => {
    // "Work" and "Work 3" taken, "Work 2" free → returns "Work 2".
    expect(disambiguateSpaceName('Work', new Set(['work', 'work 3']))).toBe('Work 2');
  });

  test('is idempotent when re-run against its own output', () => {
    const taken = new Set(['work']);
    const first = disambiguateSpaceName('Work', taken); // "Work 2"
    expect(first).toBe('Work 2');
    // Re-running with the first result against the same set (which does NOT yet
    // contain "work 2") leaves it unchanged.
    expect(disambiguateSpaceName(first, taken)).toBe('Work 2');
    // And once its normalized form is in the set, it advances by one.
    taken.add(normalizeSpaceName(first));
    expect(disambiguateSpaceName('Work', taken)).toBe('Work 3');
  });

  test('does not mutate the passed-in set', () => {
    const taken = new Set(['work']);
    disambiguateSpaceName('Work', taken);
    expect([...taken]).toEqual(['work']);
  });
});
