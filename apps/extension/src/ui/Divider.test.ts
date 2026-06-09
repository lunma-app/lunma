import { render } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';
import DividerHarness from './Divider.test.harness.svelte';

describe('Divider', () => {
  test('renders the hairline rule', () => {
    const { container } = render(DividerHarness);
    expect(container.querySelector('[data-testid="divider"]')).not.toBeNull();
  });

  test('renders no trailing action by default', () => {
    const { container } = render(DividerHarness);
    expect(container.querySelector('[data-testid="action-btn"]')).toBeNull();
  });

  test('renders the trailing action snippet when provided', () => {
    const { container } = render(DividerHarness, { props: { withAction: true } });
    expect(container.querySelector('[data-testid="action-btn"]')).not.toBeNull();
  });
});
