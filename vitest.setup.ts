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
