<script lang="ts">
import type { SpaceColor } from '../shared/types';
import ColorSwatch from './ColorSwatch.svelte';

interface Props {
  color?: SpaceColor;
  selected?: boolean;
  onclick?: () => void;
}

const { color = 'blue', selected = false, onclick = () => undefined }: Props = $props();
</script>

<ColorSwatch {color} {selected} {onclick} />
