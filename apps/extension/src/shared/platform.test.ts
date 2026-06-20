import { describe, expect, test } from 'vitest';
import { getExtensionsShortcutsUrl, getModifierLabel } from './platform';

function setUserAgent(ua: string) {
  Object.defineProperty(navigator, 'userAgent', { value: ua, configurable: true });
}

describe('getModifierLabel', () => {
  test('returns ⌥ on macOS', () => {
    setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
    expect(getModifierLabel()).toBe('⌥');
  });

  test('returns "Alt+" on Windows', () => {
    setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    expect(getModifierLabel()).toBe('Alt+');
  });

  test('returns "Alt+" on ChromeOS / Linux', () => {
    setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36');
    expect(getModifierLabel()).toBe('Alt+');
  });
});

describe('getExtensionsShortcutsUrl (via getBrowserScheme)', () => {
  test('returns chrome:// URL on Chrome', () => {
    setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0 Safari/537.36');
    expect(getExtensionsShortcutsUrl()).toBe('chrome://extensions/shortcuts');
  });

  test('returns edge:// URL on Edge (Edg/ marker present)', () => {
    setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0',
    );
    expect(getExtensionsShortcutsUrl()).toBe('edge://extensions/shortcuts');
  });
});
