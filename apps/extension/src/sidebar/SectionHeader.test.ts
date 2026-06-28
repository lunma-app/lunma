import { cleanup, fireEvent, render, waitFor } from '@testing-library/svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';
import SectionHeaderHarness from './SectionHeader.test.harness.svelte';

afterEach(() => cleanup());

// Menu (bits-ui DropdownMenu) opens on pointerdown+pointerup; in jsdom a
// click resolves the open. Its items portal to <body>, so they are queried off
// `document`, not the render container.
async function openKebab(container: Element): Promise<void> {
  const trigger = container.querySelector('[data-testid="menu-trigger"]') as HTMLButtonElement;
  await fireEvent.pointerDown(trigger);
  await fireEvent.pointerUp(trigger);
  await fireEvent.click(trigger);
}

function menuItems(): HTMLElement[] {
  return [...document.querySelectorAll('[data-testid="menu-item"]')] as HTMLElement[];
}

describe('SectionHeader', () => {
  test('renders label and icon, and no count', () => {
    const { container } = render(SectionHeaderHarness, {
      props: { icon: 'pin' as const, label: 'Pinned' },
    });
    const header = container.querySelector('[data-testid="section-header"]') as HTMLElement;
    expect(header).not.toBeNull();
    expect(header.textContent).toContain('Pinned');
    expect(container.querySelector('[data-icon-name="pin"]')).not.toBeNull();
    // The count is gone — the pinned list below already carries that signal.
    expect(container.querySelector('[data-testid="section-count"]')).toBeNull();
  });

  test('renders the Menu kebab on the trailing edge when menu items are passed', () => {
    const { container } = render(SectionHeaderHarness, {
      props: {
        icon: 'pin' as const,
        label: 'Pinned',
        menu: [{ id: 'new-folder', label: 'New folder', onSelect: vi.fn() }],
      },
    });
    // The header now composes the bits-ui kebab (Menu, testid `menu-trigger`),
    // the same primitive the tab + folder rows compose — so it reads identically.
    expect(container.querySelector('[data-testid="menu-trigger"]')).not.toBeNull();
  });

  test('renders nothing on the trailing edge without a menu (e.g. the Temporary header)', () => {
    const { container } = render(SectionHeaderHarness, {
      props: { icon: 'layers' as const, label: 'Temporary' },
    });
    expect(container.querySelector('[data-testid="menu-trigger"]')).toBeNull();
  });

  test('renders as a row: a leading icon glyph + the Space name', () => {
    const { container } = render(SectionHeaderHarness, {
      props: { icon: 'layers' as const, label: 'Reading' },
    });
    const header = container.querySelector('.header') as HTMLElement;
    expect(header).not.toBeNull();
    // The header is a row now (icon glyph + title at row height), laid out like
    // the tab / folder rows — not an Arc-style uppercase section label.
    expect(header.querySelector('.glyph')).not.toBeNull();
    expect(header.querySelector('.label')?.textContent).toBe('Reading');
  });

  // One open/dismiss smoke — bits-ui owns placement, outside-click, and keyboard
  // dismissal, so we only assert the kebab opens its portaled actions and fires.
  test('opening the kebab reveals the Space-menu actions (portaled) and fires onSelect', async () => {
    const onSelect = vi.fn();
    const { container } = render(SectionHeaderHarness, {
      props: {
        icon: 'pin' as const,
        label: 'Pinned',
        menu: [{ id: 'new-folder', label: 'New folder', onSelect }],
      },
    });
    await openKebab(container);
    await waitFor(() => expect(menuItems().length).toBe(1));
    const item = menuItems()[0] as HTMLElement;
    expect(item.getAttribute('data-menu-id')).toBe('new-folder');
    await fireEvent.click(item);
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  // Regression (the "menu stays open after adding a lens" bug): the consumer's
  // bound `open` must DRIVE the menu, not just observe it. The "New lens…" item
  // is `keepOpen`, so after its drill-in editor finishes the consumer flips
  // `open` to false (onDone) — which must close the menu.
  test('the bound open prop drives the menu closed (controlled close after a keepOpen drill-in)', async () => {
    const { rerender } = render(SectionHeaderHarness, {
      props: {
        icon: 'pin' as const,
        label: 'Pinned',
        menu: [{ id: 'new-smart-folder', label: 'New lens…', onSelect: vi.fn() }],
        open: true,
      },
    });
    await waitFor(() => expect(menuItems().length).toBe(1));
    await rerender({
      icon: 'pin' as const,
      label: 'Pinned',
      menu: [{ id: 'new-smart-folder', label: 'New lens…', onSelect: vi.fn() }],
      open: false,
    });
    await waitFor(() => expect(document.querySelector('[role="menu"]')).toBeNull());
  });
});

describe('SectionHeader drill-in editor (smart-folders → BottomSheet)', () => {
  test('a forwarded panel renders the editor inside the titled BottomSheet', async () => {
    const { container } = render(SectionHeaderHarness, {
      props: {
        icon: 'pin' as const,
        label: 'Pinned',
        menu: [{ id: 'new-smart-folder', label: 'New lens…', onSelect: vi.fn() }],
        panelContent: 'editor fields',
        panelTitle: 'New lens',
      },
    });
    // The drill-in is now an EDITOR in a sheet (bits-ui Dialog), not a menu morph.
    // The sheet portals inline (scoped to the panel) but renders async.
    await waitFor(() => {
      const sheet = document.querySelector('[data-testid="section-header-sheet"]') as HTMLElement;
      expect(sheet).not.toBeNull();
      expect(sheet.querySelector('[data-testid="header-forwarded-panel"]')?.textContent).toBe(
        'editor fields',
      );
    });
    // The forwarded title is the sheet's Instrument Serif header.
    expect(document.querySelector('.bottom-sheet-title')?.textContent).toBe('New lens');
    // No menu trigger is needed to reveal it — the consumer drives `panel`.
    expect(container.querySelector('[data-testid="menu-trigger"]')).not.toBeNull();
  });

  test('dismissing the sheet (✕) calls onPanelBack', async () => {
    const onPanelBack = vi.fn();
    render(SectionHeaderHarness, {
      props: {
        icon: 'pin' as const,
        label: 'Pinned',
        menu: [{ id: 'new-smart-folder', label: 'New lens…', onSelect: vi.fn() }],
        panelContent: 'editor fields',
        panelTitle: 'New lens',
        onPanelBack,
      },
    });
    let close: HTMLButtonElement | null = null;
    await waitFor(() => {
      close = document.querySelector('.bottom-sheet-close') as HTMLButtonElement;
      expect(close).not.toBeNull();
    });
    await fireEvent.click(close as unknown as HTMLButtonElement);
    expect(onPanelBack).toHaveBeenCalledTimes(1);
  });

  test('no sheet renders when the consumer forwards no panel', () => {
    render(SectionHeaderHarness, {
      props: {
        icon: 'pin' as const,
        label: 'Pinned',
        menu: [{ id: 'new-smart-folder', label: 'New lens…', onSelect: vi.fn() }],
      },
    });
    expect(document.querySelector('[data-testid="section-header-sheet"]')).toBeNull();
  });
});
