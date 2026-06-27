import { entityForItem } from './lens-entity';
import type { LensEntity, LensFilter, LensItem } from './types';

export type LensRow = { item: LensItem; host: string };

/**
 * Pure predicate for lens-view-filters (D3). Operates on `{ item, host }` rows
 * so repo facets stay host-scoped (the same `owner/repo` slug on two hosts
 * filters independently). An item passes iff BOTH axes pass:
 *
 * - **type:** `entities` empty OR `entityForItem(item) ∈ entities`
 * - **scope:** Changes pass iff `repos` empty OR
 *   `` `${host}/${change.repo}` ∈ repos ``; Tickets pass iff `projects` empty
 *   OR `ticket.project ∈ projects` (a project-less ticket fails a non-empty
 *   `projects` filter — it matches no selected project); Articles and Other
 *   items always pass the scope axis.
 *
 * When every axis is empty, returns the input unchanged (identity).
 */
export function applyLensFilter(rows: LensRow[], filter: LensFilter): LensRow[] {
  const { entities, repos, projects } = filter;
  const hasEntities = (entities?.length ?? 0) > 0;
  const hasRepos = (repos?.length ?? 0) > 0;
  const hasProjects = (projects?.length ?? 0) > 0;
  if (!hasEntities && !hasRepos && !hasProjects) return rows;

  const entitySet = hasEntities ? new Set(entities) : null;
  const repoSet = hasRepos ? new Set(repos) : null;
  const projectSet = hasProjects ? new Set(projects) : null;

  return rows.filter(({ item, host }) => {
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
    }
    // Articles and Other always pass the scope axis.

    return true;
  });
}

/**
 * Derive the set of available facet values from the current rows. Returns:
 * - `entities`: the distinct entity types present (in canonical order)
 * - `repos`: host-qualified keys (`${host}/${change.repo}`) for Change rows
 * - `projects`: distinct `ticket.project` values; `undefined` projects are
 *   dropped so the array never contains a hole
 */
export function deriveLensFacets(rows: LensRow[]): {
  entities: LensEntity[];
  repos: string[];
  projects: string[];
} {
  const entitySet = new Set<LensEntity>();
  const repoSet = new Set<string>();
  const projectSet = new Set<string>();

  for (const { item, host } of rows) {
    const entity: LensEntity = entityForItem(item);
    entitySet.add(entity);

    if (entity === 'change' && item.change?.repo) {
      repoSet.add(`${host}/${item.change.repo}`);
    } else if (entity === 'ticket' && item.ticket?.project) {
      projectSet.add(item.ticket.project);
    }
  }

  // Emit entities in canonical order: change → ticket → article → generic.
  const ENTITY_ORDER: LensEntity[] = ['change', 'ticket', 'article', 'generic'];
  const entities = ENTITY_ORDER.filter((e) => entitySet.has(e));

  return {
    entities,
    repos: [...repoSet],
    projects: [...projectSet],
  };
}
