// Smart-folder lifecycle + connector-result handlers (smart-folders, design
// D12/D3). The lifecycle commands mint/edit/delete the persisted config node
// and retune the poll alarm; the connector-result handler is the slice's
// single writer of the ephemeral `smartFolders` runtime. The network engine
// itself lives in `../smart-folders.ts` — fetches always run OFF the drain.

import type { FolderId, SpaceId } from '../../shared/types';
import {
  CONNECTORS,
  normalizeBaseUrl,
  REFRESH_MINUTES_FLOOR,
  type SmartFolderDeps,
  type SmartFolderNode,
  startSmartFolderRefresh,
  syncSmartFoldersAlarm,
} from '../smart-folders';
import type { HandlersMap } from './context';
import { spaceExists } from './queries';

/** Clamp a requested cadence to the floor of 5 minutes (rate-limit kindness). */
function clampRefreshMinutes(minutes: number): number {
  return Math.max(REFRESH_MINUTES_FLOOR, Math.floor(minutes));
}

/** The smart node addressed by `{ spaceId, folderId }`, with the same error
 * contract as the sibling folder commands: unknown spaceId or folderId throws
 * (the ack carries the error). */
function requireSmartNode(
  ctx: { store: SmartFolderDeps['store'] },
  command: string,
  spaceId: SpaceId,
  folderId: FolderId,
): SmartFolderNode {
  if (!spaceExists(ctx.store.state, spaceId)) {
    throw new Error(`${command}: unknown spaceId '${spaceId}'`);
  }
  const node = (ctx.store.state.pinnedBySpace[spaceId] ?? []).find(
    (n): n is SmartFolderNode => n.kind === 'smart' && n.id === folderId,
  );
  if (!node) {
    throw new Error(`${command}: unknown smart folder '${folderId}' in Space '${spaceId}'`);
  }
  return node;
}

export function smartFolderHandlers(
  deps: Pick<SmartFolderDeps, 'enqueue'>,
): Pick<
  HandlersMap,
  | 'createSmartFolder'
  | 'updateSmartFolder'
  | 'deleteSmartFolder'
  | 'refreshSmartFolder'
  | 'smartFolders.result'
> {
  return {
    createSmartFolder: (ctx, event) => {
      const { spaceId, source, name, baseUrl, query, refreshMinutes } = event.payload;
      if (!spaceExists(ctx.store.state, spaceId)) {
        throw new Error(`createSmartFolder: unknown spaceId '${spaceId}'`);
      }
      // SW-minted identity (D12): the handler mints rather than the store
      // because the immediate first fetch needs the new id, and mutators are
      // void-returning. The icon comes from the source connector's
      // `mintedIcon` (the bus boundary rejects out-of-vocabulary sources, so
      // the registry lookup is total). An invalid baseUrl throws here —
      // error ack, no node.
      const node: SmartFolderNode = {
        kind: 'smart',
        id: crypto.randomUUID(),
        name,
        icon: CONNECTORS[source].mintedIcon,
        source,
        baseUrl: normalizeBaseUrl(baseUrl),
        query,
        refreshMinutes: clampRefreshMinutes(refreshMinutes),
      };
      ctx.store.addSmartFolder(spaceId, node);
      ctx.markDirty();
      ctx.runSideEffect(() => syncSmartFoldersAlarm(ctx.store));
      // Immediate first fetch — off the drain's critical path; the outcome
      // rides the runtime slice, never this command's ack.
      const { completion } = startSmartFolderRefresh(
        { store: ctx.store, enqueue: deps.enqueue },
        node,
      );
      ctx.runSideEffect(() => completion);
    },
    updateSmartFolder: (ctx, event) => {
      const { spaceId, folderId, source, name, baseUrl, query, refreshMinutes } = event.payload;
      const node = requireSmartNode(ctx, 'updateSmartFolder', spaceId, folderId);
      const normalized = normalizeBaseUrl(baseUrl);
      // A baseUrl/query/source change invalidates the results (the store
      // mutator also nulls the runtime's fetchedAt) → immediate refetch.
      const resultsInvalidated =
        node.baseUrl !== normalized || node.query !== query || node.source !== source;
      ctx.store.updateSmartFolder(spaceId, folderId, {
        source,
        name,
        baseUrl: normalized,
        query,
        refreshMinutes: clampRefreshMinutes(refreshMinutes),
      });
      ctx.markDirty();
      ctx.runSideEffect(() => syncSmartFoldersAlarm(ctx.store));
      if (resultsInvalidated) {
        const updated = requireSmartNode(ctx, 'updateSmartFolder', spaceId, folderId);
        const { completion } = startSmartFolderRefresh(
          { store: ctx.store, enqueue: deps.enqueue },
          { ...updated },
        );
        ctx.runSideEffect(() => completion);
      }
    },
    deleteSmartFolder: (ctx, event) => {
      const { spaceId, folderId } = event.payload;
      requireSmartNode(ctx, 'deleteSmartFolder', spaceId, folderId);
      // Removes the node AND drops its runtime entry — both are store state
      // (D12). No tabs close; the config is recreatable in seconds.
      ctx.store.deleteSmartFolder(spaceId, folderId);
      ctx.markDirty();
      ctx.runSideEffect(() => syncSmartFoldersAlarm(ctx.store));
    },
    refreshSmartFolder: (ctx, event) => {
      const { spaceId, folderId } = event.payload;
      const node = requireSmartNode(ctx, 'refreshSmartFolder', spaceId, folderId);
      // Unconditional refresh. The handler returns synchronously once the
      // fetch is underway, so the ack is 'ok' BEFORE the fetch resolves; the
      // outcome lands via the runtime slice on a later drain (D12).
      const { completion } = startSmartFolderRefresh(
        { store: ctx.store, enqueue: deps.enqueue },
        { ...node },
      );
      ctx.runSideEffect(() => completion);
    },
    'smartFolders.result': (ctx, event) => {
      const { folderId, runtime } = event.payload;
      // A result landing after its folder was deleted is dropped — writing it
      // would resurrect an orphan runtime entry the delete already cleaned up.
      const stillExists = Object.values(ctx.store.state.pinnedBySpace).some((nodes) =>
        nodes.some((n) => n.kind === 'smart' && n.id === folderId),
      );
      if (!stillExists) return;
      ctx.store.setSmartFolderRuntime(folderId, runtime);
      ctx.markDirty();
    },
  };
}
