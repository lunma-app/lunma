<script module lang="ts">
import { defineStory } from '../../lib/story';

export const meta = defineStory({
  title: 'AccountChip',
  group: 'Composite',
  controls: {
    provider: {
      type: 'select',
      options: ['github', 'gitlab', 'jira', 'rss'],
      default: 'github',
      typeLabel: 'LensProvider',
      description: 'Account provider (drives the glyph).',
    },
    label: {
      type: 'text',
      default: 'octocat',
      description: 'Identity text (account name or host).',
    },
    status: {
      type: 'select',
      options: ['connected', 'browser-session', 'needs-token', 'signed-out', 'public'],
      default: 'connected',
      typeLabel: 'AccountStatus',
      description: 'Auth status (pip + word).',
    },
    bare: { type: 'boolean', default: false, description: 'Drop the filled background.' },
  },
});
</script>

<script lang="ts">
import AccountChip from '@/ui/AccountChip.svelte';
import type { LensProvider } from '@/shared/types';
import type { Args } from '../../lib/controls';
import Story from '../../lib/Story.svelte';
import Variant from '../../lib/Variant.svelte';

const { source }: { source: string } = $props();

type Status = 'connected' | 'browser-session' | 'needs-token' | 'signed-out' | 'public';
</script>

<Story {meta} {source}>
  {#snippet preview(args: Args)}
    <AccountChip
      provider={args.provider as LensProvider}
      label={args.label as string}
      status={args.status as Status}
      bare={args.bare as boolean}
    />
  {/snippet}
  {#snippet examples()}
    <Variant label="github · connected">
      <AccountChip provider="github" label="octocat" status="connected" />
    </Variant>
    <Variant label="gitlab · needs token">
      <AccountChip provider="gitlab" label="gitlab.com" status="needs-token" />
    </Variant>
    <Variant label="jira · browser session">
      <AccountChip provider="jira" label="acme.atlassian.net" status="browser-session" />
    </Variant>
    <Variant label="rss · public">
      <AccountChip provider="rss" label="feeds" status="public" />
    </Variant>
    <Variant label="signed out">
      <AccountChip provider="github" label="github.com" status="signed-out" />
    </Variant>
    <Variant label="bare (no fill)">
      <AccountChip provider="github" label="octocat" status="connected" bare />
    </Variant>
  {/snippet}
</Story>
