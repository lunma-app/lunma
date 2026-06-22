import { cleanup, fireEvent, render } from '@testing-library/svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';
import type { ResolvedSourceConfig } from '../shared/types';
import SmartSectionHeaderHarness from './SmartSectionHeader.test.harness.svelte';

const gitlab: ResolvedSourceConfig = {
  source: 'gitlab',
  baseUrl: 'https://gitlab.example.com',
  query: 'review-requested',
};

const header = (c: HTMLElement) => c.querySelector('.section-header') as HTMLButtonElement;

afterEach(cleanup);

describe('SmartSectionHeader — disclosure control', () => {
  test('renders as a button (no longer an aria-hidden divider)', () => {
    const { container } = render(SmartSectionHeaderHarness, { props: { cfg: gitlab } });
    const el = header(container);
    expect(el.tagName).toBe('BUTTON');
    expect(el.getAttribute('type')).toBe('button');
    expect(el.getAttribute('aria-hidden')).toBeNull();
  });

  test('aria-expanded reflects the collapsed prop', () => {
    const { container, rerender } = render(SmartSectionHeaderHarness, {
      props: { cfg: gitlab, collapsed: false },
    });
    expect(header(container).getAttribute('aria-expanded')).toBe('true');
    rerender({ cfg: gitlab, collapsed: true });
    expect(header(container).getAttribute('aria-expanded')).toBe('false');
  });

  test('the chevron carries the expanded class only when not collapsed (rotation)', () => {
    const { container, rerender } = render(SmartSectionHeaderHarness, {
      props: { cfg: gitlab, collapsed: false },
    });
    expect(container.querySelector('.section-chevron')?.classList).toContain('expanded');
    rerender({ cfg: gitlab, collapsed: true });
    expect(container.querySelector('.section-chevron')?.classList).not.toContain('expanded');
  });

  test('the accessible label names the section (host · filter), count, and the toggle action', () => {
    const { container, rerender } = render(SmartSectionHeaderHarness, {
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
    const { container } = render(SmartSectionHeaderHarness, {
      props: { cfg: gitlab, controlsId: 'body-xyz' },
    });
    expect(header(container).getAttribute('aria-controls')).toBe('body-xyz');
  });

  test('onToggle fires on activation; Enter/Space come free from native button semantics', async () => {
    const onToggle = vi.fn();
    const { container } = render(SmartSectionHeaderHarness, { props: { cfg: gitlab, onToggle } });
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
    const { container } = render(SmartSectionHeaderHarness, {
      props: { cfg: gitlab, count: '7', collapsed: true },
    });
    expect(container.querySelector('.section-count')?.textContent).toBe('7');
  });
});
