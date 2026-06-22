import { describe, expect, test } from 'vitest';
import { isManagedWindow, MANAGED_WINDOW_TYPES } from './window-types';

const win = (type: `${chrome.windows.WindowType}` | undefined): chrome.windows.Window =>
  ({ type }) as chrome.windows.Window;

describe('isManagedWindow', () => {
  test("true for a 'normal' window", () => {
    expect(isManagedWindow(win('normal'))).toBe(true);
  });

  test.each(['popup', 'panel', 'app', 'devtools'] as const)('false for %s', (type) => {
    expect(isManagedWindow(win(type))).toBe(false);
  });

  test('false for an undefined type', () => {
    expect(isManagedWindow(win(undefined))).toBe(false);
  });
});

describe('MANAGED_WINDOW_TYPES', () => {
  test("is exactly ['normal']", () => {
    expect(MANAGED_WINDOW_TYPES).toEqual(['normal']);
  });
});
