import { afterEach, describe, expect, test, vi } from 'vitest';
import { isSwipeLive, onSwipeLiveChange, setSwipeLive } from './swipe-live';

// Reset the module-level state between tests by setting swipeLive back to false
// and clearing any lingering listeners via the returned unsubscribe handles.
afterEach(() => {
  setSwipeLive(false);
});

describe('swipe-live — isSwipeLive / setSwipeLive', () => {
  test('initial state is false', () => {
    expect(isSwipeLive()).toBe(false);
  });

  test('setSwipeLive(true) flips the flag', () => {
    setSwipeLive(true);
    expect(isSwipeLive()).toBe(true);
  });

  test('setSwipeLive with the same value is a no-op (idempotent)', () => {
    setSwipeLive(false);
    setSwipeLive(false); // should not throw or change anything
    expect(isSwipeLive()).toBe(false);

    setSwipeLive(true);
    setSwipeLive(true); // already true
    expect(isSwipeLive()).toBe(true);
  });
});

describe('swipe-live — onSwipeLiveChange listeners', () => {
  test('listener is called when the flag changes', () => {
    const fn = vi.fn();
    const unsub = onSwipeLiveChange(fn);

    setSwipeLive(true);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(true);

    setSwipeLive(false);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith(false);

    unsub();
  });

  test('listener is NOT called when value is unchanged (idempotent guard)', () => {
    const fn = vi.fn();
    const unsub = onSwipeLiveChange(fn);

    setSwipeLive(false); // already false — no-op
    expect(fn).not.toHaveBeenCalled();

    setSwipeLive(true);
    fn.mockClear();
    setSwipeLive(true); // already true — no-op
    expect(fn).not.toHaveBeenCalled();

    unsub();
  });

  test('multiple listeners are all notified', () => {
    const a = vi.fn();
    const b = vi.fn();
    const unsubA = onSwipeLiveChange(a);
    const unsubB = onSwipeLiveChange(b);

    setSwipeLive(true);
    expect(a).toHaveBeenCalledWith(true);
    expect(b).toHaveBeenCalledWith(true);

    unsubA();
    unsubB();
  });

  test('unsubscribed listener is no longer called', () => {
    const fn = vi.fn();
    const unsub = onSwipeLiveChange(fn);
    unsub();

    setSwipeLive(true);
    expect(fn).not.toHaveBeenCalled();
  });

  test('unsubscribing one listener does not affect others', () => {
    const a = vi.fn();
    const b = vi.fn();
    const unsubA = onSwipeLiveChange(a);
    const unsubB = onSwipeLiveChange(b);

    unsubA();
    setSwipeLive(true);
    expect(a).not.toHaveBeenCalled();
    expect(b).toHaveBeenCalledWith(true);

    unsubB();
  });

  test('returns the unsubscribe function', () => {
    const unsub = onSwipeLiveChange(vi.fn());
    expect(typeof unsub).toBe('function');
    unsub();
  });
});

describe('swipe-live — typical main.ts usage pattern (flush on idle)', () => {
  test('a deferred flush runs once when the swipe goes idle', () => {
    const flush = vi.fn();
    let scheduled = false;
    const scheduleFlush = (): void => {
      if (!scheduled) {
        scheduled = true;
        flush();
      }
    };

    // Simulate what main.ts does: subscribe and call scheduleFlush when live → false.
    const unsub = onSwipeLiveChange((live) => {
      if (!live) scheduleFlush();
    });

    setSwipeLive(true); // stream opens — no flush yet
    expect(flush).not.toHaveBeenCalled();

    setSwipeLive(false); // stream goes idle — flush fires
    expect(flush).toHaveBeenCalledTimes(1);

    unsub();
  });

  test('rapid live/idle toggles only flush on each idle transition', () => {
    const flushCalls: boolean[] = [];
    const unsub = onSwipeLiveChange((live) => {
      flushCalls.push(live);
    });

    setSwipeLive(true);
    setSwipeLive(false);
    setSwipeLive(true);
    setSwipeLive(false);

    expect(flushCalls).toEqual([true, false, true, false]);
    unsub();
  });
});
