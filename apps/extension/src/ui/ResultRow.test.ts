import { fireEvent, render } from '@testing-library/svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';
import ResultRowHarness from './ResultRow.test.harness.svelte';

function row(container: HTMLElement): HTMLButtonElement {
  return container.querySelector('[data-testid="result-row"]') as HTMLButtonElement;
}

afterEach(() => {
  // The Comfort layout is keyed on the ambient density attribute — reset it so
  // it never leaks into the single-line tests.
  delete document.documentElement.dataset.density;
});

describe('ResultRow', () => {
  test('renders title, url, and the source badge', () => {
    const { container } = render(ResultRowHarness, {
      props: { title: 'Docs', url: 'https://docs.example/', source: 'bookmark' },
    });
    const el = row(container);
    expect(el.textContent).toContain('Docs');
    expect(el.textContent).toContain('https://docs.example/');
    expect(container.querySelector('[data-testid="result-badge"]')?.textContent?.trim()).toBe(
      'bookmark',
    );
  });

  test('maps the websearch source to a "search" badge', () => {
    const { container } = render(ResultRowHarness, {
      props: { title: 'Search Google for "x"', url: 'https://google/', source: 'websearch' },
    });
    expect(container.querySelector('[data-testid="result-badge"]')?.textContent?.trim()).toBe(
      'search',
    );
  });

  test('maps the navigate source to an "open" badge', () => {
    const { container } = render(ResultRowHarness, {
      props: { title: 'Go to react.dev', url: 'https://react.dev', source: 'navigate' },
    });
    expect(container.querySelector('[data-testid="result-badge"]')?.textContent?.trim()).toBe(
      'open',
    );
  });

  test('falls back to a globe when no favicon src', () => {
    const { container } = render(ResultRowHarness, { props: {} });
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('[data-icon-name="globe"]')).not.toBeNull();
  });

  test('renders the favicon img when a src is given', () => {
    const { container } = render(ResultRowHarness, {
      props: { faviconSrc: 'https://f/icon.png' },
    });
    const img = container.querySelector('img');
    expect(img?.getAttribute('src')).toBe('https://f/icon.png');
  });

  test('reflects the selected state', () => {
    const { container } = render(ResultRowHarness, { props: { selected: true } });
    expect(row(container).getAttribute('data-selected')).toBe('true');
    expect(row(container).getAttribute('aria-selected')).toBe('true');
  });

  test('fires onclick and onhover', async () => {
    const onclick = vi.fn();
    const onhover = vi.fn();
    const { container } = render(ResultRowHarness, { props: { onclick, onhover } });
    await fireEvent.mouseEnter(row(container));
    await fireEvent.click(row(container));
    expect(onhover).toHaveBeenCalledTimes(1);
    expect(onclick).toHaveBeenCalledTimes(1);
  });

  test('renders the same four parts under Comfort density (two-line reflow)', () => {
    // The Comfort row reflows to two lines via a grid-template swap keyed on the
    // ambient `:root[data-density='comfort']` — no element is added or removed,
    // so the favicon / title / type / url all still render (jsdom can't measure
    // the visual reflow; this asserts the structure survives the swap).
    document.documentElement.dataset.density = 'comfort';
    const { container } = render(ResultRowHarness, {
      props: {
        title: 'Comfort Docs',
        url: 'https://docs.example/guide',
        source: 'bookmark',
        faviconSrc: 'https://f/icon.png',
      },
    });
    const el = row(container);
    expect(container.querySelector('img')?.getAttribute('src')).toBe('https://f/icon.png');
    expect(el.textContent).toContain('Comfort Docs');
    expect(el.textContent).toContain('https://docs.example/guide');
    expect(container.querySelector('[data-testid="result-badge"]')?.textContent?.trim()).toBe(
      'bookmark',
    );
  });
});
