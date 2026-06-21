import { cleanup, fireEvent, render } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { PinNode } from '../shared/types';
import SmartFolderEditorHarness from './SmartFolderEditor.test.harness.svelte';

type SmartNode = Extract<PinNode, { kind: 'smart' }>;

const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn(() => Promise.resolve()) }));
vi.mock('../shared/bus', () => ({ bus: { send: sendMock }, dispatch: sendMock }));

/** `chrome.permissions.request` — confirm requests the connector's required host
 * origins from the user gesture (least-privilege-permissions D4). */
let permissionsRequestMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  sendMock.mockClear();
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const nameInput = (c: HTMLElement): HTMLInputElement =>
  c.querySelector('[data-testid="smart-folder-name"]') as HTMLInputElement;

const confirmBtn = (c: HTMLElement): HTMLButtonElement =>
  [...c.querySelectorAll('button')].find((b) =>
    /Add smart folder|Save/.test(b.textContent ?? ''),
  ) as HTMLButtonElement;

/** The SegmentedControl label text for the option whose radio carries `value`. */
const optionLabel = (c: HTMLElement, value: string): string =>
  c.querySelector(`input[value="${value}"]`)?.closest('label')?.querySelector('.option-label')
    ?.textContent ?? '';

const trigger = (c: HTMLElement, testid: string): HTMLButtonElement =>
  c.querySelector(`[data-testid="${testid}"]`) as HTMLButtonElement;

/** The current value shown on a `Select` trigger. */
const selectValue = (c: HTMLElement, testid: string): string | null =>
  trigger(c, testid).getAttribute('data-value');

/** Open a `Select` (by trigger testid) and pick the option carrying `value`. */
async function pickSelect(c: HTMLElement, testid: string, value: string): Promise<void> {
  const el = trigger(c, testid);
  await fireEvent.click(el);
  const root = el.closest('.select') as HTMLElement;
  const option = root.querySelector(`[role="option"][data-value="${value}"]`) as HTMLButtonElement;
  await fireEvent.click(option);
}

// Add-source form helpers — testids live inside the inline add form.
const addSourceOpenBtn = (c: HTMLElement): HTMLButtonElement =>
  c.querySelector('[data-testid="smart-add-source-open"]') as HTMLButtonElement;

const addSourceUrlInput = (c: HTMLElement): HTMLInputElement =>
  c.querySelector('[data-testid="smart-add-source-url"]') as HTMLInputElement;

const addSourceConfirmBtn = (c: HTMLElement): HTMLButtonElement =>
  c.querySelector('[data-testid="smart-add-source-confirm"]') as HTMLButtonElement;

const sourceEntries = (c: HTMLElement): Element[] => [
  ...c.querySelectorAll('[data-testid="smart-source-entry"]'),
];

const removeSourceBtns = (c: HTMLElement): HTMLButtonElement[] =>
  [...c.querySelectorAll('[aria-label="Remove source"]')] as HTMLButtonElement[];

/** Open the "Add source" inline form (no-op in create mode, where it auto-opens). */
const openAddForm = async (c: HTMLElement): Promise<void> => {
  const btn = addSourceOpenBtn(c);
  if (btn) await fireEvent.click(btn);
};

/** Open the add form, optionally override source/URL/query, then click Add. */
async function fillAndAddSource(
  c: HTMLElement,
  opts: { source?: string; baseUrl?: string; query?: string } = {},
): Promise<void> {
  await openAddForm(c);
  if (opts.source) await pickSelect(c, 'smart-add-source-type', opts.source);
  if (opts.baseUrl !== undefined) {
    await fireEvent.input(addSourceUrlInput(c), { target: { value: opts.baseUrl } });
  }
  if (opts.query) {
    await fireEvent.click(c.querySelector(`input[value="${opts.query}"]`) as HTMLInputElement);
  }
  await fireEvent.click(addSourceConfirmBtn(c));
}

function existingNode(overrides: Partial<SmartNode> = {}): SmartNode {
  return {
    kind: 'smart',
    id: 'sf-1',
    name: 'Assigned to me',
    icon: 'folder-git-2',
    sources: [{ source: 'gitlab', baseUrl: 'https://gitlab.example.com', query: 'assigned' }],
    maxItems: 20,
    hideRead: false,
    refreshMinutes: 10,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Create mode
// ---------------------------------------------------------------------------

describe('SmartFolderEditor — create mode', () => {
  test('the add form defaults to gitlab, gitlab.com, and review-requested', async () => {
    const { container } = render(SmartFolderEditorHarness, { props: { spaceId: 'work' } });
    // confirm is disabled until at least one source is added
    expect(confirmBtn(container).disabled).toBe(true);
    await openAddForm(container);
    expect(selectValue(container, 'smart-add-source-type')).toBe('gitlab');
    expect(addSourceUrlInput(container).value).toBe('https://gitlab.com');
    expect(
      (container.querySelector('input[value="review-requested"]') as HTMLInputElement).checked,
    ).toBe(true);
  });

  test('global cadence defaults to 10 min and cap defaults to 10 items', () => {
    const { container } = render(SmartFolderEditorHarness, { props: { spaceId: 'work' } });
    expect(container.querySelector('[data-testid="smart-folder-cadence"]')?.textContent).toContain(
      'Every 10 minutes',
    );
    expect(selectValue(container, 'smart-folder-max-items')).toBe('10');
  });

  test('adding the first source auto-suggests the name from the query', async () => {
    const { container } = render(SmartFolderEditorHarness, { props: { spaceId: 'work' } });
    await fillAndAddSource(container, { baseUrl: 'https://gitlab.com' }); // review-requested default
    expect(nameInput(container).value).toBe('Review requests');
    expect(sourceEntries(container)).toHaveLength(1);
    expect(confirmBtn(container).disabled).toBe(false);
  });

  test('confirm dispatches createSmartFolder with the panel values (incl. maxItems) and calls onDone', async () => {
    const onDone = vi.fn();
    const { container } = render(SmartFolderEditorHarness, {
      props: { spaceId: 'work', onDone },
    });
    await fillAndAddSource(container, {
      baseUrl: 'https://gitlab.example.com',
      query: 'authored',
    });
    await pickSelect(container, 'smart-folder-cadence', '30');
    await pickSelect(container, 'smart-folder-max-items', '50');
    await fireEvent.click(confirmBtn(container));

    expect(sendMock).toHaveBeenCalledWith({
      kind: 'createSmartFolder',
      payload: {
        spaceId: 'work',
        sources: [{ source: 'gitlab', baseUrl: 'https://gitlab.example.com', query: 'authored' }],
        name: 'My merge requests',
        maxItems: 50,
        refreshMinutes: 30,
      },
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  test('create dispatch carries the picked source (GitHub)', async () => {
    const { container } = render(SmartFolderEditorHarness, { props: { spaceId: 'work' } });
    await fillAndAddSource(container, { source: 'github' }); // URL auto-swaps to github.com
    await fireEvent.click(confirmBtn(container));

    expect(sendMock).toHaveBeenCalledWith({
      kind: 'createSmartFolder',
      payload: {
        spaceId: 'work',
        sources: [{ source: 'github', baseUrl: 'https://github.com', query: 'review-requested' }],
        name: 'Review requests',
        maxItems: 10,
        refreshMinutes: 10,
      },
    });
  });

  test('the suggested name follows the first added source+query; a manual name sticks afterwards', async () => {
    const { container } = render(SmartFolderEditorHarness, { props: { spaceId: 'work' } });
    await fillAndAddSource(container, { query: 'assigned' });
    expect(nameInput(container).value).toBe('Assigned to me');
    // Manual input pins the name.
    await fireEvent.input(nameInput(container), { target: { value: 'My queue' } });
    // Remove source and re-add with a different query — manual name must not be overwritten.
    await fireEvent.click(removeSourceBtns(container)[0] as HTMLButtonElement);
    await fillAndAddSource(container, { query: 'authored' });
    expect(nameInput(container).value).toBe('My queue');
  });

  test('an invalid URL in the add form disables the Add button', async () => {
    const { container } = render(SmartFolderEditorHarness, { props: { spaceId: 'work' } });
    await openAddForm(container);
    await fireEvent.input(addSourceUrlInput(container), { target: { value: 'not a url' } });
    expect(addSourceConfirmBtn(container).disabled).toBe(true);
  });

  test('an empty URL and a non-http(s) scheme both disable Add', async () => {
    const { container } = render(SmartFolderEditorHarness, { props: { spaceId: 'work' } });
    await openAddForm(container);
    await fireEvent.input(addSourceUrlInput(container), { target: { value: '' } });
    expect(addSourceConfirmBtn(container).disabled).toBe(true);
    await fireEvent.input(addSourceUrlInput(container), { target: { value: 'ftp://gitlab.com' } });
    expect(addSourceConfirmBtn(container).disabled).toBe(true);
  });

  test('the source picker in the add form holds all four sources and defaults to GitLab', async () => {
    const { container } = render(SmartFolderEditorHarness, { props: { spaceId: 'work' } });
    await openAddForm(container);
    const sourceTrigger = trigger(container, 'smart-add-source-type');
    expect(selectValue(container, 'smart-add-source-type')).toBe('gitlab');
    // The source picker sits above the URL input in document order.
    expect(
      sourceTrigger.compareDocumentPosition(addSourceUrlInput(container)) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    // Open it and assert the five sources (gitlab, github, jira, rss, opml).
    await fireEvent.click(sourceTrigger);
    const root = sourceTrigger.closest('.select') as HTMLElement;
    const values = [...root.querySelectorAll('[role="option"]')].map((o) =>
      o.getAttribute('data-value'),
    );
    expect(values).toEqual(['gitlab', 'github', 'jira', 'rss', 'opml']);
  });

  test('picking GitHub in the add form swaps the default URL to github.com', async () => {
    const { container } = render(SmartFolderEditorHarness, { props: { spaceId: 'work' } });
    await openAddForm(container);
    await pickSelect(container, 'smart-add-source-type', 'github');
    expect(addSourceUrlInput(container).value).toBe('https://github.com');
  });

  test('a custom URL is never clobbered by a source switch in the add form', async () => {
    const { container } = render(SmartFolderEditorHarness, { props: { spaceId: 'work' } });
    await openAddForm(container);
    await fireEvent.input(addSourceUrlInput(container), {
      target: { value: 'https://gitlab.example.com' },
    });
    await pickSelect(container, 'smart-add-source-type', 'github');
    expect(addSourceUrlInput(container).value).toBe('https://gitlab.example.com');
  });

  test('the hint reflects committed sources: per-source for one, generic for many', async () => {
    const { container } = render(SmartFolderEditorHarness, { props: { spaceId: 'work' } });
    const hint = (): string =>
      container.querySelector('[data-testid="smart-folder-hint"]')?.textContent ?? '';
    expect(hint()).toContain('Add at least one source');
    await fillAndAddSource(container, {});
    expect(hint()).toContain("Signed in to GitLab in this browser? That's enough.");
    expect(hint()).toContain('Settings → Connectors');
    await fillAndAddSource(container, { source: 'github' });
    expect(hint()).toContain('Each source fetches independently');
  });

  test('switching to Jira in the add form swaps URL, the third-slot label to "Watching", and the hint after add', async () => {
    const { container } = render(SmartFolderEditorHarness, { props: { spaceId: 'work' } });
    await openAddForm(container);
    await pickSelect(container, 'smart-add-source-type', 'jira');
    expect(addSourceUrlInput(container).value).toBe('https://your-site.atlassian.net');
    expect(optionLabel(container, 'review-requested')).toBe('Watching');
    expect(
      (container.querySelector('input[value="review-requested"]') as HTMLInputElement).checked,
    ).toBe(true);
    await fireEvent.click(addSourceConfirmBtn(container));
    expect(container.querySelector('[data-testid="smart-folder-hint"]')?.textContent).toBe(
      "Signed in to Jira in this browser? That's enough.",
    );
  });

  test('create dispatch carries the picked source (Jira)', async () => {
    const { container } = render(SmartFolderEditorHarness, { props: { spaceId: 'work' } });
    await fillAndAddSource(container, { source: 'jira' });
    await fireEvent.click(confirmBtn(container));
    expect(sendMock).toHaveBeenCalledWith({
      kind: 'createSmartFolder',
      payload: {
        spaceId: 'work',
        sources: [
          {
            source: 'jira',
            baseUrl: 'https://your-site.atlassian.net',
            query: 'review-requested',
          },
        ],
        name: 'Watching',
        maxItems: 10,
        refreshMinutes: 10,
      },
    });
  });

  test('the canonical-URL swap rule covers all four sources; a custom URL is left untouched', async () => {
    const { container } = render(SmartFolderEditorHarness, { props: { spaceId: 'work' } });
    await openAddForm(container);
    await pickSelect(container, 'smart-add-source-type', 'jira');
    expect(addSourceUrlInput(container).value).toBe('https://your-site.atlassian.net');
    await pickSelect(container, 'smart-add-source-type', 'github');
    expect(addSourceUrlInput(container).value).toBe('https://github.com');
    await pickSelect(container, 'smart-add-source-type', 'rss');
    expect(addSourceUrlInput(container).value).toBe('');
    await pickSelect(container, 'smart-add-source-type', 'gitlab');
    expect(addSourceUrlInput(container).value).toBe('https://gitlab.com');
    // Custom URL survives a source switch.
    await fireEvent.input(addSourceUrlInput(container), {
      target: { value: 'https://jira.acme.dev' },
    });
    await pickSelect(container, 'smart-add-source-type', 'jira');
    expect(addSourceUrlInput(container).value).toBe('https://jira.acme.dev');
  });
});

// ---------------------------------------------------------------------------
// RSS adaptation (rss-connector)
// ---------------------------------------------------------------------------

describe('SmartFolderEditor — RSS adaptation (rss-connector)', () => {
  test('picking RSS in the add form relabels the URL field, hides the query, shows the cap, and flips cadence to 30 after add', async () => {
    const { container } = render(SmartFolderEditorHarness, { props: { spaceId: 'work' } });
    await openAddForm(container);
    await pickSelect(container, 'smart-add-source-type', 'rss');

    // "Feed URL" label, not "Instance URL".
    expect(container.textContent).toContain('Feed URL');
    expect(container.textContent).not.toContain('Instance URL');
    // The canned-query control is hidden for a feed.
    expect(container.querySelector('input[value="authored"]')).toBeNull();
    // The "Show at most" cap is still rendered.
    expect(container.querySelector('[data-testid="smart-folder-max-items"]')).not.toBeNull();

    // Add a feed URL and commit — cadence should flip to 30.
    await fireEvent.input(addSourceUrlInput(container), {
      target: { value: 'https://news.ycombinator.com/rss' },
    });
    await fireEvent.click(addSourceConfirmBtn(container));
    expect(container.querySelector('[data-testid="smart-folder-cadence"]')?.textContent).toContain(
      'Every 30 minutes',
    );
    // The no-sign-in hint.
    expect(container.querySelector('[data-testid="smart-folder-hint"]')?.textContent).toBe(
      'Public feed — no sign-in needed. Paste the feed URL.',
    );
  });

  test('confirm dispatches createSmartFolder with source rss, the chosen maxItems, and NO query', async () => {
    const onDone = vi.fn();
    const { container } = render(SmartFolderEditorHarness, { props: { spaceId: 'work', onDone } });
    await openAddForm(container);
    await pickSelect(container, 'smart-add-source-type', 'rss');
    await fireEvent.input(addSourceUrlInput(container), {
      target: { value: 'https://news.ycombinator.com/rss' },
    });
    await fireEvent.click(addSourceConfirmBtn(container));
    await fireEvent.input(nameInput(container), { target: { value: 'Hacker News' } });
    await pickSelect(container, 'smart-folder-max-items', '30');
    await fireEvent.click(confirmBtn(container));

    expect(sendMock).toHaveBeenCalledWith({
      kind: 'createSmartFolder',
      payload: {
        spaceId: 'work',
        sources: [{ source: 'rss', baseUrl: 'https://news.ycombinator.com/rss' }],
        name: 'Hacker News',
        maxItems: 30,
        refreshMinutes: 30,
      },
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  test('an empty feed URL keeps Add disabled (a feed has no canonical default)', async () => {
    const { container } = render(SmartFolderEditorHarness, { props: { spaceId: 'work' } });
    await openAddForm(container);
    await pickSelect(container, 'smart-add-source-type', 'rss');
    expect(addSourceUrlInput(container).value).toBe('');
    expect(addSourceConfirmBtn(container).disabled).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Edit mode
// ---------------------------------------------------------------------------

describe('SmartFolderEditor — edit mode', () => {
  test('pre-fills name, cap, and existing source in the list', () => {
    const { container } = render(SmartFolderEditorHarness, {
      props: { spaceId: 'work', node: existingNode() },
    });
    const entries = sourceEntries(container);
    expect(entries).toHaveLength(1);
    expect((entries[0] as HTMLElement).querySelector('.source-chip')?.textContent).toBe('GitLab');
    expect((entries[0] as HTMLElement).querySelector('.source-url')?.textContent).toBe(
      'gitlab.example.com',
    );
    expect(nameInput(container).value).toBe('Assigned to me');
    expect(selectValue(container, 'smart-folder-max-items')).toBe('20');
  });

  test('a maxItems change confirms as updateSmartFolder carrying the new cap (the SW refetches)', async () => {
    const { container } = render(SmartFolderEditorHarness, {
      props: { spaceId: 'work', node: existingNode() },
    });
    await pickSelect(container, 'smart-folder-max-items', '50');
    await fireEvent.click(confirmBtn(container));

    expect(sendMock).toHaveBeenCalledWith({
      kind: 'updateSmartFolder',
      payload: {
        spaceId: 'work',
        folderId: 'sf-1',
        sources: [{ source: 'gitlab', baseUrl: 'https://gitlab.example.com', query: 'assigned' }],
        name: 'Assigned to me',
        maxItems: 50,
        refreshMinutes: 10,
      },
    });
  });

  test('removing existing source and re-adding with a new query dispatches updateSmartFolder (the SW refetches)', async () => {
    const onDone = vi.fn();
    const { container } = render(SmartFolderEditorHarness, {
      props: { spaceId: 'work', node: existingNode(), onDone },
    });
    await fireEvent.click(removeSourceBtns(container)[0] as HTMLButtonElement);
    await fillAndAddSource(container, {
      baseUrl: 'https://gitlab.example.com',
      query: 'review-requested',
    });
    await fireEvent.click(confirmBtn(container));

    expect(sendMock).toHaveBeenCalledWith({
      kind: 'updateSmartFolder',
      payload: {
        spaceId: 'work',
        folderId: 'sf-1',
        sources: [
          { source: 'gitlab', baseUrl: 'https://gitlab.example.com', query: 'review-requested' },
        ],
        name: 'Assigned to me',
        maxItems: 20,
        refreshMinutes: 10,
      },
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  test('removing existing source and re-adding with a different source dispatches updateSmartFolder', async () => {
    const { container } = render(SmartFolderEditorHarness, {
      props: { spaceId: 'work', node: existingNode() },
    });
    await fireEvent.click(removeSourceBtns(container)[0] as HTMLButtonElement);
    await fillAndAddSource(container, {
      source: 'github',
      baseUrl: 'https://gitlab.example.com',
    });
    await fireEvent.click(confirmBtn(container));

    expect(sendMock).toHaveBeenCalledWith({
      kind: 'updateSmartFolder',
      payload: {
        spaceId: 'work',
        folderId: 'sf-1',
        sources: [
          { source: 'github', baseUrl: 'https://gitlab.example.com', query: 'review-requested' },
        ],
        name: 'Assigned to me',
        maxItems: 20,
        refreshMinutes: 10,
      },
    });
  });

  test('an edit-mode folder on a canonical default URL swaps to the new default on remove+re-add', async () => {
    const { container } = render(SmartFolderEditorHarness, {
      props: {
        spaceId: 'work',
        node: existingNode({
          sources: [{ source: 'gitlab', baseUrl: 'https://gitlab.com', query: 'assigned' }],
        }),
      },
    });
    await fireEvent.click(removeSourceBtns(container)[0] as HTMLButtonElement);
    await openAddForm(container);
    await pickSelect(container, 'smart-add-source-type', 'github');
    expect(addSourceUrlInput(container).value).toBe('https://github.com');
  });

  test('editing an existing RSS folder pre-fills the source in the list and omits query on save', async () => {
    const feed = existingNode({
      id: 'feed-1',
      sources: [{ source: 'rss', baseUrl: 'https://news.ycombinator.com/rss' }],
      icon: 'rss',
      name: 'Hacker News',
      maxItems: 30,
      refreshMinutes: 30,
    });
    const { container } = render(SmartFolderEditorHarness, {
      props: { spaceId: 'work', node: feed },
    });
    const entries = sourceEntries(container);
    expect(entries).toHaveLength(1);
    expect((entries[0] as HTMLElement).querySelector('.source-chip')?.textContent).toBe('RSS');
    // No query picker visible outside the (closed) add form.
    expect(container.querySelector('input[value="authored"]')).toBeNull();
    await fireEvent.click(confirmBtn(container));
    expect(sendMock).toHaveBeenCalledWith({
      kind: 'updateSmartFolder',
      payload: {
        spaceId: 'work',
        folderId: 'feed-1',
        sources: [{ source: 'rss', baseUrl: 'https://news.ycombinator.com/rss' }],
        name: 'Hacker News',
        maxItems: 30,
        refreshMinutes: 30,
      },
    });
  });
});

// ---------------------------------------------------------------------------
// Host-permission request on confirm (least-privilege-permissions D4)
// ---------------------------------------------------------------------------

describe('SmartFolderEditor — host-permission request on confirm (least-privilege-permissions D4)', () => {
  test('confirming a new GitHub folder requests the api.github.com origin from the gesture', async () => {
    const { container } = render(SmartFolderEditorHarness, { props: { spaceId: 'work' } });
    await fillAndAddSource(container, { source: 'github' });
    await fireEvent.click(confirmBtn(container));
    expect(permissionsRequestMock).toHaveBeenCalledWith({ origins: ['https://api.github.com/*'] });
  });

  test('a denied host dialog still creates the folder (never blocks — it lands in needs-access)', async () => {
    permissionsRequestMock.mockResolvedValue(false);
    const onDone = vi.fn();
    const { container } = render(SmartFolderEditorHarness, { props: { spaceId: 'work', onDone } });
    await fillAndAddSource(container, { baseUrl: 'https://gitlab.example.com' });
    await fireEvent.click(confirmBtn(container));
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'createSmartFolder',
        payload: expect.objectContaining({
          sources: [
            { source: 'gitlab', baseUrl: 'https://gitlab.example.com', query: 'review-requested' },
          ],
        }),
      }),
    );
    expect(permissionsRequestMock).toHaveBeenCalledWith({
      origins: ['https://gitlab.example.com/*'],
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  test('a sources-unchanged edit (name only) requests no host permission', async () => {
    const { container } = render(SmartFolderEditorHarness, {
      props: { spaceId: 'work', node: existingNode() },
    });
    await fireEvent.input(nameInput(container), { target: { value: 'My renamed folder' } });
    await fireEvent.click(confirmBtn(container));
    expect(sendMock).toHaveBeenCalledWith(expect.objectContaining({ kind: 'updateSmartFolder' }));
    expect(permissionsRequestMock).not.toHaveBeenCalled();
  });

  test('a URL-changing edit (remove + re-add) requests the new origins', async () => {
    const { container } = render(SmartFolderEditorHarness, {
      props: { spaceId: 'work', node: existingNode() },
    });
    await fireEvent.click(removeSourceBtns(container)[0] as HTMLButtonElement);
    await fillAndAddSource(container, { baseUrl: 'https://gitlab.other.com' });
    await fireEvent.click(confirmBtn(container));
    expect(permissionsRequestMock).toHaveBeenCalledWith({
      origins: ['https://gitlab.other.com/*'],
    });
  });
});
