import { cleanup, render } from '@testing-library/svelte';
import { afterEach, describe, expect, test } from 'vitest';
import CardHeadingHarness from './CardHeading.test.harness.svelte';

afterEach(() => cleanup());

describe('CardHeading', () => {
  test('renders the heading text in an <h2>', () => {
    const { container } = render(CardHeadingHarness, { props: { heading: 'Connectors' } });
    const h2 = container.querySelector('h2.card-heading') as HTMLElement;
    expect(h2).not.toBeNull();
    expect(h2.textContent?.trim()).toBe('Connectors');
  });

  test('forwards a testid onto the heading', () => {
    const { container } = render(CardHeadingHarness, { props: { testid: 'group-heading' } });
    expect(container.querySelector('h2[data-testid="group-heading"]')).not.toBeNull();
  });

  test('without actions it renders just the heading (no row wrapper)', () => {
    const { container } = render(CardHeadingHarness, { props: {} });
    expect(container.querySelector('.card-heading-row')).toBeNull();
    expect(container.querySelector('[data-testid="heading-action"]')).toBeNull();
  });

  test('renders the actions snippet beside the heading on a shared row', () => {
    const { container } = render(CardHeadingHarness, { props: { withActions: true } });
    const row = container.querySelector('.card-heading-row');
    expect(row).not.toBeNull();
    // Both the heading and the action live on the same row.
    expect(row?.querySelector('h2.card-heading')).not.toBeNull();
    expect(row?.querySelector('[data-testid="heading-action"]')).not.toBeNull();
  });
});
