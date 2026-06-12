import { beforeEach, describe, expect, test, vi } from 'vitest';
import { readConnectors, setConnectorToken } from './connectors';

interface ChromeStorageMock {
  data: Record<string, unknown>;
  get: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
}

function installChromeMock(): ChromeStorageMock {
  const mock: ChromeStorageMock = {
    data: {},
    get: vi.fn(async (key: string) => {
      const value = mock.data[key];
      return value === undefined ? {} : { [key]: value };
    }),
    set: vi.fn(async (items: Record<string, unknown>) => {
      Object.assign(mock.data, items);
    }),
  };
  (globalThis as unknown as { chrome: unknown }).chrome = {
    storage: { local: { get: mock.get, set: mock.set } },
  };
  return mock;
}

let chromeMock: ChromeStorageMock;

beforeEach(() => {
  chromeMock = installChromeMock();
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

describe('readConnectors', () => {
  test('an absent record reads as empty', async () => {
    expect(await readConnectors()).toEqual({});
  });

  test('a stored record reads back as written', async () => {
    chromeMock.data['lunma.connectors'] = { 'gitlab.example.com': 'glpat-abc' };
    expect(await readConnectors()).toEqual({ 'gitlab.example.com': 'glpat-abc' });
  });

  test('a malformed record (non-string values) defaults to empty', async () => {
    chromeMock.data['lunma.connectors'] = { 'gitlab.example.com': 42 };
    expect(await readConnectors()).toEqual({});
  });

  test('a malformed record (non-object) defaults to empty', async () => {
    chromeMock.data['lunma.connectors'] = 'glpat-abc';
    expect(await readConnectors()).toEqual({});
  });

  test('a thrown storage get defaults to empty', async () => {
    chromeMock.get.mockRejectedValueOnce(new Error('io down'));
    expect(await readConnectors()).toEqual({});
  });
});

describe('setConnectorToken', () => {
  test('adds a token for a host', async () => {
    await setConnectorToken('gitlab.example.com', 'glpat-abc');
    expect(chromeMock.data['lunma.connectors']).toEqual({ 'gitlab.example.com': 'glpat-abc' });
  });

  test('replaces an existing token, preserving other hosts', async () => {
    chromeMock.data['lunma.connectors'] = {
      'gitlab.example.com': 'glpat-old',
      'gitlab.com': 'glpat-other',
    };
    await setConnectorToken('gitlab.example.com', 'glpat-new');
    expect(chromeMock.data['lunma.connectors']).toEqual({
      'gitlab.example.com': 'glpat-new',
      'gitlab.com': 'glpat-other',
    });
  });

  test('clears a token with null, preserving other hosts', async () => {
    chromeMock.data['lunma.connectors'] = {
      'gitlab.example.com': 'glpat-abc',
      'gitlab.com': 'glpat-other',
    };
    await setConnectorToken('gitlab.example.com', null);
    expect(chromeMock.data['lunma.connectors']).toEqual({ 'gitlab.com': 'glpat-other' });
  });

  test('hosts with explicit ports are distinct keys', async () => {
    await setConnectorToken('gitlab.example.com:8443', 'glpat-port');
    await setConnectorToken('gitlab.example.com', 'glpat-plain');
    expect(await readConnectors()).toEqual({
      'gitlab.example.com:8443': 'glpat-port',
      'gitlab.example.com': 'glpat-plain',
    });
  });

  test('writes only to chrome.storage.local (never sync)', async () => {
    // The mock installs no `sync` area at all — a sync write would throw.
    await setConnectorToken('gitlab.example.com', 'glpat-abc');
    expect(chromeMock.set).toHaveBeenCalledTimes(1);
  });
});
