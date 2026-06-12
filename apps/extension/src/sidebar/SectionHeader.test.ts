import { fireEvent, render } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import SectionHeaderHarness from './SectionHeader.test.harness.svelte';

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

  test('renders the RowMenu kebab on the trailing edge when menu items are passed', () => {
    const { container } = render(SectionHeaderHarness, {
      props: {
        icon: 'pin' as const,
        label: 'Pinned',
        menu: [{ id: 'new-folder', label: 'New folder', onSelect: vi.fn() }],
      },
    });
    // Same morph primitive the tab + folder rows compose (RowMenu), not the
    // floating-dropdown Menu — so the header reads identically to those menus.
    expect(container.querySelector('[data-testid="section-header-menu-trigger"]')).not.toBeNull();
  });

  test('renders nothing on the trailing edge without a menu (e.g. the Temporary header)', () => {
    const { container } = render(SectionHeaderHarness, {
      props: { icon: 'layers' as const, label: 'Temporary' },
    });
    expect(container.querySelector('[data-testid="section-header-menu-trigger"]')).toBeNull();
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
});

describe('SectionHeader drill-in pass-through (smart-folders)', () => {
  test('a forwarded titled panel replaces the actions with a back-header', async () => {
    const onPanelBack = vi.fn();
    const { container } = render(SectionHeaderHarness, {
      props: {
        icon: 'pin' as const,
        label: 'Pinned',
        menu: [{ id: 'new-smart-folder', label: 'New smart folder…', onSelect: vi.fn() }],
        panelContent: 'editor fields',
        panelTitle: 'New smart folder',
        onPanelBack,
      },
    });
    await fireEvent.click(
      container.querySelector('[data-testid="section-header-menu-trigger"]') as HTMLButtonElement,
    );
    expect(container.querySelector('[data-testid="header-forwarded-panel"]')?.textContent).toBe(
      'editor fields',
    );
    const back = container.querySelector(
      '[data-testid="section-header-menu-back"]',
    ) as HTMLButtonElement;
    expect(back.textContent).toContain('New smart folder');
    await fireEvent.click(back);
    expect(onPanelBack).toHaveBeenCalledTimes(1);
  });
});
