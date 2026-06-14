import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  hasApiPermission,
  hasHostPermissions,
  onPermissionsChange,
  originPatternForBaseUrl,
  requestApiPermission,
  requestHostPermissions,
} from './permissions';

// ── chrome.permissions stub ──────────────────────────────────────────────────

interface PermissionsStub {
  contains: ReturnType<typeof vi.fn>;
  request: ReturnType<typeof vi.fn>;
  onAdded: { addListener: ReturnType<typeof vi.fn>; removeListener: ReturnType<typeof vi.fn> };
  onRemoved: { addListener: ReturnType<typeof vi.fn>; removeListener: ReturnType<typeof vi.fn> };
}

let permissions: PermissionsStub;

beforeEach(() => {
  permissions = {
    contains: vi.fn(async () => true),
    request: vi.fn(async () => true),
    onAdded: { addListener: vi.fn(), removeListener: vi.fn() },
    onRemoved: { addListener: vi.fn(), removeListener: vi.fn() },
  };
  (globalThis as unknown as { chrome: unknown }).chrome = { permissions };
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── originPatternForBaseUrl ──────────────────────────────────────────────────

describe('originPatternForBaseUrl', () => {
  test('derives the origin pattern from a baseUrl with a path', () => {
    expect(originPatternForBaseUrl('https://gitlab.example.com/group/repo')).toBe(
      'https://gitlab.example.com/*',
    );
  });

  test('preserves a non-default port', () => {
    expect(originPatternForBaseUrl('https://gitlab.example.com:8443/group')).toBe(
      'https://gitlab.example.com:8443/*',
    );
  });

  test('preserves an http scheme (self-hosted on plain HTTP)', () => {
    expect(originPatternForBaseUrl('http://intranet.local/gitlab')).toBe('http://intranet.local/*');
  });

  test('never throws on a malformed baseUrl; yields an empty pattern', () => {
    expect(originPatternForBaseUrl('not a url')).toBe('');
    expect(originPatternForBaseUrl('')).toBe('');
  });
});

// ── API permissions ──────────────────────────────────────────────────────────

describe('hasApiPermission', () => {
  test('queries chrome.permissions.contains with the named permission', async () => {
    permissions.contains.mockResolvedValueOnce(true);
    await expect(hasApiPermission('history')).resolves.toBe(true);
    expect(permissions.contains).toHaveBeenCalledWith({ permissions: ['history'] });
  });

  test('returns false when not granted', async () => {
    permissions.contains.mockResolvedValueOnce(false);
    await expect(hasApiPermission('bookmarks')).resolves.toBe(false);
  });

  test('never throws — a rejected query resolves to false', async () => {
    permissions.contains.mockRejectedValueOnce(new Error('boom'));
    await expect(hasApiPermission('history')).resolves.toBe(false);
  });
});

describe('requestApiPermission', () => {
  test('requests the named permission and returns the grant outcome', async () => {
    permissions.request.mockResolvedValueOnce(true);
    await expect(requestApiPermission('bookmarks')).resolves.toBe(true);
    expect(permissions.request).toHaveBeenCalledWith({ permissions: ['bookmarks'] });
  });

  test('returns false on denial', async () => {
    permissions.request.mockResolvedValueOnce(false);
    await expect(requestApiPermission('history')).resolves.toBe(false);
  });
});

// ── host permissions (all-granted semantics) ─────────────────────────────────

describe('hasHostPermissions', () => {
  test('passes the whole set to contains (all-granted semantics)', async () => {
    permissions.contains.mockResolvedValueOnce(true);
    const origins = ['https://api.github.com/*', 'https://github.com/*'];
    await expect(hasHostPermissions(origins)).resolves.toBe(true);
    expect(permissions.contains).toHaveBeenCalledWith({ origins });
  });

  test('returns false when not every origin is granted', async () => {
    permissions.contains.mockResolvedValueOnce(false);
    await expect(hasHostPermissions(['https://api.github.com/*'])).resolves.toBe(false);
  });

  test('an empty set is vacuously granted (no chrome call)', async () => {
    await expect(hasHostPermissions([])).resolves.toBe(true);
    expect(permissions.contains).not.toHaveBeenCalled();
  });

  test('never throws — a malformed-pattern rejection resolves to false', async () => {
    permissions.contains.mockRejectedValueOnce(new Error('invalid pattern'));
    await expect(hasHostPermissions([''])).resolves.toBe(false);
  });
});

describe('requestHostPermissions', () => {
  test('requests the whole origin set and returns the grant outcome', async () => {
    permissions.request.mockResolvedValueOnce(true);
    const origins = ['https://gitlab.example.com/*'];
    await expect(requestHostPermissions(origins)).resolves.toBe(true);
    expect(permissions.request).toHaveBeenCalledWith({ origins });
  });

  test('an empty set is a no-op grant (no chrome call)', async () => {
    await expect(requestHostPermissions([])).resolves.toBe(true);
    expect(permissions.request).not.toHaveBeenCalled();
  });

  test('returns false on denial', async () => {
    permissions.request.mockResolvedValueOnce(false);
    await expect(requestHostPermissions(['https://gitlab.example.com/*'])).resolves.toBe(false);
  });
});

// ── onPermissionsChange ──────────────────────────────────────────────────────

describe('onPermissionsChange', () => {
  test('invokes the listener on grant and on revoke, then unsubscribes both', () => {
    const calls: Array<{ type: string; permissions: chrome.permissions.Permissions }> = [];
    const unsubscribe = onPermissionsChange((change) => calls.push(change));

    const added = permissions.onAdded.addListener.mock.calls[0]?.[0] as (
      p: chrome.permissions.Permissions,
    ) => void;
    const removed = permissions.onRemoved.addListener.mock.calls[0]?.[0] as (
      p: chrome.permissions.Permissions,
    ) => void;

    added({ origins: ['https://gitlab.example.com/*'] });
    removed({ permissions: ['history'] });
    expect(calls).toEqual([
      { type: 'added', permissions: { origins: ['https://gitlab.example.com/*'] } },
      { type: 'removed', permissions: { permissions: ['history'] } },
    ]);

    unsubscribe();
    expect(permissions.onAdded.removeListener).toHaveBeenCalledWith(added);
    expect(permissions.onRemoved.removeListener).toHaveBeenCalledWith(removed);
  });
});

// ── guard: the background never REQUESTS (design D1 / runtime-permissions) ────

describe('the gesture-bound request* functions never originate in the background', () => {
  /** Every shippable background source file (excludes tests — they may exercise
   * the requests via surfaces' helpers). */
  function backgroundSources(): string[] {
    const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'background');
    const out: string[] = [];
    const walk = (dir: string): void => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const p = join(dir, entry.name);
        if (entry.isDirectory()) walk(p);
        else if (entry.name.endsWith('.ts') && !/\.test\.ts$/.test(entry.name)) out.push(p);
      }
    };
    walk(root);
    return out;
  }

  test('no background module references requestApiPermission / requestHostPermissions', () => {
    const offenders = backgroundSources().filter((file) => {
      const source = readFileSync(file, 'utf-8');
      return /\brequest(ApiPermission|HostPermissions)\b/.test(source);
    });
    expect(offenders).toEqual([]);
  });
});
