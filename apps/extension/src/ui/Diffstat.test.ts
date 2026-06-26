import { render } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';
import DiffstatHarness from './Diffstat.test.harness.svelte';

const root = (c: HTMLElement) => c.querySelector('[data-testid="diffstat"]');

describe('Diffstat', () => {
  test('renders the +N −N numerals (never colour-only)', () => {
    const { container } = render(DiffstatHarness, { props: { additions: 112, deletions: 40 } });
    expect(root(container)?.querySelector('.add')?.textContent).toBe('+112');
    expect(root(container)?.querySelector('.del')?.textContent).toBe('−40');
  });

  test('collapses to nothing when neither side is known', () => {
    const { container } = render(DiffstatHarness, { props: {} });
    expect(root(container)).toBeNull();
  });

  test('a present-but-zero side renders its 0', () => {
    const { container } = render(DiffstatHarness, { props: { additions: 0, deletions: 5 } });
    expect(root(container)?.querySelector('.add')?.textContent).toBe('+0');
    expect(root(container)?.querySelector('.del')?.textContent).toBe('−5');
  });

  test('only one known side renders only that numeral', () => {
    const { container } = render(DiffstatHarness, { props: { additions: 7 } });
    expect(root(container)?.querySelector('.add')?.textContent).toBe('+7');
    expect(root(container)?.querySelector('.del')).toBeNull();
  });

  test('the bar is proportional to additions vs deletions', () => {
    const { container } = render(DiffstatHarness, { props: { additions: 75, deletions: 25 } });
    const add = root(container)?.querySelector('.seg-add') as HTMLElement;
    const del = root(container)?.querySelector('.seg-del') as HTMLElement;
    expect(add.style.width).toBe('75%');
    expect(del.style.width).toBe('25%');
  });
});
