/**
 * Pure view-model + data helpers for the Lens Overview (lens-overview redesign).
 *
 * The overview is **derived**, never stored: it flattens the active lens's
 * resolved sections into a tagged item list and buckets each item by
 * `entityForItem` (its populated typed bag — so one github section yields both
 * Change and Ticket rows). Every render concern the comp expresses as a helper
 * — the synthesized Change verdict, priority/status pills, the CI glyph, the
 * linked-ticket chip, relative time — lives here as a pure function so the
 * Svelte components stay declarative and these stay unit-testable.
 */
import { entityForItem, type LensEntity } from '../../shared/lens-entity';
import type {
  AppState,
  ChangeData,
  LensItem,
  LensProvider,
  LensQuery,
  PinNode,
  ResolvedLensSource,
  TicketData,
} from '../../shared/types';

type Priority = NonNullable<TicketData['priority']>;

export type LensNode = Extract<PinNode, { kind: 'lens' }>;

/** One resolved overview row: the item, the section config it came from, and the
 * section key (for read-state / activation / open dispatch). */
export interface Tagged {
  item: LensItem;
  cfg: ResolvedLensSource;
  sk: string;
}

export function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

/** Per-section identity — `${source}:${host}:${query}` (queue) / `${source}:${host}` (rss). */
export function sourceKey(cfg: ResolvedLensSource): string {
  const base = `${cfg.source}:${hostOf(cfg.baseUrl)}`;
  return cfg.query !== undefined ? `${base}:${cfg.query}` : base;
}

/** Expand a lens node's account refs into per-section configs (over each ref's
 * `queries`), skipping dangling refs (their account was disconnected). */
export function resolveRefs(node: LensNode, accounts: AppState['sources']): ResolvedLensSource[] {
  const out: ResolvedLensSource[] = [];
  for (const ref of node.sources) {
    const account = accounts[ref.sourceId];
    if (!account) continue;
    const base = {
      source: account.provider,
      baseUrl: account.baseUrl,
      name: account.name,
      sourceId: account.id,
      lensKind: node.lensKind,
    };
    if (ref.queries.length === 0) out.push({ ...base });
    else for (const query of ref.queries) out.push({ ...base, query });
  }
  return out;
}

/** Flatten every section's items into the tagged list (overview source). A section
 * being re-fetched flips to `'pending'` with its items CLEARED; to avoid the
 * overview blanking + flickering (and a click missing) on every refresh, `held`
 * supplies the last-known items per section — maintained by the caller, mirroring
 * the sidebar's `heldItemsBySection` — and is used whenever the live section is not
 * `'ok'`. Omitting `held` keeps the old "ok-only" behaviour. */
export function collectItems(
  node: LensNode,
  appState: AppState,
  held: Record<string, LensItem[]> = {},
): Tagged[] {
  const runtime = appState.lenses[node.id];
  const out: Tagged[] = [];
  for (const cfg of resolveRefs(node, appState.sources)) {
    const sk = sourceKey(cfg);
    const rt = runtime?.sections[sk];
    const items = rt?.state === 'ok' ? rt.items : (held[sk] ?? []);
    for (const item of items) out.push({ item, cfg, sk });
  }
  return out;
}

/** Bucket tagged items by canonical entity (the overview router). */
export function bucketByEntity(tagged: Tagged[]): Record<LensEntity, Tagged[]> {
  const b: Record<LensEntity, Tagged[]> = { change: [], ticket: [], article: [], generic: [] };
  for (const t of tagged) b[entityForItem(t.item)].push(t);
  return b;
}

/** The canonical render order for entity sections (matches the comp's vertical
 * order): Changes → Issues → Reading → Other. */
export const ENTITY_ORDER: LensEntity[] = ['change', 'ticket', 'article', 'generic'];

/** Section title + fixed identity-dot hue per entity (the comp's coloured dots;
 * these are FIXED per section, independent of the active lens hue). */
export const SECTION_META: Record<LensEntity, { title: string; dotHue: number }> = {
  change: { title: 'Changes', dotHue: 252 },
  ticket: { title: 'Issues', dotHue: 295 },
  article: { title: 'Reading', dotHue: 150 },
  generic: { title: 'Other', dotHue: 0 },
};

// ── Provider monogram ─────────────────────────────────────────────────────────
const MONO: Record<LensProvider, string> = {
  github: 'GH',
  gitlab: 'GL',
  jira: 'JR',
  rss: 'RSS',
};
export function monoFor(provider: LensProvider): string {
  return MONO[provider] ?? provider.slice(0, 2).toUpperCase();
}

// ── Change verdict (synthesized from real ChangeData + status + draft) ─────────
type Ci = 'failed' | 'running' | 'passed';
function toneToCi(tone?: 'ok' | 'pending' | 'warn' | 'fail'): Ci | undefined {
  if (tone === 'fail') return 'failed';
  if (tone === 'pending') return 'running';
  if (tone === 'ok' || tone === 'warn') return 'passed';
  return undefined;
}

type ReviewState = 'changes' | 'approved';
/** Aggregate the per-reviewer verdicts into a Change-level review state. */
export function reviewState(reviewers: ChangeData['reviewers']): ReviewState | undefined {
  if (reviewers.some((r) => r.state === 'changes')) return 'changes';
  if (reviewers.length > 0 && reviewers.every((r) => r.state === 'approved')) return 'approved';
  return undefined;
}

export interface Verdict {
  label: string;
  /** Accent hue; omitted → the neutral pill (Draft). */
  hue?: number;
}
/** The single inline Changes-row verdict (the comp's priority order), derived
 * from CI tone, aggregate review state, and draft. */
export function changeVerdict(item: LensItem): Verdict {
  const ci = toneToCi(item.status?.tone);
  const rs = item.change ? reviewState(item.change.reviewers) : undefined;
  if (ci === 'failed') return { label: 'CI failing', hue: 25 };
  if (rs === 'changes') return { label: 'Changes requested', hue: 25 };
  if (rs === 'approved') return { label: 'Ready to merge', hue: 150 };
  if (ci === 'running') return { label: 'CI running', hue: 75 };
  if (item.change?.draft) return { label: 'Draft' };
  return { label: 'Awaiting review', hue: 252 };
}

/** The drill-down CI glyph (icon + hue) from the status tone; null when no CI. */
export function ciGlyph(
  tone?: 'ok' | 'pending' | 'warn' | 'fail',
): { icon: string; hue: number; label: string } | null {
  if (tone === 'ok') return { icon: 'check', hue: 150, label: 'CI passed' };
  if (tone === 'fail') return { icon: 'x', hue: 25, label: 'CI failing' };
  if (tone === 'warn') return { icon: 'circle-alert', hue: 75, label: 'CI unstable' };
  if (tone === 'pending') return { icon: 'circle', hue: 75, label: 'CI running' };
  return null;
}

/** The drill-down per-row state pill, derived from draft + aggregate review. */
export function changeState(item: LensItem): { label: string; hue?: number } {
  if (item.change?.draft) return { label: 'draft' };
  const rs = item.change ? reviewState(item.change.reviewers) : undefined;
  if (rs === 'changes') return { label: 'changes', hue: 25 };
  if (rs === 'approved') return { label: 'approved', hue: 150 };
  return { label: 'open', hue: 252 };
}

/** Change row meta — `repo · +adds −dels` (U+2212 minus); diffstat omitted when
 * the connector couldn't supply it (GitLab MRs). */
export function changeMeta(change: ChangeData): string {
  const parts = [change.repo];
  if (change.additions !== undefined || change.deletions !== undefined) {
    parts.push(`+${change.additions ?? 0} −${change.deletions ?? 0}`);
  }
  return parts.join(' · ');
}

// ── Ticket (Issues) view-model ─────────────────────────────────────────────────
const PRIORITY_HUE: Record<Priority, number> = { urgent: 25, high: 40, med: 75, low: 210 };
export function priorityHue(priority?: Priority): number | undefined {
  return priority ? PRIORITY_HUE[priority] : undefined;
}

/** Status-category → board column label + pill hue (todo neutral, in-progress
 * blue, done green) — shared by the overview status pill and the kanban columns. */
export function statusVM(category: 'todo' | 'in-progress' | 'done'): {
  label: string;
  hue?: number;
} {
  if (category === 'in-progress') return { label: 'In progress', hue: 233 };
  if (category === 'done') return { label: 'Done', hue: 150 };
  return { label: 'To do' };
}

/** The fixed kanban column order. */
export const TICKET_COLUMNS: ('todo' | 'in-progress' | 'done')[] = ['todo', 'in-progress', 'done'];

/** Strip a leading `${key} ` from a title (Jira prefixes its summary with the
 * key, which the board shows in its own column). */
export function stripKeyPrefix(title: string, key: string): string {
  return title.startsWith(`${key} `) ? title.slice(key.length + 1) : title;
}

// ── Scoped connection chips (the lens identity row) ────────────────────────────
const QUERY_LABEL: Record<LensQuery, string> = {
  authored: 'Authored',
  assigned: 'Assigned',
  'review-requested': 'Review requests',
};

export interface ChipVM {
  sourceId: string;
  provider: LensProvider;
  mono: string;
  name: string;
  /** The per-association scope text (the ref's queries, humanised) — or the host
   * for a feed/no-query source. */
  scope: string;
}

/** One chip per connection (account ref), with its per-association scope. */
export function chipsFor(node: LensNode, accounts: AppState['sources']): ChipVM[] {
  const out: ChipVM[] = [];
  for (const ref of node.sources) {
    const account = accounts[ref.sourceId];
    if (!account) continue;
    const scope =
      ref.queries.length > 0
        ? ref.queries.map((q) => QUERY_LABEL[q]).join(', ')
        : hostOf(account.baseUrl);
    out.push({
      sourceId: account.id,
      provider: account.provider,
      mono: monoFor(account.provider),
      name: account.name ?? hostOf(account.baseUrl),
      scope,
    });
  }
  return out;
}

// ── Changes: relation grouping (Waiting / Authored / Assigned) ──────────────────
// The comp groups changes by the query axis that surfaced them: review-requests
// ("waiting on you"), authored, assigned.
export type Relation = 'waiting' | 'authored' | 'assigned';
export const RELATION_ORDER: Relation[] = ['waiting', 'authored', 'assigned'];
export const RELATION_LABEL: Record<Relation, string> = {
  waiting: 'Review requests',
  authored: 'Authored',
  assigned: 'Assigned',
};
export function relationOf(query: LensQuery | undefined): Relation {
  if (query === 'review-requested') return 'waiting';
  if (query === 'assigned') return 'assigned';
  return 'authored';
}
/** Group changes by relation in the comp's fixed order; empty groups dropped. */
export function groupByRelation(changes: Tagged[]): { relation: Relation; items: Tagged[] }[] {
  return RELATION_ORDER.map((relation) => ({
    relation,
    items: changes.filter((t) => relationOf(t.cfg.query) === relation),
  })).filter((g) => g.items.length > 0);
}

// ── Changes: reviewer avatar hue (stable, derived from the login) ───────────────
export function reviewerHue(login: string): number {
  let h = 0;
  for (let i = 0; i < login.length; i++) h = (h * 31 + login.charCodeAt(i)) % 360;
  return h;
}

// ── Changes: the CI circle (passed ✓ / failed ✕ / running ●), the comp's glyph ──
export function ciCircle(
  tone?: 'ok' | 'pending' | 'warn' | 'fail',
): { glyph: string; hue: number; label: string } | null {
  if (tone === 'ok' || tone === 'warn') return { glyph: '✓', hue: 150, label: 'CI passed' };
  if (tone === 'fail') return { glyph: '✕', hue: 25, label: 'CI failing' };
  if (tone === 'pending') return { glyph: '●', hue: 75, label: 'CI running' };
  return null;
}

// ── Issues: status grouping (To do / In progress / Done) ────────────────────────
export function groupByStatus(
  tickets: Tagged[],
): { category: 'todo' | 'in-progress' | 'done'; items: Tagged[] }[] {
  return TICKET_COLUMNS.map((category) => ({
    category,
    items: tickets.filter((t) => t.item.ticket?.statusCategory === category),
  })).filter((g) => g.items.length > 0);
}
/** The status-group dot colour (todo neutral, in-progress blue, done green). */
export function statusDot(category: 'todo' | 'in-progress' | 'done'): string {
  if (category === 'in-progress') return 'oklch(0.62 0.14 233)';
  if (category === 'done') return 'oklch(0.66 0.14 150)';
  return 'var(--text-muted)';
}

// ── Filters: the distinct repos (Changes) / feeds (Articles) for the chip rows ──
export function reposOf(changes: Tagged[]): string[] {
  return [...new Set(changes.map((t) => t.item.change?.repo).filter((r): r is string => !!r))];
}
export function feedLabel(t: Tagged): string {
  return t.cfg.name ?? hostOf(t.cfg.baseUrl);
}
export function feedsOf(articles: Tagged[]): string[] {
  return [...new Set(articles.map(feedLabel))];
}

// ── Relative time ("2h" / "5h" / "1d") ─────────────────────────────────────────
export function relTime(ms: number, now: number = Date.now()): string {
  const s = Math.max(0, Math.floor((now - ms) / 1000));
  if (s < 60) return 'now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w}w`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo`;
  return `${Math.floor(d / 365)}y`;
}
