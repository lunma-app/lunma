import { afterAll } from 'vitest';

// bits-ui's body-scroll-lock (Dialog / BottomSheet) defers `resetBodyStyle` to a
// ~24ms timer (its `scheduleCleanupIfNoNewLocks`). When the last Dialog in a file
// unmounts, that timer can fire AFTER vitest disposes the file's env → an
// uncaught `ReferenceError: document is not defined` that fails the run even
// though every test passed. Hold the env open one macrotask past that delay so
// the timer fires (and resets the body) while `document` still exists.
afterAll(async () => {
  await new Promise((resolve) => setTimeout(resolve, 30));
});

// jsdom doesn't ship `matchMedia`. Svelte's `svelte/motion` module reads it
// at import time (for the global `prefers-reduced-motion` `MediaQuery`), so
// without this stub any test that transitively imports a component using
// `Spring` / `Tween` blows up before the test body runs.
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });
}

// jsdom doesn't implement the Web Animations API's `Element.getAnimations()`.
// Svelte's `animate:` directive (FLIP) calls it on each animated row to cancel
// any in-flight animation before measuring — so any test that mutates a keyed
// `{#each}` list (e.g. a pinned row list gaining a folder) throws
// "getAnimations is not a function" mid-render. Returning an empty list (no
// animations to cancel) is the correct no-op for the headless DOM.
if (typeof Element !== 'undefined' && typeof Element.prototype.getAnimations !== 'function') {
  Object.defineProperty(Element.prototype, 'getAnimations', {
    writable: true,
    configurable: true,
    value: () => [],
  });
}

// jsdom doesn't implement `IntersectionObserver`. IconPicker uses it to lazily
// mount each tile's glyph only when scrolled into view. A no-op stub (never
// fires) is the right headless behaviour: the tiles still render as buttons —
// which is all the DOM-level tests assert — while no per-icon dynamic imports
// fire, keeping the suite fast and quiet.
if (typeof globalThis.IntersectionObserver === 'undefined') {
  class NoopIntersectionObserver {
    readonly root = null;
    readonly rootMargin = '';
    readonly thresholds: readonly number[] = [];
    observe(): void {
      // noop
    }
    unobserve(): void {
      // noop
    }
    disconnect(): void {
      // noop
    }
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }
  Object.defineProperty(globalThis, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: NoopIntersectionObserver,
  });
}

// jsdom also lacks `Element.animate` (the rest of the Web Animations API). Svelte
// 5's `animate:` directive (FLIP) calls it to play the position tween, so a test
// that mutates a keyed list using `animate:flip` (e.g. the folder page's card
// grid) throws "element.animate is not a function". Return a no-op Animation
// whose `finished` resolves immediately so Svelte's cleanup proceeds (no real
// motion in the headless DOM).
if (typeof Element !== 'undefined' && typeof Element.prototype.animate !== 'function') {
  Object.defineProperty(Element.prototype, 'animate', {
    writable: true,
    configurable: true,
    value: () => ({
      cancel: () => undefined,
      finish: () => undefined,
      play: () => undefined,
      pause: () => undefined,
      finished: Promise.resolve(),
      onfinish: null,
      oncancel: null,
      currentTime: 0,
      startTime: 0,
      playState: 'finished',
    }),
  });
}
