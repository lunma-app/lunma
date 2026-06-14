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

const urlInput = (c: HTMLElement): HTMLInputElement =>
  c.querySelector('[data-testid="smart-folder-url"]') as HTMLInputElement;
const nameInput = (c: HTMLElement): HTMLInputElement =>
  c.querySelector('[data-testid="smart-folder-name"]') as HTMLInputElement;
const confirmBtn = (c: HTMLElement): HTMLButtonElement =>
  [...c.querySelectorAll('button')].find((b) =>
    /Add smart folder|Save/.test(b.textContent ?? ''),
  ) as HTMLButtonElement;
/** The SegmentedControl label text for the query option whose radio carries `value`. */
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

/** Switch the Source `Select` to `value`. */
const pickSource = (c: HTMLElement, value: string): Promise<void> =>
  pickSelect(c, 'smart-folder-source', value);

function existingNode(overrides: Partial<SmartNode> = {}): SmartNode {
  return {
    kind: 'smart',
    id: 'sf-1',
    name: 'Assigned to me',
    icon: 'folder-git-2',
    source: 'gitlab',
    baseUrl: 'https://gitlab.example.com',
    query: 'assigned',
    maxItems: 20,
    hideRead: false,
    refreshMinutes: 10,
    ...overrides,
  };
}

describe('SmartFolderEditor — create mode', () => {
  test('defaults: gitlab.com base URL, review-requested query, 10-min cadence, 10-item cap, suggested name', () => {
    const { container } = render(SmartFolderEditorHarness, { props: { spaceId: 'work' } });
    expect(selectValue(container, 'smart-folder-source')).toBe('gitlab');
    expect(urlInput(container).value).toBe('https://gitlab.com');
    expect(
      (container.querySelector('input[value="review-requested"]') as HTMLInputElement).checked,
    ).toBe(true);
    expect(nameInput(container).value).toBe('Review requests');
    expect(container.querySelector('[data-testid="smart-folder-cadence"]')?.textContent).toContain(
      'Every 10 minutes',
    );
    // The "Show at most" cap defaults to 10 for a new folder (design D5).
    expect(selectValue(container, 'smart-folder-max-items')).toBe('10');
  });

  test('confirm dispatches createSmartFolder with the panel values (incl. maxItems) and calls onDone', async () => {
    const onDone = vi.fn();
    const { container } = render(SmartFolderEditorHarness, {
      props: { spaceId: 'work', onDone },
    });
    await fireEvent.input(urlInput(container), {
      target: { value: 'https://gitlab.example.com' },
    });
    await fireEvent.click(container.querySelector('input[value="authored"]') as HTMLInputElement);
    await pickSelect(container, 'smart-folder-cadence', '30');
    await pickSelect(container, 'smart-folder-max-items', '50');
    await fireEvent.click(confirmBtn(container));

    expect(sendMock).toHaveBeenCalledWith({
      kind: 'createSmartFolder',
      payload: {
        spaceId: 'work',
        source: 'gitlab',
        name: 'My merge requests', // auto-suggested from the picked query
        baseUrl: 'https://gitlab.example.com',
        query: 'authored',
        maxItems: 50,
        refreshMinutes: 30,
      },
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  test('create dispatch carries the picked source (GitHub)', async () => {
    const { container } = render(SmartFolderEditorHarness, { props: { spaceId: 'work' } });
    await pickSource(container, 'github');
    await fireEvent.click(confirmBtn(container));

    expect(sendMock).toHaveBeenCalledWith({
      kind: 'createSmartFolder',
      payload: {
        spaceId: 'work',
        source: 'github',
        name: 'Review requests', // the shared review-requested suggestion
        baseUrl: 'https://github.com', // swapped by the canonical-default rule
        query: 'review-requested',
        maxItems: 10,
        refreshMinutes: 10,
      },
    });
  });

  test('the suggested name follows the query until the user types their own', async () => {
    const { container } = render(SmartFolderEditorHarness, { props: { spaceId: 'work' } });
    await fireEvent.click(container.querySelector('input[value="assigned"]') as HTMLInputElement);
    expect(nameInput(container).value).toBe('Assigned to me');
    await fireEvent.input(nameInput(container), { target: { value: 'My queue' } });
    await fireEvent.click(container.querySelector('input[value="authored"]') as HTMLInputElement);
    expect(nameInput(container).value).toBe('My queue');
  });

  test('an invalid base URL blocks confirm with a quiet inline message', async () => {
    const { container } = render(SmartFolderEditorHarness, { props: { spaceId: 'work' } });
    await fireEvent.input(urlInput(container), { target: { value: 'not a url' } });
    expect(
      container.querySelector('[data-testid="smart-folder-url-error"]')?.textContent,
    ).toContain('Needs a full URL');
    expect(urlInput(container).getAttribute('aria-invalid')).toBe('true');
    expect(confirmBtn(container).disabled).toBe(true);
    await fireEvent.click(confirmBtn(container));
    expect(sendMock).not.toHaveBeenCalled();
  });

  test('an untouched empty field does not scold and a non-http(s) scheme blocks', async () => {
    const { container } = render(SmartFolderEditorHarness, { props: { spaceId: 'work' } });
    await fireEvent.input(urlInput(container), { target: { value: '' } });
    expect(container.querySelector('[data-testid="smart-folder-url-error"]')).toBeNull();
    await fireEvent.input(urlInput(container), { target: { value: 'ftp://gitlab.com' } });
    expect(container.querySelector('[data-testid="smart-folder-url-error"]')).not.toBeNull();
  });

  test('the source picker is a Select above the URL field, holding all four sources, defaulting GitLab', async () => {
    const { container } = render(SmartFolderEditorHarness, { props: { spaceId: 'work' } });
    const sourceTrigger = trigger(container, 'smart-folder-source');
    expect(selectValue(container, 'smart-folder-source')).toBe('gitlab');
    // The source control sits above the URL field in document order.
    expect(
      sourceTrigger.compareDocumentPosition(urlInput(container)) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    // Open it and assert the four sources.
    await fireEvent.click(sourceTrigger);
    const root = sourceTrigger.closest('.select') as HTMLElement;
    const values = [...root.querySelectorAll('[role="option"]')].map((o) =>
      o.getAttribute('data-value'),
    );
    expect(values).toEqual(['gitlab', 'github', 'jira', 'rss']);
  });

  test('picking GitHub swaps an untouched default URL and the suggested name', async () => {
    const { container } = render(SmartFolderEditorHarness, { props: { spaceId: 'work' } });
    await fireEvent.click(container.querySelector('input[value="authored"]') as HTMLInputElement);
    expect(nameInput(container).value).toBe('My merge requests');
    await pickSource(container, 'github');
    expect(urlInput(container).value).toBe('https://github.com');
    expect(nameInput(container).value).toBe('My pull requests');
    await pickSource(container, 'gitlab');
    expect(urlInput(container).value).toBe('https://gitlab.com');
    expect(nameInput(container).value).toBe('My merge requests');
  });

  test('a custom URL is never clobbered by a source switch', async () => {
    const { container } = render(SmartFolderEditorHarness, { props: { spaceId: 'work' } });
    await fireEvent.input(urlInput(container), {
      target: { value: 'https://gitlab.example.com' },
    });
    await pickSource(container, 'github');
    expect(urlInput(container).value).toBe('https://gitlab.example.com');
  });

  test('the hint is per source: session-or-token for GitLab, token-required for GitHub', async () => {
    const { container } = render(SmartFolderEditorHarness, { props: { spaceId: 'work' } });
    const hint = (): string =>
      container.querySelector('[data-testid="smart-folder-hint"]')?.textContent ?? '';
    expect(hint()).toContain("Signed in to GitLab in this browser? That's enough.");
    expect(hint()).toContain('Settings → Connectors');
    await pickSource(container, 'github');
    expect(hint()).toBe('GitHub needs an access token — add one in Settings → Connectors.');
  });

  test('switching to Jira swaps URL/name/hint and the third-slot label to "Watching"', async () => {
    const { container } = render(SmartFolderEditorHarness, { props: { spaceId: 'work' } });
    expect(optionLabel(container, 'review-requested')).toBe('Review');
    await pickSource(container, 'jira');
    expect(urlInput(container).value).toBe('https://your-site.atlassian.net');
    expect(nameInput(container).value).toBe('Watching');
    expect(optionLabel(container, 'review-requested')).toBe('Watching');
    const hint = container.querySelector('[data-testid="smart-folder-hint"]')?.textContent ?? '';
    expect(hint).toBe("Signed in to Jira in this browser? That's enough.");
    expect(
      (container.querySelector('input[value="review-requested"]') as HTMLInputElement).checked,
    ).toBe(true);
  });

  test('create dispatch carries the picked source (Jira)', async () => {
    const { container } = render(SmartFolderEditorHarness, { props: { spaceId: 'work' } });
    await pickSource(container, 'jira');
    await fireEvent.click(confirmBtn(container));
    expect(sendMock).toHaveBeenCalledWith({
      kind: 'createSmartFolder',
      payload: {
        spaceId: 'work',
        source: 'jira',
        name: 'Watching',
        baseUrl: 'https://your-site.atlassian.net',
        query: 'review-requested',
        maxItems: 10,
        refreshMinutes: 10,
      },
    });
  });

  test('the swap rule covers all four canonical defaults and leaves a custom URL untouched', async () => {
    const { container } = render(SmartFolderEditorHarness, { props: { spaceId: 'work' } });
    await pickSource(container, 'jira');
    expect(urlInput(container).value).toBe('https://your-site.atlassian.net');
    await pickSource(container, 'github');
    expect(urlInput(container).value).toBe('https://github.com');
    await pickSource(container, 'rss');
    expect(urlInput(container).value).toBe(''); // the feed source's empty seed
    await pickSource(container, 'gitlab');
    expect(urlInput(container).value).toBe('https://gitlab.com');
    await fireEvent.input(urlInput(container), { target: { value: 'https://jira.acme.dev' } });
    await pickSource(container, 'jira');
    expect(urlInput(container).value).toBe('https://jira.acme.dev');
  });
});

describe('SmartFolderEditor — RSS adaptation (rss-connector)', () => {
  test('picking RSS relabels the URL field, hides the query, shows the cap, defaults refresh to 30, and updates the hint', async () => {
    const { container } = render(SmartFolderEditorHarness, { props: { spaceId: 'work' } });
    await pickSource(container, 'rss');

    // "Feed URL" label, not "Instance URL".
    expect(container.textContent).toContain('Feed URL');
    expect(container.textContent).not.toContain('Instance URL');
    // The canned-query control is hidden for a feed.
    expect(container.querySelector('input[value="authored"]')).toBeNull();
    expect(container.querySelector('#smart-folder-query-label')).toBeNull();
    // The "Show at most" cap is still shown.
    expect(container.querySelector('[data-testid="smart-folder-max-items"]')).not.toBeNull();
    // Refresh default flips to 30 minutes for a feed.
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
    await pickSource(container, 'rss');
    await fireEvent.input(urlInput(container), {
      target: { value: 'https://news.ycombinator.com/rss' },
    });
    await fireEvent.input(nameInput(container), { target: { value: 'Hacker News' } });
    await pickSelect(container, 'smart-folder-max-items', '30');
    await fireEvent.click(confirmBtn(container));

    expect(sendMock).toHaveBeenCalledWith({
      kind: 'createSmartFolder',
      payload: {
        spaceId: 'work',
        source: 'rss',
        name: 'Hacker News',
        baseUrl: 'https://news.ycombinator.com/rss',
        maxItems: 30,
        refreshMinutes: 30,
      },
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  test('an empty feed URL keeps confirm disabled (a feed has no canonical default)', async () => {
    const { container } = render(SmartFolderEditorHarness, { props: { spaceId: 'work' } });
    await pickSource(container, 'rss');
    expect(urlInput(container).value).toBe('');
    expect(confirmBtn(container).disabled).toBe(true);
  });
});

describe('SmartFolderEditor — edit mode', () => {
  test('pre-fills every field from the node, including the cap', () => {
    const { container } = render(SmartFolderEditorHarness, {
      props: { spaceId: 'work', node: existingNode() },
    });
    expect(selectValue(container, 'smart-folder-source')).toBe('gitlab');
    expect(urlInput(container).value).toBe('https://gitlab.example.com');
    expect((container.querySelector('input[value="assigned"]') as HTMLInputElement).checked).toBe(
      true,
    );
    expect(nameInput(container).value).toBe('Assigned to me');
    expect(selectValue(container, 'smart-folder-max-items')).toBe('20');
  });

  test('a query change confirms as updateSmartFolder carrying the new query (the SW refetches)', async () => {
    const onDone = vi.fn();
    const { container } = render(SmartFolderEditorHarness, {
      props: { spaceId: 'work', node: existingNode(), onDone },
    });
    await fireEvent.click(
      container.querySelector('input[value="review-requested"]') as HTMLInputElement,
    );
    await fireEvent.click(confirmBtn(container));

    expect(sendMock).toHaveBeenCalledWith({
      kind: 'updateSmartFolder',
      payload: {
        spaceId: 'work',
        folderId: 'sf-1',
        source: 'gitlab',
        name: 'Assigned to me',
        baseUrl: 'https://gitlab.example.com',
        query: 'review-requested',
        maxItems: 20,
        refreshMinutes: 10,
      },
    });
    expect(onDone).toHaveBeenCalledTimes(1);
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
        source: 'gitlab',
        name: 'Assigned to me',
        baseUrl: 'https://gitlab.example.com',
        query: 'assigned',
        maxItems: 50,
        refreshMinutes: 10,
      },
    });
  });

  test('a source change dispatches updateSmartFolder carrying the new source', async () => {
    const { container } = render(SmartFolderEditorHarness, {
      props: { spaceId: 'work', node: existingNode() },
    });
    await pickSource(container, 'github');
    expect(urlInput(container).value).toBe('https://gitlab.example.com');
    await fireEvent.click(confirmBtn(container));

    expect(sendMock).toHaveBeenCalledWith({
      kind: 'updateSmartFolder',
      payload: {
        spaceId: 'work',
        folderId: 'sf-1',
        source: 'github',
        name: 'Assigned to me',
        baseUrl: 'https://gitlab.example.com',
        query: 'assigned',
        maxItems: 20,
        refreshMinutes: 10,
      },
    });
  });

  test('an edit-mode folder sitting on a canonical default swaps URLs on a source switch', async () => {
    const { container } = render(SmartFolderEditorHarness, {
      props: { spaceId: 'work', node: existingNode({ baseUrl: 'https://gitlab.com' }) },
    });
    await pickSource(container, 'github');
    expect(urlInput(container).value).toBe('https://github.com');
  });

  test('editing an existing RSS folder pre-fills the feed URL and omits query on save', async () => {
    const feed = existingNode({
      id: 'feed-1',
      source: 'rss',
      query: undefined,
      icon: 'rss',
      name: 'Hacker News',
      baseUrl: 'https://news.ycombinator.com/rss',
      maxItems: 30,
      refreshMinutes: 30,
    });
    const { container } = render(SmartFolderEditorHarness, {
      props: { spaceId: 'work', node: feed },
    });
    expect(container.textContent).toContain('Feed URL');
    expect(container.querySelector('input[value="authored"]')).toBeNull();
    await fireEvent.click(confirmBtn(container));
    expect(sendMock).toHaveBeenCalledWith({
      kind: 'updateSmartFolder',
      payload: {
        spaceId: 'work',
        folderId: 'feed-1',
        source: 'rss',
        name: 'Hacker News',
        baseUrl: 'https://news.ycombinator.com/rss',
        maxItems: 30,
        refreshMinutes: 30,
      },
    });
  });
});

describe('SmartFolderEditor — host-permission request on confirm (least-privilege-permissions D4)', () => {
  test('confirming a new GitHub folder requests the api.github.com origin from the gesture', async () => {
    const { container } = render(SmartFolderEditorHarness, { props: { spaceId: 'work' } });
    await pickSource(container, 'github'); // swaps the URL to https://github.com
    await fireEvent.click(confirmBtn(container));
    expect(permissionsRequestMock).toHaveBeenCalledWith({ origins: ['https://api.github.com/*'] });
  });

  test('a denied host dialog still creates the folder (never blocks — it lands in needs-access)', async () => {
    permissionsRequestMock.mockResolvedValue(false);
    const onDone = vi.fn();
    const { container } = render(SmartFolderEditorHarness, { props: { spaceId: 'work', onDone } });
    await fireEvent.input(urlInput(container), { target: { value: 'https://gitlab.example.com' } });
    await fireEvent.click(confirmBtn(container));
    // The folder is created regardless of the (denied) grant; onDone still fires.
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'createSmartFolder',
        payload: expect.objectContaining({ baseUrl: 'https://gitlab.example.com' }),
      }),
    );
    expect(permissionsRequestMock).toHaveBeenCalledWith({
      origins: ['https://gitlab.example.com/*'],
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  test('a query-only edit (origins unchanged) requests no host permission', async () => {
    const { container } = render(SmartFolderEditorHarness, {
      props: { spaceId: 'work', node: existingNode() },
    });
    await fireEvent.click(container.querySelector('input[value="authored"]') as HTMLInputElement);
    await fireEvent.click(confirmBtn(container));
    expect(sendMock).toHaveBeenCalledWith(expect.objectContaining({ kind: 'updateSmartFolder' }));
    expect(permissionsRequestMock).not.toHaveBeenCalled();
  });

  test('an origin-changing edit requests the new origins', async () => {
    const { container } = render(SmartFolderEditorHarness, {
      props: { spaceId: 'work', node: existingNode() },
    });
    await fireEvent.input(urlInput(container), { target: { value: 'https://gitlab.other.com' } });
    await fireEvent.click(confirmBtn(container));
    expect(permissionsRequestMock).toHaveBeenCalledWith({
      origins: ['https://gitlab.other.com/*'],
    });
  });
});
