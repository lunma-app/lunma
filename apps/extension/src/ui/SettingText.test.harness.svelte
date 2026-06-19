<script lang="ts">
import SettingText from './SettingText.svelte';

interface Props {
  label?: string;
  description?: string;
}

const { label = 'Include settings', description }: Props = $props();
</script>

<SettingText {label} {description} />
