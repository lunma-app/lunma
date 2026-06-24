// Data-backup handler (data-backup capability): validates + migrates an
// imported backup, replaces the store state, and triggers persist+broadcast.

import { parseBackup } from '../../shared/backup';
import { log } from '../../shared/logger';
import { writeAllSettings } from '../../shared/settings';
import type { TabId } from '../../shared/types';
import { refreshDueLenses } from '../lenses';
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

      // Mark dirty BEFORE reconciliation so a throw below still triggers
      // persist+broadcast (design D4: mutate-then-await-throw still persists).
      // The drain snapshots state AFTER the handler returns, so it captures
      // whatever reconciliation managed to complete before any throw.
      ctx.markDirty();

      // Rebuild machine-bound maps (mirrors the boot reconciliation) so the
      // broadcast carries a usable active-space without needing a SW restart.
      // Errors are swallowed — partial reconciliation is better than a throw
      // that would prevent the smart-folder refresh side-effect below.
      try {
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
      } catch (err) {
        log.error('importState: post-replace reconciliation failed', { err });
      }

      // Kick a smart-folder refresh off the critical path so the sidebar
      // doesn't show an eternal loading spinner after restore. The runtime
      // slice (smartFolders) is always empty after replaceState (it's
      // ephemeral, never exported), and the sidebar-open kick only fires on
      // lunma/state-request which an already-open sidebar never resends.
      ctx.runSideEffect(() => refreshDueLenses({ store: ctx.store, enqueue: ctx.enqueue }));
    },
  };
}
