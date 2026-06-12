import { cleanup, render } from '@testing-library/svelte';
import { afterEach, describe, expect, test } from 'vitest';
import WelcomeHarness from './Welcome.test.harness.svelte';

afterEach(() => cleanup());

describe('Welcome (fresh-Space welcome, sidebar-firstrun-options-polish)', () => {
  test('renders the serif headline and the brand-voice hint covering both gestures', () => {
    const { getByTestId } = render(WelcomeHarness);
    const block = getByTestId('sidebar-welcome');
    expect(block.querySelector('.headline')?.textContent).toBe('Make this Space yours.');
    const hint = block.querySelector('.hint')?.textContent ?? '';
    // The single hint covers drag-to-favorite AND pinning (Option+D).
    expect(hint).toContain('Drag a tab up to favorite');
    expect(hint).toContain('Option+D');
  });

  test('renders ghost-tile outlines (no dashed borders) as the visual anchor', () => {
    const { getByTestId } = render(WelcomeHarness);
    const ghosts = getByTestId('sidebar-welcome').querySelectorAll('.ghost');
    expect(ghosts.length).toBeGreaterThan(0);
  });

  test('carries the drag-over highlight class when `over` is set', () => {
    const { getByTestId, rerender } = render(WelcomeHarness, { props: { over: false } });
    expect(getByTestId('sidebar-welcome').classList.contains('over')).toBe(false);
    return rerender({ over: true }).then(() => {
      expect(getByTestId('sidebar-welcome').classList.contains('over')).toBe(true);
    });
  });
});
