import type { OverlayLabels } from '../shared/launcher-contract';
import { m } from '../shared/paraglide/messages';

/**
 * Render the overlay's UI strings at the currently-resolved locale (i18n,
 * `localize-extension-ui` D3 — Plan B). The vanilla `Alt+L` overlay can't import
 * Paraglide (byte budget) or seed the locale synchronously, so the service worker
 * builds these here and ships them over `lunma/overlay-labels-request`. Call after
 * `initLocale()` has seeded the SW's locale cache so `m.*` resolves the right
 * language.
 *
 * `exitEngine` is rendered with the literal placeholder `{engine}` as its input,
 * so the returned string keeps `{engine}` for the overlay to fill in with the
 * active engine name (only known overlay-side).
 */
export function buildOverlayLabels(): OverlayLabels {
  return {
    dialogLabel: m.launcher_overlay_dialogLabel(),
    placeholder: m.launcher_overlay_placeholder(),
    searchAriaLabel: m.launcher_overlay_ariaLabel(),
    tabHintSearch: m.launcher_overlay_tabHintSearch(),
    tabHintCycle: m.launcher_overlay_tabHintCycle(),
    tabHintSwitch: m.launcher_overlay_tabHintSwitch(),
    exitEngine: m.launcher_overlay_exitEngine({ engine: '{engine}' }),
    noMatches: m.launcher_overlay_noMatches(),
    alreadyOpen: m.launcher_overlay_alreadyOpen(),
    switchAction: m.launcher_overlay_switch(),
    newTab: m.launcher_overlay_newTab(),
    open: m.launcher_overlay_open(),
    enableHistory: m.launcher_overlay_enableHistory(),
    enableBookmarks: m.launcher_overlay_enableBookmarks(),
  };
}
