// Data-backup handler (data-backup capability): validates + migrates an
// imported backup, replaces the store state, and triggers persist+broadcast.

import { parseBackup } from '../../shared/backup';
import { writeAllSettings } from '../../shared/settings';
import type { TabId } from '../../shared/types';
import { seedExistingTabs } from '../seed-existing-tabs';
import { seedExistingWindows } from '../seed-existing-windows';
import { reconcileTabGroupsOnBoot } from '../tab-group-adoption';
import type { HandlersMap } from './context';

export function backupHandlers(): Pick<HandlersMap, 'importState'> {
  return {
    // Validate + migrate the backup, then atomically replace the store state.
    // On failure throw so the bus acks with an error and no mutation occurs.
    importState: async (ctx, event) => {
      const result = parseBackup(event.payload.backup);
      if (!result.ok) {
        throw new Error(`importState: backup is invalid — ${result.error}`);
      }
      if (result.settings !== undefined) {
        await writeAllSettings(result.settings);
      }
      ctx.store.replaceState(result.state);

      // The imported state has empty machine-bound maps (tabBindings,
      // activeSpaceByWindow, spaceInstancesByWindow). Run the same reconciliation
      // the boot sequence runs so the broadcast carries a usable state and the
      // sidebar doesn't appear blank until the next SW restart.
      await seedExistingWindows(ctx.store);
      const tabs = await chrome.tabs.query({});
      seedExistingTabs(ctx.store, tabs);
      ctx.store.rebuildLiveTabs(tabs);
      const tabGroupById = new Map<TabId, number>();
      for (const tab of tabs) {
        if (tab.id !== undefined) tabGroupById.set(tab.id, tab.groupId ?? -1);
      }
      ctx.store.reconcileTabOwnership(tabGroupById);
      await reconcileTabGroupsOnBoot(ctx.store, false);

      ctx.markDirty();
    },
  };
}
