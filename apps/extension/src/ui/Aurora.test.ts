import { cleanup, render, waitFor } from '@testing-library/svelte';
import { afterEach, describe, expect, test } from 'vitest';
import Aurora from './Aurora.svelte';

function setReducedMotion(matches: boolean): void {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });
}

afterEach(() => {
  cleanup();
  setReducedMotion(false);
});

function aurora(container: HTMLElement): HTMLElement {
  return container.querySelector('[data-testid="aurora"]') as HTMLElement;
}

describe('Aurora', () => {
  test('is an aria-hidden backdrop with three drifting blobs and a grain layer', () => {
    const { container } = render(Aurora, { props: {} });
    const el = aurora(container);
    expect(el).not.toBeNull();
    expect(el.getAttribute('aria-hidden')).toBe('true');
    expect(el.querySelectorAll('.blob')).toHaveLength(3);
    expect(el.querySelector('.grain')).not.toBeNull();
  });

  test('blobs are parameterised by the scoped Space hue', () => {
    const { container } = render(Aurora, { props: { intensity: 'vivid' } });
    for (const blob of aurora(container).querySelectorAll<HTMLElement>('.blob')) {
      // The colour reads `--space-h` / `--space-chroma`, so it recolours with
      // the active Space rather than baking a fixed hue.
      expect(blob.getAttribute('style') ?? '').toContain('var(--space-h');
    }
  });

  test('intensity maps to the overall opacity (vivid brighter than subtle)', () => {
    // `vivid` is capped at 0.5 (WCAG-AA on the raw new-tab aurora); still > subtle.
    const vivid = render(Aurora, { props: { intensity: 'vivid' } });
    expect(aurora(vivid.container).style.getPropertyValue('--aurora-opacity')).toBe('0.5');
    cleanup();
    const subtle = render(Aurora, { props: { intensity: 'subtle' } });
    expect(aurora(subtle.container).style.getPropertyValue('--aurora-opacity')).toBe('0.22');
  });

  test('with no intensity it inherits --aurora-opacity from the scope', () => {
    const { container } = render(Aurora, { props: {} });
    const el = aurora(container);
    expect(el.getAttribute('data-intensity')).toBe('inherit');
    expect(el.style.getPropertyValue('--aurora-opacity')).toBe('');
  });

  test('reflects the reduced-motion preference onto data-motion', async () => {
    setReducedMotion(true);
    const reduced = render(Aurora, { props: { intensity: 'vivid' } });
    await waitFor(() =>
      expect(aurora(reduced.container).getAttribute('data-motion')).toBe('reduced'),
    );
    cleanup();

    setReducedMotion(false);
    const full = render(Aurora, { props: { intensity: 'vivid' } });
    await waitFor(() => expect(aurora(full.container).getAttribute('data-motion')).toBe('full'));
  });
});
