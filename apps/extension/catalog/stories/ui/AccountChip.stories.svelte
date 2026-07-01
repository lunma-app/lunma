<script module lang="ts">
import { defineStory } from '../../lib/story';

export const meta = defineStory({
  title: 'AccountChip',
  group: 'Composite',
  controlOverrides: {
    label: { default: 'octocat', description: 'Identity text (account name or host).' },
    bare: { description: 'Drop the filled background.' },
  },
  excludeControls: {
    provider:
      'LensProvider is an imported type alias, not an inline string-literal union — not mechanically derivable (syntactic-only parsing).',
    status:
      'AccountStatus is an imported type alias, not an inline string-literal union — not mechanically derivable (syntactic-only parsing).',
    title: 'Passthrough tooltip/accessible title — not meaningful to fiddle with here.',
    testid: 'data-testid passthrough — not meaningful to fiddle with here.',
  },
});
</script>

<script lang="ts">
import AccountChip from '@/ui/AccountChip.svelte';
import type { Args } from '../../lib/controls';
import Story from '../../lib/Story.svelte';
import Variant from '../../lib/Variant.svelte';

const { source }: { source: string } = $props();
</script>

<Story {meta} {source}>
  {#snippet preview(args: Args)}
    <AccountChip
      provider="github"
      label={args.label as string}
      status="connected"
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
    <Variant label="bitbucket · connected">
      <AccountChip provider="bitbucket" label="acme" status="connected" />
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
