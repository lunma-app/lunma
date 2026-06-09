<script lang="ts">
import Kbd from './Kbd.svelte';

interface Props {
  text?: string;
}

const { text = '⌥L' }: Props = $props();
</script>

<Kbd>{text}</Kbd>
