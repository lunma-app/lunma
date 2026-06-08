import { fireEvent, render } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import ButtonHarness from './Button.test.harness.svelte';

describe('Button', () => {
  test('renders children with default variant=secondary and type=button', () => {
    const { container } = render(ButtonHarness, { props: {} });
    const btn = container.querySelector('button.btn') as HTMLButtonElement;
    expect(btn).not.toBeNull();
    expect(btn.getAttribute('data-variant')).toBe('secondary');
    expect(btn.getAttribute('type')).toBe('button');
    expect(container.querySelector('[data-testid="label"]')).not.toBeNull();
  });

  test('renders each variant via data-variant', () => {
    const variants = ['primary', 'secondary', 'ghost'] as const;
    for (const v of variants) {
      const { container } = render(ButtonHarness, { props: { variant: v } });
      const btn = container.querySelector('button.btn') as HTMLButtonElement;
      expect(btn.getAttribute('data-variant')).toBe(v);
    }
  });

  test('forwards title attribute', () => {
    const { container } = render(ButtonHarness, { props: { title: 'Tap me' } });
    const btn = container.querySelector('button.btn') as HTMLButtonElement;
    expect(btn.getAttribute('title')).toBe('Tap me');
  });

  test('click invokes handler', async () => {
    const onclick = vi.fn();
    const { container } = render(ButtonHarness, { props: { onclick } });
    const btn = container.querySelector('button.btn') as HTMLButtonElement;
    await fireEvent.click(btn);
    expect(onclick).toHaveBeenCalledTimes(1);
  });

  test('disabled button skips the handler', async () => {
    const onclick = vi.fn();
    const { container } = render(ButtonHarness, { props: { disabled: true, onclick } });
    const btn = container.querySelector('button.btn') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    await fireEvent.click(btn);
    expect(onclick).not.toHaveBeenCalled();
  });

  test('type=submit propagates', () => {
    const { container } = render(ButtonHarness, { props: { type: 'submit' as const } });
    const btn = container.querySelector('button.btn') as HTMLButtonElement;
    expect(btn.getAttribute('type')).toBe('submit');
  });
});
