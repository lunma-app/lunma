<script lang="ts">
import FirstRunNotice from './FirstRunNotice.svelte';

interface Props {
  autoArchiveIdleMinutes?: number;
  onDismiss?: () => void;
  onManage?: () => void;
}

const {
  autoArchiveIdleMinutes = 720,
  onDismiss = () => undefined,
  onManage = () => undefined,
}: Props = $props();
</script>

<FirstRunNotice {autoArchiveIdleMinutes} {onDismiss} {onManage} />
