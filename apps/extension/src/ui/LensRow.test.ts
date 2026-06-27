import { fireEvent, render } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import LensRowHarness from './LensRow.test.harness.svelte';

const base = { name: 'Feeds', icon: 'rss' as const, color: 'orange' as const };

describe('LensRow', () => {
  test('renders the name, the type icon at rest, and a chevron in the same leading slot', () => {
    const { container } = render(LensRowHarness, { props: base });
    expect(container.querySelector('.name')?.textContent).toBe('Feeds');
    // The leading slot stacks the type icon (at rest) and a chevron (revealed on hover).
    expect(
      container.querySelector('.tile-mark [data-icon-name]')?.getAttribute('data-icon-name'),
    ).toBe('rss');
    expect(
      container.querySelector('.tile-caret [data-icon-name]')?.getAttribute('data-icon-name'),
    ).toBe('chevron-right');
  });

  test('clicking the row toggles expand/collapse (not open-page)', async () => {
    const onToggle = vi.fn();
    const onOpenPage = vi.fn();
    const { container } = render(LensRowHarness, { props: { ...base, onToggle, onOpenPage } });
    await fireEvent.click(container.querySelector('.toggle') as HTMLButtonElement);
    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onOpenPage).not.toHaveBeenCalled();
  });

  test('the trailing icon opens the lens overview (not toggle)', async () => {
    const onToggle = vi.fn();
    const onOpenPage = vi.fn();
    const { container } = render(LensRowHarness, {
      props: { ...base, onToggle, onOpenPage, openPageLabel: 'Open Feeds' },
    });
    const open = container.querySelector('[data-testid="lens-open-page"]') as HTMLButtonElement;
    expect(open).not.toBeNull();
    expect(open.getAttribute('aria-label')).toBe('Open Feeds');
    await fireEvent.click(open);
    expect(onOpenPage).toHaveBeenCalledTimes(1);
    expect(onToggle).not.toHaveBeenCalled();
  });

  test('the row reflects aria-expanded and rotates the chevron when expanded', () => {
    const collapsed = render(LensRowHarness, { props: { ...base, expanded: false } });
    expect(collapsed.container.querySelector('.toggle')?.getAttribute('aria-expanded')).toBe(
      'false',
    );
    expect(collapsed.container.querySelector('.tile.expanded')).toBeNull();

    const expanded = render(LensRowHarness, { props: { ...base, expanded: true } });
    expect(expanded.container.querySelector('.toggle')?.getAttribute('aria-expanded')).toBe('true');
    expect(expanded.container.querySelector('.tile.expanded')).not.toBeNull();
  });

  test('applies the active "peek" treatment only when active', () => {
    const inactive = render(LensRowHarness, { props: base });
    expect(inactive.container.querySelector('.lens-row.active')).toBeNull();

    const activeRow = render(LensRowHarness, { props: { ...base, active: true } });
    expect(activeRow.container.querySelector('.lens-row.active')).not.toBeNull();
  });

  test('carries no kebab — lens actions live in the right-click context menu', () => {
    const { container } = render(LensRowHarness, { props: base });
    expect(container.querySelector('[data-testid="menu-trigger"]')).toBeNull();
  });

  test('renders the count badge when set, and omits it otherwise', () => {
    const withBadge = render(LensRowHarness, { props: { ...base, badge: '3' } });
    expect(withBadge.container.querySelector('[data-testid="lens-row-badge"]')?.textContent).toBe(
      '3',
    );
    const without = render(LensRowHarness, { props: base });
    expect(without.container.querySelector('[data-testid="lens-row-badge"]')).toBeNull();
  });
});
