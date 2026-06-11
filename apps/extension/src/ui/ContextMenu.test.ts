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
    expect(document.querySelector('[data-testid="context-menu"]')).toBeNull();
    // It is NOT a kebab: no menu-trigger button of its own.
    expect(container.querySelector('[data-testid="menu-trigger"]')).toBeNull();
  });

  test('a right-click opens the menu at the cursor with the items in order', async () => {
    const { container } = render(ContextMenuHarness, { props: { items: items() } });
    await rightClick(container.querySelector('[data-testid="anchor"]') as Element);
    expect(document.querySelector('[data-testid="context-menu"]')).not.toBeNull();
    const ids = [...document.querySelectorAll('[data-testid="context-menu-item"]')].map((e) =>
      e.getAttribute('data-menu-id'),
    );
    expect(ids).toEqual(['open', 'remove']);
  });

  test('selecting an item fires onSelect and closes the menu', async () => {
    const onSelect = vi.fn();
    const { container } = render(ContextMenuHarness, { props: { items: items([{ onSelect }]) } });
    await rightClick(container.querySelector('[data-testid="anchor"]') as Element);
    const open = [...document.querySelectorAll('[data-testid="context-menu-item"]')].find(
      (e) => e.getAttribute('data-menu-id') === 'open',
    ) as HTMLButtonElement;
    await fireEvent.click(open);
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(document.querySelector('[data-testid="context-menu"]')).toBeNull();
  });

  test('the danger item paints destructive', async () => {
    const { container } = render(ContextMenuHarness, { props: { items: items() } });
    await rightClick(container.querySelector('[data-testid="anchor"]') as Element);
    const remove = [...document.querySelectorAll('[data-testid="context-menu-item"]')].find(
      (e) => e.getAttribute('data-menu-id') === 'remove',
    ) as HTMLButtonElement;
    expect(remove.classList.contains('danger')).toBe(true);
  });

  test('Escape closes the menu', async () => {
    const { container } = render(ContextMenuHarness, { props: { items: items() } });
    await rightClick(container.querySelector('[data-testid="anchor"]') as Element);
    const panel = document.querySelector('[data-testid="context-menu"]') as HTMLElement;
    await fireEvent.keyDown(panel, { key: 'Escape' });
    expect(document.querySelector('[data-testid="context-menu"]')).toBeNull();
  });

  test('an outside pointerdown closes the menu', async () => {
    const { container } = render(ContextMenuHarness, { props: { items: items() } });
    await rightClick(container.querySelector('[data-testid="anchor"]') as Element);
    expect(document.querySelector('[data-testid="context-menu"]')).not.toBeNull();
    await fireEvent.pointerDown(document.body);
    expect(document.querySelector('[data-testid="context-menu"]')).toBeNull();
  });

  test('a keyboard-invoked menu (clientX/Y 0,0) anchors to the invoking row, not (0,0)', async () => {
    const { container } = render(ContextMenuHarness, { props: { items: items() } });
    const anchor = container.querySelector('[data-testid="anchor"]') as HTMLElement;
    // Stub the invoking element's rect (jsdom returns zeros).
    anchor.getBoundingClientRect = () =>
      ({
        left: 120,
        right: 320,
        top: 200,
        bottom: 234,
        width: 200,
        height: 34,
        x: 120,
        y: 200,
        toJSON: () => ({}),
      }) as DOMRect;

    // The menu-key / Shift+F10 signature: a contextmenu event with 0,0 coords.
    await fireEvent(
      anchor,
      new MouseEvent('contextmenu', { clientX: 0, clientY: 0, bubbles: true }),
    );
    const menu = document.querySelector('[data-testid="context-menu"]') as HTMLElement;
    expect(menu).not.toBeNull();
    // Anchored at the row's title column (left + inset) and vertically centred,
    // NOT at the viewport corner.
    expect(menu.style.left).toBe('148px'); // 120 + 28 inset
    expect(menu.style.top).toBe('217px'); // 200 + 34/2
  });

  test('a disabled item renders muted + aria-disabled and dispatches nothing on click', async () => {
    const onSelect = vi.fn();
    const { container } = render(ContextMenuHarness, {
      props: { items: items([{ disabled: true, onSelect }]) },
    });
    await rightClick(container.querySelector('[data-testid="anchor"]') as Element);
    const open = [...document.querySelectorAll('[data-testid="context-menu-item"]')].find(
      (e) => e.getAttribute('data-menu-id') === 'open',
    ) as HTMLButtonElement;
    expect(open.classList.contains('disabled')).toBe(true);
    expect(open.getAttribute('aria-disabled')).toBe('true');
    await fireEvent.click(open);
    // Inert: no dispatch, and the menu stays open (no close-on-select).
    expect(onSelect).not.toHaveBeenCalled();
    expect(document.querySelector('[data-testid="context-menu"]')).not.toBeNull();
  });
});
