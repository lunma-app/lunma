<script lang="ts">
import { onMount } from 'svelte';
import { BUILT_IN_ENGINES } from '../shared/search-engines';
import {
  DEFAULTS,
  readSettings,
  SETTINGS,
  type SettingDeclaration,
  type Settings,
  TOGGLE_SEGMENTS,
  writeSetting,
} from '../shared/settings';
import { applyDensityToDocument } from '../shared/surface-boot';
import Aurora from '../ui/Aurora.svelte';
import SegmentedControl from '../ui/SegmentedControl.svelte';
import Select from '../ui/Select.svelte';
import SettingsCard from '../ui/SettingsCard.svelte';
import SettingText from '../ui/SettingText.svelte';
import TextInput from '../ui/TextInput.svelte';
import BackupRestore from './BackupRestore.svelte';
import ConnectorsCard from './ConnectorsCard.svelte';
import FeedSubscriptions from './FeedSubscriptions.svelte';
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

// Group declarations by `group`, preserving first-seen order.
const groups = $derived.by(() => {
  const map = new Map<string, SettingDeclaration[]>();
  for (const decl of SETTINGS) {
    const list = map.get(decl.group) ?? [];
    list.push(decl);
    map.set(decl.group, list);
  }
  return [...map.entries()];
});

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

/** Reflect the colour-intensity (tint) onto this document's `<html>` so the
 * `:root[data-tint=…]` glass overrides recolour the cards live — the same
 * attribute-driven mechanism `[data-density]` uses for the preview rows. The
 * cards are glass at every level; the tint only calms the glass fill (neutral
 * → faintly tinted → full hue), so the dial ramps smoothly across all three
 * stops. The explicit value is written for every level, including `vivid`,
 * which uses the hue-tinted `:root` glass default. */
function applyTint(tint: Settings['tint']): void {
  document.documentElement.dataset.tint = tint;
}

onMount(async () => {
  settings = await readSettings();
  applyDensity(settings.density);
  applyTint(settings.tint);
});

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
  void writeSetting(decl.key, next);
  // Read the freshly-merged value back from `settings` so each apply call is
  // typed precisely (`settings.density`/`settings.tint`) rather than the cast
  // `DensityMode | Tint` union.
  if (decl.key === 'density') applyDensity(settings.density);
  else if (decl.key === 'tint') applyTint(settings.tint);
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

<div class="page lunma-space-scope">
  <Aurora intensity="subtle" />

  <header class="topbar">
    <span class="wordmark">
      <span class="dot" aria-hidden="true"></span>
      Lunma
    </span>
    <span class="version">v{version}</span>
  </header>

  <main class="column">
    <!-- Unbound-shortcut guidance (renders only when Alt+L is unbound). -->
    <ShortcutGuidanceCard />

    {#each groups as [group, decls] (group)}
      <SettingsCard heading={group} id={groupSlug(group)} headingTestid="group-heading">
        {#each decls as decl (decl.key)}
          {#if isVisible(decl)}
            <div class="setting" class:stacked={isStacked(decl)}>
              <SettingText label={decl.label} description={decl.description} />
              {#if decl.type === 'enum' && decl.options.length > SEGMENTED_MAX}
                <Select
                  options={decl.options}
                  value={String(settings[decl.key])}
                  ariaLabel={decl.label}
                  onchange={(value) => onSelect(decl, value)}
                />
              {:else if decl.type === 'enum'}
                <SegmentedControl
                  name={decl.key}
                  options={decl.options}
                  value={String(settings[decl.key])}
                  ariaLabel={decl.label}
                  onchange={(value) => onSelect(decl, value)}
                />
              {:else if decl.type === 'text'}
                <div class="text-field">
                  <TextInput
                    ariaLabel={decl.label}
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
                      Include <code>%s</code> where the query goes.
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
                      <code>{settings.customSearchKeyword.trim()}</code> is a built-in keyword — the
                      built-in wins.
                    </p>
                  {/if}
                </div>
              {:else if decl.type === 'toggle'}
                <SegmentedControl
                  name={decl.key}
                  options={TOGGLE_SEGMENTS}
                  value={settings[decl.key] ? 'on' : 'off'}
                  ariaLabel={decl.label}
                  onchange={(value) => onToggle(decl, value === 'on')}
                />
              {:else if decl.type === 'number'}
                <div class="text-field">
                  <TextInput
                    ariaLabel={decl.label}
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
    {/each}

    <!-- Recently archived (auto-archive): the management view the sidebar chip
         deep-links to (`#recently-archived`). Placed directly under the Auto-archive
         registry group (`#auto-archive`) — policy and the view it produces sit
         together, matching the sidebar's first-run "Manage in settings" deep-link. -->
    <RecentlyArchived />

    <!-- Result sources (least-privilege-permissions D5): the launcher's optional
         history/bookmarks providers, granted in-context. This is the canonical
         grant control — the Alt+L overlay (which can't call chrome.permissions)
         deep-links here via the SW (#result-sources). -->
    <ResultSourcesCard />

    <!-- Connectors (smart-folders, D10): per-instance access tokens, kept in
         chrome.storage.local via shared/connectors.ts — never sync, never the
         settings registry, never echoed back into the page. The `#connectors`
         deep-link anchor moves intact with the extracted card. -->
    <ConnectorsCard />

    <!-- Feed subscriptions (opml-import-export): import/export RSS feed lists as
         OPML. Self-contained: reads storage at action time; import goes through
         the bus to the SW. Grouped with Connectors — both configure smart-folder
         data sources. -->
    <FeedSubscriptions />

    <!-- Backup & restore (data-backup): export/import a portable JSON snapshot of
         Spaces and settings. Terminal data-management action — natural footer
         before the privacy link. Self-contained: export reads storage directly;
         import goes through the bus to the SW. -->
    <BackupRestore />

    <!-- Privacy policy lives on the marketing site (never bundled in the
         extension), so this is a plain outbound link opening in a new tab — the
         options page is a full tab, so no bus round-trip is needed. -->
    <footer class="footer">
      <a href={PRIVACY_URL} target="_blank" rel="noopener" data-testid="options-privacy-link">
        Privacy policy
      </a>
    </footer>
  </main>
</div>

<style>
  /* The options page is a standalone Chrome page with no app.css and no Svelte
   * context — it owns its dark substrate so there's no white flash. */
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
    min-height: 100vh;
    /* Identity-hue token family — `--space-chroma` is declared HERE (not at :root)
     * the same way `.sidebar`/`.home` do, so the shared `.lunma-space-scope` recipe
     * (`@lunma/tokens`, applied on the `.page` element) can compose `--space-c` (the
     * dot fill). This page has no active-Space context, so it reads the base
     * identity hue via the `:root` `--space-h`. */
    --space-chroma: 0.15;
    /* `--glow-space` is declared at `:root` referencing `--space-chroma` with no
     * fallback; since `--space-chroma` is undefined at `:root`, that token is
     * invalid-at-computed-value where it is declared and inherits down EMPTY —
     * so the local `--space-chroma` above can't rescue it. Redeclare it here,
     * where `--space-chroma` is in scope, so the wordmark dot's hue glow renders
     * (the same reason `--space-c` is redeclared, not just referenced). This page
     * has no active Space, so `--space-l` inherits the `:root` ember default. */
    --glow-space: 0 0 40px
      oklch(clamp(0, calc(var(--space-l) + 0.1), 1) var(--space-chroma) var(--space-h) / 0.35);
  }

  /* Foreground above the aurora (positioned, z-base): the masthead and column
   * are lifted into the raised layer so they paint over the backdrop. */
  .topbar {
    position: relative;
    z-index: var(--z-raised);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 var(--space-5);
    height: var(--control-h-xl);
    background: var(--bg-elev);
    border-bottom: 1px solid var(--divider);
  }
  /* Masthead wordmark at brand presence (D5): the display serif at `--text-2xl`
   * with the identity glow dot, so the page opens on the brand rather than a faint
   * label. Fits the `--control-h-xl` topbar with room to spare. */
  .wordmark {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    font-family: var(--font-display);
    font-size: var(--text-2xl);
    font-weight: var(--weight-regular);
    line-height: 1;
    color: var(--text);
  }
  /* Identity hue dot with the shared hue glow — same gesture as the sidebar edge
   * stripe and the new-tab tile, at the masthead. */
  .dot {
    width: var(--space-3);
    height: var(--space-3);
    border-radius: var(--r-pill);
    background: var(--space-c);
    box-shadow: var(--glow-space);
  }
  .version {
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    font-weight: var(--weight-regular);
    color: var(--text-dim);
  }

  /* A quiet outbound link to the privacy policy, centred under the last card. */
  .footer {
    display: flex;
    justify-content: center;
    padding-top: var(--space-2);
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

  .column {
    position: relative;
    z-index: var(--z-raised);
    display: flex;
    flex-direction: column;
    /* `--space-6` inter-group rhythm (D5) so the page breathes between the serif
     * group headings. */
    gap: var(--space-6);
    max-width: 560px;
    margin: 0 auto;
    padding: var(--space-6) var(--space-5);
  }

  /* Colour-intensity ramp — the cards are frosted glass at EVERY level; the tint
   * only calms the glass fill, mirroring `.sidebar[data-tint]` / `.home[data-tint]`
   * so the dial progresses smoothly instead of jumping opaque→glass. `vivid` (the
   * default) keeps the hue-tinted `:root` `--glass-bg`; `standard` softens the
   * chroma; `subtle` goes neutral. `data-tint` is written on `<html>` (= `:root`)
   * by `applyTint`, so these override the inherited fill for the cards below. */
  :global(:root[data-tint='standard']) {
    --glass-bg: oklch(0.23 0.014 var(--base-hue) / 0.5);
    --glass-bg-strong: oklch(0.25 0.016 var(--base-hue) / 0.66);
  }
  :global(:root[data-tint='subtle']) {
    --glass-bg: oklch(0.22 0 0 / 0.5);
    --glass-bg-strong: oklch(0.24 0 0 / 0.66);
  }

  /* The composed Surface cards cross-fade their glass fill as the tint changes
   * (the `background` tweens between the per-level `--glass-bg` values); the blur
   * is constant since every level is glass, so there is no opaque→glass snap. */
  .column :global(.surface) {
    transition:
      background var(--motion-slow) var(--ease-emphasised),
      border-color var(--motion-slow) var(--ease-emphasised),
      box-shadow var(--motion-slow) var(--ease-emphasised);
  }
  /* Reduced motion: the tint change applies instantly (no cross-fade); the end
   * state is identical, so reduced motion holds at every colour-intensity level. */
  @media (prefers-reduced-motion: reduce) {
    .column :global(.surface) {
      transition: none;
    }
  }

  /* Each glass group card is its own stacking context (backdrop-filter), so a
   * dropdown popover anchored inside the Search card would otherwise paint
   * BEHIND the next card. While a setting's listbox is open, lift its whole
   * group card onto the dropdown layer so the popover overlays the cards below.
   * `[role='listbox']` is unscoped, so `:has()` crosses the Select boundary. */
  .column :global(.surface:has([role='listbox'])) {
    z-index: var(--z-dropdown);
  }

  /* The registry card now composes the shared `SettingsCard` / `CardHeading`
   * primitives; the shortcut-guidance card and the Connectors / Result-sources
   * sections are extracted sibling components that own their own chrome. */
  .setting {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-4);
    padding: var(--space-3) 0;
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
   * row height never jumps), opacity-toggled, single-line. Tinted from the
   * shared `--danger` token, mirroring SpaceEditor's `.dupe-msg`. */
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
  .field-hint.visible {
    opacity: 1;
  }
  .field-hint code {
    font-family: var(--font-mono);
  }
  @media (prefers-reduced-motion: reduce) {
    .field-hint {
      transition: none;
    }
  }


</style>
