import { defineCustomClientStrategy, getLocale, type Locale, locales } from './paraglide/runtime';
import { readSettings, type SupportedLocale, writeSetting } from './settings';

/**
 * The single source of truth for **locale state** (resolution, persistence, the
 * active locale) across every extension surface. Surfaces obtain locale state
 * only through this module — never by calling the generated Paraglide runtime's
 * locale APIs directly. (They MAY import message functions `m.*` to render
 * strings; the constraint is on locale *control*, not message *rendering*.)
 *
 * Paraglide's `getLocale()` is synchronous, but Lunma's source of truth — the
 * `language` setting in `chrome.storage.sync` — is async. The bridge is a
 * module-level `cached` locale that `initLocale()` fills (awaiting the settings
 * read) inside each surface's pre-`mount()` seam. Until it is seeded (e.g. under
 * jsdom in unit tests, where `chrome.storage` is absent), the custom strategy's
 * `getLocale()` returns `undefined`, so Paraglide falls through to `baseLocale`
 * (`en`) — keeping English-asserting tests green.
 *
 * SW-safety (design D3): the resolver references only `chrome.i18n` and
 * `navigator` (both present in the service worker), never `window`, `document`,
 * or `localStorage`. The Paraglide strategy array is `['custom-lunmaSettings',
 * 'baseLocale']` only; the default `url`/`cookie`/`localStorage` strategies
 * would throw in the SW and are deliberately excluded.
 */

// In-memory mirror of the active locale; `undefined` until `initLocale()` runs.
let cached: Locale | undefined;

// Register the SW-safe strategy at MODULE LOAD (import-for-side-effect) so it is
// in place before any message function evaluates `getLocale()`. `getLocale`
// reads the in-memory cache; `setLocale` updates ONLY that cache.
defineCustomClientStrategy('custom-lunmaSettings', {
  getLocale: () => cached,
  // Update the in-memory cache only — do NOT persist here. Paraglide's
  // `getLocale()` self-heals on its first call by invoking `setLocale(resolved,
  // { reload: false })` (runtime `localeInitiallySet` path); if that wrote to
  // storage it would clobber the stored `'auto'` sentinel with the resolved
  // concrete locale on the very first `m.*` render — permanently de-selecting
  // "System" and firing a spurious first-paint reload (the `watchSettings` guard
  // would see an `auto → de` delta). Persistence is owned solely by the exported
  // `setLocale` wrapper below (the Options picker path).
  setLocale: (locale) => {
    cached = locale as Locale;
  },
});

export { getLocale };

/** A stored `language` value: a concrete supported locale or the `'auto'`
 * sentinel ("resolve from the browser locale on first run"). */
type LanguagePreference = SupportedLocale | 'auto';

// A browser base-language tag → nearest supported locale. Locales that exist
// only as a regional variant map their base tag here (`pt → pt-PT`,
// `zh → zh-CN`); base tags that are themselves supported map to themselves.
const BASE_TAG_TO_LOCALE: Record<string, SupportedLocale> = {
  en: 'en',
  es: 'es',
  fr: 'fr',
  de: 'de',
  ja: 'ja',
  ko: 'ko',
  ru: 'ru',
  pt: 'pt-PT',
  zh: 'zh-CN',
};

/** Map a browser UI language tag (e.g. `de-DE`, `pt-BR`, `zh-TW`) to the nearest
 * supported locale, or `undefined` when none matches. Pure and SW-safe. */
function matchSupportedLocale(tag: string): SupportedLocale | undefined {
  const lower = tag.toLowerCase();
  // Exact match first (e.g. `pt-pt` → `pt-PT`, `zh-cn` → `zh-CN`).
  const exact = locales.find((locale) => locale.toLowerCase() === lower);
  if (exact) return exact;
  // Otherwise fall back to the base tag (`de-DE` → `de`, `pt-BR` → `pt → pt-PT`).
  const base = lower.split('-')[0];
  return base ? BASE_TAG_TO_LOCALE[base] : undefined;
}

/** Resolve a stored preference to a concrete locale. A concrete locale is
 * returned as-is; `'auto'` resolves from the browser UI language
 * (`chrome.i18n.getUILanguage()`, falling back to `navigator.language`), with
 * the base locale `en` as the terminal fallback. */
function resolvePreference(language: LanguagePreference): Locale {
  if (language !== 'auto') return language;
  const uiLanguage =
    (typeof chrome !== 'undefined' ? chrome.i18n?.getUILanguage?.() : undefined) ??
    (typeof navigator !== 'undefined' ? navigator.language : undefined);
  return (uiLanguage ? matchSupportedLocale(uiLanguage) : undefined) ?? 'en';
}

/** Seed the in-memory locale from the persisted `language` setting. Called in
 * each surface's pre-`mount()` boot so the first painted frame is localized. */
export async function initLocale(): Promise<void> {
  const { language } = await readSettings();
  cached = resolvePreference(language);
}

/** Re-seed the in-memory locale from a `language` value (resolving `'auto'` the
 * same way as `initLocale`). Called by a surface's `watchSettings` reload path
 * when the `language` setting changes. */
export function applyLocaleFromSettings(language: LanguagePreference): void {
  cached = resolvePreference(language);
}

/** Persist and apply a locale choice. Accepts the `'auto'` sentinel (Paraglide's
 * own `setLocale` is typed to concrete locales only), so the Options picker can
 * route every option — including "System" — through one path. Persistence is via
 * `writeSetting('language', …)`; the reload is owned by each surface's gated
 * `watchSettings` callback (design D6), so callers pass `{ reload: false }` and
 * this function never reloads. */
export function setLocale(language: LanguagePreference, _options?: { reload?: boolean }): void {
  cached = resolvePreference(language);
  void writeSetting('language', language);
}
