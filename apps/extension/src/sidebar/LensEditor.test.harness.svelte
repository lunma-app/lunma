<script lang="ts">
import { createInitialState } from '../shared/store.svelte';
import type { PinNode, SourceAccount, SpaceId } from '../shared/types';
import LensEditor from './LensEditor.svelte';
import { createSidebarStore, setStore } from './store-context.svelte';

type LensNode = Extract<PinNode, { kind: 'lens' }>;

interface Props {
  spaceId: SpaceId;
  node?: LensNode;
  onDone?: () => void;
  /** Connected accounts seeded into the store's `sources` for the picker. */
  accounts?: SourceAccount[];
  /** Spaces seeded so the picker's OPML branch has import targets. */
  spaces?: { id: SpaceId; name: string; color: string; icon: string }[];
}

const { spaceId, node, onDone, accounts = [], spaces = [] }: Props = $props();

const initial = createInitialState();
// One-time seed at mount; the picker reads from the store thereafter.
// svelte-ignore state_referenced_locally
initial.sources = Object.fromEntries(accounts.map((a) => [a.id, a]));
// svelte-ignore state_referenced_locally
if (spaces.length > 0) initial.spaces = spaces as never;
const store = createSidebarStore(initial);
setStore(() => store);
</script>

<LensEditor {spaceId} windowId={1} {node} {onDone} />
