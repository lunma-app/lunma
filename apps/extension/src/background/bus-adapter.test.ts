import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { CommandAck, CommandMessage } from '../shared/bus';
import { log } from '../shared/logger';
import { installBusAdapter } from './bus-adapter';
import type { Coordinator, PendingEvent } from './coordinator';

const EXT_ID = 'lunma-ext-id';

interface ChromeStub {
  runtime: {
    id: string;
    sendMessage: ReturnType<typeof vi.fn>;
    onMessage: {
      addListener: ReturnType<typeof vi.fn>;
      removeListener: ReturnType<typeof vi.fn>;
    };
  };
}

type RegisteredListener = (raw: unknown, sender: chrome.runtime.MessageSender) => void;

function installChromeStub(): {
  chrome: ChromeStub;
  deliver: (msg: unknown, sender?: chrome.runtime.MessageSender) => void;
} {
  let registered: RegisteredListener | null = null;
  const chromeStub: ChromeStub = {
    runtime: {
      id: EXT_ID,
      sendMessage: vi.fn(() => Promise.resolve()),
      onMessage: {
        addListener: vi.fn((l: RegisteredListener) => {
          registered = l;
        }),
        removeListener: vi.fn(),
      },
    },
  };
  (globalThis as unknown as { chrome: ChromeStub }).chrome = chromeStub;
  return {
    chrome: chromeStub,
    // Default sender carries the extension's own id, the same-origin case the
    // adapter's `sender.id === chrome.runtime.id` guard admits. Tests can pass a
    // foreign sender to exercise the rejection path.
    deliver: (msg, sender = { id: EXT_ID } as chrome.runtime.MessageSender) =>
      registered?.(msg, sender),
  };
}

function makeFakeCoordinator(): { coordinator: Coordinator; enqueue: ReturnType<typeof vi.fn> } {
  const enqueue = vi.fn<(ev: PendingEvent) => void>();
  return {
    coordinator: { enqueue } as unknown as Coordinator,
    enqueue,
  };
}

describe('installBusAdapter', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test('forwards a valid command into coordinator.enqueue', async () => {
    const { deliver } = installChromeStub();
    const { coordinator, enqueue } = makeFakeCoordinator();
    installBusAdapter(coordinator);

    const msg: CommandMessage = {
      type: 'lunma/command',
      id: 'abc:7',
      cmd: {
        kind: 'createSpace',
        payload: { name: 'Work', color: 'blue', icon: 'star', windowId: 1 },
      },
    };
    deliver(msg);

    // Enqueue is gated on the (default-resolved) readiness promise — one micro-
    // task away, not synchronous.
    await Promise.resolve();
    await Promise.resolve();
    expect(enqueue).toHaveBeenCalledTimes(1);
    expect(enqueue).toHaveBeenCalledWith({
      source: 'sidebar',
      kind: 'createSpace',
      payload: { name: 'Work', color: 'blue', icon: 'star', windowId: 1 },
      correlationId: 'abc:7',
    });
  });

  test('forwards the auto-archive commands (restoreArchivedTab + setSpaceAutoArchive)', async () => {
    const { deliver } = installChromeStub();
    const { coordinator, enqueue } = makeFakeCoordinator();
    installBusAdapter(coordinator);

    deliver({
      type: 'lunma/command',
      id: 'aa:1',
      cmd: { kind: 'restoreArchivedTab', payload: { archivedAt: 123, tabId: 5, windowId: 100 } },
    } satisfies CommandMessage);
    deliver({
      type: 'lunma/command',
      id: 'aa:2',
      cmd: {
        kind: 'setSpaceAutoArchive',
        payload: { spaceId: 'work', autoArchive: { mode: 'off' } },
      },
    } satisfies CommandMessage);

    await Promise.resolve();
    await Promise.resolve();
    expect(enqueue).toHaveBeenCalledTimes(2);
    expect(enqueue).toHaveBeenNthCalledWith(1, {
      source: 'sidebar',
      kind: 'restoreArchivedTab',
      payload: { archivedAt: 123, tabId: 5, windowId: 100 },
      correlationId: 'aa:1',
    });
    expect(enqueue).toHaveBeenNthCalledWith(2, {
      source: 'sidebar',
      kind: 'setSpaceAutoArchive',
      payload: { spaceId: 'work', autoArchive: { mode: 'off' } },
      correlationId: 'aa:2',
    });
  });

  test('defers enqueue until the readiness promise resolves (MV3 wake-up contract)', async () => {
    const { deliver } = installChromeStub();
    const { coordinator, enqueue } = makeFakeCoordinator();
    let release!: () => void;
    const whenReady = new Promise<void>((resolve) => {
      release = resolve;
    });
    installBusAdapter(coordinator, whenReady);

    const cmd = (id: string): CommandMessage => ({
      type: 'lunma/command',
      id,
      cmd: { kind: 'renameSpace', payload: { spaceId: 'work', newName: id } },
    });

    // Two commands arrive while the SW is still booting — neither enqueues yet.
    deliver(cmd('a:1'));
    deliver(cmd('a:2'));
    await Promise.resolve();
    expect(enqueue).not.toHaveBeenCalled();

    // Boot completes → both flush, in arrival order.
    release();
    await Promise.resolve();
    await Promise.resolve();
    expect(enqueue).toHaveBeenCalledTimes(2);
    expect(enqueue.mock.calls[0]?.[0]).toMatchObject({ correlationId: 'a:1' });
    expect(enqueue.mock.calls[1]?.[0]).toMatchObject({ correlationId: 'a:2' });
  });

  test('rejects unknown command kind: logs, emits error ack, no enqueue', () => {
    const { chrome, deliver } = installChromeStub();
    const { coordinator, enqueue } = makeFakeCoordinator();
    const errSpy = vi.spyOn(log, 'error').mockImplementation(() => undefined);
    installBusAdapter(coordinator);

    deliver({
      type: 'lunma/command',
      id: 'abc:1',
      cmd: { kind: 'nope', payload: {} },
    });

    expect(enqueue).not.toHaveBeenCalled();
    expect(errSpy).toHaveBeenCalledWith('BUS_UNKNOWN_KIND', { id: 'abc:1', kind: 'nope' });
    expect(chrome.runtime.sendMessage).toHaveBeenCalledTimes(1);
    const ack = chrome.runtime.sendMessage.mock.calls[0]?.[0] as CommandAck;
    expect(ack.type).toBe('lunma/command-ack');
    expect(ack.id).toBe('abc:1');
    expect(ack.result).toEqual({ error: 'unknown command kind' });
  });

  test('rejects a known kind with an invalid payload: logs BUS_INVALID_PAYLOAD, emits error ack, no enqueue', () => {
    const { chrome, deliver } = installChromeStub();
    const { coordinator, enqueue } = makeFakeCoordinator();
    const errSpy = vi.spyOn(log, 'error').mockImplementation(() => undefined);
    installBusAdapter(coordinator);

    // `createSpace` is a recognised kind, but the payload is malformed: `windowId`
    // is missing and `color` is out of the SpaceColor vocabulary.
    deliver({
      type: 'lunma/command',
      id: 'bad:1',
      cmd: { kind: 'createSpace', payload: { name: 'Work', color: 'chartreuse', icon: 'star' } },
    });

    expect(enqueue).not.toHaveBeenCalled();
    // The unknown-kind path is NOT taken — this is the payload-validation path.
    expect(errSpy).not.toHaveBeenCalledWith('BUS_UNKNOWN_KIND', expect.anything());
    const invalidCall = errSpy.mock.calls.find((c) => c[0] === 'BUS_INVALID_PAYLOAD');
    expect(invalidCall).toBeDefined();
    expect(invalidCall?.[1]).toMatchObject({ id: 'bad:1', kind: 'createSpace' });

    expect(chrome.runtime.sendMessage).toHaveBeenCalledTimes(1);
    const ack = chrome.runtime.sendMessage.mock.calls[0]?.[0] as CommandAck;
    expect(ack.type).toBe('lunma/command-ack');
    expect(ack.id).toBe('bad:1');
    expect(ack.result).toMatchObject({ error: expect.any(String) });
    errSpy.mockRestore();
  });

  test('an unknown smart-folder source is bus-rejected: error ack, never reaches the handler', () => {
    const { chrome, deliver } = installChromeStub();
    const { coordinator, enqueue } = makeFakeCoordinator();
    const errSpy = vi.spyOn(log, 'error').mockImplementation(() => undefined);
    installBusAdapter(coordinator);

    deliver({
      type: 'lunma/command',
      id: 'bad:src',
      cmd: {
        kind: 'createSmartFolder',
        payload: {
          spaceId: 'work',
          source: 'bitbucket', // not a shipped connector — the z.enum rejects
          name: 'X',
          baseUrl: 'https://bitbucket.example.com',
          query: 'authored',
          refreshMinutes: 10,
        },
      },
    });

    expect(enqueue).not.toHaveBeenCalled();
    const invalidCall = errSpy.mock.calls.find((c) => c[0] === 'BUS_INVALID_PAYLOAD');
    expect(invalidCall?.[1]).toMatchObject({ id: 'bad:src', kind: 'createSmartFolder' });
    const ack = chrome.runtime.sendMessage.mock.calls[0]?.[0] as CommandAck;
    expect(ack.id).toBe('bad:src');
    expect(ack.result).toMatchObject({ error: expect.any(String) });
    errSpy.mockRestore();
  });

  test('a valid payload still enqueues after full-payload validation is added', async () => {
    const { deliver } = installChromeStub();
    const { coordinator, enqueue } = makeFakeCoordinator();
    installBusAdapter(coordinator);

    // A fully-valid `openUrl` (the page-influenced command the validation targets).
    deliver({
      type: 'lunma/command',
      id: 'ok:1',
      cmd: { kind: 'openUrl', payload: { url: 'https://example.com', windowId: 3 } },
    } satisfies CommandMessage);

    await Promise.resolve();
    await Promise.resolve();
    expect(enqueue).toHaveBeenCalledTimes(1);
    expect(enqueue).toHaveBeenCalledWith({
      source: 'sidebar',
      kind: 'openUrl',
      payload: { url: 'https://example.com', windowId: 3 },
      correlationId: 'ok:1',
    });
  });

  test('ignores non-lunma/command messages', () => {
    const { deliver } = installChromeStub();
    const { coordinator, enqueue } = makeFakeCoordinator();
    installBusAdapter(coordinator);

    deliver({ type: 'lunma/state-broadcast', method: 'x', state: {} });
    deliver(null);
    deliver(undefined);
    deliver({ type: 'lunma/command' }); // missing id/cmd
    deliver({ type: 'lunma/command', id: 'abc:1' }); // missing cmd

    expect(enqueue).not.toHaveBeenCalled();
  });

  test('rejects a message whose sender is not this extension (sender.id guard)', () => {
    const { deliver } = installChromeStub();
    const { coordinator, enqueue } = makeFakeCoordinator();
    installBusAdapter(coordinator);

    const msg: CommandMessage = {
      type: 'lunma/command',
      id: 'abc:9',
      cmd: {
        kind: 'createSpace',
        payload: { name: 'Work', color: 'blue', icon: 'star', windowId: 1 },
      },
    };
    // A foreign sender id (defense-in-depth) is dropped before enqueue.
    deliver(msg, { id: 'some-other-extension' } as chrome.runtime.MessageSender);

    expect(enqueue).not.toHaveBeenCalled();
  });

  test('uninstall removes the listener', () => {
    const { chrome } = installChromeStub();
    const { coordinator } = makeFakeCoordinator();
    const uninstall = installBusAdapter(coordinator);
    expect(chrome.runtime.onMessage.addListener).toHaveBeenCalledTimes(1);
    uninstall();
    expect(chrome.runtime.onMessage.removeListener).toHaveBeenCalledTimes(1);
  });

  test('error-ack emission tolerates a sendMessage rejection (no listener) — logs at debug-ish, no throw', async () => {
    const { chrome, deliver } = installChromeStub();
    chrome.runtime.sendMessage.mockImplementationOnce(() =>
      Promise.reject(new Error('Receiving end does not exist')),
    );
    const { coordinator } = makeFakeCoordinator();
    const errSpy = vi.spyOn(log, 'error').mockImplementation(() => undefined);
    installBusAdapter(coordinator);
    deliver({ type: 'lunma/command', id: 'abc:1', cmd: { kind: 'nope', payload: {} } });
    await Promise.resolve();
    await Promise.resolve();
    // BUS_UNKNOWN_KIND was logged (the listener still detected the bad kind);
    // ACK_EMIT_FAILED is NOT logged because we suppress "Receiving end" errors.
    const ackFailedCalls = errSpy.mock.calls.filter(
      (c) => typeof c[0] === 'string' && c[0].includes('ACK_EMIT_FAILED'),
    );
    expect(ackFailedCalls).toHaveLength(0);
    errSpy.mockRestore();
  });

  test('error-ack emission logs ACK_EMIT_FAILED on a non-"Receiving end" rejection', async () => {
    const { chrome, deliver } = installChromeStub();
    chrome.runtime.sendMessage.mockImplementationOnce(() => Promise.reject(new Error('boom')));
    const { coordinator } = makeFakeCoordinator();
    const errSpy = vi.spyOn(log, 'error').mockImplementation(() => undefined);
    installBusAdapter(coordinator);
    deliver({ type: 'lunma/command', id: 'abc:1', cmd: { kind: 'nope', payload: {} } });
    await Promise.resolve();
    await Promise.resolve();
    const ackFailedCalls = errSpy.mock.calls.filter(
      (c) => typeof c[0] === 'string' && c[0].includes('ACK_EMIT_FAILED'),
    );
    expect(ackFailedCalls).toHaveLength(1);
    errSpy.mockRestore();
  });
});
