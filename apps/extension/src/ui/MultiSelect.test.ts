import { fireEvent, render } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import MultiSelectHarness from './MultiSelect.test.harness.svelte';

function trigger(container: HTMLElement): HTMLButtonElement {
  return container.querySelector('[data-testid="multi-select"]') as HTMLButtonElement;
}
function options(container: HTMLElement): HTMLButtonElement[] {
  return [
    ...container.querySelectorAll('[data-testid="multi-select-option"]'),
  ] as HTMLButtonElement[];
}
function byValue(container: HTMLElement, value: string): HTMLButtonElement {
  return options(container).find(
    (o) => o.getAttribute('data-value') === value,
  ) as HTMLButtonElement;
}

describe('MultiSelect', () => {
  test('the trigger is a multiselectable listbox button showing the label', () => {
    const { container } = render(MultiSelectHarness, { props: { label: 'All feeds' } });
    const t = trigger(container);
    expect(t.getAttribute('aria-haspopup')).toBe('listbox');
    expect(t.getAttribute('aria-label')).toBe('Filter by feed');
    expect(t.textContent).toContain('All feeds');
  });

  test('the popover is closed until the trigger is clicked', async () => {
    const { container } = render(MultiSelectHarness, { props: {} });
    expect(options(container)).toHaveLength(0);
    await fireEvent.click(trigger(container));
    expect(trigger(container).getAttribute('aria-expanded')).toBe('true');
    expect(container.querySelector('[role="listbox"]')?.getAttribute('aria-multiselectable')).toBe(
      'true',
    );
    expect(options(container)).toHaveLength(3);
  });

  test('the trigger label is the parent-computed summary and selected rows are marked', async () => {
    const { container } = render(MultiSelectHarness, {
      props: { values: ['hn', 'verge'], label: '2 feeds' },
    });
    // The count lives in the parent summary, not a separate pill.
    expect(trigger(container).textContent).toContain('2 feeds');
    expect(container.querySelector('[data-testid="multi-select-count"]')).toBeNull();
    await fireEvent.click(trigger(container));
    const selected = options(container).filter((o) => o.getAttribute('aria-selected') === 'true');
    expect(selected.map((o) => o.getAttribute('data-value')).sort()).toEqual(['hn', 'verge']);
  });

  test('toggling a row adds it to the selection and keeps the list open', async () => {
    const onchange = vi.fn();
    const { container } = render(MultiSelectHarness, { props: { values: ['hn'], onchange } });
    await fireEvent.click(trigger(container));
    await fireEvent.click(byValue(container, 'verge'));
    expect(onchange).toHaveBeenCalledWith(['hn', 'verge']);
    expect(options(container)).toHaveLength(3); // stays open
  });

  test('toggling an already-selected row removes it', async () => {
    const onchange = vi.fn();
    const { container } = render(MultiSelectHarness, {
      props: { values: ['hn', 'verge'], onchange },
    });
    await fireEvent.click(trigger(container));
    await fireEvent.click(byValue(container, 'hn'));
    expect(onchange).toHaveBeenCalledWith(['verge']);
  });

  test('Clear empties the selection and is hidden when nothing is selected', async () => {
    const onchange = vi.fn();
    const { container, rerender } = render(MultiSelectHarness, {
      props: { values: ['hn'], onchange },
    });
    await fireEvent.click(trigger(container));
    const clear = container.querySelector(
      '[data-testid="multi-select-clear"]',
    ) as HTMLButtonElement;
    expect(clear).not.toBeNull();
    await fireEvent.click(clear);
    expect(onchange).toHaveBeenCalledWith([]);

    await rerender({ values: [], onchange });
    await fireEvent.click(trigger(container));
    expect(container.querySelector('[data-testid="multi-select-clear"]')).toBeNull();
  });

  test('a disabled option is not selectable', async () => {
    const onchange = vi.fn();
    const { container } = render(MultiSelectHarness, {
      props: {
        options: [
          { value: 'a', label: 'A' },
          { value: 'b', label: 'B', disabled: true },
        ],
        onchange,
      },
    });
    await fireEvent.click(trigger(container));
    const b = byValue(container, 'b');
    expect(b.disabled).toBe(true);
  });

  const many = Array.from({ length: 10 }, (_, i) => ({ value: `f${i}`, label: `Feed ${i}` }));
  const search = (c: HTMLElement) =>
    c.querySelector('[data-testid="multi-select-search"]') as HTMLInputElement | null;

  test('no search field renders at or below the threshold', async () => {
    const { container } = render(MultiSelectHarness, { props: {} }); // 3 options, threshold 8
    await fireEvent.click(trigger(container));
    expect(search(container)).toBeNull();
  });

  test('search appears past the threshold and filters the rows by label', async () => {
    const { container } = render(MultiSelectHarness, { props: { options: many } });
    await fireEvent.click(trigger(container));
    const field = search(container);
    expect(field).not.toBeNull();
    expect(options(container)).toHaveLength(10);
    await fireEvent.input(field as HTMLInputElement, { target: { value: 'Feed 3' } });
    const shown = options(container);
    expect(shown).toHaveLength(1);
    expect(shown[0]?.getAttribute('data-value')).toBe('f3');
  });

  test('search matches by subsequence (fuzzy), not just substring', async () => {
    const { container } = render(MultiSelectHarness, { props: { options: many } });
    await fireEvent.click(trigger(container));
    // 'fd3' is not a substring of 'Feed 3' but is a subsequence (f…d… 3).
    await fireEvent.input(search(container) as HTMLInputElement, { target: { value: 'fd3' } });
    const shown = options(container);
    expect(shown).toHaveLength(1);
    expect(shown[0]?.getAttribute('data-value')).toBe('f3');
  });

  test('search also matches an option keyword that the visible label omits', async () => {
    const kw = [
      ...Array.from({ length: 8 }, (_, i) => ({ value: `r${i}`, label: `Repo ${i}` })),
      { value: 'hn', label: 'Hacker News', keywords: 'rss news.example.com' },
    ];
    const { container } = render(MultiSelectHarness, { props: { options: kw } });
    await fireEvent.click(trigger(container));
    // 'rss' is nowhere in any visible label — only in the Hacker News keyword.
    await fireEvent.input(search(container) as HTMLInputElement, { target: { value: 'rss' } });
    const shown = options(container);
    expect(shown).toHaveLength(1);
    expect(shown[0]?.getAttribute('data-value')).toBe('hn');
  });

  test('inline mode renders an always-open list with no trigger', () => {
    const { container } = render(MultiSelectHarness, { props: { mode: 'inline' } });
    // No trigger button, and the rows are visible without any activation.
    expect(container.querySelector('[aria-haspopup="listbox"]')).toBeNull();
    expect(options(container)).toHaveLength(3);
  });

  const selectAllBtn = (c: HTMLElement) =>
    c.querySelector('[data-testid="multi-select-all"]') as HTMLButtonElement | null;

  test('Select all appears only while not every option is selected, and picks all', async () => {
    const onchange = vi.fn();
    const { container, rerender } = render(MultiSelectHarness, {
      props: { values: ['hn'], selectAllLabel: 'Select all', onchange },
    });
    await fireEvent.click(trigger(container));
    expect(selectAllBtn(container)).not.toBeNull();
    await fireEvent.click(selectAllBtn(container) as HTMLButtonElement);
    // Every option becomes selected (existing 'hn' kept, no duplicates).
    expect(onchange).toHaveBeenCalledWith(['hn', 'lobsters', 'verge']);

    // Once everything is selected, Select all hides (the toggle's other half is Clear).
    await rerender({ values: ['hn', 'lobsters', 'verge'], selectAllLabel: 'Select all', onchange });
    await fireEvent.click(trigger(container));
    expect(selectAllBtn(container)).toBeNull();
  });

  test('Select all skips disabled options (and they do not block the all-selected state)', async () => {
    const onchange = vi.fn();
    const opts = [
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B', disabled: true },
    ];
    const { container, rerender } = render(MultiSelectHarness, {
      props: { options: opts, values: [], selectAllLabel: 'Select all', onchange },
    });
    await fireEvent.click(trigger(container));
    await fireEvent.click(selectAllBtn(container) as HTMLButtonElement);
    expect(onchange).toHaveBeenCalledWith(['a']); // 'b' is disabled, never selected

    // With every ENABLED option selected, Select all hides even though 'b' is unticked.
    await rerender({ options: opts, values: ['a'], selectAllLabel: 'Select all', onchange });
    await fireEvent.click(trigger(container));
    expect(selectAllBtn(container)).toBeNull();
  });

  test('a leading snippet provides the row identity; the plain label is suppressed', async () => {
    const { container } = render(MultiSelectHarness, { props: { withLeading: true } });
    await fireEvent.click(trigger(container));
    const row = byValue(container, 'hn');
    // The leading content renders inside the row…
    expect(row.querySelector('[data-testid="lead-content"]')?.textContent).toContain('Hacker News');
    // …the duplicate plain-label span is gone…
    expect(row.querySelector('.opt-label')).toBeNull();
    // …but the option keeps its label as its accessible name.
    expect(row.getAttribute('aria-label')).toBe('Hacker News');
  });
});
