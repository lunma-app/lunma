<script lang="ts">
import TextInput from './TextInput.svelte';

interface Props {
  label?: string;
  value?: string;
  inputmode?: 'text' | 'numeric' | 'decimal';
  oninput?: (value: string) => void;
  onenter?: () => void;
}

let { label = 'Name', value = $bindable(''), inputmode, oninput, onenter }: Props = $props();
</script>

<TextInput {label} bind:value {inputmode} {oninput} {onenter} />
