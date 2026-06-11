import { cleanup, fireEvent, render } from '@testing-library/svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';
import MenuHarness from './Menu.test.harness.svelte';
import type { MenuItem } from './menu-types';

afterEach(() => cleanup());

function items(overrides: Partial<MenuItem>[] = []): MenuItem[] {
  const base: MenuItem[] = [
    { id: 'rename', label: 'Rename', onSelect: vi.fn() },
    { id: 'delete', label: 'Delete', danger: true, onSelect: vi.fn() },
  ];
  return base.map((b, i) => ({ ...b, ...overrides[i] }));
}

describe('Menu', () => {
  test('renders a kebab trigger and no popover until opened', () => {
    const { container } = render(MenuHarness, { props: { items: items() } });
    expect(container.querySelector('[data-testid="menu-trigger"]')).not.toBeNull();
    expect(container.querySelector('[role="menu"]')).toBeNull();
    // It does NOT render a row/tab — it is a standalone kebab (the whole point
    // of the primitive, vs a row that composes a TabRow header).
    expect(container.querySelector('[data-testid="tab-row"]')).toBeNull();
  });

  test('opening the trigger reveals the items', async () => {
    const { container } = render(MenuHarness, { props: { items: items() } });
    await fireEvent.click(
      container.querySelector('[data-testid="menu-trigger"]') as HTMLButtonElement,
    );
    const els = [...container.querySelectorAll('[data-testid="menu-item"]')];
    expect(els.map((e) => e.getAttribute('data-menu-id'))).toEqual(['rename', 'delete']);
  });

  test('selecting an item fires onSelect and closes the menu', async () => {
    const onSelect = vi.fn();
    const { container } = render(MenuHarness, {
      props: { items: items([{ onSelect }]) },
    });
    await fireEvent.click(
      container.querySelector('[data-testid="menu-trigger"]') as HTMLButtonElement,
    );
    const rename = [...container.querySelectorAll('[data-testid="menu-item"]')].find(
      (e) => e.getAttribute('data-menu-id') === 'rename',
    ) as HTMLButtonElement;
    await fireEvent.click(rename);
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(container.querySelector('[role="menu"]')).toBeNull();
  });

  test('a keepOpen item fires onSelect but leaves the menu open', async () => {
    const onSelect = vi.fn();
    const { container } = render(MenuHarness, {
      props: { items: items([{ onSelect, keepOpen: true }]) },
    });
    await fireEvent.click(
      container.querySelector('[data-testid="menu-trigger"]') as HTMLButtonElement,
    );
    await fireEvent.click(
      [...container.querySelectorAll('[data-testid="menu-item"]')].find(
        (e) => e.getAttribute('data-menu-id') === 'rename',
      ) as HTMLButtonElement,
    );
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(container.querySelector('[role="menu"]')).not.toBeNull();
  });

  test('a danger item carries the danger class', async () => {
    const { container } = render(MenuHarness, { props: { items: items() } });
    await fireEvent.click(
      container.querySelector('[data-testid="menu-trigger"]') as HTMLButtonElement,
    );
    const del = [...container.querySelectorAll('[data-testid="menu-item"]')].find(
      (e) => e.getAttribute('data-menu-id') === 'delete',
    ) as HTMLButtonElement;
    expect(del.classList.contains('danger')).toBe(true);
  });
});
