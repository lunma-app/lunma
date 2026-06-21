import type { SidebarCommand } from '../shared/bus';
import type { LauncherResult, OptionalResultSource } from '../shared/launcher-contract';
import { sourceBadgeLabel } from '../shared/launcher-contract';
import { modifierLabel } from '../shared/platform';
import type { SearchEngine } from '../shared/search-engines';
import { faviconUrl } from '../ui/favicon';
import overlayStyles from './overlay.css?inline';
import { isDedupEligibleSource } from './shared/already-open';
import { buildSearchUrl, resolveEngine } from './shared/web-actions';

/**
 * Alt+L launcher overlay — content script injected at `document_start` on
 * `<all_urls>`, dormant until the SW routes a `toggle-launcher` command here.
 *
 * Vanilla TypeScript, closed shadow DOM, a constructable stylesheet (design D5).
 * **No Svelte runtime** and **no heavy imports** — pulling in the `bus`
 * singleton or `messages.ts` would bundle the logger and blow the <15KB-gzip
 * budget, so the overlay speaks the wire protocols directly via
 * `chrome.runtime.sendMessage` (suggestions request/response + the bus
 * `lunma/command` envelope). Only the tiny pure `faviconUrl` helper and
 * type-only symbols are imported.
 */

const SEARCH_SVG =
  '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>';

// The chip remove (×) glyph — mirrors `Icon name="x"` in the Svelte `Chip`.
const X_SVG =
  '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';

// Globe fallback for a favicon `<img>` that fails to load — the vanilla mirror of
// the Svelte `Favicon` primitive's staged globe. A muted grey stroke (the img has
// no CSS context to resolve `currentColor`), inlined as a data URI.
const GLOBE_DATA_URI = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9aa0a6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>',
)}`;

/** Swap a favicon `<img>` to the globe glyph once if its source fails to load
 * (single-shot — clears its own handler so the globe can never re-trigger it). */
function withGlobeFallback(img: HTMLImageElement): void {
  img.onerror = (): void => {
    img.onerror = null;
    img.src = GLOBE_DATA_URI;
  };
}

/** Stable DOM ids for the listbox + its options, so the combobox input can
 * reference the active option via `aria-activedescendant`. */
const LIST_ID = 'lunma-launcher-list';
const optionId = (i: number): string => `lunma-launcher-opt-${i}`;

/**
 * Should the overlay dismiss on a `focusout` whose focus moved to `relatedTarget`?
 * True when focus left the overlay entirely — `relatedTarget` is `null` (focus
 * went to another window / nothing) or lies outside the overlay `host`. In the
 * production CLOSED shadow root an intra-overlay focus move retargets
 * `relatedTarget` to the host itself, so `host.contains(host)` is true and the
 * overlay stays open (launcher-sidebar-focus-reach D5). Pure + exported so it is
 * unit-testable without the closed-shadow runtime; a null host never dismisses.
 */
export function shouldDismissOnFocusOut(
  host: HTMLElement | null,
  relatedTarget: Node | null,
): boolean {
  if (!host) return false;
  return relatedTarget === null || !host.contains(relatedTarget);
}

(() => {
  const flag = window as unknown as { __lunmaLauncherInstalled?: boolean };
  if (flag.__lunmaLauncherInstalled) return;
  flag.__lunmaLauncherInstalled = true;

  const DEBOUNCE_MS = 120;

  let host: HTMLElement | null = null;
  let scrim: HTMLElement | null = null;
  let input: HTMLInputElement | null = null;
  let listEl: HTMLElement | null = null;
  // The CLOSED shadow root, hoisted from build() so open()'s never-got-focus
  // guard can read shadowRoot.activeElement (document.activeElement reports the
  // host for a closed shadow, not the inner input — D5).
  let shadowRoot: ShadowRoot | null = null;
  // Tab-to-search chrome (launcher-tab-to-search): the engine chip inside the
  // input row + the quiet "⇥ Tab" hint below it (vanilla mirrors of the Svelte
  // `Chip` + the new-tab hint, under the standing no-Svelte overlay exception).
  let chipEl: HTMLElement | null = null;
  let chipIconEl: HTMLImageElement | null = null;
  let chipLabelEl: HTMLElement | null = null;
  let chipRemoveEl: HTMLButtonElement | null = null;
  let hintEl: HTMLElement | null = null;
  let hintVerbEl: HTMLElement | null = null;
  let hintEnginesEl: HTMLElement | null = null;
  // Footer action hint (tab-dedup): "↵ Open" by default, "↵ Switch  ⇧↵ New tab"
  // when the focused row's URL is already open in the active Space.
  let actionHintEl: HTMLElement | null = null;
  // "Enable ⟨source⟩ results" strip (least-privilege-permissions D5): one button
  // per ungranted optional source the SW reported. The overlay can't call
  // `chrome.permissions`, so a click routes to the options page via the SW.
  let enableEl: HTMLElement | null = null;
  let ungrantedSources: OptionalResultSource[] = [];
  let results: LauncherResult[] = [];
  // The `results[].url` values already open in the active Space, from the latest
  // suggestions response (tab-dedup). The stateless overlay has no `AppState`, so
  // membership here is its only "already open" signal.
  let openUrls = new Set<string>();
  let selected = 0;
  let isOpen = false;
  let windowId = -1;
  // The SW-pushed engine registry (id + name + keyword + urlTemplate), captured
  // on open from the toggle message or the current-window response — the overlay
  // needs no settings access. `activeEngine` is the locked engine; `cycle` is the
  // candidate set frozen at activation so repeated Tab rotates an ambiguous prefix.
  let engines: SearchEngine[] = [];
  let activeEngine: SearchEngine | null = null;
  let cycle: SearchEngine[] = [];
  let cycleIndex = 0;
  // Resolves once the keydown-opened overlay has learned its real window id from
  // the SW. `runQuery` awaits it so the first suggestions request carries the
  // resolved id, not the `-1` sentinel. `null` when the id arrived in the open
  // payload (the SW-command path) and no resolution is pending.
  let windowIdResolved: Promise<void> | null = null;
  // Per-open generation. Bumped on every open AND close so a `current-window`
  // resolver still in flight from a prior (closed or superseded) open can't
  // settle late and clobber the current window id / Space tint. Resetting the
  // promise alone wouldn't help — the already-attached `.then` still fires —
  // so the resolver captures its generation and checks it before applying.
  let openGen = 0;
  let latest = 0;
  let debounce: ReturnType<typeof setTimeout> | undefined;

  const sheet = new CSSStyleSheet();
  sheet.replaceSync(overlayStyles);

  function el(tag: string, cls: string): HTMLElement {
    const node = document.createElement(tag);
    node.className = cls;
    return node;
  }

  /**
   * Tint the overlay in the active Space's TRUE colour the SW provided on open.
   * Sets `--space-h` / `--space-chroma` / `--space-l` on the host element —
   * custom properties cross the shadow boundary, so the card wash, accent, caret,
   * and selected-row bar (all reading the canonical-triple `--accent` /
   * `--accent-soft` / glow in overlay.css) recolour together. When the hue is
   * absent (no active Space, a neutral `gray` Space, or an older SW) the
   * properties are REMOVED so the `, 62` / `, 0.15` / `, 0.62` token fallbacks
   * render the default ember accent. Always called on open, so a reused host
   * never keeps a previous Space's tint.
   */
  function applySpaceTint(
    hue: number | undefined,
    chroma: number | undefined,
    l: number | undefined,
  ): void {
    if (!host) return;
    if (typeof hue === 'number') {
      host.style.setProperty('--space-h', String(hue));
      if (typeof chroma === 'number') host.style.setProperty('--space-chroma', String(chroma));
      else host.style.removeProperty('--space-chroma');
      if (typeof l === 'number') host.style.setProperty('--space-l', String(l));
      else host.style.removeProperty('--space-l');
    } else {
      host.style.removeProperty('--space-h');
      host.style.removeProperty('--space-chroma');
      host.style.removeProperty('--space-l');
    }
  }

  // Density (launcher-density-rows). Density is a GLOBAL setting (unlike the
  // per-window Space hue the SW resolves), so the overlay reads it DIRECTLY from
  // chrome.storage.sync rather than over a launcher-toggle message. Lazy: the
  // content script runs at document_start on every page, so storage is untouched
  // until the launcher is first opened; the value is cached and kept fresh via
  // storage.onChanged. No Zod / settings import (byte budget) — a raw field read
  // plus a three-value guard. SETTINGS_KEY is intentionally re-declared here
  // rather than imported: importing settings.ts would drag Zod into this bundle.
  type Density = 'compact' | 'normal' | 'comfort';
  const SETTINGS_KEY = 'lunma.settings';
  let density: Density = 'normal';
  let densityRequested = false;

  function coerceDensity(value: unknown): Density {
    return value === 'compact' || value === 'comfort' ? value : 'normal';
  }

  /**
   * Reflect the cached density onto the host so the shadow stylesheet's
   * `:host([data-density='comfort'])` rules apply (host-attribute selectors are
   * honoured from inside the shadow, like the inline `--space-*` tint). Normal
   * omits the attribute — the token default — mirroring the new-tab page setting
   * `data-density` on `<html>`.
   */
  function applyDensity(): void {
    if (!host) return;
    if (density === 'normal') delete host.dataset.density;
    else host.dataset.density = density;
  }

  /**
   * Read `lunma.settings.density` once (on first open) and register a single
   * storage.onChanged listener to keep the cache fresh. Best-effort: if storage
   * is unavailable the Normal default stands. The cached value is applied to the
   * host synchronously in `open()`; only the very first open in a page's life
   * may reflow once, when this read resolves.
   */
  function ensureDensity(): void {
    if (densityRequested) return;
    densityRequested = true;
    if (typeof chrome === 'undefined' || typeof chrome.storage?.sync?.get !== 'function') return;
    chrome.storage.sync
      .get(SETTINGS_KEY)
      .then((got: Record<string, unknown>) => {
        density = coerceDensity(
          (got?.[SETTINGS_KEY] as { density?: unknown } | undefined)?.density,
        );
        applyDensity();
      })
      .catch(() => undefined);
    if (typeof chrome.storage?.onChanged?.addListener === 'function') {
      chrome.storage.onChanged.addListener(
        (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
          if (area !== 'sync') return;
          const change = changes[SETTINGS_KEY];
          if (!change) return;
          density = coerceDensity((change.newValue as { density?: unknown } | undefined)?.density);
          applyDensity();
        },
      );
    }
  }

  /**
   * Register the bundled brand faces on the host document's `FontFace` set so
   * the closed shadow root can use them. `@font-face` rules inside a shadow
   * root's adopted stylesheet are not honoured, and a content script's CSS
   * `url()` resolves against the host origin — so we resolve the extension URL
   * via `chrome.runtime.getURL` (the fonts are in `web_accessible_resources`).
   * Best-effort: if anything is unavailable the `:host` fallback stack renders.
   */
  function registerFonts(): void {
    if (typeof FontFace === 'undefined' || typeof document.fonts?.add !== 'function') return;
    if (typeof chrome === 'undefined' || typeof chrome.runtime?.getURL !== 'function') return;
    try {
      const mona = new FontFace(
        'Mona Sans',
        `url(${chrome.runtime.getURL('fonts/MonaSans-Variable.woff2')}) format('woff2')`,
        { weight: '200 900', display: 'swap' },
      );
      const serif = new FontFace(
        'Instrument Serif',
        `url(${chrome.runtime.getURL('fonts/InstrumentSerif-Regular.woff2')}) format('woff2')`,
        { weight: '400', display: 'swap' },
      );
      document.fonts.add(mona);
      document.fonts.add(serif);
      void mona.load();
      void serif.load();
    } catch {
      /* fallback stack renders; nothing to recover */
    }
  }

  function build(): void {
    registerFonts();
    host = document.createElement('div');
    host.setAttribute('data-lunma-launcher', '');
    const shadow = host.attachShadow({ mode: 'closed' });
    shadowRoot = shadow;
    shadow.adoptedStyleSheets = [sheet];

    scrim = el('div', 'scrim');
    const card = el('div', 'card');
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-label', 'Lunma launcher');

    const inputRow = el('div', 'input-row');
    const leading = el('span', 'leading');
    leading.innerHTML = SEARCH_SVG;
    // Engine chip (Tab-to-search) — between the leading icon and the input,
    // hidden until an engine is locked. Mirrors the Svelte `Chip` accent tone.
    chipEl = el('span', 'chip');
    chipEl.setAttribute('data-tone', 'accent');
    chipEl.style.display = 'none';
    chipIconEl = document.createElement('img');
    chipIconEl.className = 'chip-icon';
    chipIconEl.width = 14;
    chipIconEl.height = 14;
    chipIconEl.alt = '';
    withGlobeFallback(chipIconEl); // engine favicon → globe on load error
    chipLabelEl = el('span', 'chip-label');
    chipRemoveEl = document.createElement('button');
    chipRemoveEl.type = 'button';
    chipRemoveEl.className = 'chip-remove';
    chipRemoveEl.innerHTML = X_SVG;
    chipRemoveEl.addEventListener('mousedown', (e) => {
      // Pointer-down (not click) so focus never leaves the input, and stop the
      // scrim's mousedown-to-close from firing.
      e.preventDefault();
      e.stopPropagation();
      popEngine();
    });
    chipEl.append(chipIconEl, chipLabelEl, chipRemoveEl);
    input = document.createElement('input');
    input.className = 'input';
    input.type = 'text';
    input.placeholder = 'Search tabs, bookmarks…';
    input.setAttribute('aria-label', 'Search tabs, bookmarks, and history');
    input.autocomplete = 'off';
    // Combobox semantics matching the Svelte new-tab surface: the input owns the
    // listbox and exposes the active option to assistive tech (overlay-aria-parity).
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-controls', LIST_ID);
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-expanded', 'false');
    const kbd = el('span', 'kbd');
    kbd.textContent = `${modifierLabel}L`;
    inputRow.append(leading, chipEl, input, kbd);

    // The quiet "⇥ Tab" affordance — between the input row and the list: the ⇥
    // glyph, a verb, then one favicon+name span per candidate engine.
    hintEl = el('div', 'hint');
    hintEl.style.display = 'none';
    const hintKbd = el('span', 'hint-kbd');
    hintKbd.textContent = '⇥';
    hintVerbEl = el('span', 'hint-verb');
    hintEnginesEl = el('span', 'hint-engines');
    hintEl.append(hintKbd, hintVerbEl, hintEnginesEl);

    listEl = el('div', 'list');
    listEl.setAttribute('role', 'listbox');
    listEl.id = LIST_ID;
    listEl.setAttribute('aria-label', 'Search results');

    // Footer action hint (tab-dedup) — below the list; hidden until there are
    // results. Its contents are (re)built by `updateActionHint()`.
    actionHintEl = el('div', 'action-hint');
    actionHintEl.style.display = 'none';

    // "Enable ⟨source⟩ results" strip — below the action hint; hidden until the
    // SW reports an ungranted optional source. Rebuilt by `renderEnableSources()`.
    enableEl = el('div', 'enable-sources');
    enableEl.style.display = 'none';

    card.append(inputRow, hintEl, listEl, actionHintEl, enableEl);
    scrim.append(card);
    shadow.append(scrim);

    scrim.addEventListener('mousedown', (e) => {
      if (e.target === scrim) close();
    });
    input.addEventListener('input', onInput);
    input.addEventListener('keydown', onKeydown);

    // Keep keystrokes typed into the open launcher from leaking to the host page.
    // The CLOSED shadow root retargets bubbled events to the host element, so a
    // page's single-key shortcut handler (Gmail "q", Linear "b", …) sees a
    // non-input target and fires — or `preventDefault`s the key, so the character
    // never reaches our input. Stopping propagation at the overlay root (bubble
    // phase) means page document/window keyboard handlers never see keys meant
    // for the launcher; the input still receives them (we never `preventDefault`
    // here, and our own `onKeydown` on the input has already run by this point).
    const swallowKey = (e: Event): void => e.stopPropagation();
    scrim.addEventListener('keydown', swallowKey);
    scrim.addEventListener('keypress', swallowKey);
    scrim.addEventListener('keyup', swallowKey);

    // Dismiss-on-blur (launcher-sidebar-focus-reach D5): close when focus leaves
    // the overlay. In the closed shadow an intra-overlay focus move retargets
    // relatedTarget to the host, so shouldDismissOnFocusOut keeps it open then.
    host.addEventListener('focusout', onFocusOut);
  }

  function open(
    winId: number,
    hue?: number,
    chroma?: number,
    l?: number,
    eng?: SearchEngine[],
  ): void {
    const gen = ++openGen;
    windowId = winId;
    // The keydown fallback opens with the `-1` sentinel (no SW message payload to
    // read the id from) — resolve the real window id on demand. The SW-command
    // path passes a real id and skips the request.
    windowIdResolved = windowId === -1 ? resolveWindowId(gen) : null;
    if (!host) build();
    if (host && !host.isConnected) document.documentElement.appendChild(host);
    // Tint from the canonical OKLCH the SW attached to the open message (command
    // path). The keydown path opens with no tint and learns it from the
    // current-window response (see resolveWindowId) — until then the default
    // accent stands.
    applySpaceTint(hue, chroma, l);
    // Density: kick off the one-time read (first open) and apply the cached
    // value to the host BEFORE rendering rows, so the comfort two-line layout is
    // correct on first paint (the read resolving later reflows at most once).
    ensureDensity();
    applyDensity();
    // Capture the Tab-to-search registry the SW pushed (command path). The
    // keydown path opens with none and learns it from the current-window
    // response — until then Tab is inert.
    engines = eng ?? [];
    activeEngine = null;
    cycle = [];
    cycleIndex = 0;
    isOpen = true;
    results = [];
    ungrantedSources = [];
    selected = 0;
    if (input) input.value = '';
    render();
    renderEngineUi();
    queueMicrotask(() => input?.focus());
    // Never-got-focus guard (D5): if focus was refused (e.g. the overlay opened
    // behind a focused side panel), the input never becomes the shadow's
    // activeElement — self-close one frame later rather than linger unfocusable.
    // Reads the CLOSED shadow's activeElement (document.activeElement reports the
    // host). The openGen capture drops a stale guard from a superseded open.
    requestAnimationFrame(() => {
      if (openGen !== gen || !isOpen || !host?.isConnected) return;
      if (shadowRoot?.activeElement !== input) close();
    });
  }

  /**
   * Ask the SW which window this tab lives in and store it on `windowId`.
   * Content scripts cannot call `chrome.windows`, so the SW reads `sender.tab`
   * (the `lunma/current-window` request) on our behalf. Best-effort: on any
   * failure the `-1` sentinel stands (suggestions still work, just unscoped).
   */
  function resolveWindowId(gen: number): Promise<void> {
    return chrome.runtime
      .sendMessage({ type: 'lunma/current-window' })
      .then((res: unknown) => {
        // Stale resolver from a closed / superseded open — drop it so it can't
        // clobber the current window id or Space tint (latest-open wins).
        if (gen !== openGen) return;
        const payload = res as
          | {
              windowId?: number;
              spaceHue?: number;
              spaceChroma?: number;
              spaceL?: number;
              engines?: SearchEngine[];
            }
          | undefined;
        if (typeof payload?.windowId === 'number') windowId = payload.windowId;
        // The keydown-opened overlay learns its Space tint here (the SW resolves
        // it from sender.tab's window) and tints to match the command path. No
        // hue in the response → the default accent set on open stands.
        if (typeof payload?.spaceHue === 'number') {
          applySpaceTint(
            payload.spaceHue,
            typeof payload.spaceChroma === 'number' ? payload.spaceChroma : undefined,
            typeof payload.spaceL === 'number' ? payload.spaceL : undefined,
          );
        }
        // …and its Tab-to-search registry (mirrors the command path's open
        // payload). Refresh the hint in case the user has already typed a prefix.
        if (Array.isArray(payload?.engines)) {
          engines = payload.engines;
          renderEngineUi();
        }
      })
      .catch(() => undefined);
  }

  function close(): void {
    isOpen = false;
    // Invalidate any in-flight window-id/tint resolver so it can't settle after
    // close (or after the next open) and apply to a stale session.
    openGen++;
    if (host?.isConnected) host.remove();
    results = [];
    ungrantedSources = [];
    // Drop the active engine so a reopened overlay starts clean (Escape also
    // closes, so this covers Escape-clears-the-engine per the keyboard model).
    activeEngine = null;
    cycle = [];
    cycleIndex = 0;
    if (debounce) clearTimeout(debounce);
  }

  /** Dismiss-on-blur (D5): close when a focusout moves focus out of the overlay. */
  function onFocusOut(e: FocusEvent): void {
    if (isOpen && shouldDismissOnFocusOut(host, e.relatedTarget as Node | null)) close();
  }

  /** Dismiss on whole-window blur (tab switch / app switch), where a focusout's
   * relatedTarget is null and may not fire on the host. */
  function onWindowBlur(): void {
    if (isOpen) close();
  }

  function toggle(
    winId: number,
    hue?: number,
    chroma?: number,
    l?: number,
    eng?: SearchEngine[],
  ): void {
    if (isOpen) close();
    else open(winId, hue, chroma, l, eng);
  }

  /** True for page elements that own keyboard input — `input`, `textarea`, or
   * any `contenteditable` host. The closed overlay defers `Alt+L` to these so it
   * never steals a keystroke from a web app's editor. */
  function isEditableTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    const tag = target.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable;
  }

  /**
   * Page-level `Alt+L` fallback — toggles the overlay independently of the
   * `chrome.commands` binding, which Chrome routinely leaves unset (design D1).
   * Capture phase so pages that `stopPropagation()` on bubble-phase keydown
   * can't swallow it. Matches the physical key `code === 'KeyL'` (not `e.key`)
   * because macOS Option turns `key` into a dead-key glyph. Non-intrusive: acts
   * only on a clean `Alt+L`, defers to page editors while closed, and calls
   * `preventDefault`/`stopPropagation` ONLY when it actually toggles.
   */
  function onGlobalKeydown(e: KeyboardEvent): void {
    if (!e.altKey || e.code !== 'KeyL' || e.ctrlKey || e.metaKey) return;
    if (!isOpen && isEditableTarget(e.target)) return; // page keeps the key
    e.preventDefault();
    e.stopPropagation();
    toggle(-1);
  }

  function onInput(): void {
    const q = input?.value ?? '';
    if (debounce) clearTimeout(debounce);
    // Engine mode: the single row is a pure function of (engine, query); skip the
    // SW round-trip and rebuild it locally.
    if (activeEngine) {
      renderEngineMode();
      return;
    }
    renderEngineUi(); // refresh the "⇥ Tab" hint for the current prefix
    if (q.trim() === '') {
      results = [];
      ungrantedSources = [];
      selected = 0;
      render();
      return;
    }
    debounce = setTimeout(() => {
      void runQuery(q);
    }, DEBOUNCE_MS);
  }

  /** Build the single engine-mode action row locally (design D3) and render it;
   * an empty query renders the chip with no row. */
  function renderEngineMode(): void {
    const q = (input?.value ?? '').trim();
    results = activeEngine && q !== '' ? [engineResult(activeEngine, q)] : [];
    // Engine mode is a client-built fresh search — no SW round-trip, so no
    // dedup signal applies (tab-dedup): never flag the engine row as open, and no
    // ungranted-source affordance (that rides the default-mode suggestions).
    openUrls = new Set();
    ungrantedSources = [];
    selected = 0;
    render();
    renderEngineUi();
  }

  function engineResult(engine: SearchEngine, query: string): LauncherResult {
    return {
      id: 'websearch',
      source: 'websearch',
      title: `Search ${engine.name} for "${query}"`,
      url: buildSearchUrl(engine, query),
      score: 0,
    };
  }

  /** The favicon URL for an engine — its domain, via the shared favicon helper
   * (the same source the result rows use). */
  function engineIcon(engine: SearchEngine): string {
    return faviconUrl(buildSearchUrl(engine, ''), 16);
  }

  /** The quiet hint model: recognized engine(s) before locking, the cycle
   * alternatives once locked, or null (hidden). */
  function hintModel(): { verb: string; list: SearchEngine[] } | null {
    if (activeEngine) {
      if (cycle.length <= 1) return null;
      return { verb: 'Tab to switch', list: cycle };
    }
    const { candidates } = resolveEngine(input?.value ?? '', engines);
    if (candidates.length === 0) return null;
    return { verb: candidates.length === 1 ? 'Tab to search' : 'Tab to cycle', list: candidates };
  }

  /** Sync the engine chip (favicon + label + visibility) and the Tab hint
   * (favicon + name per candidate) to current state. */
  function renderEngineUi(): void {
    if (chipEl && chipIconEl && chipLabelEl && chipRemoveEl) {
      if (activeEngine) {
        chipIconEl.src = engineIcon(activeEngine);
        chipLabelEl.textContent = activeEngine.name;
        chipRemoveEl.setAttribute('aria-label', `Exit ${activeEngine.name} search`);
        chipEl.style.display = '';
      } else {
        chipEl.style.display = 'none';
      }
    }
    if (hintEl && hintVerbEl && hintEnginesEl) {
      const model = hintModel();
      if (model) {
        hintVerbEl.textContent = model.verb;
        hintEnginesEl.textContent = '';
        model.list.forEach((engine, i) => {
          if (i > 0) {
            const sep = el('span', 'hint-sep');
            sep.textContent = '·';
            hintEnginesEl?.append(sep);
          }
          const item = el('span', 'hint-engine');
          const icon = document.createElement('img');
          icon.className = 'hint-icon';
          icon.width = 14;
          icon.height = 14;
          icon.alt = '';
          withGlobeFallback(icon); // engine favicon → globe on load error
          icon.src = engineIcon(engine);
          const name = document.createElement('span');
          name.textContent = engine.name;
          item.append(icon, name);
          hintEnginesEl?.append(item);
        });
        hintEl.style.display = '';
      } else {
        hintEl.style.display = 'none';
      }
    }
  }

  /** Tab — the only opt-in. No engine + a recognized prefix → lock the first
   * candidate (remainder becomes the query). Engine + ambiguous prefix → cycle
   * (Shift+Tab reverses). Nothing recognized → don't intercept (focus traverses). */
  function handleTab(e: KeyboardEvent): void {
    if (!activeEngine) {
      // Shift+Tab with no engine active is backward focus traversal, never
      // activation — only forward Tab opts in (cycling Shift+Tab needs an engine).
      if (e.shiftKey) return;
      const { candidates, query: rest } = resolveEngine(input?.value ?? '', engines);
      if (candidates.length === 0) return; // let Tab traverse
      e.preventDefault();
      cycle = candidates;
      cycleIndex = 0;
      activeEngine = candidates[0] ?? null;
      if (input) input.value = rest;
      if (debounce) clearTimeout(debounce);
      // Invalidate any in-flight default-mode suggestions request so a late
      // response can't clobber the engine-mode row (the `latest` guard).
      latest++;
      renderEngineMode();
      return;
    }
    if (cycle.length > 1) {
      e.preventDefault();
      const delta = e.shiftKey ? -1 : 1;
      cycleIndex = (cycleIndex + delta + cycle.length) % cycle.length;
      activeEngine = cycle[cycleIndex] ?? activeEngine;
      renderEngineMode();
    }
    // Single-candidate engine: don't trap Tab — focus traverses normally.
  }

  /** Pop the active engine (chip removed), keeping focus + the typed query (which
   * falls back to a plain search). Backspace-on-empty lands on the empty home. */
  function popEngine(): void {
    activeEngine = null;
    cycle = [];
    cycleIndex = 0;
    // Invalidate any in-flight request before re-entering default mode.
    latest++;
    const q = input?.value ?? '';
    if (debounce) clearTimeout(debounce);
    if (q.trim() === '') {
      results = [];
      openUrls = new Set();
      ungrantedSources = [];
      selected = 0;
    } else {
      debounce = setTimeout(() => {
        void runQuery(q);
      }, DEBOUNCE_MS);
    }
    render();
    renderEngineUi();
    input?.focus();
  }

  async function runQuery(q: string): Promise<void> {
    const mine = ++latest;
    // Wait for the keydown-path window-id resolution so the request carries the
    // real id, not `-1`. No-op (resolved/null) on the SW-command path.
    if (windowIdResolved) await windowIdResolved;
    if (mine !== latest) return; // superseded while resolving the window id
    const requestId = crypto.randomUUID();
    try {
      const res: unknown = await chrome.runtime.sendMessage({
        type: 'lunma/launcher-suggestions-request',
        requestId,
        query: q,
        windowId,
      });
      if (mine !== latest) return; // stale — superseded by a newer keystroke
      const payload = res as
        | { results?: unknown; openUrls?: unknown; ungrantedSources?: unknown }
        | undefined;
      results = Array.isArray(payload?.results) ? (payload.results as LauncherResult[]) : [];
      openUrls = new Set(Array.isArray(payload?.openUrls) ? (payload.openUrls as string[]) : []);
      ungrantedSources = Array.isArray(payload?.ungrantedSources)
        ? (payload.ungrantedSources as OptionalResultSource[])
        : [];
      selected = 0;
      render();
    } catch {
      if (mine === latest) {
        results = [];
        openUrls = new Set();
        ungrantedSources = [];
        render();
      }
    }
  }

  function onKeydown(e: KeyboardEvent): void {
    // Tab-to-search (launcher-tab-to-search): Tab activates/cycles a recognized
    // engine; Backspace on an empty engine-mode query pops the chip.
    if (e.key === 'Tab') {
      handleTab(e);
      return;
    }
    if (e.key === 'Backspace' && activeEngine && (input?.value ?? '') === '') {
      e.preventDefault();
      popEngine();
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      move(1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      move(-1);
    } else if (e.key === 'Enter') {
      const r = results[selected];
      if (r) {
        e.preventDefault();
        act(r, { shiftKey: e.shiftKey });
      }
    }
  }

  function move(delta: number): void {
    const n = results.length;
    if (n === 0) return;
    selected = (selected + delta + n) % n; // wrap at both ends
    applySelection();
  }

  /** Tab-dedup: is `r`'s URL already open in the active Space? Only dedup-eligible
   * sources are ever flagged; `openUrls` membership is the stateless overlay's
   * only signal. */
  function isResultAlreadyOpen(r: LauncherResult): boolean {
    return isDedupEligibleSource(r.source) && openUrls.has(r.url);
  }

  function render(): void {
    if (!listEl) return;
    listEl.textContent = '';
    // Combobox `aria-expanded` reflects whether options are shown to AT.
    input?.setAttribute('aria-expanded', results.length > 0 ? 'true' : 'false');
    if (results.length === 0) {
      input?.removeAttribute('aria-activedescendant');
      if (input && input.value.trim() !== '') {
        const empty = el('p', 'empty');
        empty.textContent = 'No matches';
        listEl.append(empty);
      }
      updateActionHint();
      renderEnableSources();
      return;
    }
    results.forEach((r, i) => {
      const row = document.createElement('button');
      row.type = 'button';
      const open = isResultAlreadyOpen(r);
      row.className = `row${i === selected ? ' selected' : ''}${open ? ' already-open' : ''}`;
      // Listbox option semantics + a stable id for `aria-activedescendant`.
      row.id = optionId(i);
      row.setAttribute('role', 'option');
      row.setAttribute('aria-selected', i === selected ? 'true' : 'false');
      row.title = r.url;
      // Mirror ResultRow's `data-source` hook (incl. `smart`) for cross-surface
      // parity; the badge itself stays source-agnostic — no per-source colour
      // token (launcher-fuzzy-smart-folders, Visual language).
      row.dataset.source = r.source;
      const img = document.createElement('img');
      img.className = 'favicon';
      img.width = 16;
      img.height = 16;
      img.alt = '';
      withGlobeFallback(img); // set BEFORE src so a cached failure still swaps
      img.src = faviconUrl(r.url, 16);
      // The title cell stacks the title over the optional "already open" line —
      // the vanilla mirror of the Svelte ResultRow's `.title-block`.
      const titleBlock = el('span', 'title-block');
      const title = el('span', 'title');
      title.textContent = r.title;
      titleBlock.append(title);
      if (open) {
        const openLabel = el('span', 'already-open');
        openLabel.textContent = 'already open';
        titleBlock.append(openLabel);
      }
      // The trailing meta cluster: an optional cross-Space chip, then the source
      // badge — the vanilla mirror of ResultRow's `.meta`.
      const meta = el('span', 'meta');
      if (r.spaceName) {
        const chip = el('span', 'space-chip');
        chip.title = `In ${r.spaceName}`;
        const dot = el('span', 'space-dot');
        if (r.spaceColor) dot.style.background = r.spaceColor;
        const spaceName = el('span', 'space-name');
        spaceName.textContent = r.spaceName;
        chip.append(dot, spaceName);
        meta.append(chip);
      }
      const badge = el('span', 'badge');
      badge.textContent = sourceBadgeLabel(r.source);
      meta.append(badge);
      const url = el('span', 'url');
      url.textContent = r.url;
      row.append(img, titleBlock, meta, url);
      row.addEventListener('mouseenter', () => {
        selected = i;
        applySelection();
      });
      row.addEventListener('click', (e) => act(r, { shiftKey: e.shiftKey }));
      listEl?.append(row);
    });
    // Point the combobox at the freshly-rendered active option.
    input?.setAttribute('aria-activedescendant', optionId(selected));
    updateActionHint();
    renderEnableSources();
  }

  function applySelection(): void {
    if (!listEl) return;
    const rows = listEl.querySelectorAll<HTMLElement>('.row');
    rows.forEach((row, i) => {
      const isSel = i === selected;
      row.classList.toggle('selected', isSel);
      row.setAttribute('aria-selected', isSel ? 'true' : 'false');
    });
    // Move the combobox's active-descendant pointer with the selection.
    if (rows[selected]) input?.setAttribute('aria-activedescendant', optionId(selected));
    rows[selected]?.scrollIntoView({ block: 'nearest' });
    updateActionHint();
  }

  /** Refresh the footer action hint (tab-dedup) for the focused row: "↵ Switch
   * ⇧↵ New tab" when it is already open, "↵ Open" otherwise, hidden when there
   * are no results. */
  function updateActionHint(): void {
    if (!actionHintEl) return;
    const focused = results[selected];
    if (!focused) {
      actionHintEl.style.display = 'none';
      actionHintEl.textContent = '';
      return;
    }
    actionHintEl.textContent = '';
    const add = (kbd: string, verb: string): void => {
      const k = el('span', 'action-kbd');
      k.textContent = kbd;
      const v = el('span', 'action-verb');
      v.textContent = verb;
      actionHintEl?.append(k, v);
    };
    if (isResultAlreadyOpen(focused)) {
      add('↵', 'Switch');
      actionHintEl.append(el('span', 'action-sep'));
      add('⇧↵', 'New tab');
    } else {
      add('↵', 'Open');
    }
    actionHintEl.style.display = '';
  }

  /** "Enable history results" / "Enable bookmark results". */
  const ENABLE_LABEL: Record<OptionalResultSource, string> = {
    history: 'Enable history results',
    bookmarks: 'Enable bookmark results',
  };

  /**
   * Rebuild the "Enable ⟨source⟩ results" strip (least-privilege-permissions D5):
   * one button per ungranted optional source the SW reported, shown only with a
   * non-empty default-mode query. A click routes to the options page via the SW —
   * the overlay is a content script and cannot call `chrome.permissions`.
   */
  function renderEnableSources(): void {
    if (!enableEl) return;
    enableEl.textContent = '';
    if (activeEngine || (input?.value ?? '').trim() === '' || ungrantedSources.length === 0) {
      enableEl.style.display = 'none';
      return;
    }
    for (const src of ungrantedSources) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'enable-source';
      btn.textContent = ENABLE_LABEL[src];
      btn.addEventListener('click', () => openOptionsForGrant(src));
      enableEl.append(btn);
    }
    enableEl.style.display = '';
  }

  /** Route "Enable …" to the options page's grant control via the SW (the
   * overlay cannot touch `chrome.permissions`). Fire-and-forget, then close. */
  function openOptionsForGrant(source: OptionalResultSource): void {
    void chrome.runtime
      .sendMessage({ type: 'lunma/open-options-grant', source })
      .catch(() => undefined);
    close();
  }

  /**
   * Dispatch a command over the bus protocol (the SW's bus-adapter handles the
   * `lunma/command` envelope). Fire-and-forget — the overlay ignores the ack.
   *
   * Documented raw-send exception (typed-message-bus / `validate-bus-payloads`):
   * the shared `dispatch`/`bus.send` helpers are the sanctioned path for every
   * sidebar surface, but the overlay is the standing exception. It deliberately
   * does NOT import the `bus` singleton (that bundles the logger and blows the
   * <15KB-gzip content-script budget — see the file header) and wires no bus ack
   * listener, so a `bus.send` here would sit in the correlation map and time out
   * after 10s rather than resolve. It therefore speaks the `lunma/command` wire
   * envelope directly, fire-and-forget. The SW adapter still validates the
   * payload, so the security boundary is unchanged.
   */
  function dispatch(cmd: SidebarCommand): void {
    void chrome.runtime
      .sendMessage({ type: 'lunma/command', id: `ov:${crypto.randomUUID()}`, cmd })
      .catch(() => undefined);
  }

  function act(r: LauncherResult, modifiers?: { shiftKey: boolean }): void {
    switch (r.source) {
      case 'tab':
        if (r.tabId !== undefined) dispatch({ kind: 'focusTab', payload: { tabId: r.tabId } });
        break;
      case 'saved':
        if (r.savedTabId === undefined) break;
        // A bound saved result carries `tabId` (provider sets it) → focus it.
        if (r.tabId !== undefined) {
          dispatch({ kind: 'focusSavedTab', payload: { savedTabId: r.savedTabId, windowId } });
        } else {
          dispatch({ kind: 'openSavedTab', payload: { savedTabId: r.savedTabId, windowId } });
        }
        break;
      default: // 'smart' | 'bookmark' | 'history' | 'websearch' | 'navigate' — all carry a url
        // Shift+Enter forces a NEW tab, bypassing dedup (tab-dedup).
        dispatch({
          kind: 'openUrl',
          payload: { url: r.url, windowId, ...(modifiers?.shiftKey ? { force: true } : {}) },
        });
    }
    close();
  }

  chrome.runtime.onMessage.addListener((msg: unknown) => {
    const m = msg as {
      type?: string;
      windowId?: number;
      spaceHue?: number;
      spaceChroma?: number;
      spaceL?: number;
      engines?: SearchEngine[];
    } | null;
    if (m?.type === 'lunma/toggle-launcher') {
      toggle(
        typeof m.windowId === 'number' ? m.windowId : -1,
        typeof m.spaceHue === 'number' ? m.spaceHue : undefined,
        typeof m.spaceChroma === 'number' ? m.spaceChroma : undefined,
        typeof m.spaceL === 'number' ? m.spaceL : undefined,
        Array.isArray(m.engines) ? m.engines : undefined,
      );
    }
  });

  // Page-level Alt+L fallback (design D1) — capture phase so it survives pages
  // that stop bubble-phase propagation, and so it works with or without the
  // `chrome.commands` shortcut bound.
  document.addEventListener('keydown', onGlobalKeydown, true);
  // Dismiss-on-blur (launcher-sidebar-focus-reach D5): whole-window blur closes the
  // open overlay (tab switch / app switch); the host focusout covers focus leaving
  // within the page. Registered once, like the keydown above.
  window.addEventListener('blur', onWindowBlur);
})();
