<script lang="ts">
import { onMount } from 'svelte';
import { applyLocaleFromSettings, setLocale } from '../shared/i18n';
import { m } from '../shared/paraglide/messages';
import { BUILT_IN_ENGINES } from '../shared/search-engines';
import {
  DEFAULTS,
  readSettings,
  SETTINGS,
  type SettingDeclaration,
  type Settings,
  watchSettings,
  writeSetting,
} from '../shared/settings';
import { applyDensityToDocument, applyThemeToDocument } from '../shared/surface-boot';
import SegmentedControl from '../ui/SegmentedControl.svelte';
import Select from '../ui/Select.svelte';
import SettingsCard from '../ui/SettingsCard.svelte';
import SettingText from '../ui/SettingText.svelte';
import TextInput from '../ui/TextInput.svelte';
import BackupRestore from './BackupRestore.svelte';
import ConnectionsCard from './ConnectionsCard.svelte';
import {
  groupIntro,
  groupLabel,
  optionLabel,
  settingDescription,
  settingLabel,
  toggleSegments,
} from './labels';
import RecentlyArchived from './RecentlyArchived.svelte';
import ResultSourcesCard from './ResultSourcesCard.svelte';
import ShortcutGuidanceCard from './ShortcutGuidanceCard.svelte';
import '@lunma/tokens/tokens.css';
import '@lunma/tokens/fonts.css';
import '@lunma/tokens/recipes.css';

// Local mirror of the saved settings. Seeded with DEFAULTS so controls have a
// value before the async read resolves; replaced by the stored values on mount.
let settings = $state<Settings>({ ...DEFAULTS });

const version = chrome.runtime.getManifest().version;

// The privacy policy lives on the marketing site (apps/site), which never ships
// in the extension bundle — so the options page links out to its canonical URL.
// Mirrors apps/site `SITE_URL` + `PRIVACY_PATH`; the lunma.app domain is [VERIFY]
// until launch, the same placeholder the store listing's privacy URL uses.
const PRIVACY_URL = 'https://lunma.app/privacy';

// Group declarations by `group`, preserving first-seen order, keyed for lookup.
const groupMap = $derived.by(() => {
  const map = new Map<string, SettingDeclaration[]>();
  for (const decl of SETTINGS) {
    const list = map.get(decl.group) ?? [];
    list.push(decl);
    map.set(decl.group, list);
  }
  return map;
});

// One-line intro shown under each section heading, so every card opens with a
// plain-language "what this is" before its controls. The Auto-archive note also
// reassures that pinned tabs are never touched.
// Group headings + intros are localized via `labels.ts` (groupLabel/groupIntro),
// keeping this surface's i18n in one indirection and `settings.ts` catalog-free.

// Sections render in an explicit order so each management card sits with the
// settings it relates to (Result sources under Search & launcher; Recently
// archived under Auto-archive). Looked up by name rather than iterated.
const searchGroup = $derived(groupMap.get('Search & launcher'));
const appearanceGroup = $derived(groupMap.get('Appearance'));
const tabsGroup = $derived(groupMap.get('Tabs'));
const autoArchiveGroup = $derived(groupMap.get('Auto-archive'));

// The custom-search-URL template is invalid only when it is actually the active
// engine (`custom`) AND lacks the `%s` placeholder — then `resolveDefaultEngine`
// falls back to Google, so we surface the inline hint. A blank field while a
// built-in is selected is fine (the custom slot is simply unused).
const customUrlInvalid = $derived(
  settings.defaultSearchEngine === 'custom' && !settings.customSearchUrl.includes('%s'),
);

// The Tab-to-search keyword collides when it (trimmed, non-empty) equals a
// built-in keyword (g/ddg/bing/brave/p/yt/w). On a collision the built-in wins
// and `buildEngineRegistry` drops the custom keyword, so we warn inline
// (launcher-tab-to-search). The custom engine still works as the default; only
// its keyword is shadowed.
const customKeywordColliding = $derived.by(() => {
  const keyword = settings.customSearchKeyword.trim().toLowerCase();
  // Case-insensitive — mirrors `buildEngineRegistry` / `resolveEngine` so an
  // uppercase keyword (e.g. `G`) is flagged as shadowing the built-in `g`.
  return (
    keyword !== '' && BUILT_IN_ENGINES.some((engine) => engine.keyword.toLowerCase() === keyword)
  );
});

// A SegmentedControl holds a few options on one row; beyond this an enum renders
// as a Select dropdown instead (e.g. the search-engine picker). Stacked controls
// (the dropdown and every text field) sit BELOW their label so the label never
// gets crushed into a narrow column.
const SEGMENTED_MAX = 4;
function isStacked(decl: SettingDeclaration): boolean {
  return (
    decl.type === 'text' ||
    decl.type === 'number' ||
    (decl.type === 'enum' && decl.options.length > SEGMENTED_MAX)
  );
}

// Localized enum option labels (Compact / Dark / All Spaces / …) via the
// `labels.ts` indirection — engine names and the `language` endonyms fall back to
// their declared literal. These arrays are session-constant (the locale is fixed
// until a language change reloads the surface), so compute them once up front
// rather than rebuilding on every settings change. `toggleSegments()` likewise.
const localizedOptionsByKey = new Map<string, { value: string; label: string }[]>();
for (const decl of SETTINGS) {
  if (decl.type === 'enum') {
    localizedOptionsByKey.set(
      decl.key,
      decl.options.map((o) => ({ value: o.value, label: optionLabel(decl.key, o.value, o.label) })),
    );
  }
}
const toggleOptions = toggleSegments();

// The custom-engine fields (the search-URL template + its Tab keyword) are only
// meaningful when the default engine is set to Custom — they configure that slot.
// Hide them while a built-in is selected so the Search group shows just the picker
// until Custom is chosen (the slot is simply unused otherwise).
const isCustomEngine = $derived(settings.defaultSearchEngine === 'custom');
function isVisible(decl: SettingDeclaration): boolean {
  if (decl.key === 'customSearchUrl' || decl.key === 'customSearchKeyword') {
    return isCustomEngine;
  }
  return true;
}

/** Reflect density onto this document's `<html>` so the preview reflows live
 * (the same `:root[data-density=…]` tokens that drive the sidebar). */
function applyDensity(density: Settings['density']): void {
  applyDensityToDocument(density);
}

/** Reflect the light/dark theme onto `<html>` so the warm-paper
 * `:root[data-theme="light"]` token set takes over (or the warm-night default).
 * The atmosphere glow + cards recolour live as the dial flips. */
function applyTheme(theme: Settings['theme']): void {
  applyThemeToDocument(theme);
}

// Previous `language` value, for the gated reload watch below. Seeded from the
// stored value once the read resolves (a plain variable — the watch closure
// reads the latest; no reactivity needed). options/main.ts already seeds the
// locale before mount, so first paint is localized; this tracks later changes.
let prevLanguage: Settings['language'] = DEFAULTS.language;

onMount(() => {
  let cancelled = false;
  void (async () => {
    const s = await readSettings();
    if (cancelled) return;
    settings = s;
    prevLanguage = s.language;
    applyDensity(s.density);
    applyTheme(s.theme);
  })();
  return () => {
    cancelled = true;
  };
});

// Gated reload: language is the one setting that needs a reload to re-localize
// the mounted tree (Paraglide resolves messages at evaluation time). Reload ONLY
// on a `language` delta; every other setting keeps applying live via the
// onSelect handlers above (Options has no other live-apply watch). This is the
// single reload owner — setLocale persists with { reload: false }.
onMount(() =>
  watchSettings((s) => {
    if (s.language === prevLanguage) return;
    prevLanguage = s.language;
    applyLocaleFromSettings(s.language);
    location.reload();
  }),
);

// Deep-link by hash: scroll the matching element into view on load and on hash
// change (a reused options tab). Drives both the sidebar archived chip
// (`#recently-archived` → the Recently-archived card) and the sidebar first-run
// notice's "Manage in settings" action (`#auto-archive` → the Auto-archive
// settings group, anchored by `groupSlug`).
onMount(() => {
  const scrollToHash = (): void => {
    const id = location.hash.slice(1);
    if (!id) return;
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ block: 'start' });
    });
  };
  scrollToHash();
  window.addEventListener('hashchange', scrollToHash);
  return () => window.removeEventListener('hashchange', scrollToHash);
});

/** A stable anchor id for a settings group, so a surface can deep-link to it via
 * `#<slug>` (e.g. "Auto-archive" → `auto-archive`). */
function groupSlug(group: string): string {
  return group.toLowerCase().replace(/\s+/g, '-');
}

function onSelect(decl: SettingDeclaration, value: string): void {
  // Enum values are constrained to the declared options, so the cast is safe.
  const next = value as Settings[typeof decl.key];
  settings = { ...settings, [decl.key]: next };
  if (decl.key === 'language') {
    // Route the locale through the i18n path (handles the 'auto' sentinel) — it
    // persists via writeSetting('language', …) and seeds the cache. The gated
    // watchSettings below owns the reload, so pass { reload: false } (no double
    // reload). Mirrors the density/theme special-cases.
    setLocale(settings.language, { reload: false });
    return;
  }
  void writeSetting(decl.key, next);
  // Read the freshly-merged value back from `settings` so each apply call is
  // typed precisely rather than the cast `DensityMode | Tint | ThemeMode` union.
  if (decl.key === 'density') applyDensity(settings.density);
  else if (decl.key === 'theme') applyTheme(settings.theme);
}

/** Persist a `text` setting on every keystroke (immediate-apply, like the enum
 * controls — no save button). Updating the local mirror also re-derives
 * `customUrlInvalid`, so the inline hint appears/clears live as the user types. */
function onTextInput(decl: SettingDeclaration, value: string): void {
  settings = { ...settings, [decl.key]: value as Settings[typeof decl.key] };
  void writeSetting(decl.key, value as Settings[typeof decl.key]);
}

/** Persist a `toggle` setting as a boolean (immediate-apply, no save button). */
function onToggle(decl: SettingDeclaration, next: boolean): void {
  settings = { ...settings, [decl.key]: next as Settings[typeof decl.key] };
  void writeSetting(decl.key, next as Settings[typeof decl.key]);
}

/** Persist a `number` setting as a positive integer (immediate-apply). Ignores
 * non-numeric / empty input — never persists a non-number — and applies the
 * declared `min` floor before writing. */
function onNumberInput(decl: SettingDeclaration, raw: string): void {
  if (decl.type !== 'number') return;
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return;
  const parsed = Number.parseInt(trimmed, 10);
  const floored = decl.min !== undefined ? Math.max(decl.min, parsed) : parsed;
  settings = { ...settings, [decl.key]: floored as Settings[typeof decl.key] };
  void writeSetting(decl.key, floored as Settings[typeof decl.key]);
}
</script>

<div class="page">
  <!-- Atmosphere glow (redesign): two soft, blurred colour fields drifting behind
       the page — a warm one top-left, a cool one bottom-right. Gated on the
       "Atmosphere glow" toggle; the drift is held when "Reduce motion" is on (and
       always under the OS reduced-motion preference). -->
  {#if settings.showGlares}
    <div class="atmosphere" aria-hidden="true">
      <span class="blob warm" class:still={settings.reduceMotion}></span>
      <span class="blob cool" class:still={settings.reduceMotion}></span>
    </div>
  {/if}

  <header class="topbar">
    <div class="topbar-inner">
      <span class="wordmark">Lunma</span>
      <span class="subtitle">{m.options_pageSubtitle()}</span>
    </div>
  </header>

  <main class="column">
    <!-- Unbound-shortcut guidance (renders only when Alt+L is unbound). -->
    <ShortcutGuidanceCard />

    <!-- Connections (sources-redesign, D1): the single manager for every
         connected source — leads the page per the comp. -->
    <ConnectionsCard />

    <!-- Explicit section order so each management card sits with the settings it
         relates to: Search & launcher → Result sources; Auto-archive → Recently
         archived. The registry groups render via the shared groupCard snippet. -->
    {#if searchGroup}{@render groupCard('Search & launcher', searchGroup)}{/if}

    <!-- Result sources (least-privilege-permissions D5): the launcher's optional
         history/bookmarks providers, granted in-context (#result-sources). Sits
         directly under Search & launcher — both are launcher concerns. -->
    <ResultSourcesCard />

    {#if appearanceGroup}{@render groupCard('Appearance', appearanceGroup)}{/if}

    {#if tabsGroup}{@render groupCard('Tabs', tabsGroup)}{/if}

    {#if autoArchiveGroup}{@render groupCard('Auto-archive', autoArchiveGroup)}{/if}

    <!-- Recently archived (auto-archive): the management view the sidebar chip
         deep-links to (`#recently-archived`). Sits directly under Auto-archive. -->
    <RecentlyArchived />

    <!-- Backup & restore (data-backup): the terminal data-management action —
         natural footer before the privacy link. -->
    <BackupRestore />

    <!-- Privacy policy lives on the marketing site (never bundled in the
         extension), so this is a plain outbound link opening in a new tab. -->
    <footer class="footer">
      <a href={PRIVACY_URL} target="_blank" rel="noopener" data-testid="options-privacy-link">
        {m.options_privacyLink()}
      </a>
      <span class="version">{m.options_version({ version })}</span>
    </footer>
  </main>
</div>

<!-- One registry group → one solid section card with full-bleed setting rows. -->
{#snippet groupCard(group: string, decls: SettingDeclaration[])}
  <SettingsCard
    heading={groupLabel(group)}
    description={groupIntro(group)}
    id={groupSlug(group)}
    headingTestid="group-heading"
    flush
  >
    {#each decls as decl (decl.key)}
      {#if isVisible(decl)}
        <div class="setting" class:stacked={isStacked(decl)}>
          <SettingText label={settingLabel(decl.key)} description={settingDescription(decl.key)} />
          {#if decl.type === 'enum' && decl.options.length > SEGMENTED_MAX}
            <Select
              options={localizedOptionsByKey.get(decl.key) ?? []}
              value={String(settings[decl.key])}
              ariaLabel={settingLabel(decl.key)}
              onchange={(value) => onSelect(decl, value)}
            />
          {:else if decl.type === 'enum'}
            <SegmentedControl
              name={decl.key}
              options={localizedOptionsByKey.get(decl.key) ?? []}
              value={String(settings[decl.key])}
              ariaLabel={settingLabel(decl.key)}
              onchange={(value) => onSelect(decl, value)}
            />
          {:else if decl.type === 'text'}
            <div class="text-field">
              <TextInput
                ariaLabel={settingLabel(decl.key)}
                value={String(settings[decl.key])}
                placeholder={decl.placeholder}
                invalid={decl.key === 'customSearchUrl' && customUrlInvalid}
                oninput={(value) => onTextInput(decl, value)}
              />
              {#if decl.key === 'customSearchUrl'}
                <!-- Height-reserved danger slot (mirrors SpaceEditor's
                     duplicate-name hint): always in the DOM so the row never
                     jumps; only its opacity toggles when the template is
                     invalid. One line, ellipsised. -->
                <p
                  class="field-hint"
                  class:visible={customUrlInvalid}
                  data-visible={customUrlInvalid}
                  data-testid="custom-url-hint"
                  aria-live="polite"
                >
                  <!-- Split the localized hint on the literal `%s` token (every
                       locale preserves it) so the placeholder users copy stays
                       visually set apart as monospace code. -->
                  {#each m.options_customUrlHint().split('%s') as part, i (i)}
                    {#if i > 0}<code>%s</code>{/if}{part}
                  {/each}
                </p>
              {/if}
              {#if decl.key === 'customSearchKeyword'}
                <!-- Same height-reserved slot for the Tab-to-search keyword:
                     warns when the keyword collides with a built-in (the
                     built-in wins; the keyword is shadowed). -->
                <p
                  class="field-hint"
                  class:visible={customKeywordColliding}
                  data-visible={customKeywordColliding}
                  data-testid="custom-keyword-hint"
                  aria-live="polite"
                >
                  {m.options_customKeywordCollision({ keyword: settings.customSearchKeyword.trim() })}
                </p>
              {/if}
            </div>
          {:else if decl.type === 'toggle'}
            <SegmentedControl
              name={decl.key}
              options={toggleOptions}
              value={settings[decl.key] ? 'on' : 'off'}
              ariaLabel={settingLabel(decl.key)}
              onchange={(value) => onToggle(decl, value === 'on')}
            />
          {:else if decl.type === 'number'}
            <div class="text-field">
              <TextInput
                ariaLabel={settingLabel(decl.key)}
                inputmode="numeric"
                value={String(settings[decl.key])}
                placeholder={decl.placeholder}
                testid={`number-${decl.key}`}
                oninput={(value) => onNumberInput(decl, value)}
              />
            </div>
          {/if}
        </div>
      {/if}
    {/each}
  </SettingsCard>
{/snippet}

<style>
  /* The options page is a standalone Chrome page with no app.css and no Svelte
   * context — it owns its warm substrate (themed dark/light by `--bg`) so there's
   * no white flash before the settings read resolves. */
  :global(html),
  :global(body) {
    margin: 0;
    background: var(--bg);
    color: var(--text);
    color-scheme: dark;
    font-family: var(--font-sans);
  }

  .page {
    position: relative;
    isolation: isolate;
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    font-size: var(--text-md);
    line-height: 1.5;
  }

  /* Atmosphere glow: a fixed, non-interactive backdrop behind the content. */
  .atmosphere {
    position: fixed;
    inset: 0;
    z-index: 0;
    overflow: hidden;
    pointer-events: none;
  }
  .blob {
    position: absolute;
    border-radius: var(--r-pill);
    filter: blur(36px);
  }
  .blob.warm {
    top: -20%;
    left: -14%;
    width: 60%;
    height: 62%;
    background: radial-gradient(closest-side, var(--atm-blob-warm), transparent 74%);
    animation: opt-drift-warm 32s var(--ease-standard) infinite alternate;
  }
  .blob.cool {
    right: -14%;
    bottom: -20%;
    width: 55%;
    height: 58%;
    background: radial-gradient(closest-side, var(--atm-blob-cool), transparent 74%);
    animation: opt-drift-cool 36s var(--ease-standard) infinite alternate;
  }
  .blob {
    will-change: transform;
  }
  /* Reduce-motion (setting or OS): hold the drift; the glow stays, just still. */
  .blob.still {
    animation: none;
  }
  @media (prefers-reduced-motion: reduce) {
    .blob {
      animation: none;
    }
  }
  @keyframes opt-drift-warm {
    to {
      transform: translate3d(7%, 9%, 0) scale(1.12);
    }
  }
  @keyframes opt-drift-cool {
    to {
      transform: translate3d(-8%, 7%, 0) scale(1.1);
    }
  }

  /* Sticky frosted masthead: the wordmark + "Options", blurred over the warm
   * header tint so the cards scroll under it. */
  .topbar {
    position: sticky;
    top: 0;
    z-index: var(--z-sticky);
    -webkit-backdrop-filter: blur(16px);
    backdrop-filter: blur(16px);
    background: var(--header-bg);
    border-bottom: 1px solid var(--border-soft);
  }
  .topbar-inner {
    display: flex;
    align-items: baseline;
    gap: var(--space-3);
    max-width: 680px;
    margin: 0 auto;
    padding: var(--space-3) var(--space-5);
  }
  .wordmark {
    font-family: var(--font-display);
    font-size: var(--text-xl);
    font-weight: var(--weight-regular);
    line-height: 1;
    letter-spacing: 0.01em;
    color: var(--text);
  }
  .subtitle {
    font-size: var(--text-sm);
    color: var(--text-dim);
  }

  .column {
    position: relative;
    z-index: var(--z-raised);
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    width: 100%;
    max-width: 680px;
    margin: 0 auto;
    padding: var(--space-6) var(--space-5);
  }

  /* While a setting's listbox (the engine Select) is open, lift its card so the
   * popover overlays the cards below it rather than tucking under the next one. */
  .column :global(.surface:has([role='listbox'])) {
    z-index: var(--z-dropdown);
  }

  /* A full-bleed setting row: label + control with a divider above, owning its
   * own horizontal inset so dividers reach the card edges (the comp's flush
   * rows). */
  .setting {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    padding: var(--space-4) var(--space-5);
    border-top: 1px solid var(--border-soft);
  }

  /* A wide control (the engine dropdown, any text field) can't share a row with
   * its label without crushing it — so it stacks: label + description on top,
   * the full-width control beneath. */
  .setting.stacked {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-3);
  }

  /* The text control stacks full-width beneath its label; the field fills the
   * row and the inline hint sits beneath it. */
  .text-field {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    width: 100%;
  }

  /* Inline danger hint for the custom-URL template — always rendered (so the
   * row height never jumps), opacity-toggled, single-line. */
  .field-hint {
    margin: 0;
    padding-left: var(--space-1);
    font: var(--weight-medium) var(--text-xs) / 1.3 var(--font-sans);
    color: var(--danger);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    opacity: 0;
    transition: opacity var(--motion-fast) var(--ease-standard);
  }
  .field-hint code {
    font-family: var(--font-mono);
  }
  .field-hint.visible {
    opacity: 1;
  }
  @media (prefers-reduced-motion: reduce) {
    .field-hint {
      transition: none;
    }
  }

  /* A quiet outbound link to the privacy policy + the build version, centred
     under the last card. */
  .footer {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-3);
    padding-top: var(--space-2);
  }
  .version {
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    color: var(--text-faint);
  }
  .footer a {
    color: var(--text-dim);
    font-size: var(--text-sm);
    text-decoration: underline;
    text-underline-offset: 2px;
    transition: color var(--motion-fast) var(--ease-standard);
  }
  .footer a:hover {
    color: var(--text);
  }
  .footer a:focus-visible {
    outline: var(--focus-width) solid var(--focus-color);
    outline-offset: var(--focus-offset);
  }
  @media (prefers-reduced-motion: reduce) {
    .footer a {
      transition: none;
    }
  }
</style>
