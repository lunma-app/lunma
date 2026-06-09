import { fireEvent, render } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import IconPickerHarness from './IconPicker.test.harness.svelte';
import { SPACE_ICONS } from './space-icons';

function tiles(container: HTMLElement): HTMLButtonElement[] {
  return Array.from(container.querySelectorAll<HTMLButtonElement>('[data-testid="icon-tile"]'));
}

describe('IconPicker', () => {
  test('renders the curated shortlist with the selected tile checked', () => {
    const { container } = render(IconPickerHarness, { props: { value: 'star' } });
    expect(tiles(container)).toHaveLength(SPACE_ICONS.length);
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

  test('typing in the search box filters the full catalogue, beyond the shortlist', async () => {
    const { container } = render(IconPickerHarness, { props: { value: 'star' } });
    const search = container.querySelector('[data-testid="icon-search"]') as HTMLInputElement;

    // 'anchor' is in the full catalogue but NOT in the curated shortlist.
    expect(container.querySelector('[data-icon="anchor"]')).toBeNull();
    await fireEvent.input(search, { target: { value: 'anchor' } });
    expect(container.querySelector('[data-icon="anchor"]')).not.toBeNull();

    // Clearing the box returns to the shortlist.
    await fireEvent.input(search, { target: { value: '' } });
    expect(tiles(container)).toHaveLength(SPACE_ICONS.length);
  });

  test('a search with no matches shows the empty message', async () => {
    const { container } = render(IconPickerHarness, { props: { value: 'star' } });
    const search = container.querySelector('[data-testid="icon-search"]') as HTMLInputElement;
    await fireEvent.input(search, { target: { value: 'zzzznotanicon' } });
    expect(tiles(container)).toHaveLength(0);
    expect(container.querySelector('.empty')).not.toBeNull();
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
