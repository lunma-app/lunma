import { cleanup, render } from '@testing-library/svelte';
import { afterEach, describe, expect, test } from 'vitest';
import SettingTextHarness from './SettingText.test.harness.svelte';

afterEach(() => cleanup());

describe('SettingText', () => {
  test('renders the label', () => {
    const { container } = render(SettingTextHarness, { props: { label: 'Density' } });
    expect(container.querySelector('.setting-label')?.textContent?.trim()).toBe('Density');
  });

  test('renders the description only when provided', () => {
    const { container, rerender } = render(SettingTextHarness, { props: { label: 'Density' } });
    expect(container.querySelector('.setting-description')).toBeNull();
    rerender({ label: 'Density', description: 'How much space between tab rows' });
    expect(container.querySelector('.setting-description')?.textContent?.trim()).toBe(
      'How much space between tab rows',
    );
  });
});
