import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  BUS_TIMEOUT_MS,
  BusSendError,
  BusTimeoutError,
  type BusTransport,
  type CommandAck,
  type CommandMessage,
  createBus,
  SIDEBAR_COMMAND_KINDS,
} from './bus';
import { log } from './logger';

function makeMockTransport(): {
  transport: BusTransport;
  sent: CommandMessage[];
  emit: (ack: CommandAck) => void;
  reject: (err: unknown) => void;
  resetSend: (impl?: (msg: unknown) => Promise<unknown>) => void;
} {
  const sent: CommandMessage[] = [];
  const listeners = new Set<(raw: unknown) => void>();
  let sendImpl: (msg: unknown) => Promise<unknown> = (msg) => {
    sent.push(msg as CommandMessage);
    return Promise.resolve();
  };
  const transport: BusTransport = {
    sendMessage: (msg) => sendImpl(msg),
    onMessage: {
      addListener: (l) => listeners.add(l),
      removeListener: (l) => listeners.delete(l),
    },
  };
  return {
    transport,
    sent,
    emit: (ack) => {
      for (const l of listeners) l(ack);
    },
    reject: (err) => {
      sendImpl = () => Promise.reject(err);
    },
    resetSend: (impl) => {
      sendImpl =
        impl ??
        ((msg) => {
          sent.push(msg as CommandMessage);
          return Promise.resolve();
        });
    },
  };
}

describe('createBus.send', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  test('emits a CommandMessage with sessionId-prefixed monotonic id', () => {
    const { transport, sent } = makeMockTransport();
    const bus = createBus(transport);
    void bus.send({
      kind: 'createSpace',
      payload: { name: 'a', color: 'gray', icon: 'star', windowId: 1 },
    });
    void bus.send({
      kind: 'createSpace',
      payload: { name: 'b', color: 'gray', icon: 'star', windowId: 1 },
    });
    expect(sent).toHaveLength(2);
    const [first, second] = sent;
    expect(first?.type).toBe('lunma/command');
    expect(first?.id.startsWith(`${bus.__sessionId}:`)).toBe(true);
    expect(first?.id).not.toBe(second?.id);
  });

  test('pin commands (pinTab/unpinTab/reorderPinned) are recognised kinds and serialize as plain data', () => {
    expect(SIDEBAR_COMMAND_KINDS.has('pinTab')).toBe(true);
    expect(SIDEBAR_COMMAND_KINDS.has('unpinTab')).toBe(true);
    expect(SIDEBAR_COMMAND_KINDS.has('reorderPinned')).toBe(true);

    const { transport, sent } = makeMockTransport();
    const bus = createBus(transport);
    void bus.send({
      kind: 'pinTab',
      payload: { tabId: 42, windowId: 100, spaceId: 'work', targetIndex: 1 },
    });
    void bus.send({ kind: 'unpinTab', payload: { savedTabId: 'st-1', windowId: 100 } });
    void bus.send({
      kind: 'reorderPinned',
      payload: {
        spaceId: 'work',
        nodes: [
          { kind: 'tab', id: 't3' },
          { kind: 'tab', id: 't1' },
          { kind: 'tab', id: 't2' },
        ],
      },
    });
    expect(sent.map((m) => m.cmd.kind)).toEqual(['pinTab', 'unpinTab', 'reorderPinned']);
    expect(sent[0]?.cmd.payload).toEqual({
      tabId: 42,
      windowId: 100,
      spaceId: 'work',
      targetIndex: 1,
    });
  });

  test('ack ok resolves the promise', async () => {
    const { transport, sent, emit } = makeMockTransport();
    const bus = createBus(transport);
    const p = bus.send({ kind: 'renameSpace', payload: { spaceId: 'x', newName: 'New' } });
    const id = sent[0]?.id ?? '';
    emit({ type: 'lunma/command-ack', id, result: 'ok' });
    await expect(p).resolves.toBeUndefined();
  });

  test('ack error rejects with a kind-enriched Error', async () => {
    const { transport, sent, emit } = makeMockTransport();
    const bus = createBus(transport);
    const p = bus.send({ kind: 'openSavedTab', payload: { savedTabId: 'x', windowId: 1 } });
    const id = sent[0]?.id ?? '';
    emit({ type: 'lunma/command-ack', id, result: { error: 'no such window' } });
    await expect(p).rejects.toMatchObject({
      message: expect.stringContaining('[openSavedTab]'),
      kind: 'openSavedTab',
    });
  });

  test('timeout rejects with BusTimeoutError', async () => {
    const { transport } = makeMockTransport();
    const bus = createBus(transport);
    const p = bus.send({ kind: 'focusSavedTab', payload: { savedTabId: 'x', windowId: 1 } });
    const caught = p.catch((err: unknown) => err);
    await vi.advanceTimersByTimeAsync(BUS_TIMEOUT_MS + 1);
    const err = await caught;
    expect(err).toBeInstanceOf(BusTimeoutError);
    expect((err as BusTimeoutError).kind).toBe('focusSavedTab');
  });

  test('synchronous transport throw rejects immediately with BusSendError', async () => {
    const { transport } = makeMockTransport();
    // Replace sendMessage with one that throws synchronously.
    (transport as { sendMessage: (msg: unknown) => Promise<unknown> }).sendMessage = () => {
      throw new Error('Extension context invalidated');
    };
    const bus = createBus(transport);
    await expect(
      bus.send({ kind: 'goHome', payload: { savedTabId: 'x', windowId: 1 } }),
    ).rejects.toBeInstanceOf(BusSendError);
  });

  test('async transport rejection rejects immediately with BusSendError (no timeout wait)', async () => {
    const { transport, reject } = makeMockTransport();
    reject(new Error('Receiving end does not exist'));
    const bus = createBus(transport);
    const p = bus.send({ kind: 'deleteSavedTab', payload: { savedTabId: 'x' } });
    // Allow the rejection microtask to flush.
    await Promise.resolve();
    await expect(p).rejects.toBeInstanceOf(BusSendError);
  });
});

describe('createBus ack listener', () => {
  test('ack arriving after the entry is cleared (same session) logs debug and drops', async () => {
    vi.useFakeTimers();
    const debug = vi.spyOn(log, 'debug').mockImplementation(() => undefined);
    const { transport, sent, emit } = makeMockTransport();
    const bus = createBus(transport);
    const p = bus.send({ kind: 'focusSavedTab', payload: { savedTabId: 'x', windowId: 1 } });
    const id = sent[0]?.id ?? '';
    const caught = p.catch(() => undefined); // swallow expected timeout
    await vi.advanceTimersByTimeAsync(BUS_TIMEOUT_MS + 1);
    await caught;
    // Now the entry is gone; same-session ack should debug-log, not warn.
    emit({ type: 'lunma/command-ack', id, result: 'ok' });
    expect(debug).toHaveBeenCalledWith('BUS_ACK_AFTER_CLEAR', { id });
    vi.useRealTimers();
    debug.mockRestore();
  });

  test('ack with foreign session prefix debug-logs BUS_ACK_FOREIGN_ID and drops', () => {
    const debug = vi.spyOn(log, 'debug').mockImplementation(() => undefined);
    const warn = vi.spyOn(log, 'warn').mockImplementation(() => undefined);
    const { transport, emit } = makeMockTransport();
    const bus = createBus(transport);
    const foreignId = `not-${bus.__sessionId}:99`;
    emit({ type: 'lunma/command-ack', id: foreignId, result: 'ok' });
    // Foreign acks are normal broadcast traffic — debug, never warn.
    expect(debug).toHaveBeenCalledWith('BUS_ACK_FOREIGN_ID', { id: foreignId });
    expect(warn).not.toHaveBeenCalled();
    debug.mockRestore();
    warn.mockRestore();
  });

  test('two bus instances do not cross-resolve each other’s promises', async () => {
    const a = makeMockTransport();
    const b = makeMockTransport();
    const busA = createBus(a.transport);
    const busB = createBus(b.transport);
    expect(busA.__sessionId).not.toBe(busB.__sessionId);

    const pA = busA.send({ kind: 'focusSavedTab', payload: { savedTabId: 'a', windowId: 1 } });
    const pB = busB.send({ kind: 'focusSavedTab', payload: { savedTabId: 'b', windowId: 1 } });

    // Emit busA's ack into busB's transport — busB should NOT resolve.
    const idA = a.sent[0]?.id ?? '';
    const debug = vi.spyOn(log, 'debug').mockImplementation(() => undefined);
    b.emit({ type: 'lunma/command-ack', id: idA, result: 'ok' });
    expect(debug).toHaveBeenCalledWith('BUS_ACK_FOREIGN_ID', { id: idA });
    debug.mockRestore();

    // Resolve each by their own transport now.
    a.emit({ type: 'lunma/command-ack', id: idA, result: 'ok' });
    const idB = b.sent[0]?.id ?? '';
    b.emit({ type: 'lunma/command-ack', id: idB, result: 'ok' });
    await Promise.all([pA, pB]);
  });

  test('non-ack messages are ignored', () => {
    const { transport, emit } = makeMockTransport();
    createBus(transport);
    expect(() => emit({ type: 'lunma/state-broadcast' } as unknown as CommandAck)).not.toThrow();
  });

  test('malformed messages (null, non-object, missing fields) are silently ignored', () => {
    const { transport, emit } = makeMockTransport();
    createBus(transport);
    const send = (m: unknown) => emit(m as CommandAck);
    expect(() => {
      send(null);
      send('not-an-object');
      send({ type: 'lunma/command-ack' });
      send({ type: 'lunma/command-ack', id: 7 });
      send({ type: 'lunma/command-ack', id: 'abc:1' });
    }).not.toThrow();
  });
});

describe('bus singleton (chrome.runtime transport)', () => {
  test('lazy bus proxy uses globalThis.chrome.runtime on first access', async () => {
    interface ChromeStub {
      runtime: {
        sendMessage: ReturnType<typeof vi.fn>;
        onMessage: {
          addListener: ReturnType<typeof vi.fn>;
          removeListener: ReturnType<typeof vi.fn>;
        };
      };
    }
    const stub: ChromeStub = {
      runtime: {
        sendMessage: vi.fn(() => Promise.resolve()),
        onMessage: { addListener: vi.fn(), removeListener: vi.fn() },
      },
    };
    (globalThis as unknown as { chrome: ChromeStub }).chrome = stub;
    vi.resetModules();
    const { bus: freshBus } = await import('./bus');
    // Touching the proxy triggers construction → addListener + sendMessage are wired.
    void freshBus.send({ kind: 'focusSavedTab', payload: { savedTabId: 'bm-1', windowId: 1 } });
    expect(stub.runtime.onMessage.addListener).toHaveBeenCalledTimes(1);
    expect(stub.runtime.sendMessage).toHaveBeenCalledTimes(1);
  });
});
