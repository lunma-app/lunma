import type {
  LauncherResult,
  OptionalResultSource,
  SuggestionsQuery,
  SuggestionsResult,
} from './launcher-contract';
import { log } from './logger';
import { AppStateV7Schema } from './schemas';
import type { AppState, WindowId } from './types';

export interface StateBroadcastMessage {
  type: 'lunma/state-broadcast';
  method: string;
  state: AppState;
}

export interface StateRequestMessage {
  type: 'lunma/state-request';
}

export interface StateSnapshotMessage {
  type: 'lunma/state-snapshot';
  state: AppState;
}

/**
 * Launcher suggestions request — a debounced keystroke from a surface (new-tab
 * page or `Alt+L` overlay). The pure-read suggestions channel: the SW answers
 * with the merged, scored results, never touching the coordinator queue. The
 * `requestId` round-trips so the surface can drop stale (out-of-order) responses
 * (latest-wins).
 */
export interface LauncherSuggestionsRequestMessage {
  type: 'lunma/launcher-suggestions-request';
  requestId: string;
  query: string;
  windowId: WindowId;
}

export interface LauncherSuggestionsResponseMessage {
  type: 'lunma/launcher-suggestions-response';
  requestId: string;
  results: LauncherResult[];
  /** The `results[].url` values already open in the requesting window's active
   * Space (tab-dedup). Lets the stateless overlay flag "already open" rows by
   * membership. Optional + backward-compatible (older handlers omit it). */
  openUrls?: string[];
  /** The optional result sources (`history`/`bookmarks`) not currently granted
   * (least-privilege-permissions D5). Lets a surface offer "Enable ⟨source⟩
   * results". Optional + backward-compatible (older handlers omit it). */
  ungrantedSources?: OptionalResultSource[];
}

/**
 * The Tab-to-search engine registry pushed to the stateless `Alt+L` overlay on
 * the open path (launcher-tab-to-search, design D4). One entry per active engine
 * — the built-ins plus the valid custom engine, from `buildEngineRegistry`. It
 * is structurally a `SearchEngine` (id + name + keyword + urlTemplate); the
 * `urlTemplate` rides so the overlay can build the active engine's search URL
 * via `buildSearchUrl` (including the custom engine, whose template is not a
 * code constant). The default engine id is deliberately NOT pushed — the overlay
 * has no consumer for it (the default web-search row is synthesized SW-side).
 */
export interface EngineSummary {
  id: string;
  name: string;
  keyword: string;
  urlTemplate: string;
}

/**
 * Toggle-launcher open message — the SW routes this to the focused tab's overlay
 * content script on the `chrome.commands` path. Carries the focused window id so
 * the (stateless) overlay scopes its suggestions query, plus — when the window
 * has a resolved, non-neutral active Space — that Space's canonical OKLCH
 * `spaceHue` / `spaceChroma` / `spaceL` so the overlay glows in the Space's TRUE
 * colour, plus the Tab-to-search engine registry (`engines`) so the overlay
 * recognizes keywords and renders the engine chip without reading settings. The
 * tint + `engines` fields are optional and additive: an absent tint leaves the
 * overlay on its default accent; an absent registry (older SW) leaves
 * Tab-to-search inert.
 */
export interface LauncherToggleMessage {
  type: 'lunma/toggle-launcher';
  windowId: WindowId;
  spaceHue?: number;
  spaceChroma?: number;
  spaceL?: number;
  engines?: EngineSummary[];
}

/**
 * Current-window request — the launcher overlay's keydown (`Alt+L`) fallback
 * carries no service-worker message payload, so it asks the SW which window its
 * tab lives in. The SW reads `sender.tab?.windowId` (content scripts cannot call
 * `chrome.windows`). Pure-read: no queue, no mutation, no broadcast.
 */
export interface CurrentWindowRequestMessage {
  type: 'lunma/current-window';
}

export interface CurrentWindowResultMessage {
  type: 'lunma/current-window-result';
  windowId: WindowId;
  /** Active Space's canonical OKLCH hue / chroma / lightness for the window, when
   * resolved and non-neutral (mirrors the toggle-launcher open message so the
   * keydown- and command-opened overlays tint identically). Absent → overlay
   * default accent. */
  spaceHue?: number;
  spaceChroma?: number;
  spaceL?: number;
  /** Tab-to-search engine registry for the keydown-opened overlay (mirrors the
   * toggle-launcher open message so both open paths carry it). Absent → an older
   * SW, leaving Tab-to-search inert. */
  engines?: EngineSummary[];
}

/**
 * Boundary config (SW → boundary content script, pinned-tab-domain-boundary):
 * the effective allow-set for one bound, enforced tab, or `null` to disarm
 * (inherit-off, or the boundary was cleared). The content script matches link
 * clicks against it locally (design D6) so a click needs no per-click round-trip
 * to the SW. Targeted at a single tab via `chrome.tabs.sendMessage`.
 */
export interface BoundaryConfigMessage {
  type: 'lunma/boundary-config';
  allow: string[] | null;
}

/**
 * Boundary divert (boundary content script → SW, pinned-tab-domain-boundary): a
 * same-tab, off-allow link the user clicked. The SW reads `sender.tab?.windowId`
 * and enqueues the existing `openUrl` command so the URL opens in a new
 * temporary tab while the pinned tab stays put (design D5). Fire-and-forget — no
 * response.
 */
export interface BoundaryOpenElsewhereMessage {
  type: 'lunma/boundary-open-elsewhere';
  url: string;
}

/**
 * Sidebar focus report (sidebar → SW, launcher-sidebar-focus-reach): the side
 * panel tells the SW whether it currently holds keyboard focus, keyed by the
 * window it lives in (the panel is not a tab, so the SW can't read its window from
 * `sender.tab`). The `toggle-launcher` command handler reads this to route `Alt+L`
 * to the focused new-tab launcher when the panel is focused — Chrome forbids
 * focusing the in-page overlay from the panel (W3C webextensions #693). Persisted
 * in `chrome.storage.session` so it survives a service-worker teardown.
 * Fire-and-forget — no response.
 */
export interface SidebarFocusMessage {
  type: 'lunma/sidebar-focus';
  windowId: WindowId;
  focused: boolean;
}

/**
 * Open-new-tab-launcher request (sidebar → SW, launcher-sidebar-focus-reach): an
 * explicit request to open or focus the new-tab launcher in the sidebar's window —
 * the sidebar launcher-button click (the trailing IconButton in the Space switcher
 * bar that replaced the SearchTrigger pill). Independent of the `chrome.commands`
 * binding (unlike the Alt+L command path), so the sidebar reaches a launcher even
 * when the shortcut is unbound. Fire-and-forget — no response.
 */
export interface OpenNewTabLauncherMessage {
  type: 'lunma/open-newtab-launcher';
  windowId: WindowId;
}

/**
 * Open-options-at-grant-location request (Alt+L overlay → SW, least-privilege-
 * permissions D5). The overlay is a content script and cannot call
 * `chrome.permissions`, so its "Enable ⟨source⟩ results" affordance routes here:
 * the SW opens the options page at the Result sources grant control (`source`
 * names which optional permission the user reached for). Fire-and-forget.
 */
export interface OpenOptionsGrantMessage {
  type: 'lunma/open-options-grant';
  source: OptionalResultSource;
}

export type LunmaMessage =
  | StateBroadcastMessage
  | StateRequestMessage
  | StateSnapshotMessage
  | LauncherSuggestionsRequestMessage
  | LauncherSuggestionsResponseMessage
  | LauncherToggleMessage
  | CurrentWindowRequestMessage
  | CurrentWindowResultMessage
  | BoundaryConfigMessage
  | BoundaryOpenElsewhereMessage
  | SidebarFocusMessage
  | OpenNewTabLauncherMessage
  | OpenOptionsGrantMessage;

export function broadcastState(method: string, state: AppState): void {
  const msg: StateBroadcastMessage = { type: 'lunma/state-broadcast', method, state };
  try {
    void chrome.runtime.sendMessage(msg).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('Receiving end does not exist')) return;
      log.error('broadcastState failed', { err });
    });
  } catch (err) {
    log.error('broadcastState failed', { err });
  }
}

/** Send a fire-and-forget `chrome.runtime` message, swallowing the benign
 * "Receiving end does not exist" rejection (SW asleep / no listener yet) like
 * `broadcastState`. Used by the sidebar's UI-only signals to the SW. */
function sendFireAndForget(msg: LunmaMessage, label: string): void {
  try {
    void chrome.runtime.sendMessage(msg).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('Receiving end does not exist')) return;
      log.error(`${label} failed`, { err });
    });
  } catch (err) {
    log.error(`${label} failed`, { err });
  }
}

/**
 * Sidebar-side: report the side panel's focus state to the SW
 * (launcher-sidebar-focus-reach), keyed by the sidebar's `windowId`. Fire-and-
 * forget. The SW persists it so `Alt+L` (the `toggle-launcher` command) opens the
 * focused new-tab launcher instead of an unfocusable in-page overlay.
 */
export function reportSidebarFocus(windowId: WindowId, focused: boolean): void {
  sendFireAndForget({ type: 'lunma/sidebar-focus', windowId, focused }, 'reportSidebarFocus');
}

/**
 * Sidebar-side: ask the SW to open/focus the new-tab launcher in `windowId`
 * (launcher-sidebar-focus-reach) — the sidebar launcher-button click. Fire-and-
 * forget; works independently of the `chrome.commands` binding.
 */
export function requestNewTabLauncher(windowId: WindowId): void {
  sendFireAndForget({ type: 'lunma/open-newtab-launcher', windowId }, 'requestNewTabLauncher');
}

export function onStateBroadcast(handler: (msg: StateBroadcastMessage) => void): () => void {
  const listener = (raw: unknown) => {
    if (!raw || typeof raw !== 'object') return;
    const m = raw as Partial<LunmaMessage>;
    if (m.type !== 'lunma/state-broadcast') return;
    const candidate = m as Record<string, unknown>;
    const stateResult = AppStateV7Schema.safeParse(candidate.state);
    if (!stateResult.success) return;
    // Cast is safe: AppStateV7Schema structurally matches AppState; the only
    // divergences are optional ephemeral slices (liveTabsById, smartFolders) that
    // exactOptionalPropertyTypes cannot bridge without a cast, and the Zod/TS
    // inference gap on favIconUrl (string | undefined vs string?).
    const state = stateResult.data as unknown as AppState;
    handler({ type: 'lunma/state-broadcast', method: String(candidate.method ?? ''), state });
  };
  chrome.runtime.onMessage.addListener(listener);
  return () => chrome.runtime.onMessage.removeListener(listener);
}

/**
 * Sidebar-side: ask the SW for the current AppState snapshot. Resolves with
 * the state field of the SW's response. Rejects on transport failure with a
 * descriptive Error.
 */
export async function requestStateSnapshot(): Promise<AppState> {
  const req: StateRequestMessage = { type: 'lunma/state-request' };
  let raw: unknown;
  try {
    raw = await chrome.runtime.sendMessage(req);
  } catch (err) {
    const cause = err instanceof Error ? err.message : String(err);
    throw new Error(`requestStateSnapshot: transport failure: ${cause}`);
  }
  if (!raw || typeof raw !== 'object') {
    throw new Error('requestStateSnapshot: no response from service worker');
  }
  const msg = raw as Partial<StateSnapshotMessage>;
  if (msg.type !== 'lunma/state-snapshot' || !msg.state) {
    throw new Error('requestStateSnapshot: malformed response');
  }
  return msg.state;
}

/**
 * SW-side: register a chrome.runtime.onMessage listener that responds to
 * 'lunma/state-request' by calling handler() and replying with a
 * 'lunma/state-snapshot' message. Returns an unregister function.
 *
 * Pure-read per the chrome-event-coordination contract: this never enqueues,
 * never mutates, never broadcasts.
 */
export function respondWithStateSnapshot(handler: () => AppState): () => void {
  const listener = (
    raw: unknown,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: StateSnapshotMessage) => void,
  ): boolean | undefined => {
    if (!raw || typeof raw !== 'object') return undefined;
    const m = raw as Partial<LunmaMessage>;
    if (m.type !== 'lunma/state-request') return undefined;
    try {
      const state = handler();
      sendResponse({ type: 'lunma/state-snapshot', state });
    } catch (err) {
      log.error('respondWithStateSnapshot: handler threw', { err });
    }
    return false;
  };
  chrome.runtime.onMessage.addListener(listener);
  return () => chrome.runtime.onMessage.removeListener(listener);
}

/**
 * SW-side: push a bound tab's effective boundary allow-set (or `null` to disarm)
 * to its boundary content script (pinned-tab-domain-boundary). Targeted at one
 * tab via `chrome.tabs.sendMessage`. Fire-and-forget and benign when the tab has
 * no boundary script yet (a forbidden page, or a tab not yet configured) — the
 * "Receiving end does not exist" rejection is swallowed, like `broadcastState`.
 */
export function sendBoundaryConfig(tabId: number, allow: string[] | null): void {
  const msg: BoundaryConfigMessage = { type: 'lunma/boundary-config', allow };
  try {
    void chrome.tabs.sendMessage(tabId, msg).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('Receiving end does not exist')) return;
      log.error('sendBoundaryConfig failed', { err, tabId });
    });
  } catch (err) {
    log.error('sendBoundaryConfig failed', { err, tabId });
  }
}

/**
 * Surface-side: ask the SW for launcher suggestions for `query` in `windowId`.
 * Allocates a fresh `requestId`, sends the request, and resolves with the
 * SW's `{ requestId, results }`. The caller compares the echoed `requestId`
 * against its latest outstanding request to drop stale responses (latest-wins).
 * Rejects on transport / malformed-response failure with a descriptive Error.
 */
export async function requestLauncherSuggestions(
  query: string,
  windowId: WindowId,
): Promise<SuggestionsResult> {
  const requestId = crypto.randomUUID();
  const req: LauncherSuggestionsRequestMessage = {
    type: 'lunma/launcher-suggestions-request',
    requestId,
    query,
    windowId,
  };
  let raw: unknown;
  try {
    raw = await chrome.runtime.sendMessage(req);
  } catch (err) {
    const cause = err instanceof Error ? err.message : String(err);
    throw new Error(`requestLauncherSuggestions: transport failure: ${cause}`);
  }
  if (!raw || typeof raw !== 'object') {
    throw new Error('requestLauncherSuggestions: no response from service worker');
  }
  const msg = raw as Partial<LauncherSuggestionsResponseMessage>;
  if (msg.type !== 'lunma/launcher-suggestions-response' || !Array.isArray(msg.results)) {
    throw new Error('requestLauncherSuggestions: malformed response');
  }
  return {
    requestId: msg.requestId ?? requestId,
    results: msg.results,
    ...(Array.isArray(msg.openUrls) ? { openUrls: msg.openUrls } : {}),
    ...(Array.isArray(msg.ungrantedSources) ? { ungrantedSources: msg.ungrantedSources } : {}),
  };
}

/**
 * SW-side: register a chrome.runtime.onMessage listener that responds to
 * 'lunma/launcher-suggestions-request' by calling `handler` with the query and
 * replying with a 'lunma/launcher-suggestions-response' echoing the requestId.
 *
 * Pure-read per the chrome-event-coordination contract: this never enqueues,
 * never mutates, never persists, never broadcasts — it only emits the response.
 * `handler` is async (it sources read-only chrome APIs), so the listener
 * returns `true` to keep the response channel open. On a handler failure it
 * still replies (empty results) so the caller's promise resolves.
 *
 * The handler returns `{ results, openUrls? }`: `openUrls` is the subset of
 * result URLs already open in the active Space (tab-dedup), forwarded verbatim
 * to the stateless overlay.
 *
 * Returns an unregister function.
 */
export function respondWithLauncherSuggestions(
  handler: (query: SuggestionsQuery) => Promise<{
    results: LauncherResult[];
    openUrls?: string[];
    ungrantedSources?: OptionalResultSource[];
  }>,
): () => void {
  const listener = (
    raw: unknown,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: LauncherSuggestionsResponseMessage) => void,
  ): boolean | undefined => {
    if (!raw || typeof raw !== 'object') return undefined;
    const m = raw as Partial<LauncherSuggestionsRequestMessage>;
    if (m.type !== 'lunma/launcher-suggestions-request') return undefined;
    const requestId = m.requestId ?? '';
    const query: SuggestionsQuery = {
      requestId,
      query: m.query ?? '',
      windowId: m.windowId ?? -1,
    };
    void Promise.resolve()
      .then(() => handler(query))
      .then(({ results, openUrls, ungrantedSources }) => {
        sendResponse({
          type: 'lunma/launcher-suggestions-response',
          requestId,
          results,
          ...(openUrls && openUrls.length > 0 ? { openUrls } : {}),
          ...(ungrantedSources && ungrantedSources.length > 0 ? { ungrantedSources } : {}),
        });
      })
      .catch((err: unknown) => {
        log.error('respondWithLauncherSuggestions: handler threw', { err });
        sendResponse({ type: 'lunma/launcher-suggestions-response', requestId, results: [] });
      });
    return true; // async response
  };
  chrome.runtime.onMessage.addListener(listener);
  return () => chrome.runtime.onMessage.removeListener(listener);
}

/**
 * SW-side: register a chrome.runtime.onMessage listener that responds to
 * 'lunma/current-window' with the sender tab's window id (or the `-1` sentinel
 * when `sender.tab` is unavailable). Used by the launcher overlay's keydown
 * fallback, which has no message payload to read `windowId` from.
 *
 * The optional `resolveTint` is the SW's active-Space lookup for the window
 * (`src/background/index.ts`): when it returns the canonical OKLCH hue/chroma/l
 * the response carries them so the keydown-opened overlay glows in the Space's
 * TRUE colour exactly as on the command path; when it returns null (no active
 * Space, neutral `gray`, or no resolver) the response omits them and the overlay
 * keeps its default accent. Reading the store stays in the SW — this module takes
 * only the three numbers.
 *
 * The optional `resolveEngines` is the SW's Tab-to-search registry source
 * (`buildEngineRegistry(await readSettings())`, launcher-tab-to-search). Because
 * it reads settings asynchronously, supplying it makes the response ASYNC (the
 * listener returns `true` and replies once the registry resolves); without it
 * the response stays synchronous (returns `false`), as the tint-only path
 * always did. A non-empty registry rides as `engines`; an empty/failed read
 * omits the field, leaving Tab-to-search inert.
 *
 * Pure-read per the chrome-event-coordination contract: this never enqueues,
 * never mutates, never persists, never broadcasts.
 *
 * Returns an unregister function.
 */
export function respondWithCurrentWindow(
  resolveTint?: (windowId: WindowId) => { hue: number; chroma: number; l: number } | null,
  resolveEngines?: () => Promise<EngineSummary[]>,
): () => void {
  const listener = (
    raw: unknown,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: CurrentWindowResultMessage) => void,
  ): boolean | undefined => {
    if (!raw || typeof raw !== 'object') return undefined;
    const m = raw as Partial<LunmaMessage>;
    if (m.type !== 'lunma/current-window') return undefined;
    const windowId = sender.tab?.windowId ?? -1;
    const response: CurrentWindowResultMessage = { type: 'lunma/current-window-result', windowId };
    const tint = windowId !== -1 ? (resolveTint?.(windowId) ?? null) : null;
    if (tint) {
      response.spaceHue = tint.hue;
      response.spaceChroma = tint.chroma;
      response.spaceL = tint.l;
    }
    if (resolveEngines) {
      // Async: source the registry (a settings read) before replying.
      void resolveEngines()
        .then((engines) => {
          if (engines.length > 0) response.engines = engines;
          sendResponse(response);
        })
        .catch((err: unknown) => {
          log.error('respondWithCurrentWindow: resolveEngines threw', { err });
          sendResponse(response);
        });
      return true; // async response — keep the channel open
    }
    sendResponse(response);
    return false;
  };
  chrome.runtime.onMessage.addListener(listener);
  return () => chrome.runtime.onMessage.removeListener(listener);
}
