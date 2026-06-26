<script lang="ts">
import Avatar from './Avatar.svelte';

interface Props {
  initials?: string;
  size?: 'sm' | 'md';
  ring?: 'approved' | 'changes' | 'pending' | 'none';
  title?: string;
}

const { initials = 'AB', size, ring, title }: Props = $props();
</script>

<Avatar {initials} {size} {ring} {title} />
