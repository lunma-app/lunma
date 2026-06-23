import { cleanup, fireEvent, render } from '@testing-library/svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';
import FolderPageItem from './FolderPageItem.svelte';

afterEach(() => cleanup());

const base = {
  title: 'Fix the parser',
  faviconSrc: 'https://gitlab.example.com/favicon.ico',
  ariaLabel: 'Fix the parser',
  onactivate: () => undefined,
};

describe('FolderPageItem (smart-folder-page B-seam)', () => {
  test('a Phase-A card renders the title + a status dot, with NO content slots', () => {
    const { container, getByText } = render(FolderPageItem, {
      props: { ...base, status: { tone: 'ok' as const, label: 'Checks passed' } },
    });
    expect(getByText('Fix the parser')).toBeTruthy();
    expect(container.querySelector('[data-testid="folderpage-status-dot"]')).not.toBeNull();
    // The B-seam slots are absent (no rich content supplied) — a clean link card,
    // not a skeleton with empty boxes.
    expect(container.querySelector('.excerpt')).toBeNull();
    expect(container.querySelector('.hero')).toBeNull();
    expect(container.querySelector('.meta')).toBeNull();
  });

  test('a feed card shows the unread dot, cleared when read', () => {
    const unread = render(FolderPageItem, { props: { ...base, feed: true, read: false } });
    expect(
      unread.container
        .querySelector('[data-testid="folderpage-unread-dot"]')
        ?.classList.contains('cleared'),
    ).toBe(false);
    const read = render(FolderPageItem, { props: { ...base, feed: true, read: true } });
    expect(
      read.container
        .querySelector('[data-testid="folderpage-unread-dot"]')
        ?.classList.contains('cleared'),
    ).toBe(true);
  });

  test('optional rich content lights up additively (the future B change)', () => {
    const { container, getByText } = render(FolderPageItem, {
      props: { ...base, rich: { excerpt: 'A short summary of the item.', meta: '+112 −40' } },
    });
    expect(getByText('A short summary of the item.')).toBeTruthy();
    expect(getByText('+112 −40')).toBeTruthy();
    expect(container.querySelector('.excerpt')).not.toBeNull();
  });

  test('a feed card with no image renders a generated cover (serif initial)', () => {
    const withImage = render(FolderPageItem, {
      props: { ...base, feed: true, rich: { imageUrl: 'https://img.example.com/x.jpg' } },
    });
    expect(withImage.container.querySelector('[data-testid="folderpage-hero"]')).not.toBeNull();
    expect(
      withImage.container.querySelector('[data-testid="folderpage-hero-placeholder"]'),
    ).toBeNull();

    const noImage = render(FolderPageItem, {
      props: { ...base, title: 'Entre a sede', feed: true },
    });
    const placeholder = noImage.container.querySelector(
      '[data-testid="folderpage-hero-placeholder"]',
    );
    expect(placeholder).not.toBeNull();
    expect(placeholder?.querySelector('.initial')?.textContent).toBe('E');
  });

  test('a queue card has no hero region at all', () => {
    const { container } = render(FolderPageItem, {
      props: { ...base, status: { tone: 'ok' as const, label: 'Checks passed' } },
    });
    expect(container.querySelector('[data-testid="folderpage-hero"]')).toBeNull();
    expect(container.querySelector('[data-testid="folderpage-hero-placeholder"]')).toBeNull();
  });

  test('clicking the card fires onactivate', async () => {
    const onactivate = vi.fn();
    const { container } = render(FolderPageItem, { props: { ...base, onactivate } });
    await fireEvent.click(
      container.querySelector('[data-testid="folderpage-item"]') as HTMLButtonElement,
    );
    expect(onactivate).toHaveBeenCalledTimes(1);
  });
});
