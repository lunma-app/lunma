import { cleanup, fireEvent, render, waitFor } from '@testing-library/svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';
import BitsContextMenuHarness from './BitsContextMenu.test.harness.svelte';
import type { MenuItem } from './menu-types';

afterEach(() => cleanup());

function items(overrides: Partial<MenuItem>[] = []): MenuItem[] {
  const base: MenuItem[] = [
    { id: 'open', label: 'Open', onSelect: vi.fn() },
    { id: 'remove', label: 'Remove', danger: true, onSelect: vi.fn() },
  ];
  return base.map((b, i) => ({ ...b, ...overrides[i] }));
}

// bits-ui's ContextMenu opens on a `contextmenu` event on its trigger region.
function rightClick(node: Element): Promise<boolean> {
  return fireEvent(
    node,
    new MouseEvent('contextmenu', { button: 2, clientX: 40, clientY: 40, bubbles: true }),
  );
}

function menuItems(): HTMLElement[] {
  return [...document.querySelectorAll('[data-testid="context-menu-item"]')] as HTMLElement[];
}

describe('BitsContextMenu', () => {
  test('renders the trigger region but no menu until right-clicked', () => {
    const { container } = render(BitsContextMenuHarness, { props: { items: items() } });
    expect(container.querySelector('[data-testid="anchor"]')).not.toBeNull();
    expect(document.querySelector('[data-testid="context-menu"]')).toBeNull();
    // Not a kebab: no menu-trigger of its own.
    expect(container.querySelector('[data-testid="menu-trigger"]')).toBeNull();
  });

  test('a right-click opens the menu with the items in order', async () => {
    const { container } = render(BitsContextMenuHarness, { props: { items: items() } });
    await rightClick(container.querySelector('[data-testid="anchor"]') as Element);
    await waitFor(() => expect(menuItems().length).toBe(2));
    expect(document.querySelector('[data-testid="context-menu"]')).not.toBeNull();
    expect(menuItems().map((e) => e.getAttribute('data-menu-id'))).toEqual(['open', 'remove']);
  });

  test('selecting an item fires onSelect and closes the menu', async () => {
    const onSelect = vi.fn();
    const { container } = render(BitsContextMenuHarness, {
      props: { items: items([{ onSelect }]) },
    });
    await rightClick(container.querySelector('[data-testid="anchor"]') as Element);
    await waitFor(() => expect(menuItems().length).toBe(2));
    const open = menuItems().find((e) => e.getAttribute('data-menu-id') === 'open') as HTMLElement;
    await fireEvent.click(open);
    expect(onSelect).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(document.querySelector('[data-testid="context-menu"]')).toBeNull());
  });

  test('the danger item paints destructive', async () => {
    const { container } = render(BitsContextMenuHarness, { props: { items: items() } });
    await rightClick(container.querySelector('[data-testid="anchor"]') as Element);
    await waitFor(() => expect(menuItems().length).toBe(2));
    const remove = menuItems().find(
      (e) => e.getAttribute('data-menu-id') === 'remove',
    ) as HTMLElement;
    expect(remove.classList.contains('danger')).toBe(true);
  });

  test('Escape closes the menu', async () => {
    const { container } = render(BitsContextMenuHarness, { props: { items: items() } });
    await rightClick(container.querySelector('[data-testid="anchor"]') as Element);
    await waitFor(() =>
      expect(document.querySelector('[data-testid="context-menu"]')).not.toBeNull(),
    );
    const menu = document.querySelector('[data-testid="context-menu"]') as HTMLElement;
    await fireEvent.keyDown(menu, { key: 'Escape' });
    await waitFor(() => expect(document.querySelector('[data-testid="context-menu"]')).toBeNull());
  });

  test('a disabled item renders muted + aria-disabled and dispatches nothing on click', async () => {
    const onSelect = vi.fn();
    const { container } = render(BitsContextMenuHarness, {
      props: { items: items([{ disabled: true, onSelect }]) },
    });
    await rightClick(container.querySelector('[data-testid="anchor"]') as Element);
    await waitFor(() => expect(menuItems().length).toBe(2));
    const open = menuItems().find((e) => e.getAttribute('data-menu-id') === 'open') as HTMLElement;
    expect(open.classList.contains('disabled')).toBe(true);
    expect(open.getAttribute('aria-disabled')).toBe('true');
    await fireEvent.click(open);
    expect(onSelect).not.toHaveBeenCalled();
    expect(document.querySelector('[data-testid="context-menu"]')).not.toBeNull();
  });
});
