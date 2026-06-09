import { describe, expect, test, vi } from 'vitest';
import type { AppState } from '../shared/types';
import { createBroadcastApply } from './broadcast-apply';

/** A minimal AppState-ish snapshot — only the fields this logic touches matter, so the
 * fixtures are deliberately loosely typed (the apply logic compares JSON + assigns refs;
 * it never inspects tab/instance shape). */
function snap(over: Record<string, unknown>): AppState {
  return {
    spaces: [],
    activeSpaceByWindow: {},
    liveTabsById: {},
    spaceInstancesByWindow: {},
    pinnedBySpace: {},
    ...over,
  } as unknown as AppState;
}

function harness(live: { value: boolean }) {
  const state: Record<string, unknown> = {
    spaces: [],
    activeSpaceByWindow: {},
    liveTabsById: {},
    spaceInstancesByWindow: {},
    pinnedBySpace: {},
  };
  const flushQueue: Array<() => void> = [];
  const apply = createBroadcastApply({
    getField: (key) => state[key],
    setField: (key, value) => {
      state[key] = value;
    },
    isLive: () => live.value,
    scheduleFlush: (fn) => flushQueue.push(fn),
  });
  const runFlush = (): void => {
    for (const fn of flushQueue.splice(0)) fn();
  };
  return { state, apply, runFlush };
}

describe('createBroadcastApply', () => {
  test('applies changed fields and skips unchanged ones when no swipe is live', () => {
    const live = { value: false };
    const { state, apply } = harness(live);
    const tabs = { 1: { id: 1, title: 'a' } };
    apply.apply(snap({ activeSpaceByWindow: { 1: 's1' }, liveTabsById: tabs }));
    expect(state.activeSpaceByWindow).toEqual({ 1: 's1' });
    expect(state.liveTabsById).toBe(tabs); // heavy field applied immediately (not live)
  });

  test('DEFERS heavy fields while a swipe is live, but applies the cheap active-Space field instantly', () => {
    const live = { value: true };
    const { state, apply, runFlush } = harness(live);
    const newTabs = { 9: { id: 9, title: 'incoming' } };
    const newInstances = { 1: { s2: { tempTabIds: [9] } } };

    apply.apply(
      snap({
        activeSpaceByWindow: { 1: 's2' }, // cheap — drives reconcile + colour
        liveTabsById: newTabs, // heavy — must be held
        spaceInstancesByWindow: newInstances, // heavy — must be held
      }),
    );

    // The cheap field lands at once (the rail/colour stay live)…
    expect(state.activeSpaceByWindow).toEqual({ 1: 's2' });
    // …but the heavy tab fields are NOT yet applied — the freeze is held out of the stream.
    expect(state.liveTabsById).toEqual({});
    expect(state.spaceInstancesByWindow).toEqual({});

    // Momentum ends → live goes false → the buffered heavy render flushes on idle.
    live.value = false;
    apply.onLiveChange(false);
    runFlush();
    expect(state.liveTabsById).toBe(newTabs);
    expect(state.spaceInstancesByWindow).toBe(newInstances);
  });

  test('coalesces multiple live broadcasts to the LATEST heavy value, flushed once', () => {
    const live = { value: true };
    const { state, apply, runFlush } = harness(live);
    apply.apply(snap({ liveTabsById: { 1: { id: 1 } } }));
    apply.apply(snap({ liveTabsById: { 2: { id: 2 } } }));
    apply.apply(snap({ liveTabsById: { 3: { id: 3 } } }));
    expect(state.liveTabsById).toEqual({}); // nothing applied while live

    live.value = false;
    apply.onLiveChange(false);
    runFlush();
    expect(state.liveTabsById).toEqual({ 3: { id: 3 } }); // only the final value lands
  });

  test('a fresh post-swipe broadcast is NOT clobbered by the deferred idle flush (favicon-stuck-on-loading regression)', () => {
    const live = { value: true };
    const { state, apply, runFlush } = harness(live);

    // During the swipe the tab is still loading — the heavy field is deferred, so
    // the last value buffered mid-stream carries `status: 'loading'`.
    apply.apply(snap({ liveTabsById: { 1: { id: 1, status: 'loading' } } }));
    expect(state.liveTabsById).toEqual({});

    // Momentum ends; the idle flush is scheduled but has NOT run yet.
    live.value = false;
    apply.onLiveChange(false);

    // In the gap before the flush fires, the tab finishes loading and a fresher
    // broadcast lands — applied immediately because the swipe is over.
    apply.apply(snap({ liveTabsById: { 1: { id: 1, status: 'complete' } } }));
    expect(state.liveTabsById).toEqual({ 1: { id: 1, status: 'complete' } });

    // The deferred flush now runs. It must flush the LATEST state, never the stale
    // mid-swipe snapshot — otherwise `status` regresses to 'loading' and the row
    // sticks on its spinner until the next broadcast.
    runFlush();
    expect(state.liveTabsById).toEqual({ 1: { id: 1, status: 'complete' } });
  });

  test('onLiveChange(true) never flushes, and a no-buffer idle is a no-op', () => {
    const live = { value: true };
    const { apply } = harness(live);
    const sched = vi.fn();
    // With nothing buffered, going idle schedules no flush.
    const a2 = createBroadcastApply({
      getField: () => undefined,
      setField: () => undefined,
      isLive: () => true,
      scheduleFlush: sched,
    });
    a2.onLiveChange(false);
    expect(sched).not.toHaveBeenCalled();
    // Going live also never flushes.
    apply.apply(snap({ liveTabsById: { 1: { id: 1 } } }));
    apply.onLiveChange(true);
    expect(sched).not.toHaveBeenCalled();
  });
});
