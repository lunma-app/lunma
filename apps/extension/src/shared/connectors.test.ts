import { beforeEach, describe, expect, test, vi } from 'vitest';
import { readAccountTokens, reconcileAccountSecrets, setAccountToken } from './connectors';
import type { SourceAccount, SourceId } from './types';

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

function account(id: string, provider: SourceAccount['provider'], baseUrl: string): SourceAccount {
  return { id, provider, baseUrl };
}

function sourcesOf(...accts: SourceAccount[]): { [id: SourceId]: SourceAccount } {
  return Object.fromEntries(accts.map((a) => [a.id, a]));
}

let chromeMock: ChromeStorageMock;

beforeEach(() => {
  chromeMock = installChromeMock();
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

describe('readAccountTokens', () => {
  test('an absent record reads as empty', async () => {
    expect(await readAccountTokens()).toEqual({});
  });

  test('a stored record reads back as written (keyed by sourceId)', async () => {
    chromeMock.data['lunma.connectors'] = { 'acc-1': 'glpat-abc' };
    expect(await readAccountTokens()).toEqual({ 'acc-1': 'glpat-abc' });
  });

  test('a malformed record (non-string values) defaults to empty', async () => {
    chromeMock.data['lunma.connectors'] = { 'acc-1': 42 };
    expect(await readAccountTokens()).toEqual({});
  });

  test('a malformed record (non-object) defaults to empty', async () => {
    chromeMock.data['lunma.connectors'] = 'glpat-abc';
    expect(await readAccountTokens()).toEqual({});
  });

  test('a thrown storage get defaults to empty', async () => {
    chromeMock.get.mockRejectedValueOnce(new Error('io down'));
    expect(await readAccountTokens()).toEqual({});
  });
});

describe('setAccountToken', () => {
  test('adds a token for a sourceId', async () => {
    await setAccountToken('acc-1', 'glpat-abc');
    expect(chromeMock.data['lunma.connectors']).toEqual({ 'acc-1': 'glpat-abc' });
  });

  test('replaces an existing token, preserving other accounts', async () => {
    chromeMock.data['lunma.connectors'] = {
      'acc-1': 'glpat-old',
      'acc-2': 'glpat-other',
    };
    await setAccountToken('acc-1', 'glpat-new');
    expect(chromeMock.data['lunma.connectors']).toEqual({
      'acc-1': 'glpat-new',
      'acc-2': 'glpat-other',
    });
  });

  test('clears a token with null, preserving other accounts', async () => {
    chromeMock.data['lunma.connectors'] = {
      'acc-1': 'glpat-abc',
      'acc-2': 'glpat-other',
    };
    await setAccountToken('acc-1', null);
    expect(chromeMock.data['lunma.connectors']).toEqual({ 'acc-2': 'glpat-other' });
  });

  test('two accounts on the same host hold distinct tokens', async () => {
    // Personal + work github.com — distinguished only by sourceId.
    await setAccountToken('acc-personal', 'ghp-personal');
    await setAccountToken('acc-work', 'ghp-work');
    expect(await readAccountTokens()).toEqual({
      'acc-personal': 'ghp-personal',
      'acc-work': 'ghp-work',
    });
  });

  test('writes only to chrome.storage.local (never sync)', async () => {
    // The mock installs no `sync` area at all — a sync write would throw.
    await setAccountToken('acc-1', 'glpat-abc');
    expect(chromeMock.set).toHaveBeenCalledTimes(1);
  });
});

describe('reconcileAccountSecrets', () => {
  test('re-keys a legacy host token onto its account id and removes the host key', async () => {
    chromeMock.data['lunma.connectors'] = { 'github.com': 'ghp-x' };
    const sources = sourcesOf(account('acc-1', 'github', 'https://github.com'));

    const changed = await reconcileAccountSecrets(sources);

    expect(changed).toBe(true);
    expect(await readAccountTokens()).toEqual({ 'acc-1': 'ghp-x' });
  });

  test('is idempotent — a second run is a no-op', async () => {
    chromeMock.data['lunma.connectors'] = { 'github.com': 'ghp-x' };
    const sources = sourcesOf(account('acc-1', 'github', 'https://github.com'));

    await reconcileAccountSecrets(sources);
    const changedSecond = await reconcileAccountSecrets(sources);

    expect(changedSecond).toBe(false);
    expect(await readAccountTokens()).toEqual({ 'acc-1': 'ghp-x' });
  });

  test('leaves an orphan host token (no matching account) untouched', async () => {
    chromeMock.data['lunma.connectors'] = { 'ghe.example.com': 'ghp-y' };
    const sources = sourcesOf(account('acc-1', 'github', 'https://github.com'));

    const changed = await reconcileAccountSecrets(sources);

    expect(changed).toBe(false);
    expect(await readAccountTokens()).toEqual({ 'ghe.example.com': 'ghp-y' });
  });

  test('leaves a key already equal to a known sourceId as-is', async () => {
    chromeMock.data['lunma.connectors'] = { 'acc-1': 'ghp-x' };
    const sources = sourcesOf(account('acc-1', 'github', 'https://github.com'));

    const changed = await reconcileAccountSecrets(sources);

    expect(changed).toBe(false);
    expect(await readAccountTokens()).toEqual({ 'acc-1': 'ghp-x' });
  });

  test('multi-match assigns to the first account by stable id order', async () => {
    chromeMock.data['lunma.connectors'] = { 'github.com': 'ghp-x' };
    // Two accounts deriving to the same host (hand-seeded; the migration never
    // produces this). The token binds to the first by stable id order.
    const sources = sourcesOf(
      account('acc-b', 'github', 'https://github.com'),
      account('acc-a', 'github', 'https://github.com'),
    );

    await reconcileAccountSecrets(sources);

    expect(await readAccountTokens()).toEqual({ 'acc-a': 'ghp-x' });
  });
});
