import { fireEvent, render } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import AccountConnectFieldHarness from './AccountConnectField.test.harness.svelte';

const input = (c: HTMLElement) =>
  c.querySelector('[data-testid="account-token-input"]') as HTMLInputElement;
const connectBtn = (c: HTMLElement) =>
  c.querySelector('[data-testid="account-connect-button"]') as HTMLButtonElement;

describe('AccountConnectField', () => {
  test('a tokenless account opens expanded with the token field', () => {
    const { container } = render(AccountConnectFieldHarness, { props: { hasToken: false } });
    expect(input(container)).not.toBeNull();
    expect(input(container).getAttribute('type')).toBe('password');
  });

  test('a stored token collapses to "Token set · Replace" and never echoes', () => {
    const { container } = render(AccountConnectFieldHarness, { props: { hasToken: true } });
    expect(container.querySelector('[data-testid="account-token-set"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="account-token-input"]')).toBeNull();
  });

  test('Replace reveals the field', async () => {
    const { container } = render(AccountConnectFieldHarness, { props: { hasToken: true } });
    await fireEvent.click(
      container.querySelector('[data-testid="account-replace-trigger"]') as HTMLElement,
    );
    expect(input(container)).not.toBeNull();
  });

  test('Connect fires onConnect with the entered token, then clears the field', async () => {
    const onConnect = vi.fn();
    const { container } = render(AccountConnectFieldHarness, { props: { onConnect } });
    await fireEvent.input(input(container), { target: { value: 'ghp-secret' } });
    await fireEvent.click(connectBtn(container));
    expect(onConnect).toHaveBeenCalledWith('ghp-secret');
    expect(input(container).value).toBe('');
  });

  test('Connect is disabled with an empty token', () => {
    const { container } = render(AccountConnectFieldHarness, {});
    expect(connectBtn(container).disabled).toBe(true);
  });

  test('a Cancel renders next to Connect only when onCancel is given', async () => {
    const bare = render(AccountConnectFieldHarness, {});
    expect(bare.container.querySelector('[data-testid="account-connect-cancel"]')).toBeNull();

    const onCancel = vi.fn();
    const { container } = render(AccountConnectFieldHarness, { props: { onCancel } });
    const cancel = container.querySelector('[data-testid="account-connect-cancel"]') as HTMLElement;
    expect(cancel).not.toBeNull();
    await fireEvent.click(cancel);
    expect(onCancel).toHaveBeenCalledOnce();
  });

  test('an optional field frames the token as an upgrade', () => {
    const { container } = render(AccountConnectFieldHarness, {
      props: { requirement: 'optional' },
    });
    expect(container.textContent).toContain('Add a token');
  });

  test('renders the bad-token error and the help link', () => {
    const { container } = render(AccountConnectFieldHarness, {
      props: { error: "That token didn't work", helpUrl: 'https://example.com/pat' },
    });
    expect(
      (container.querySelector('[data-testid="account-connect-error"]') as HTMLElement).textContent,
    ).toContain("That token didn't work");
    expect(
      (container.querySelector('[data-testid="account-help"]') as HTMLAnchorElement).href,
    ).toContain('https://example.com/pat');
  });
});
