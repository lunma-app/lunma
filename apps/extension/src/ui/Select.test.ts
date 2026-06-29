import { fireEvent, render } from '@testing-library/svelte';
import { tick } from 'svelte';
import { describe, expect, test, vi } from 'vitest';
import SelectHarness from './Select.test.harness.svelte';

function trigger(container: HTMLElement): HTMLButtonElement {
  return container.querySelector('[data-testid="select"]') as HTMLButtonElement;
}
function options(container: HTMLElement): HTMLButtonElement[] {
  return [...container.querySelectorAll('[data-testid="select-option"]')] as HTMLButtonElement[];
}

describe('Select', () => {
  test('the trigger shows the current value and is a listbox button', () => {
    const { container } = render(SelectHarness, { props: { value: 'duckduckgo' } });
    const t = trigger(container);
    expect(t.getAttribute('aria-haspopup')).toBe('listbox');
    expect(t.getAttribute('aria-label')).toBe('Default search engine');
    expect(t.textContent).toContain('DuckDuckGo');
  });

  test('the options popover is closed until the trigger is clicked', async () => {
    const { container } = render(SelectHarness, { props: {} });
    expect(options(container)).toHaveLength(0);
    expect(trigger(container).getAttribute('aria-expanded')).toBe('false');

    await fireEvent.click(trigger(container));
    expect(trigger(container).getAttribute('aria-expanded')).toBe('true');
    expect(options(container)).toHaveLength(3);
  });

  test('the current value is marked selected in the open list', async () => {
    const { container } = render(SelectHarness, { props: { value: 'duckduckgo' } });
    await fireEvent.click(trigger(container));
    const selected = options(container).find((o) => o.getAttribute('aria-selected') === 'true');
    expect(selected?.getAttribute('data-value')).toBe('duckduckgo');
  });

  test('choosing an option fires onchange and closes the list', async () => {
    const onchange = vi.fn();
    const { container } = render(SelectHarness, { props: { onchange } });
    await fireEvent.click(trigger(container));
    const custom = options(container).find((o) => o.getAttribute('data-value') === 'custom');
    await fireEvent.click(custom as HTMLButtonElement);
    expect(onchange).toHaveBeenCalledWith('custom');
    expect(options(container)).toHaveLength(0); // closed
  });

  test('a disabled option is not selectable', async () => {
    const onchange = vi.fn();
    const { container } = render(SelectHarness, {
      props: {
        options: [
          { value: 'a', label: 'A' },
          { value: 'b', label: 'B', disabled: true },
        ],
        value: 'a',
        onchange,
      },
    });
    await fireEvent.click(trigger(container));
    const b = options(container).find((o) => o.getAttribute('data-value') === 'b');
    expect((b as HTMLButtonElement).disabled).toBe(true);
  });

  test('each option button is owned directly by the listbox (li is role="presentation")', async () => {
    const { container } = render(SelectHarness, { props: {} });
    await fireEvent.click(trigger(container));
    const lis = [...container.querySelectorAll('.list li')];
    expect(lis.length).toBeGreaterThan(0);
    for (const li of lis) expect(li.getAttribute('role')).toBe('presentation');
  });

  test('ArrowDown skips a disabled option rather than dead-ending on it (SEL-03)', async () => {
    const { container } = render(SelectHarness, {
      props: {
        options: [
          { value: 'a', label: 'A' },
          { value: 'b', label: 'B', disabled: true },
          { value: 'c', label: 'C' },
        ],
        value: 'a',
      },
    });
    await fireEvent.click(trigger(container));
    await tick(); // focusSelectedSoon awaits a tick before focusing the current option
    expect((document.activeElement as HTMLElement)?.getAttribute('data-value')).toBe('a');
    await fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'ArrowDown' });
    expect((document.activeElement as HTMLElement)?.getAttribute('data-value')).toBe('c');
    // Wrap past the end back to the first enabled option.
    await fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'ArrowDown' });
    expect((document.activeElement as HTMLElement)?.getAttribute('data-value')).toBe('a');
  });

  test('End lands on the last ENABLED option, skipping a trailing disabled one (SEL-03)', async () => {
    const { container } = render(SelectHarness, {
      props: {
        options: [
          { value: 'a', label: 'A' },
          { value: 'b', label: 'B' },
          { value: 'c', label: 'C', disabled: true },
        ],
        value: 'a',
      },
    });
    await fireEvent.click(trigger(container));
    await tick();
    await fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'End' });
    expect((document.activeElement as HTMLElement)?.getAttribute('data-value')).toBe('b');
  });
});
