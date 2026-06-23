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

  test('clicking the card fires onactivate', async () => {
    const onactivate = vi.fn();
    const { container } = render(FolderPageItem, { props: { ...base, onactivate } });
    await fireEvent.click(
      container.querySelector('[data-testid="folderpage-item"]') as HTMLButtonElement,
    );
    expect(onactivate).toHaveBeenCalledTimes(1);
  });
});
