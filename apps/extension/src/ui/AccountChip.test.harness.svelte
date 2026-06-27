<script lang="ts">
import type { LensProvider } from '../shared/types';
import AccountChip, { type AccountStatus } from './AccountChip.svelte';

interface Props {
  provider?: LensProvider;
  label?: string;
  status?: AccountStatus;
  title?: string;
}

const { provider = 'github', label = 'Work', status = 'connected', title }: Props = $props();
</script>

<AccountChip {provider} {label} {status} {title} />
