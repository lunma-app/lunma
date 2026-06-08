import { colourToOklch } from '../shared/space-hue';
import type { AppState, SpaceColor, WindowId } from '../shared/types';

/**
 * The active Space's canonical OKLCH hue + chroma + lightness for a window — the
 * launcher overlay's open-path tint. An internal carrier shape (additive on the
 * wire as `spaceHue` / `spaceChroma` / `spaceL` on the `lunma/toggle-launcher`
 * and `lunma/current-window` messages). `l` lets the overlay render the Space's
 * TRUE colour (yellow light, blue deep) rather than a flat lightness.
 */
export interface SpaceTint {
  hue: number;
  chroma: number;
  l: number;
}

/**
 * Resolve the active Space's canonical OKLCH (hue + chroma + lightness) for
 * `windowId` from a read-only `AppState`, for the launcher overlay's open path.
 * Returns null when there is no active Space for the window, the Space record is
 * missing, or the Space is neutral (`gray`) — in all three cases the overlay
 * keeps its default accent (the launcher spec's unavailable-hue fallback). `gray`
 * returns null (NOT chroma 0) so the overlay's existing ember default stands
 * rather than a desaturated grey accent. Pure: no chrome / store / Date / random
 * access, so it unit-tests in isolation from the service-worker entry.
 */
export function resolveSpaceTint(state: AppState, windowId: WindowId): SpaceTint | null {
  const spaceId = state.activeSpaceByWindow[windowId];
  if (!spaceId) return null;
  const space = state.spaces.find((s) => s.id === spaceId);
  if (!space || space.color === 'gray') return null;
  const { l, c, h } = colourToOklch(space.color as SpaceColor);
  return { hue: h, chroma: c, l };
}
