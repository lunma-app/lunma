/**
 * Live sidebar mirror of the `showGlares` setting.
 * Module-level reactive state (same pattern as `boundary-default.svelte.ts`)
 * so App.svelte can reactively gate Aurora via `{#if}` without threading a prop
 * through the carousel. Seeded and kept in sync by main.ts from
 * readSettings() + watchSettings(). Defaults to `true` (effects on) until seeded.
 */
export const sidebarGlares = $state<{ value: boolean }>({ value: true });
