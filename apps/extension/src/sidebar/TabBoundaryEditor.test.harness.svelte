<script lang="ts">
import type { PinnedTabBoundaryDefault } from '../shared/settings';
import type { TabBoundary } from '../shared/types';
import TabBoundaryEditor from './TabBoundaryEditor.svelte';

interface Props {
  savedTabId?: string;
  boundary?: TabBoundary | undefined;
  originalURL?: string;
  globalDefault?: PinnedTabBoundaryDefault;
}

const {
  savedTabId = 'st-1',
  boundary,
  originalURL = 'https://mail.google.com/',
  globalDefault = 'off',
}: Props = $props();
</script>

<TabBoundaryEditor {savedTabId} {boundary} {originalURL} {globalDefault} />
