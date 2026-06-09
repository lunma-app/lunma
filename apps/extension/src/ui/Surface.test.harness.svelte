<script lang="ts">
import Surface, { type SurfaceRadius, type SurfaceVariant } from './Surface.svelte';

interface Props {
  variant?: SurfaceVariant;
  radius?: SurfaceRadius;
  glow?: boolean;
  testid?: string;
}

const { variant, radius, glow, testid }: Props = $props();
</script>

<Surface {variant} {radius} {glow} {testid}>
  <span data-testid="surface-child">content</span>
</Surface>
