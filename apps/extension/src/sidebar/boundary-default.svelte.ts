import type { PinnedTabBoundaryDefault } from '../shared/settings';

/**
 * Live sidebar mirror of the global `pinnedTabBoundaryDefault` setting
 * (pinned-tab-domain-boundary). Module-level reactive state (the same pattern as
 * `drag.svelte.ts`) so the locked-row indicator and the boundary editor's
 * "Inherit" caption reflect the live default without threading a prop through
 * the carousel. Seeded + kept in sync by the sidebar boot (`main.ts`) from
 * `readSettings()` + `watchSettings()`; defaults to `'off'` until seeded.
 */
export const boundaryDefault = $state<{ value: PinnedTabBoundaryDefault }>({ value: 'off' });
