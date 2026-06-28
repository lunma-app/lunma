<script lang="ts">
import { codeToHtml } from 'shiki';
import type { Snippet } from 'svelte';
import CardHeading from '@/ui/CardHeading.svelte';
import Chip from '@/ui/Chip.svelte';
import Select, { type SelectOption } from '@/ui/Select.svelte';
import SettingText from '@/ui/SettingText.svelte';
import TextInput from '@/ui/TextInput.svelte';
import { type Args, defaultArgs } from './controls';
import type { StoryMeta } from './story';

interface Props {
  meta: StoryMeta;
  /** Raw source of the story file (registry-supplied), shown in the source panel. */
  source: string;
  /** Live preview: rendered with the current `args` when controls are declared. */
  preview?: Snippet<[Args]>;
  /** Curated example variants (the `<Variant>` matrix). */
  examples?: Snippet;
}

const { meta, source, preview, examples }: Props = $props();

const controlEntries = $derived(Object.entries(meta.controls ?? {}));
const hasControls = $derived(controlEntries.length > 0);

// Live args, seeded from the control defaults. Bound to the controls panel and
// passed to the preview snippet. `meta` is stable for this component's life (the
// catalog remounts each story via `{#key}`), so capturing the initial value is
// intentional.
// svelte-ignore state_referenced_locally
const args = $state<Args>(defaultArgs(meta.controls));

function selectOptions(options: readonly string[]): SelectOption[] {
  return options.map((value) => ({ value, label: value }));
}

function typeLabelFor(prop: string): string {
  const def = meta.controls?.[prop];
  if (!def) return '';
  return def.typeLabel ?? def.type;
}

// Shiki highlights the story's own source as Svelte. Dev-only (the catalog ships
// nothing in the MV3 bundle); the grammar + themes are lazily loaded on first use.
// Dual-theme (`defaultColor: false`) emits `--shiki-light`/`--shiki-dark` custom
// properties per token; catalog.css picks one based on the catalog's theme, so the
// source view follows the light/dark toggle without re-highlighting.
// svelte-ignore state_referenced_locally
const highlighted = codeToHtml(source, {
  lang: 'svelte',
  themes: { light: 'vitesse-light', dark: 'vitesse-dark' },
  defaultColor: false,
});
</script>

<div class="story">
  <CardHeading heading={meta.title} />

  {#if hasControls && preview}
    <section class="block">
      <h3 class="block-heading">Playground</h3>
      <div class="playground">
        <div class="preview lunma-glass">{@render preview(args)}</div>
        <div class="controls">
          {#each controlEntries as [prop, def] (prop)}
            <div class="control-row">
              <SettingText label={prop} description={def.description} />
              <div class="control-input">
                {#if def.type === 'boolean'}
                  <Chip
                    label={args[prop] ? 'true' : 'false'}
                    onToggle={() => (args[prop] = !args[prop])}
                    selected={Boolean(args[prop])}
                  />
                {:else if def.type === 'select' && def.options}
                  <Select
                    options={selectOptions(def.options)}
                    value={String(args[prop])}
                    onchange={(v) => (args[prop] = v)}
                    ariaLabel={prop}
                  />
                {:else if def.type === 'number'}
                  <TextInput
                    ariaLabel={prop}
                    value={String(args[prop])}
                    inputmode="numeric"
                    oninput={(v) => (args[prop] = v === '' ? 0 : Number(v))}
                  />
                {:else}
                  <TextInput
                    ariaLabel={prop}
                    value={String(args[prop])}
                    oninput={(v) => (args[prop] = v)}
                  />
                {/if}
              </div>
            </div>
          {/each}
        </div>
      </div>
    </section>
  {/if}

  {#if hasControls}
    <section class="block">
      <h3 class="block-heading">API</h3>
      <table class="api">
        <thead>
          <tr><th>Prop</th><th>Type</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          {#each controlEntries as [prop, def] (prop)}
            <tr>
              <td><code>{prop}</code></td>
              <td><code>{typeLabelFor(prop)}</code></td>
              <td><code>{JSON.stringify(def.default)}</code></td>
              <td>{def.description ?? ''}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </section>
  {/if}

  {#if examples}
    <section class="block">
      <h3 class="block-heading">Examples</h3>
      <div class="examples">{@render examples()}</div>
    </section>
  {/if}

  <section class="block">
    <details class="source">
      <summary>Source</summary>
      {#await highlighted then html}
        <!-- Shiki output is escaped HTML over our own story source (not user input). -->
        <div class="shiki-wrap">{@html html}</div>
      {:catch}
        <pre class="source-fallback"><code>{source}</code></pre>
      {/await}
    </details>
  </section>
</div>

<style>
  .story {
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
  }
  .block-heading {
    margin: 0 0 var(--space-3);
    font-size: var(--text-2xs);
    font-weight: var(--weight-semibold);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-faint);
  }

  .playground {
    display: grid;
    grid-template-columns: 1fr minmax(16rem, 22rem);
    gap: var(--space-4);
    align-items: start;
  }
  .preview {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-3);
    min-height: 5rem;
    padding: var(--space-5);
    border-radius: var(--r-lg);
  }
  .controls {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }
  .control-row {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }
  .control-input {
    display: flex;
  }

  .api {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--text-sm);
  }
  .api th {
    text-align: left;
    padding: var(--space-2) var(--space-3);
    color: var(--text-muted);
    border-bottom: 1px solid var(--border);
    font-weight: var(--weight-semibold);
  }
  .api td {
    padding: var(--space-2) var(--space-3);
    border-bottom: 1px solid var(--border-soft);
    vertical-align: top;
    color: var(--text-2);
  }
  .api code {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--text);
  }

  .examples {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
    gap: var(--space-4);
  }

  .source summary {
    cursor: pointer;
    font-size: var(--text-2xs);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-faint);
    user-select: none;
  }
  /* The highlighted `.shiki` block is styled globally in catalog.css (scoped
   * styles can't reach `{@html}` output); just space it from the summary. */
  .shiki-wrap {
    margin-top: var(--space-3);
  }
  /* Plain fallback if Shiki fails to load the grammar/theme. */
  .source-fallback {
    margin: var(--space-3) 0 0;
    padding: var(--space-4);
    border-radius: var(--r-lg);
    background: var(--surface-2);
    border: 1px solid var(--border-soft);
    overflow: auto;
    max-height: 28rem;
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--text-2);
    white-space: pre;
  }
</style>
