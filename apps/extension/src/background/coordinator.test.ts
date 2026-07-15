import { describe, expect, test, vi } from 'vitest';
import { LunmaStore } from '../shared/store.svelte';
import type { SavedTab } from '../shared/types';
import { Coordinator, EventPolicy, type PendingEvent, QUEUE_CAP } from './coordinator';
import {
  installBookmarksChromeStub,
  makeCoordinator,
  sidebar,
  tabCreated,
  tabUpdated,
  windowCreated,
} from './coordinator.test-helpers';

function savedTab(id: string, originalURL: string, currentURL: string | null): SavedTab {
  return { id, spaceId: 'work', title: id, originalURL, currentURL };
}

/**
 * White-box view of the coordinator's in-memory queue. The merge happens at
 * enqueue time (before the microtask drain), and the spec scenarios are about
 * queue contents, so we inspect the queue synchronously after enqueueing and
 * before awaiting `idle()`.
 */
function queuedEvents(c: Coordinator): PendingEvent[] {
  return (c as unknown as { events: PendingEvent[] }).events;
}

function tabGroupUpdated(id: number, fields: { title?: string; color?: string }): PendingEvent {
  return {
    source: 'chrome',
    kind: 'tabGroups.onUpdated',
    payload: { group: { id, ...fields } as chrome.tabGroups.TabGroup },
  };
}

describe('Coordinator.enqueue', () => {
  test('drains events in FIFO order across two Chrome event kinds', async () => {
    const { coordinator, store, persist, broadcast } = makeCoordinator();
    store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
    store.state.lastActivatedSpaceId = 'work';
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: {
        spaceId: 'work',
        groupId: 1,
        tempTabIds: [],
        tempTabTitles: {},
      },
    };

    coordinator.enqueue(tabCreated(42, 100));
    coordinator.enqueue(windowCreated(200));
    await coordinator.idle();

    expect(store.state.spaceInstancesByWindow[100]?.work?.tempTabIds).toEqual([42]);
    expect(store.state.activeSpaceByWindow[200]).toBe('work');
    expect(persist).toHaveBeenCalledTimes(1);
    expect(broadcast).toHaveBeenCalledTimes(1);
  });

  test('coalesces three tabs.onUpdated for the same tabId to one with the latest payload', async () => {
    const { coordinator, store, persist } = makeCoordinator();
    store.state.savedTabs['st-1'] = savedTab('st-1', 'https://x/', 'https://x/');
    store.state.tabBindings['st-1'] = { 100: 42 };

    coordinator.enqueue(tabUpdated(42, { url: 'https://x/a' }));
    coordinator.enqueue(tabUpdated(42, { url: 'https://x/b' }));
    coordinator.enqueue(tabUpdated(42, { url: 'https://x/c' }));
    await coordinator.idle();

    expect(store.state.savedTabs['st-1']?.currentURL).toBe('https://x/c');
    expect(persist).toHaveBeenCalledTimes(1);
  });

  test('coalescing does not reorder unrelated events', async () => {
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: {
        spaceId: 'work',
        groupId: 1,
        tempTabIds: [],
        tempTabTitles: {},
      },
    };
    store.state.savedTabs['st-1'] = savedTab('st-1', 'https://x/', 'https://x/');
    store.state.tabBindings['st-1'] = { 100: 42 };

    coordinator.enqueue(tabCreated(50, 100));
    coordinator.enqueue(tabUpdated(42, { url: 'https://x/a' }));
    coordinator.enqueue(tabUpdated(42, { url: 'https://x/b' }));
    await coordinator.idle();

    expect(store.state.spaceInstancesByWindow[100]?.work?.tempTabIds).toContain(50);
    expect(store.state.savedTabs['st-1']?.currentURL).toBe('https://x/b');
  });

  test('drops the oldest event and logs EVENT_DROPPED when the cap is exceeded', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { coordinator } = makeCoordinator();

    for (let i = 1; i <= QUEUE_CAP; i += 1) {
      coordinator.enqueue(tabCreated(i, i));
    }
    coordinator.enqueue(tabCreated(QUEUE_CAP + 1, QUEUE_CAP + 1));

    expect(
      errorSpy.mock.calls.some((c) => typeof c[0] === 'string' && c[0].includes('EVENT_DROPPED')),
    ).toBe(true);

    errorSpy.mockRestore();
  });
});

describe('Coordinator.enqueue: per-kind merge coalescing', () => {
  test('successive tabs.onUpdated for the same tab merge changeInfo field-wise (status preserved)', async () => {
    const { coordinator } = makeCoordinator();

    coordinator.enqueue(tabUpdated(42, { status: 'complete' }));
    coordinator.enqueue(tabUpdated(42, { favIconUrl: 'https://x/icon.png' }));

    const q = queuedEvents(coordinator);
    expect(q).toHaveLength(1);
    const ev = q[0];
    expect(ev?.kind).toBe('tabs.onUpdated');
    if (ev?.kind === 'tabs.onUpdated') {
      // The earlier status survives the later favicon-only event.
      expect(ev.payload.changeInfo).toEqual({
        status: 'complete',
        favIconUrl: 'https://x/icon.png',
      });
    }

    await coordinator.idle();
  });

  test('later field wins on conflict', async () => {
    const { coordinator } = makeCoordinator();

    coordinator.enqueue(tabUpdated(42, { status: 'loading' }));
    coordinator.enqueue(tabUpdated(42, { status: 'complete' }));

    const q = queuedEvents(coordinator);
    expect(q).toHaveLength(1);
    const ev = q[0];
    if (ev?.kind === 'tabs.onUpdated') {
      expect(ev.payload.changeInfo.status).toBe('complete');
    }

    await coordinator.idle();
  });

  test('coalescing keeps unrelated events ordered and merges only the onUpdated pair', async () => {
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: { spaceId: 'work', groupId: 1, tempTabIds: [], tempTabTitles: {} },
    };

    coordinator.enqueue(tabCreated(50, 100));
    coordinator.enqueue(tabUpdated(42, { status: 'loading' }));
    coordinator.enqueue(tabUpdated(42, { favIconUrl: 'https://x/icon.png' }));

    const q = queuedEvents(coordinator);
    expect(q).toHaveLength(2);
    // onCreated stays first; the two onUpdated(42) collapse to one merged event.
    expect(q[0]?.kind).toBe('tabs.onCreated');
    const merged = q[1];
    expect(merged?.kind).toBe('tabs.onUpdated');
    if (merged?.kind === 'tabs.onUpdated') {
      expect(merged.payload.changeInfo).toEqual({
        status: 'loading',
        favIconUrl: 'https://x/icon.png',
      });
    }

    await coordinator.idle();
  });

  test('tabGroups.onUpdated merges field-wise (defensive — full snapshot today)', async () => {
    const { coordinator } = makeCoordinator();

    coordinator.enqueue(tabGroupUpdated(1, { title: 'A', color: 'blue' }));
    coordinator.enqueue(tabGroupUpdated(1, { title: 'B' }));

    const q = queuedEvents(coordinator);
    expect(q).toHaveLength(1);
    const ev = q[0];
    if (ev?.kind === 'tabGroups.onUpdated') {
      // Incoming title wins; the prior color (absent from the incoming partial)
      // is retained by the field-wise merge.
      expect(ev.payload.group).toEqual({ id: 1, title: 'B', color: 'blue' });
    }

    await coordinator.idle();
  });

  test('sidebar keyed coalescing stays replace, not merge', async () => {
    const { coordinator, store } = makeCoordinator();
    store.state.spaces.push({ id: 'a', name: 'Old', color: 'blue', icon: 'star' });

    coordinator.enqueue(
      sidebar({ kind: 'renameSpace', payload: { spaceId: 'a', newName: 'X' } }, 'sess:1'),
    );
    coordinator.enqueue(
      sidebar({ kind: 'renameSpace', payload: { spaceId: 'a', newName: 'Y' } }, 'sess:2'),
    );

    const q = queuedEvents(coordinator);
    expect(q).toHaveLength(1);
    const ev = q[0];
    expect(ev?.kind).toBe('renameSpace');
    if (ev?.kind === 'renameSpace') {
      expect(ev.payload).toEqual({ spaceId: 'a', newName: 'Y' });
    }

    await coordinator.idle();
  });

  test('only the two *.onUpdated kinds declare mergePayload; sidebar keyed kinds do not', () => {
    expect(EventPolicy['tabs.onUpdated'].mergePayload).toBeDefined();
    expect(EventPolicy['tabGroups.onUpdated'].mergePayload).toBeDefined();
    expect(EventPolicy.renameSpace.mergePayload).toBeUndefined();
    expect(EventPolicy.activateSpace.mergePayload).toBeUndefined();
  });

  test('drained merged event yields status:complete and the favicon (row renders the icon, not the spinner)', async () => {
    const { coordinator, store } = makeCoordinator();
    // Seed a live tab mid-load: status 'loading', no favicon yet. This is the
    // pre-fix bug condition — without the merge the later favicon-only event
    // would coalesce away the 'complete' and syncLiveTab would fall back to the
    // stored 'loading'.
    store.state.liveTabsById[42] = {
      tabId: 42,
      windowId: 100,
      title: 'Maps',
      url: 'https://maps/',
      active: true,
      status: 'loading',
    };

    coordinator.enqueue(tabUpdated(42, { status: 'complete' }));
    coordinator.enqueue(tabUpdated(42, { favIconUrl: 'https://x/icon.png' }));
    await coordinator.idle();

    const live = store.state.liveTabsById[42];
    expect(live?.status).toBe('complete');
    expect(live?.favIconUrl).toBe('https://x/icon.png');
  });

  test('a bound tab finishing load broadcasts status:complete WITHOUT waiting for boundary injection (favicon-row stuck-loading regression)', async () => {
    const { coordinator, store, broadcast } = makeCoordinator();
    store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
    // A bound (pinned/favorite) tab: a saved record + a per-window binding + a
    // live tab still mid-load. This is exactly the favicon-row case.
    store.state.savedTabs.s1 = savedTab('s1', 'https://example.com/', 'https://example.com/');
    store.state.tabBindings.s1 = { 1: 42 };
    store.state.liveTabsById[42] = {
      tabId: 42,
      windowId: 1,
      title: 'Example',
      url: 'https://example.com/',
      active: true,
      status: 'loading',
    };
    // Domain boundaries ON (the reporter's config) so the complete-handler re-arms
    // the boundary — the branch that used to gate the broadcast.
    coordinator.setBoundaryDefault('domain');

    // `executeScript` is GATED on a promise we never resolve in the assertion
    // window — it models the injection that "can block for seconds". With the bug
    // (await), this would gate the drain's broadcast; with the fix (floated), the
    // broadcast still fires while injection is in flight.
    let releaseInject!: () => void;
    const injectGate = new Promise<void>((r) => {
      releaseInject = r;
    });
    const prevChrome = (globalThis as { chrome?: unknown }).chrome;
    const executeScript = vi.fn(() => injectGate);
    (globalThis as unknown as { chrome: unknown }).chrome = {
      scripting: { executeScript },
      tabs: { sendMessage: vi.fn(() => Promise.resolve()) },
      runtime: {
        getManifest: () => ({ content_scripts: [{ js: ['assets/tab-boundary.js'] }] }),
        sendMessage: vi.fn(() => Promise.resolve()),
      },
    };

    try {
      coordinator.enqueue(tabUpdated(42, { status: 'complete' }));
      // The drain completes and broadcasts WITHOUT awaiting the pending injection.
      // (Pre-fix this hangs forever — the drain never reaches its broadcast.)
      await vi.waitFor(() => expect(broadcast).toHaveBeenCalledTimes(1));
      const { state } = broadcast.mock.calls[0]?.[0] ?? { state: undefined };
      expect(state?.liveTabsById[42]?.status).toBe('complete');
      // The boundary re-arm WAS kicked off (floated) — just not awaited.
      expect(executeScript).toHaveBeenCalled();
    } finally {
      releaseInject();
      await coordinator.idle();
      (globalThis as { chrome?: unknown }).chrome = prevChrome;
    }
  });
});

describe('Coordinator.drain', () => {
  test('ten distinct-tabId tabs.onUpdated produce ten mutators but exactly one persist and one broadcast', async () => {
    const { coordinator, store, persist, broadcast } = makeCoordinator();
    for (let i = 1; i <= 10; i += 1) {
      store.state.savedTabs[`st-${i}`] = savedTab(`st-${i}`, 'https://x/', 'https://x/');
      store.state.tabBindings[`st-${i}`] = { 100: i };
    }
    const mutateSpy = vi.spyOn(store, 'onTabUpdated');

    for (let i = 1; i <= 10; i += 1) {
      coordinator.enqueue(tabUpdated(i, { url: `https://x/${i}` }));
    }
    await coordinator.idle();

    expect(mutateSpy).toHaveBeenCalledTimes(10);
    expect(persist).toHaveBeenCalledTimes(1);
    expect(broadcast).toHaveBeenCalledTimes(1);
  });

  test('a drain with only no-op handlers calls neither persist nor broadcast', async () => {
    const { coordinator, persist, broadcast } = makeCoordinator();
    coordinator.enqueue(tabUpdated(42, {}));
    await coordinator.idle();

    expect(persist).not.toHaveBeenCalled();
    expect(broadcast).not.toHaveBeenCalled();
  });

  test('an event enqueued during a drain persist-await is NOT stranded (favicon stuck-on-loading: drain re-checks the queue)', async () => {
    const store = new LunmaStore({ idFactory: () => 'id' });
    store.state.liveTabsById[42] = {
      tabId: 42,
      windowId: 1,
      title: 'Maps',
      url: 'https://www.google.com/maps',
      active: true,
      status: 'loading',
    };
    // Gate the FIRST persist so the drain parks in its async tail; later persists
    // resolve immediately.
    let releasePersist!: () => void;
    const firstPersist = new Promise<void>((r) => {
      releasePersist = r;
    });
    const persist = vi.fn(() =>
      persist.mock.calls.length === 1 ? firstPersist : Promise.resolve(),
    );
    const broadcast = vi.fn();
    const coordinator = new Coordinator({ store, persist, broadcast });

    // Event A drains, mutates, and parks the drain on the gated persist.
    coordinator.enqueue(tabUpdated(42, { title: 'Google Maps' }));
    await vi.waitFor(() => expect(persist).toHaveBeenCalledTimes(1));

    // Event B — the real-world `status:'complete'` landing ~2ms behind a
    // `{status:'loading'}` — enqueues DURING the persist await. Pre-fix,
    // `scheduleDrain` no-ops (draining=true) and the inner loop has already
    // emptied, so B is stranded until an unrelated later enqueue (a tab click).
    coordinator.enqueue(tabUpdated(42, { status: 'complete' }));

    // Let the parked drain finish; the fix re-checks the queue and processes B
    // in the same drain cycle.
    releasePersist();
    await coordinator.idle();

    expect(store.state.liveTabsById[42]?.status).toBe('complete');
    // B was processed in its OWN drain cycle, not stranded — proven by its
    // broadcast. Its persist is skipped: B mutates only the ephemeral
    // `liveTabsById` (status), so its persisted projection equals A's, and the
    // ephemeral-only persist-skip (design D2) elides the redundant write.
    expect(broadcast).toHaveBeenCalledTimes(2);
    expect(persist).toHaveBeenCalledTimes(1);
  });

  test('a throwing handler does not block the next event and still triggers persist+broadcast', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { coordinator, store, persist, broadcast } = makeCoordinator();
    store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
    store.state.lastActivatedSpaceId = 'work';
    store.state.activeSpaceByWindow[100] = 'work';
    store.state.spaceInstancesByWindow[100] = {
      work: {
        spaceId: 'work',
        groupId: 1,
        tempTabIds: [],
        tempTabTitles: {},
      },
    };

    const throwSpy = vi.spyOn(store, 'onWindowOpened').mockImplementation(() => {
      throw new Error('boom');
    });

    coordinator.enqueue(windowCreated(200));
    coordinator.enqueue(tabCreated(42, 100));
    await coordinator.idle();

    expect(store.state.spaceInstancesByWindow[100]?.work?.tempTabIds).toEqual([42]);
    expect(persist).toHaveBeenCalledTimes(1);
    expect(broadcast).toHaveBeenCalledTimes(1);
    expect(
      errorSpy.mock.calls.some((c) => typeof c[0] === 'string' && c[0].includes('HANDLER_THREW')),
    ).toBe(true);
    throwSpy.mockRestore();
    errorSpy.mockRestore();
  });

  test('logs and continues when persist throws', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    let counter = 0;
    const store = new LunmaStore({ idFactory: () => `id-${++counter}` });
    store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
    store.state.lastActivatedSpaceId = 'work';
    const persist = vi.fn(() => {
      throw new Error('storage offline');
    });
    const broadcast = vi.fn();
    const coordinator = new Coordinator({ store, persist, broadcast });
    coordinator.enqueue(windowCreated(200));
    await coordinator.idle();
    expect(store.state.activeSpaceByWindow[200]).toBe('work');
    expect(broadcast).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  test('logs and continues when broadcast throws', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    let counter = 0;
    const store = new LunmaStore({ idFactory: () => `id-${++counter}` });
    store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
    store.state.lastActivatedSpaceId = 'work';
    const persist = vi.fn();
    const broadcast = vi.fn(() => {
      throw new Error('no listeners');
    });
    const coordinator = new Coordinator({ store, persist, broadcast });
    coordinator.enqueue(windowCreated(200));
    await coordinator.idle();
    expect(store.state.activeSpaceByWindow[200]).toBe('work');
    expect(persist).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});

describe('Coordinator.drain: persist skip on an ephemeral-only cycle', () => {
  const liveTab = (tabId: number, windowId: number) => ({
    tabId,
    windowId,
    title: 'X',
    url: 'https://x/',
    active: true,
    status: 'complete' as const,
  });

  test('a favicon-only update on a bound tab broadcasts the new icon WITHOUT persisting', async () => {
    const { coordinator, store, persist, broadcast } = makeCoordinator();
    store.state.savedTabs.s1 = savedTab('s1', 'https://x/', 'https://x/');
    store.state.tabBindings.s1 = { 100: 42 };
    store.state.liveTabsById[42] = liveTab(42, 100);

    // First favicon update seeds the persisted-projection signature (the first
    // post-boot drain persists once even if redundant — design D2 boot interaction).
    coordinator.enqueue(tabUpdated(42, { favIconUrl: 'data:image/png;base64,AAAA' }));
    await coordinator.idle();
    expect(persist).toHaveBeenCalledTimes(1);
    persist.mockClear();
    broadcast.mockClear();

    // A SECOND favicon-only update (the WhatsApp re-badge): broadcast so the
    // sidebar swaps the icon, but skip the redundant write — the persisted
    // projection (state minus the ephemeral `liveTabsById`) is byte-identical.
    coordinator.enqueue(tabUpdated(42, { favIconUrl: 'data:image/png;base64,BBBB' }));
    await coordinator.idle();
    expect(persist).not.toHaveBeenCalled();
    expect(broadcast).toHaveBeenCalledTimes(1);
    const broadcasted = broadcast.mock.calls[0]?.[0]?.state;
    expect(broadcasted?.liveTabsById[42]?.favIconUrl).toBe('data:image/png;base64,BBBB');
  });

  test('a persisted-shape change still persists once (signature detects a real change)', async () => {
    const { coordinator, store, persist, broadcast } = makeCoordinator();
    store.state.savedTabs.s1 = savedTab('s1', 'https://x/', 'https://x/');
    store.state.tabBindings.s1 = { 100: 42 };
    store.state.liveTabsById[42] = liveTab(42, 100);

    // Seed the signature with a favicon-only drain (persists once, then redundant).
    coordinator.enqueue(tabUpdated(42, { favIconUrl: 'data:image/png;base64,AAAA' }));
    await coordinator.idle();
    persist.mockClear();
    broadcast.mockClear();

    // A bound tab navigating updates the (persisted) `currentURL`, so the
    // persisted projection changes and the signature compare persists again.
    coordinator.enqueue(tabUpdated(42, { url: 'https://x/new' }));
    await coordinator.idle();
    expect(store.state.savedTabs.s1?.currentURL).toBe('https://x/new');
    expect(persist).toHaveBeenCalledTimes(1);
    expect(broadcast).toHaveBeenCalledTimes(1);
  });

  test('the first drain after boot persists once even if redundant (signature starts null)', async () => {
    const { coordinator, store, persist, broadcast } = makeCoordinator();
    store.state.liveTabsById[42] = liveTab(42, 100);

    // Boot persisted directly (outside the coordinator), so `lastPersistedSignature`
    // is null — even an ephemeral-only first drain persists once (accepted redundant
    // write; no boot/coordinator coupling).
    coordinator.enqueue(tabUpdated(42, { favIconUrl: 'data:image/png;base64,AAAA' }));
    await coordinator.idle();
    expect(persist).toHaveBeenCalledTimes(1);
    expect(broadcast).toHaveBeenCalledTimes(1);

    // A subsequent ephemeral-only drain with an unchanged persisted projection skips.
    coordinator.enqueue(tabUpdated(42, { favIconUrl: 'data:image/png;base64,CCCC' }));
    await coordinator.idle();
    expect(persist).toHaveBeenCalledTimes(1); // still 1 — the second was skipped
    expect(broadcast).toHaveBeenCalledTimes(2);
  });
});

describe('Coordinator.idle', () => {
  test('resolves immediately when queue is empty and not draining', async () => {
    const { coordinator } = makeCoordinator();
    await coordinator.idle();
  });

  test('waits for the in-flight drain to complete', async () => {
    const { coordinator, store, persist } = makeCoordinator();
    store.state.spaces.push({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
    store.state.lastActivatedSpaceId = 'work';
    coordinator.enqueue(windowCreated(200));
    await coordinator.idle();
    expect(persist).toHaveBeenCalledTimes(1);
  });
});

describe('Coordinator: sidebar acks', () => {
  test('successful sidebar command emits one "ok" ack at drain tail (after persist+broadcast)', async () => {
    const { coordinator, persist, broadcast, emitAck } = makeCoordinator();
    coordinator.enqueue(
      sidebar(
        { kind: 'createSpace', payload: { name: 'A', color: 'gray', icon: 'star', windowId: 1 } },
        'sess:1',
      ),
    );
    await coordinator.idle();
    expect(persist).toHaveBeenCalledTimes(1);
    expect(broadcast).toHaveBeenCalledTimes(1);
    expect(emitAck).toHaveBeenCalledTimes(1);
    expect(emitAck).toHaveBeenCalledWith({
      type: 'lunma/command-ack',
      id: 'sess:1',
      result: 'ok',
    });
    // Order: persist + broadcast then ack.
    const ackOrder = emitAck.mock.invocationCallOrder[0] ?? -Infinity;
    const persistOrder = persist.mock.invocationCallOrder[0] ?? Infinity;
    const broadcastOrder = broadcast.mock.invocationCallOrder[0] ?? Infinity;
    expect(ackOrder).toBeGreaterThan(persistOrder);
    expect(ackOrder).toBeGreaterThan(broadcastOrder);
  });

  test('throwing sidebar handler emits an error ack and does not block subsequent events', async () => {
    const { coordinator, emitAck } = makeCoordinator();
    // renameSpace throws on unknown spaceId per D7-bis.
    coordinator.enqueue(
      sidebar({ kind: 'renameSpace', payload: { spaceId: 'nope', newName: 'X' } }, 'sess:1'),
    );
    // A subsequent valid event should still process.
    coordinator.enqueue(
      sidebar(
        { kind: 'createSpace', payload: { name: 'B', color: 'gray', icon: 'star', windowId: 1 } },
        'sess:2',
      ),
    );
    await coordinator.idle();
    expect(emitAck).toHaveBeenCalledTimes(2);
    expect(emitAck.mock.calls[0]?.[0]).toMatchObject({
      id: 'sess:1',
      result: { error: expect.stringContaining("unknown spaceId 'nope'") },
    });
    expect(emitAck.mock.calls[1]?.[0]).toEqual({
      type: 'lunma/command-ack',
      id: 'sess:2',
      result: 'ok',
    });
  });

  test('coalesced sidebar command acks "ok" at drain tail alongside survivor', async () => {
    const { coordinator, store, persist, broadcast, emitAck } = makeCoordinator();
    store.state.spaces.push({ id: 'a', name: 'Old', color: 'blue', icon: 'star' });
    coordinator.enqueue(
      sidebar({ kind: 'renameSpace', payload: { spaceId: 'a', newName: 'First' } }, 'sess:1'),
    );
    coordinator.enqueue(
      sidebar({ kind: 'renameSpace', payload: { spaceId: 'a', newName: 'Second' } }, 'sess:2'),
    );
    await coordinator.idle();
    expect(store.state.spaces[0]?.name).toBe('Second');
    expect(persist).toHaveBeenCalledTimes(1);
    expect(broadcast).toHaveBeenCalledTimes(1);
    expect(emitAck).toHaveBeenCalledTimes(2);
    const ids = emitAck.mock.calls.map((c) => (c[0] as { id: string }).id).sort();
    expect(ids).toEqual(['sess:1', 'sess:2']);
    for (const c of emitAck.mock.calls) {
      expect((c[0] as { result: unknown }).result).toBe('ok');
    }
  });

  test('ten distinct sidebar commands produce ten acks, one persist, one broadcast', async () => {
    const { coordinator, persist, broadcast, emitAck } = makeCoordinator();
    for (let i = 1; i <= 10; i += 1) {
      coordinator.enqueue(
        sidebar(
          {
            kind: 'createSpace',
            payload: { name: `S${i}`, color: 'gray', icon: 'star', windowId: 1 },
          },
          `sess:${i}`,
        ),
      );
    }
    await coordinator.idle();
    expect(persist).toHaveBeenCalledTimes(1);
    expect(broadcast).toHaveBeenCalledTimes(1);
    expect(emitAck).toHaveBeenCalledTimes(10);
  });

  test('ten coalescing renameSpace commands emit ten "ok" acks, one persist, one broadcast', async () => {
    const { coordinator, store, persist, broadcast, emitAck } = makeCoordinator();
    store.state.spaces.push({ id: 'a', name: 'Old', color: 'blue', icon: 'star' });
    for (let i = 1; i <= 10; i += 1) {
      coordinator.enqueue(
        sidebar({ kind: 'renameSpace', payload: { spaceId: 'a', newName: `N${i}` } }, `sess:${i}`),
      );
    }
    await coordinator.idle();
    expect(store.state.spaces[0]?.name).toBe('N10');
    expect(persist).toHaveBeenCalledTimes(1);
    expect(broadcast).toHaveBeenCalledTimes(1);
    expect(emitAck).toHaveBeenCalledTimes(10);
  });

  test('ack emission failure does not block subsequent acks', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { store, persist, broadcast } = makeCoordinator();
    let calls = 0;
    const flakyAck = vi.fn(() => {
      calls += 1;
      if (calls === 1) throw new Error('boom');
    });
    const c = new Coordinator({
      store,
      persist,
      broadcast,
      emitAck: flakyAck,
    });
    c.enqueue(
      sidebar(
        { kind: 'createSpace', payload: { name: 'A', color: 'gray', icon: 'star', windowId: 1 } },
        'sess:1',
      ),
    );
    c.enqueue(
      sidebar(
        { kind: 'createSpace', payload: { name: 'B', color: 'gray', icon: 'star', windowId: 1 } },
        'sess:2',
      ),
    );
    await c.idle();
    expect(flakyAck).toHaveBeenCalledTimes(2);
    expect(
      errSpy.mock.calls.some(
        (call) => typeof call[0] === 'string' && call[0].includes('ACK_EMIT_FAILED'),
      ),
    ).toBe(true);
    errSpy.mockRestore();
  });

  test('a chrome event by itself emits no ack', async () => {
    const { coordinator, emitAck } = makeCoordinator();
    coordinator.enqueue(tabCreated(1, 100));
    await coordinator.idle();
    expect(emitAck).not.toHaveBeenCalled();
  });

  test('queue-cap drop on a sidebar command emits an error ack at drain tail', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { coordinator, emitAck } = makeCoordinator();
    // Push a sidebar command first so it becomes the oldest in the queue.
    coordinator.enqueue(
      sidebar(
        { kind: 'createSpace', payload: { name: 'A', color: 'gray', icon: 'star', windowId: 1 } },
        'sess:dropme',
      ),
    );
    // Then fill with QUEUE_CAP chrome events; the (QUEUE_CAP+1)th push triggers
    // the shift that drops the sidebar event at queue head.
    for (let i = 1; i <= QUEUE_CAP; i += 1) {
      coordinator.enqueue(tabCreated(i, i));
    }
    await coordinator.idle();
    const sidebarAcks = emitAck.mock.calls
      .map((c) => c[0] as { id: string; result: unknown })
      .filter((a) => a.id === 'sess:dropme');
    expect(sidebarAcks).toHaveLength(1);
    expect(sidebarAcks[0]?.result).toMatchObject({
      error: expect.stringContaining('queue capacity exceeded'),
    });
    errSpy.mockRestore();
  });
});

describe('Coordinator: extra sidebar handlers', () => {
  test('deleteSpace happy path', async () => {
    const { coordinator, store, emitAck } = makeCoordinator();
    store.state.spaces.push({ id: 'a', name: 'A', color: 'gray', icon: 'star' });
    // Seed a second Space so the at-least-one-Space invariant doesn't refuse.
    store.state.spaces.push({ id: 'b', name: 'B', color: 'blue', icon: 'star' });
    coordinator.enqueue(sidebar({ kind: 'deleteSpace', payload: { spaceId: 'a' } }, 'sess:1'));
    await coordinator.idle();
    expect(store.state.trash.a).toBeDefined();
    expect(emitAck.mock.calls[0]?.[0]).toEqual({
      type: 'lunma/command-ack',
      id: 'sess:1',
      result: 'ok',
    });
  });

  test('deleteSpace unknown spaceId throws', async () => {
    const { coordinator, emitAck } = makeCoordinator();
    coordinator.enqueue(sidebar({ kind: 'deleteSpace', payload: { spaceId: 'nope' } }, 'sess:1'));
    await coordinator.idle();
    expect(emitAck.mock.calls[0]?.[0]).toMatchObject({
      id: 'sess:1',
      result: { error: expect.stringContaining("unknown spaceId 'nope'") },
    });
  });

  test('restoreSpaceFromTrash happy + unknown', async () => {
    const { coordinator, store, emitAck } = makeCoordinator();
    store.state.trash.a = {
      id: 'a',
      name: 'A',
      color: 'gray',
      icon: 'star',
      deletedAt: '2020-01-01T00:00:00Z',
    };
    coordinator.enqueue(
      sidebar({ kind: 'restoreSpaceFromTrash', payload: { spaceId: 'a' } }, 'sess:1'),
    );
    coordinator.enqueue(
      sidebar({ kind: 'restoreSpaceFromTrash', payload: { spaceId: 'nope' } }, 'sess:2'),
    );
    await coordinator.idle();
    expect(store.state.spaces.find((s) => s.id === 'a')).toBeDefined();
    expect(emitAck.mock.calls[0]?.[0]).toMatchObject({ id: 'sess:1', result: 'ok' });
    expect(emitAck.mock.calls[1]?.[0]).toMatchObject({
      id: 'sess:2',
      result: { error: expect.stringContaining("unknown spaceId 'nope'") },
    });
  });

  test('default emitAck (chrome.runtime.sendMessage path)', async () => {
    const stub = installBookmarksChromeStub();
    stub.runtime = { sendMessage: vi.fn(() => Promise.resolve()) };
    (globalThis as unknown as { chrome: typeof stub }).chrome = stub;
    const store = new LunmaStore({ idFactory: () => 'sX' });
    const persist = vi.fn();
    const broadcast = vi.fn();
    // No emitAck override → exercises defaultEmitAck.
    const c = new Coordinator({ store, persist, broadcast });
    c.enqueue(
      sidebar(
        { kind: 'createSpace', payload: { name: 'A', color: 'gray', icon: 'star', windowId: 1 } },
        'sess:1',
      ),
    );
    await c.idle();
    expect(stub.runtime?.sendMessage).toHaveBeenCalled();
    const calls = (stub.runtime?.sendMessage.mock.calls ?? []).map((c) => c[0]);
    expect(
      calls.some(
        (m: unknown) =>
          (m as { type?: string }).type === 'lunma/command-ack' &&
          (m as { id?: string }).id === 'sess:1',
      ),
    ).toBe(true);
  });

  test('default emitAck swallows "Receiving end does not exist"', async () => {
    const stub = installBookmarksChromeStub();
    stub.runtime = {
      sendMessage: vi.fn(() => Promise.reject(new Error('Receiving end does not exist'))),
    };
    (globalThis as unknown as { chrome: typeof stub }).chrome = stub;
    const store = new LunmaStore({ idFactory: () => 'sY' });
    const c = new Coordinator({ store, persist: vi.fn(), broadcast: vi.fn() });
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    c.enqueue(
      sidebar(
        { kind: 'createSpace', payload: { name: 'A', color: 'gray', icon: 'star', windowId: 1 } },
        'sess:1',
      ),
    );
    await c.idle();
    // The "Receiving end" error is logged at debug, not error. So error-spy
    // should NOT include ACK_EMIT_FAILED for this case.
    expect(
      errSpy.mock.calls.some((c) => typeof c[0] === 'string' && c[0].includes('ACK_EMIT_FAILED')),
    ).toBe(false);
    errSpy.mockRestore();
  });

  test('default emitAck logs ACK_EMIT_FAILED on non-"Receiving end" rejection', async () => {
    const stub = installBookmarksChromeStub();
    stub.runtime = {
      sendMessage: vi.fn(() => Promise.reject(new Error('boom'))),
    };
    (globalThis as unknown as { chrome: typeof stub }).chrome = stub;
    const store = new LunmaStore({ idFactory: () => 'sZ' });
    const c = new Coordinator({ store, persist: vi.fn(), broadcast: vi.fn() });
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    c.enqueue(
      sidebar(
        { kind: 'createSpace', payload: { name: 'A', color: 'gray', icon: 'star', windowId: 1 } },
        'sess:1',
      ),
    );
    await c.idle();
    // Wait one more microtask round for the rejection to flush.
    await Promise.resolve();
    await Promise.resolve();
    const acked = errSpy.mock.calls.some(
      (c) => typeof c[0] === 'string' && c[0].includes('ACK_EMIT_FAILED'),
    );
    expect(acked).toBe(true);
    errSpy.mockRestore();
  });

  test('activateSpace happy + unknown', async () => {
    const { coordinator, store, emitAck } = makeCoordinator();
    store.state.spaces.push({ id: 'a', name: 'A', color: 'gray', icon: 'star' });
    coordinator.enqueue(
      sidebar({ kind: 'activateSpace', payload: { windowId: 100, spaceId: 'a' } }, 'sess:1'),
    );
    coordinator.enqueue(
      sidebar({ kind: 'activateSpace', payload: { windowId: 101, spaceId: 'nope' } }, 'sess:2'),
    );
    await coordinator.idle();
    expect(store.state.activeSpaceByWindow[100]).toBe('a');
    expect(emitAck.mock.calls[0]?.[0]).toMatchObject({ id: 'sess:1', result: 'ok' });
    expect(emitAck.mock.calls[1]?.[0]).toMatchObject({
      id: 'sess:2',
      result: { error: expect.stringContaining("unknown spaceId 'nope'") },
    });
  });
});
