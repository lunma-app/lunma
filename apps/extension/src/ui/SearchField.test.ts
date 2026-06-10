import { cleanup, fireEvent, render } from '@testing-library/svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';
import SearchFieldLeadingHarness from './SearchField.leading.test.harness.svelte';
import SearchField from './SearchField.svelte';

afterEach(() => cleanup());

describe('SearchField', () => {
  test('defaults to input mode', () => {
    const { container } = render(SearchField, { props: { testid: 'sf' } });
    const el = container.querySelector('[data-testid="sf"]') as HTMLElement;
    expect(el.tagName).toBe('INPUT');
  });

  describe('trigger mode', () => {
    test('renders a button with the placeholder and the keyboard hint', () => {
      const { container } = render(SearchField, {
        props: { mode: 'trigger', testid: 'sf', placeholder: 'Search tabs…', kbd: '⌥L' },
      });
      const btn = container.querySelector('[data-testid="sf"]') as HTMLButtonElement;
      expect(btn.tagName).toBe('BUTTON');
      expect(btn.textContent).toContain('Search tabs…');
      expect(container.querySelector('kbd.kbd')?.textContent).toBe('⌥L');
    });

    test('click fires onclick', async () => {
      const onclick = vi.fn();
      const { container } = render(SearchField, {
        props: { mode: 'trigger', testid: 'sf', onclick },
      });
      await fireEvent.click(container.querySelector('[data-testid="sf"]') as HTMLButtonElement);
      expect(onclick).toHaveBeenCalledTimes(1);
    });

    test('omits the kbd hint when none is given', () => {
      const { container } = render(SearchField, { props: { mode: 'trigger', testid: 'sf' } });
      expect(container.querySelector('kbd.kbd')).toBeNull();
    });
  });

  describe('input mode', () => {
    test('renders an input and fires oninput with the new value', async () => {
      const oninput = vi.fn();
      const { container } = render(SearchField, {
        props: { mode: 'input', testid: 'sf', oninput },
      });
      const input = container.querySelector('[data-testid="sf"]') as HTMLInputElement;
      expect(input.tagName).toBe('INPUT');
      await fireEvent.input(input, { target: { value: 'figma' } });
      expect(oninput).toHaveBeenCalledWith('figma');
    });

    test('Enter fires onenter', async () => {
      const onenter = vi.fn();
      const { container } = render(SearchField, {
        props: { mode: 'input', testid: 'sf', onenter },
      });
      const input = container.querySelector('[data-testid="sf"]') as HTMLInputElement;
      await fireEvent.keyDown(input, { key: 'Enter' });
      expect(onenter).toHaveBeenCalledTimes(1);
    });

    test('renders a leading slot between the icon and the input', () => {
      const { container } = render(SearchFieldLeadingHarness);
      const token = container.querySelector('[data-testid="leading-token"]');
      expect(token).not.toBeNull();
      expect(token?.textContent).toBe('YouTube');
      // The slot sits before the input within the pill.
      const slot = container.querySelector('.leading-slot') as HTMLElement;
      const input = container.querySelector('[data-testid="sf"]') as HTMLElement;
      expect(slot).not.toBeNull();
      expect(slot.compareDocumentPosition(input) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    test('carries no combobox ARIA by default', () => {
      const { container } = render(SearchField, { props: { mode: 'input', testid: 'sf' } });
      const input = container.querySelector('[data-testid="sf"]') as HTMLInputElement;
      expect(input.getAttribute('role')).toBeNull();
      expect(input.getAttribute('aria-autocomplete')).toBeNull();
      expect(input.getAttribute('aria-expanded')).toBeNull();
      expect(input.getAttribute('aria-controls')).toBeNull();
    });

    test('combobox mode wires role + aria-controls/expanded/activedescendant', () => {
      const { container } = render(SearchField, {
        props: {
          mode: 'input',
          testid: 'sf',
          combobox: true,
          controls: 'results-list',
          expanded: true,
          activeDescendant: 'results-list-opt-2',
        },
      });
      const input = container.querySelector('[data-testid="sf"]') as HTMLInputElement;
      expect(input.getAttribute('role')).toBe('combobox');
      expect(input.getAttribute('aria-autocomplete')).toBe('list');
      expect(input.getAttribute('aria-expanded')).toBe('true');
      expect(input.getAttribute('aria-controls')).toBe('results-list');
      expect(input.getAttribute('aria-activedescendant')).toBe('results-list-opt-2');
    });
  });
});
