import { cleanup, fireEvent, render, waitFor } from '@testing-library/svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';
import BitsMenuHarness from './BitsMenu.test.harness.svelte';
import type { MenuItem } from './menu-types';

afterEach(() => cleanup());

function items(overrides: Partial<MenuItem>[] = []): MenuItem[] {
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

function menuItems(): HTMLElement[] {
  return [...document.querySelectorAll('[data-testid="menu-item"]')] as HTMLElement[];
}

describe('BitsMenu', () => {
  test('renders a kebab trigger and no popover until opened', () => {
    const { container } = render(BitsMenuHarness, { props: { items: items() } });
    expect(container.querySelector('[data-testid="menu-trigger"]')).not.toBeNull();
    expect(document.querySelector('[role="menu"]')).toBeNull();
    // Standalone kebab, not a row.
    expect(container.querySelector('[data-testid="tab-row"]')).toBeNull();
  });

  test('opening the trigger reveals the items (portaled, in order)', async () => {
    const { container } = render(BitsMenuHarness, { props: { items: items() } });
    await openMenu(container);
    await waitFor(() => expect(menuItems().length).toBe(2));
    expect(menuItems().map((e) => e.getAttribute('data-menu-id'))).toEqual(['rename', 'delete']);
  });

  test('selecting an item fires onSelect and closes the menu', async () => {
    const onSelect = vi.fn();
    const { container } = render(BitsMenuHarness, { props: { items: items([{ onSelect }]) } });
    await openMenu(container);
    await waitFor(() => expect(menuItems().length).toBe(2));
    const rename = menuItems().find(
      (e) => e.getAttribute('data-menu-id') === 'rename',
    ) as HTMLElement;
    await fireEvent.click(rename);
    expect(onSelect).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(document.querySelector('[role="menu"]')).toBeNull());
  });

  test('a keepOpen item fires onSelect but leaves the menu open', async () => {
    const onSelect = vi.fn();
    const { container } = render(BitsMenuHarness, {
      props: { items: items([{ onSelect, keepOpen: true }]) },
    });
    await openMenu(container);
    await waitFor(() => expect(menuItems().length).toBe(2));
    const rename = menuItems().find(
      (e) => e.getAttribute('data-menu-id') === 'rename',
    ) as HTMLElement;
    await fireEvent.click(rename);
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(document.querySelector('[role="menu"]')).not.toBeNull();
  });

  test('a danger item carries the danger class', async () => {
    const { container } = render(BitsMenuHarness, { props: { items: items() } });
    await openMenu(container);
    await waitFor(() => expect(menuItems().length).toBe(2));
    const del = menuItems().find((e) => e.getAttribute('data-menu-id') === 'delete') as HTMLElement;
    expect(del.classList.contains('danger')).toBe(true);
  });

  test('renders the optional titled header (uppercase kind + title)', async () => {
    const { container } = render(BitsMenuHarness, {
      props: { items: items(), headerKind: 'Tab', headerTitle: 'Docs' },
    });
    await openMenu(container);
    await waitFor(() => expect(menuItems().length).toBe(2));
    expect(document.querySelector('.lunma-menu-kind')?.textContent).toBe('Tab');
    expect(document.querySelector('.lunma-menu-title')?.textContent).toBe('Docs');
  });

  test('the open prop is controlled: a consumer can open AND close the menu through it', async () => {
    // Drive `open` purely via the bound prop (no trigger, no outside-click) so
    // this isolates the controlled path — the capability a `keepOpen` drill-in
    // editor needs to dismiss the menu when it finishes (the "menu stays open
    // after adding a lens" bug). Before this fix `open` was write-only-upward.
    const { rerender } = render(BitsMenuHarness, { props: { items: items(), open: true } });
    await waitFor(() => expect(menuItems().length).toBe(2));
    await rerender({ items: items(), open: false });
    await waitFor(() => expect(document.querySelector('[role="menu"]')).toBeNull());
  });

  test('Escape closes the menu', async () => {
    const { container } = render(BitsMenuHarness, { props: { items: items() } });
    await openMenu(container);
    await waitFor(() => expect(document.querySelector('[role="menu"]')).not.toBeNull());
    const menu = document.querySelector('[role="menu"]') as HTMLElement;
    await fireEvent.keyDown(menu, { key: 'Escape' });
    await waitFor(() => expect(document.querySelector('[role="menu"]')).toBeNull());
  });
});
