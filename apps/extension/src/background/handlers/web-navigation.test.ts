import { describe, expect, test } from 'vitest';
import { makeStore, seedSpace } from '../../shared/store.test-helpers';
import type { HandlerContext } from './context';
import { webNavigationHandlers } from './web-navigation';

const handler = webNavigationHandlers()['webNavigation.onCommitted'];

function ctxFor(store: ReturnType<typeof makeStore>, enabled = true) {
  let dirty = false;
  return {
    ctx: {
      store,
      markDirty: () => {
        dirty = true;
      },
      provenanceEnabled: () => enabled,
    } as unknown as HandlerContext,
    dirty: () => dirty,
  };
}

function commit(tabId: number, transitionType: string) {
  return {
    source: 'chrome' as const,
    kind: 'webNavigation.onCommitted' as const,
    payload: { tabId, frameId: 0, url: 'https://x/', transitionType, transitionQualifiers: [] },
  };
}

function seedTabs(store: ReturnType<typeof makeStore>) {
  seedSpace(store);
  store.state.liveTabsById[1] = {
    tabId: 1,
    windowId: 100,
    title: 'parent',
    url: 'https://p/',
    active: false,
    status: 'complete',
    provenanceToken: 'TP',
  };
  store.state.liveTabsById[2] = {
    tabId: 2,
    windowId: 100,
    title: 'child',
    url: 'https://c/',
    active: true,
    status: 'complete',
    provenanceToken: 'TC',
    openerTabId: 1,
  };
}

describe('webNavigation.onCommitted handler', () => {
  test('a link commit with a tokenised opener records the edge', () => {
    const store = makeStore();
    seedTabs(store);
    const { ctx } = ctxFor(store);
    handler(ctx, commit(2, 'link'));
    expect(store.state.provenanceByToken.TC?.parentToken).toBe('TP');
  });

  test('an external handoff is a ROOT despite a live opener', () => {
    const store = makeStore();
    seedTabs(store);
    const { ctx } = ctxFor(store);
    handler(ctx, commit(2, 'start_page'));
    expect(store.state.provenanceByToken.TC).toBeUndefined();
    expect(store.state.liveTabsById[2]?.provenanceParentTabId).toBeUndefined();
  });

  test('an untokenised opener yields no edge', () => {
    const store = makeStore();
    seedTabs(store);
    delete store.state.liveTabsById[1]?.provenanceToken;
    const { ctx } = ctxFor(store);
    handler(ctx, commit(2, 'link'));
    expect(store.state.provenanceByToken.TC).toBeUndefined();
  });

  test('records nothing when the effective state is off', () => {
    const store = makeStore();
    seedTabs(store);
    const { ctx } = ctxFor(store, false);
    handler(ctx, commit(2, 'link'));
    expect(store.state.provenanceByToken).toEqual({});
  });

  test('ignores a subframe commit', () => {
    const store = makeStore();
    seedTabs(store);
    const { ctx } = ctxFor(store);
    handler(ctx, {
      source: 'chrome',
      kind: 'webNavigation.onCommitted',
      payload: {
        tabId: 2,
        frameId: 7,
        url: 'https://x/',
        transitionType: 'link',
        transitionQualifiers: [],
      },
    });
    expect(store.state.provenanceByToken).toEqual({});
  });

  test('a tab is never its own parent', () => {
    const store = makeStore();
    seedTabs(store);
    store.state.liveTabsById[2]!.openerTabId = 2;
    const { ctx } = ctxFor(store);
    handler(ctx, commit(2, 'link'));
    expect(store.state.provenanceByToken.TC).toBeUndefined();
  });
});
