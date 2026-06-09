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
});
