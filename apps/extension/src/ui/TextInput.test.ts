import { fireEvent, render } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import TextInputHarness from './TextInput.test.harness.svelte';

function input(container: HTMLElement): HTMLInputElement {
  return container.querySelector('[data-testid="text-input"]') as HTMLInputElement;
}

describe('TextInput', () => {
  test('renders a visible label above the field', () => {
    const { container } = render(TextInputHarness, { props: { label: 'Space name' } });
    expect(container.querySelector('.label')?.textContent).toBe('Space name');
    expect(input(container)).not.toBeNull();
  });

  test('emits oninput with the new value on typing', async () => {
    const oninput = vi.fn();
    const { container } = render(TextInputHarness, { props: { oninput } });
    await fireEvent.input(input(container), { target: { value: 'Research' } });
    expect(oninput).toHaveBeenCalledWith('Research');
  });

  test('fires onenter when Enter is pressed', async () => {
    const onenter = vi.fn();
    const { container } = render(TextInputHarness, { props: { onenter } });
    await fireEvent.keyDown(input(container), { key: 'Enter' });
    expect(onenter).toHaveBeenCalledTimes(1);
  });

  test('omits the inputmode attribute by default', () => {
    const { container } = render(TextInputHarness, { props: {} });
    expect(input(container).getAttribute('inputmode')).toBeNull();
  });

  test('reflects an inputmode hint onto the field (numeric)', () => {
    const { container } = render(TextInputHarness, { props: { inputmode: 'numeric' } });
    expect(input(container).getAttribute('inputmode')).toBe('numeric');
  });
});
