<script lang="ts">
import EditableLabel from './EditableLabel.svelte';

interface Props {
  value?: string;
  editing?: boolean;
  allowEmpty?: boolean;
  oncommit?: (next: string) => void;
  oncancel?: () => void;
}

const {
  value = 'Hello',
  editing = false,
  allowEmpty = false,
  oncommit,
  oncancel,
}: Props = $props();
</script>

<EditableLabel
  {value}
  {editing}
  {allowEmpty}
  ariaLabel="Rename"
  oncommit={(next) => oncommit?.(next)}
  oncancel={() => oncancel?.()}
/>
