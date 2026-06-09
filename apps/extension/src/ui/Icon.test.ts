import { render } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';
import IconHarness from './Icon.test.harness.svelte';

describe('Icon', () => {
  test('renders with data-icon-name', () => {
    const { container } = render(IconHarness, { props: { name: 'star' } });
    const el = container.querySelector('[data-icon-name="star"]');
    expect(el).not.toBeNull();
  });

  test('defaults to aria-hidden when no label is set', () => {
    const { container } = render(IconHarness, { props: { name: 'star' } });
    const el = container.querySelector('[data-icon-name="star"]') as HTMLElement;
    expect(el.getAttribute('aria-hidden')).toBe('true');
    expect(el.getAttribute('role')).toBeNull();
  });

  test('honours label → role="img" + aria-label', () => {
    const { container } = render(IconHarness, {
      props: { name: 'star', label: 'Favourite' },
    });
    const el = container.querySelector('[data-icon-name="star"]') as HTMLElement;
    expect(el.getAttribute('role')).toBe('img');
    expect(el.getAttribute('aria-label')).toBe('Favourite');
    expect(el.getAttribute('aria-hidden')).toBeNull();
  });
});
