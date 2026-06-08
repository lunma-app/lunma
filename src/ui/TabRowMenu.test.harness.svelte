<script lang="ts">
import TabRowMenu, { type TabRowMenuHeader, type TabRowMenuItem } from './TabRowMenu.svelte';

interface Props {
  header?: TabRowMenuHeader;
  label?: string;
  open?: boolean;
  onGoHome?: () => void;
  onDelete?: () => void;
  onRowClick?: () => void;
  onOpenChange?: (open: boolean) => void;
}

const {
  header = { title: 'Figma — Lunma' },
  label = 'Tab actions',
  open = false,
  onGoHome,
  onDelete,
  onRowClick,
  onOpenChange,
}: Props = $props();

function noop(): void {
  /* test default — Unpin is inert in the harness */
}

// Mirrors PinnedTabs' two-step delete: the first activation flips this flag and
// keeps the menu open (keepOpen); the second dispatches and closes.
let confirming = $state(false);

const items = $derived<TabRowMenuItem[]>(
  confirming
    ? [
        { id: 'go-home', label: 'Go home', icon: 'house', onSelect: () => onGoHome?.() },
        { id: 'unpin', label: 'Unpin', icon: 'pin-off', onSelect: noop },
        {
          id: 'delete',
          label: 'Delete — confirm',
          icon: 'trash-2',
          danger: true,
          onSelect: () => {
            confirming = false;
            onDelete?.();
          },
        },
      ]
    : [
        { id: 'go-home', label: 'Go home', icon: 'house', onSelect: () => onGoHome?.() },
        { id: 'unpin', label: 'Unpin', icon: 'pin-off', onSelect: noop },
        {
          id: 'delete',
          label: 'Delete',
          icon: 'trash-2',
          danger: true,
          keepOpen: true,
          onSelect: () => {
            confirming = true;
          },
        },
      ],
);

function handleOpenChange(next: boolean): void {
  if (!next) confirming = false;
  onOpenChange?.(next);
}
</script>

<TabRowMenu {header} {items} {label} {open} {onRowClick} onOpenChange={handleOpenChange} />
