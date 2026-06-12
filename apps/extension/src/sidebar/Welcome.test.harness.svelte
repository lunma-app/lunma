<script lang="ts">
import Welcome from './Welcome.svelte';

interface Props {
  over?: boolean;
}

const { over = false }: Props = $props();
</script>

<Welcome {over} />
