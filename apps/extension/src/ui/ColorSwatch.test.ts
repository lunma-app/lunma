import { fireEvent, render } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import ColorSwatchHarness from './ColorSwatch.test.harness.svelte';

function swatch(container: HTMLElement): HTMLButtonElement {
  return container.querySelector('[data-testid="color-swatch"]') as HTMLButtonElement;
}

describe('ColorSwatch', () => {
  test('renders the selected ring and pressed state when selected', () => {
    const { container } = render(ColorSwatchHarness, { props: { color: 'cyan', selected: true } });
    const el = swatch(container);
    expect(el.getAttribute('data-selected')).toBe('true');
    expect(el.getAttribute('aria-pressed')).toBe('true');
    expect(el.classList.contains('selected')).toBe(true);
    expect(el.getAttribute('data-color')).toBe('cyan');
  });

  test('is unselected by default', () => {
    const { container } = render(ColorSwatchHarness, { props: { color: 'cyan' } });
    expect(swatch(container).getAttribute('data-selected')).toBe('false');
  });

  test('fires onclick when activated', async () => {
    const onclick = vi.fn();
    const { container } = render(ColorSwatchHarness, { props: { onclick } });
    await fireEvent.click(swatch(container));
    expect(onclick).toHaveBeenCalledTimes(1);
  });
});
