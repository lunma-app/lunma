import { cleanup, fireEvent, render, waitFor } from '@testing-library/svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';
import FolderRowHarness from './FolderRow.test.harness.svelte';

// Unmount between tests; without this, stacked renders + the module-level Icon
// resolver leak across cases (a later render's async `$effect` can clobber an
// earlier instance's glyph). It also tears down bits-ui's portaled popovers.
afterEach(() => cleanup());

const base = { name: 'Reading', icon: 'book' as const, color: 'blue' as const };

// The kebab is a bits-ui DropdownMenu: it opens on pointerdown+pointerup (a click
// resolves it in jsdom) and PORTALS its items to <body>, so they're queried off
// `document`, not the render container, and appear ASYNC (hence `waitFor`).
const TRIGGER = '[data-testid="menu-trigger"]';
const item = (id: string): HTMLButtonElement =>
  document.querySelector(`[data-menu-id="${id}"]`) as HTMLButtonElement;
const menuItemIds = (): (string | null)[] =>
  [...document.querySelectorAll('[data-testid="menu-item"]')].map((e) =>
    e.getAttribute('data-menu-id'),
  );

async function openMenu(container: Element): Promise<HTMLButtonElement> {
  const trigger = container.querySelector(TRIGGER) as HTMLButtonElement;
  // bits-ui's DropdownMenu opens on pointerdown; firing a trailing `click` too
  // re-toggles it shut in jsdom (real browsers track the press), so open with a
  // single pointerdown/up and let bits-ui own the rest.
  await fireEvent.pointerDown(trigger);
  await fireEvent.pointerUp(trigger);
  await waitFor(() => expect(document.querySelector('[role="menu"]')).not.toBeNull());
  return trigger;
}

describe('FolderRow', () => {
  test('renders the name and the folder glyph', () => {
    const { container, getByText } = render(FolderRowHarness, { props: base });
    expect(container.querySelector('[data-testid="folder-row"]')).not.toBeNull();
    expect(getByText('Reading')).toBeTruthy();
    // The glyph (`.glyph`) stacks the folder's own icon (`.glyph-mark`) and a
    // chevron (`.glyph-caret`) in one slot — the icon at rest, revealed on hover/
    // focus/open-menu (LensRow's disclosure model). Icon stamps `data-icon-name`.
    expect(
      container.querySelector('.glyph-mark [data-icon-name]')?.getAttribute('data-icon-name'),
    ).toBe('book');
    expect(
      container.querySelector('.glyph-caret [data-icon-name]')?.getAttribute('data-icon-name'),
    ).toBe('chevron-right');
  });

  test('the glyph carries the expanded class only when expanded', () => {
    const collapsed = render(FolderRowHarness, { props: { ...base, expanded: false } });
    expect(collapsed.container.querySelector('.glyph.expanded')).toBeNull();
    expect(collapsed.container.querySelector('.hit')?.getAttribute('aria-expanded')).toBe('false');

    const expanded = render(FolderRowHarness, { props: { ...base, expanded: true } });
    expect(expanded.container.querySelector('.glyph.expanded')).not.toBeNull();
    expect(expanded.container.querySelector('.hit')?.getAttribute('aria-expanded')).toBe('true');
  });

  test('clicking the row invokes onToggle', async () => {
    const onToggle = vi.fn();
    const { container } = render(FolderRowHarness, { props: { ...base, onToggle } });
    await fireEvent.click(container.querySelector('.hit') as HTMLButtonElement);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  test('drop-target state toggles the highlight class', () => {
    const off = render(FolderRowHarness, { props: base });
    expect(off.container.querySelector('.folder-row.drop-target')).toBeNull();
    const on = render(FolderRowHarness, { props: { ...base, dropTarget: true } });
    expect(on.container.querySelector('.folder-row.drop-target')).not.toBeNull();
  });

  test('tints the glyph from the folder colour', () => {
    const { container } = render(FolderRowHarness, { props: { ...base, color: 'red' } });
    const row = container.querySelector('[data-testid="folder-row"]') as HTMLElement;
    // The colour is exposed as a CSS custom property for the glyph + highlight.
    expect(row.style.getPropertyValue('--folder-c')).toContain('oklch');
  });

  describe('editing mode (inline rename)', () => {
    test('shows the folder glyph + an editable name field seeded with the name', () => {
      const { container } = render(FolderRowHarness, { props: { ...base, editing: true } });
      // The folder still reads as a folder: the icon stays visible (the chevron
      // never swaps in during a rename).
      expect(container.querySelector('.glyph-mark [data-icon-name]')).not.toBeNull();
      // No display button while editing; the name is an input seeded with `name`.
      expect(container.querySelector('.hit')).toBeNull();
      const input = container.querySelector(
        '[data-testid="folder-rename-input"]',
      ) as HTMLInputElement;
      expect(input).not.toBeNull();
      expect(input.value).toBe('Reading');
    });

    test('Enter commits the trimmed value via onRename', async () => {
      const onRename = vi.fn();
      const { container } = render(FolderRowHarness, {
        props: { ...base, editing: true, onRename },
      });
      const input = container.querySelector(
        '[data-testid="folder-rename-input"]',
      ) as HTMLInputElement;
      await fireEvent.input(input, { target: { value: '  Work  ' } });
      await fireEvent.keyDown(input, { key: 'Enter' });
      expect(onRename).toHaveBeenCalledWith('Work');
    });

    test('Escape cancels via onRenameCancel', async () => {
      const onRename = vi.fn();
      const onRenameCancel = vi.fn();
      const { container } = render(FolderRowHarness, {
        props: { ...base, editing: true, onRename, onRenameCancel },
      });
      const input = container.querySelector(
        '[data-testid="folder-rename-input"]',
      ) as HTMLInputElement;
      await fireEvent.keyDown(input, { key: 'Escape' });
      expect(onRenameCancel).toHaveBeenCalledTimes(1);
      expect(onRename).not.toHaveBeenCalled();
    });

    test('blur with an empty value cancels rather than committing an empty name', async () => {
      const onRename = vi.fn();
      const onRenameCancel = vi.fn();
      const { container } = render(FolderRowHarness, {
        props: { ...base, editing: true, onRename, onRenameCancel },
      });
      const input = container.querySelector(
        '[data-testid="folder-rename-input"]',
      ) as HTMLInputElement;
      await fireEvent.input(input, { target: { value: '   ' } });
      await fireEvent.blur(input);
      expect(onRename).not.toHaveBeenCalled();
      expect(onRenameCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('action menu (move + two-step delete)', () => {
    async function openWith(props: Record<string, unknown>): Promise<HTMLButtonElement> {
      const { container } = render(FolderRowHarness, { props: { ...base, ...props } });
      return openMenu(container);
    }

    test('menu offers Edit, Move up, Move down, Delete folder', async () => {
      await openWith({ canMoveUp: true, canMoveDown: true });
      await waitFor(() => expect(menuItemIds().length).toBe(4));
      expect(menuItemIds()).toEqual(['edit', 'move-up', 'move-down', 'delete-folder']);
    });

    test('Move down dispatches onMoveDown; disabled at the list end dispatches nothing', async () => {
      const onMoveDown = vi.fn();
      const onMoveUp = vi.fn();
      await openWith({ canMoveUp: false, canMoveDown: true, onMoveUp, onMoveDown });
      await waitFor(() => expect(item('move-up')).not.toBeNull());
      // Move up is disabled (folder is first) — inert.
      expect(item('move-up').getAttribute('aria-disabled')).toBe('true');
      await fireEvent.click(item('move-up'));
      expect(onMoveUp).not.toHaveBeenCalled();
      // Move down is enabled.
      await fireEvent.click(item('move-down'));
      expect(onMoveDown).toHaveBeenCalledTimes(1);
    });

    test('Delete folder is a two-step confirm (keepOpen arms in place)', async () => {
      const onDelete = vi.fn();
      await openWith({ onDelete });
      await waitFor(() => expect(item('delete-folder')).not.toBeNull());
      // First activation arms: no delete, menu stays open, label becomes confirm.
      await fireEvent.click(item('delete-folder'));
      expect(onDelete).not.toHaveBeenCalled();
      await waitFor(() => expect(item('delete-folder').textContent).toContain('confirm'));
      // Second activation deletes.
      await fireEvent.click(item('delete-folder'));
      expect(onDelete).toHaveBeenCalledTimes(1);
    });

    test('closing the menu disarms a pending Delete folder', async () => {
      const onDelete = vi.fn();
      const trigger = await openWith({ onDelete });
      await waitFor(() => expect(item('delete-folder')).not.toBeNull());
      await fireEvent.click(item('delete-folder')); // arm
      await waitFor(() => expect(item('delete-folder').textContent).toContain('confirm'));
      // bits-ui owns dismissal: Escape on the menu closes it.
      await fireEvent.keyDown(document.querySelector('[role="menu"]') as HTMLElement, {
        key: 'Escape',
      });
      await waitFor(() => expect(document.querySelector('[role="menu"]')).toBeNull());
      expect(onDelete).not.toHaveBeenCalled();
      // Re-open: unarmed again (onOpenChange(false) reset the confirm).
      await fireEvent.pointerDown(trigger);
      await fireEvent.pointerUp(trigger);
      await fireEvent.click(trigger);
      await waitFor(() => expect(item('delete-folder')).not.toBeNull());
      expect(item('delete-folder').textContent).not.toContain('confirm');
    });
  });

  describe('Edit sheet (name + icon + colour) opens in a BottomSheet', () => {
    test('selecting Edit opens the sheet with a name field, swatch row, and icon picker', async () => {
      const onSetColor = vi.fn();
      const { container } = render(FolderRowHarness, {
        props: { ...base, onSetColor },
      });
      // The sheet is absent until the action opens it.
      expect(document.querySelector('[data-testid="folder-appearance"]')).toBeNull();
      await openMenu(container);
      await waitFor(() => expect(item('edit')).not.toBeNull());
      await fireEvent.click(item('edit'));
      // The Edit sheet now carries the editor.
      await waitFor(() =>
        expect(document.querySelector('[data-testid="folder-appearance"]')).not.toBeNull(),
      );
      const sheet = document.querySelector('[data-testid="folder-appearance"]') as HTMLElement;
      expect(sheet.querySelector('[data-testid="folder-edit-name"]')).not.toBeNull();
      // The swatches are aria-pressed toggles, so the container is a named
      // role="group" (not radiogroup) — COLORSWATCH-01.
      const swatchGroup = sheet.querySelector('[role="group"]');
      expect(swatchGroup).not.toBeNull();
      expect(swatchGroup?.getAttribute('aria-label')).toBe('Folder colour');
    });

    test('the Edit sheet dismisses via Escape', async () => {
      const { container } = render(FolderRowHarness, { props: base });
      await openMenu(container);
      await waitFor(() => expect(item('edit')).not.toBeNull());
      await fireEvent.click(item('edit'));
      await waitFor(() =>
        expect(document.querySelector('[data-testid="folder-appearance"]')).not.toBeNull(),
      );
      await fireEvent.keyDown(document, { key: 'Escape' });
      await waitFor(() =>
        expect(document.querySelector('[data-testid="folder-appearance"]')).toBeNull(),
      );
    });
  });

  describe('smart-folders extensions (badge / menuItems / busy / forwarded editor)', () => {
    test('no badge element renders by default; a provided badge renders its value', () => {
      const without = render(FolderRowHarness, { props: base });
      expect(without.container.querySelector('[data-testid="folder-row-badge"]')).toBeNull();

      const withBadge = render(FolderRowHarness, { props: { ...base, badge: '20+' } });
      const badge = withBadge.container.querySelector('[data-testid="folder-row-badge"]');
      expect(badge?.textContent).toBe('20+');
    });

    test('a menuItems override replaces the built-in folder actions wholesale', async () => {
      const onRefresh = vi.fn();
      const { container } = render(FolderRowHarness, {
        props: {
          ...base,
          menuItems: [
            { id: 'refresh', label: 'Refresh now', icon: 'rotate-cw', onSelect: onRefresh },
            { id: 'edit', label: 'Edit…', onSelect: () => undefined },
          ],
        },
      });
      await openMenu(container);
      await waitFor(() => expect(menuItemIds().length).toBe(2));
      expect(menuItemIds()).toEqual(['refresh', 'edit']); // no rename/appearance/move/delete
      await fireEvent.click(item('refresh'));
      expect(onRefresh).toHaveBeenCalledTimes(1);
    });

    test('busy spins the glyph via the busy class (reduced-motion holds it static in CSS)', () => {
      const idle = render(FolderRowHarness, { props: base });
      expect(idle.container.querySelector('.glyph.busy')).toBeNull();

      const busy = render(FolderRowHarness, { props: { ...base, busy: true } });
      // The 0.8s-linear spin and the reduced-motion static --text-dim treatment
      // both hang off this class (see the component's scoped CSS — jsdom cannot
      // evaluate @media, so the class is the observable contract).
      expect(busy.container.querySelector('.glyph.busy')).not.toBeNull();
    });

    test('a forwarded editor renders inside a titled BottomSheet; dismiss fires onPanelBack', async () => {
      const onPanelBack = vi.fn();
      render(FolderRowHarness, {
        props: {
          ...base,
          menuItems: [{ id: 'noop', label: 'Noop', onSelect: () => undefined }],
          panelContent: 'editor fields',
          panelTitle: 'Edit smart folder',
          onPanelBack,
        },
      });
      // The forwarded editor is open exactly while the host passes the snippet.
      const sheet = document.querySelector('[data-testid="folder-forwarded-panel"]') as HTMLElement;
      expect(sheet).not.toBeNull();
      expect(sheet.querySelector('[data-testid="forwarded-panel"]')?.textContent).toBe(
        'editor fields',
      );
      // The sheet header carries the title (Instrument Serif `.bottom-sheet-title`).
      expect(document.querySelector('.bottom-sheet-title')?.textContent).toBe('Edit smart folder');
      // Escape (a sheet dismissal path) routes to onPanelBack — the host clears
      // its `editing` flag, which unmounts the snippet.
      await fireEvent.keyDown(document, { key: 'Escape' });
      await waitFor(() => expect(onPanelBack).toHaveBeenCalledTimes(1));
    });

    test('default behavior unchanged: built-in Edit action opens the sheet', async () => {
      const { container } = render(FolderRowHarness, { props: base });
      await openMenu(container);
      await waitFor(() => expect(menuItemIds().length).toBe(4));
      expect(menuItemIds()).toEqual(['edit', 'move-up', 'move-down', 'delete-folder']);
      await fireEvent.click(item('edit'));
      await waitFor(() =>
        expect(document.querySelector('[data-testid="folder-appearance"]')).not.toBeNull(),
      );
    });
  });

  describe('bindable menuOpen (read-only open mirror)', () => {
    const boundProps = {
      ...base,
      bindMenuOpen: true,
      menuItems: [{ id: 'edit', label: 'Edit…', onSelect: () => undefined }],
    };

    test('a bound host observes the kebab opening via onOpenChange', async () => {
      const { container } = render(FolderRowHarness, { props: boundProps });
      expect(container.querySelector('[data-testid="host-menu-open"]')?.textContent).toBe('false');
      await openMenu(container);
      await waitFor(() =>
        expect(container.querySelector('[data-testid="host-menu-open"]')?.textContent).toBe('true'),
      );
      expect(document.querySelector('[data-testid="menu-item"]')).not.toBeNull();
    });

    test('closing the kebab updates the mirror back to false', async () => {
      const { container } = render(FolderRowHarness, { props: boundProps });
      await openMenu(container);
      await waitFor(() =>
        expect(container.querySelector('[data-testid="host-menu-open"]')?.textContent).toBe('true'),
      );
      await fireEvent.keyDown(document.querySelector('[role="menu"]') as HTMLElement, {
        key: 'Escape',
      });
      await waitFor(() =>
        expect(container.querySelector('[data-testid="host-menu-open"]')?.textContent).toBe(
          'false',
        ),
      );
    });
  });
});
