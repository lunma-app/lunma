<script lang="ts">
import EmptyState from './EmptyState.svelte';

interface Props {
  title?: string;
  subtitle?: string;
}

const {
  title = 'No pinned tabs yet.',
  subtitle = 'Save tabs you want to keep open across sessions.',
}: Props = $props();
</script>

<EmptyState {title} {subtitle} />
