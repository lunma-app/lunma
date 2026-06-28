<script module lang="ts">
import { defineStory } from '../../lib/story';

export const meta = defineStory({
  title: 'SettingsCard',
  group: 'Composite',
  controls: {
    heading: {
      type: 'text',
      default: 'Appearance',
      description: 'Card heading (via CardHeading).',
    },
    description: {
      type: 'text',
      default: 'How the workspace looks and moves.',
      description: 'Optional muted lead paragraph.',
    },
    flush: { type: 'boolean', default: false, description: 'Full-bleed body (rows own inset).' },
  },
});
</script>

<script lang="ts">
import Button from '@/ui/Button.svelte';
import SegmentedControl from '@/ui/SegmentedControl.svelte';
import SettingsCard from '@/ui/SettingsCard.svelte';
import SettingText from '@/ui/SettingText.svelte';
import type { Args } from '../../lib/controls';
import { noop } from '../../lib/mock';
import Story from '../../lib/Story.svelte';
import Variant from '../../lib/Variant.svelte';

const { source }: { source: string } = $props();

let tint = $state('vivid');
const tintOptions = [
  { value: 'subtle', label: 'Subtle' },
  { value: 'standard', label: 'Standard' },
  { value: 'vivid', label: 'Vivid' },
];
</script>

{#snippet connectAction()}
  <Button variant="ghost" size="sm" onclick={noop}>Connect</Button>
{/snippet}

<Story {meta} {source}>
  {#snippet preview(args: Args)}
    <div style="width: 24rem">
      <SettingsCard
        heading={args.heading as string}
        description={(args.description as string) || undefined}
        flush={args.flush as boolean}
      >
        <SettingText label="Colour intensity" description="Strength of the Space hue wash." />
      </SettingsCard>
    </div>
  {/snippet}
  {#snippet examples()}
    <Variant label="card with body">
      <div style="width: 24rem">
        <SettingsCard heading="Appearance" description="How the workspace looks and moves.">
          <div style="display:flex; align-items:center; justify-content:space-between; gap:16px">
            <SettingText label="Colour intensity" description="Strength of the Space hue wash." />
            <SegmentedControl name="card-tint" ariaLabel="Colour intensity" options={tintOptions} value={tint} onchange={(v) => (tint = v)} />
          </div>
        </SettingsCard>
      </div>
    </Variant>
    <Variant label="card with heading actions">
      <div style="width: 24rem">
        <SettingsCard heading="Connections" actions={connectAction}>
          <SettingText label="No accounts connected yet" description="Connect GitHub, GitLab, Jira, or RSS to power lenses." />
        </SettingsCard>
      </div>
    </Variant>
  {/snippet}
</Story>
