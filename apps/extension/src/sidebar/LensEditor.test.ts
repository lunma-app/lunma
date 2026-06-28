import { cleanup, fireEvent, render, waitFor } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { PinNode, SourceAccount } from '../shared/types';
import LensEditorHarness from './LensEditor.test.harness.svelte';

type LensNode = Extract<PinNode, { kind: 'lens' }>;

// LensEditor (sources-redesign, D4): connection-first — no kind picker; the
// picker lists ALL sources; a derived entity preview; the shared
// ServiceConnectPicker mints inline; Create dispatches `createLens` WITHOUT a
// `lensKind` (client-minted id) and opens the lens's overview page.

const { sendMock, setTokenMock } = vi.hoisted(() => ({
  sendMock: vi.fn(() => Promise.resolve()),
  setTokenMock: vi.fn(() => Promise.resolve()),
}));
vi.mock('../shared/bus', () => ({ bus: { send: sendMock }, dispatch: sendMock }));
vi.mock('../shared/connectors', () => ({
  readAccountTokens: vi.fn(() => Promise.resolve({})),
  setAccountToken: setTokenMock,
}));

let permissionsRequestMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  sendMock.mockClear();
  setTokenMock.mockClear();
  permissionsRequestMock = vi.fn(() => Promise.resolve(true));
  (globalThis as unknown as { chrome: unknown }).chrome = {
    permissions: {
      request: permissionsRequestMock,
      contains: vi.fn(() => Promise.resolve(true)),
    },
  };
});
afterEach(() => {
  cleanup();
  delete (globalThis as unknown as { chrome?: unknown }).chrome;
});

// ── account fixtures ─────────────────────────────────────────────────────────────
const GL: SourceAccount = {
  id: 'acc-gl',
  provider: 'gitlab',
  baseUrl: 'https://gitlab.com',
  name: 'Work GitLab',
};
const GH: SourceAccount = { id: 'acc-gh', provider: 'github', baseUrl: 'https://github.com' };
const JIRA: SourceAccount = {
  id: 'acc-jira',
  provider: 'jira',
  baseUrl: 'https://acme.atlassian.net',
};
const RSS: SourceAccount = {
  id: 'acc-rss',
  provider: 'rss',
  baseUrl: 'https://news.example.com/rss',
};

const confirmBtn = (c: HTMLElement): HTMLButtonElement =>
  c.querySelector('[data-testid="smart-folder-confirm"]') as HTMLButtonElement;
// The picker is an inline `MultiSelect`: one `multi-select-option` per connected
// source, keyed by account id via `data-value`.
const sourceRows = (c: HTMLElement): HTMLElement[] =>
  [...c.querySelectorAll('[data-testid="multi-select-option"]')] as HTMLElement[];
const toggleFor = (c: HTMLElement, id: string): HTMLButtonElement =>
  c.querySelector(`[data-testid="multi-select-option"][data-value="${id}"]`) as HTMLButtonElement;
const isChecked = (el: HTMLElement): boolean => el.getAttribute('aria-selected') === 'true';
const entityChips = (c: HTMLElement): string[] =>
  [...c.querySelectorAll('[data-testid="entity-chip"]')].map((e) => (e.textContent ?? '').trim());

type Cmd = { kind: string; payload: Record<string, unknown> };
const cmds = (kind: string): Cmd[] =>
  sendMock.mock.calls.map((c) => (c as unknown[])[0] as Cmd).filter((m) => m?.kind === kind);
const lastCreateLens = () => cmds('createLens').at(-1);
const lastCreateAccount = () => cmds('createAccount').at(-1);

/** The shared Service `Select` is a custom listbox: open it, click the option. */
async function selectService(c: HTMLElement, label: string): Promise<void> {
  await fireEvent.click(c.querySelector('[data-testid="connect-service"]') as HTMLButtonElement);
  const option = [...c.querySelectorAll('[data-testid="select-option"]')].find(
    (o) => o.textContent?.trim() === label,
  ) as HTMLButtonElement;
  await fireEvent.click(option);
}

describe('LensEditor — connection-first (sources-redesign)', () => {
  test('there is no Kind picker', () => {
    const { container } = render(LensEditorHarness, {
      props: { spaceId: 'work', accounts: [GL, GH] },
    });
    expect(container.querySelector('[aria-label="Lens kind"]')).toBeNull();
    expect(container.querySelector('input[value="review"]')).toBeNull();
  });

  test('lists every connected source — accounts AND feeds — with no provider filtering', () => {
    const { container } = render(LensEditorHarness, {
      props: { spaceId: 'work', accounts: [GL, GH, JIRA, RSS] },
    });
    expect(sourceRows(container)).toHaveLength(4);
  });

  test('no connection selected disables Create', () => {
    const { container } = render(LensEditorHarness, {
      props: { spaceId: 'work', accounts: [GL, GH] },
    });
    expect(confirmBtn(container).disabled).toBe(true);
  });

  test('a long source list is fuzzy-searchable by type (provider keyword)', async () => {
    // 9 sources (> the MultiSelect search threshold of 8) so the search box renders.
    const ghAccounts: SourceAccount[] = Array.from({ length: 8 }, (_, i) => ({
      id: `gh-${i}`,
      provider: 'github',
      baseUrl: 'https://github.com',
    }));
    const { container } = render(LensEditorHarness, {
      props: { spaceId: 'work', accounts: [...ghAccounts, RSS] },
    });
    const searchInput = container.querySelector(
      '[data-testid="multi-select-search"]',
    ) as HTMLInputElement;
    expect(searchInput).not.toBeNull();
    // "rss" appears in no visible label — only in the feed's provider/type keyword.
    await fireEvent.input(searchInput, { target: { value: 'rss' } });
    await tick();
    const rows = sourceRows(container);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.getAttribute('data-value')).toBe(RSS.id);
  });

  test('ticking a single source enables Create (no per-source filter gate, D7)', async () => {
    const { container } = render(LensEditorHarness, { props: { spaceId: 'work', accounts: [GL] } });
    expect(confirmBtn(container).disabled).toBe(true);
    await fireEvent.click(toggleFor(container, GL.id));
    await tick();
    // Including the source is enough — no filter must be chosen.
    expect(confirmBtn(container).disabled).toBe(false);
  });

  test('the derived preview names the entities the chosen connections produce', async () => {
    const { container } = render(LensEditorHarness, {
      props: { spaceId: 'work', accounts: [GL, RSS] },
    });
    await fireEvent.click(toggleFor(container, GL.id));
    await tick();
    // A gitlab source emits BOTH Changes (MRs) and Issues (tickets).
    expect(entityChips(container)).toEqual(['Changes', 'Issues']);
    await fireEvent.click(toggleFor(container, RSS.id));
    await tick();
    expect(entityChips(container)).toEqual(['Changes', 'Issues', 'Articles']);
  });

  test('a Bitbucket source contributes only its deployment-supported queries (never an SW-rejected ref)', async () => {
    // Cloud (host bitbucket.org) supports `authored` only; Server/DC adds
    // `review-requested`; neither ever carries `assigned`. The auto-included query
    // set is filtered through `supportedQueriesFor`, so the editor can't mint a ref
    // the SW rejects (add-bitbucket-connector, D4).
    const BB_CLOUD: SourceAccount = {
      id: 'acc-bb-cloud',
      provider: 'bitbucket',
      baseUrl: 'https://bitbucket.org',
      workspace: 'acme',
    };
    const BB_SERVER: SourceAccount = {
      id: 'acc-bb-srv',
      provider: 'bitbucket',
      baseUrl: 'https://bitbucket.example.com',
    };
    const { container } = render(LensEditorHarness, {
      props: { spaceId: 'work', accounts: [BB_CLOUD, BB_SERVER] },
    });
    await fireEvent.click(toggleFor(container, BB_CLOUD.id));
    await fireEvent.click(toggleFor(container, BB_SERVER.id));
    await tick();
    await fireEvent.click(confirmBtn(container));

    const sources = lastCreateLens()?.payload.sources as Array<{
      sourceId: string;
      queries: string[];
    }>;
    expect(sources).toEqual([
      { sourceId: 'acc-bb-cloud', queries: ['authored'] },
      { sourceId: 'acc-bb-srv', queries: ['authored', 'review-requested'] },
    ]);
    for (const s of sources) expect(s.queries).not.toContain('assigned');
  });

  test('Create dispatches sources WITHOUT lensKind and opens the overview page', async () => {
    const { container } = render(LensEditorHarness, { props: { spaceId: 'work', accounts: [GL] } });
    await fireEvent.click(toggleFor(container, GL.id));
    await tick();
    expect(confirmBtn(container).disabled).toBe(false);
    await fireEvent.click(confirmBtn(container));

    const create = lastCreateLens();
    // A ticked git source contributes its FULL query set (D7) — no per-source picking.
    expect(create?.payload.sources).toEqual([
      { sourceId: 'acc-gl', queries: ['authored', 'assigned', 'review-requested'] },
    ]);
    // No client-supplied kind — the SW derives it.
    expect(create?.payload).not.toHaveProperty('lensKind');
    // A client-minted id is sent so the page can open.
    const newId = create?.payload.id as string;
    expect(typeof newId).toBe('string');
    // Create opens the new lens's overview page in this window.
    const openPage = cmds('openLensPage').at(-1);
    expect(openPage?.payload).toEqual({ spaceId: 'work', folderId: newId, windowId: 1 });
  });

  test('connecting a new service inline (shared picker) mints it and returns it pre-selected', async () => {
    const { container } = render(LensEditorHarness, { props: { spaceId: 'work', accounts: [] } });
    // Open the shared Service-dropdown picker.
    await fireEvent.click(
      container.querySelector('[data-testid="smart-add-source"]') as HTMLButtonElement,
    );
    await tick();
    expect(container.querySelector('[data-testid="connect-service"]')).not.toBeNull();
    // Default service is GitHub (pat-only): enter a token, then Connect.
    await fireEvent.input(
      container.querySelector('[data-testid="connect-token"]') as HTMLInputElement,
      {
        target: { value: 'ghp-secret' },
      },
    );
    await fireEvent.click(
      container.querySelector('[data-testid="connect-commit"]') as HTMLButtonElement,
    );
    await tick();

    const created = lastCreateAccount();
    expect(created?.payload.provider).toBe('github');
    expect(typeof created?.payload.id).toBe('string');
    expect(setTokenMock).toHaveBeenCalledWith(created?.payload.id, 'ghp-secret');
    // It returns to the picker pre-selected → Create is enabled.
    expect(confirmBtn(container).disabled).toBe(false);
  });

  test('OPML import in the editor adds the feeds INTO the lens (find-or-mint + pre-select), never a standalone "Feeds" lens', async () => {
    const { container } = render(LensEditorHarness, { props: { spaceId: 'work', accounts: [] } });
    await fireEvent.click(
      container.querySelector('[data-testid="smart-add-source"]') as HTMLButtonElement,
    );
    await tick();
    await selectService(container, 'RSS feed');

    const file = new File(
      [
        '<opml><body>' +
          '<outline type="rss" text="A" xmlUrl="https://a.example.com/feed"/>' +
          '<outline type="rss" text="B" xmlUrl="https://b.example.com/feed"/>' +
          '</body></opml>',
      ],
      'feeds.opml',
      { type: 'text/x-opml' },
    );
    const fileInput = container.querySelector(
      '[data-testid="connect-import-file"]',
    ) as HTMLInputElement;
    Object.defineProperty(fileInput, 'files', { value: [file], configurable: true });
    await fireEvent.change(fileInput);
    await waitFor(() =>
      expect(container.querySelector('[data-testid="connect-import-button"]')).not.toBeNull(),
    );
    await fireEvent.click(
      container.querySelector('[data-testid="connect-import-button"]') as HTMLButtonElement,
    );
    await tick();

    // Two rss accounts minted client-side — NOT a standalone Feeds lens.
    const accts = cmds('createAccount');
    expect(accts).toHaveLength(2);
    expect(accts.every((c) => c.payload.provider === 'rss')).toBe(true);
    expect(cmds('importOpml')).toHaveLength(0);

    // Both feeds are pre-selected, so Save emits them as THIS lens's rss sources.
    await fireEvent.click(confirmBtn(container));
    const ids = accts.map((c) => c.payload.id as string);
    expect(lastCreateLens()?.payload.sources).toEqual(
      ids.map((id) => ({ sourceId: id, queries: [] })),
    );
  });

  test('edit mode pre-selects the node references and Save dispatches updateLens without lensKind', async () => {
    const node: LensNode = {
      kind: 'lens',
      lensKind: 'review',
      id: 'lens-1',
      name: 'My work',
      icon: 'folder-git-2',
      sources: [{ sourceId: 'acc-gl', queries: ['review-requested'] }],
      maxItems: 20,
      hideRead: false,
      refreshMinutes: 10,
    };
    const { container } = render(LensEditorHarness, {
      props: { spaceId: 'work', node, accounts: [GL, GH] },
    });
    // The node's source is pre-selected (its row is ticked).
    expect(isChecked(toggleFor(container, GL.id))).toBe(true);
    await fireEvent.click(confirmBtn(container));
    const update = cmds('updateLens').at(-1);
    expect(update?.payload.folderId).toBe('lens-1');
    // Save re-emits the source with its FULL query set (D7) — the editor no longer
    // scopes a source to a single relation, so the prior `['review-requested']`
    // widens to the canonical set.
    expect(update?.payload.sources).toEqual([
      { sourceId: 'acc-gl', queries: ['authored', 'assigned', 'review-requested'] },
    ]);
    expect(update?.payload).not.toHaveProperty('lensKind');
    // Save does not open a page (only Create does).
    expect(cmds('openLensPage')).toHaveLength(0);
  });
});
