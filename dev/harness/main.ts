import './chrome-shim'; // MUST be first — sets globalThis.chrome before App's deps load
import { mount } from 'svelte';
import { LunmaStore } from '../../src/shared/store.svelte';
import type { AppState, SpaceColor, WindowId } from '../../src/shared/types';
import App from '../../src/sidebar/App.svelte';
import { createBroadcastApply } from '../../src/sidebar/broadcast-apply';
import { isSwipeLive, onSwipeLiveChange } from '../../src/sidebar/swipe-live';

// ─────────────────────────────────────────────────────────────────────────────
// "jumps two" experiment harness — runs the REAL prod sidebar (App.svelte + swipe.ts
// + createBroadcastApply + swipe-live) against a simulated service worker, so the spike's
// MULTI-JUMP experiment can be reproduced on PRODUCTION code.
//
// The mechanism the experiment proves: a swipe commits → the SW echoes a broadcast that
// (like the real `orchestrateActivation`) mutates the HEAVY tab fields → applying that
// synchronously freezes the main thread → the still-flowing momentum reads the freeze as a
// gap → the gap re-arm fires → a SECOND commit. Toggle "defer heavy render to idle" (the
// prod `armRenderIdle`) and the freeze moves OUT of the momentum window → no phantom gap →
// no second commit. Same toggle, same outcome as the spike.
// ─────────────────────────────────────────────────────────────────────────────

const COLORS: SpaceColor[] = ['blue', 'orange', 'green', 'purple', 'red'];
const WINDOW_ID = 1 as WindowId;

const store = new LunmaStore();
for (let i = 0; i < COLORS.length; i++) {
  store.state.spaces.push({
    id: `s${i}`,
    name: `Space ${i + 1}`,
    color: COLORS[i] as SpaceColor,
    icon: 'star' as never,
  });
}
store.state.activeSpaceByWindow[WINDOW_ID] = 's0';

mount(App, {
  target: document.getElementById('app') as HTMLElement,
  props: { store, windowId: WINDOW_ID, tint: 'vivid' },
});

// ── Experiment knobs ─────────────────────────────────────────────────────────
const exp = {
  defer: true, // wire the prod armRenderIdle defer (the fix) ON/OFF
  commitStallMs: 200, // the simulated heavy-render freeze, run when the heavy fields apply
  bgLoadMs: 0, // continuous main-thread load per animation frame (live-swipe realism)
};

/** Block the main thread for `ms` — a synchronous tab-list re-render burst. */
function heavyRender(ms: number): void {
  const end = performance.now() + ms;
  while (performance.now() < end) {
    /* busy-wait */
  }
}

// ── The REAL prod broadcast apply: defer the heavy fields while a swipe is live.
// `setField` runs the freeze (heavyRender) exactly WHEN a heavy field is committed — at
// commit when the defer is off, at stream-idle when it is on. `isLive` gates on BOTH the
// experiment toggle and the genuine swipe-live flag App reports from the action.
const HEAVY = new Set<keyof AppState>(['liveTabsById', 'spaceInstancesByWindow']);
const sink = store.state as unknown as Record<string, unknown>;
const broadcastApply = createBroadcastApply({
  getField: (key) => store.state[key],
  setField: (key, value) => {
    // ONE freeze per commit: the stall represents the whole tab re-render, so run it on
    // the representative heavy field only (not once per heavy field).
    if (key === 'liveTabsById') heavyRender(exp.commitStallMs);
    sink[key] = value;
  },
  isLive: () => exp.defer && isSwipeLive(),
  scheduleFlush: (fn) => requestAnimationFrame(() => fn()),
});
// Reset the per-gesture commit counter when the swipe stream goes idle, and let the prod
// apply flush its deferred heavy fields.
onSwipeLiveChange((live) => {
  broadcastApply.onLiveChange(live);
  if (!live) commitsThisStream = 0;
});

// ── Simulated coordinator ────────────────────────────────────────────────────
// An `activateSpace` command (the App's commit) echoes a full-state broadcast that — like
// the real SW's orchestrateActivation — changes the active Space AND the heavy tab fields
// (home-tab close / group rebuild). Applied through the prod apply above, SYNCHRONOUSLY,
// so when the defer is off the freeze lands inside the wheel handler exactly as in prod.
let probe = 0;
let commitCount = 0;
let multiJump = 0;
// Commits seen since the wheel stream went live — the robust multi-jump signal: a 2nd
// commit within ONE live gesture IS the "jumps two" (gesture-based, immune to how long the
// freeze stalls the clock, unlike a time-window heuristic).
let commitsThisStream = 0;

function simulateActivation(spaceId: string): void {
  commitCount += 1;
  commitsThisStream += 1;
  const jumped = commitsThisStream > 1;
  if (jumped) multiJump += 1;
  // Record the commit in the wheel timeline; snapshot the surrounding events on a jump so a
  // real jumping swipe can be replayed and dissected.
  wheelLog.push({ dx: 0, t: Math.round(performance.now()), commit: spaceId });
  if (jumped) lastJumpCapture = wheelLog.slice(-90);
  logLine(
    jumped
      ? `⚠ MULTI-JUMP — commit #${commitsThisStream} in ONE gesture → Space ${spaceId}`
      : `commit → Space ${spaceId}   (defer=${exp.defer ? 'on' : 'off'}, stall=${exp.commitStallMs}ms)`,
    jumped ? 'jump' : '',
  );
  renderCounters();

  probe += 1;
  const next = {
    activeSpaceByWindow: { ...store.state.activeSpaceByWindow, [WINDOW_ID]: spaceId },
    liveTabsById: { __probe: probe },
    spaceInstancesByWindow: { __probe: probe },
  } as unknown as AppState;
  broadcastApply.apply(next);
}

// Override chrome.runtime.sendMessage (set by chrome-shim) so an activateSpace command runs
// the simulated coordinator SYNCHRONOUSLY inside the bus.send call (i.e. inside the wheel
// handler), reproducing the in-handler freeze. Still records to __commits for assertions.
const commits = (window as unknown as { __commits: string[] }).__commits;
const chromeObj = (
  globalThis as unknown as {
    chrome: { runtime: { sendMessage: (m: unknown) => Promise<unknown> } };
  }
).chrome;
const emitMessage = (window as unknown as { __emitMessage: (m: unknown) => void }).__emitMessage;
chromeObj.runtime.sendMessage = (msg: unknown): Promise<unknown> => {
  const m = msg as { id?: string; cmd?: { kind?: string; payload?: { spaceId?: string } } };
  const cmd = m?.cmd;
  if (cmd?.kind === 'activateSpace' && cmd.payload?.spaceId) {
    commits.push(cmd.payload.spaceId);
    simulateActivation(cmd.payload.spaceId);
  }
  // Ack the command so the fire-and-forget bus.send resolves (no 10s timeout spam).
  if (m?.id) emitMessage({ type: 'lunma/command-ack', id: m.id, result: 'ok' });
  return Promise.resolve(undefined);
};

// ── Real-input recorder ───────────────────────────────────────────────────────
// Capture every wheel event (and commit marker) so a REAL trackpad swipe that jumps can be
// read back and replayed — synthetic flicks can't reproduce Chrome's coalescing of a real
// momentum tail. On a multi-jump we snapshot the surrounding events into `lastJumpCapture`.
interface WheelRec {
  dx: number;
  t: number;
  commit?: string;
}
const wheelLog: WheelRec[] = [];
let lastJumpCapture: WheelRec[] = [];
window.addEventListener(
  'wheel',
  (e) => {
    wheelLog.push({ dx: Math.round((e as WheelEvent).deltaX * 100) / 100, t: Math.round(performance.now()) });
    if (wheelLog.length > 800) wheelLog.shift();
  },
  { capture: true, passive: true },
);

// ── Continuous background main-thread load (for live manual swiping realism) ──
function bgFrame(): void {
  if (exp.bgLoadMs > 0) heavyRender(exp.bgLoadMs);
  requestAnimationFrame(bgFrame);
}
requestAnimationFrame(bgFrame);

// ── Control panel UI ─────────────────────────────────────────────────────────
const controls = document.getElementById('controls') as HTMLElement;
controls.innerHTML = `
  <h1>Lunma · prod swipe — “jumps two” experiment</h1>
  <p class="sub">Real <code>App.svelte</code> + <code>swipe.ts</code> + <code>createBroadcastApply</code> + <code>swipe-live</code>.
  A commit echoes a broadcast that mutates the heavy tab fields and freezes the thread for the stall.
  Turn <span class="strong">“defer heavy render to idle”</span> OFF and flick hard → MULTI-JUMP climbs.
  Turn it ON (the prod fix) → it holds at 0. Two-finger swipe the panel on the left, or use the buttons.</p>
  <div class="counters">
    <div class="counter"><div class="label">Commits</div><div class="value" id="c-commits">0</div></div>
    <div class="counter" id="c-jump-box"><div class="label">Multi-jump</div><div class="value" id="c-jump">0</div></div>
  </div>
  <div class="knobs">
    <label class="strong"><input type="checkbox" id="k-defer" checked /> defer heavy render to idle</label>
    <label>commit stall <input type="number" id="k-stall" value="200" step="10" /> ms</label>
    <label>bg load <input type="number" id="k-bg" value="0" step="10" /> ms/frame</label>
  </div>
  <div class="btns">
    <button class="primary" id="b-flick">Run 20 hard flicks</button>
    <button id="b-flick1">Single flick</button>
    <button id="b-copy">Copy jump capture</button>
    <button id="b-reset">Reset</button>
  </div>
  <div id="log"></div>
`;

const elCommits = document.getElementById('c-commits') as HTMLElement;
const elJump = document.getElementById('c-jump') as HTMLElement;
const elJumpBox = document.getElementById('c-jump-box') as HTMLElement;
const elLog = document.getElementById('log') as HTMLElement;

function renderCounters(): void {
  elCommits.textContent = String(commitCount);
  elJump.textContent = String(multiJump);
  elJumpBox.classList.toggle('flag', multiJump > 0);
}
function logLine(text: string, cls = ''): void {
  const line = document.createElement('div');
  if (cls) line.className = cls;
  line.textContent = text;
  elLog.prepend(line);
}

// A hard flick + the next still-decaying momentum event. With the defer OFF, the commit's
// freeze advances the clock so the follow-up event sees a gap >= the re-arm gap → gap
// re-arm → second commit. With the defer ON, the freeze is buffered out of the stream, the
// follow-up event sees no gap, stays dropped, and there is no second commit.
function flick(): void {
  const sidebar = document.querySelector('[data-testid="sidebar"]') as HTMLElement;
  const fire = (dx: number): void => {
    sidebar.dispatchEvent(new WheelEvent('wheel', { deltaX: dx, deltaY: 0, bubbles: true, cancelable: true }));
  };
  fire(120); // crosses the 15% threshold → commits (freeze lands here when defer is off)
  fire(70); // the decaying momentum tail — re-commits iff the freeze opened a phantom gap
}

// A REALISTIC macOS trackpad flick: a rising gesture that crosses the threshold, then a
// long DECAYING MOMENTUM TAIL with the small noise bumps a real tail carries — dispatched
// over REAL time (~10ms apart) so any commit-time main-thread freeze coalesces it just like
// the real thing. This is what the 2-event button flick can't exercise: the velocity re-arm
// reads this whole noisy tail.
const MOMENTUM_TAIL = [
  88, 79, 72, 80, 65, 58, 63, 50, 44, 49, 38, 33, 37, 28, 24, 28, 20, 17, 20, 14, 12, 15, 10,
  8, 10, 6, 5, 7, 4, 3,
];
async function realSwipe(): Promise<void> {
  const sidebar = document.querySelector('[data-testid="sidebar"]') as HTMLElement;
  const fire = (dx: number): void => {
    sidebar.dispatchEvent(new WheelEvent('wheel', { deltaX: dx, deltaY: 0, bubbles: true, cancelable: true }));
  };
  const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
  const stream = [18, 40, 66, 90, 100, ...MOMENTUM_TAIL]; // rising gesture → decaying momentum
  for (const dx of stream) {
    fire(dx);
    await sleep(10);
  }
  await sleep(200);
}

// Replay a recorded wheel stream (from __exp.lastJump on real hardware) through the REAL
// swipe action, with its real inter-event timing, and report how many commits the recorded
// momentum produced. A faithful sequence that committed TWICE on the device should commit
// ONCE here once the fix lands. Primes a 'next' commit first so the stream starts in the
// settled state the capture begins in.
async function replay(events: Array<{ dx: number; t: number; commit?: string }>, startSpace: string): Promise<{ commits: number; activeSpace: string | null }> {
  const sidebar = document.querySelector('[data-testid="sidebar"]') as HTMLElement;
  const fire = (dx: number): void => {
    sidebar.dispatchEvent(new WheelEvent('wheel', { deltaX: dx, deltaY: 0, bubbles: true, cancelable: true }));
  };
  const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
  resetTo(startSpace);
  await sleep(340);
  fire(120); // prime: reach the settled post-commit state the capture starts in
  await sleep(30);
  const before = commitCount;
  const wheels = events.filter((e) => e.commit === undefined);
  let prevT = wheels.length > 0 ? (wheels[0]?.t ?? 0) : 0;
  for (const ev of wheels) {
    await sleep(Math.max(0, Math.min(60, ev.t - prevT)));
    prevT = ev.t;
    fire(ev.dx);
  }
  await sleep(220);
  return { commits: commitCount - before, activeSpace: store.state.activeSpaceByWindow[WINDOW_ID] ?? null };
}

function reset(): void {
  commitCount = 0;
  multiJump = 0;
  commitsThisStream = 0;
  commits.length = 0;
  elLog.innerHTML = '';
  renderCounters();
  logLine('reset', 'ok');
}

// Glide the carousel back to a mid Space (an EXTERNAL activation, not a swipe), so each
// trial flicks from the same spot with room ahead for a multi-jump. Direct store write →
// App's reconcile glides; the caller waits out the settle before flicking.
function resetTo(spaceId: string): void {
  sink.activeSpaceByWindow = { [WINDOW_ID]: spaceId };
}

(document.getElementById('k-defer') as HTMLInputElement).addEventListener('change', (e) => {
  exp.defer = (e.target as HTMLInputElement).checked;
  logLine(`defer heavy render → ${exp.defer ? 'ON (the prod fix)' : 'OFF'}`, exp.defer ? 'ok' : 'jump');
});
(document.getElementById('k-stall') as HTMLInputElement).addEventListener('change', (e) => {
  exp.commitStallMs = Number((e.target as HTMLInputElement).value) || 0;
});
(document.getElementById('k-bg') as HTMLInputElement).addEventListener('change', (e) => {
  exp.bgLoadMs = Number((e.target as HTMLInputElement).value) || 0;
});
(document.getElementById('b-flick') as HTMLButtonElement).addEventListener('click', () => {
  for (let i = 0; i < 20; i++) flick();
});
(document.getElementById('b-flick1') as HTMLButtonElement).addEventListener('click', flick);
(document.getElementById('b-copy') as HTMLButtonElement).addEventListener('click', async () => {
  const data = JSON.stringify(lastJumpCapture);
  if (lastJumpCapture.length === 0) {
    logLine('no jump captured yet — swipe until MULTI-JUMP goes up first', 'jump');
    return;
  }
  try {
    await navigator.clipboard.writeText(data);
    logLine(`jump capture copied (${lastJumpCapture.length} events) — paste it to Claude`, 'ok');
  } catch {
    logLine(data); // fallback: dumped to the log, select + copy
  }
});
(document.getElementById('b-reset') as HTMLButtonElement).addEventListener('click', reset);
renderCounters();

// ── Playwright hooks ─────────────────────────────────────────────────────────
interface Exp {
  setDefer: (on: boolean) => void;
  setStall: (ms: number) => void;
  setBgLoad: (ms: number) => void;
  flick: () => void;
  realSwipe: () => Promise<void>;
  replay: (
    events: Array<{ dx: number; t: number; commit?: string }>,
    startSpace: string,
  ) => Promise<{ commits: number; activeSpace: string | null }>;
  reset: () => void;
  resetTo: (spaceId: string) => void;
  commitCount: () => number;
  counters: () => { commits: number; multiJump: number };
  activeSpace: () => string | null;
  lastJump: () => WheelRec[];
  wheelLog: () => WheelRec[];
}
(window as unknown as { __exp: Exp }).__exp = {
  setDefer: (on) => {
    exp.defer = on;
    (document.getElementById('k-defer') as HTMLInputElement).checked = on;
  },
  setStall: (ms) => {
    exp.commitStallMs = ms;
  },
  setBgLoad: (ms) => {
    exp.bgLoadMs = ms;
  },
  flick,
  realSwipe,
  replay,
  reset,
  resetTo,
  commitCount: () => commitCount,
  counters: () => ({ commits: commitCount, multiJump }),
  activeSpace: () => store.state.activeSpaceByWindow[WINDOW_ID] ?? null,
  lastJump: () => lastJumpCapture,
  wheelLog: () => wheelLog,
};
