<script lang="ts">
import type { PinNode, SpaceId } from '../shared/types';
import LensEditor from './LensEditor.svelte';

type LensNode = Extract<PinNode, { kind: 'lens' }>;

interface Props {
  spaceId: SpaceId;
  node?: LensNode;
  onDone?: () => void;
}

const { spaceId, node, onDone }: Props = $props();
</script>

<LensEditor {spaceId} {node} {onDone} />
