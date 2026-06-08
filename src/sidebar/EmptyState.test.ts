import { render } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';
import EmptyStateHarness from './EmptyState.test.harness.svelte';

describe('EmptyState', () => {
  test('renders title and subtitle', () => {
    const { container } = render(EmptyStateHarness, {
      props: { title: 'Nothing here', subtitle: 'Try the launcher' },
    });
    const empty = container.querySelector('[data-testid="empty-state"]') as HTMLElement;
    expect(empty).not.toBeNull();
    expect(empty.textContent).toContain('Nothing here');
    expect(empty.textContent).toContain('Try the launcher');
  });

  test('renders both lines via the .title / .subtitle hooks', () => {
    const { container } = render(EmptyStateHarness, {
      props: { title: 'A', subtitle: 'B' },
    });
    expect((container.querySelector('.title') as HTMLElement).textContent).toBe('A');
    expect((container.querySelector('.subtitle') as HTMLElement).textContent).toBe('B');
  });
});
