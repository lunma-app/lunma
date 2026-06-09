import { cleanup, fireEvent, render } from '@testing-library/svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';
import ContextMenuHarness from './ContextMenu.test.harness.svelte';
import type { MenuItem } from './menu-types';

afterEach(() => cleanup());

function items(overrides: Partial<MenuItem>[] = []): MenuItem[] {
  const base: MenuItem[] = [
    { id: 'open', label: 'Open', onSelect: vi.fn() },
    { id: 'remove', label: 'Remove', danger: true, onSelect: vi.fn() },
  ];
  return base.map((b, i) => ({ ...b, ...overrides[i] }));
}

function rightClick(node: Element): Promise<boolean> {
  return fireEvent(
    node,
    new MouseEvent('contextmenu', { button: 2, clientX: 40, clientY: 40, bubbles: true }),
  );
}

describe('ContextMenu', () => {
  test('renders nothing until opened (no built-in trigger)', () => {
    const { container } = render(ContextMenuHarness, { props: { items: items() } });
    expect(container.querySelector('[data-testid="context-menu"]')).toBeNull();
    // It is NOT a kebab: no menu-trigger button of its own.
    expect(container.querySelector('[data-testid="menu-trigger"]')).toBeNull();
  });

  test('a right-click opens the menu at the cursor with the items in order', async () => {
    const { container } = render(ContextMenuHarness, { props: { items: items() } });
    await rightClick(container.querySelector('[data-testid="anchor"]') as Element);
    expect(container.querySelector('[data-testid="context-menu"]')).not.toBeNull();
    const ids = [...container.querySelectorAll('[data-testid="context-menu-item"]')].map((e) =>
      e.getAttribute('data-menu-id'),
    );
    expect(ids).toEqual(['open', 'remove']);
  });

  test('selecting an item fires onSelect and closes the menu', async () => {
    const onSelect = vi.fn();
    const { container } = render(ContextMenuHarness, { props: { items: items([{ onSelect }]) } });
    await rightClick(container.querySelector('[data-testid="anchor"]') as Element);
    const open = [...container.querySelectorAll('[data-testid="context-menu-item"]')].find(
      (e) => e.getAttribute('data-menu-id') === 'open',
    ) as HTMLButtonElement;
    await fireEvent.click(open);
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(container.querySelector('[data-testid="context-menu"]')).toBeNull();
  });

  test('the danger item paints destructive', async () => {
    const { container } = render(ContextMenuHarness, { props: { items: items() } });
    await rightClick(container.querySelector('[data-testid="anchor"]') as Element);
    const remove = [...container.querySelectorAll('[data-testid="context-menu-item"]')].find(
      (e) => e.getAttribute('data-menu-id') === 'remove',
    ) as HTMLButtonElement;
    expect(remove.classList.contains('danger')).toBe(true);
  });

  test('Escape closes the menu', async () => {
    const { container } = render(ContextMenuHarness, { props: { items: items() } });
    await rightClick(container.querySelector('[data-testid="anchor"]') as Element);
    const panel = container.querySelector('[data-testid="context-menu"]') as HTMLElement;
    await fireEvent.keyDown(panel, { key: 'Escape' });
    expect(container.querySelector('[data-testid="context-menu"]')).toBeNull();
  });

  test('an outside pointerdown closes the menu', async () => {
    const { container } = render(ContextMenuHarness, { props: { items: items() } });
    await rightClick(container.querySelector('[data-testid="anchor"]') as Element);
    expect(container.querySelector('[data-testid="context-menu"]')).not.toBeNull();
    await fireEvent.pointerDown(document.body);
    expect(container.querySelector('[data-testid="context-menu"]')).toBeNull();
  });
});
