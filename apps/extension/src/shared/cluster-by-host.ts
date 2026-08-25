import { hostOf } from './label-for';
import type { TabId } from './types';

/**
 * Reorder `orderedIds` so ids sharing a URL hostname are contiguous.
 *
 * Stable in both axes — clusters follow the order their host is first seen, and
 * each cluster keeps its members' relative order — which is what makes the
 * operation idempotent, and lets a caller detect a no-op by comparing the result
 * against the input.
 *
 * An id whose URL is missing or carries no parseable hostname keys to `''` and
 * clusters with its peers like any other host, rather than being dropped or
 * pinned to an edge.
 */
export function clusterIdsByHost(
  orderedIds: readonly TabId[],
  urlOf: (id: TabId) => string | undefined,
): TabId[] {
  const clusters = new Map<string, TabId[]>();
  for (const id of orderedIds) {
    const host = hostOf(urlOf(id) ?? '');
    const cluster = clusters.get(host);
    if (cluster) cluster.push(id);
    else clusters.set(host, [id]);
  }
  // Map preserves insertion order, so iterating it yields first-appearance order.
  return [...clusters.values()].flat();
}
