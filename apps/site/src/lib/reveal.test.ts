// @vitest-environment jsdom
/**
 * Unit tests for the `reveal` Svelte action.
 *
 * Three a11y behaviours are covered:
 *  1. No-JS arming — elements should appear fully visible when JS does not run
 *     (i.e. the action is never invoked). The armed state (`data-reveal="armed"`)
 *     that applies the offset/fade is set ONLY inside the action, so plain
 *     prerendered HTML has neither the armed attribute nor the revealed attribute
 *     and is fully visible by default.
 *  2. IntersectionObserver callback — when an entry becomes intersecting the
 *     element receives `data-revealed="true"` and the observer disconnects.
 *  3. Observer disconnect on destroy — the action's `destroy` hook disconnects
 *     the observer when the element is unmounted.
 */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { reveal } from './reveal';

// ---------------------------------------------------------------------------
// IntersectionObserver mock
// ---------------------------------------------------------------------------
type IOCallback = (entries: IntersectionObserverEntry[], obs: IntersectionObserver) => void;

let capturedCallback: IOCallback | null = null;
let mockObserve: ReturnType<typeof vi.fn>;
let mockDisconnect: ReturnType<typeof vi.fn>;
let mockUnobserve: ReturnType<typeof vi.fn>;

function triggerIntersection(node: Element, isIntersecting: boolean): void {
  if (!capturedCallback) throw new Error('No IntersectionObserver callback captured');
  capturedCallback([{ isIntersecting, target: node } as IntersectionObserverEntry], {
    disconnect: mockDisconnect,
    unobserve: mockUnobserve,
    observe: mockObserve,
  } as unknown as IntersectionObserver);
}

beforeEach(() => {
  capturedCallback = null;
  mockObserve = vi.fn();
  mockDisconnect = vi.fn();
  mockUnobserve = vi.fn();

  // A constructable mock — `reveal.ts` calls `new IntersectionObserver(cb)`, so the
  // stub must be a class/function, not an arrow (arrows are not constructors).
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe = mockObserve;
      disconnect = mockDisconnect;
      unobserve = mockUnobserve;
      constructor(cb: IOCallback) {
        capturedCallback = cb;
      }
    },
  );

  // Default: matchMedia reports no reduced-motion preference.
  vi.stubGlobal(
    'matchMedia',
    vi.fn((_query: string) => ({ matches: false })),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ---------------------------------------------------------------------------
// 1. No-JS arming
// ---------------------------------------------------------------------------
describe('reveal — no-JS / SSR safety', () => {
  test('a prerendered element has neither armed nor revealed attribute before the action runs', () => {
    const node = document.createElement('section');
    document.body.appendChild(node);

    // Simulate the action never being called (no JS). The element should be
    // fully visible — no offset/faded "armed" state applied.
    expect(node.dataset.reveal).toBeUndefined();
    expect(node.dataset.revealed).toBeUndefined();

    node.remove();
  });

  test('the armed attribute is set only AFTER the action is invoked (so the faded state never flashes on no-JS visitors)', () => {
    const node = document.createElement('section');
    document.body.appendChild(node);

    reveal(node, undefined);

    // The action HAS run — now the offset start state is armed.
    expect(node.dataset.reveal).toBe('armed');

    node.remove();
  });
});

// ---------------------------------------------------------------------------
// 2. Observer fires → element becomes visible
// ---------------------------------------------------------------------------
describe('reveal — IntersectionObserver callback', () => {
  test('element gets data-revealed="true" when it enters the viewport', () => {
    const node = document.createElement('section');
    document.body.appendChild(node);

    reveal(node, undefined);

    expect(node.dataset.revealed).toBeUndefined(); // not yet visible
    triggerIntersection(node, true);
    expect(node.dataset.revealed).toBe('true');

    node.remove();
  });

  test('observer disconnects after the first intersection (once-only)', () => {
    const node = document.createElement('section');
    document.body.appendChild(node);

    reveal(node, undefined);
    triggerIntersection(node, true);

    expect(mockDisconnect).toHaveBeenCalledTimes(1);

    node.remove();
  });

  test('a non-intersecting entry does NOT mark the element as revealed', () => {
    const node = document.createElement('section');
    document.body.appendChild(node);

    reveal(node, undefined);
    triggerIntersection(node, false);

    expect(node.dataset.revealed).toBeUndefined();

    node.remove();
  });

  test('a delay param sets the --reveal-delay CSS custom property', () => {
    const node = document.createElement('section');
    document.body.appendChild(node);

    reveal(node, { delay: 200 });

    expect(node.style.getPropertyValue('--reveal-delay')).toBe('200ms');

    node.remove();
  });
});

// ---------------------------------------------------------------------------
// 3. Observer disconnect on destroy (cleanup)
// ---------------------------------------------------------------------------
describe('reveal — destroy / unmount cleanup', () => {
  test('destroy() disconnects the observer', () => {
    const node = document.createElement('section');
    document.body.appendChild(node);

    const handle = reveal(node, undefined);
    expect(mockDisconnect).not.toHaveBeenCalled();

    handle?.destroy?.();
    expect(mockDisconnect).toHaveBeenCalledTimes(1);

    node.remove();
  });

  test('destroy() after the element already revealed does not throw', () => {
    const node = document.createElement('section');
    document.body.appendChild(node);

    const handle = reveal(node, undefined);
    triggerIntersection(node, true); // disconnects internally
    expect(() => handle?.destroy?.()).not.toThrow();

    node.remove();
  });
});

// ---------------------------------------------------------------------------
// Reduced-motion CSS backstop
// ---------------------------------------------------------------------------
describe('reveal — reduced-motion backstop', () => {
  test('reveals immediately and skips arming when prefers-reduced-motion is set', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn((_query: string) => ({ matches: true })),
    );

    const node = document.createElement('section');
    document.body.appendChild(node);

    reveal(node, undefined);

    // No armed state — the offset/fade never activates.
    expect(node.dataset.reveal).toBeUndefined();
    // Element is immediately visible.
    expect(node.dataset.revealed).toBe('true');
    // No observer was created.
    expect(mockObserve).not.toHaveBeenCalled();

    node.remove();
  });

  test('reveals immediately when IntersectionObserver is unavailable (old browser / no-IO env)', () => {
    vi.stubGlobal('IntersectionObserver', undefined);

    const node = document.createElement('section');
    document.body.appendChild(node);

    reveal(node, undefined);

    expect(node.dataset.revealed).toBe('true');
    expect(node.dataset.reveal).toBeUndefined();

    node.remove();
  });
});
