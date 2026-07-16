// ensureGroupForSpace's stale-reference reconciliation: the `liveTabsById`
// mirror trails Chrome, so callers hand us tab ids Chrome has already closed.
// `chrome.tabs.group` validates the whole batch, so one dead id would otherwise
// fail the grouping of every live sibling alongside it.

import { beforeEach, describe, expect, test } from 'vitest';
import { log } from '../shared/logger';
import { ensureGroupForSpace } from './tab-groups';
import { installTabGroupsChrome, type TabGroupsController } from './tab-groups.test-helpers';

let chrome: TabGroupsController;
beforeEach(() => {
  chrome = installTabGroupsChrome();
});

describe('ensureGroupForSpace — stale tab ids', () => {
  test('a dead tab id does not poison the batch: the live siblings still group', async () => {
    chrome.addTab({ id: 11, windowId: 100 });
    chrome.addTab({ id: 12, windowId: 100 });
    // 99 was closed by the user; the store mirror has not caught up yet.

    const groupId = await ensureGroupForSpace(100, [99, 11, 12]);

    expect(groupId).not.toBeNull();
    expect(chrome.tabs.get(11)?.groupId).toBe(groupId);
    expect(chrome.tabs.get(12)?.groupId).toBe(groupId);
  });

  test('a dead tab id is dropped when adding to an existing live group', async () => {
    chrome.addGroup({ id: 5, windowId: 100 });
    chrome.addTab({ id: 11, windowId: 100, groupId: 5 });
    chrome.addTab({ id: 12, windowId: 100 });

    const groupId = await ensureGroupForSpace(100, [99, 12], 5);

    expect(groupId).toBe(5);
    expect(chrome.tabs.get(12)?.groupId).toBe(5);
  });

  test('every tab id dead → no group call, no error log', async () => {
    const errors: unknown[] = [];
    const origError = log.error;
    log.error = (...args: unknown[]) => {
      errors.push(args);
    };
    try {
      const groupId = await ensureGroupForSpace(100, [98, 99]);
      expect(groupId).toBeNull();
      expect(chrome.calls.some((c) => c.startsWith('tabs.group'))).toBe(false);
      expect(errors).toEqual([]);
    } finally {
      log.error = origError;
    }
  });

  test('every tab id dead, existing group passed → the group id passes through', async () => {
    chrome.addGroup({ id: 5, windowId: 100 });
    const groupId = await ensureGroupForSpace(100, [99], 5);
    expect(groupId).toBe(5);
  });

  test('a tab live in ANOTHER window is dropped, not grouped into this one', async () => {
    chrome.addTab({ id: 11, windowId: 100 });
    chrome.addTab({ id: 21, windowId: 200 });

    const groupId = await ensureGroupForSpace(100, [11, 21]);

    expect(chrome.tabs.get(11)?.groupId).toBe(groupId);
    expect(chrome.tabs.get(21)?.groupId).toBe(-1);
  });
});

describe('ensureGroupForSpace — stale group id', () => {
  test('a dissolved target group returns null (the caller rebuilds) without an error log', async () => {
    // D4: `null` is the caller's "rebuild from the Space's full tab set" signal —
    // ensureGroupForSpace must NOT self-heal into a lone-tab group here.
    chrome.addTab({ id: 11, windowId: 100 });
    const errors: unknown[] = [];
    const origError = log.error;
    log.error = (...args: unknown[]) => {
      errors.push(args);
    };
    try {
      // Group 5 was dissolved by a restart; the store still persists its id.
      expect(await ensureGroupForSpace(100, [11], 5)).toBeNull();
      expect(errors).toEqual([]);
    } finally {
      log.error = origError;
    }
  });
});
