// Boundary subsystem for pinned/favorite saved tabs (pinned-tab-domain-boundary),
// extracted from the coordinator (split-coordinator-handlers). Owns the cached
// global default, the per-tab boundary resolution + injection I/O, and the
// boot/settings refresh. Method bodies are verbatim moves of the former
// `Coordinator` members. Constructed with the store; mutates nothing in it.

import { log } from '../shared/logger';
import { sendBoundaryConfig } from '../shared/messages';
import type { LunmaStore } from '../shared/store.svelte';
import type { SavedTab, TabId } from '../shared/types';
import { resolveBoundaryAllow } from '../shared/url-boundary';
import { injectBoundary } from './boundary-injection';

export class BoundaryController {
  /**
   * The live global `pinnedTabBoundaryDefault` (pinned-tab-url-boundary). An
   * inheriting saved tab (no explicit `boundary`) resolves its allow-set against
   * this. Seeded from settings at SW boot and updated by the SW's settings
   * watcher via {@link setBoundaryDefault}; defaults to `'off'` until seeded.
   */
  private boundaryDefault: 'off' | 'domain' | 'page' = 'off';

  constructor(private readonly store: LunmaStore) {}

  /**
   * Update the cached global `pinnedTabBoundaryDefault` (pinned-tab-url-
   * boundary). The SW seeds this from `readSettings()` at boot and calls it again
   * from its settings watcher when the user flips the default. Does not itself
   * re-push config — the caller follows with {@link refreshBoundTabBoundaries}.
   */
  setBoundaryDefault(value: 'off' | 'domain' | 'page'): void {
    this.boundaryDefault = value;
  }

  /**
   * Re-resolve and re-push the boundary config for every currently-bound saved
   * tab (pinned-tab-domain-boundary). Called by the SW at boot — so a tab bound
   * by restart recovery (which predates the extension load and lacks the
   * declarative boundary script) gets the script injected and its allow-set
   * pushed — and whenever the global `pinnedTabBoundaryDefault` changes, so every
   * inheriting bound tab re-arms/disarms live. Each tab's `configureBoundary`
   * recomputes independently, so an explicit `off` tab simply stays free.
   *
   * Also covers lens item tabs (smart-tab-boundary): every slot whose
   * `allowGlob` is non-empty gets `configureLensItemBoundary` so a lens tab
   * open when the SW restarted regains enforcement on boot.
   */
  async refreshBoundTabBoundaries(): Promise<void> {
    const { tabBindings, savedTabs, lensItemBindings } = this.store.state;
    // Configure in PARALLEL so one slow/blocked injection can't stall the rest.
    // Each `configureBoundary` / `configureLensItemBoundary` swallows its own
    // errors (injection + send), so the `Promise.all` never rejects.
    const tasks: Promise<void>[] = [];
    for (const [savedTabId, slots] of Object.entries(tabBindings)) {
      const saved = savedTabs[savedTabId];
      if (!saved) continue;
      // A boundary is a property of the saved tab — arm/disarm EVERY window's
      // bound tab (per-window-tab-bindings, ADR 0003).
      for (const tabId of Object.values(slots)) {
        tasks.push(this.configureBoundary(tabId, saved));
      }
    }
    for (const byItem of Object.values(lensItemBindings)) {
      for (const slots of Object.values(byItem)) {
        for (const slot of Object.values(slots)) {
          if (slot.allowGlob) {
            tasks.push(this.configureLensItemBoundary(slot.tabId, slot.allowGlob));
          }
        }
      }
    }
    await Promise.all(tasks);
  }

  /**
   * Inject (when needed) and push the boundary allow-set for one lens item tab
   * (smart-tab-boundary). A no-op when `allowGlob` is empty (pre-migration slots
   * or non-http URLs that degraded to ''); otherwise injects the content script
   * and arms it with `[allowGlob]`. Never throws — a forbidden page or closed
   * receiver is benign, same as {@link configureBoundary}.
   */
  async configureLensItemBoundary(tabId: TabId, allowGlob: string): Promise<void> {
    if (!allowGlob) return;
    try {
      await injectBoundary(tabId);
      sendBoundaryConfig(tabId, [allowGlob]);
    } catch (err) {
      log.debug('configureLensItemBoundary: benign error', { tabId, err });
    }
  }

  /**
   * Effective boundary default for a saved tab on the ordered scope ladder
   * `off < domain < page` (pinned-tab-url-boundary). A Space-PINNED tab
   * (`spaceId !== null`) inherits the global `pinnedTabBoundaryDefault` directly.
   * A global FAVORITE (`spaceId === null`) is **never weaker than domain-locked** —
   * it resolves to `max(boundaryDefault, 'domain')`, so it stays anchored to its
   * own site with no per-record config (sidebar-favicon-row invariant), but a
   * global default of `'page'` makes favorites page-lock by default too. An
   * explicit per-tab `{ mode: 'off' }` still wins (it is not `undefined`), so a
   * user can unlock a specific favorite via the boundary editor.
   */
  effectiveBoundaryDefault(saved: SavedTab): 'off' | 'domain' | 'page' {
    if (saved.spaceId !== null) return this.boundaryDefault;
    // Global favorite: floor at 'domain' on the off < domain < page ladder.
    return this.boundaryDefault === 'page' ? 'page' : 'domain';
  }

  /**
   * Inject (when needed) and push the boundary allow-set for one bound tab
   * (pinned-tab-domain-boundary, design D6). With effective enforcement, inject
   * the boundary content script (idempotent via its install guard; a forbidden
   * page degrades to drift) then push the resolved allow-set; otherwise push
   * `null` so a previously-armed script disarms. Never throws — a forbidden page
   * or a closed receiver is benign (the boundary is still recorded in state).
   */
  async configureBoundary(tabId: TabId, saved: SavedTab): Promise<void> {
    const allow = resolveBoundaryAllow(
      saved.boundary,
      saved.originalURL,
      this.effectiveBoundaryDefault(saved),
    );
    if (allow === null) {
      sendBoundaryConfig(tabId, null);
      return;
    }
    await injectBoundary(tabId);
    sendBoundaryConfig(tabId, allow);
  }
}
