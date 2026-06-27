import { render } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';
import AccountChipHarness from './AccountChip.test.harness.svelte';

const chip = (c: HTMLElement) => c.querySelector('[data-testid="account-chip"]') as HTMLElement;
const statusEl = (c: HTMLElement) =>
  c.querySelector('[data-testid="account-chip-status"]') as HTMLElement;

describe('AccountChip', () => {
  test('renders the identity label', () => {
    const { container } = render(AccountChipHarness, { props: { label: 'Personal' } });
    expect(chip(container).textContent).toContain('Personal');
  });

  test('pairs each status with a word (never colour-only)', () => {
    const cases = [
      ['connected', 'Connected'],
      ['browser-session', 'Browser session'],
      ['needs-token', 'Add a token'],
      ['signed-out', 'Reconnect'],
      ['public', 'Public'],
    ] as const;
    for (const [status, word] of cases) {
      const { container } = render(AccountChipHarness, { props: { status } });
      expect(chip(container).getAttribute('data-status')).toBe(status);
      expect(statusEl(container).textContent).toBe(word);
    }
  });

  test('a title sets the chip tooltip', () => {
    const { container } = render(AccountChipHarness, {
      props: { title: 'github.com — Work' },
    });
    expect(chip(container).getAttribute('title')).toBe('github.com — Work');
  });
});
