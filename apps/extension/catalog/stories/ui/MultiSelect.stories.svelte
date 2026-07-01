<script module lang="ts">
import { defineStory } from '../../lib/story';

export const meta = defineStory({
  title: 'MultiSelect',
  group: 'Form',
  controls: {
    label: {
      type: 'text',
      default: 'All feeds',
      description: 'Closed-trigger summary (parent-computed from the selection).',
    },
    ariaLabel: { type: 'text', default: 'Filter by feed', description: 'Accessible name.' },
  },
});
</script>

<script lang="ts">
import MultiSelect, { type MultiSelectOption } from '@/ui/MultiSelect.svelte';
import type { Args } from '../../lib/controls';
import { noop } from '../../lib/mock';
import Story from '../../lib/Story.svelte';
import Variant from '../../lib/Variant.svelte';

const { source }: { source: string } = $props();

// The trailing disabled `Archived feed` exercises the roving skip (MS-04); the
// collapsed trigger folds the `label` summary into its accessible name so the
// current value reaches AT (MS-03 — see the "several selected" variant).
const options: MultiSelectOption[] = [
  { value: 'lobsters', label: 'Lobsters' },
  { value: 'hn', label: 'Hacker News' },
  { value: 'verge', label: 'The Verge' },
  { value: 'css-tricks', label: 'CSS-Tricks' },
  { value: 'smashing', label: 'Smashing Magazine' },
  { value: 'a11y', label: 'A11y Weekly' },
  { value: 'archived', label: 'Archived feed', disabled: true },
];

// A list long enough (> the default threshold of 8) to surface the search box.
const manyOptions: MultiSelectOption[] = [
  ...options.filter((o) => !o.disabled),
  { value: 'mdn', label: 'MDN Blog' },
  { value: 'web-dev', label: 'web.dev' },
  { value: 'ahq', label: 'A List Apart' },
  { value: 'daring', label: 'Daring Fireball' },
];

// Live selection for the interactive preview.
let picked = $state<string[]>(['hn', 'verge']);
const summary = $derived(
  picked.length === 0 ? 'All feeds' : picked.length === 1 ? (picked[0] ?? '') : `${picked.length} feeds`,
);
let inlinePicked = $state<string[]>(['hn']);
let leadPicked = $state<string[]>(['verge']);
</script>

<Story {meta} {source}>
  {#snippet preview(args: Args)}
    <div style="width: 16rem">
      <MultiSelect
        {options}
        values={picked}
        onchange={(v) => (picked = v)}
        label={summary}
        ariaLabel={args.ariaLabel as string}
        clearLabel="Clear"
        selectAllLabel="Select all"
      />
    </div>
  {/snippet}
  {#snippet examples()}
    <Variant label="none selected">
      <div style="width: 16rem">
        <MultiSelect {options} values={[]} onchange={noop} label="All feeds" ariaLabel="Filter by feed" />
      </div>
    </Variant>
    <Variant label="several selected">
      <div style="width: 16rem">
        <MultiSelect
          {options}
          values={['lobsters', 'hn', 'verge']}
          onchange={noop}
          label="3 feeds"
          ariaLabel="Filter by feed"
          clearLabel="Clear"
        />
      </div>
    </Variant>
    <Variant label="chip variant">
      <MultiSelect
        {options}
        values={['hn']}
        onchange={noop}
        label="All feeds"
        ariaLabel="Filter by feed"
        variant="chip"
        clearLabel="Clear"
      />
    </Variant>
    <Variant label="searchable (past threshold)">
      <div style="width: 16rem">
        <MultiSelect
          options={manyOptions}
          values={picked}
          onchange={(v) => (picked = v)}
          label={summary}
          ariaLabel="Filter by feed"
          clearLabel="Clear"
          selectAllLabel="Select all"
          searchPlaceholder="Search…"
        />
      </div>
    </Variant>
    <Variant label="inline (always-open)">
      <div style="width: 16rem">
        <MultiSelect
          mode="inline"
          {options}
          values={inlinePicked}
          onchange={(v) => (inlinePicked = v)}
          label=""
          ariaLabel="Pick feeds"
        />
      </div>
    </Variant>
    <Variant label="leading snippet">
      <div style="width: 16rem">
        <MultiSelect
          mode="inline"
          {options}
          values={leadPicked}
          onchange={(v) => (leadPicked = v)}
          label=""
          ariaLabel="Pick feeds"
        >
          {#snippet leading(option)}
            <span style="display:inline-flex;align-items:center;gap:0.4rem">
              <span aria-hidden="true">📰</span>{option.label}
            </span>
          {/snippet}
        </MultiSelect>
      </div>
    </Variant>
  {/snippet}
</Story>
