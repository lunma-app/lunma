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
const BB_CLOUD: SourceAccount = {
  id: 'acc-bb-cloud',
  provider: 'bitbucket',
  baseUrl: 'https://bitbucket.org',
  workspace: 'acme',
};
const BB_SERVER: SourceAccount = {
  id: 'acc-bb-dc',
  provider: 'bitbucket',
  baseUrl: 'https://bitbucket.example.com',
};

const confirmBtn = (c: HTMLElement): HTMLButtonElement =>
  c.querySelector('[data-testid="smart-folder-confirm"]') as HTMLButtonElement;
const pickRows = (c: HTMLElement): HTMLElement[] =>
  [...c.querySelectorAll('[data-testid="account-pick-row"]')] as HTMLElement[];
const rowFor = (c: HTMLElement, id: string): HTMLElement =>
  c.querySelector(`[data-account-id="${id}"]`) as HTMLElement;
const toggleFor = (c: HTMLElement, id: string): HTMLButtonElement =>
  rowFor(c, id).querySelector('[data-testid="account-pick-toggle"]') as HTMLButtonElement;
const pillByLabel = (cardEl: HTMLElement, label: string): HTMLButtonElement =>
  [...cardEl.querySelectorAll('[data-testid="smart-filter-pill"]')].find(
    (b) => (b.textContent ?? '').trim() === label,
  ) as HTMLButtonElement;
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
    expect(pickRows(container)).toHaveLength(4);
  });

  test('no connection selected disables Create', () => {
    const { container } = render(LensEditorHarness, {
      props: { spaceId: 'work', accounts: [GL, GH] },
    });
    expect(confirmBtn(container).disabled).toBe(true);
  });

  test('a selected queue account with zero filters keeps Create disabled', async () => {
    const { container } = render(LensEditorHarness, { props: { spaceId: 'work', accounts: [GL] } });
    await fireEvent.click(toggleFor(container, GL.id)); // default ['review-requested']
    await tick();
    // Remove the only filter → invalid.
    await fireEvent.click(pillByLabel(rowFor(container, GL.id), 'Reviewing'));
    await tick();
    expect(confirmBtn(container).disabled).toBe(true);
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

  test('a Cloud bitbucket account offers ONLY Authored (add-bitbucket-connector D4)', async () => {
    const { container } = render(LensEditorHarness, {
      props: { spaceId: 'work', accounts: [BB_CLOUD] },
    });
    await fireEvent.click(toggleFor(container, BB_CLOUD.id));
    await tick();
    const row = rowFor(container, BB_CLOUD.id);
    const labels = [...row.querySelectorAll('[data-testid="smart-filter-pill"]')].map((b) =>
      (b.textContent ?? '').trim(),
    );
    expect(labels).toEqual(['Authored']);
    // The default selected query is the valid 'authored' (not review-requested).
    expect(pillByLabel(row, 'Authored').getAttribute('aria-pressed')).toBe('true');
  });

  test('a self-hosted bitbucket account offers Authored + Reviewing, never Assigned', async () => {
    const { container } = render(LensEditorHarness, {
      props: { spaceId: 'work', accounts: [BB_SERVER] },
    });
    await fireEvent.click(toggleFor(container, BB_SERVER.id));
    await tick();
    const row = rowFor(container, BB_SERVER.id);
    const labels = [...row.querySelectorAll('[data-testid="smart-filter-pill"]')].map((b) =>
      (b.textContent ?? '').trim(),
    );
    expect(labels).toEqual(['Authored', 'Reviewing']);
  });

  test('Create dispatches sources WITHOUT lensKind and opens the overview page', async () => {
    const { container } = render(LensEditorHarness, { props: { spaceId: 'work', accounts: [GL] } });
    await fireEvent.click(toggleFor(container, GL.id));
    await tick();
    await fireEvent.click(pillByLabel(rowFor(container, GL.id), 'Authored'));
    await tick();
    expect(confirmBtn(container).disabled).toBe(false);
    await fireEvent.click(confirmBtn(container));

    const create = lastCreateLens();
    expect(create?.payload.sources).toEqual([
      { sourceId: 'acc-gl', queries: ['authored', 'review-requested'] },
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
    expect(
      rowFor(container, GL.id).querySelector('[data-testid="smart-filter-pill"]'),
    ).not.toBeNull();
    await fireEvent.click(confirmBtn(container));
    const update = cmds('updateLens').at(-1);
    expect(update?.payload.folderId).toBe('lens-1');
    expect(update?.payload.sources).toEqual([
      { sourceId: 'acc-gl', queries: ['review-requested'] },
    ]);
    expect(update?.payload).not.toHaveProperty('lensKind');
    // Save does not open a page (only Create does).
    expect(cmds('openLensPage')).toHaveLength(0);
  });
});
