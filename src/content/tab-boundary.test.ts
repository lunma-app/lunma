import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';

type MsgListener = (msg: unknown) => void;

let configListener: MsgListener | undefined;
let sendMessage: ReturnType<typeof vi.fn>;

function installChrome(): void {
  configListener = undefined;
  sendMessage = vi.fn(() => Promise.resolve(undefined));
  (globalThis as unknown as { chrome: unknown }).chrome = {
    runtime: {
      // `id` present ⇒ a live extension context (the script's `runtimeAlive`
      // guard). Tests that simulate invalidation delete it.
      id: 'lunma-test',
      sendMessage,
      onMessage: {
        addListener: (l: MsgListener) => {
          configListener = l;
        },
        removeListener: vi.fn(),
      },
    },
  };
}

/** The shared chrome stub's `runtime`, for mutating `id` in a single test. */
function chromeRuntime(): { id?: string } {
  return (globalThis as unknown as { chrome: { runtime: { id?: string } } }).chrome.runtime;
}

/** Push an allow-set (or `null` to disarm) through the captured config listener. */
function arm(allow: string[] | null): void {
  configListener?.({ type: 'lunma/boundary-config', allow });
}

function makeAnchor(href: string, target = ''): HTMLAnchorElement {
  const a = document.createElement('a');
  a.href = href;
  if (target) a.target = target;
  document.body.appendChild(a);
  return a;
}

/** Dispatch a `click` (or `auxclick`) on the anchor and return the event so the
 * caller can read `defaultPrevented`. Bubbles so the capture-phase document
 * listener the script installed sees it. */
function activate(a: HTMLAnchorElement, init: MouseEventInit = {}, type = 'click'): MouseEvent {
  const ev = new MouseEvent(type, { bubbles: true, cancelable: true, button: 0, ...init });
  a.dispatchEvent(ev);
  return ev;
}

beforeAll(async () => {
  installChrome();
  delete (window as unknown as { __lunmaBoundaryInstalled?: boolean }).__lunmaBoundaryInstalled;
  await import('./tab-boundary');
});

beforeEach(() => {
  // jsdom logs "Not implemented: navigation" for clicks we deliberately leave
  // to the browser (in-allow / modified / non-http) — suppress that noise.
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  sendMessage.mockClear();
  document.body.innerHTML = '';
  arm(null); // reset to disarmed between tests
});

afterAll(() => {
  vi.restoreAllMocks();
});

describe('tab-boundary content script', () => {
  test('an off-allow same-tab click is prevented and diverted to the SW', () => {
    arm(['*.example.com']);
    const a = makeAnchor('https://evil.test/path');
    const ev = activate(a);
    expect(ev.defaultPrevented).toBe(true);
    expect(sendMessage).toHaveBeenCalledWith({
      type: 'lunma/boundary-open-elsewhere',
      url: 'https://evil.test/path',
    });
  });

  test('an in-allow click is left untouched (navigates normally)', () => {
    arm(['*.example.com']);
    const a = makeAnchor('https://docs.example.com/page');
    const ev = activate(a);
    expect(ev.defaultPrevented).toBe(false);
    expect(sendMessage).not.toHaveBeenCalled();
  });

  test('disarmed (allow=null) lets every click through', () => {
    arm(null);
    const a = makeAnchor('https://evil.test/');
    const ev = activate(a);
    expect(ev.defaultPrevented).toBe(false);
    expect(sendMessage).not.toHaveBeenCalled();
  });

  test('a modified (Cmd/Ctrl/Shift) click is left to Chrome', () => {
    arm(['*.example.com']);
    const a = makeAnchor('https://evil.test/');
    for (const init of [
      { metaKey: true },
      { ctrlKey: true },
      { shiftKey: true },
      { altKey: true },
    ]) {
      const ev = activate(a, init);
      expect(ev.defaultPrevented).toBe(false);
    }
    expect(sendMessage).not.toHaveBeenCalled();
  });

  test('a target=_blank link is left to Chrome', () => {
    arm(['*.example.com']);
    const a = makeAnchor('https://evil.test/', '_blank');
    const ev = activate(a);
    expect(ev.defaultPrevented).toBe(false);
    expect(sendMessage).not.toHaveBeenCalled();
  });

  test('a non-http(s) scheme is left to Chrome', () => {
    arm(['*.example.com']);
    const a = makeAnchor('mailto:hi@evil.test');
    const ev = activate(a);
    expect(ev.defaultPrevented).toBe(false);
    expect(sendMessage).not.toHaveBeenCalled();
  });

  test('a middle/aux click (auxclick, non-primary button) is left to Chrome', () => {
    arm(['*.example.com']);
    const a = makeAnchor('https://evil.test/');
    const ev = activate(a, { button: 1 }, 'auxclick');
    expect(ev.defaultPrevented).toBe(false);
    expect(sendMessage).not.toHaveBeenCalled();
  });

  test('an invalidated extension context lets the click through (no dead-end)', () => {
    arm(['*.example.com']);
    delete chromeRuntime().id; // simulate extension reload/update (context invalidated)
    const a = makeAnchor('https://evil.test/');
    const ev = activate(a);
    // Not prevented → the browser navigates normally; nothing sent to a dead SW.
    expect(ev.defaultPrevented).toBe(false);
    expect(sendMessage).not.toHaveBeenCalled();
    chromeRuntime().id = 'lunma-test'; // restore for the next test
  });

  test('a click on a child element resolves to its enclosing off-allow anchor', () => {
    arm(['*.example.com']);
    const a = makeAnchor('https://evil.test/');
    const span = document.createElement('span');
    a.appendChild(span);
    const ev = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
    span.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(true);
    expect(sendMessage).toHaveBeenCalledWith({
      type: 'lunma/boundary-open-elsewhere',
      url: 'https://evil.test/',
    });
  });
});
