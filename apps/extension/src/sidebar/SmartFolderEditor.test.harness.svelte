<script lang="ts">
import type { PinNode, SpaceId } from '../shared/types';
import SmartFolderEditor from './SmartFolderEditor.svelte';

type SmartNode = Extract<PinNode, { kind: 'smart' }>;

interface Props {
  spaceId: SpaceId;
  node?: SmartNode;
  onDone?: () => void;
}

const { spaceId, node, onDone }: Props = $props();
</script>

<SmartFolderEditor {spaceId} {node} {onDone} />
