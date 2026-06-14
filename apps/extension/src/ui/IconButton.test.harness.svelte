<script lang="ts">
import IconButton from './IconButton.svelte';

interface Props {
  icon?: string;
  title?: string;
  ariaLabel?: string;
  disabled?: boolean;
  variant?: 'ghost';
  size?: number;
  type?: 'button' | 'submit';
  testid?: string;
  onclick?: () => void;
}

function noop(): void {
  /* test default */
}

const {
  icon = 'settings',
  title,
  ariaLabel,
  disabled,
  variant,
  size,
  type,
  testid = 'icon-button',
  onclick = noop,
}: Props = $props();
</script>

<IconButton {icon} {title} {ariaLabel} {disabled} {variant} {size} {type} {testid} {onclick} />
