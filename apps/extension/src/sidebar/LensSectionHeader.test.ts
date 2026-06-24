import { cleanup, fireEvent, render } from '@testing-library/svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';
import type { ResolvedLensSource } from '../shared/types';
import LensSectionHeaderHarness from './LensSectionHeader.test.harness.svelte';

const gitlab: ResolvedLensSource = {
  source: 'gitlab',
  baseUrl: 'https://gitlab.example.com',
  query: 'review-requested',
};

const header = (c: HTMLElement) => c.querySelector('.section-header') as HTMLButtonElement;

afterEach(cleanup);

describe('LensSectionHeader — disclosure control', () => {
  test('renders as a button (no longer an aria-hidden divider)', () => {
    const { container } = render(LensSectionHeaderHarness, { props: { cfg: gitlab } });
    const el = header(container);
    expect(el.tagName).toBe('BUTTON');
    expect(el.getAttribute('type')).toBe('button');
    expect(el.getAttribute('aria-hidden')).toBeNull();
  });

  test('aria-expanded reflects the collapsed prop', () => {
    const { container, rerender } = render(LensSectionHeaderHarness, {
      props: { cfg: gitlab, collapsed: false },
    });
    expect(header(container).getAttribute('aria-expanded')).toBe('true');
    rerender({ cfg: gitlab, collapsed: true });
    expect(header(container).getAttribute('aria-expanded')).toBe('false');
  });

  test('one disclosure slot holds both glyphs — source icon (default) + chevron (hover/expanded)', () => {
    const { container } = render(LensSectionHeaderHarness, { props: { cfg: gitlab } });
    const slots = container.querySelectorAll('.section-disclosure');
    expect(slots).toHaveLength(1); // a single merged slot, not chevron + icon
    const slot = slots[0] as HTMLElement;
    // The source icon (gitlab → folder-git-2) is the rest glyph; the chevron is
    // stacked in the same slot and revealed on hover/focus via CSS.
    expect(slot.querySelector('.glyph-type [data-icon-name="folder-git-2"]')).not.toBeNull();
    expect(slot.querySelector('.glyph-caret [data-icon-name="chevron-right"]')).not.toBeNull();
    // The old two-slot markup is gone.
    expect(container.querySelector('.section-chevron')).toBeNull();
    expect(container.querySelector('.section-icon')).toBeNull();
  });

  test('the disclosure slot carries the expanded class only when not collapsed (chevron rotation)', () => {
    const { container, rerender } = render(LensSectionHeaderHarness, {
      props: { cfg: gitlab, collapsed: false },
    });
    expect(container.querySelector('.section-disclosure')?.classList).toContain('expanded');
    rerender({ cfg: gitlab, collapsed: true });
    expect(container.querySelector('.section-disclosure')?.classList).not.toContain('expanded');
  });

  test('the hairline separator is suppressed on the first section, present otherwise', () => {
    const { container, rerender } = render(LensSectionHeaderHarness, {
      props: { cfg: gitlab, first: true },
    });
    expect(header(container).classList).toContain('first');
    rerender({ cfg: gitlab, first: false });
    expect(header(container).classList).not.toContain('first');
  });

  test('the accessible label names the section (host · filter), count, and the toggle action', () => {
    const { container, rerender } = render(LensSectionHeaderHarness, {
      props: { cfg: gitlab, count: '5', collapsed: false },
    });
    // Expanded → activating collapses.
    expect(header(container).getAttribute('aria-label')).toBe(
      'gitlab.example.com · reviewing section, 5 items, collapse',
    );
    // Collapsed → activating expands.
    rerender({ cfg: gitlab, count: '5', collapsed: true });
    expect(header(container).getAttribute('aria-label')).toBe(
      'gitlab.example.com · reviewing section, 5 items, expand',
    );
  });

  test('aria-controls points at the supplied body id', () => {
    const { container } = render(LensSectionHeaderHarness, {
      props: { cfg: gitlab, controlsId: 'body-xyz' },
    });
    expect(header(container).getAttribute('aria-controls')).toBe('body-xyz');
  });

  test('onToggle fires on activation; Enter/Space come free from native button semantics', async () => {
    const onToggle = vi.fn();
    const { container } = render(LensSectionHeaderHarness, { props: { cfg: gitlab, onToggle } });
    const el = header(container);
    // It is a real <button>, so the browser maps Enter and Space to a click for
    // free — we assert the click contract here and the button type above; jsdom
    // does not synthesise the keydown→click default action, so testing the
    // keypress directly would assert jsdom, not our component.
    expect(el.tagName).toBe('BUTTON');
    await fireEvent.click(el);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  test('the count stays visible while collapsed', () => {
    const { container } = render(LensSectionHeaderHarness, {
      props: { cfg: gitlab, count: '7', collapsed: true },
    });
    expect(container.querySelector('.section-count')?.textContent).toBe('7');
  });

  test('a custom name labels the section in place of the host (queue keeps the filter axis)', () => {
    const { container } = render(LensSectionHeaderHarness, {
      props: { cfg: { ...gitlab, name: 'Work' } },
    });
    // gitlab cfg carries query 'review-requested' → "Work · reviewing", not the host.
    expect(container.querySelector('.section-host')?.textContent).toBe('Work · reviewing');
  });

  test('a blank name falls back to the host label', () => {
    const { container } = render(LensSectionHeaderHarness, {
      props: { cfg: { ...gitlab, name: '  ' } },
    });
    expect(container.querySelector('.section-host')?.textContent).toBe(
      'gitlab.example.com · reviewing',
    );
  });
});
