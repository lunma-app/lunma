import { render } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';
import ReviewerRailHarness from './ReviewerRail.test.harness.svelte';

const rail = (c: HTMLElement) => c.querySelector('[data-testid="reviewer-rail"]');
const verdictIcon = (c: HTMLElement) =>
  c.querySelector('.verdict [data-icon-name]')?.getAttribute('data-icon-name');

describe('ReviewerRail', () => {
  test('renders nothing for an empty reviewer list', () => {
    const { container } = render(ReviewerRailHarness, { props: { reviewers: [] } });
    expect(rail(container)).toBeNull();
  });

  test('composes an Avatar per shown reviewer (no re-rolled disc)', () => {
    const { container } = render(ReviewerRailHarness, {
      props: {
        reviewers: [
          { initials: 'AB', state: 'approved' },
          { initials: 'CD', state: 'pending' },
        ],
      },
    });
    expect(container.querySelectorAll('.disc [data-testid="avatar"]')).toHaveLength(2);
  });

  test('the leading verdict is blocking-wins: changes beats pending beats approved', () => {
    const { container } = render(ReviewerRailHarness, {
      props: {
        reviewers: [
          { initials: 'AB', state: 'approved' },
          { initials: 'CD', state: 'pending' },
          { initials: 'EF', state: 'changes' },
        ],
      },
    });
    expect(verdictIcon(container)).toBe('circle-alert');
  });

  test('pending wins over approved when no changes are present', () => {
    const { container } = render(ReviewerRailHarness, {
      props: {
        reviewers: [
          { initials: 'AB', state: 'approved' },
          { initials: 'CD', state: 'pending' },
        ],
      },
    });
    expect(verdictIcon(container)).toBe('clock');
  });

  test('all approved shows the approved glyph', () => {
    const { container } = render(ReviewerRailHarness, {
      props: { reviewers: [{ initials: 'AB', state: 'approved' }] },
    });
    expect(verdictIcon(container)).toBe('check');
  });

  test('a reviewer with no state counts as pending', () => {
    const { container } = render(ReviewerRailHarness, {
      props: { reviewers: [{ initials: 'AB' }] },
    });
    expect(verdictIcon(container)).toBe('clock');
  });

  test('collapses reviewers past max into a +N overflow', () => {
    const { container } = render(ReviewerRailHarness, {
      props: {
        max: 2,
        reviewers: [
          { initials: 'AB', state: 'approved' },
          { initials: 'CD', state: 'approved' },
          { initials: 'EF', state: 'approved' },
          { initials: 'GH', state: 'approved' },
        ],
      },
    });
    expect(container.querySelectorAll('.disc [data-testid="avatar"]')).toHaveLength(2);
    expect(container.querySelector('[data-testid="reviewer-overflow"]')?.textContent).toBe('+2');
  });
});
