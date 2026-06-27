import { cleanup, render } from '@testing-library/svelte';
import { afterEach, describe, expect, test } from 'vitest';
import SettingsCardHarness from './SettingsCard.test.harness.svelte';

afterEach(() => cleanup());

describe('SettingsCard', () => {
  test('composes a solid section Surface with the heading and body', () => {
    const { container } = render(SettingsCardHarness, { props: { heading: 'Result sources' } });
    const surface = container.querySelector('.surface') as HTMLElement;
    expect(surface).not.toBeNull();
    expect(surface.getAttribute('data-variant')).toBe('section');
    expect(container.querySelector('h2.card-heading')?.textContent?.trim()).toBe('Result sources');
    expect(container.querySelector('[data-testid="card-body"]')).not.toBeNull();
  });

  test('forwards id + testid onto the inner section, and headingTestid onto the heading', () => {
    const { container } = render(SettingsCardHarness, {
      props: { id: 'connectors', testid: 'connectors-section', headingTestid: 'group-heading' },
    });
    const section = container.querySelector('section.settings-card') as HTMLElement;
    expect(section.id).toBe('connectors');
    expect(section.getAttribute('data-testid')).toBe('connectors-section');
    expect(container.querySelector('h2[data-testid="group-heading"]')).not.toBeNull();
  });

  test('renders a description only when provided', () => {
    const { container, rerender } = render(SettingsCardHarness, { props: {} });
    expect(container.querySelector('.settings-card-description')).toBeNull();
    rerender({ description: 'A muted lead.' });
    const desc = container.querySelector('.settings-card-description');
    expect(desc?.textContent?.trim()).toBe('A muted lead.');
  });

  test('places the actions snippet on the heading row', () => {
    const { container } = render(SettingsCardHarness, { props: { withActions: true } });
    const row = container.querySelector('.card-heading-row');
    expect(row?.querySelector('[data-testid="card-action"]')).not.toBeNull();
  });
});
