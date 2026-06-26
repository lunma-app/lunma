<script lang="ts">
import Diffstat from './Diffstat.svelte';

interface Props {
  additions?: number;
  deletions?: number;
}

const { additions, deletions }: Props = $props();
</script>

<Diffstat {additions} {deletions} />
