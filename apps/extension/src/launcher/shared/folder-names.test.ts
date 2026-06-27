import { describe, expect, test } from 'vitest';
import type { PinNode } from '../../shared/types';
import { buildFolderNameIndex } from './folder-names';

const folder = (id: string, name: string, children: string[]): PinNode => ({
  kind: 'folder',
  id,
  name,
  icon: 'folder',
  color: 'blue',
  children,
});

const lens = (id: string, name: string): PinNode => ({
  kind: 'lens',
  lensKind: 'general',
  id,
  name,
  icon: 'git-pull-request',
  sources: [{ sourceId: 'acc-gh', queries: ['authored'] }],
  maxItems: 20,
  hideRead: false,
  refreshMinutes: 10,
});

const tab = (id: string): PinNode => ({ kind: 'tab', id });

describe('buildFolderNameIndex', () => {
  test('maps a saved tab in a folder to the folder name', () => {
    const idx = buildFolderNameIndex({
      work: [folder('f1', 'Work', ['t1', 't2'])],
    });
    expect(idx.savedTabFolder).toEqual({ t1: 'Work', t2: 'Work' });
  });

  test('a top-level (unfoldered) saved tab has no entry', () => {
    const idx = buildFolderNameIndex({
      work: [tab('loose'), folder('f1', 'Work', ['t1'])],
    });
    expect(idx.savedTabFolder).toEqual({ t1: 'Work' });
    expect(idx.savedTabFolder.loose).toBeUndefined();
  });

  test('a favicon-row saved tab has no entry (favicon row is not in pinnedBySpace)', () => {
    // The favicon row lives in the flat `faviconRow` array, never in
    // `pinnedBySpace`, so the index never sees it.
    const idx = buildFolderNameIndex({ work: [folder('f1', 'Work', ['t1'])] });
    expect(idx.savedTabFolder.fav).toBeUndefined();
  });

  test('maps a lens node id to its name', () => {
    const idx = buildFolderNameIndex({
      work: [lens('sf-1', 'Work PRs')],
    });
    expect(idx.lens).toEqual({ 'sf-1': 'Work PRs' });
    expect(idx.lensSpace).toEqual({ 'sf-1': 'work' });
    expect(idx.savedTabFolder).toEqual({});
  });

  test('scans across every Space', () => {
    const idx = buildFolderNameIndex({
      work: [folder('f1', 'Work', ['t1'])],
      home: [folder('f2', 'Home', ['t2']), lens('sf-2', 'Reading')],
    });
    expect(idx.savedTabFolder).toEqual({ t1: 'Work', t2: 'Home' });
    expect(idx.lens).toEqual({ 'sf-2': 'Reading' });
    expect(idx.lensSpace).toEqual({ 'sf-2': 'home' });
  });

  test('empty pinned trees yield empty indexes', () => {
    expect(buildFolderNameIndex({})).toEqual({
      savedTabFolder: {},
      lens: {},
      lensSpace: {},
    });
  });
});
