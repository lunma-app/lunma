/**
 * Pure helpers for the Space-name uniqueness invariant (unique-space-names,
 * spec `spaces-and-tabs` "Space names are unique"). A Space's name is the only
 * restart-durable key the boot-adoption fallback (`group.title === space.name`)
 * has, so two Spaces sharing a name silently collapse into one Chrome group
 * after a restart. These helpers make the name a genuine unique key.
 *
 * Both functions are pure and synchronous — they are shared by the store
 * (interactive enforcement), the boot conversion / restore paths, and the
 * V5 → V6 migration, all of which must stay chrome-free.
 */

import type { SpaceId } from './types';

/**
 * The normalized comparison form of a Space name: trimmed and case-folded.
 * Only the *comparison* is normalized — the Space record keeps the user's
 * chosen casing and surrounding form. "Work", "work", and " work " all
 * normalize to "work", so they are treated as the same name.
 */
export function normalizeSpaceName(name: string): string {
  return name.trim().toLocaleLowerCase();
}

/**
 * Return a name guaranteed not to collide (under {@link normalizeSpaceName})
 * with any name in `takenNormalized` — a set of *already-normalized* names.
 * Returns `desired` unchanged when its normalized form is free; otherwise
 * appends the lowest free numeric suffix starting at 2 (`"Work"` → `"Work 2"`,
 * → `"Work 3"`, …). Pure: never throws, never mutates its arguments.
 *
 * Idempotent against its own output — re-running with `"Work 2"` against a set
 * already holding `"work"` returns `"Work 2"` when that form is free.
 */
export function disambiguateSpaceName(desired: string, takenNormalized: Set<string>): string {
  if (!takenNormalized.has(normalizeSpaceName(desired))) return desired;
  for (let suffix = 2; ; suffix += 1) {
    const candidate = `${desired} ${suffix}`;
    if (!takenNormalized.has(normalizeSpaceName(candidate))) return candidate;
  }
}

/**
 * Partition `spaces` into normalized-name collision groups, in first-seen
 * order. Each returned group holds the ids of every Space sharing a
 * normalized name, in `spaces` array order; a name held by only one Space is
 * omitted entirely (every returned group has length ≥ 2). Pure, synchronous —
 * shared by the load-path self-heal (`dedupePersistedState`) and the boot-time
 * duplicate cleanup, so both resolve the same grouping.
 */
export function groupDuplicateSpaceNames<T extends { id: SpaceId; name: string }>(
  spaces: T[],
): SpaceId[][] {
  const idsByName = new Map<string, SpaceId[]>();
  for (const space of spaces) {
    const key = normalizeSpaceName(space.name);
    const ids = idsByName.get(key);
    if (ids) ids.push(space.id);
    else idsByName.set(key, [space.id]);
  }
  return [...idsByName.values()].filter((ids) => ids.length >= 2);
}
