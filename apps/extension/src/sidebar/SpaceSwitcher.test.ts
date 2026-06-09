import { fireEvent, render } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { LunmaStore } from '../shared/store.svelte';
import SwitcherHarness from './SpaceSwitcher.test.harness.svelte';

interface ChromeMock {
  sendMessage: ReturnType<typeof vi.fn>;
  addListener: ReturnType<typeof vi.fn>;
  removeListener: ReturnType<typeof vi.fn>;
  openOptionsPage: ReturnType<typeof vi.fn>;
  listeners: Array<(raw: unknown) => void>;
}

function installChrome(): ChromeMock {
  const mock: ChromeMock = {
    sendMessage: vi.fn(async () => undefined),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    openOptionsPage: vi.fn(),
    listeners: [],
  };
  mock.addListener.mockImplementation((listener: (raw: unknown) => void) => {
    mock.listeners.push(listener);
  });
  (globalThis as unknown as { chrome: unknown }).chrome = {
    runtime: {
      sendMessage: mock.sendMessage,
      onMessage: {
        addListener: mock.addListener,
        removeListener: mock.removeListener,
      },
      openOptionsPage: mock.openOptionsPage,
    },
  };
  return mock;
}

let chromeMock: ChromeMock;

beforeEach(() => {
  chromeMock = installChrome();
});

afterEach(() => {
  delete (globalThis as unknown as { chrome?: unknown }).chrome;
  vi.restoreAllMocks();
});

function makeStore(opts: {
  spaces: Array<{ id: string; name: string; color: string; icon: string }>;
  activeForWindow?: { [windowId: number]: string | null };
}): LunmaStore {
  const store = new LunmaStore();
  for (const s of opts.spaces) {
    store.state.spaces.push({
      id: s.id,
      name: s.name,
      color: s.color,
      icon: s.icon,
    });
  }
  if (opts.activeForWindow) {
    Object.assign(store.state.activeSpaceByWindow, opts.activeForWindow);
  }
  return store;
}

describe('SpaceSwitcher duplicate-id resilience', () => {
  test('renders a duplicate Space id once and does not throw', () => {
    const store = makeStore({
      spaces: [
        { id: 'work', name: 'Work', color: 'blue', icon: 'star' },
        { id: 'work', name: 'Dup', color: 'red', icon: 'book' },
        { id: 'reading', name: 'Reading', color: 'orange', icon: 'book' },
      ],
      activeForWindow: { 1: 'work' },
    });
    const { container } = render(SwitcherHarness, { props: { store, windowId: 1 } });
    expect(container.querySelectorAll('[data-testid="space-chip"]')).toHaveLength(2);
  });
});

describe('SpaceSwitcher', () => {
  test('renders one icon-only chip per Space with data-active reflecting which is current', () => {
    const store = makeStore({
      spaces: [
        { id: 'work', name: 'Work', color: 'blue', icon: 'star' },
        { id: 'reading', name: 'Reading', color: 'orange', icon: 'book' },
      ],
      activeForWindow: { 1: 'work' },
    });
    const { container } = render(SwitcherHarness, { props: { store, windowId: 1 } });
    const chips = container.querySelectorAll('[data-testid="space-chip"]');
    expect(chips).toHaveLength(2);
    // The trailing + button is now enabled (no `disabled` attribute).
    const add = container.querySelector('[data-testid="add-space"]') as HTMLButtonElement;
    expect(add.disabled).toBe(false);

    // Trailing Settings icon button renders at the bar's trailing edge. (The launcher
    // trigger moved to the top search bar — see App.test.ts.)
    expect(container.querySelector('[data-testid="open-options"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="open-launcher"]')).toBeNull();

    const active = container.querySelector('[data-space-id="work"]') as HTMLElement;
    expect(active.getAttribute('data-active')).toBe('true');
    expect(active.getAttribute('aria-current')).toBe('true');

    const inactive = container.querySelector('[data-space-id="reading"]') as HTMLElement;
    expect(inactive.getAttribute('data-active')).toBe('false');
    expect(inactive.getAttribute('aria-current')).toBeNull();

    // Arc-style: no visible label, just the icon tile. The Space name is
    // exposed via title / aria-label for accessibility but isn't textContent.
    expect(active.querySelector('.tile')).not.toBeNull();
    expect(inactive.querySelector('.tile')).not.toBeNull();
    // The active chip's action is now "edit" (click it to open its editor);
    // inactive chips activate.
    expect(active.getAttribute('aria-label')).toBe('Edit Work');
    expect(inactive.getAttribute('aria-label')).toBe('Activate Reading');
  });

  test('the active chip sits on a glass Surface with the hue glow; inactive chips do not', () => {
    const store = makeStore({
      spaces: [
        { id: 'work', name: 'Work', color: 'blue', icon: 'star' },
        { id: 'reading', name: 'Reading', color: 'orange', icon: 'book' },
      ],
      activeForWindow: { 1: 'work' },
    });
    const { container } = render(SwitcherHarness, { props: { store, windowId: 1 } });

    // Active chip: the Space-colour tile sits on a frosted-glass Surface carrying
    // the soft hue glow ("lit from within").
    const active = container.querySelector('[data-space-id="work"]') as HTMLElement;
    const glass = active.querySelector('[data-testid="chip-glass"]') as HTMLElement;
    expect(glass).not.toBeNull();
    expect(glass.getAttribute('data-variant')).toBe('glass');
    expect(glass.getAttribute('data-glow')).toBe('true');
    // The inner Space-colour tile is retained, now inside the glass.
    expect(glass.querySelector('.tile')).not.toBeNull();

    // Inactive chip: calm, no glass/glow — just the bare colour tile.
    const inactive = container.querySelector('[data-space-id="reading"]') as HTMLElement;
    expect(inactive.querySelector('[data-testid="chip-glass"]')).toBeNull();
    expect(inactive.querySelector('.tile')).not.toBeNull();
  });

  test('chip carries its own --space-h inline (per-chip hue)', () => {
    const store = makeStore({
      spaces: [
        { id: 'work', name: 'Work', color: 'blue', icon: 'star' },
        { id: 'reading', name: 'Reading', color: 'orange', icon: 'book' },
      ],
      activeForWindow: { 1: 'work' },
    });
    const { container } = render(SwitcherHarness, { props: { store, windowId: 1 } });
    const work = container.querySelector('[data-space-id="work"]') as HTMLElement;
    const reading = container.querySelector('[data-space-id="reading"]') as HTMLElement;
    expect(work.style.getPropertyValue('--space-h')).toBe('252');
    expect(reading.style.getPropertyValue('--space-h')).toBe('55');
  });

  test('click on an inactive chip dispatches activateSpace via the bus', async () => {
    const store = makeStore({
      spaces: [
        { id: 'work', name: 'Work', color: 'blue', icon: 'star' },
        { id: 'reading', name: 'Reading', color: 'orange', icon: 'book' },
      ],
      activeForWindow: { 7: 'work' },
    });
    const { container } = render(SwitcherHarness, { props: { store, windowId: 7 } });
    const reading = container.querySelector('[data-space-id="reading"]') as HTMLButtonElement;
    await fireEvent.click(reading);
    expect(chromeMock.sendMessage).toHaveBeenCalledTimes(1);
    const sent = chromeMock.sendMessage.mock.calls[0]?.[0] as {
      type: string;
      cmd: { kind: string; payload: { windowId: number; spaceId: string } };
    };
    expect(sent.type).toBe('lunma/command');
    expect(sent.cmd.kind).toBe('activateSpace');
    expect(sent.cmd.payload).toEqual({ windowId: 7, spaceId: 'reading' });
  });

  test('clicking the ACTIVE chip opens the edit editor (and does not dispatch)', async () => {
    const store = makeStore({
      spaces: [
        { id: 'work', name: 'Work', color: 'blue', icon: 'star' },
        { id: 'reading', name: 'Reading', color: 'orange', icon: 'book' },
      ],
      activeForWindow: { 1: 'work' },
    });
    const { container } = render(SwitcherHarness, { props: { store, windowId: 1 } });
    expect(document.querySelector('[data-testid="space-editor"]')).toBeNull();

    const work = container.querySelector('[data-space-id="work"]') as HTMLButtonElement;
    await fireEvent.click(work);

    const editor = document.querySelector('[data-testid="space-editor"]');
    expect(editor).not.toBeNull();
    expect(editor?.getAttribute('data-mode')).toBe('edit');
    // Clicking the active chip edits — it must NOT re-dispatch activateSpace.
    expect(chromeMock.sendMessage).not.toHaveBeenCalled();
    // Seeded from the clicked Space.
    const nameInput = document.querySelector('[data-testid="text-input"]') as HTMLInputElement;
    expect(nameInput.value).toBe('Work');
  });

  test('the + button is enabled, labelled "New Space", and opens the create editor', async () => {
    const store = makeStore({
      spaces: [{ id: 'work', name: 'Work', color: 'blue', icon: 'star' }],
      activeForWindow: { 1: 'work' },
    });
    const { container } = render(SwitcherHarness, { props: { store, windowId: 1 } });
    const add = container.querySelector('[data-testid="add-space"]') as HTMLButtonElement;
    expect(add).not.toBeNull();
    expect(add.disabled).toBe(false);
    expect(add.getAttribute('aria-label')).toBe('New Space');
    // No editor until the + is activated.
    expect(document.querySelector('[data-testid="space-editor"]')).toBeNull();

    await fireEvent.click(add);
    const editor = document.querySelector('[data-testid="space-editor"]');
    expect(editor).not.toBeNull();
    expect(editor?.getAttribute('data-mode')).toBe('create');
  });

  test('right-clicking a chip opens the edit editor and suppresses the context menu', async () => {
    const store = makeStore({
      spaces: [
        { id: 'work', name: 'Work', color: 'blue', icon: 'star' },
        { id: 'reading', name: 'Reading', color: 'orange', icon: 'book' },
      ],
      activeForWindow: { 1: 'work' },
    });
    const { container } = render(SwitcherHarness, { props: { store, windowId: 1 } });
    const work = container.querySelector('[data-space-id="work"]') as HTMLButtonElement;
    // fireEvent returns the dispatchEvent result — `false` when the handler
    // called preventDefault (i.e. the browser context menu is suppressed).
    const notCancelled = await fireEvent.contextMenu(work);
    expect(notCancelled).toBe(false);

    const editor = document.querySelector('[data-testid="space-editor"]');
    expect(editor).not.toBeNull();
    expect(editor?.getAttribute('data-mode')).toBe('edit');
    // The seeded name reflects the right-clicked Space.
    const nameInput = document.querySelector('[data-testid="text-input"]') as HTMLInputElement;
    expect(nameInput.value).toBe('Work');
  });

  test('with zero Spaces, the + button and trailing Settings still render', () => {
    const store = makeStore({ spaces: [], activeForWindow: { 1: null } });
    const { container } = render(SwitcherHarness, { props: { store, windowId: 1 } });
    expect(container.querySelectorAll('[data-testid="space-chip"]')).toHaveLength(0);
    const add = container.querySelector('[data-testid="add-space"]') as HTMLButtonElement;
    expect(add).not.toBeNull();
    expect(add.disabled).toBe(false);
    expect(container.querySelector('[data-testid="open-options"]')).not.toBeNull();
    // The launcher trigger no longer lives in the switcher (moved to the search bar).
    expect(container.querySelector('[data-testid="open-launcher"]')).toBeNull();
  });

  test('the trailing Settings button opens the options page', async () => {
    const store = makeStore({
      spaces: [{ id: 'work', name: 'Work', color: 'blue', icon: 'star' }],
      activeForWindow: { 1: 'work' },
    });
    const { container } = render(SwitcherHarness, { props: { store, windowId: 1 } });
    await fireEvent.click(container.querySelector('[data-testid="open-options"]') as HTMLElement);
    expect(chromeMock.openOptionsPage).toHaveBeenCalledTimes(1);
  });
});
