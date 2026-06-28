import { cleanup, fireEvent, render, waitFor } from '@testing-library/svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';
import MenuHarness from './Menu.test.harness.svelte';
import type { MenuItem } from './menu-types';

afterEach(() => cleanup());

// Both trigger surfaces honour the shared item contract; one suite per surface.

// ----- trigger='context' ----------------------

function contextItems(overrides: Partial<MenuItem>[] = []): MenuItem[] {
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

function contextMenuItems(): HTMLElement[] {
  return [...document.querySelectorAll('[data-testid="context-menu-item"]')] as HTMLElement[];
}

describe('Menu (trigger=context)', () => {
  test('renders the trigger region but no menu until right-clicked', () => {
    const { container } = render(MenuHarness, {
      props: { trigger: 'context', items: contextItems() },
    });
    expect(container.querySelector('[data-testid="anchor"]')).not.toBeNull();
    expect(document.querySelector('[data-testid="context-menu"]')).toBeNull();
    // Not a kebab: no menu-trigger of its own.
    expect(container.querySelector('[data-testid="menu-trigger"]')).toBeNull();
  });

  test('a right-click opens the menu with the items in order', async () => {
    const { container } = render(MenuHarness, {
      props: { trigger: 'context', items: contextItems() },
    });
    await rightClick(container.querySelector('[data-testid="anchor"]') as Element);
    await waitFor(() => expect(contextMenuItems().length).toBe(2));
    expect(document.querySelector('[data-testid="context-menu"]')).not.toBeNull();
    expect(contextMenuItems().map((e) => e.getAttribute('data-menu-id'))).toEqual([
      'open',
      'remove',
    ]);
  });

  test('selecting an item fires onSelect and closes the menu', async () => {
    const onSelect = vi.fn();
    const { container } = render(MenuHarness, {
      props: { trigger: 'context', items: contextItems([{ onSelect }]) },
    });
    await rightClick(container.querySelector('[data-testid="anchor"]') as Element);
    await waitFor(() => expect(contextMenuItems().length).toBe(2));
    const open = contextMenuItems().find(
      (e) => e.getAttribute('data-menu-id') === 'open',
    ) as HTMLElement;
    await fireEvent.click(open);
    expect(onSelect).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(document.querySelector('[data-testid="context-menu"]')).toBeNull());
  });

  test('the danger item paints destructive', async () => {
    const { container } = render(MenuHarness, {
      props: { trigger: 'context', items: contextItems() },
    });
    await rightClick(container.querySelector('[data-testid="anchor"]') as Element);
    await waitFor(() => expect(contextMenuItems().length).toBe(2));
    const remove = contextMenuItems().find(
      (e) => e.getAttribute('data-menu-id') === 'remove',
    ) as HTMLElement;
    expect(remove.classList.contains('danger')).toBe(true);
  });

  test('Escape closes the menu', async () => {
    const { container } = render(MenuHarness, {
      props: { trigger: 'context', items: contextItems() },
    });
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
    const { container } = render(MenuHarness, {
      props: { trigger: 'context', items: contextItems([{ disabled: true, onSelect }]) },
    });
    await rightClick(container.querySelector('[data-testid="anchor"]') as Element);
    await waitFor(() => expect(contextMenuItems().length).toBe(2));
    const open = contextMenuItems().find(
      (e) => e.getAttribute('data-menu-id') === 'open',
    ) as HTMLElement;
    expect(open.classList.contains('disabled')).toBe(true);
    expect(open.getAttribute('aria-disabled')).toBe('true');
    await fireEvent.click(open);
    expect(onSelect).not.toHaveBeenCalled();
    expect(document.querySelector('[data-testid="context-menu"]')).not.toBeNull();
  });
});

// ----- trigger='kebab' -------------------------------

function kebabItems(overrides: Partial<MenuItem>[] = []): MenuItem[] {
  const base: MenuItem[] = [
    { id: 'rename', label: 'Rename', onSelect: vi.fn() },
    { id: 'delete', label: 'Delete', danger: true, onSelect: vi.fn() },
  ];
  return base.map((b, i) => ({ ...b, ...overrides[i] }));
}

// bits-ui's DropdownMenu opens on pointerdown+pointerup; in jsdom a click on the
// trigger resolves the open. Items portal to <body>, so they're queried off
// `document`, not the render container.
async function openMenu(container: Element): Promise<void> {
  const trigger = container.querySelector('[data-testid="menu-trigger"]') as HTMLButtonElement;
  await fireEvent.pointerDown(trigger);
  await fireEvent.pointerUp(trigger);
  await fireEvent.click(trigger);
}

function kebabMenuItems(): HTMLElement[] {
  return [...document.querySelectorAll('[data-testid="menu-item"]')] as HTMLElement[];
}

describe('Menu (trigger=kebab)', () => {
  test('renders a kebab trigger and no popover until opened', () => {
    const { container } = render(MenuHarness, {
      props: { trigger: 'kebab', items: kebabItems() },
    });
    expect(container.querySelector('[data-testid="menu-trigger"]')).not.toBeNull();
    expect(document.querySelector('[role="menu"]')).toBeNull();
    // Standalone kebab, not a row.
    expect(container.querySelector('[data-testid="tab-row"]')).toBeNull();
  });

  test('opening the trigger reveals the items (portaled, in order)', async () => {
    const { container } = render(MenuHarness, {
      props: { trigger: 'kebab', items: kebabItems() },
    });
    await openMenu(container);
    await waitFor(() => expect(kebabMenuItems().length).toBe(2));
    expect(kebabMenuItems().map((e) => e.getAttribute('data-menu-id'))).toEqual([
      'rename',
      'delete',
    ]);
  });

  test('selecting an item fires onSelect and closes the menu', async () => {
    const onSelect = vi.fn();
    const { container } = render(MenuHarness, {
      props: { trigger: 'kebab', items: kebabItems([{ onSelect }]) },
    });
    await openMenu(container);
    await waitFor(() => expect(kebabMenuItems().length).toBe(2));
    const rename = kebabMenuItems().find(
      (e) => e.getAttribute('data-menu-id') === 'rename',
    ) as HTMLElement;
    await fireEvent.click(rename);
    expect(onSelect).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(document.querySelector('[role="menu"]')).toBeNull());
  });

  test('a keepOpen item fires onSelect but leaves the menu open', async () => {
    const onSelect = vi.fn();
    const { container } = render(MenuHarness, {
      props: { trigger: 'kebab', items: kebabItems([{ onSelect, keepOpen: true }]) },
    });
    await openMenu(container);
    await waitFor(() => expect(kebabMenuItems().length).toBe(2));
    const rename = kebabMenuItems().find(
      (e) => e.getAttribute('data-menu-id') === 'rename',
    ) as HTMLElement;
    await fireEvent.click(rename);
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(document.querySelector('[role="menu"]')).not.toBeNull();
  });

  test('a danger item carries the danger class', async () => {
    const { container } = render(MenuHarness, {
      props: { trigger: 'kebab', items: kebabItems() },
    });
    await openMenu(container);
    await waitFor(() => expect(kebabMenuItems().length).toBe(2));
    const del = kebabMenuItems().find(
      (e) => e.getAttribute('data-menu-id') === 'delete',
    ) as HTMLElement;
    expect(del.classList.contains('danger')).toBe(true);
  });

  test('renders the optional titled header (uppercase kind + title)', async () => {
    const { container } = render(MenuHarness, {
      props: { trigger: 'kebab', items: kebabItems(), headerKind: 'Tab', headerTitle: 'Docs' },
    });
    await openMenu(container);
    await waitFor(() => expect(kebabMenuItems().length).toBe(2));
    expect(document.querySelector('.lunma-menu-kind')?.textContent).toBe('Tab');
    expect(document.querySelector('.lunma-menu-title')?.textContent).toBe('Docs');
  });

  test('the open prop is controlled: a consumer can open AND close the menu through it', async () => {
    const { rerender } = render(MenuHarness, {
      props: { trigger: 'kebab', items: kebabItems(), open: true },
    });
    await waitFor(() => expect(kebabMenuItems().length).toBe(2));
    await rerender({ trigger: 'kebab', items: kebabItems(), open: false });
    await waitFor(() => expect(document.querySelector('[role="menu"]')).toBeNull());
  });

  test('Escape closes the menu', async () => {
    const { container } = render(MenuHarness, {
      props: { trigger: 'kebab', items: kebabItems() },
    });
    await openMenu(container);
    await waitFor(() => expect(document.querySelector('[role="menu"]')).not.toBeNull());
    const menu = document.querySelector('[role="menu"]') as HTMLElement;
    await fireEvent.keyDown(menu, { key: 'Escape' });
    await waitFor(() => expect(document.querySelector('[role="menu"]')).toBeNull());
  });
});
