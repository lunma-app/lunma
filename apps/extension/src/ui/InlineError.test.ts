import { cleanup, render } from '@testing-library/svelte';
import { afterEach, describe, expect, test } from 'vitest';
import InlineErrorHarness from './InlineError.test.harness.svelte';

afterEach(() => cleanup());

describe('InlineError', () => {
  test('renders the message in a role="alert" box', () => {
    const { container } = render(InlineErrorHarness, { props: { message: 'Import failed.' } });
    const alert = container.querySelector('.inline-error') as HTMLElement;
    expect(alert).not.toBeNull();
    expect(alert.getAttribute('role')).toBe('alert');
    expect(alert.textContent?.trim()).toBe('Import failed.');
  });

  test('forwards a testid', () => {
    const { container } = render(InlineErrorHarness, { props: { testid: 'import-error' } });
    expect(container.querySelector('[data-testid="import-error"]')).not.toBeNull();
  });
});
