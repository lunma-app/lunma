<script lang="ts">
import Stack from './Stack.svelte';

interface Props {
  direction?: 'row' | 'column';
  gap?: '1' | '2' | '3' | '4';
  align?: 'start' | 'center' | 'end';
  justify?: 'start' | 'center' | 'end' | 'between';
}

const { direction, gap, align, justify }: Props = $props();
</script>

<Stack {direction} {gap} {align} {justify}>
  <span data-testid="a">A</span>
  <span data-testid="b">B</span>
</Stack>
