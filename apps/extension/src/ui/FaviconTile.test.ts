import { fireEvent, render } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import FaviconTileHarness from './FaviconTile.test.harness.svelte';

describe('FaviconTile', () => {
  test('renders the favicon image, icon-only (no inline title), with the title reachable on hover', async () => {
    const { container } = render(FaviconTileHarness, {
      props: {
        title: 'My Favorite',
        faviconSrc: 'chrome-extension://abc/_favicon/?pageUrl=https%3A%2F%2Fx%2F&size=16',
      },
    });
    // Preload-then-swap: the source is staged on the hidden preloader, promoted
    // to the visible image only once it has loaded.
    const preload = container.querySelector('img.favicon-preload') as HTMLImageElement;
    expect(preload).not.toBeNull();
    await fireEvent.load(preload);
    const img = container.querySelector('img.favicon-img') as HTMLImageElement;
    expect(img).not.toBeNull();
    expect(img.getAttribute('src')).toContain('_favicon');
    const tile = container.querySelector('[data-testid="favicon-tile"]') as HTMLElement;
    // Icon-only: the title is the accessible name (hover/tooltip), never inline text.
    expect(tile.textContent?.trim()).toBe('');
    expect(tile.getAttribute('aria-label')).toBe('My Favorite');
  });

  test('falls back to a globe when no faviconSrc is given (identical to a tab row)', () => {
    const { container } = render(FaviconTileHarness, { props: {} });
    expect(container.querySelector('img.favicon-img')).toBeNull();
    expect(container.querySelector('[data-icon-name="globe"]')).not.toBeNull();
  });

  test('falls back to a globe when the favicon image errors', async () => {
    const { container } = render(FaviconTileHarness, {
      props: { faviconSrc: 'chrome-extension://abc/_favicon/?pageUrl=bad' },
    });
    const preload = container.querySelector('img.favicon-preload') as HTMLImageElement;
    await fireEvent.error(preload);
    expect(container.querySelector('img.favicon-img')).toBeNull();
    expect(container.querySelector('[data-icon-name="globe"]')).not.toBeNull();
  });

  test('a CORP-blocked primary retries the endpoint, globe only if both fail', async () => {
    const { container } = render(FaviconTileHarness, {
      props: {
        faviconSrc: 'https://static.whatsapp.net/icon.webp',
        faviconFallbackSrc:
          'chrome-extension://abc/_favicon/?pageUrl=https%3A%2F%2Fweb.whatsapp.com%2F&size=64',
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

  test('active renders the active wash treatment', () => {
    const { container } = render(FaviconTileHarness, { props: { active: true } });
    const tile = container.querySelector('[data-testid="favicon-tile"]') as HTMLElement;
    expect(tile.classList.contains('active')).toBe(true);
    expect(tile.getAttribute('data-active')).toBe('true');
  });

  test('loading swaps the favicon for the shared spinner', () => {
    const { container } = render(FaviconTileHarness, {
      props: { loading: true, faviconSrc: 'chrome-extension://abc/_favicon/?pageUrl=x' },
    });
    expect(container.querySelector('img.favicon-img')).toBeNull();
    expect(container.querySelector('.spin [data-icon-name="loader-circle"]')).not.toBeNull();
  });

  test('drifted renders the shared drift dot', () => {
    const { container } = render(FaviconTileHarness, { props: { drifted: true } });
    expect(container.querySelector('[data-testid="drift-dot"]')).not.toBeNull();
  });

  test('unbound dims the tile and suppresses drift + active (no live tab)', () => {
    const { container } = render(FaviconTileHarness, {
      props: { unbound: true, active: true, drifted: true },
    });
    const tile = container.querySelector('[data-testid="favicon-tile"]') as HTMLElement;
    expect(tile.classList.contains('unbound')).toBe(true);
    // Dormant overrides: neither active nor drift may render.
    expect(tile.classList.contains('active')).toBe(false);
    expect(tile.getAttribute('data-active')).toBe('false');
    expect(container.querySelector('[data-testid="drift-dot"]')).toBeNull();
  });

  test('favoriting applies the one-shot pulse entrance class', () => {
    const { container } = render(FaviconTileHarness, { props: { favoriting: true } });
    const tile = container.querySelector('[data-testid="favicon-tile"]') as HTMLElement;
    expect(tile.classList.contains('favoriting')).toBe(true);
  });

  test('clicking the tile invokes onclick', async () => {
    const onclick = vi.fn();
    const { container } = render(FaviconTileHarness, { props: { onclick } });
    await fireEvent.click(container.querySelector('[data-testid="favicon-tile"]') as HTMLElement);
    expect(onclick).toHaveBeenCalledTimes(1);
  });
});
