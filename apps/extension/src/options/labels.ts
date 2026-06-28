import { m } from '../shared/paraglide/messages';
import type { Settings } from '../shared/settings';

/**
 * Localized labels for the settings controls and groups (i18n,
 * `localize-extension-ui` D2). This indirection lives in `options/` — NOT in
 * `shared/settings.ts` — on purpose: it imports the Paraglide message catalog,
 * and routing that through `settings.ts` would form the `settings → i18n` import
 * cycle the foundation deliberately avoids (`add-i18n-foundation` D4). `settings.ts`
 * keeps its literal `label`/`description` as the declaration shape + the
 * non-localized fallback; `Options.svelte` renders through the functions here.
 *
 * The endonym option labels of the `language` setting stay literal in
 * `settings.ts` (a language name is shown in its own language).
 */

type MessageThunk = () => string;

/** Per-setting control label. Every key in `Settings` has one. */
const SETTING_LABELS: Record<keyof Settings, MessageThunk> = {
  language: m.options_label_language,
  defaultSearchEngine: m.options_label_defaultSearchEngine,
  customSearchUrl: m.options_label_customSearchUrl,
  customSearchKeyword: m.options_label_customSearchKeyword,
  launcherScope: m.options_label_launcherScope,
  density: m.options_label_density,
  tint: m.options_label_tint,
  theme: m.options_label_theme,
  showGlares: m.options_label_showGlares,
  reduceMotion: m.options_label_reduceMotion,
  dedupNewTabNavigations: m.options_label_dedupNewTabNavigations,
  pinnedTabBoundaryDefault: m.options_label_pinnedTabBoundaryDefault,
  autoArchiveEnabled: m.options_label_autoArchiveEnabled,
  autoArchiveIdleMinutes: m.options_label_autoArchiveIdleMinutes,
  autoArchiveRetentionDays: m.options_label_autoArchiveRetentionDays,
};

/** Per-setting one-line description. Every key in `Settings` has one. */
const SETTING_DESCRIPTIONS: Record<keyof Settings, MessageThunk> = {
  language: m.options_desc_language,
  defaultSearchEngine: m.options_desc_defaultSearchEngine,
  customSearchUrl: m.options_desc_customSearchUrl,
  customSearchKeyword: m.options_desc_customSearchKeyword,
  launcherScope: m.options_desc_launcherScope,
  density: m.options_desc_density,
  tint: m.options_desc_tint,
  theme: m.options_desc_theme,
  showGlares: m.options_desc_showGlares,
  reduceMotion: m.options_desc_reduceMotion,
  dedupNewTabNavigations: m.options_desc_dedupNewTabNavigations,
  pinnedTabBoundaryDefault: m.options_desc_pinnedTabBoundaryDefault,
  autoArchiveEnabled: m.options_desc_autoArchiveEnabled,
  autoArchiveIdleMinutes: m.options_desc_autoArchiveIdleMinutes,
  autoArchiveRetentionDays: m.options_desc_autoArchiveRetentionDays,
};

/** Group heading + its one-line intro, keyed by the declaration `group` string. */
const GROUP_LABELS: Record<string, MessageThunk> = {
  'Search & launcher': m.options_groupLabel_search,
  Appearance: m.options_groupLabel_appearance,
  Tabs: m.options_groupLabel_tabs,
  'Auto-archive': m.options_groupLabel_autoArchive,
};

const GROUP_INTROS: Record<string, MessageThunk> = {
  'Search & launcher': m.options_searchGroupIntro,
  Appearance: m.options_appearanceGroupIntro,
  Tabs: m.options_tabsGroupIntro,
  'Auto-archive': m.options_autoArchiveGroupIntro,
};

/** Localized label for a setting control. */
export function settingLabel(key: keyof Settings): string {
  return SETTING_LABELS[key]();
}

/** Localized one-line description for a setting control. */
export function settingDescription(key: keyof Settings): string {
  return SETTING_DESCRIPTIONS[key]();
}

/** Localized heading for a settings group (falls back to the raw group name). */
export function groupLabel(group: string): string {
  return GROUP_LABELS[group]?.() ?? group;
}

/** Localized one-line intro shown under a group heading (empty when none). */
export function groupIntro(group: string): string {
  return GROUP_INTROS[group]?.() ?? '';
}

// Localized enum OPTION labels, keyed by setting then option value. Options not
// listed fall back to their declared literal label — used for proper nouns that
// don't translate: the built-in search-engine names (`defaultSearchEngine`) and
// the `language` picker's endonyms (a language shown in its own name). Lives here,
// not in `settings.ts`, for the same no-`settings → i18n`-edge reason as the
// control labels.
const OPTION_LABELS: Partial<Record<keyof Settings, Record<string, MessageThunk>>> = {
  language: { auto: m.options_language_system },
  defaultSearchEngine: { custom: m.options_engine_custom },
  launcherScope: {
    global: m.options_scope_global,
    'prefer-current-space': m.options_scope_preferCurrent,
    'current-space-only': m.options_scope_currentOnly,
  },
  density: {
    compact: m.options_density_compact,
    normal: m.options_density_normal,
    comfort: m.options_density_comfort,
  },
  tint: {
    subtle: m.options_tint_subtle,
    standard: m.options_tint_standard,
    vivid: m.options_tint_vivid,
  },
  theme: { dark: m.options_theme_dark, light: m.options_theme_light },
  pinnedTabBoundaryDefault: {
    off: m.options_boundary_off,
    domain: m.options_boundary_domain,
    page: m.options_boundary_page,
  },
};

/** Localized label for one option of an enum setting, falling back to the
 * declared literal (for untranslated proper nouns — engine names, endonyms). */
export function optionLabel(key: keyof Settings, value: string, fallback: string): string {
  return OPTION_LABELS[key]?.[value]?.() ?? fallback;
}

/** Localized Off | On segments for a `toggle` setting's `SegmentedControl`
 * (replaces the literal `TOGGLE_SEGMENTS` at render time). */
export function toggleSegments(): { value: string; label: string }[] {
  return [
    { value: 'off', label: m.options_toggle_off() },
    { value: 'on', label: m.options_toggle_on() },
  ];
}
