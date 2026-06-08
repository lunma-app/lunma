import { fireEvent, render } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import TabRowHarness from './TabRow.test.harness.svelte';

describe('TabRow', () => {
  test('renders the title', () => {
    const { container } = render(TabRowHarness, { props: { title: 'My Tab' } });
    const title = container.querySelector('.title') as HTMLElement;
    expect(title.textContent).toBe('My Tab');
  });

  test('renders the favicon image when faviconSrc is provided', async () => {
    const { container } = render(TabRowHarness, {
      props: { faviconSrc: 'chrome-extension://abc/_favicon/?pageUrl=https%3A%2F%2Fx%2F&size=16' },
    });
    // Preload-then-swap: the source is staged on the hidden preloader, promoted
    // to the visible image only once it has loaded.
    const preload = container.querySelector('img.favicon-preload') as HTMLImageElement;
    expect(preload).not.toBeNull();
    expect(preload.getAttribute('src')).toContain('_favicon');
    await fireEvent.load(preload);
    const img = container.querySelector('img.favicon-img') as HTMLImageElement;
    expect(img).not.toBeNull();
    expect(img.getAttribute('src')).toContain('_favicon');
  });

  test('falls back to a globe icon when no faviconSrc is given', () => {
    const { container } = render(TabRowHarness, { props: {} });
    expect(container.querySelector('img.favicon-img')).toBeNull();
    expect(container.querySelector('[data-icon-name="globe"]')).not.toBeNull();
  });

  test('falls back to a globe icon when the favicon image errors', async () => {
    const { container } = render(TabRowHarness, {
      props: { faviconSrc: 'chrome-extension://abc/_favicon/?pageUrl=bad' },
    });
    const preload = container.querySelector('img.favicon-preload') as HTMLImageElement;
    await fireEvent.error(preload);
    expect(container.querySelector('img.favicon-img')).toBeNull();
    expect(container.querySelector('[data-icon-name="globe"]')).not.toBeNull();
  });

  test('a CORP-blocked primary retries the endpoint, globe only if both fail', async () => {
    const { container } = render(TabRowHarness, {
      props: {
        faviconSrc: 'https://static.whatsapp.net/icon.webp',
        faviconFallbackSrc:
          'chrome-extension://abc/_favicon/?pageUrl=https%3A%2F%2Fweb.whatsapp.com%2F&size=16',
      },
    });
    let preload = container.querySelector('img.favicon-preload') as HTMLImageElement;
    expect(preload.getAttribute('src')).toBe('https://static.whatsapp.net/icon.webp');

    // Primary (CORP-blocked) fails → the endpoint is staged next, NOT the globe.
    await fireEvent.error(preload);
    preload = container.querySelector('img.favicon-preload') as HTMLImageElement;
    expect(preload.getAttribute('src')).toContain('_favicon');
    expect(container.querySelector('[data-icon-name="globe"]')).toBeNull();

    // Endpoint also fails → only now the globe.
    await fireEvent.error(preload);
    expect(container.querySelector('img.favicon-img')).toBeNull();
    expect(container.querySelector('[data-icon-name="globe"]')).not.toBeNull();
  });

  test('loading shows a spinner instead of favicon', () => {
    const { container } = render(TabRowHarness, {
      props: { loading: true, faviconSrc: 'chrome-extension://abc/_favicon/?pageUrl=x' },
    });
    expect(container.querySelector('img.favicon-img')).toBeNull();
    expect(container.querySelector('.spin [data-icon-name="loader-circle"]')).not.toBeNull();
  });

  test('active applies the active treatment', () => {
    const { container } = render(TabRowHarness, { props: { active: true } });
    const row = container.querySelector('[data-testid="tab-row"]') as HTMLElement;
    expect(row.classList.contains('active')).toBe(true);
    expect(row.getAttribute('data-active')).toBe('true');
  });

  test('drifted renders the drift indicator dot', () => {
    const { container } = render(TabRowHarness, { props: { drifted: true } });
    expect(container.querySelector('[data-testid="drift-dot"]')).not.toBeNull();
  });

  test('no drift dot by default', () => {
    const { container } = render(TabRowHarness, { props: {} });
    expect(container.querySelector('[data-testid="drift-dot"]')).toBeNull();
  });

  test('clicking the row body invokes onclick', async () => {
    const onclick = vi.fn();
    const { container } = render(TabRowHarness, { props: { onclick } });
    const hit = container.querySelector('button.hit') as HTMLButtonElement;
    await fireEvent.click(hit);
    expect(onclick).toHaveBeenCalledTimes(1);
  });

  test('clicking the trailing action does not invoke the row onclick', async () => {
    const onclick = vi.fn();
    const onTrailingClick = vi.fn();
    const { container } = render(TabRowHarness, {
      props: { onclick, withTrailing: true, onTrailingClick },
    });
    const trailing = container.querySelector(
      '[data-testid="trailing-action"]',
    ) as HTMLButtonElement;
    await fireEvent.click(trailing);
    expect(onTrailingClick).toHaveBeenCalledTimes(1);
    expect(onclick).not.toHaveBeenCalled();
  });

  test('renders the meta slot when provided', () => {
    const { container } = render(TabRowHarness, { props: { meta: '2h' } });
    expect(container.querySelector('[data-testid="tab-row-meta"]')?.textContent).toBe('2h');
  });

  test('omits the meta slot when not provided', () => {
    const { container } = render(TabRowHarness, { props: {} });
    expect(container.querySelector('[data-testid="tab-row-meta"]')).toBeNull();
  });

  test('meta + trailing share the swap region (no reserved gutter)', () => {
    const { container } = render(TabRowHarness, {
      props: { meta: '2h', withTrailing: true },
    });
    const end = container.querySelector('.row-end') as HTMLElement;
    expect(end).not.toBeNull();
    // Both the at-rest meta and the hover-revealed action occupy the SAME region,
    // so the actions claim no permanent column.
    expect(end.classList.contains('has-swap')).toBe(true);
    expect(end.querySelector('[data-testid="tab-row-meta"]')?.textContent).toBe('2h');
    expect(end.querySelector('[data-testid="trailing-action"]')).not.toBeNull();
  });

  test('meta-only row is not in swap mode (just shows the metadata)', () => {
    const { container } = render(TabRowHarness, { props: { meta: '2h' } });
    const end = container.querySelector('.row-end') as HTMLElement;
    expect(end.classList.contains('has-swap')).toBe(false);
    expect(end.querySelector('[data-testid="tab-row-meta"]')?.textContent).toBe('2h');
    expect(container.querySelector('[data-testid="trailing-action"]')).toBeNull();
  });

  test('trailing-only row is not in swap mode (classic reveal-on-hover)', () => {
    const { container } = render(TabRowHarness, { props: { withTrailing: true } });
    const end = container.querySelector('.row-end') as HTMLElement;
    expect(end.classList.contains('has-swap')).toBe(false);
    expect(container.querySelector('[data-testid="tab-row-meta"]')).toBeNull();
    expect(end.querySelector('[data-testid="trailing-action"]')).not.toBeNull();
  });
});
