<script lang="ts">
import type { LauncherResult } from '../shared/launcher-contract';
import ResultList from './ResultList.svelte';

interface Props {
  results?: LauncherResult[];
  onact?: (result: LauncherResult, index: number) => void;
  onescape?: () => void;
  onactivedescendant?: (id: string | null) => void;
}

function noop(): void {
  /* test default */
}

const sample: LauncherResult[] = [
  { id: 'tab:1', source: 'tab', title: 'First', url: 'https://first/', score: 1 },
  { id: 'saved:2', source: 'saved', title: 'Second', url: 'https://second/', score: 0.5 },
  { id: 'history:3', source: 'history', title: 'Third', url: 'https://third/', score: 0.2 },
];

const { results = sample, onact = noop, onescape = noop, onactivedescendant }: Props = $props();
</script>

<ResultList {results} {onact} {onescape} {onactivedescendant} />
