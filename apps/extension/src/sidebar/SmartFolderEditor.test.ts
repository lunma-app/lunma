import { cleanup, fireEvent, render } from '@testing-library/svelte';
import { tick } from 'svelte';
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
// Helpers — the editor is Name-first + a list of in-place editable source cards
// (no add-source sub-form). Each card carries its own Source `Select`, URL input,
// and filter `Chip` pills; folder settings + a single Create/Save sit below.
// ---------------------------------------------------------------------------

const nameInput = (c: HTMLElement): HTMLInputElement =>
  c.querySelector('[data-testid="smart-folder-name"]') as HTMLInputElement;

const confirmBtn = (c: HTMLElement): HTMLButtonElement =>
  [...c.querySelectorAll('button')].find((b) =>
    /^(Create|Save)$/.test((b.textContent ?? '').trim()),
  ) as HTMLButtonElement;

const addSourceBtn = (c: HTMLElement): HTMLButtonElement =>
  c.querySelector('[data-testid="smart-add-source"]') as HTMLButtonElement;

const cards = (c: HTMLElement): HTMLElement[] =>
  [...c.querySelectorAll('[data-testid="smart-source-entry"]')] as HTMLElement[];

const card = (c: HTMLElement, i = 0): HTMLElement => cards(c)[i] as HTMLElement;

const removeSourceBtns = (c: HTMLElement): HTMLButtonElement[] =>
  [...c.querySelectorAll('[data-testid="smart-source-remove"]')] as HTMLButtonElement[];

const cardUrlInput = (cardEl: HTMLElement): HTMLInputElement =>
  cardEl.querySelector('[data-testid="smart-source-url"]') as HTMLInputElement;

const cardPills = (cardEl: HTMLElement): HTMLButtonElement[] =>
  [...cardEl.querySelectorAll('[data-testid="smart-filter-pill"]')] as HTMLButtonElement[];

type Query = 'authored' | 'assigned' | 'review-requested';
const ALL_QUERIES: Query[] = ['authored', 'assigned', 'review-requested'];

function queryLabel(source: string, q: Query): string {
  if (q === 'authored') return 'Authored';
  if (q === 'assigned') return 'Assigned';
  return source === 'jira' ? 'Watching' : 'Reviewing';
}

const pillByLabel = (pills: HTMLButtonElement[], label: string): HTMLButtonElement | undefined =>
  pills.find((p) => (p.textContent ?? '').trim() === label);

const isPressed = (b: HTMLButtonElement): boolean => b.getAttribute('aria-pressed') === 'true';

const selectValue = (c: HTMLElement, testid: string): string | null =>
  (c.querySelector(`[data-testid="${testid}"]`) as HTMLElement).getAttribute('data-value');

const cardSourceValue = (cardEl: HTMLElement): string | null =>
  (cardEl.querySelector('[data-testid="smart-source-type"]') as HTMLElement).getAttribute(
    'data-value',
  );

/** Open a folder-level `Select` (cadence / max-items) and pick `value`. */
async function pickSelect(c: HTMLElement, testid: string, value: string): Promise<void> {
  const el = c.querySelector(`[data-testid="${testid}"]`) as HTMLButtonElement;
  await fireEvent.click(el);
  const root = el.closest('.select') as HTMLElement;
  const option = root.querySelector(`[role="option"][data-value="${value}"]`) as HTMLButtonElement;
  await fireEvent.click(option);
}

/** Pick a source type on a specific card's `Select`. */
async function pickCardSource(cardEl: HTMLElement, value: string): Promise<void> {
  const trig = cardEl.querySelector('[data-testid="smart-source-type"]') as HTMLButtonElement;
  await fireEvent.click(trig);
  const root = trig.closest('.select') as HTMLElement;
  const option = root.querySelector(`[role="option"][data-value="${value}"]`) as HTMLButtonElement;
  await fireEvent.click(option);
}

async function setCardUrl(cardEl: HTMLElement, value: string): Promise<void> {
  await fireEvent.input(cardUrlInput(cardEl), { target: { value } });
}

/** Toggle a card's filter pills until the selection equals `queries`. */
async function setCardFilters(
  cardEl: HTMLElement,
  source: string,
  queries: Query[],
): Promise<void> {
  for (const q of ALL_QUERIES) {
    const pill = pillByLabel(cardPills(cardEl), queryLabel(source, q));
    if (!pill) continue;
    if (isPressed(pill) !== queries.includes(q)) await fireEvent.click(pill);
  }
}

function existingNode(overrides: Partial<SmartNode> = {}): SmartNode {
  return {
    kind: 'smart',
    id: 'sf-1',
    name: 'Assigned to me',
    icon: 'folder-git-2',
    sources: [{ source: 'gitlab', baseUrl: 'https://gitlab.example.com', queries: ['assigned'] }],
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
  test('seeds one GitLab card (gitlab.com, Reviewing) and the primary action is enabled', async () => {
    const { container } = render(SmartFolderEditorHarness, { props: { spaceId: 'work' } });
    await tick();
    expect(cards(container)).toHaveLength(1);
    expect(cardSourceValue(card(container))).toBe('gitlab');
    expect(cardUrlInput(card(container)).value).toBe('https://gitlab.com');
    const reviewing = pillByLabel(cardPills(card(container)), 'Reviewing');
    expect(reviewing && isPressed(reviewing)).toBe(true);
    // Fill-and-create: the seeded card is valid, so Create is enabled immediately.
    expect(confirmBtn(container).disabled).toBe(false);
    // A single card has no remove control.
    expect(removeSourceBtns(container)).toHaveLength(0);
  });

  test('global cadence defaults to 10 min and cap defaults to 10 items', () => {
    const { container } = render(SmartFolderEditorHarness, { props: { spaceId: 'work' } });
    expect(container.querySelector('[data-testid="smart-folder-cadence"]')?.textContent).toContain(
      'Every 10 minutes',
    );
    expect(selectValue(container, 'smart-folder-max-items')).toBe('10');
  });

  test('the seeded card auto-suggests the name from its query', async () => {
    const { container } = render(SmartFolderEditorHarness, { props: { spaceId: 'work' } });
    await tick();
    expect(nameInput(container).value).toBe('Review requests');
  });

  test('confirm dispatches createSmartFolder with the panel values (incl. maxItems) and calls onDone', async () => {
    const onDone = vi.fn();
    const { container } = render(SmartFolderEditorHarness, { props: { spaceId: 'work', onDone } });
    await setCardUrl(card(container), 'https://gitlab.example.com');
    await setCardFilters(card(container), 'gitlab', ['authored']);
    await pickSelect(container, 'smart-folder-cadence', '30');
    await pickSelect(container, 'smart-folder-max-items', '50');
    await tick();
    await fireEvent.click(confirmBtn(container));

    expect(sendMock).toHaveBeenCalledWith({
      kind: 'createSmartFolder',
      payload: {
        spaceId: 'work',
        sources: [
          { source: 'gitlab', baseUrl: 'https://gitlab.example.com', queries: ['authored'] },
        ],
        name: 'My merge requests',
        maxItems: 50,
        refreshMinutes: 30,
      },
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  test('create dispatch carries the picked source (GitHub) with the swapped default URL', async () => {
    const { container } = render(SmartFolderEditorHarness, { props: { spaceId: 'work' } });
    await pickCardSource(card(container), 'github'); // URL auto-swaps to github.com
    await tick();
    await fireEvent.click(confirmBtn(container));

    expect(sendMock).toHaveBeenCalledWith({
      kind: 'createSmartFolder',
      payload: {
        spaceId: 'work',
        sources: [
          { source: 'github', baseUrl: 'https://github.com', queries: ['review-requested'] },
        ],
        name: 'Review requests',
        maxItems: 10,
        refreshMinutes: 10,
      },
    });
  });

  test('the suggested name follows the card source+query; a manual name sticks afterwards', async () => {
    const { container } = render(SmartFolderEditorHarness, { props: { spaceId: 'work' } });
    await setCardFilters(card(container), 'gitlab', ['assigned']);
    await tick();
    expect(nameInput(container).value).toBe('Assigned to me');
    // Manual input pins the name.
    await fireEvent.input(nameInput(container), { target: { value: 'My queue' } });
    // Change the filter again — manual name must not be overwritten.
    await setCardFilters(card(container), 'gitlab', ['authored']);
    await tick();
    expect(nameInput(container).value).toBe('My queue');
  });

  test('an invalid URL on a card disables Create', async () => {
    const { container } = render(SmartFolderEditorHarness, { props: { spaceId: 'work' } });
    await setCardUrl(card(container), 'not a url');
    await tick();
    expect(confirmBtn(container).disabled).toBe(true);
  });

  test('an empty URL and a non-http(s) scheme both disable Create', async () => {
    const { container } = render(SmartFolderEditorHarness, { props: { spaceId: 'work' } });
    await setCardUrl(card(container), '');
    await tick();
    expect(confirmBtn(container).disabled).toBe(true);
    await setCardUrl(card(container), 'ftp://gitlab.com');
    await tick();
    expect(confirmBtn(container).disabled).toBe(true);
  });

  test('the card source picker holds all five sources and defaults to GitLab', async () => {
    const { container } = render(SmartFolderEditorHarness, { props: { spaceId: 'work' } });
    const trig = card(container).querySelector(
      '[data-testid="smart-source-type"]',
    ) as HTMLButtonElement;
    expect(cardSourceValue(card(container))).toBe('gitlab');
    await fireEvent.click(trig);
    const root = trig.closest('.select') as HTMLElement;
    const values = [...root.querySelectorAll('[role="option"]')].map((o) =>
      o.getAttribute('data-value'),
    );
    expect(values).toEqual(['gitlab', 'github', 'jira', 'rss', 'opml']);
  });

  test('picking GitHub on a card swaps the default URL to github.com', async () => {
    const { container } = render(SmartFolderEditorHarness, { props: { spaceId: 'work' } });
    await pickCardSource(card(container), 'github');
    expect(cardUrlInput(card(container)).value).toBe('https://github.com');
  });

  test('a custom URL is never clobbered by a source switch on the card', async () => {
    const { container } = render(SmartFolderEditorHarness, { props: { spaceId: 'work' } });
    await setCardUrl(card(container), 'https://gitlab.example.com');
    await pickCardSource(card(container), 'github');
    expect(cardUrlInput(card(container)).value).toBe('https://gitlab.example.com');
  });

  test('the hint is per-source for one card and generic for many', async () => {
    const { container } = render(SmartFolderEditorHarness, { props: { spaceId: 'work' } });
    const hint = (): string =>
      container.querySelector('[data-testid="smart-folder-hint"]')?.textContent ?? '';
    await tick();
    expect(hint()).toContain("Signed in to GitLab in this browser? That's enough.");
    expect(hint()).toContain('Settings → Connectors');
    await fireEvent.click(addSourceBtn(container));
    await tick();
    expect(hint()).toContain('Each source fetches independently');
  });

  test('switching a card to Jira swaps URL, relabels the third pill "Watching", and updates the hint', async () => {
    const { container } = render(SmartFolderEditorHarness, { props: { spaceId: 'work' } });
    await pickCardSource(card(container), 'jira');
    await tick();
    expect(cardUrlInput(card(container)).value).toBe('https://your-site.atlassian.net');
    const watching = pillByLabel(cardPills(card(container)), 'Watching');
    expect(watching).toBeTruthy();
    expect(watching && isPressed(watching)).toBe(true);
    expect(container.querySelector('[data-testid="smart-folder-hint"]')?.textContent).toBe(
      "Signed in to Jira in this browser? That's enough.",
    );
  });

  test('create dispatch carries the picked source (Jira)', async () => {
    const { container } = render(SmartFolderEditorHarness, { props: { spaceId: 'work' } });
    await pickCardSource(card(container), 'jira');
    await tick();
    await fireEvent.click(confirmBtn(container));
    expect(sendMock).toHaveBeenCalledWith({
      kind: 'createSmartFolder',
      payload: {
        spaceId: 'work',
        sources: [
          {
            source: 'jira',
            baseUrl: 'https://your-site.atlassian.net',
            queries: ['review-requested'],
          },
        ],
        name: 'Watching',
        maxItems: 10,
        refreshMinutes: 10,
      },
    });
  });

  test('the canonical-URL swap rule covers all sources; a custom URL is left untouched', async () => {
    const { container } = render(SmartFolderEditorHarness, { props: { spaceId: 'work' } });
    const c = card(container);
    await pickCardSource(c, 'jira');
    expect(cardUrlInput(c).value).toBe('https://your-site.atlassian.net');
    await pickCardSource(c, 'github');
    expect(cardUrlInput(c).value).toBe('https://github.com');
    await pickCardSource(c, 'rss');
    expect(cardUrlInput(c).value).toBe('');
    await pickCardSource(c, 'gitlab');
    expect(cardUrlInput(c).value).toBe('https://gitlab.com');
    // Custom URL survives a source switch.
    await setCardUrl(c, 'https://jira.acme.dev');
    await pickCardSource(c, 'jira');
    expect(cardUrlInput(c).value).toBe('https://jira.acme.dev');
  });
});

// ---------------------------------------------------------------------------
// RSS adaptation (rss-connector)
// ---------------------------------------------------------------------------

describe('SmartFolderEditor — RSS adaptation (rss-connector)', () => {
  test('a card set to RSS relabels the URL field, hides the filters, keeps the cap, and flips cadence to 30', async () => {
    const { container } = render(SmartFolderEditorHarness, { props: { spaceId: 'work' } });
    await pickCardSource(card(container), 'rss');
    await tick();
    expect(container.textContent).toContain('Feed URL');
    expect(container.textContent).not.toContain('Instance URL');
    expect(cardPills(card(container))).toHaveLength(0);
    expect(container.querySelector('[data-testid="smart-folder-max-items"]')).not.toBeNull();
    // Cadence flips to 30 for a feed (refresh untouched).
    expect(container.querySelector('[data-testid="smart-folder-cadence"]')?.textContent).toContain(
      'Every 30 minutes',
    );
    expect(container.querySelector('[data-testid="smart-folder-hint"]')?.textContent).toBe(
      'Public feed — no sign-in needed. Paste the feed URL.',
    );
  });

  test('confirm dispatches createSmartFolder with source rss, the chosen maxItems, and NO query', async () => {
    const onDone = vi.fn();
    const { container } = render(SmartFolderEditorHarness, { props: { spaceId: 'work', onDone } });
    await pickCardSource(card(container), 'rss');
    await setCardUrl(card(container), 'https://news.ycombinator.com/rss');
    await fireEvent.input(nameInput(container), { target: { value: 'Hacker News' } });
    await pickSelect(container, 'smart-folder-max-items', '30');
    await tick();
    await fireEvent.click(confirmBtn(container));

    expect(sendMock).toHaveBeenCalledWith({
      kind: 'createSmartFolder',
      payload: {
        spaceId: 'work',
        sources: [{ source: 'rss', baseUrl: 'https://news.ycombinator.com/rss', queries: [] }],
        name: 'Hacker News',
        maxItems: 30,
        refreshMinutes: 30,
      },
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  test('an empty feed URL keeps Create disabled (a feed has no canonical default)', async () => {
    const { container } = render(SmartFolderEditorHarness, { props: { spaceId: 'work' } });
    await pickCardSource(card(container), 'rss');
    await tick();
    expect(cardUrlInput(card(container)).value).toBe('');
    expect(confirmBtn(container).disabled).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Edit mode
// ---------------------------------------------------------------------------

describe('SmartFolderEditor — edit mode', () => {
  test('pre-fills name, cap, and the existing source card', () => {
    const { container } = render(SmartFolderEditorHarness, {
      props: { spaceId: 'work', node: existingNode() },
    });
    expect(cards(container)).toHaveLength(1);
    expect(cardSourceValue(card(container))).toBe('gitlab');
    expect(cardUrlInput(card(container)).value).toBe('https://gitlab.example.com');
    expect(nameInput(container).value).toBe('Assigned to me');
    expect(selectValue(container, 'smart-folder-max-items')).toBe('20');
  });

  test('a maxItems change confirms as updateSmartFolder carrying the new cap', async () => {
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
        sources: [
          { source: 'gitlab', baseUrl: 'https://gitlab.example.com', queries: ['assigned'] },
        ],
        name: 'Assigned to me',
        maxItems: 50,
        refreshMinutes: 10,
      },
    });
  });

  test('editing a card filter in place dispatches updateSmartFolder with the new query', async () => {
    const onDone = vi.fn();
    const { container } = render(SmartFolderEditorHarness, {
      props: { spaceId: 'work', node: existingNode(), onDone },
    });
    await setCardFilters(card(container), 'gitlab', ['review-requested']);
    await fireEvent.click(confirmBtn(container));

    expect(sendMock).toHaveBeenCalledWith({
      kind: 'updateSmartFolder',
      payload: {
        spaceId: 'work',
        folderId: 'sf-1',
        sources: [
          {
            source: 'gitlab',
            baseUrl: 'https://gitlab.example.com',
            queries: ['review-requested'],
          },
        ],
        name: 'Assigned to me',
        maxItems: 20,
        refreshMinutes: 10,
      },
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  test('changing a card source in place dispatches updateSmartFolder (URL preserved when non-default)', async () => {
    const { container } = render(SmartFolderEditorHarness, {
      props: { spaceId: 'work', node: existingNode() },
    });
    await pickCardSource(card(container), 'github');
    await tick();
    await fireEvent.click(confirmBtn(container));

    expect(sendMock).toHaveBeenCalledWith({
      kind: 'updateSmartFolder',
      payload: {
        spaceId: 'work',
        folderId: 'sf-1',
        sources: [
          { source: 'github', baseUrl: 'https://gitlab.example.com', queries: ['assigned'] },
        ],
        name: 'Assigned to me',
        maxItems: 20,
        refreshMinutes: 10,
      },
    });
  });

  test('a card on a canonical default URL swaps to the new default on a source change', async () => {
    const { container } = render(SmartFolderEditorHarness, {
      props: {
        spaceId: 'work',
        node: existingNode({
          sources: [{ source: 'gitlab', baseUrl: 'https://gitlab.com', queries: ['assigned'] }],
        }),
      },
    });
    await pickCardSource(card(container), 'github');
    expect(cardUrlInput(card(container)).value).toBe('https://github.com');
  });

  test('editing an existing RSS folder pre-fills the card and omits query on save', async () => {
    const feed = existingNode({
      id: 'feed-1',
      sources: [{ source: 'rss', baseUrl: 'https://news.ycombinator.com/rss', queries: [] }],
      icon: 'rss',
      name: 'Hacker News',
      maxItems: 30,
      refreshMinutes: 30,
    });
    const { container } = render(SmartFolderEditorHarness, {
      props: { spaceId: 'work', node: feed },
    });
    expect(cards(container)).toHaveLength(1);
    expect(cardSourceValue(card(container))).toBe('rss');
    expect(cardPills(card(container))).toHaveLength(0);
    await fireEvent.click(confirmBtn(container));
    expect(sendMock).toHaveBeenCalledWith({
      kind: 'updateSmartFolder',
      payload: {
        spaceId: 'work',
        folderId: 'feed-1',
        sources: [{ source: 'rss', baseUrl: 'https://news.ycombinator.com/rss', queries: [] }],
        name: 'Hacker News',
        maxItems: 30,
        refreshMinutes: 30,
      },
    });
  });
});

// ---------------------------------------------------------------------------
// Multi-filter / multi-source (multi-filter-smart-connectors)
// ---------------------------------------------------------------------------

describe('SmartFolderEditor — multi-filter / multi-source', () => {
  test('ticking a second filter on a card dispatches both filters', async () => {
    const { container } = render(SmartFolderEditorHarness, { props: { spaceId: 'work' } });
    await setCardUrl(card(container), 'https://gitlab.example.com');
    await setCardFilters(card(container), 'gitlab', ['authored', 'review-requested']);
    await tick();
    await fireEvent.click(confirmBtn(container));

    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'createSmartFolder',
        payload: expect.objectContaining({
          sources: [
            {
              source: 'gitlab',
              baseUrl: 'https://gitlab.example.com',
              queries: ['authored', 'review-requested'],
            },
          ],
        }),
      }),
    );
  });

  test('two cards on the same source:host MERGE filters on confirm (no duplicate entry)', async () => {
    const { container } = render(SmartFolderEditorHarness, { props: { spaceId: 'work' } });
    await setCardUrl(card(container, 0), 'https://gitlab.example.com');
    await setCardFilters(card(container, 0), 'gitlab', ['authored']);
    // Add a second GitLab card on the same host with Reviewing.
    await fireEvent.click(addSourceBtn(container));
    await tick();
    await setCardUrl(card(container, 1), 'https://gitlab.example.com');
    await setCardFilters(card(container, 1), 'gitlab', ['review-requested']);
    await tick();
    expect(cards(container)).toHaveLength(2); // two cards in the UI…
    await fireEvent.click(confirmBtn(container));
    // …but they merge into ONE instance on dispatch.
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          sources: [
            {
              source: 'gitlab',
              baseUrl: 'https://gitlab.example.com',
              queries: ['authored', 'review-requested'],
            },
          ],
        }),
      }),
    );
  });

  test('Create is blocked when a queue card has zero filters selected', async () => {
    const { container } = render(SmartFolderEditorHarness, { props: { spaceId: 'work' } });
    await tick();
    expect(confirmBtn(container).disabled).toBe(false);
    await setCardFilters(card(container), 'gitlab', []); // untick the only filter
    await tick();
    expect(confirmBtn(container).disabled).toBe(true);
  });

  test('the cap label reads "per section" once there are ≥ 2 resolved sections', async () => {
    const { container } = render(SmartFolderEditorHarness, { props: { spaceId: 'work' } });
    await setCardFilters(card(container), 'gitlab', ['authored', 'review-requested']);
    await tick();
    expect(container.textContent).toContain('Show per section');
  });

  test('an OPML card imports and expands into deduped rss feed cards', async () => {
    const { container } = render(SmartFolderEditorHarness, { props: { spaceId: 'work' } });
    await pickCardSource(card(container), 'opml');
    await tick();
    const opml = [
      '<opml><body>',
      '<outline type="rss" text="Alpha" xmlUrl="https://a.example.com/feed" />',
      '<outline type="rss" text="Beta" xmlUrl="https://b.example.com/feed" />',
      '<outline type="rss" text="Alpha dup" xmlUrl="https://a.example.com/feed" />',
      '</body></opml>',
    ].join('');
    const file = new File([opml], 'feeds.opml', { type: 'text/xml' });
    const input = container.querySelector(
      '[data-testid="smart-opml-file-input"]',
    ) as HTMLInputElement;
    await fireEvent.change(input, { target: { files: [file] } });
    await new Promise((r) => setTimeout(r, 0)); // let file.text() + parse settle
    await tick();

    // Two unique feeds (the duplicate host is dropped); the importer card is
    // gone and the feeds land COLLAPSED as scannable summary rows.
    expect(cards(container)).toHaveLength(2);
    const summaries = [
      ...container.querySelectorAll('[data-testid="smart-source-summary"]'),
    ] as HTMLElement[];
    expect(summaries).toHaveLength(2);
    expect(summaries[0]?.textContent).toContain('a.example.com');
    expect(summaries[1]?.textContent).toContain('b.example.com');
    expect(container.querySelector('[data-testid="smart-folder-hint"]')?.textContent).toContain(
      'fetches independently',
    );
    // The folder name auto-fills to "Feeds" for a multi-feed import.
    expect(nameInput(container).value).toBe('Feeds');
  });

  test('cards collapse to summaries; sole/new/incomplete stay expanded; click expands', async () => {
    const { container } = render(SmartFolderEditorHarness, { props: { spaceId: 'work' } });
    await tick();
    // Sole card: expanded (editable Select present, no summary).
    expect(card(container).querySelector('[data-testid="smart-source-type"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="smart-source-summary"]')).toBeNull();

    // Add a second card → it opens expanded; the first (valid) card collapses.
    await fireEvent.click(addSourceBtn(container));
    await tick();
    expect(cards(container)).toHaveLength(2);
    expect(card(container, 0).querySelector('[data-testid="smart-source-summary"]')).not.toBeNull();
    expect(card(container, 1).querySelector('[data-testid="smart-source-type"]')).not.toBeNull();

    // Clicking the first card's summary expands it back to the editable form.
    await fireEvent.click(
      card(container, 0).querySelector('[data-testid="smart-source-summary"]') as HTMLButtonElement,
    );
    await tick();
    expect(card(container, 0).querySelector('[data-testid="smart-source-type"]')).not.toBeNull();

    // Make the second card incomplete (untick its only filter) → it can't collapse.
    await setCardFilters(card(container, 1), 'gitlab', []);
    await tick();
    expect(confirmBtn(container).disabled).toBe(true);
    expect(card(container, 1).querySelector('[data-testid="smart-source-type"]')).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Host-permission request on confirm (least-privilege-permissions D4)
// ---------------------------------------------------------------------------

describe('SmartFolderEditor — host-permission request on confirm (least-privilege-permissions D4)', () => {
  test('confirming a new GitHub folder requests the api.github.com origin from the gesture', async () => {
    const { container } = render(SmartFolderEditorHarness, { props: { spaceId: 'work' } });
    await pickCardSource(card(container), 'github');
    await tick();
    await fireEvent.click(confirmBtn(container));
    expect(permissionsRequestMock).toHaveBeenCalledWith({ origins: ['https://api.github.com/*'] });
  });

  test('a denied host dialog still creates the folder (never blocks — it lands in needs-access)', async () => {
    permissionsRequestMock.mockResolvedValue(false);
    const onDone = vi.fn();
    const { container } = render(SmartFolderEditorHarness, { props: { spaceId: 'work', onDone } });
    await setCardUrl(card(container), 'https://gitlab.example.com');
    await tick();
    await fireEvent.click(confirmBtn(container));
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'createSmartFolder',
        payload: expect.objectContaining({
          sources: [
            {
              source: 'gitlab',
              baseUrl: 'https://gitlab.example.com',
              queries: ['review-requested'],
            },
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

  test('a URL-changing edit requests the new origins', async () => {
    const { container } = render(SmartFolderEditorHarness, {
      props: { spaceId: 'work', node: existingNode() },
    });
    await setCardUrl(card(container), 'https://gitlab.other.com');
    await tick();
    await fireEvent.click(confirmBtn(container));
    expect(permissionsRequestMock).toHaveBeenCalledWith({
      origins: ['https://gitlab.other.com/*'],
    });
  });
});
