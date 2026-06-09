import type { Action } from 'svelte/action';

export interface SwipeOptions {
  /** Fires continuously while the user is dragging BELOW the commit threshold.
   * Sign convention: positive = finger pulled right (will activate next),
   * negative = pulled left (will activate previous). */
  onDrag: (offset: number) => void;
  /** Fires the instant |drag offset| crosses the threshold. */
  onCommit: (direction: 'next' | 'prev') => void;
  /** Fires when the gesture ends without crossing the threshold. */
  onCancel: () => void;
  /** Fires `true` on the first event of a wheel stream and `false` once the stream goes
   * IDLE — REARM_GAP_MS after the last event, i.e. when the gesture AND its momentum tail
   * have ended. The host uses this to DEFER heavy reactive renders (the broadcast-driven
   * tab-list re-render) out of the momentum window — the spike's `armRenderIdle` — so a
   * commit-time freeze never coalesces the momentum into a phantom re-acceleration. */
  onStreamActive?: (active: boolean) => void;
  /** Whether a NEXT Space exists (a forward commit is possible). Default `true`.
   * When `false`, a forward wheel gesture LOCKS at the edge (no commit, no over-scroll —
   * the rail stays at rest). */
  canGoNext?: boolean;
  /** Whether a PREVIOUS Space exists (a backward commit is possible). Default `true`.
   * When `false`, a backward wheel gesture locks at the edge. */
  canGoPrev?: boolean;
  /** |offset| in CSS px at which `onCommit` fires. Default 80. */
  threshold?: number;
  /** Visual cap forwarded to `onDrag`. Default 999 (host clamps further). */
  maxDrag?: number;
}

/**
 * Horizontal-swipe Svelte action. Commits on threshold crossing during the
 * gesture — no waiting for release detection. Direction convention matches
 * the macOS browser-history gesture: swipe RIGHT → next, swipe LEFT → prev.
 *
 * Touch path uses hand-rolled `TouchEvent` listeners and ends cleanly on
 * `touchend`. Wheel path uses raw `WheelEvent`s: a physical trackpad gesture,
 * plus the macOS momentum tail it spawns, is a CONTINUOUS stream of wheel events
 * (~8ms apart, continuing — no real gap — after the fingers lift, with decaying
 * magnitudes). A stream commits (or cancels) at most ONCE; afterwards every
 * remaining event is dropped — the whole momentum tail included — until the
 * stream RE-ARMS.
 *
 * A settled stream re-arms on EITHER of two signals (the Model C spike's rule):
 *
 *   (a) Silence gap >= REARM_GAP_MS — the guaranteed fallback. A clear pause is
 *       the fully reliable signal that the fingers lifted and momentum finished.
 *       120ms clears macOS momentum (events ms apart) and sits below the cadence
 *       of deliberate sequential swipes, so a real re-swipe-after-a-beat is never
 *       throttled.
 *
 *   (b) Sustained velocity re-acceleration — the fast path that unlocks rapid-fire
 *       re-swiping mid-momentum (without waiting for the gap). A genuine re-flick is
 *       recognised by the one thing a momentum tail cannot fake: a re-acceleration
 *       that KEEPS RISING. We re-arm only when `|dx|` is clear of the decay floor
 *       (`> decayFloor * REARM_RATIO`, which the smooth tail fails — it only decreases)
 *       AND rising vs the previous frame, for `REARM_SUSTAIN` consecutive frames. This
 *       is the fix for the field "jumps two Spaces": on a busy main thread Chrome
 *       COALESCES several momentum events into one fat event, which looks exactly like a
 *       re-flick by magnitude — but the coalesced spike is a SINGLE frame that drops
 *       straight back to the decay, while a real flick accelerates over several frames.
 *       Magnitude rules (decay-floor alone, peak-relative) all failed because the
 *       coalesced spike is the same size as a flick; the sustained-RISE test is what
 *       distinguishes them. (Validated in the Model C spike under simulated load.)
 *
 * A re-arm only clears `settled` and zeroes the accumulator — the new gesture must
 * still cross the threshold to commit, so a re-arm can never by itself jump a Space.
 * The retained gap (a) is the floor that always eventually re-arms.
 *
 * Edges (no-over-scroll lock). At a no-neighbour edge a wheel gesture does NOT commit and
 * does NOT over-scroll: the rail stays LOCKED at rest (`onDrag(0)`) with no feedback. The
 * accumulator is capped small so a reverse swipe only unwinds that tiny amount to escape
 * ("cannot get out of it" is impossible). The stream stays live (it does not settle), so a
 * reverse swipe still works in the same stream after a brief pause.
 *
 * Two guards keep the gap honest:
 *   - The stream clock advances for EVERY horizontal event, BEFORE the noise /
 *     vertical-dominant filters, so a run of dropped jitter frames can never
 *     freeze the clock and manufacture a phantom gap.
 *   - Pure vertical events (deltaX === 0) never touch the clock.
 *
 * Children marked `[data-no-swipe]` (e.g. the bottom Space switcher with
 * its own horizontal overflow) pass wheel events through untouched.
 */
export const swipe: Action<HTMLElement, SwipeOptions> = (node, params) => {
  let opts = params;

  function clamp(v: number, max: number): number {
    if (v > max) return max;
    if (v < -max) return -max;
    return v;
  }

  function getNow(): number {
    return typeof performance !== 'undefined' && typeof performance.now === 'function'
      ? performance.now()
      : Date.now();
  }

  // --- touch ---
  let touchStartX = 0;
  let touchStartY = 0;
  let touchActive = false;
  let touchHorizontal = false;
  let touchCommitted = false;

  function handleTouchStart(event: TouchEvent): void {
    if (event.touches.length !== 1) {
      touchActive = false;
      return;
    }
    const t = event.touches[0];
    if (!t) return;
    touchStartX = t.clientX;
    touchStartY = t.clientY;
    touchActive = true;
    touchHorizontal = false;
    touchCommitted = false;
  }

  function handleTouchMove(event: TouchEvent): void {
    if (!touchActive || touchCommitted) return;
    const t = event.touches[0];
    if (!t) return;
    const dx = t.clientX - touchStartX;
    const dy = t.clientY - touchStartY;
    if (!touchHorizontal) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        touchActive = false;
        opts.onCancel();
        return;
      }
      touchHorizontal = true;
    }
    const max = opts.maxDrag ?? 999;
    const clamped = clamp(dx, max);
    const threshold = opts.threshold ?? 80;
    const canNext = opts.canGoNext ?? true;
    const canPrev = opts.canGoPrev ?? true;
    // Carousel-push: swipe LEFT → next (right space slides in from the right
    // while current goes left with the finger). Swipe RIGHT → previous. Only
    // commit toward a Space that exists; at a no-neighbour edge the touch path
    // springs back via the host (onCommit no-wraps → onCancel) and the live drag
    // is rubber-banded by the host, so it never over-scrolls.
    if (clamped <= -threshold && canNext) {
      touchCommitted = true;
      opts.onCommit('next');
      return;
    }
    if (clamped >= threshold && canPrev) {
      touchCommitted = true;
      opts.onCommit('prev');
      return;
    }
    opts.onDrag(clamped);
  }

  function handleTouchEnd(_event: TouchEvent): void {
    if (!touchActive) return;
    touchActive = false;
    if (touchCommitted) return;
    opts.onCancel();
  }

  function handleTouchCancel(): void {
    if (!touchActive) return;
    touchActive = false;
    if (!touchCommitted) opts.onCancel();
  }

  // --- wheel (trackpad) ---
  let wheelAccum = 0;
  let lastWheelTime = 0;
  // Stream clock of the last wheel commit — the velocity re-arm cooldown floor.
  let lastCommitTime = Number.NEGATIVE_INFINITY;
  // True once the current stream has committed or cancelled — every later event
  // is dropped until the stream re-arms (silence gap OR velocity re-acceleration).
  let streamSettled = false;
  // Smallest |deltaX| seen since the stream settled (the decaying tail's running min).
  // A re-acceleration must clear this floor by a ratio. Reset on settle / re-arm.
  let decayFloor = Number.POSITIVE_INFINITY;
  // Peak |deltaX| since the stream settled, and whether the tail has since decayed into a
  // VALLEY (fallen below peak * REARM_DECAY_FRAC). A re-arm requires a valley first — see
  // REARM_DECAY_FRAC above. Reset on settle / re-arm.
  let peakMag = 0;
  let decayed = false;
  // Previous frame's |deltaX| and the count of consecutive RISING-above-floor frames —
  // the sustained-rise velocity re-arm. A genuine re-flick rises over several frames; a
  // coalesced momentum spike is a single frame. Reset on settle / re-arm.
  let prevMag = Number.POSITIVE_INFINITY;
  let reaccelRun = 0;
  function resetReaccel(): void {
    decayFloor = Number.POSITIVE_INFINITY;
    peakMag = 0;
    decayed = false;
    prevMag = Number.POSITIVE_INFINITY;
    reaccelRun = 0;
  }
  let wheelIdleTimer: ReturnType<typeof setTimeout> | undefined;
  // Stream-active tracking for the host's defer-heavy-render signal (the spike's
  // `armRenderIdle`): the stream is active from its first event until REARM_GAP_MS of
  // silence (the gesture + its whole momentum tail). `onStreamActive(false)` fires when
  // momentum ends, so the host can flush its deferred render OUTSIDE the momentum window.
  let streamActive = false;
  let streamIdleTimer: ReturnType<typeof setTimeout> | undefined;
  // Debug logger toggled via `localStorage.setItem('lunma.swipe-debug', '1')`.
  // When on, every wheel event logs a compact single line — easy to filter
  // on `[swipe]` in DevTools.
  const SWIPE_DEBUG: boolean =
    typeof localStorage !== 'undefined' && localStorage.getItem('lunma.swipe-debug') === '1';

  // A silence of at least this long re-arms a settled stream — the guaranteed
  // fallback (signal a). 120ms clears macOS momentum (events ~8ms apart) and sits
  // comfortably below the cadence of deliberate sequential swipes. BUT a commit-time
  // re-render that freezes the main thread for longer than this injects a phantom gap
  // mid-momentum → the post-freeze momentum re-arms and re-commits → "jumps". Live
  // tuning knob (no rebuild): `localStorage['lunma.swipe-gap']` — raise it above the
  // worst commit-freeze to stop those jumps (rapid-fire is unaffected; it uses the
  // velocity re-arm, not the gap).
  const REARM_GAP_MS = ((): number => {
    const raw =
      typeof localStorage !== 'undefined'
        ? Number.parseInt(localStorage.getItem('lunma.swipe-gap') ?? '', 10)
        : Number.NaN;
    return Number.isFinite(raw) && raw >= 40 ? raw : 120;
  })();
  // Velocity re-arm (signal b) — the sustained-rise rule (Model C spike, validated under
  // simulated main-thread load). Re-arm when |dx| is clear of the decay floor
  // (`> floor * REARM_RATIO`) AND rising vs the previous frame, for REARM_SUSTAIN
  // consecutive frames. A decaying tail never sustains a rise; a coalesced momentum spike
  // (busy main thread → Chrome merges events into one fat frame) rises for a SINGLE frame
  // then drops; only a real re-flick rises across frames. So a re-swipe is recognised
  // mid-momentum without ever re-arming on momentum — the fix for "jumps two Spaces".
  const REARM_RATIO = 2;
  const REARM_MIN_MAG = 8;
  // Consecutive rising-above-floor frames required to re-arm. 2 rejects a one-frame
  // coalescing spike while a genuine accelerating re-flick passes (rare miss → retry).
  // Live tuning knob (no rebuild): set `localStorage['lunma.swipe-sustain']` and reopen
  // the sidebar — raise it (3, 4) if a heavier main-thread load coalesces momentum into
  // multi-frame rising spikes that still slip through; lower it (1) for snappier re-swipe.
  const REARM_SUSTAIN = ((): number => {
    const raw =
      typeof localStorage !== 'undefined'
        ? Number.parseInt(localStorage.getItem('lunma.swipe-sustain') ?? '', 10)
        : Number.NaN;
    return Number.isFinite(raw) && raw >= 1 ? raw : 2;
  })();
  // A re-arm also requires the tail to have DECAYED into a VALLEY first — |dx| must have
  // fallen below `peak * REARM_DECAY_FRAC` since the stream settled. Rationale: a single
  // physical swipe rises to ONE velocity peak then only decays; in the NARROW sidebar the
  // 15% threshold is crossed by accumulation BEFORE that peak, so the same gesture's still-
  // climbing momentum (e.g. committed at |dx|=20, peak |dx|=66) otherwise re-arms on its
  // own rise → a phantom second commit. A real re-flick always comes AFTER the momentum
  // dies, so it clears the valley; the rising swipe-to-peak never does. (The wide spike
  // commits AT the peak, so its tail only decays — it never hit this.) Live knob:
  // `localStorage['lunma.swipe-decay-frac']` (default 0.35).
  const REARM_DECAY_FRAC = ((): number => {
    const raw =
      typeof localStorage !== 'undefined'
        ? Number.parseFloat(localStorage.getItem('lunma.swipe-decay-frac') ?? '')
        : Number.NaN;
    return Number.isFinite(raw) && raw > 0 && raw < 1 ? raw : 0.35;
  })();
  // Belt-and-braces: the VELOCITY re-arm is suppressed for this long after a commit, so a
  // second commit can never land too soon behind the first regardless of momentum shape. A
  // real re-flick needs the momentum to die then re-accelerate (≥150ms in practice), so this
  // never blocks a deliberate rapid re-swipe; it only rejects a phantom second commit (the
  // captured field jump was 66ms behind its first). The gap re-arm — a genuine release — is
  // exempt. Live knob: `localStorage['lunma.swipe-cooldown']` (default 140ms).
  const COMMIT_COOLDOWN_MS = ((): number => {
    const raw =
      typeof localStorage !== 'undefined'
        ? Number.parseInt(localStorage.getItem('lunma.swipe-cooldown') ?? '', 10)
        : Number.NaN;
    return Number.isFinite(raw) && raw >= 0 ? raw : 90;
  })();
  const CANCEL_IDLE_MS = 220;
  const NOISE_THRESHOLD_PX = 3;
  // No-neighbour edge: the COMMIT accumulator is capped this small so a reverse swipe only
  // unwinds a tiny amount to escape the wall — it can never trap the user.
  const EDGE_ESCAPE_CAP = 20;

  function fireCancel(): void {
    wheelIdleTimer = undefined;
    if (wheelAccum === 0 || streamSettled) return;
    opts.onCancel();
    streamSettled = true;
    wheelAccum = 0;
    resetReaccel();
  }

  function settle(): void {
    streamSettled = true;
    wheelAccum = 0;
    resetReaccel();
    if (wheelIdleTimer !== undefined) {
      clearTimeout(wheelIdleTimer);
      wheelIdleTimer = undefined;
    }
  }

  function armIdleCancel(): void {
    if (wheelIdleTimer !== undefined) clearTimeout(wheelIdleTimer);
    wheelIdleTimer = setTimeout(fireCancel, CANCEL_IDLE_MS);
  }

  // Mark the wheel stream active and (re)arm the idle timer. Called for EVERY horizontal
  // wheel event — including the dropped momentum tail — so the stream stays "active"
  // until REARM_GAP_MS after the last momentum event. The host defers its heavy render
  // (the spike's `armRenderIdle`) for this whole window, then flushes on `false`.
  function markStreamActive(): void {
    if (!streamActive) {
      streamActive = true;
      opts.onStreamActive?.(true);
    }
    if (streamIdleTimer !== undefined) clearTimeout(streamIdleTimer);
    streamIdleTimer = setTimeout(() => {
      streamIdleTimer = undefined;
      streamActive = false;
      opts.onStreamActive?.(false);
    }, REARM_GAP_MS);
  }

  function handleWheel(event: WheelEvent): void {
    // [data-no-swipe] descendants (e.g. the bottom switcher) opt out
    // entirely — their own horizontal-overflow handles wheel themselves.
    const target = event.target;
    if (target instanceof Element && target.closest('[data-no-swipe]')) return;

    const dx = event.deltaX;
    const dy = event.deltaY;

    // Pure vertical page-scroll (no horizontal component): never part of a
    // swipe stream. Cancel a pending sub-threshold horizontal drag if one is
    // in flight, but NEVER touch the stream clock — so a horizontal swipe that
    // follows vertical scrolling always starts a fresh stream.
    if (dx === 0) {
      if (!streamSettled && wheelIdleTimer !== undefined) {
        clearTimeout(wheelIdleTimer);
        fireCancel();
      }
      return;
    }

    // CRITICAL: preventDefault on EVERY horizontal wheel event. macOS Chrome
    // decides whether to spin up momentum based on whether the FIRST event of
    // the gesture was prevented; letting one slip (sub-3px, briefly
    // vertical-dominant) activates momentum that then bridges the stream gap.
    event.preventDefault();

    // Advance the stream clock for every horizontal event that reaches here —
    // BEFORE the noise / vertical-dominant filters below — so a run of dropped
    // jitter frames can never freeze the clock and manufacture a phantom release
    // gap. (The two full opt-outs above — `[data-no-swipe]` and pure-vertical
    // `dx === 0` — deliberately do NOT advance it: they are not part of a swipe
    // stream.)
    const now = getNow();
    const gap = lastWheelTime === 0 ? Number.POSITIVE_INFINITY : now - lastWheelTime;
    lastWheelTime = now;
    // Mark the stream active for the host's defer-heavy-render signal (the whole gesture
    // + momentum tail, until REARM_GAP_MS of silence). The deferred render then runs
    // OUTSIDE the momentum window, so it can never freeze the thread mid-stream and
    // manufacture the phantom gap that re-commits a second Space.
    markStreamActive();

    // Re-arm a settled stream on EITHER signal (see the action doc comment):
    //   (a) a silence gap >= REARM_GAP_MS — a genuine release, the fallback; or
    //   (b) a SUSTAINED velocity re-acceleration — a fresh flick.
    const mag = Math.abs(dx);
    if (gap >= REARM_GAP_MS) {
      streamSettled = false;
      wheelAccum = 0;
      resetReaccel(); // a real release ends the physical gesture
      if (wheelIdleTimer !== undefined) {
        clearTimeout(wheelIdleTimer);
        wheelIdleTimer = undefined;
      }
    } else if (streamSettled) {
      // Velocity re-arm — a genuine re-swipe is recognised by what a momentum tail can
      // NEVER fake: a re-acceleration that KEEPS RISING. A coalesced momentum spike (when
      // a busy main thread makes Chrome merge several momentum events into one fat event)
      // is a SINGLE frame that immediately drops back to the decaying tail; a real re-flick
      // accelerates over several consecutive frames. So re-arm only when |dx| is clear of
      // the decay floor (`> decayFloor * REARM_RATIO`, rejecting the smooth tail) AND rising
      // vs the previous frame, for `REARM_SUSTAIN` consecutive frames. This is what finally
      // stopped the field "jumps two Spaces": magnitude alone can't tell a coalesced spike
      // from a re-flick (both are large), but the spike doesn't SUSTAIN a rise; a flick does.
      // (Validated in the Model C spike under simulated main-thread load.)
      if (mag < decayFloor) decayFloor = mag;
      if (mag > peakMag) peakMag = mag;
      if (mag < peakMag * REARM_DECAY_FRAC) decayed = true; // the tail dipped into a valley
      const rising = mag > decayFloor * REARM_RATIO && mag > REARM_MIN_MAG && mag > prevMag;
      prevMag = mag;
      reaccelRun = rising ? reaccelRun + 1 : 0;
      // Re-arm only on a sustained rise that follows a genuine VALLEY, AND not within the
      // post-commit cooldown — a single swipe climbing to its own peak (early-committed in
      // the narrow sidebar) never dips, and even a dip cannot fire a second commit too soon
      // behind the first; a real re-flick always dips first AND lands well past the cooldown.
      if (decayed && reaccelRun >= REARM_SUSTAIN && now - lastCommitTime >= COMMIT_COOLDOWN_MS) {
        streamSettled = false;
        wheelAccum = 0;
        resetReaccel();
        if (wheelIdleTimer !== undefined) {
          clearTimeout(wheelIdleTimer);
          wheelIdleTimer = undefined;
        }
      }
    }

    if (SWIPE_DEBUG) {
      console.debug(
        `[swipe] dx=${dx.toFixed(1).padStart(7)} gap=${gap.toFixed(1).padStart(6)} settled=${streamSettled ? 'Y' : 'N'} accum=${wheelAccum.toFixed(0).padStart(4)}`,
      );
    }

    // Drop everything in a stream that's already committed/cancelled — the whole
    // momentum tail — until the release gap above reopens it.
    if (streamSettled) return;

    // Noise filter for sub-resolution events: they never accumulate (the clock
    // was already advanced above, so they cannot manufacture a gap).
    if (Math.abs(dx) < NOISE_THRESHOLD_PX && Math.abs(dy) < NOISE_THRESHOLD_PX) return;
    // Vertical-dominant: page-scroll bias. Cancel an in-progress sub-threshold
    // drag; do not accumulate.
    if (Math.abs(dy) >= Math.abs(dx) * 2) {
      if (wheelIdleTimer !== undefined) {
        clearTimeout(wheelIdleTimer);
        fireCancel();
      }
      return;
    }

    // Carousel-push sign convention: finger LEFT (deltaX > 0 natural) →
    // wheelAccum negative → NEXT. Finger RIGHT → positive → PREVIOUS.
    wheelAccum = clamp(wheelAccum - dx, opts.maxDrag ?? 999);

    const threshold = opts.threshold ?? 80;
    const canNext = opts.canGoNext ?? true;
    const canPrev = opts.canGoPrev ?? true;

    if (wheelAccum <= -threshold && canNext) {
      lastCommitTime = now;
      settle();
      opts.onCommit('next');
      return;
    }
    if (wheelAccum >= threshold && canPrev) {
      lastCommitTime = now;
      settle();
      opts.onCommit('prev');
      return;
    }

    // No-neighbour edge: there is no Space to commit to in the push direction. LOCK the rail
    // at rest (onDrag(0) — no over-scroll, no feedback); cap the accumulator small so a
    // reverse swipe only unwinds that tiny amount to escape. The stream stays LIVE (no
    // settle), so a reverse swipe still works after a beat.
    const atEnd = wheelAccum < 0 && !canNext;
    const atStart = wheelAccum > 0 && !canPrev;
    if (atEnd || atStart) {
      wheelAccum = Math.sign(wheelAccum) * Math.min(Math.abs(wheelAccum), EDGE_ESCAPE_CAP);
      opts.onDrag(0);
      armIdleCancel();
      return;
    }

    // live 1:1 follow
    opts.onDrag(wheelAccum);
    armIdleCancel();
  }

  node.addEventListener('touchstart', handleTouchStart, { passive: true });
  node.addEventListener('touchmove', handleTouchMove, { passive: true });
  node.addEventListener('touchend', handleTouchEnd, { passive: true });
  node.addEventListener('touchcancel', handleTouchCancel, { passive: true });
  node.addEventListener('wheel', handleWheel, { passive: false });

  return {
    update(next: SwipeOptions) {
      opts = next;
    },
    destroy() {
      node.removeEventListener('touchstart', handleTouchStart);
      node.removeEventListener('touchmove', handleTouchMove);
      node.removeEventListener('touchend', handleTouchEnd);
      node.removeEventListener('touchcancel', handleTouchCancel);
      node.removeEventListener('wheel', handleWheel);
      if (wheelIdleTimer !== undefined) clearTimeout(wheelIdleTimer);
      if (streamIdleTimer !== undefined) clearTimeout(streamIdleTimer);
      if (streamActive) {
        streamActive = false;
        opts.onStreamActive?.(false); // release the host's deferred render on teardown
      }
    },
  };
};
