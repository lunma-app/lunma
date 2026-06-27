import type {
  LensEntity,
  LensItem,
  LensKind,
  LensProvider,
  LensSourceRef,
  SourceAccount,
  SourceId,
} from './types';

// `LensEntity` now lives in `shared/types.ts` (moved to break the
// `types → lens-entity → types` cycle). Re-exported here so existing
// `import … from '../shared/lens-entity'` sites are unchanged.
export type { LensEntity };

/**
 * Lens taxonomy derivation (sources-redesign, design D4/D5). Two pure
 * provider→semantics mappings shared across surfaces:
 *
 *   - `entityForSource` — the **canonical entity** a source renders as on the
 *     overview page (`launcher`) and the editor's derived preview (`sidebar`);
 *   - `deriveLensKind` — the **persisted kind** the SW stamps on a lens from its
 *     source set (`background` create/update + the one-time boot re-derivation).
 *
 * It lives in `shared/` (a sibling of `connector-origins.ts`) so both surfaces
 * and the SW import it without crossing the one-way import DAG — entity is a
 * render-time concern the launcher needs, kind is a SW concern, and neither may
 * import the other's layer.
 */

/**
 * The PRIMARY entity of a source provider — the source-level hint for the
 * editor's derived preview and the connections badge. NOT the overview router
 * (that is {@link entityForItem}, which routes per item so one `github` source
 * emits both Change and Ticket rows). `jira` is `ticket` (its issues are the
 * Ticket entity).
 */
export function entityForSource(provider: LensProvider): LensEntity {
  if (provider === 'github' || provider === 'gitlab') return 'change';
  if (provider === 'rss') return 'article';
  if (provider === 'jira') return 'ticket';
  return 'generic';
}

/**
 * Every entity a source provider MAY emit (for the editor's derived preview —
 * "reads Changes + Issues"). A `github`/`gitlab` source emits both `change`
 * (PRs/MRs) and `ticket` (issues); `jira` emits `ticket`; `rss` emits `article`.
 */
export function entitiesForSource(provider: LensProvider): LensEntity[] {
  if (provider === 'github' || provider === 'gitlab') return ['change', 'ticket'];
  if (provider === 'rss') return ['article'];
  if (provider === 'jira') return ['ticket'];
  return ['generic'];
}

/**
 * The OVERVIEW ROUTER — a single resolved row's entity, derived from which typed
 * bag the connector populated (NOT from the source provider). This lets one
 * `github` section yield both Change rows (PRs, `change` bag) and Ticket rows
 * (issues, `ticket` bag). Precedence is fixed for a (malformed) multi-bag item:
 * `change` > `ticket` > `article` > `generic`. The `article` test keys on the
 * flat RSS field cluster (`docs/lenses-vision.md` keeps those flat until the
 * Reading-lens phase folds them into a bag).
 */
export function entityForItem(item: LensItem): LensEntity {
  if (item.change) return 'change';
  if (item.ticket) return 'ticket';
  if (item.publishedAt !== undefined || item.excerpt !== undefined || item.categories !== undefined)
    return 'article';
  return 'generic';
}

/**
 * Derive a lens's persisted `LensKind` from its source set (design D4): **any**
 * `github`/`gitlab` source ⇒ `'review'` (so `resolvedConfigs` stamps the kind
 * and the git connectors run Change enrichment on those sections); otherwise
 * `'general'`. A lens may freely mix providers — a derived-`'review'` lens may
 * also carry `rss` feeds and `jira` accounts (they render Articles / Generic and
 * never carry the `change` bag). A dangling reference (its account was
 * disconnected) resolves to `undefined` and contributes nothing.
 *
 * `getAccount` resolves a `sourceId` to its account, so the same helper serves
 * the SW handler (passing `(id) => state.sources[id]`) and the boot pass.
 */
export function deriveLensKind(
  sources: LensSourceRef[],
  getAccount: (sourceId: SourceId) => SourceAccount | undefined,
): LensKind {
  const hasGit = sources.some((ref) => {
    const provider = getAccount(ref.sourceId)?.provider;
    return provider === 'github' || provider === 'gitlab';
  });
  return hasGit ? 'review' : 'general';
}
