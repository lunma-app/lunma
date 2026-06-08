import { render } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';
import StackHarness from './Stack.test.harness.svelte';

describe('Stack', () => {
  test('renders children', () => {
    const { container } = render(StackHarness, { props: {} });
    expect(container.querySelector('[data-testid="a"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="b"]')).not.toBeNull();
  });

  test('defaults: column direction, gap 2, start align, start justify', () => {
    const { container } = render(StackHarness, { props: {} });
    const stack = container.querySelector('.stack') as HTMLElement;
    expect(stack.getAttribute('data-direction')).toBe('column');
    expect(stack.getAttribute('data-gap')).toBe('2');
    expect(stack.getAttribute('data-align')).toBe('start');
    expect(stack.getAttribute('data-justify')).toBe('start');
    expect(stack.style.flexDirection).toBe('column');
    expect(stack.style.gap).toContain('--space-2');
    expect(stack.style.alignItems).toBe('flex-start');
    expect(stack.style.justifyContent).toBe('flex-start');
  });

  test('direction=row sets flex-direction: row', () => {
    const { container } = render(StackHarness, { props: { direction: 'row' as const } });
    const stack = container.querySelector('.stack') as HTMLElement;
    expect(stack.style.flexDirection).toBe('row');
    expect(stack.getAttribute('data-direction')).toBe('row');
  });

  test('gap variants map to the right tokens', () => {
    const { container: c1 } = render(StackHarness, { props: { gap: '1' as const } });
    const { container: c3 } = render(StackHarness, { props: { gap: '3' as const } });
    const { container: c4 } = render(StackHarness, { props: { gap: '4' as const } });
    expect((c1.querySelector('.stack') as HTMLElement).style.gap).toContain('--space-1');
    expect((c3.querySelector('.stack') as HTMLElement).style.gap).toContain('--space-3');
    expect((c4.querySelector('.stack') as HTMLElement).style.gap).toContain('--space-4');
  });

  test('align variants map to align-items', () => {
    const { container: center } = render(StackHarness, { props: { align: 'center' as const } });
    const { container: end } = render(StackHarness, { props: { align: 'end' as const } });
    expect((center.querySelector('.stack') as HTMLElement).style.alignItems).toBe('center');
    expect((end.querySelector('.stack') as HTMLElement).style.alignItems).toBe('flex-end');
  });

  test('justify variants map to justify-content', () => {
    const { container: between } = render(StackHarness, {
      props: { justify: 'between' as const },
    });
    const { container: center } = render(StackHarness, {
      props: { justify: 'center' as const },
    });
    const { container: end } = render(StackHarness, { props: { justify: 'end' as const } });
    expect((between.querySelector('.stack') as HTMLElement).style.justifyContent).toBe(
      'space-between',
    );
    expect((center.querySelector('.stack') as HTMLElement).style.justifyContent).toBe('center');
    expect((end.querySelector('.stack') as HTMLElement).style.justifyContent).toBe('flex-end');
  });
});
