import { fireEvent, render } from '@testing-library/svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';
import Toast from './Toast.svelte';

afterEach(() => {
  vi.useRealTimers();
});

describe('Toast', () => {
  test('renders the message', () => {
    const { getByText } = render(Toast, {
      props: { message: 'Cleared 3 tabs', onDismiss: vi.fn() },
    });
    expect(getByText('Cleared 3 tabs')).not.toBeNull();
  });

  test('renders the action button when actionLabel is provided', () => {
    const { getByText } = render(Toast, {
      props: { message: 'Cleared 3 tabs', actionLabel: 'Undo', onDismiss: vi.fn() },
    });
    expect(getByText('Undo')).not.toBeNull();
  });

  test('renders no action button when actionLabel is absent', () => {
    const { container } = render(Toast, {
      props: { message: 'Saved', onDismiss: vi.fn() },
    });
    expect(container.querySelector('button')).toBeNull();
  });

  test('activating the action calls onAction then onDismiss', async () => {
    const calls: string[] = [];
    const onAction = vi.fn(() => calls.push('action'));
    const onDismiss = vi.fn(() => calls.push('dismiss'));
    const { getByText } = render(Toast, {
      props: { message: 'Cleared 3 tabs', actionLabel: 'Undo', onAction, onDismiss },
    });
    await fireEvent.click(getByText('Undo'));
    expect(onAction).toHaveBeenCalledOnce();
    expect(onDismiss).toHaveBeenCalledOnce();
    // Order matters: the action runs before the parent unmounts the toast.
    expect(calls).toEqual(['action', 'dismiss']);
  });

  test('auto-dismisses after the configured duration', () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    render(Toast, {
      props: { message: 'Cleared 3 tabs', actionLabel: 'Undo', onDismiss, duration: 5000 },
    });
    expect(onDismiss).not.toHaveBeenCalled();
    vi.advanceTimersByTime(4999);
    expect(onDismiss).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  test('clears its dismiss timer on unmount (no late dismiss)', () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    const { unmount } = render(Toast, {
      props: { message: 'Cleared 3 tabs', onDismiss, duration: 5000 },
    });
    unmount();
    vi.advanceTimersByTime(10000);
    expect(onDismiss).not.toHaveBeenCalled();
  });

  test('hover pauses the dismiss timer and resumes with the remaining time', () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    const { container } = render(Toast, {
      props: { message: 'Cleared 3 tabs', actionLabel: 'Undo', onDismiss, duration: 5000 },
    });
    const toast = container.querySelector('.toast') as HTMLElement;
    vi.advanceTimersByTime(2000); // 3000ms remain
    fireEvent.pointerEnter(toast); // pause
    vi.advanceTimersByTime(10000); // paused: stays visible
    expect(onDismiss).not.toHaveBeenCalled();
    fireEvent.pointerLeave(toast); // resume with 3000ms
    vi.advanceTimersByTime(2999);
    expect(onDismiss).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  test('focus within pauses the timer; Escape dismisses immediately', () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    const { container } = render(Toast, {
      props: { message: 'Cleared 3 tabs', actionLabel: 'Undo', onDismiss, duration: 5000 },
    });
    const toast = container.querySelector('.toast') as HTMLElement;
    fireEvent.focusIn(toast); // focus within → pause
    vi.advanceTimersByTime(10000);
    expect(onDismiss).not.toHaveBeenCalled();
    fireEvent.keyDown(toast, { key: 'Escape' });
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  test('focus moving between the toast’s own controls does not resume the timer', () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    const { container } = render(Toast, {
      props: { message: 'Cleared 3 tabs', actionLabel: 'Undo', onDismiss, duration: 5000 },
    });
    const toast = container.querySelector('.toast') as HTMLElement;
    const button = container.querySelector('button') as HTMLElement;
    fireEvent.focusIn(toast); // paused
    // A focusout whose relatedTarget stays within the toast must keep it paused.
    fireEvent.focusOut(toast, { relatedTarget: button });
    vi.advanceTimersByTime(10000);
    expect(onDismiss).not.toHaveBeenCalled();
  });
});
