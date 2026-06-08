import { cleanup, render } from '@testing-library/svelte';
import { afterEach, describe, expect, test } from 'vitest';
import SurfaceHarness from './Surface.test.harness.svelte';

afterEach(() => cleanup());

function surface(container: HTMLElement): HTMLElement {
  return container.querySelector('.surface') as HTMLElement;
}

describe('Surface', () => {
  test('renders children and defaults to the glass variant, no glow', () => {
    const { container } = render(SurfaceHarness, { props: {} });
    const el = surface(container);
    expect(el).not.toBeNull();
    expect(el.getAttribute('data-variant')).toBe('glass');
    expect(el.getAttribute('data-glow')).toBe('false');
    expect(container.querySelector('[data-testid="surface-child"]')).not.toBeNull();
  });

  test('reflects each variant onto data-variant', () => {
    for (const variant of ['glass', 'elevated', 'flat'] as const) {
      const { container } = render(SurfaceHarness, { props: { variant } });
      expect(surface(container).getAttribute('data-variant')).toBe(variant);
      cleanup();
    }
  });

  test('glow sets data-glow="true"', () => {
    const { container } = render(SurfaceHarness, { props: { glow: true } });
    expect(surface(container).getAttribute('data-glow')).toBe('true');
  });

  test('radius maps to the --r-* token via the inline custom property', () => {
    const { container } = render(SurfaceHarness, { props: { radius: 'md' } });
    expect(surface(container).style.getPropertyValue('--surface-radius')).toBe('var(--r-md)');
  });

  test('forwards a testid', () => {
    const { container } = render(SurfaceHarness, { props: { testid: 'my-panel' } });
    expect(container.querySelector('[data-testid="my-panel"]')).not.toBeNull();
  });
});
