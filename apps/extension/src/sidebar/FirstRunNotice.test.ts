import { cleanup, fireEvent, render } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import FirstRunNoticeHarness from './FirstRunNotice.test.harness.svelte';

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

function noticeText(minutes: number): string {
  cleanup(); // each call renders fresh — unmount the prior notice first
  const { container } = render(FirstRunNoticeHarness, {
    props: { autoArchiveIdleMinutes: minutes },
  });
  return (
    (container.querySelector('[data-testid="first-run-notice"]') as HTMLElement).textContent ?? ''
  );
}

describe('FirstRunNotice', () => {
  test('renders the disclosure copy with the threshold derived from idle minutes', () => {
    const { getByTestId } = render(FirstRunNoticeHarness, {
      props: { autoArchiveIdleMinutes: 720 },
    });
    const notice = getByTestId('first-run-notice');
    expect(notice.textContent).toContain('Auto-archive is on');
    expect(notice.textContent).toContain('12 hours');
    expect(notice.textContent).toContain('restorable for 7 days');
  });

  test('formats the idle threshold (hours, days, minutes, mixed, pluralisation)', () => {
    // The threshold copy is derived live from `autoArchiveIdleMinutes`.
    expect(noticeText(60)).toContain('1 hour ');
    expect(noticeText(1440)).toContain('1 day ');
    expect(noticeText(2880)).toContain('2 days ');
    expect(noticeText(30)).toContain('30 minutes');
    expect(noticeText(1)).toContain('1 minute ');
    expect(noticeText(90)).toContain('1 hour 30 minutes');
    // Floors at 1 minute for a zero/negative threshold.
    expect(noticeText(0)).toContain('1 minute ');
  });

  test('renders both inline text actions (the compact notice drops the corner ✕)', () => {
    const { getByText, queryByTestId } = render(FirstRunNoticeHarness);
    expect(getByText('Got it')).not.toBeNull();
    expect(getByText('Manage in settings')).not.toBeNull();
    // The redundant corner ✕ is gone (D4) — "Got it" is the dismiss action.
    expect(queryByTestId('first-run-dismiss')).toBeNull();
  });

  test('"Got it" fires onDismiss', async () => {
    const onDismiss = vi.fn();
    const { getByText } = render(FirstRunNoticeHarness, { props: { onDismiss } });
    await fireEvent.click(getByText('Got it'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  test('"Manage in settings" fires onManage (not onDismiss)', async () => {
    const onManage = vi.fn();
    const onDismiss = vi.fn();
    const { getByText } = render(FirstRunNoticeHarness, { props: { onManage, onDismiss } });
    await fireEvent.click(getByText('Manage in settings'));
    expect(onManage).toHaveBeenCalledTimes(1);
    expect(onDismiss).not.toHaveBeenCalled();
  });

  test('reduced-motion: copy and actions render regardless of the motion preference', () => {
    // The fade+rise is CSS-only and fully gated by `prefers-reduced-motion`; the
    // notice's content and affordances never depend on motion being available.
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    );
    const { getByText, getByTestId } = render(FirstRunNoticeHarness);
    expect(getByTestId('first-run-notice')).not.toBeNull();
    expect(getByText('Got it')).not.toBeNull();
    expect(getByText('Manage in settings')).not.toBeNull();
  });
});
