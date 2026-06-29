import { fireEvent, render } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import { ICON_NAMES } from '../shared/icon-names';
import IconPickerHarness from './IconPicker.test.harness.svelte';

function tiles(container: HTMLElement): HTMLButtonElement[] {
  return Array.from(container.querySelectorAll<HTMLButtonElement>('[data-testid="icon-tile"]'));
}

describe('IconPicker', () => {
  test('renders the full catalogue with the selected tile checked', () => {
    const { container } = render(IconPickerHarness, { props: { value: 'star' } });
    // The empty state shows the whole catalogue (curated defaults first), not a
    // short list — every icon is a tile, browsable by scroll.
    expect(tiles(container)).toHaveLength(ICON_NAMES.length);
    // 'star' leads the curated defaults, so it's the first tile.
    expect(tiles(container)[0]?.getAttribute('data-icon')).toBe('star');
    const selected = container.querySelector('[data-selected="true"]') as HTMLButtonElement;
    expect(selected.getAttribute('data-icon')).toBe('star');
    expect(selected.getAttribute('aria-checked')).toBe('true');
  });

  test('the selected tile is the roving-tabindex entry point', () => {
    const { container } = render(IconPickerHarness, { props: { value: 'code' } });
    const codeTile = container.querySelector('[data-icon="code"]') as HTMLButtonElement;
    expect(codeTile.getAttribute('tabindex')).toBe('0');
    // Every other tile is removed from the tab order.
    const others = tiles(container).filter((t) => t.getAttribute('data-icon') !== 'code');
    expect(others.every((t) => t.getAttribute('tabindex') === '-1')).toBe(true);
  });

  test('ArrowRight moves focus and Enter selects the focused icon', async () => {
    const onselect = vi.fn();
    const { container } = render(IconPickerHarness, { props: { value: 'star', onselect } });
    const grid = container.querySelector('.grid') as HTMLElement;
    const first = tiles(container)[0] as HTMLButtonElement;
    first.focus();
    await fireEvent.keyDown(grid, { key: 'ArrowRight' });
    // SPACE_ICONS[1] is 'briefcase'.
    const second = container.querySelector('[data-icon="briefcase"]') as HTMLButtonElement;
    expect(document.activeElement).toBe(second);
    expect(second.getAttribute('tabindex')).toBe('0');
    await fireEvent.keyDown(grid, { key: 'Enter' });
    expect(onselect).toHaveBeenCalledWith('briefcase');
  });

  test('clicking a tile emits that icon', async () => {
    const onselect = vi.fn();
    const { container } = render(IconPickerHarness, { props: { value: 'star', onselect } });
    await fireEvent.click(container.querySelector('[data-icon="rocket"]') as HTMLButtonElement);
    expect(onselect).toHaveBeenCalledWith('rocket');
  });

  test('typing in the search box narrows the catalogue to matches', async () => {
    const { container } = render(IconPickerHarness, { props: { value: 'star' } });
    const search = container.querySelector('[data-testid="icon-search"]') as HTMLInputElement;

    // Empty state shows the whole catalogue, including 'anchor'.
    expect(container.querySelector('[data-icon="anchor"]')).not.toBeNull();

    await fireEvent.input(search, { target: { value: 'anchor' } });
    // The query narrows to matches: 'anchor' stays, a non-matching icon drops.
    expect(container.querySelector('[data-icon="anchor"]')).not.toBeNull();
    expect(container.querySelector('[data-icon="star"]')).toBeNull();
    expect(tiles(container).length).toBeLessThan(ICON_NAMES.length);

    // Clearing the box returns to the full catalogue.
    await fireEvent.input(search, { target: { value: '' } });
    expect(tiles(container)).toHaveLength(ICON_NAMES.length);
  });

  test('a search with no matches shows the empty message', async () => {
    const { container } = render(IconPickerHarness, { props: { value: 'star' } });
    const search = container.querySelector('[data-testid="icon-search"]') as HTMLInputElement;
    await fireEvent.input(search, { target: { value: 'zzzznotanicon' } });
    expect(tiles(container)).toHaveLength(0);
    expect(container.querySelector('.empty')).not.toBeNull();
  });

  test('a persistent polite live region announces the empty result-state (ICONPICKER-NEW1)', async () => {
    const { container } = render(IconPickerHarness, { props: { value: 'star' } });
    const status = container.querySelector('[data-testid="icon-status"]') as HTMLElement;
    // Always in the DOM (persistent region), polite, and empty while results show.
    expect(status).not.toBeNull();
    expect(status.getAttribute('role')).toBe('status');
    expect(status.textContent?.trim()).toBe('');
    const search = container.querySelector('[data-testid="icon-search"]') as HTMLInputElement;
    await fireEvent.input(search, { target: { value: 'zzzznotanicon' } });
    // The same region now carries the empty message (announced as it changes).
    expect(status.textContent).toContain('No icons match');
    // The visible copy is hidden from AT to avoid a double read.
    expect(container.querySelector('.empty')?.getAttribute('aria-hidden')).toBe('true');
  });

  test('selecting a searched icon emits it', async () => {
    const onselect = vi.fn();
    const { container } = render(IconPickerHarness, { props: { value: 'star', onselect } });
    const search = container.querySelector('[data-testid="icon-search"]') as HTMLInputElement;
    await fireEvent.input(search, { target: { value: 'anchor' } });
    await fireEvent.click(container.querySelector('[data-icon="anchor"]') as HTMLButtonElement);
    expect(onselect).toHaveBeenCalledWith('anchor');
  });
});
