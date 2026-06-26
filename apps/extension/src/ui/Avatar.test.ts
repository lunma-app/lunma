import { render } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';
import AvatarHarness from './Avatar.test.harness.svelte';

const avatar = (c: HTMLElement) => c.querySelector('[data-testid="avatar"]') as HTMLElement;

describe('Avatar', () => {
  test('renders its initials', () => {
    const { container } = render(AvatarHarness, { props: { initials: 'EF' } });
    expect(avatar(container).textContent).toBe('EF');
  });

  test('defaults to the md size and no ring', () => {
    const { container } = render(AvatarHarness, { props: { initials: 'AB' } });
    expect(avatar(container).getAttribute('data-size')).toBe('md');
    expect(avatar(container).getAttribute('data-ring')).toBe('none');
  });

  test('reflects the requested size', () => {
    const { container } = render(AvatarHarness, { props: { initials: 'AB', size: 'sm' } });
    expect(avatar(container).getAttribute('data-size')).toBe('sm');
  });

  test.each(['approved', 'changes', 'pending'] as const)('reflects the %s ring', (ring) => {
    const { container } = render(AvatarHarness, { props: { initials: 'AB', ring } });
    expect(avatar(container).getAttribute('data-ring')).toBe(ring);
  });

  test('with a title it is a labelled img; without, it is decorative', () => {
    const titled = render(AvatarHarness, { props: { initials: 'AB', title: 'Ada B' } });
    expect(avatar(titled.container).getAttribute('role')).toBe('img');
    expect(avatar(titled.container).getAttribute('aria-label')).toBe('Ada B');
    expect(avatar(titled.container).getAttribute('title')).toBe('Ada B');

    const bare = render(AvatarHarness, { props: { initials: 'AB' } });
    expect(avatar(bare.container).getAttribute('role')).toBeNull();
    expect(avatar(bare.container).getAttribute('aria-hidden')).toBe('true');
  });
});
