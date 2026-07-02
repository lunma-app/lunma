import { entityForItem } from './lens-entity';
import type { LensEntity, LensFilter, LensItem } from './types';

export type LensRow = { item: LensItem; host: string; feedName?: string };

/**
 * Pure predicate for lens-view-filters (D3). Operates on `{ item, host }` rows
 * so repo facets stay host-scoped (the same `owner/repo` slug on two hosts
 * filters independently). An item passes iff BOTH axes pass:
 *
 * - **type:** `entities` absent OR `entityForItem(item) ∈ entities` (an
 *   explicit `entities: []` excludes every item)
 * - **scope:** Changes pass iff `repos` absent OR
 *   `` `${host}/${change.repo}` ∈ repos ``; Tickets pass iff `projects`
 *   absent OR `ticket.project ∈ projects` (a project-less ticket fails any
 *   non-absent `projects` filter, including an explicit `[]`); Articles pass
 *   iff `feeds` absent OR `row.feedName ∈ feeds`; Other items always pass.
 *
 * An axis that is `undefined` (key absent) imposes no constraint. An axis
 * present as an explicit `[]` excludes every row on that axis — it is a real
 * constraint (the empty set), not a synonym for "no constraint". When every
 * axis is absent, returns the input unchanged (identity).
 */
export function applyLensFilter(rows: LensRow[], filter: LensFilter): LensRow[] {
  const { entities, repos, projects, feeds } = filter;
  const hasEntities = entities !== undefined;
  const hasRepos = repos !== undefined;
  const hasProjects = projects !== undefined;
  const hasFeeds = feeds !== undefined;
  if (!hasEntities && !hasRepos && !hasProjects && !hasFeeds) return rows;

  const entitySet = hasEntities ? new Set(entities) : null;
  const repoSet = hasRepos ? new Set(repos) : null;
  const projectSet = hasProjects ? new Set(projects) : null;
  const feedSet = hasFeeds ? new Set(feeds) : null;

  return rows.filter(({ item, host, feedName }) => {
    const entity: LensEntity = entityForItem(item);

    // Type axis.
    if (entitySet && !entitySet.has(entity)) return false;

    // Scope axis — per-entity rules.
    if (entity === 'change') {
      if (repoSet) {
        const repo = item.change?.repo;
        if (repo === undefined) return false;
        if (!repoSet.has(`${host}/${repo}`)) return false;
      }
    } else if (entity === 'ticket') {
      if (projectSet) {
        const project = item.ticket?.project;
        if (project === undefined) return false;
        if (!projectSet.has(project)) return false;
      }
    } else if (entity === 'article') {
      if (feedSet && !feedSet.has(feedName ?? '')) return false;
    }
    // Other items always pass the scope axis.

    return true;
  });
}

/**
 * Derive the set of available facet values from the current rows. Returns:
 * - `entities`: the distinct entity types present (in canonical order)
 * - `repos`: host-qualified keys (`${host}/${change.repo}`) for Change rows
 * - `projects`: distinct `ticket.project` values; `undefined` projects are
 *   dropped so the array never contains a hole
 * - `feeds`: distinct `feedName` values for Article rows
 */
export function deriveLensFacets(rows: LensRow[]): {
  entities: LensEntity[];
  repos: string[];
  projects: string[];
  feeds: string[];
} {
  const entitySet = new Set<LensEntity>();
  const repoSet = new Set<string>();
  const projectSet = new Set<string>();
  const feedSet = new Set<string>();

  for (const { item, host, feedName } of rows) {
    const entity: LensEntity = entityForItem(item);
    entitySet.add(entity);

    if (entity === 'change' && item.change?.repo) {
      repoSet.add(`${host}/${item.change.repo}`);
    } else if (entity === 'ticket' && item.ticket?.project) {
      projectSet.add(item.ticket.project);
    } else if (entity === 'article' && feedName) {
      feedSet.add(feedName);
    }
  }

  // Emit entities in canonical order: change → ticket → article → generic.
  const ENTITY_ORDER: LensEntity[] = ['change', 'ticket', 'article', 'generic'];
  const entities = ENTITY_ORDER.filter((e) => entitySet.has(e));

  return {
    entities,
    repos: [...repoSet],
    projects: [...projectSet],
    feeds: [...feedSet],
  };
}
