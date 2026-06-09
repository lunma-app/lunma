import { fireEvent, render } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import ChipHarness from './Chip.test.harness.svelte';

describe('Chip', () => {
  test('renders its label', () => {
    const { getByText } = render(ChipHarness, { props: { label: '*.google.com' } });
    expect(getByText('*.google.com')).not.toBeNull();
  });

  test('shows no remove button when onRemove is absent', () => {
    const { container } = render(ChipHarness, { props: { label: 'x.com' } });
    expect(container.querySelector('[data-testid="chip-remove"]')).toBeNull();
  });

  test('renders a remove button that invokes onRemove', async () => {
    const onRemove = vi.fn();
    const { container } = render(ChipHarness, { props: { label: 'x.com', onRemove } });
    const remove = container.querySelector('[data-testid="chip-remove"]') as HTMLButtonElement;
    expect(remove).not.toBeNull();
    await fireEvent.click(remove);
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  test('the remove button has an accessible label derived from the chip label', () => {
    const onRemove = vi.fn();
    const { container } = render(ChipHarness, { props: { label: 'linear.app', onRemove } });
    const remove = container.querySelector('[data-testid="chip-remove"]') as HTMLButtonElement;
    expect(remove.getAttribute('aria-label')).toBe('Remove linear.app');
  });

  test('an explicit removeLabel overrides the default', () => {
    const onRemove = vi.fn();
    const { container } = render(ChipHarness, {
      props: { label: 'linear.app', onRemove, removeLabel: 'Drop it' },
    });
    const remove = container.querySelector('[data-testid="chip-remove"]') as HTMLButtonElement;
    expect(remove.getAttribute('aria-label')).toBe('Drop it');
  });

  test('defaults to the neutral tone; an accent tone is reflected', () => {
    const neutral = render(ChipHarness, { props: { label: 'x.com' } });
    expect(neutral.container.querySelector('[data-testid="chip"]')?.getAttribute('data-tone')).toBe(
      'neutral',
    );
    const accent = render(ChipHarness, { props: { label: 'YouTube', tone: 'accent' } });
    expect(accent.container.querySelector('[data-testid="chip"]')?.getAttribute('data-tone')).toBe(
      'accent',
    );
  });

  test('renders a leading icon when iconUrl is given (and none otherwise)', () => {
    const without = render(ChipHarness, { props: { label: 'x.com' } });
    expect(without.container.querySelector('.chip-icon')).toBeNull();
    const withIcon = render(ChipHarness, {
      props: { label: 'YouTube', iconUrl: 'https://icon/yt.png' },
    });
    const img = withIcon.container.querySelector('.chip-icon') as HTMLImageElement;
    expect(img).not.toBeNull();
    expect(img.getAttribute('src')).toBe('https://icon/yt.png');
    expect(img.getAttribute('alt')).toBe('');
  });
});
