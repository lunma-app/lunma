// Account lifecycle handlers (connector-accounts). The connected-Account entity
// lives in `AppState.sources` (single-writer), so create/rename/delete are bus
// commands here; the per-source TOKEN is NOT `AppState` — a surface writes it
// directly via `setAccountToken`, and disconnect pairs `deleteAccount` with
// `setAccountToken(id, null)`. Account ids are CLIENT-minted (a surface UUID) so
// a following `createLens` can reference the new id without awaiting the ack.

import type { SourceAccount } from '../../shared/types';
import { isCloudBitbucketHost, normalizeBaseUrl } from '../lenses';
import type { HandlersMap } from './context';

export function accountHandlers(): Pick<
  HandlersMap,
  'createAccount' | 'renameAccount' | 'deleteAccount'
> {
  return {
    createAccount: (ctx, event) => {
      const { id, provider, baseUrl, name, workspace } = event.payload;
      // Reject a duplicate client-minted id (collision) — error ack, no entity.
      if (ctx.store.state.sources[id] !== undefined) {
        throw new Error(`createAccount: account id '${id}' already exists`);
      }
      // Normalize + validate the baseUrl (absolute http(s), trailing slash
      // stripped); a non-http(s) URL throws → error ack, no entity.
      const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
      // A Cloud bitbucket account (host bitbucket.org) REQUIRES a workspace
      // (add-bitbucket-connector, D3) — its PR query is workspace-scoped. A
      // missing/empty workspace throws → error ack, no entity. Self-hosted
      // (Server/DC) bitbucket and every other provider ignore it.
      const isCloudBitbucket = provider === 'bitbucket' && isCloudBitbucketHost(normalizedBaseUrl);
      if (isCloudBitbucket && (workspace === undefined || workspace.trim() === '')) {
        throw new Error('createAccount: a Cloud bitbucket account requires a workspace');
      }
      const account: SourceAccount = {
        id,
        provider,
        baseUrl: normalizedBaseUrl,
        ...(name !== undefined ? { name } : {}),
        // Persist the workspace only for a Cloud bitbucket account (it is
        // meaningless for every other source).
        ...(isCloudBitbucket && workspace !== undefined ? { workspace } : {}),
      };
      ctx.store.addSource(account);
      ctx.markDirty();
    },
    renameAccount: (ctx, event) => {
      const { id, name } = event.payload;
      if (ctx.store.state.sources[id] === undefined) {
        throw new Error(`renameAccount: unknown account '${id}'`);
      }
      ctx.store.renameSource(id, name);
      ctx.markDirty();
    },
    deleteAccount: (ctx, event) => {
      const { id } = event.payload;
      if (ctx.store.state.sources[id] === undefined) {
        throw new Error(`deleteAccount: unknown account '${id}'`);
      }
      // Remove the entity; lens references to `id` are left DANGLING (design D9)
      // and render the calm "account removed" state. The surface pairs this with
      // `setAccountToken(id, null)` to clear the secret (not `AppState`, so not
      // here).
      ctx.store.removeSource(id);
      ctx.markDirty();
    },
  };
}
