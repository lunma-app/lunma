<script lang="ts">
import Button from './Button.svelte';

interface Props {
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  type?: 'button' | 'submit';
  onclick?: () => void;
  title?: string;
}

function noop(): void {
  /* test default */
}

const { variant, disabled, type, onclick = noop, title }: Props = $props();
</script>

<Button {variant} {disabled} {type} {title} {onclick}>
  <span data-testid="label">Click</span>
</Button>
