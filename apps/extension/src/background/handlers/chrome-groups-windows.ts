// Chrome tab-group + window lifecycle handlers (split-coordinator-handlers).
// Tab-group hints are non-destructive and act only on Lunma-tracked groups;
// window events thread open/close through the store. Verbatim moves of the
// former coordinator closures.

import { log } from '../../shared/logger';
import { disambiguateSpaceName, normalizeSpaceName } from '../../shared/space-names';
import { updateGroupTitleColor } from '../tab-groups';
import { isManagedWindow } from '../window-types';
import type { HandlersMap } from './context';
import { findSpaceIdByGroupId } from './queries';

export function chromeGroupWindowHandlers(): Pick<
  HandlersMap,
  'tabGroups.onRemoved' | 'tabGroups.onUpdated' | 'windows.onCreated' | 'windows.onRemoved'
> {
  return {
    // Tab-group lifecycle hints (non-destructive, D3/D4). Both act only on
    // groups Lunma tracks; an untracked (user-created) group is ignored.
    'tabGroups.onRemoved': (ctx, event) => {
      const { groupId } = event.payload;
      // Untracked group (or one Lunma already forgot during deleteSpace) → no-op,
      // no persist. Deleting/ungrouping a Chrome group NEVER deletes a Space.
      if (findSpaceIdByGroupId(ctx.store.state, groupId) === null) return;
      ctx.store.forgetSpaceGroup(groupId);
      ctx.markDirty();
    },
    'tabGroups.onUpdated': async (ctx, event) => {
      const { group } = event.payload;
      const spaceId = findSpaceIdByGroupId(ctx.store.state, group.id);
      if (spaceId === null) return; // untracked group → ignore
      // Mirror a TITLE change back to the Space name only. Colour and collapsed
      // changes are ignored (Lunma owns colour; collapse is Lunma-driven, D4).
      const title = group.title;
      if (title === undefined) return;
      const space = ctx.store.state.spaces.find((s) => s.id === spaceId);
      if (!space) return;
      // D5 feedback-loop guard: a Lunma-initiated retitle sets the group title
      // to the name already on the Space, so the echoed onUpdated is a no-op.
      if (title === space.name) return;
      // The user may have renamed the Chrome group to a name another Space
      // already uses. Interactive `renameSpace` THROWS on that collision — but
      // the mirror must never throw the drain (unique-space-names D5). Resolve
      // the title against the OTHER Spaces' names: a free title passes through,
      // a colliding one auto-disambiguates ("Work" → "Work 2"). When the result
      // differs from the typed title, re-title the live Chrome group so the
      // group and the record stay in lockstep.
      const taken = new Set(
        ctx.store.state.spaces
          .filter((s) => s.id !== spaceId)
          .map((s) => normalizeSpaceName(s.name)),
      );
      const resolved = disambiguateSpaceName(title, taken);
      if (resolved === space.name) return; // nothing to mirror (no real change)
      ctx.store.renameSpace(spaceId, resolved);
      if (resolved !== title) {
        // Best-effort re-title — a failure must not throw the drain; the group
        // re-syncs to the Space name on next activation.
        try {
          await updateGroupTitleColor(group.id, resolved, space.color);
        } catch (err) {
          log.debug('tabGroups.onUpdated: re-title after disambiguation failed', {
            spaceId,
            groupId: group.id,
            err,
          });
        }
      }
      ctx.markDirty();
    },
    'windows.onCreated': (ctx, event) => {
      // Only normal windows host tab groups; ignore popups/app/devtools windows
      // so they never gain an `activeSpaceByWindow` entry and the group
      // orchestration never attempts a grouping Chrome would reject.
      if (!isManagedWindow(event.payload.window)) return;
      const id = event.payload.window.id;
      if (id === undefined) return;
      ctx.store.onWindowOpened(id);
      ctx.markDirty();
    },
    'windows.onRemoved': (ctx, event) => {
      ctx.store.onWindowClosed(event.payload.windowId);
      ctx.markDirty();
    },
  };
}
