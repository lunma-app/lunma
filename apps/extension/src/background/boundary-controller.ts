// Boundary subsystem for pinned/favorite saved tabs (pinned-tab-domain-boundary),
// extracted from the coordinator (split-coordinator-handlers). Owns the cached
// global default, the per-tab boundary resolution + injection I/O, and the
// boot/settings refresh. Method bodies are verbatim moves of the former
// `Coordinator` members. Constructed with the store; mutates nothing in it.

import { sendBoundaryConfig } from '../shared/messages';
import type { LunmaStore } from '../shared/store.svelte';
import type { SavedTab, TabId } from '../shared/types';
import { resolveBoundaryAllow } from '../shared/url-boundary';
import { injectBoundary } from './boundary-injection';

export class BoundaryController {
  /**
   * The live global `pinnedTabBoundaryDefault` (pinned-tab-domain-boundary). An
   * inheriting saved tab (no explicit `boundary`) resolves its allow-set against
   * this. Seeded from settings at SW boot and updated by the SW's settings
   * watcher via {@link setBoundaryDefault}; defaults to `'off'` until seeded.
   */
  private boundaryDefault: 'off' | 'domain' = 'off';

  constructor(private readonly store: LunmaStore) {}

  /**
   * Update the cached global `pinnedTabBoundaryDefault` (pinned-tab-domain-
   * boundary). The SW seeds this from `readSettings()` at boot and calls it again
   * from its settings watcher when the user flips the default. Does not itself
   * re-push config — the caller follows with {@link refreshBoundTabBoundaries}.
   */
  setBoundaryDefault(value: 'off' | 'domain'): void {
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
   */
  async refreshBoundTabBoundaries(): Promise<void> {
    const { tabBindings, savedTabs } = this.store.state;
    // Configure in PARALLEL so one slow/blocked injection can't stall the rest.
    // Each `configureBoundary` swallows its own errors (injection + send), so the
    // `Promise.all` never rejects.
    const tasks: Promise<void>[] = [];
    for (const [savedTabId, slots] of Object.entries(tabBindings)) {
      const saved = savedTabs[savedTabId];
      if (!saved) continue;
      // A boundary is a property of the saved tab — arm/disarm EVERY window's
      // bound tab (per-window-tab-bindings, ADR 0009).
      for (const tabId of Object.values(slots)) {
        tasks.push(this.configureBoundary(tabId, saved));
      }
    }
    await Promise.all(tasks);
  }

  /**
   * Effective boundary default for a saved tab. Global FAVORITES (`spaceId === null`)
   * are **locked to their site by default** (domain-level) — a favorite's `undefined`
   * boundary resolves to `'domain'` regardless of the global `pinnedTabBoundaryDefault`
   * (sidebar-favicon-row, user request). Space-PINNED tabs inherit the global default.
   * An explicit per-tab `{ mode: 'off' }` still wins (it is not `undefined`), so a user
   * can unlock a specific favorite via the boundary editor.
   */
  effectiveBoundaryDefault(saved: SavedTab): 'off' | 'domain' {
    return saved.spaceId === null ? 'domain' : this.boundaryDefault;
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
