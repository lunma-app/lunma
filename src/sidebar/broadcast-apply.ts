import type { AppState } from '../shared/types';

/**
 * Field-by-field broadcast apply with heavy-render deferral — the extension's port of the
 * Model C spike's `armRenderIdle`.
 *
 * The service worker broadcasts the FULL state on every change. Applying it wholesale
 * re-renders everything; applying it field-by-field (skipping unchanged fields) keeps an
 * `activateSpace` echo cheap. But that echo is NOT only `activeSpaceByWindow` — the SW's
 * activation closes the outgoing home tab and rebuilds groups, so it genuinely mutates the
 * HEAVY fields (`liveTabsById`, `spaceInstancesByWindow`) that every panel's tab list
 * derives from. Re-deriving those synchronously mid-swipe freezes the main thread; the
 * wheel stream reads the freeze as a gap, the gap re-arm fires, and the still-flowing
 * momentum commits a SECOND Space ("jumps two").
 *
 * So while a swipe stream is live the heavy fields are BUFFERED and flushed on the next
 * idle once momentum ends — the render runs OUTSIDE the gesture window, exactly like the
 * spike. The cheap fields (incl. `activeSpaceByWindow`, which drives the reconcile, and
 * the already-optimistic colour) always apply immediately, so nothing visible lags.
 */
export const HEAVY_FIELDS: ReadonlySet<keyof AppState> = new Set<keyof AppState>([
  'liveTabsById',
  'spaceInstancesByWindow',
]);

export interface BroadcastApplyDeps {
  /** Current value of a store field (for the unchanged-field skip). */
  getField: (key: keyof AppState) => unknown;
  /** Commit a field to the store. */
  setField: (key: keyof AppState, value: unknown) => void;
  /** Is a carousel swipe stream live right now (gesture + momentum tail)? */
  isLive: () => boolean;
  /** Schedule the deferred-heavy flush on the next idle (rAF in the app, sync in tests). */
  scheduleFlush: (fn: () => void) => void;
}

export interface BroadcastApply {
  /** Apply one broadcast snapshot. */
  apply: (next: AppState) => void;
  /** Call on every swipe-live transition; flushes the buffered heavy fields on `false`. */
  onLiveChange: (live: boolean) => void;
}

export function createBroadcastApply(deps: BroadcastApplyDeps): BroadcastApply {
  // The most recent broadcast snapshot. The deferred idle flush re-applies the
  // HEAVY fields from THIS — always the freshest state — never a value captured
  // mid-swipe. So when a broadcast lands in the gap between momentum-end and the
  // scheduled idle flush (e.g. a tab's `status: 'complete'`, applied IMMEDIATELY
  // because the swipe is already over), the flush's JSON guard sees the field is
  // unchanged and leaves it be — it can never clobber the fresh value back to the
  // stale one. That clobber was the favicon-stuck-on-loading bug: the row showed
  // the resolved icon, then the stale flush reverted `status` to `'loading'`, so
  // the spinner returned and stuck until the NEXT broadcast (e.g. re-activating
  // the tab) re-applied fresh state.
  let latest: AppState | null = null;
  // A heavy field was deferred during a live swipe and still owes an idle flush.
  let heavyDeferred = false;

  const applyField = (key: keyof AppState, value: unknown): void => {
    if (JSON.stringify(deps.getField(key)) !== JSON.stringify(value)) {
      deps.setField(key, value);
    }
  };

  const apply = (next: AppState): void => {
    latest = next;
    for (const key of Object.keys(next) as (keyof AppState)[]) {
      if (HEAVY_FIELDS.has(key) && deps.isLive()) {
        heavyDeferred = true; // hold the freeze out of the stream; flush at idle
      } else {
        applyField(key, next[key]);
      }
    }
  };

  const onLiveChange = (live: boolean): void => {
    if (live || !heavyDeferred) return;
    deps.scheduleFlush(() => {
      heavyDeferred = false;
      if (latest === null) return;
      // Flush the heavy fields from the LATEST snapshot — the JSON guard skips any
      // a post-swipe broadcast already applied — so the render runs outside the
      // gesture window WITHOUT regressing a field a fresher broadcast just set.
      for (const key of HEAVY_FIELDS) applyField(key, latest[key]);
    });
  };

  return { apply, onLiveChange };
}
