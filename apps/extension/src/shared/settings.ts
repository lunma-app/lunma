import { z } from 'zod';
import { log } from './logger';
import { BUILT_IN_ENGINES, type BuiltInEngineId } from './search-engines';

/**
 * Declarative user-settings engine.
 *
 * Settings are declared ONCE in `SETTINGS`. The Zod validation schema and the
 * `DEFAULTS` object are derived from those declarations at module load — never
 * maintained separately. The options page renders by grouping `SETTINGS` by
 * `group` and dispatching on `type`. Adding a setting is a single declaration.
 *
 * Persistence is a single object under `'lunma.settings'` in
 * `chrome.storage.sync`, accessed only through this module.
 */

const SETTINGS_KEY = 'lunma.settings';

export type DensityMode = 'compact' | 'normal' | 'comfort';
export type Tint = 'subtle' | 'standard' | 'vivid';
/** Global baseline for keeping pinned tabs on their site (pinned-tab-domain-
 * boundary). `'off'` = pins drift freely (today's behaviour); `'domain'` = a pin
 * with no explicit boundary is confined to its registrable domain. A per-tab
 * `boundary` overrides this either way. */
export type PinnedTabBoundaryDefault = 'off' | 'domain';
/** The launcher's default web-search engine: a built-in engine id (from
 * `search-engines.ts`) or `'custom'` (use `customSearchUrl`). */
export type DefaultSearchEngine = BuiltInEngineId | 'custom';

export interface Settings {
  density: DensityMode;
  tint: Tint;
  pinnedTabBoundaryDefault: PinnedTabBoundaryDefault;
  defaultSearchEngine: DefaultSearchEngine;
  customSearchUrl: string;
  customSearchKeyword: string;
  /** Master switch for auto-archive (auto-archive). `true` ⇒ the sweep runs and
   * each Space resolves its effective config; `false` ⇒ nothing is archived,
   * per-Space overrides moot. */
  autoArchiveEnabled: boolean;
  /** Global idle threshold in minutes before a temporary tab is archived
   * (auto-archive). A positive integer (floored at 1 by the sweep); a Space's
   * `custom` override supersedes it for that Space. */
  autoArchiveIdleMinutes: number;
  /** Retention TTL in days: an archived tab is permanently deleted this many days
   * after it was archived (auto-archive). A positive integer (floored at 1). The
   * ≤100-entry FIFO cap still applies independently and can evict sooner. */
  autoArchiveRetentionDays: number;
}

interface EnumOption {
  value: string;
  label: string;
}

export interface EnumSettingDeclaration {
  key: keyof Settings;
  type: 'enum';
  default: string;
  label: string;
  description?: string;
  group: string;
  options: EnumOption[];
}

/** A free-text setting (the first non-enum consumer). Rendered via the
 * `TextInput` primitive; its derived Zod is `z.string().catch(default)` so a
 * malformed stored value degrades to the default rather than failing the read. */
export interface TextSettingDeclaration {
  key: keyof Settings;
  type: 'text';
  default: string;
  label: string;
  description?: string;
  group: string;
  /** Optional placeholder shown in the empty field. */
  placeholder?: string;
}

/** A boolean toggle setting. Rendered via a two-segment `SegmentedControl`
 * (Off | On); its derived Zod is `z.boolean().catch(default)` so a malformed
 * stored value degrades to the default rather than failing the read. */
export interface ToggleSettingDeclaration {
  key: keyof Settings;
  type: 'toggle';
  default: boolean;
  label: string;
  description?: string;
  group: string;
}

/** A positive-integer setting. Rendered via a numeric `TextInput`; its derived
 * Zod is `z.number().int().catch(default)` with the declared `min` applied as a
 * floor where present. */
export interface NumberSettingDeclaration {
  key: keyof Settings;
  type: 'number';
  default: number;
  label: string;
  description?: string;
  group: string;
  /** Floor applied to a parsed value (both in the derived Zod and the options
   * renderer). */
  min?: number;
  /** Optional upper bound hint (not enforced by the derived Zod). */
  max?: number;
  /** Optional step hint for the numeric field. */
  step?: number;
  /** Optional placeholder shown in the empty field. */
  placeholder?: string;
}

/** Union of every declaration shape. The declaration `default` is
 * `string | boolean | number` across the union (each variant narrows it). `enum`,
 * `text`, `toggle`, and `number` all have renderers; further variants arrive with
 * their first consumer. */
export type SettingDeclaration =
  | EnumSettingDeclaration
  | TextSettingDeclaration
  | ToggleSettingDeclaration
  | NumberSettingDeclaration;

export const SETTINGS: readonly SettingDeclaration[] = [
  // Search leads the options page (the launcher is front-and-centre).
  {
    key: 'defaultSearchEngine',
    type: 'enum',
    default: 'google',
    label: 'Default search engine',
    description: 'Which engine the launcher searches a query with',
    group: 'Search',
    // Options derive from the built-in registry so adding an engine there flows
    // through to the picker automatically; `custom` uses `customSearchUrl`.
    options: [
      ...BUILT_IN_ENGINES.map((engine) => ({ value: engine.id, label: engine.name })),
      { value: 'custom', label: 'Custom' },
    ],
  },
  {
    key: 'customSearchUrl',
    type: 'text',
    default: '',
    label: 'Custom search URL',
    description: 'Used when the engine above is set to Custom — %s is the query',
    group: 'Search',
    placeholder: 'https://example.com/?q=%s',
  },
  {
    // Tab-to-search keyword for the custom engine (launcher-tab-to-search). Type
    // it as the leading token + Tab to search the custom engine. A keyword that
    // collides with a built-in (g, ddg, bing, brave, p, yt, w) is shadowed — the
    // built-in wins and the options page warns inline.
    key: 'customSearchKeyword',
    type: 'text',
    default: '',
    label: 'Custom search keyword',
    description: 'Type this + Tab in the launcher to search your custom engine',
    group: 'Search',
    placeholder: 'k',
  },
  {
    key: 'density',
    type: 'enum',
    default: 'normal',
    label: 'Density',
    description: 'How much space between tab rows',
    group: 'Appearance',
    options: [
      { value: 'compact', label: 'Compact' },
      { value: 'normal', label: 'Normal' },
      { value: 'comfort', label: 'Comfort' },
    ],
  },
  {
    key: 'tint',
    type: 'enum',
    default: 'vivid',
    label: 'Colour intensity',
    description: "How much the active Space's colour fills the workspace",
    group: 'Appearance',
    options: [
      { value: 'subtle', label: 'Subtle' },
      { value: 'standard', label: 'Standard' },
      { value: 'vivid', label: 'Vivid' },
    ],
  },
  {
    key: 'pinnedTabBoundaryDefault',
    type: 'enum',
    default: 'off',
    label: 'Lock pinned tabs to their site',
    description: 'New pins stay on their own domain; off-site links open in a new tab',
    group: 'Pinned tabs',
    options: [
      { value: 'off', label: 'Off' },
      { value: 'domain', label: 'Lock to domain' },
    ],
  },
  // Auto-archive (auto-archive): the master switch + the global idle threshold.
  // Owned by the auto-archive capability; the generic `toggle`/`number` rendering
  // is the settings capability's contribution.
  {
    key: 'autoArchiveEnabled',
    type: 'toggle',
    default: true,
    label: 'Auto-archive idle tabs',
    description: 'Quietly archive temporary tabs left idle so the workspace stays tidy',
    group: 'Auto-archive',
  },
  {
    key: 'autoArchiveIdleMinutes',
    type: 'number',
    default: 720,
    label: 'Idle minutes before archiving',
    description: 'How long a temporary tab sits unused before it’s archived (720 = 12h)',
    group: 'Auto-archive',
    min: 1,
    placeholder: '720',
  },
  {
    key: 'autoArchiveRetentionDays',
    type: 'number',
    default: 7,
    label: 'Keep archived tabs for (days)',
    description: 'After this many days an archived tab is permanently deleted',
    group: 'Auto-archive',
    min: 1,
    placeholder: '7',
  },
];

// --- derived defaults + schema ---------------------------------------------

/** `DEFAULTS` is built from the declared `default` of each setting. */
export const DEFAULTS: Settings = Object.fromEntries(
  SETTINGS.map((decl) => [decl.key, decl.default]),
) as unknown as Settings;

/** The Zod schema is built from the declarations, dispatching on `type`:
 * `enum → z.enum(values).catch(default)`, `text → z.string().catch(default)`,
 * `toggle → z.boolean().catch(default)`, and
 * `number → z.number().int().catch(default)` (with the declared `min` applied as
 * a floor where present). So an out-of-range / wrong-type stored value falls back
 * to that setting's declared default rather than failing the whole read. */
function buildSchema(): z.ZodType<Settings> {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const decl of SETTINGS) {
    if (decl.type === 'enum') {
      const values = decl.options.map((o) => o.value) as [string, ...string[]];
      shape[decl.key] = z.enum(values).catch(decl.default);
    } else if (decl.type === 'toggle') {
      shape[decl.key] = z.boolean().catch(decl.default);
    } else if (decl.type === 'number') {
      // Integer, floored at the declared `min` (a value below it clamps up,
      // rather than failing); a wrong-typed / absent value degrades to default.
      const min = decl.min;
      const num = z.number().int();
      shape[decl.key] = (min === undefined ? num : num.transform((n) => (n < min ? min : n))).catch(
        decl.default,
      );
    } else {
      shape[decl.key] = z.string().catch(decl.default);
    }
  }
  return z.object(shape) as unknown as z.ZodType<Settings>;
}

export const SettingsSchema = buildSchema();

// Compile-time guard (mirrors `src/shared/schemas.ts`): the derived schema's
// output type must match the exported `Settings` interface.
type AssertEqual<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
const _schemaMatchesSettings: AssertEqual<z.infer<typeof SettingsSchema>, Settings> = true;
void _schemaMatchesSettings;

// --- read / write / watch --------------------------------------------------

/** Read settings from `chrome.storage.sync`, parsed through the derived schema.
 * Returns `DEFAULTS` on absence, a malformed object, or any storage failure. */
export async function readSettings(): Promise<Settings> {
  try {
    const got = await chrome.storage.sync.get(SETTINGS_KEY);
    const parsed = SettingsSchema.safeParse(got[SETTINGS_KEY]);
    return parsed.success ? parsed.data : { ...DEFAULTS };
  } catch (err) {
    log.error('readSettings failed', { err });
    return { ...DEFAULTS };
  }
}

/** Merge a single field into the stored settings object and persist it. Never
 * rejects to the caller: a storage failure is caught and logged (the in-memory
 * selection still applies locally so the user isn't blocked). */
export async function writeSetting<K extends keyof Settings>(
  key: K,
  value: Settings[K],
): Promise<void> {
  try {
    const current = await readSettings();
    const next: Settings = { ...current, [key]: value };
    await chrome.storage.sync.set({ [SETTINGS_KEY]: next });
  } catch (err) {
    log.error('writeSetting failed', { err, key });
  }
}

/** Subscribe to settings changes from any surface. Filters to `sync` area and
 * the `'lunma.settings'` key, parses the new value, and invokes `cb`. Returns
 * an unsubscribe function. */
export function watchSettings(cb: (settings: Settings) => void): () => void {
  const listener = (
    changes: Record<string, chrome.storage.StorageChange>,
    areaName: string,
  ): void => {
    if (areaName !== 'sync') return;
    const change = changes[SETTINGS_KEY];
    if (!change) return;
    const parsed = SettingsSchema.safeParse(change.newValue);
    cb(parsed.success ? parsed.data : { ...DEFAULTS });
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
