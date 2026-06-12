import { cleanup, fireEvent, render } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { PinNode } from '../shared/types';
import SmartFolderEditorHarness from './SmartFolderEditor.test.harness.svelte';

type SmartNode = Extract<PinNode, { kind: 'smart' }>;

const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn(() => Promise.resolve()) }));
vi.mock('../shared/bus', () => ({ bus: { send: sendMock }, dispatch: sendMock }));

beforeEach(() => {
  sendMock.mockClear();
});
afterEach(() => cleanup());

const urlInput = (c: HTMLElement): HTMLInputElement =>
  c.querySelector('[data-testid="smart-folder-url"]') as HTMLInputElement;
const nameInput = (c: HTMLElement): HTMLInputElement =>
  c.querySelector('[data-testid="smart-folder-name"]') as HTMLInputElement;
const confirmBtn = (c: HTMLElement): HTMLButtonElement =>
  [...c.querySelectorAll('button')].find((b) =>
    /Add smart folder|Save/.test(b.textContent ?? ''),
  ) as HTMLButtonElement;

function existingNode(overrides: Partial<SmartNode> = {}): SmartNode {
  return {
    kind: 'smart',
    id: 'sf-1',
    name: 'Assigned to me',
    icon: 'folder-git-2',
    source: 'gitlab',
    baseUrl: 'https://gitlab.example.com',
    query: 'assigned',
    refreshMinutes: 10,
    ...overrides,
  };
}

describe('SmartFolderEditor — create mode', () => {
  test('defaults: gitlab.com base URL, review-requested query, 10-minute cadence, suggested name', () => {
    const { container } = render(SmartFolderEditorHarness, { props: { spaceId: 'work' } });
    expect(urlInput(container).value).toBe('https://gitlab.com');
    expect(
      (container.querySelector('input[value="review-requested"]') as HTMLInputElement).checked,
    ).toBe(true);
    expect(nameInput(container).value).toBe('Review requests');
    expect(container.querySelector('[data-testid="smart-folder-cadence"]')?.textContent).toContain(
      'Every 10 minutes',
    );
  });

  test('confirm dispatches createSmartFolder with the panel values and calls onDone', async () => {
    const onDone = vi.fn();
    const { container } = render(SmartFolderEditorHarness, {
      props: { spaceId: 'work', onDone },
    });
    await fireEvent.input(urlInput(container), {
      target: { value: 'https://gitlab.example.com' },
    });
    // Pick the authored query (the radio drives SegmentedControl's onchange).
    await fireEvent.click(container.querySelector('input[value="authored"]') as HTMLInputElement);
    // Pick a 30-minute cadence from the Select.
    await fireEvent.click(
      container.querySelector('[data-testid="smart-folder-cadence"]') as HTMLButtonElement,
    );
    const option = [...container.querySelectorAll('[role="option"]')].find((o) =>
      o.textContent?.includes('Every 30 minutes'),
    ) as HTMLButtonElement;
    await fireEvent.click(option);
    await fireEvent.click(confirmBtn(container));

    expect(sendMock).toHaveBeenCalledWith({
      kind: 'createSmartFolder',
      payload: {
        spaceId: 'work',
        source: 'gitlab',
        name: 'My merge requests', // auto-suggested from the picked query
        baseUrl: 'https://gitlab.example.com',
        query: 'authored',
        refreshMinutes: 30,
      },
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  test('create dispatch carries the picked source (GitHub)', async () => {
    const { container } = render(SmartFolderEditorHarness, { props: { spaceId: 'work' } });
    await fireEvent.click(container.querySelector('input[value="github"]') as HTMLInputElement);
    await fireEvent.click(confirmBtn(container));

    expect(sendMock).toHaveBeenCalledWith({
      kind: 'createSmartFolder',
      payload: {
        spaceId: 'work',
        source: 'github',
        name: 'Review requests', // the shared review-requested suggestion
        baseUrl: 'https://github.com', // swapped by the canonical-default rule
        query: 'review-requested',
        refreshMinutes: 10,
      },
    });
  });

  test('the suggested name follows the query until the user types their own', async () => {
    const { container } = render(SmartFolderEditorHarness, { props: { spaceId: 'work' } });
    await fireEvent.click(container.querySelector('input[value="assigned"]') as HTMLInputElement);
    expect(nameInput(container).value).toBe('Assigned to me');
    // The user types a custom name — query changes no longer overwrite it.
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

  test('the source picker renders GitLab | GitHub above the URL field, defaulting GitLab', () => {
    const { container } = render(SmartFolderEditorHarness, { props: { spaceId: 'work' } });
    const radios = [...container.querySelectorAll('input[type="radio"]')].map(
      (r) => (r as HTMLInputElement).value,
    );
    // Source options precede the query options — the control sits above.
    expect(radios).toEqual(['gitlab', 'github', 'authored', 'assigned', 'review-requested']);
    expect((container.querySelector('input[value="gitlab"]') as HTMLInputElement).checked).toBe(
      true,
    );
  });

  test('picking GitHub swaps an untouched default URL and the suggested name', async () => {
    const { container } = render(SmartFolderEditorHarness, { props: { spaceId: 'work' } });
    await fireEvent.click(container.querySelector('input[value="authored"]') as HTMLInputElement);
    expect(nameInput(container).value).toBe('My merge requests');
    await fireEvent.click(container.querySelector('input[value="github"]') as HTMLInputElement);
    expect(urlInput(container).value).toBe('https://github.com');
    expect(nameInput(container).value).toBe('My pull requests');
    // And back: the github.com default equally follows the switch.
    await fireEvent.click(container.querySelector('input[value="gitlab"]') as HTMLInputElement);
    expect(urlInput(container).value).toBe('https://gitlab.com');
    expect(nameInput(container).value).toBe('My merge requests');
  });

  test('a custom URL is never clobbered by a source switch', async () => {
    const { container } = render(SmartFolderEditorHarness, { props: { spaceId: 'work' } });
    await fireEvent.input(urlInput(container), {
      target: { value: 'https://gitlab.example.com' },
    });
    await fireEvent.click(container.querySelector('input[value="github"]') as HTMLInputElement);
    expect(urlInput(container).value).toBe('https://gitlab.example.com');
  });

  test('the token hint is per source: session-or-token for GitLab, token-required for GitHub', async () => {
    const { container } = render(SmartFolderEditorHarness, { props: { spaceId: 'work' } });
    const hint = (): string =>
      container.querySelector('[data-testid="smart-folder-hint"]')?.textContent ?? '';
    expect(hint()).toContain("Signed in to GitLab in this browser? That's enough.");
    expect(hint()).toContain('Settings → Connectors');
    await fireEvent.click(container.querySelector('input[value="github"]') as HTMLInputElement);
    expect(hint()).toBe('GitHub needs an access token — add one in Settings → Connectors.');
  });
});

describe('SmartFolderEditor — edit mode', () => {
  test('pre-fills every field from the node', () => {
    const { container } = render(SmartFolderEditorHarness, {
      props: { spaceId: 'work', node: existingNode() },
    });
    expect(urlInput(container).value).toBe('https://gitlab.example.com');
    expect((container.querySelector('input[value="assigned"]') as HTMLInputElement).checked).toBe(
      true,
    );
    expect(nameInput(container).value).toBe('Assigned to me');
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
        name: 'Assigned to me', // edit mode keeps the existing name
        baseUrl: 'https://gitlab.example.com',
        query: 'review-requested',
        refreshMinutes: 10,
      },
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  test('a source change dispatches updateSmartFolder carrying the new source', async () => {
    const { container } = render(SmartFolderEditorHarness, {
      props: { spaceId: 'work', node: existingNode() },
    });
    await fireEvent.click(container.querySelector('input[value="github"]') as HTMLInputElement);
    // The custom baseUrl is untouched by the switch (never clobbered).
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
        refreshMinutes: 10,
      },
    });
  });

  test('an edit-mode folder sitting on a canonical default swaps URLs on a source switch', async () => {
    const { container } = render(SmartFolderEditorHarness, {
      props: { spaceId: 'work', node: existingNode({ baseUrl: 'https://gitlab.com' }) },
    });
    await fireEvent.click(container.querySelector('input[value="github"]') as HTMLInputElement);
    expect(urlInput(container).value).toBe('https://github.com');
  });
});
