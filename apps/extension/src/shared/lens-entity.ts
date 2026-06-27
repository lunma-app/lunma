import type {
  LensItem,
  LensKind,
  LensProvider,
  LensSourceRef,
  SourceAccount,
  SourceId,
} from './types';

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
 * A lens row's canonical entity (design D5 + lens-overview) — the archetype its
 * items render as, independent of the persisted `lensKind`. The four entities,
 * realising `docs/lenses-vision.md`'s `Change`/`Ticket`/`Article` set plus the
 * untyped fallback:
 *   - `change` — a `github`/`gitlab` PR/MR (the `Change` entity);
 *   - `ticket` — a Jira issue OR a github/gitlab issue (the `Ticket` entity; the
 *     overview section titles it "Issues", but the code literal is `ticket` to
 *     match the `LensItem.ticket: TicketData` bag and `EntityRef.kind: 'ticket'`);
 *   - `article` — an `rss` item;
 *   - `generic` — anything with no populated typed bag (the untyped fallback).
 * Entity is NEVER persisted; it is derived at render time, so widening it needs
 * no migration.
 */
export type LensEntity = 'change' | 'ticket' | 'article' | 'generic';

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
