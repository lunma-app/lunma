// Shared "a carousel swipe stream is live" flag — the extension's port of the Model C
// spike's `armRenderIdle` (spike lines 290-293).
//
// The spike's `doCommit` defers its heavy render burst to STREAM-IDLE so a commit never
// blocks the main thread mid-momentum — otherwise the render freeze would coalesce the
// momentum tail into a phantom wheel-gap that re-arms the stream and commits a SECOND
// Space ("jumps two"). The extension's only async render source is the service-worker
// state broadcast: an `activateSpace` echo closes the outgoing home tab and rebuilds tab
// groups, so it genuinely mutates `liveTabsById` + `spaceInstancesByWindow` and re-derives
// every panel's tab list. `main.ts` reads this flag to HOLD those heavy fields while a
// swipe stream is live and flush them on the next idle once momentum ends — keeping the
// freeze out of the gesture window exactly like the spike. Cheap fields
// (`activeSpaceByWindow`, which drives the reconcile, and the already-optimistic colour)
// always apply immediately, so nothing visible lags — the failure of the old broadcast
// gate, which buffered everything.
//
// The "live" window here is the WHEEL STREAM (first event → REARM_GAP_MS of silence, i.e.
// the gesture AND its whole momentum tail), NOT the settle: the settle ends well before
// macOS momentum does, and flushing mid-momentum is exactly the freeze we must avoid.

let swipeLive = false;
const listeners = new Set<(live: boolean) => void>();

/** Set by the sidebar App from the swipe action's stream-active signal. */
export function setSwipeLive(value: boolean): void {
  if (value === swipeLive) return;
  swipeLive = value;
  for (const listener of listeners) listener(value);
}

export function isSwipeLive(): boolean {
  return swipeLive;
}

/** main.ts subscribes to flush the deferred heavy fields when the stream goes idle. */
export function onSwipeLiveChange(fn: (live: boolean) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
