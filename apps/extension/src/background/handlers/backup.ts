// Data-backup handler (data-backup capability): validates + migrates an
// imported backup, replaces the store state, and triggers persist+broadcast.

import { parseBackup } from '../../shared/backup';
import { writeAllSettings } from '../../shared/settings';
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
      ctx.markDirty();
    },
  };
}
