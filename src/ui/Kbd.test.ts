import { render } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';
import KbdHarness from './Kbd.test.harness.svelte';

describe('Kbd', () => {
  test('renders a <kbd> with the kbd class and supplied content', () => {
    const { container } = render(KbdHarness, { props: { text: '⌥L' } });
    const el = container.querySelector('kbd.kbd');
    expect(el).not.toBeNull();
    expect(el?.textContent).toBe('⌥L');
  });

  test('renders arbitrary content via the children snippet', () => {
    const { container } = render(KbdHarness, { props: { text: '⌘K' } });
    const el = container.querySelector('kbd.kbd');
    expect(el?.textContent).toBe('⌘K');
  });
});
