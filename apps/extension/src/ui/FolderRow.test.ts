import { cleanup, fireEvent, render } from '@testing-library/svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';
import FolderRowHarness from './FolderRow.test.harness.svelte';

// Unmount between tests; without this, stacked renders + the module-level Icon
// resolver leak across cases (a later render's async `$effect` can clobber an
// earlier instance's glyph).
afterEach(() => cleanup());

const base = { name: 'Reading', icon: 'book' as const, color: 'blue' as const };

describe('FolderRow', () => {
  test('renders the name and the folder glyph', () => {
    const { container, getByText } = render(FolderRowHarness, { props: base });
    expect(container.querySelector('[data-testid="folder-row"]')).not.toBeNull();
    expect(getByText('Reading')).toBeTruthy();
    // The glyph (`.glyph`) renders the folder's own icon, distinct from the
    // chevron. Icon stamps `data-icon-name`, so the glyph carries the passed icon.
    expect(container.querySelector('.glyph [data-icon-name]')?.getAttribute('data-icon-name')).toBe(
      'book',
    );
    expect(
      container.querySelector('.chevron [data-icon-name]')?.getAttribute('data-icon-name'),
    ).toBe('chevron-right');
  });

  test('chevron carries the expanded class only when expanded', () => {
    const collapsed = render(FolderRowHarness, { props: { ...base, expanded: false } });
    expect(collapsed.container.querySelector('.chevron.expanded')).toBeNull();
    expect(collapsed.container.querySelector('.hit')?.getAttribute('aria-expanded')).toBe('false');

    const expanded = render(FolderRowHarness, { props: { ...base, expanded: true } });
    expect(expanded.container.querySelector('.chevron.expanded')).not.toBeNull();
    expect(expanded.container.querySelector('.hit')?.getAttribute('aria-expanded')).toBe('true');
  });

  test('clicking the row invokes onToggle', async () => {
    const onToggle = vi.fn();
    const { container } = render(FolderRowHarness, { props: { ...base, onToggle } });
    await fireEvent.click(container.querySelector('.hit') as HTMLButtonElement);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  describe('gesture split (onActivate — smart-folder-page)', () => {
    test('without onActivate, the whole header is a single toggle button (unchanged)', () => {
      const { container } = render(FolderRowHarness, { props: base });
      expect(container.querySelector('.hit')).not.toBeNull();
      expect(container.querySelector('[data-testid="folder-disclosure"]')).toBeNull();
      expect(container.querySelector('[data-testid="folder-activate"]')).toBeNull();
      expect(container.querySelector('[data-testid="folder-open-page"]')).toBeNull();
    });

    test('with onActivate, the disclosure toggles and the body activates', async () => {
      const onToggle = vi.fn();
      const onActivate = vi.fn();
      const { container } = render(FolderRowHarness, {
        props: { ...base, expanded: false, onToggle, onActivate },
      });

      const disclosure = container.querySelector(
        '[data-testid="folder-disclosure"]',
      ) as HTMLButtonElement;
      const activate = container.querySelector(
        '[data-testid="folder-activate"]',
      ) as HTMLButtonElement;
      expect(disclosure).not.toBeNull();
      expect(activate).not.toBeNull();
      expect(disclosure.getAttribute('aria-expanded')).toBe('false');

      await fireEvent.click(disclosure);
      expect(onToggle).toHaveBeenCalledTimes(1);
      expect(onActivate).not.toHaveBeenCalled();

      await fireEvent.click(activate);
      expect(onActivate).toHaveBeenCalledTimes(1);
      expect(onToggle).toHaveBeenCalledTimes(1); // body click never toggled
    });

    test('the open-as-page icon button also activates and carries the label', async () => {
      const onActivate = vi.fn();
      const { container } = render(FolderRowHarness, {
        props: { ...base, onActivate, activateLabel: 'Open Reading as a page' },
      });
      const openPage = container.querySelector(
        '[data-testid="folder-open-page"]',
      ) as HTMLButtonElement;
      expect(openPage).not.toBeNull();
      expect(openPage.getAttribute('aria-label')).toBe('Open Reading as a page');
      await fireEvent.click(openPage);
      expect(onActivate).toHaveBeenCalledTimes(1);
    });
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
      // The folder still reads as a folder: chevron + glyph remain visible.
      expect(container.querySelector('.glyph [data-icon-name]')).not.toBeNull();
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

  describe('action drawer (move + two-step delete)', () => {
    const TRIGGER = '[data-testid="folder-row-menu-trigger"]';
    const item = (id: string): HTMLButtonElement =>
      document.querySelector(`[data-menu-id="${id}"]`) as HTMLButtonElement;

    async function openDrawer(props: Record<string, unknown>): Promise<HTMLElement> {
      const { container } = render(FolderRowHarness, { props: { ...base, ...props } });
      await fireEvent.click(container.querySelector(TRIGGER) as HTMLButtonElement);
      return container.querySelector(TRIGGER) as HTMLElement;
    }

    test('drawer offers Rename, Icon & colour, Move up, Move down, Delete folder', async () => {
      await openDrawer({ canMoveUp: true, canMoveDown: true });
      const ids = [...document.querySelectorAll('[data-testid="folder-row-menu-item"]')].map((e) =>
        e.getAttribute('data-menu-id'),
      );
      expect(ids).toEqual(['rename', 'appearance', 'move-up', 'move-down', 'delete-folder']);
    });

    test('Move down dispatches onMoveDown; disabled at the list end dispatches nothing', async () => {
      const onMoveDown = vi.fn();
      const onMoveUp = vi.fn();
      await openDrawer({ canMoveUp: false, canMoveDown: true, onMoveUp, onMoveDown });
      // Move up is disabled (folder is first) — inert.
      expect(item('move-up').getAttribute('aria-disabled')).toBe('true');
      await fireEvent.click(item('move-up'));
      expect(onMoveUp).not.toHaveBeenCalled();
      // Move down is enabled.
      await fireEvent.click(item('move-down'));
      expect(onMoveDown).toHaveBeenCalledTimes(1);
    });

    test('Delete folder is a two-step confirm', async () => {
      const onDelete = vi.fn();
      const trigger = await openDrawer({ onDelete });
      // First activation arms: no delete, drawer stays open, label becomes confirm.
      await fireEvent.click(item('delete-folder'));
      expect(onDelete).not.toHaveBeenCalled();
      expect(trigger.getAttribute('aria-expanded')).toBe('true');
      expect(item('delete-folder').textContent).toContain('confirm');
      // Second activation deletes.
      await fireEvent.click(item('delete-folder'));
      expect(onDelete).toHaveBeenCalledTimes(1);
    });

    test('closing the drawer disarms a pending Delete folder', async () => {
      const onDelete = vi.fn();
      const trigger = await openDrawer({ onDelete });
      await fireEvent.click(item('delete-folder')); // arm
      await fireEvent.keyDown(document.querySelector('[role="menu"]') as HTMLElement, {
        key: 'Escape',
      }); // close
      expect(onDelete).not.toHaveBeenCalled();
      // Re-open: unarmed again.
      await fireEvent.click(trigger as HTMLButtonElement);
      expect(item('delete-folder').textContent).not.toContain('confirm');
    });
  });

  describe('smart-folders extensions (badge / menuItems / busy / forwarded panel)', () => {
    const TRIGGER = '[data-testid="folder-row-menu-trigger"]';

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
      await fireEvent.click(container.querySelector(TRIGGER) as HTMLButtonElement);
      const ids = [...document.querySelectorAll('[data-testid="folder-row-menu-item"]')].map((e) =>
        e.getAttribute('data-menu-id'),
      );
      expect(ids).toEqual(['refresh', 'edit']); // no rename/appearance/move/delete built-ins
      await fireEvent.click(
        document.querySelector('[data-menu-id="refresh"]') as HTMLButtonElement,
      );
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

    test('a forwarded panel drills in with a back-header that fires onPanelBack', async () => {
      const onPanelBack = vi.fn();
      const { container } = render(FolderRowHarness, {
        props: {
          ...base,
          menuItems: [{ id: 'noop', label: 'Noop', onSelect: () => undefined }],
          panelContent: 'editor fields',
          panelTitle: 'Edit smart folder',
          onPanelBack,
        },
      });
      await fireEvent.click(container.querySelector(TRIGGER) as HTMLButtonElement);
      // Drilled in: the forwarded panel + its back-header replace the actions.
      expect(document.querySelector('[data-testid="forwarded-panel"]')?.textContent).toBe(
        'editor fields',
      );
      const back = document.querySelector(
        '[data-testid="folder-row-menu-back"]',
      ) as HTMLButtonElement;
      expect(back.textContent).toContain('Edit smart folder');
      expect(document.querySelector('[data-menu-id="noop"]')).toBeNull(); // actions replaced
      await fireEvent.click(back);
      expect(onPanelBack).toHaveBeenCalledTimes(1);
    });

    test('default behavior unchanged: built-in actions + appearance panel still work', async () => {
      const onStartRename = vi.fn();
      const { container } = render(FolderRowHarness, { props: { ...base, onStartRename } });
      await fireEvent.click(container.querySelector(TRIGGER) as HTMLButtonElement);
      const ids = [...document.querySelectorAll('[data-testid="folder-row-menu-item"]')].map((e) =>
        e.getAttribute('data-menu-id'),
      );
      expect(ids).toEqual(['rename', 'appearance', 'move-up', 'move-down', 'delete-folder']);
      await fireEvent.click(document.querySelector('[data-menu-id="rename"]') as HTMLButtonElement);
      expect(onStartRename).toHaveBeenCalledTimes(1);
    });
  });

  describe('bindable menuOpen (smart-folder-editor-dismissal pass-through)', () => {
    const TRIGGER = '[data-testid="folder-row-menu-trigger"]';
    const boundProps = {
      ...base,
      bindMenuOpen: true,
      menuItems: [{ id: 'edit', label: 'Edit…', onSelect: () => undefined }],
    };

    test('a bound host observes the kebab opening', async () => {
      const { container } = render(FolderRowHarness, { props: boundProps });
      expect(container.querySelector('[data-testid="host-menu-open"]')?.textContent).toBe('false');
      await fireEvent.click(container.querySelector(TRIGGER) as HTMLButtonElement);
      expect(container.querySelector('[data-testid="host-menu-open"]')?.textContent).toBe('true');
      expect(document.querySelector('[data-testid="folder-row-menu-item"]')).not.toBeNull();
    });

    test('a bound host closes the menu by writing false (the editor-confirm path)', async () => {
      const { container } = render(FolderRowHarness, { props: boundProps });
      await fireEvent.click(container.querySelector(TRIGGER) as HTMLButtonElement);
      expect(document.querySelector('[data-testid="folder-row-menu-item"]')).not.toBeNull();

      await fireEvent.click(
        container.querySelector('[data-testid="host-close-menu"]') as HTMLButtonElement,
      );

      expect(container.querySelector('[data-testid="host-menu-open"]')?.textContent).toBe('false');
      expect(document.querySelector('[data-testid="folder-row-menu-item"]')).toBeNull();
    });
  });
});
