import { beforeEach, describe, expect, test, vi } from 'vitest';
import { SidebarCommandSchema } from '../shared/bus';
import type { BackupEnvelope } from '../shared/types';
import { makeCoordinator, sidebar } from './coordinator.test-helpers';

function makeValidEnvelope(): BackupEnvelope {
  return {
    formatVersion: 1,
    schemaVersion: 5,
    exportedAt: 1000,
    state: {
      schemaVersion: 5,
      spaces: [{ id: 'sp-restore', name: 'Restored', color: 'blue', icon: 'star' }],
      savedTabs: {},
      pinnedBySpace: {},
      faviconRow: ['sp-restore'],
      archivedTabs: [],
      trash: {},
      lastActivatedSpaceId: 'sp-restore',
    },
  };
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('importState coordinator command', () => {
  test('a valid backup replaces state, triggers one persist, one broadcast, and acks ok', async () => {
    const { coordinator, store, persist, broadcast, emitAck } = makeCoordinator();
    const envelope = makeValidEnvelope();

    coordinator.enqueue(sidebar({ kind: 'importState', payload: { backup: envelope } }, 'ack:1'));
    await coordinator.idle();

    expect(store.state.spaces).toHaveLength(1);
    expect(store.state.spaces[0]).toMatchObject({ id: 'sp-restore', name: 'Restored' });
    expect(store.state.faviconRow).toEqual(['sp-restore']);
    expect(store.state.lastActivatedSpaceId).toBe('sp-restore');
    expect(persist).toHaveBeenCalledTimes(1);
    expect(broadcast).toHaveBeenCalledTimes(1);
    expect(emitAck).toHaveBeenCalledWith({ type: 'lunma/command-ack', id: 'ack:1', result: 'ok' });
  });

  test('SidebarCommandSchema rejects a malformed importState payload (handler never runs)', () => {
    // The bus parses every incoming command with SidebarCommandSchema before
    // enqueuing it. A missing or structurally-wrong backup field must be
    // rejected here so the coordinator handler never runs.
    const bad = SidebarCommandSchema.safeParse({
      kind: 'importState',
      payload: { backup: 'not-an-object' },
    });
    expect(bad.success).toBe(false);

    const alsoMissing = SidebarCommandSchema.safeParse({
      kind: 'importState',
      payload: {},
    });
    expect(alsoMissing.success).toBe(false);
  });

  test('an un-migratable backup throws, emits an error ack, and leaves state unchanged', async () => {
    const { coordinator, store, persist, broadcast, emitAck } = makeCoordinator();
    store.state.spaces.push({ id: 'orig', name: 'Original', color: 'gray', icon: 'star' });

    // Inject raw garbage directly — bypasses the SidebarCommandSchema bus boundary so
    // we can verify the coordinator handler itself guards the mutation correctly.
    const garbage = { not: 'a backup' } as unknown as BackupEnvelope;

    coordinator.enqueue(sidebar({ kind: 'importState', payload: { backup: garbage } }, 'ack:2'));
    await coordinator.idle();

    // State is untouched — the handler threw before replaceState.
    expect(store.state.spaces).toHaveLength(1);
    expect(store.state.spaces[0]?.id).toBe('orig');
    expect(persist).not.toHaveBeenCalled();
    expect(broadcast).not.toHaveBeenCalled();
    expect(emitAck).toHaveBeenCalledWith({
      type: 'lunma/command-ack',
      id: 'ack:2',
      result: { error: expect.stringContaining('importState') },
    });
  });
});
