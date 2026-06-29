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
  type SidebarCommand,
  type SidebarCommandKind,
  SidebarCommandSchema,
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

// One representative valid command per kind. Typed as the exact-per-key mapped
// type so the example for a key must actually be that kind's command — and so a
// new `SidebarCommand` variant without an entry here fails `tsc` (a third guard,
// alongside the schema's `satisfies` and `SIDEBAR_COMMAND_KINDS`).
const VALID_COMMANDS: { [K in SidebarCommandKind]: Extract<SidebarCommand, { kind: K }> } = {
  createSpace: {
    kind: 'createSpace',
    payload: { name: 'Work', color: 'blue', icon: 'star', windowId: 1 },
  },
  renameSpace: { kind: 'renameSpace', payload: { spaceId: 'sp', newName: 'New' } },
  recolourSpace: { kind: 'recolourSpace', payload: { spaceId: 'sp', color: 'green' } },
  changeSpaceIcon: { kind: 'changeSpaceIcon', payload: { spaceId: 'sp', icon: 'rocket' } },
  deleteSpace: { kind: 'deleteSpace', payload: { spaceId: 'sp' } },
  restoreSpaceFromTrash: { kind: 'restoreSpaceFromTrash', payload: { spaceId: 'sp' } },
  activateSpace: { kind: 'activateSpace', payload: { windowId: 1, spaceId: 'sp' } },
  openSavedTab: { kind: 'openSavedTab', payload: { savedTabId: 'st', windowId: 1 } },
  focusSavedTab: { kind: 'focusSavedTab', payload: { savedTabId: 'st', windowId: 1 } },
  goHome: { kind: 'goHome', payload: { savedTabId: 'st', windowId: 1 } },
  makeThisHome: { kind: 'makeThisHome', payload: { savedTabId: 'st' } },
  deleteSavedTab: { kind: 'deleteSavedTab', payload: { savedTabId: 'st' } },
  pinTab: {
    kind: 'pinTab',
    payload: { tabId: 42, windowId: 1, spaceId: 'sp', targetIndex: 0 },
  },
  unpinTab: { kind: 'unpinTab', payload: { savedTabId: 'st', windowId: 1 } },
  reorderPinned: {
    kind: 'reorderPinned',
    payload: {
      spaceId: 'sp',
      nodes: [
        { kind: 'tab', id: 't1' },
        { kind: 'folder', id: 'f1', name: 'F', icon: 'folder', color: 'gray', children: ['t2'] },
      ],
    },
  },
  favoriteTab: { kind: 'favoriteTab', payload: { tabId: 42, windowId: 1 } },
  favoriteSavedTab: { kind: 'favoriteSavedTab', payload: { savedTabId: 'st' } },
  pinSavedTab: { kind: 'pinSavedTab', payload: { savedTabId: 'st', spaceId: 'sp' } },
  reorderFavorites: { kind: 'reorderFavorites', payload: { ids: ['a', 'b'] } },
  createFolder: { kind: 'createFolder', payload: { spaceId: 'sp' } },
  createFolderFromTabs: {
    kind: 'createFolderFromTabs',
    payload: { spaceId: 'sp', tabIdA: 'a', tabIdB: 'b', index: 0 },
  },
  renameFolder: { kind: 'renameFolder', payload: { spaceId: 'sp', folderId: 'f', name: 'N' } },
  setFolderIcon: { kind: 'setFolderIcon', payload: { spaceId: 'sp', folderId: 'f', icon: 'star' } },
  setFolderColor: {
    kind: 'setFolderColor',
    payload: { spaceId: 'sp', folderId: 'f', color: 'red' },
  },
  deleteFolder: { kind: 'deleteFolder', payload: { spaceId: 'sp', folderId: 'f' } },
  createLens: {
    kind: 'createLens',
    payload: {
      spaceId: 'sp',
      sources: [{ sourceId: 'acc-1', queries: ['review-requested'] }],
      name: 'Review requests',
      maxItems: 20,
      refreshMinutes: 10,
    },
  },
  updateLens: {
    kind: 'updateLens',
    payload: {
      spaceId: 'sp',
      folderId: 'sf',
      sources: [{ sourceId: 'acc-1', queries: ['assigned'] }],
      name: 'Assigned to me',
      maxItems: 30,
      refreshMinutes: 30,
    },
  },
  deleteLens: { kind: 'deleteLens', payload: { spaceId: 'sp', folderId: 'sf' } },
  createAccount: {
    kind: 'createAccount',
    payload: { id: 'acc-1', provider: 'github', baseUrl: 'https://github.com' },
  },
  renameAccount: { kind: 'renameAccount', payload: { id: 'acc-1', name: 'Work' } },
  deleteAccount: { kind: 'deleteAccount', payload: { id: 'acc-1' } },
  refreshLens: { kind: 'refreshLens', payload: { spaceId: 'sp', folderId: 'sf' } },
  markLensItemRead: {
    kind: 'markLensItemRead',
    payload: { folderId: 'sf', itemId: '42' },
  },
  markLensItemUnread: {
    kind: 'markLensItemUnread',
    payload: { folderId: 'sf', itemId: '42' },
  },
  markAllLensItemsRead: {
    kind: 'markAllLensItemsRead',
    payload: { spaceId: 'sp', folderId: 'sf' },
  },
  setLensHideRead: {
    kind: 'setLensHideRead',
    payload: { spaceId: 'sp', folderId: 'sf', hideRead: true },
  },
  setLensFilter: {
    kind: 'setLensFilter',
    payload: { spaceId: 'sp', folderId: 'sf', filter: { entities: ['change'] } },
  },
  openLensListing: {
    kind: 'openLensListing',
    payload: { spaceId: 'sp', folderId: 'sf', windowId: 1 },
  },
  openLensPage: {
    kind: 'openLensPage',
    payload: { spaceId: 'sp', folderId: 'sf', windowId: 1 },
  },
  openLensItem: {
    kind: 'openLensItem',
    payload: { spaceId: 'sp', folderId: 'sf', itemId: '42', windowId: 1 },
  },
  reorderTemp: { kind: 'reorderTemp', payload: { windowId: 1, tabIds: [1, 2, 3] } },
  reorderSpaces: { kind: 'reorderSpaces', payload: { spaceIds: ['a', 'b'] } },
  renameTab: { kind: 'renameTab', payload: { savedTabId: 'st', newName: 'N' } },
  renameTempTab: {
    kind: 'renameTempTab',
    payload: { tabId: 42, spaceId: 'sp', windowId: 1, newName: 'N' },
  },
  focusTab: { kind: 'focusTab', payload: { tabId: 42 } },
  closeTab: { kind: 'closeTab', payload: { tabId: 42 } },
  newTab: { kind: 'newTab', payload: { windowId: 1 } },
  clearTempTabs: { kind: 'clearTempTabs', payload: { windowId: 1 } },
  undoClearTempTabs: { kind: 'undoClearTempTabs', payload: { windowId: 1, tabIds: [1, 2] } },
  openUrl: { kind: 'openUrl', payload: { url: 'https://example.com', windowId: 1 } },
  duplicateTab: { kind: 'duplicateTab', payload: { tabId: 42 } },
  setTabBoundary: {
    kind: 'setTabBoundary',
    payload: { savedTabId: 'st', boundary: { mode: 'locked', allow: ['*.example.com'] } },
  },
  restoreArchivedTab: {
    kind: 'restoreArchivedTab',
    payload: { archivedAt: 123, tabId: 5, windowId: 1 },
  },
  setSpaceAutoArchive: {
    kind: 'setSpaceAutoArchive',
    payload: { spaceId: 'sp', autoArchive: { mode: 'custom', idleMinutes: 30 } },
  },
  deleteArchivedTab: { kind: 'deleteArchivedTab', payload: { archivedAt: 123, tabId: 5 } },
  clearArchivedTabs: { kind: 'clearArchivedTabs', payload: {} },
  importState: {
    kind: 'importState',
    payload: {
      backup: {
        formatVersion: 1 as const,
        schemaVersion: 5,
        exportedAt: 1000,
        state: {
          schemaVersion: 5,
          spaces: [],
          sources: {},
          savedTabs: {},
          pinnedBySpace: {},
          faviconRow: [],
          archivedTabs: [],
          trash: {},
          lastActivatedSpaceId: null,
        },
      },
    },
  },
  importOpml: {
    kind: 'importOpml',
    payload: {
      spaceId: 'sp',
      feeds: [{ name: 'HN', feedUrl: 'https://hnrss.org/frontpage' }],
    },
  },
};

describe('SidebarCommandSchema (full-payload validation)', () => {
  test('every command kind has a valid representative that parses', () => {
    for (const kind of SIDEBAR_COMMAND_KINDS) {
      const cmd = VALID_COMMANDS[kind];
      const parsed = SidebarCommandSchema.safeParse(cmd);
      expect(parsed.success, `expected ${kind} to parse`).toBe(true);
      if (parsed.success) expect(parsed.data).toEqual(cmd);
    }
  });

  test('the optional/nullable payload variants parse', () => {
    // Optional fields present.
    expect(
      SidebarCommandSchema.safeParse({
        kind: 'pinTab',
        payload: {
          tabId: 1,
          windowId: 1,
          spaceId: 'sp',
          targetIndex: 0,
          placement: { into: 'f1' },
        },
      }).success,
    ).toBe(true);
    expect(
      SidebarCommandSchema.safeParse({
        kind: 'pinSavedTab',
        payload: { savedTabId: 'st', spaceId: 'sp', index: 3 },
      }).success,
    ).toBe(true);
    expect(
      SidebarCommandSchema.safeParse({
        kind: 'newTab',
        payload: { windowId: 1, spaceId: 'sp' },
      }).success,
    ).toBe(true);
    // Nullable boundary / autoArchive.
    expect(
      SidebarCommandSchema.safeParse({
        kind: 'setTabBoundary',
        payload: { savedTabId: 'st', boundary: null },
      }).success,
    ).toBe(true);
    expect(
      SidebarCommandSchema.safeParse({
        kind: 'setSpaceAutoArchive',
        payload: { spaceId: 'sp', autoArchive: null },
      }).success,
    ).toBe(true);
    // createSpace accepts an optional auto-archive override (absent = inherit).
    expect(
      SidebarCommandSchema.safeParse({
        kind: 'createSpace',
        payload: {
          name: 'Focus',
          color: 'blue',
          icon: 'star',
          windowId: 1,
          autoArchive: { mode: 'custom', idleMinutes: 20 },
        },
      }).success,
    ).toBe(true);
  });

  test('rejects a missing required field', () => {
    const parsed = SidebarCommandSchema.safeParse({
      kind: 'createSpace',
      payload: { name: 'Work', color: 'blue', icon: 'star' }, // windowId missing
    });
    expect(parsed.success).toBe(false);
  });

  test('rejects a wrong-typed field', () => {
    const parsed = SidebarCommandSchema.safeParse({
      kind: 'focusTab',
      payload: { tabId: 'not-a-number' },
    });
    expect(parsed.success).toBe(false);
  });

  test('rejects an out-of-vocabulary SpaceColor / IconName', () => {
    expect(
      SidebarCommandSchema.safeParse({
        kind: 'recolourSpace',
        payload: { spaceId: 'sp', color: 'chartreuse' },
      }).success,
    ).toBe(false);
    expect(
      SidebarCommandSchema.safeParse({
        kind: 'changeSpaceIcon',
        payload: { spaceId: 'sp', icon: 'not-an-icon' },
      }).success,
    ).toBe(false);
  });

  test('rejects an extra key (strict payload)', () => {
    const parsed = SidebarCommandSchema.safeParse({
      kind: 'deleteSpace',
      payload: { spaceId: 'sp', sneaky: true },
    });
    expect(parsed.success).toBe(false);
  });

  test('rejects a malformed nested PinNode', () => {
    const parsed = SidebarCommandSchema.safeParse({
      kind: 'reorderPinned',
      payload: { spaceId: 'sp', nodes: [{ kind: 'tab' }] }, // missing id
    });
    expect(parsed.success).toBe(false);
  });

  test('rejects a non-positive custom idleMinutes', () => {
    const parsed = SidebarCommandSchema.safeParse({
      kind: 'setSpaceAutoArchive',
      payload: { spaceId: 'sp', autoArchive: { mode: 'custom', idleMinutes: 0 } },
    });
    expect(parsed.success).toBe(false);
  });

  test('rejects an out-of-vocabulary lens query', () => {
    expect(
      SidebarCommandSchema.safeParse({
        kind: 'createLens',
        payload: {
          spaceId: 'sp',
          sources: [{ sourceId: 'acc-1', queries: ['merged-by-me'] }],
          name: 'X',
          maxItems: 20,
          refreshMinutes: 10,
        },
      }).success,
    ).toBe(false);
  });

  test('openLensItem round-trips (identity-only payload)', () => {
    const cmd = {
      kind: 'openLensItem',
      payload: { spaceId: 'sp', folderId: 'sf-1', itemId: '42', windowId: 100 },
    };
    const parsed = SidebarCommandSchema.safeParse(cmd);
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data).toEqual(cmd);
  });

  test('openLensItem rejects a smuggled url key (strict payload)', () => {
    // The SW resolves the URL from its own runtime slice — a URL on the wire
    // is exactly what the identity-only contract forbids.
    const parsed = SidebarCommandSchema.safeParse({
      kind: 'openLensItem',
      payload: {
        spaceId: 'sp',
        folderId: 'sf-1',
        itemId: '42',
        windowId: 100,
        url: 'https://evil.example.com',
      },
    });
    expect(parsed.success).toBe(false);
  });

  test('openLensItem rejects a missing itemId', () => {
    const parsed = SidebarCommandSchema.safeParse({
      kind: 'openLensItem',
      payload: { spaceId: 'sp', folderId: 'sf-1', windowId: 100 },
    });
    expect(parsed.success).toBe(false);
  });

  test('createLens and updateLens round-trip with a queue reference', () => {
    const create = {
      kind: 'createLens',
      payload: {
        spaceId: 'sp',
        sources: [{ sourceId: 'acc-1', queries: ['authored'] as const }],
        name: 'X',
        maxItems: 20,
        refreshMinutes: 10,
      },
    };
    const update = {
      kind: 'updateLens',
      payload: { ...create.payload, folderId: 'sf-1' },
    };
    const parsedCreate = SidebarCommandSchema.safeParse(create);
    expect(parsedCreate.success).toBe(true);
    if (parsedCreate.success) expect(parsedCreate.data).toEqual(create);
    const parsedUpdate = SidebarCommandSchema.safeParse(update);
    expect(parsedUpdate.success).toBe(true);
    if (parsedUpdate.success) expect(parsedUpdate.data).toEqual(update);
  });

  test('multi-reference createLens round-trips (queue + feed refs)', () => {
    const create = {
      kind: 'createLens',
      payload: {
        spaceId: 'sp',
        sources: [
          { sourceId: 'acc-gl', queries: ['authored'] as const },
          { sourceId: 'acc-rss', queries: [] },
        ],
        name: 'Work + News',
        maxItems: 20,
        refreshMinutes: 10,
      },
    };
    const parsed = SidebarCommandSchema.safeParse(create);
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data).toEqual(create);
  });

  test('a feed reference round-trips with no query (empty queries)', () => {
    const create = {
      kind: 'createLens',
      payload: {
        spaceId: 'sp',
        sources: [{ sourceId: 'acc-rss', queries: [] }],
        name: 'Hacker News',
        maxItems: 30,
        refreshMinutes: 30,
      },
    };
    const parsed = SidebarCommandSchema.safeParse(create);
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data).toEqual(create);
  });

  test('rejects a source reference carrying an embedded source key (strict)', () => {
    // The provider/baseUrl live on the account, not the reference — a stray
    // embedded key fails the strict ref schema.
    for (const kind of ['createLens', 'updateLens'] as const) {
      expect(
        SidebarCommandSchema.safeParse({
          kind,
          payload: {
            spaceId: 'sp',
            ...(kind === 'updateLens' ? { folderId: 'sf-1' } : {}),
            sources: [{ sourceId: 'acc-1', source: 'gitlab', queries: ['authored'] }],
            name: 'X',
            maxItems: 20,
            refreshMinutes: 10,
          },
        }).success,
        `${kind} with an embedded source key`,
      ).toBe(false);
    }
  });

  test('rejects a createLens/updateLens carrying lensKind (the SW derives it — sources-redesign)', () => {
    // The kind is no longer part of the lens-command contract: neither payload
    // schema declares a `lensKind` field, so a caller sending one fails the
    // strict parse (the handler derives the kind from the sources).
    for (const kind of ['createLens', 'updateLens'] as const) {
      expect(
        SidebarCommandSchema.safeParse({
          kind,
          payload: {
            spaceId: 'sp',
            ...(kind === 'updateLens' ? { folderId: 'sf-1' } : {}),
            sources: [{ sourceId: 'acc-1', queries: ['authored'] }],
            name: 'X',
            maxItems: 20,
            refreshMinutes: 10,
            lensKind: 'review',
          },
        }).success,
        `${kind} carrying lensKind`,
      ).toBe(false);
    }
  });

  test('rejects a createLens with empty sources array', () => {
    expect(
      SidebarCommandSchema.safeParse({
        kind: 'createLens',
        payload: {
          spaceId: 'sp',
          sources: [],
          name: 'X',
          maxItems: 20,
          refreshMinutes: 10,
        },
      }).success,
    ).toBe(false);
  });

  test('rejects a createLens carrying a sidebar-minted folderId', () => {
    // The SW mints the id — a `folderId` on create is an extra key (strict).
    expect(
      SidebarCommandSchema.safeParse({
        kind: 'createLens',
        payload: {
          spaceId: 'sp',
          folderId: 'sf-1',
          sources: [{ sourceId: 'acc-1', queries: ['authored'] }],
          name: 'X',
          maxItems: 20,
          refreshMinutes: 10,
        },
      }).success,
    ).toBe(false);
  });

  test('rejects an updateLens missing its folderId', () => {
    expect(
      SidebarCommandSchema.safeParse({
        kind: 'updateLens',
        payload: {
          spaceId: 'sp',
          sources: [{ sourceId: 'acc-1', queries: ['authored'] }],
          name: 'X',
          maxItems: 20,
          refreshMinutes: 10,
        },
      }).success,
    ).toBe(false);
  });

  test('a reorderPinned tree containing a single-source lens node round-trips losslessly', () => {
    const lensNode = {
      kind: 'lens',
      lensKind: 'general',
      id: 'sf-1',
      name: 'Review requests',
      icon: 'folder-git-2',
      sources: [{ sourceId: 'acc-1', queries: ['review-requested'] }],
      maxItems: 20,
      hideRead: false,
      refreshMinutes: 5,
    };
    const cmd = {
      kind: 'reorderPinned',
      payload: {
        spaceId: 'sp',
        nodes: [
          { kind: 'tab', id: 't1' },
          lensNode,
          { kind: 'folder', id: 'f1', name: 'F', icon: 'folder', color: 'gray', children: ['t2'] },
        ],
      },
    };
    const parsed = SidebarCommandSchema.safeParse(cmd);
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data).toEqual(cmd);
  });

  test('a reorderPinned tree containing a multi-source lens node round-trips losslessly', () => {
    const cmd = {
      kind: 'reorderPinned',
      payload: {
        spaceId: 'sp',
        nodes: [
          {
            kind: 'lens',
            lensKind: 'general',
            id: 'sf-1',
            name: 'Work + News',
            icon: 'layers',
            sources: [
              { sourceId: 'acc-gh', queries: ['authored'] },
              { sourceId: 'acc-rss', queries: [] },
            ],
            maxItems: 20,
            hideRead: false,
            refreshMinutes: 10,
          },
        ],
      },
    };
    const parsed = SidebarCommandSchema.safeParse(cmd);
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data).toEqual(cmd);
  });

  test('a reorderPinned tree containing a jira lens node round-trips losslessly', () => {
    const cmd = {
      kind: 'reorderPinned',
      payload: {
        spaceId: 'sp',
        nodes: [
          {
            kind: 'lens',
            lensKind: 'general',
            id: 'sf-jira',
            name: 'My reported issues',
            icon: 'folder-kanban',
            sources: [{ sourceId: 'acc-jira', queries: ['authored'] }],
            maxItems: 20,
            hideRead: false,
            refreshMinutes: 10,
          },
        ],
      },
    };
    const parsed = SidebarCommandSchema.safeParse(cmd);
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data).toEqual(cmd);
  });

  test('a reorderPinned tree containing an rss lens node (no query) round-trips losslessly', () => {
    const cmd = {
      kind: 'reorderPinned',
      payload: {
        spaceId: 'sp',
        nodes: [
          {
            kind: 'lens',
            lensKind: 'general',
            id: 'feed-1',
            name: 'Hacker News',
            icon: 'rss',
            sources: [{ sourceId: 'acc-rss', queries: [] }],
            maxItems: 30,
            hideRead: true,
            refreshMinutes: 30,
          },
        ],
      },
    };
    const parsed = SidebarCommandSchema.safeParse(cmd);
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data).toEqual(cmd);
  });

  test('rejects a lens PinNode whose reference is missing its sourceId', () => {
    expect(
      SidebarCommandSchema.safeParse({
        kind: 'reorderPinned',
        payload: {
          spaceId: 'sp',
          nodes: [
            {
              kind: 'lens',
              lensKind: 'general',
              id: 'sf-1',
              name: 'X',
              icon: 'folder-git-2',
              // A reference without `sourceId` (embedded legacy shape) fails the
              // strict ref schema.
              sources: [{ baseUrl: 'https://gitlab.com', queries: ['authored'] }],
              maxItems: 20,
              hideRead: false,
              refreshMinutes: 10,
            },
          ],
        },
      }).success,
    ).toBe(false);
  });

  test('createAccount validates and round-trips (client-minted id)', () => {
    const cmd = {
      kind: 'createAccount',
      payload: { id: 'acc-1', provider: 'github', baseUrl: 'https://github.com', name: 'Work' },
    };
    const parsed = SidebarCommandSchema.safeParse(cmd);
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data).toEqual(cmd);
  });

  test('createAccount rejects an out-of-vocabulary provider', () => {
    expect(
      SidebarCommandSchema.safeParse({
        kind: 'createAccount',
        payload: { id: 'acc-1', provider: 'mercurial', baseUrl: 'https://example.com' },
      }).success,
    ).toBe(false);
  });

  test('createAccount accepts the bitbucket provider with a Cloud workspace', () => {
    const cmd = {
      kind: 'createAccount',
      payload: {
        id: 'acc-bb',
        provider: 'bitbucket',
        baseUrl: 'https://bitbucket.org',
        workspace: 'acme',
      },
    };
    const parsed = SidebarCommandSchema.safeParse(cmd);
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data).toEqual(cmd);
  });

  test('createAccount rejects an extra key (strict payload)', () => {
    expect(
      SidebarCommandSchema.safeParse({
        kind: 'createAccount',
        payload: {
          id: 'acc-1',
          provider: 'github',
          baseUrl: 'https://github.com',
          token: 'ghp-x', // the token never rides the bus
        },
      }).success,
    ).toBe(false);
  });

  test('renameAccount and deleteAccount round-trip', () => {
    const rename = { kind: 'renameAccount', payload: { id: 'acc-1', name: 'Personal' } };
    const remove = { kind: 'deleteAccount', payload: { id: 'acc-1' } };
    expect(SidebarCommandSchema.safeParse(rename).success).toBe(true);
    expect(SidebarCommandSchema.safeParse(remove).success).toBe(true);
  });
});

describe('dispatch (fire-and-forget helper)', () => {
  test('a rejecting send is caught and logged via the typed logger, no unhandled rejection', async () => {
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
    const stub: ChromeStub = {
      runtime: {
        id: 'ext',
        sendMessage: vi.fn(() => Promise.reject(new Error('Receiving end does not exist'))),
        onMessage: { addListener: vi.fn(), removeListener: vi.fn() },
      },
    };
    (globalThis as unknown as { chrome: ChromeStub }).chrome = stub;
    vi.resetModules();
    const { dispatch } = await import('./bus');
    const { log: freshLog } = await import('./logger');
    const errSpy = vi.spyOn(freshLog, 'error').mockImplementation(() => undefined);

    dispatch({ kind: 'focusTab', payload: { tabId: 7 } });

    // Flush the transport rejection → bus reject → dispatch catch → log chain.
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(errSpy).toHaveBeenCalledWith(
      'BUS_DISPATCH_FAILED',
      expect.objectContaining({ kind: 'focusTab' }),
    );
    errSpy.mockRestore();
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
