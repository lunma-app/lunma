import { fireEvent, render } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import IconButtonHarness from './IconButton.test.harness.svelte';

describe('IconButton', () => {
  test('renders the icon, defaulting to a ghost button of type=button', () => {
    const { container } = render(IconButtonHarness, { props: { icon: 'search' } });
    const btn = container.querySelector('button.icon-btn') as HTMLButtonElement;
    expect(btn).not.toBeNull();
    expect(btn.getAttribute('type')).toBe('button');
    expect(btn.getAttribute('data-variant')).toBe('ghost');
    // The generic Icon renders the requested glyph (tagged via data-icon-name).
    expect(container.querySelector('[data-icon-name="search"]')).not.toBeNull();
  });

  test('click invokes the handler', async () => {
    const onclick = vi.fn();
    const { container } = render(IconButtonHarness, { props: { onclick } });
    await fireEvent.click(container.querySelector('button.icon-btn') as HTMLButtonElement);
    expect(onclick).toHaveBeenCalledTimes(1);
  });

  test('disabled button reflects the attribute and skips the handler', async () => {
    const onclick = vi.fn();
    const { container } = render(IconButtonHarness, { props: { disabled: true, onclick } });
    const btn = container.querySelector('button.icon-btn') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    await fireEvent.click(btn);
    expect(onclick).not.toHaveBeenCalled();
  });

  test('exposes title and aria-label for tooltip + accessible name', () => {
    const { container } = render(IconButtonHarness, {
      props: { title: 'Open launcher (⌥L)', ariaLabel: 'Open launcher' },
    });
    const btn = container.querySelector('button.icon-btn') as HTMLButtonElement;
    expect(btn.getAttribute('title')).toBe('Open launcher (⌥L)');
    expect(btn.getAttribute('aria-label')).toBe('Open launcher');
  });

  test('forwards the testid passthrough', () => {
    const { container } = render(IconButtonHarness, { props: { testid: 'open-options' } });
    expect(container.querySelector('[data-testid="open-options"]')).not.toBeNull();
  });

  test('type=submit propagates', () => {
    const { container } = render(IconButtonHarness, { props: { type: 'submit' as const } });
    const btn = container.querySelector('button.icon-btn') as HTMLButtonElement;
    expect(btn.getAttribute('type')).toBe('submit');
  });
});
