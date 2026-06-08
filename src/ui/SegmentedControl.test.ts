import { fireEvent, render } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import SegmentedControlHarness from './SegmentedControl.test.harness.svelte';

describe('SegmentedControl', () => {
  test('renders every option as a radio', () => {
    const { container } = render(SegmentedControlHarness, { props: {} });
    const radios = container.querySelectorAll('input[type="radio"]');
    expect(radios).toHaveLength(3);
    const labels = Array.from(container.querySelectorAll('.option-label')).map(
      (el) => el.textContent,
    );
    expect(labels).toEqual(['Compact', 'Normal', 'Comfort']);
  });

  test('pre-selects the option matching value', () => {
    const { container } = render(SegmentedControlHarness, { props: { value: 'comfort' } });
    const checked = container.querySelector('input:checked') as HTMLInputElement;
    expect(checked.value).toBe('comfort');
    const selectedLabel = container.querySelector('.option.selected .option-label');
    expect(selectedLabel?.textContent).toBe('Comfort');
  });

  test('selecting an option fires onchange with its value', async () => {
    const onchange = vi.fn();
    const { container } = render(SegmentedControlHarness, { props: { value: 'normal', onchange } });
    const compact = container.querySelector('input[value="compact"]') as HTMLInputElement;
    await fireEvent.click(compact);
    expect(onchange).toHaveBeenCalledWith('compact');
  });

  test('selecting the already-active option does not fire onchange', async () => {
    const onchange = vi.fn();
    const { container } = render(SegmentedControlHarness, { props: { value: 'normal', onchange } });
    const normal = container.querySelector('input[value="normal"]') as HTMLInputElement;
    await fireEvent.click(normal);
    expect(onchange).not.toHaveBeenCalled();
  });
});
