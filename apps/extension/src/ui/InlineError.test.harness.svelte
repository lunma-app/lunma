<script lang="ts">
import InlineError from './InlineError.svelte';

interface Props {
  message?: string;
  testid?: string;
}

const { message = 'Could not read the file.', testid }: Props = $props();
</script>

<InlineError {message} {testid} />
