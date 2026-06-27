import { fireEvent, render } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { LunmaStore } from '../shared/store.svelte';
import type { Space } from '../shared/types';
import EditorHarness from './SpaceEditor.test.harness.svelte';

interface ChromeMock {
  sendMessage: ReturnType<typeof vi.fn>;
  addListener: ReturnType<typeof vi.fn>;
  removeListener: ReturnType<typeof vi.fn>;
  listeners: Array<(raw: unknown) => void>;
}

function installChrome(): ChromeMock {
  const mock: ChromeMock = {
    sendMessage: vi.fn(async () => undefined),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    listeners: [],
  };
  mock.addListener.mockImplementation((listener: (raw: unknown) => void) => {
    mock.listeners.push(listener);
  });
  (globalThis as unknown as { chrome: unknown }).chrome = {
    runtime: {
      sendMessage: mock.sendMessage,
      onMessage: { addListener: mock.addListener, removeListener: mock.removeListener },
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

function makeStore(spaces: Space[]): LunmaStore {
  const store = new LunmaStore();
  for (const s of spaces) store.state.spaces.push({ ...s });
  return store;
}

function sentCommands(): Array<{ kind: string; payload: Record<string, unknown> }> {
  return chromeMock.sendMessage.mock.calls.map(
    (call) => (call[0] as { cmd: { kind: string; payload: Record<string, unknown> } }).cmd,
  );
}

function editor(): HTMLElement | null {
  return document.querySelector('[data-testid="space-editor"]');
}

describe('SpaceEditor', () => {
  test('create mode seeds the next-unused colour and dispatches createSpace', async () => {
    const store = makeStore([
      { id: 'a', name: 'A', color: 'red', icon: 'star' },
      { id: 'b', name: 'B', color: 'orange', icon: 'book' },
    ]);
    render(EditorHarness, { props: { store, mode: { kind: 'create', windowId: 7 } } });

    // red + orange used → default selected colour is yellow.
    const selected = document.querySelector('[data-testid="color-swatch"][data-selected="true"]');
    expect(selected?.getAttribute('data-color')).toBe('yellow');

    await fireEvent.input(
      document.querySelector('[data-testid="text-input"]') as HTMLInputElement,
      {
        target: { value: 'Research' },
      },
    );
    await fireEvent.click(
      document.querySelector('.btn[data-variant="primary"]') as HTMLButtonElement,
    );

    const cmds = sentCommands();
    expect(cmds).toHaveLength(1);
    expect(cmds[0]?.kind).toBe('createSpace');
    expect(cmds[0]?.payload).toEqual({
      name: 'Research',
      color: 'yellow',
      icon: 'star',
      windowId: 7,
    });
    expect(editor()).toBeNull();
  });

  test('a duplicate name disables Create and shows the message; clearing it re-enables', async () => {
    const store = makeStore([{ id: 'work', name: 'Work', color: 'blue', icon: 'star' }]);
    render(EditorHarness, { props: { store, mode: { kind: 'create', windowId: 1 } } });
    const input = document.querySelector('[data-testid="text-input"]') as HTMLInputElement;
    const primary = document.querySelector('.btn[data-variant="primary"]') as HTMLButtonElement;
    const msg = document.querySelector('[data-testid="space-name-error"]') as HTMLElement;

    // Typing an in-use name (different casing/whitespace still collides).
    await fireEvent.input(input, { target: { value: '  work ' } });
    expect(primary.disabled).toBe(true);
    expect(msg.getAttribute('data-visible')).toBe('true');
    expect(input.getAttribute('data-invalid')).toBe('true');

    // Changing to a free name clears the flag and re-enables Create.
    await fireEvent.input(input, { target: { value: 'Work 2' } });
    expect(primary.disabled).toBe(false);
    expect(msg.getAttribute('data-visible')).toBe('false');
    expect(input.getAttribute('data-invalid')).toBe('false');
  });

  test('edit mode does not flag the Space’s own name (including a casing-only change)', async () => {
    const store = makeStore([
      { id: 'work', name: 'Work', color: 'blue', icon: 'briefcase' },
      { id: 'side', name: 'Side', color: 'red', icon: 'star' },
    ]);
    render(EditorHarness, {
      props: { store, mode: { kind: 'edit', space: store.state.spaces[0] as Space } },
    });
    const input = document.querySelector('[data-testid="text-input"]') as HTMLInputElement;
    const primary = document.querySelector('.btn[data-variant="primary"]') as HTMLButtonElement;
    const msg = document.querySelector('[data-testid="space-name-error"]') as HTMLElement;

    // Its own name → not a duplicate.
    expect(msg.getAttribute('data-visible')).toBe('false');
    expect(primary.disabled).toBe(false);

    // Casing-only change to its own name → still not a duplicate.
    await fireEvent.input(input, { target: { value: 'work' } });
    expect(msg.getAttribute('data-visible')).toBe('false');
    expect(primary.disabled).toBe(false);

    // But another Space's name IS flagged.
    await fireEvent.input(input, { target: { value: 'Side' } });
    expect(msg.getAttribute('data-visible')).toBe('true');
    expect(primary.disabled).toBe(true);
  });

  test('the panel is full-bleed in the sheet (no inner glass card) + rebinds the selected hue', () => {
    const store = makeStore([{ id: 'work', name: 'Work', color: 'blue', icon: 'briefcase' }]);
    render(EditorHarness, {
      props: { store, mode: { kind: 'edit', space: store.state.spaces[0] as Space } },
    });
    const panel = editor() as HTMLElement;
    expect(panel).not.toBeNull();
    // The BottomSheet IS the container — the form is full-bleed (no inner glass
    // Surface card), matching the New-Lens sheet. The panel stays chromeless and
    // only rebinds the selected hue so descendants (input focus, swatches, the
    // primary button) preview the colour.
    expect(panel.querySelector('[data-variant="glass"]')).toBeNull();
    expect(panel.style.getPropertyValue('--space-h')).not.toBe('');
    expect(panel.querySelector('[data-testid="text-input"]')).not.toBeNull();
  });

  test('the Create button is disabled until a non-whitespace name is entered', async () => {
    const store = makeStore([]);
    render(EditorHarness, { props: { store, mode: { kind: 'create', windowId: 1 } } });
    const primary = document.querySelector('.btn[data-variant="primary"]') as HTMLButtonElement;
    expect(primary.disabled).toBe(true);

    await fireEvent.input(
      document.querySelector('[data-testid="text-input"]') as HTMLInputElement,
      {
        target: { value: '   ' },
      },
    );
    expect(primary.disabled).toBe(true);

    await fireEvent.input(
      document.querySelector('[data-testid="text-input"]') as HTMLInputElement,
      {
        target: { value: 'Work' },
      },
    );
    expect(primary.disabled).toBe(false);
  });

  test('edit mode dispatches only the changed field', async () => {
    const store = makeStore([{ id: 'work', name: 'Work', color: 'blue', icon: 'briefcase' }]);
    render(EditorHarness, {
      props: { store, mode: { kind: 'edit', space: store.state.spaces[0] as Space } },
    });

    await fireEvent.click(
      document.querySelector(
        '[data-testid="color-swatch"][data-color="cyan"]',
      ) as HTMLButtonElement,
    );
    await fireEvent.click(
      document.querySelector('.btn[data-variant="primary"]') as HTMLButtonElement,
    );

    const cmds = sentCommands();
    expect(cmds).toHaveLength(1);
    expect(cmds[0]?.kind).toBe('recolourSpace');
    expect(cmds[0]?.payload).toEqual({ spaceId: 'work', color: 'cyan' });
    expect(cmds.some((c) => c.kind === 'renameSpace' || c.kind === 'changeSpaceIcon')).toBe(false);
    expect(editor()).toBeNull();
  });

  test('edit mode with no changes dispatches nothing', async () => {
    const store = makeStore([{ id: 'work', name: 'Work', color: 'blue', icon: 'briefcase' }]);
    render(EditorHarness, {
      props: { store, mode: { kind: 'edit', space: store.state.spaces[0] as Space } },
    });
    await fireEvent.click(
      document.querySelector('.btn[data-variant="primary"]') as HTMLButtonElement,
    );
    expect(chromeMock.sendMessage).not.toHaveBeenCalled();
    expect(editor()).toBeNull();
  });

  test('Cancel dismisses without dispatching', async () => {
    const store = makeStore([{ id: 'work', name: 'Work', color: 'blue', icon: 'briefcase' }]);
    render(EditorHarness, {
      props: { store, mode: { kind: 'edit', space: store.state.spaces[0] as Space } },
    });
    await fireEvent.input(
      document.querySelector('[data-testid="text-input"]') as HTMLInputElement,
      {
        target: { value: 'Changed' },
      },
    );
    await fireEvent.click(
      document.querySelector('.btn[data-variant="secondary"]') as HTMLButtonElement,
    );
    expect(chromeMock.sendMessage).not.toHaveBeenCalled();
    expect(editor()).toBeNull();
  });

  test('Escape dismisses without dispatching', async () => {
    const store = makeStore([{ id: 'work', name: 'Work', color: 'blue', icon: 'briefcase' }]);
    render(EditorHarness, {
      props: { store, mode: { kind: 'edit', space: store.state.spaces[0] as Space } },
    });
    const panel = editor() as HTMLElement;
    expect(panel).not.toBeNull();
    await fireEvent.keyDown(panel, { key: 'Escape' });
    expect(chromeMock.sendMessage).not.toHaveBeenCalled();
    expect(editor()).toBeNull();
  });
});

describe('SpaceEditor — per-Space auto-archive override', () => {
  function aaRadio(value: string): HTMLInputElement | null {
    return document.querySelector(`input[name="auto-archive-mode"][value="${value}"]`);
  }
  function minutesField(): HTMLInputElement | null {
    return document.querySelector('[data-testid="auto-archive-minutes"]');
  }
  function renderEdit(space: Space): void {
    const store = makeStore([space]);
    render(EditorHarness, {
      props: { store, mode: { kind: 'edit', space: store.state.spaces[0] as Space } },
    });
  }

  test('seeds Inherit for a Space with no override (no minutes field)', async () => {
    renderEdit({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
    await tick();
    expect(aaRadio('inherit')?.checked).toBe(true);
    expect(minutesField()).toBeNull();
  });

  test('seeds Custom + minutes from a custom override', async () => {
    renderEdit({
      id: 'work',
      name: 'Work',
      color: 'blue',
      icon: 'star',
      autoArchive: { mode: 'custom', idleMinutes: 30 },
    });
    await tick();
    expect(aaRadio('custom')?.checked).toBe(true);
    expect(minutesField()?.value).toBe('30');
  });

  test('seeds Off from an off override (no minutes field)', async () => {
    renderEdit({
      id: 'work',
      name: 'Work',
      color: 'blue',
      icon: 'star',
      autoArchive: { mode: 'off' },
    });
    await tick();
    expect(aaRadio('off')?.checked).toBe(true);
    expect(minutesField()).toBeNull();
  });

  test('selecting Off dispatches { mode: off }', async () => {
    renderEdit({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
    await tick();
    await fireEvent.click(aaRadio('off') as HTMLInputElement);
    const cmd = sentCommands().find((c) => c.kind === 'setSpaceAutoArchive');
    expect(cmd?.payload).toEqual({ spaceId: 'work', autoArchive: { mode: 'off' } });
  });

  test('selecting Inherit clears the override (null)', async () => {
    renderEdit({
      id: 'work',
      name: 'Work',
      color: 'blue',
      icon: 'star',
      autoArchive: { mode: 'off' },
    });
    await tick();
    await fireEvent.click(aaRadio('inherit') as HTMLInputElement);
    const cmd = sentCommands().find((c) => c.kind === 'setSpaceAutoArchive');
    expect(cmd?.payload).toEqual({ spaceId: 'work', autoArchive: null });
  });

  test('Custom + edited minutes dispatches { mode: custom, idleMinutes }', async () => {
    renderEdit({ id: 'work', name: 'Work', color: 'blue', icon: 'star' });
    await tick();
    await fireEvent.click(aaRadio('custom') as HTMLInputElement);
    await tick();
    await fireEvent.input(minutesField() as HTMLInputElement, { target: { value: '15' } });
    const cmds = sentCommands().filter((c) => c.kind === 'setSpaceAutoArchive');
    expect(cmds.at(-1)?.payload).toEqual({
      spaceId: 'work',
      autoArchive: { mode: 'custom', idleMinutes: 15 },
    });
  });

  test('create mode shows the control seeded to Inherit, local-only (no dispatch)', async () => {
    render(EditorHarness, {
      props: { store: makeStore([]), mode: { kind: 'create', windowId: 7 } },
    });
    await tick();
    expect(aaRadio('inherit')?.checked).toBe(true);
    expect(minutesField()).toBeNull();
    // No Space id exists yet, so picking a mode must NOT dispatch setSpaceAutoArchive —
    // it only updates the draft, applied via the createSpace payload on submit.
    await fireEvent.click(aaRadio('off') as HTMLInputElement);
    expect(sentCommands().some((c) => c.kind === 'setSpaceAutoArchive')).toBe(false);
  });

  test('create mode folds an Off override into the createSpace payload', async () => {
    render(EditorHarness, {
      props: { store: makeStore([]), mode: { kind: 'create', windowId: 3 } },
    });
    await tick();
    await fireEvent.input(
      document.querySelector('[data-testid="text-input"]') as HTMLInputElement,
      { target: { value: 'Focus' } },
    );
    await fireEvent.click(aaRadio('off') as HTMLInputElement);
    await fireEvent.click(
      document.querySelector('.btn[data-variant="primary"]') as HTMLButtonElement,
    );
    const cmd = sentCommands().find((c) => c.kind === 'createSpace');
    expect(cmd?.payload).toMatchObject({
      name: 'Focus',
      windowId: 3,
      autoArchive: { mode: 'off' },
    });
  });

  test('create mode folds a Custom override into the createSpace payload', async () => {
    render(EditorHarness, {
      props: { store: makeStore([]), mode: { kind: 'create', windowId: 4 } },
    });
    await tick();
    await fireEvent.input(
      document.querySelector('[data-testid="text-input"]') as HTMLInputElement,
      { target: { value: 'Deep' } },
    );
    await fireEvent.click(aaRadio('custom') as HTMLInputElement);
    await tick();
    await fireEvent.input(minutesField() as HTMLInputElement, { target: { value: '20' } });
    await fireEvent.click(
      document.querySelector('.btn[data-variant="primary"]') as HTMLButtonElement,
    );
    const cmd = sentCommands().find((c) => c.kind === 'createSpace');
    expect(cmd?.payload).toMatchObject({
      name: 'Deep',
      autoArchive: { mode: 'custom', idleMinutes: 20 },
    });
  });
});
