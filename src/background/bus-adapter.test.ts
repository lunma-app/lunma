import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { CommandAck, CommandMessage } from '../shared/bus';
import { log } from '../shared/logger';
import { installBusAdapter } from './bus-adapter';
import type { Coordinator, PendingEvent } from './coordinator';

interface ChromeStub {
  runtime: {
    sendMessage: ReturnType<typeof vi.fn>;
    onMessage: {
      addListener: ReturnType<typeof vi.fn>;
      removeListener: ReturnType<typeof vi.fn>;
    };
  };
}

function installChromeStub(): { chrome: ChromeStub; deliver: (msg: unknown) => void } {
  let registered: ((raw: unknown) => void) | null = null;
  const chromeStub: ChromeStub = {
    runtime: {
      sendMessage: vi.fn(() => Promise.resolve()),
      onMessage: {
        addListener: vi.fn((l: (raw: unknown) => void) => {
          registered = l;
        }),
        removeListener: vi.fn(),
      },
    },
  };
  (globalThis as unknown as { chrome: ChromeStub }).chrome = chromeStub;
  return {
    chrome: chromeStub,
    deliver: (msg) => registered?.(msg),
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
