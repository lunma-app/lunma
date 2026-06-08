import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { swipe } from './swipe';

function makeTouch(clientX: number, clientY: number, identifier = 0): Touch {
  return { clientX, clientY, identifier } as unknown as Touch;
}

function touchEvent(type: string, touches: Touch[], changed?: Touch[]): TouchEvent {
  const evt = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(evt, 'touches', { value: touches });
  Object.defineProperty(evt, 'changedTouches', { value: changed ?? touches });
  return evt as unknown as TouchEvent;
}

function setup(threshold = 30, maxDrag = 160) {
  const node = document.createElement('div');
  document.body.appendChild(node);
  const onDrag = vi.fn();
  const onCommit = vi.fn();
  const onCancel = vi.fn();
  const handle = swipe(node, { onDrag, onCommit, onCancel, threshold, maxDrag });
  return { node, onDrag, onCommit, onCancel, handle };
}

describe('swipe — touch gestures (commit on threshold)', () => {
  test('leftward drag past threshold commits "next" immediately', () => {
    const { node, onDrag, onCommit, onCancel } = setup();
    node.dispatchEvent(touchEvent('touchstart', [makeTouch(200, 100)]));
    node.dispatchEvent(touchEvent('touchmove', [makeTouch(180, 100)]));
    expect(onDrag).toHaveBeenCalledTimes(1);
    expect(onCommit).not.toHaveBeenCalled();
    node.dispatchEvent(touchEvent('touchmove', [makeTouch(160, 100)]));
    expect(onCommit).toHaveBeenCalledWith('next');
    // Subsequent moves are ignored.
    node.dispatchEvent(touchEvent('touchmove', [makeTouch(50, 100)]));
    expect(onCommit).toHaveBeenCalledTimes(1);
    // touchend after a commit does NOT re-fire cancel.
    node.dispatchEvent(touchEvent('touchend', [], [makeTouch(50, 100)]));
    expect(onCancel).not.toHaveBeenCalled();
  });

  test('rightward drag past threshold commits "prev"', () => {
    const { node, onCommit } = setup();
    node.dispatchEvent(touchEvent('touchstart', [makeTouch(100, 100)]));
    node.dispatchEvent(touchEvent('touchmove', [makeTouch(140, 100)]));
    expect(onCommit).toHaveBeenCalledWith('prev');
  });

  test('release below threshold ends with onCancel', () => {
    const { node, onCommit, onCancel } = setup();
    node.dispatchEvent(touchEvent('touchstart', [makeTouch(100, 100)]));
    node.dispatchEvent(touchEvent('touchmove', [makeTouch(115, 100)]));
    node.dispatchEvent(touchEvent('touchend', [], [makeTouch(115, 100)]));
    expect(onCommit).not.toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test('vertical-dominant motion cancels early so page scroll passes through', () => {
    const { node, onDrag, onCommit, onCancel } = setup();
    node.dispatchEvent(touchEvent('touchstart', [makeTouch(100, 100)]));
    node.dispatchEvent(touchEvent('touchmove', [makeTouch(108, 140)]));
    node.dispatchEvent(touchEvent('touchend', [], [makeTouch(108, 140)]));
    expect(onCancel).toHaveBeenCalled();
    expect(onCommit).not.toHaveBeenCalled();
    expect(onDrag).not.toHaveBeenCalled();
  });

  test('multi-touch starts are ignored', () => {
    const { node, onCommit, onCancel } = setup();
    node.dispatchEvent(touchEvent('touchstart', [makeTouch(100, 100), makeTouch(200, 100)]));
    node.dispatchEvent(touchEvent('touchmove', [makeTouch(20, 100)]));
    node.dispatchEvent(touchEvent('touchend', [], [makeTouch(20, 100)]));
    expect(onCommit).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
  });

  test('touchcancel below threshold calls onCancel', () => {
    const { node, onCancel } = setup();
    node.dispatchEvent(touchEvent('touchstart', [makeTouch(100, 100)]));
    node.dispatchEvent(touchEvent('touchmove', [makeTouch(115, 100)]));
    node.dispatchEvent(touchEvent('touchcancel', []));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  // Touch at a no-neighbour edge: with no Space to commit to in the drag
  // direction the touch path does NOT commit — it rubber-band-drags (the host
  // damps it) and springs back on release. No wrap.
  test('touch past threshold at the last Space does NOT commit (no wrap)', () => {
    const node = document.createElement('div');
    document.body.appendChild(node);
    const onDrag = vi.fn();
    const onCommit = vi.fn();
    const onCancel = vi.fn();
    swipe(node, { onDrag, onCommit, onCancel, threshold: 30, maxDrag: 160, canGoNext: false });
    node.dispatchEvent(touchEvent('touchstart', [makeTouch(200, 100)]));
    node.dispatchEvent(touchEvent('touchmove', [makeTouch(150, 100)])); // −50 px, past 30
    expect(onCommit).not.toHaveBeenCalled();
    expect(onDrag).toHaveBeenCalledWith(-50);
    node.dispatchEvent(touchEvent('touchend', [], [makeTouch(150, 100)]));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

describe('swipe — lifecycle', () => {
  test('destroy() removes listeners', () => {
    const { node, onCommit, onCancel, handle } = setup();
    expect(() => handle?.destroy?.()).not.toThrow();
    node.dispatchEvent(touchEvent('touchstart', [makeTouch(100, 100)]));
    node.dispatchEvent(touchEvent('touchmove', [makeTouch(20, 100)]));
    node.dispatchEvent(touchEvent('touchend', [], [makeTouch(20, 100)]));
    expect(onCommit).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
  });
});

function wheelEvent(deltaX: number, deltaY: number, target?: Element): WheelEvent {
  const evt = new Event('wheel', { bubbles: true, cancelable: true });
  Object.defineProperty(evt, 'deltaX', { value: deltaX });
  Object.defineProperty(evt, 'deltaY', { value: deltaY });
  if (target) Object.defineProperty(evt, 'target', { value: target });
  return evt as unknown as WheelEvent;
}

describe('swipe — trackpad (wheel) gestures', () => {
  let nowMs = 0;
  let perfSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers();
    nowMs = 1000;
    perfSpy = vi.spyOn(performance, 'now').mockImplementation(() => nowMs);
  });

  afterEach(() => {
    perfSpy.mockRestore();
    vi.useRealTimers();
  });

  test('finger-LEFT (positive deltaX, natural scroll) past threshold commits "next"', () => {
    const { node, onCommit } = setup();
    node.dispatchEvent(wheelEvent(40, 0));
    expect(onCommit).toHaveBeenCalledWith('next');
  });

  test('finger-RIGHT (negative deltaX, natural scroll) past threshold commits "prev"', () => {
    const { node, onCommit } = setup();
    node.dispatchEvent(wheelEvent(-40, 0));
    expect(onCommit).toHaveBeenCalledWith('prev');
  });

  test('sub-threshold drag ends with onCancel after the idle window', () => {
    const { node, onCommit, onCancel } = setup();
    node.dispatchEvent(wheelEvent(15, 0));
    vi.advanceTimersByTime(300);
    expect(onCommit).not.toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test('vertical-dominant wheel passes through (page scroll)', () => {
    const { node, onDrag, onCommit, onCancel } = setup();
    for (let i = 0; i < 5; i++) {
      node.dispatchEvent(wheelEvent(5, 30));
      nowMs += 16;
    }
    vi.advanceTimersByTime(300);
    expect(onDrag).not.toHaveBeenCalled();
    expect(onCommit).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
  });

  test('one gesture = one commit even on long swipes with varying magnitudes', () => {
    const { node, onCommit, onDrag } = setup();
    node.dispatchEvent(wheelEvent(40, 0));
    expect(onCommit).toHaveBeenCalledTimes(1);
    // A LONG continuing gesture (no release gap): magnitudes vary, but once the
    // stream has committed every remaining event is dropped until a real
    // release. A single gesture must never jump multiple Spaces.
    const varying = [40, 35, 42, 38, 45, 40, 33, 41, 37, 44, 39, 36, 43, 40, 38];
    for (const dx of varying) {
      nowMs += 16;
      node.dispatchEvent(wheelEvent(dx, 0));
    }
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onDrag).not.toHaveBeenCalled();
  });

  // An in-stream direction flip (no release gap) NEVER produces a second commit.
  // Real macOS momentum tails carry small opposite-sign jitter; treating that as
  // a deliberate reversal was the old "jumping back and forth". A deliberate
  // reverse is expressed by lifting the fingers (a real release), exercised
  // below.
  test('opposite-direction events within the same stream do NOT re-commit (no oscillation on jitter)', () => {
    const { node, onCommit } = setup();
    node.dispatchEvent(wheelEvent(40, 0));
    expect(onCommit).toHaveBeenCalledWith('next');
    expect(onCommit).toHaveBeenCalledTimes(1);
    for (let i = 0; i < 10; i++) {
      nowMs += 16;
      node.dispatchEvent(wheelEvent(-40, 0));
    }
    expect(onCommit).toHaveBeenCalledTimes(1);
  });

  test('reverse-swipe after a real release commits the opposite direction', () => {
    const { node, onCommit } = setup();
    node.dispatchEvent(wheelEvent(40, 0));
    expect(onCommit).toHaveBeenNthCalledWith(1, 'next');
    // User lifts fingers (a real release ≥ REARM_GAP_MS) then swipes the OTHER
    // way. A fresh stream after a real release always works.
    nowMs += 150;
    node.dispatchEvent(wheelEvent(-40, 0));
    expect(onCommit).toHaveBeenNthCalledWith(2, 'prev');
    expect(onCommit).toHaveBeenCalledTimes(2);
  });

  test('same-direction continuation is still blocked (no multi-jump from a long swipe)', () => {
    const { node, onCommit } = setup();
    node.dispatchEvent(wheelEvent(40, 0));
    expect(onCommit).toHaveBeenCalledTimes(1);
    for (let i = 0; i < 20; i++) {
      nowMs += 16;
      node.dispatchEvent(wheelEvent(40, 0));
    }
    expect(onCommit).toHaveBeenCalledTimes(1);
  });

  // "At most one commit per physical gesture": a momentum tail decays
  // monotonically, so the decay floor keeps falling and nothing ever jumps above
  // floor·RATIO — velocity re-arm never trips and the whole tail is dropped.
  test('a monotonically decaying momentum tail never re-arms (one commit)', () => {
    const { node, onCommit } = setup();
    node.dispatchEvent(wheelEvent(40, 0));
    expect(onCommit).toHaveBeenCalledTimes(1);
    const longDecay = [35, 33, 30, 28, 25, 23, 21, 19, 17, 15, 13, 11, 10, 9, 8, 7, 6, 5, 4, 3];
    for (const dx of longDecay) {
      nowMs += 22;
      node.dispatchEvent(wheelEvent(dx, 0));
    }
    expect(onCommit).toHaveBeenCalledTimes(1);
  });

  // Velocity re-arm (the headline): a real re-swipe lets the momentum decay into a VALLEY,
  // then a fresh flick keeps RISING over consecutive frames; that valley-then-rise re-arms
  // the stream WITHOUT a 120ms silence, and a subsequent threshold crossing commits again.
  // The tail spans realistic time (continuous ~8ms frames) so the re-arm lands past the
  // post-commit cooldown — a genuine re-flick always does.
  test('velocity re-arm: a sustained rising re-acceleration re-swipes mid-momentum', () => {
    const { node, onCommit } = setup();
    node.dispatchEvent(wheelEvent(40, 0)); // commit; momentum decays after
    expect(onCommit).toHaveBeenNthCalledWith(1, 'next');
    // A realistic decaying tail that dips into a valley and carries past the cooldown.
    for (const dx of [30, 25, 21, 18, 15, 13, 11, 9, 8, 6, 5, 4, 3, 3]) {
      nowMs += 8;
      node.dispatchEvent(wheelEvent(dx, 0));
    }
    expect(onCommit).toHaveBeenCalledTimes(1);
    // A RISING re-flick AFTER the valley: 15 then 25 → 2 consecutive rising frames → re-arm
    // on the 2nd (accumulator zeroed; 25 < the 30px threshold, so it does not commit yet).
    nowMs += 8;
    node.dispatchEvent(wheelEvent(15, 0));
    expect(onCommit).toHaveBeenCalledTimes(1);
    nowMs += 8;
    node.dispatchEvent(wheelEvent(25, 0));
    expect(onCommit).toHaveBeenCalledTimes(1);
    // The re-armed gesture crosses the threshold → second commit.
    nowMs += 8;
    node.dispatchEvent(wheelEvent(25, 0));
    expect(onCommit).toHaveBeenCalledTimes(2);
    expect(onCommit).toHaveBeenNthCalledWith(2, 'next');
  });

  // The "jumps two" fix: a single-frame spike (a coalesced momentum event when a busy main
  // thread makes Chrome merge several events into one) rises for ONE frame then drops back
  // to the decay — it must NOT re-arm. Only a SUSTAINED rise (a real re-flick) does.
  test('a single-frame spike does not re-arm (the coalescing false-positive)', () => {
    const { node, onCommit } = setup();
    node.dispatchEvent(wheelEvent(40, 0));
    for (const dx of [22, 14, 8, 5, 3]) {
      nowMs += 8;
      node.dispatchEvent(wheelEvent(dx, 0));
    }
    expect(onCommit).toHaveBeenCalledTimes(1);
    // One fat frame (35) then straight back down (6, 4, 3) — a single rise, not sustained.
    for (const dx of [35, 6, 4, 3]) {
      nowMs += 8;
      node.dispatchEvent(wheelEvent(dx, 0));
    }
    expect(onCommit).toHaveBeenCalledTimes(1);
  });

  // The narrow-sidebar "jumps two" from ONE hard swipe (captured from real hardware): the
  // 15% threshold is crossed by accumulation BEFORE the swipe reaches peak velocity, so the
  // SAME gesture's still-RISING momentum (committed at |dx|≈20, then climbing to ≈66) would
  // otherwise re-arm on itself and commit a second Space. There is no decay VALLEY in a
  // rising-to-peak swipe, so the valley requirement rejects it — only a real re-flick (which
  // always dips first) re-arms.
  test('a single swipe whose momentum keeps RISING past the commit does not re-commit (valley fix)', () => {
    const { node, onCommit } = setup();
    node.dispatchEvent(wheelEvent(40, 0)); // commit once
    expect(onCommit).toHaveBeenCalledTimes(1);
    // The SAME gesture keeps accelerating — |dx| climbs monotonically, never dipping into a
    // valley. A sustained rise alone is NOT enough to re-arm without a preceding decay.
    for (const dx of [40, 90, 95, 88]) {
      nowMs += 8;
      node.dispatchEvent(wheelEvent(dx, 0));
    }
    expect(onCommit).toHaveBeenCalledTimes(1); // no valley → no re-arm → no second commit
  });

  // A re-arm only RE-OPENS the stream — it never commits by itself; the new
  // gesture must still re-cross the threshold.
  test('velocity re-arm alone does not commit — the threshold must be re-crossed', () => {
    const { node, onCommit, onDrag } = setup();
    node.dispatchEvent(wheelEvent(40, 0));
    // Realistic decaying tail (valley + past the cooldown).
    for (const dx of [30, 25, 21, 18, 15, 13, 11, 9, 8, 6, 5, 4, 3, 3]) {
      nowMs += 8;
      node.dispatchEvent(wheelEvent(dx, 0));
    }
    expect(onCommit).toHaveBeenCalledTimes(1);
    onDrag.mockClear();
    // A rising re-flick 15 → 25 re-arms on the 2nd frame, but 25px < the 30px threshold →
    // a live drag, not a commit.
    nowMs += 8;
    node.dispatchEvent(wheelEvent(15, 0));
    nowMs += 8;
    node.dispatchEvent(wheelEvent(25, 0));
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onDrag).toHaveBeenCalledWith(-25);
  });

  // The field "skips two Spaces" regression: a single hard flick spawns a noisy
  // decaying momentum tail (dips, then isolated single-frame bumps). The sustained-rise
  // rule rejects every bump — each rises for at most one frame then falls back, never two
  // consecutive rising frames — so the gesture commits exactly once.
  test('a noisy decaying momentum tail with single-frame jitter never re-commits (skips-two fix)', () => {
    const { node, onCommit } = setup();
    node.dispatchEvent(wheelEvent(40, 0)); // commit once
    expect(onCommit).toHaveBeenCalledTimes(1);
    // Decay from the peak, then jitter where every bump is a single rising frame (rise,
    // fall, rise, fall) — never two consecutive rises.
    const tail = [30, 24, 19, 15, 11, 8, 6, 4, 3, 9, 4, 8, 3, 7, 2, 6, 3, 5, 2, 4];
    for (const dx of tail) {
      nowMs += 8;
      node.dispatchEvent(wheelEvent(dx, 0));
    }
    expect(onCommit).toHaveBeenCalledTimes(1);
  });

  test('noise filter: sub-3px wheel events are ignored entirely (no onDrag)', () => {
    const { node, onDrag, onCommit, onCancel } = setup();
    for (let i = 0; i < 20; i++) {
      nowMs += 16;
      node.dispatchEvent(wheelEvent(2, 0));
    }
    vi.advanceTimersByTime(300);
    expect(onDrag).not.toHaveBeenCalled();
    expect(onCommit).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
  });

  test('after a real release (gap >= REARM_GAP_MS) a new stream commits immediately', () => {
    const { node, onCommit } = setup();
    node.dispatchEvent(wheelEvent(40, 0));
    expect(onCommit).toHaveBeenCalledTimes(1);
    nowMs += 150;
    node.dispatchEvent(wheelEvent(40, 0));
    expect(onCommit).toHaveBeenCalledTimes(2);
  });

  test('wheel events inside [data-no-swipe] are passed through', () => {
    const { node, onDrag, onCommit } = setup();
    const inner = document.createElement('div');
    inner.setAttribute('data-no-swipe', '1');
    node.appendChild(inner);
    node.dispatchEvent(wheelEvent(-40, 0, inner));
    expect(onDrag).not.toHaveBeenCalled();
    expect(onCommit).not.toHaveBeenCalled();
  });
});

// No-neighbour edge behaviour. At the first / last Space a wheel push does NOT commit and
// does NOT over-scroll: the rail stays LOCKED at rest (onDrag(0), no feedback), the COMMIT
// accumulator is capped SMALL so a reverse swipe escapes the wall almost at once.
describe('swipe — wheel edges (no-over-scroll lock)', () => {
  let nowMs = 0;
  let perfSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers();
    nowMs = 1000;
    perfSpy = vi.spyOn(performance, 'now').mockImplementation(() => nowMs);
  });

  afterEach(() => {
    perfSpy.mockRestore();
    vi.useRealTimers();
  });

  function setupEdge(extra: { canGoNext?: boolean; canGoPrev?: boolean }) {
    const node = document.createElement('div');
    document.body.appendChild(node);
    const onDrag = vi.fn();
    const onCommit = vi.fn();
    const onCancel = vi.fn();
    swipe(node, { onDrag, onCommit, onCancel, threshold: 30, maxDrag: 160, ...extra });
    return { node, onDrag, onCommit, onCancel };
  }

  test('forward push at the LAST Space locks the rail at rest (no commit, no over-scroll)', () => {
    const { node, onDrag, onCommit } = setupEdge({ canGoNext: false });
    node.dispatchEvent(wheelEvent(40, 0)); // finger left → would be "next"
    nowMs += 8;
    node.dispatchEvent(wheelEvent(40, 0));
    expect(onCommit).not.toHaveBeenCalled();
    // The rail never over-scrolls — onDrag reports a resting 0.
    expect(onDrag).toHaveBeenLastCalledWith(0);
  });

  test('backward push at the FIRST Space locks the rail at rest', () => {
    const { node, onDrag, onCommit } = setupEdge({ canGoPrev: false });
    node.dispatchEvent(wheelEvent(-40, 0)); // finger right → would be "prev"
    expect(onCommit).not.toHaveBeenCalled();
    expect(onDrag).toHaveBeenLastCalledWith(0);
  });

  test('a reverse swipe escapes the wall and commits prev (never trapped)', () => {
    const { node, onCommit } = setupEdge({ canGoNext: false, canGoPrev: true });
    // Push hard into the end wall — locked, no commit.
    for (const dx of [40, 40, 40]) {
      node.dispatchEvent(wheelEvent(dx, 0));
      nowMs += 8;
    }
    expect(onCommit).not.toHaveBeenCalled();
    // The commit accumulator was capped small (20px), so a short reverse unwinds it and
    // crosses the prev threshold — the wall never traps the user.
    node.dispatchEvent(wheelEvent(-20, 0));
    nowMs += 8;
    node.dispatchEvent(wheelEvent(-40, 0));
    expect(onCommit).toHaveBeenCalledWith('prev');
    expect(onCommit).toHaveBeenCalledTimes(1);
  });
});
