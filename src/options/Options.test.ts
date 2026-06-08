import { fireEvent, render, waitFor } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import Options from './Options.svelte';

interface ChromeMock {
  data: Record<string, unknown>;
  get: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
  getAll: ReturnType<typeof vi.fn>;
  tabsCreate: ReturnType<typeof vi.fn>;
}

// `launcherShortcut` controls what `chrome.commands.getAll()` reports for the
// `toggle-launcher` command — '' means unbound (guidance card shows). Defaults
// to bound so the existing Appearance tests see the page unchanged (no card).
function installChromeMock(launcherShortcut = 'Alt+L'): ChromeMock {
  const getAll = vi.fn(async () => [
    { name: 'pin-active-tab', shortcut: 'Alt+D' },
    { name: 'toggle-launcher', shortcut: launcherShortcut },
  ]);
  const tabsCreate = vi.fn(async () => ({}));
  const mock: ChromeMock = {
    data: {},
    get: vi.fn(async (key: string | null) => {
      if (key === null) return { ...mock.data };
      const value = mock.data[key];
      return value === undefined ? {} : { [key]: value };
    }),
    set: vi.fn(async (items: Record<string, unknown>) => {
      Object.assign(mock.data, items);
    }),
    getAll,
    tabsCreate,
  };
  (globalThis as unknown as { chrome: unknown }).chrome = {
    storage: {
      sync: { get: mock.get, set: mock.set },
      // RecentlyArchived reads the persisted app state from `local` on mount.
      local: { get: vi.fn(async () => ({})) },
      onChanged: { addListener: vi.fn(), removeListener: vi.fn() },
    },
    runtime: {
      getManifest: () => ({ version: '0.0.0' }),
      getURL: (p: string) => `chrome-extension://x/${p}`,
    },
    commands: { getAll },
    tabs: { create: tabsCreate },
  };
  return mock;
}

let chromeMock: ChromeMock;

beforeEach(() => {
  chromeMock = installChromeMock();
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  delete document.documentElement.dataset.density;
  vi.restoreAllMocks();
});

describe('Options', () => {
  test('renders the Appearance group with both the Density and Colour intensity controls', () => {
    const { container, getByText } = render(Options, { props: {} });
    expect(getByText('Appearance')).not.toBeNull();
    expect(getByText('Density')).not.toBeNull();
    expect(getByText('Colour intensity')).not.toBeNull();
    // Segmented controls: Density (compact/normal/comfort) + Colour intensity
    // (subtle/standard/vivid) in Appearance + the Pinned-tabs boundary default
    // (off/domain) + the Auto-archive toggle (off/on) → 3 + 3 + 2 + 2 = ten radios.
    // The Search default-engine picker is a dropdown (8 options don't fit a
    // segmented control) and the custom-URL + custom-keyword + idle-minutes fields
    // are text/number inputs — none contribute radios.
    const radios = container.querySelectorAll('input[type="radio"]');
    expect(radios).toHaveLength(10);
  });

  test('renders the Pinned tabs group with the boundary-default control (no Options code)', () => {
    const { getByText } = render(Options, { props: {} });
    expect(getByText('Pinned tabs')).not.toBeNull();
    expect(getByText('Lock pinned tabs to their site')).not.toBeNull();
  });

  test('shows the manifest version', () => {
    const { getByText } = render(Options, { props: {} });
    expect(getByText('v0.0.0')).not.toBeNull();
  });

  test('pre-selects the saved density', async () => {
    chromeMock.data['lunma.settings'] = { density: 'compact' };
    const { container } = render(Options, { props: {} });
    await waitFor(() => {
      const checked = container.querySelector('input:checked') as HTMLInputElement;
      expect(checked?.value).toBe('compact');
    });
  });

  test('selecting a density writes it and applies data-density to the document', async () => {
    const { container } = render(Options, { props: {} });
    // Let the initial read settle (normal → no attribute).
    await waitFor(() => expect(chromeMock.get).toHaveBeenCalled());

    const comfort = container.querySelector('input[value="comfort"]') as HTMLInputElement;
    await fireEvent.click(comfort);

    await waitFor(() => {
      // The merge carries every field, so the persisted object includes the
      // `tint`, boundary-default, and Search defaults alongside the changed
      // `density`.
      expect(chromeMock.set).toHaveBeenCalledWith({
        'lunma.settings': {
          density: 'comfort',
          tint: 'vivid',
          pinnedTabBoundaryDefault: 'off',
          defaultSearchEngine: 'google',
          customSearchUrl: '',
          customSearchKeyword: '',
          autoArchiveEnabled: true,
          autoArchiveIdleMinutes: 720,
          autoArchiveRetentionDays: 7,
        },
      });
    });
    expect(document.documentElement.dataset.density).toBe('comfort');
  });

  test('selecting a colour intensity persists the tint', async () => {
    const { container } = render(Options, { props: {} });
    await waitFor(() => expect(chromeMock.get).toHaveBeenCalled());

    const subtle = container.querySelector('input[value="subtle"]') as HTMLInputElement;
    await fireEvent.click(subtle);

    await waitFor(() => {
      expect(chromeMock.set).toHaveBeenCalledWith({
        'lunma.settings': {
          density: 'normal',
          tint: 'subtle',
          pinnedTabBoundaryDefault: 'off',
          defaultSearchEngine: 'google',
          customSearchUrl: '',
          customSearchKeyword: '',
          autoArchiveEnabled: true,
          autoArchiveIdleMinutes: 720,
          autoArchiveRetentionDays: 7,
        },
      });
    });
  });

  test('selecting a pinned-tab boundary default persists it', async () => {
    const { container } = render(Options, { props: {} });
    await waitFor(() => expect(chromeMock.get).toHaveBeenCalled());

    const domain = container.querySelector('input[value="domain"]') as HTMLInputElement;
    await fireEvent.click(domain);

    await waitFor(() => {
      expect(chromeMock.set).toHaveBeenCalledWith({
        'lunma.settings': {
          density: 'normal',
          tint: 'vivid',
          pinnedTabBoundaryDefault: 'domain',
          defaultSearchEngine: 'google',
          customSearchUrl: '',
          customSearchKeyword: '',
          autoArchiveEnabled: true,
          autoArchiveIdleMinutes: 720,
          autoArchiveRetentionDays: 7,
        },
      });
    });
  });

  test('selecting normal clears the data-density attribute', async () => {
    chromeMock.data['lunma.settings'] = { density: 'compact' };
    const { container } = render(Options, { props: {} });
    await waitFor(() => expect(document.documentElement.dataset.density).toBe('compact'));

    const normal = container.querySelector('input[value="normal"]') as HTMLInputElement;
    await fireEvent.click(normal);
    expect(document.documentElement.dataset.density).toBeUndefined();
  });

  test('renders the live preview rows', () => {
    const { container } = render(Options, { props: {} });
    const rows = container.querySelectorAll('[data-testid="tab-row"]');
    expect(rows).toHaveLength(3);
    expect(container.querySelector('[data-testid="tab-row"].active')).not.toBeNull();
  });
});

describe('Options — Search group', () => {
  test('renders the Search group + engine dropdown; custom fields hidden until Custom is selected', async () => {
    const { container, getByText, queryByText } = render(Options, { props: {} });
    expect(getByText('Search')).not.toBeNull();
    expect(getByText('Default search engine')).not.toBeNull();
    // Default engine is a built-in (google) → the custom-engine fields are hidden,
    // so the Search group shows just the picker (the custom slot is unused).
    expect(queryByText('Custom search URL')).toBeNull();
    expect(queryByText('Custom search keyword')).toBeNull();
    expect(container.querySelector('[data-testid="text-input"]')).toBeNull();
    // The 8-option engine picker renders as a Select dropdown (a listbox button,
    // not a segmented control); opening it exposes Perplexity among the options.
    const engine = container.querySelector('[data-testid="select"]') as HTMLButtonElement;
    expect(engine).not.toBeNull();
    expect(engine.getAttribute('aria-haspopup')).toBe('listbox');
    await fireEvent.click(engine);
    expect(
      container.querySelector('[data-testid="select-option"][data-value="perplexity"]'),
    ).not.toBeNull();
    // Selecting Custom reveals the custom-URL + keyword fields (two TextInputs).
    await fireEvent.click(
      container.querySelector('[data-testid="select-option"][data-value="custom"]') as HTMLElement,
    );
    await waitFor(() => expect(getByText('Custom search URL')).not.toBeNull());
    expect(getByText('Custom search keyword')).not.toBeNull();
    expect(container.querySelectorAll('[data-testid="text-input"]').length).toBe(2);
  });

  test('the Search group renders first, ahead of Appearance', () => {
    const { container } = render(Options, { props: {} });
    const labels = [...container.querySelectorAll('.group-label')].map((el) =>
      el.textContent?.trim(),
    );
    expect(labels[0]).toBe('Search');
    expect(labels.indexOf('Search')).toBeLessThan(labels.indexOf('Appearance'));
  });

  test('selecting an engine from the dropdown persists it immediately', async () => {
    const { container } = render(Options, { props: {} });
    await waitFor(() => expect(chromeMock.get).toHaveBeenCalled());

    const engine = container.querySelector('[data-testid="select"]') as HTMLButtonElement;
    await fireEvent.click(engine); // open the listbox
    const ddg = container.querySelector(
      '[data-testid="select-option"][data-value="duckduckgo"]',
    ) as HTMLButtonElement;
    await fireEvent.click(ddg);

    await waitFor(() => {
      expect(
        (chromeMock.data['lunma.settings'] as { defaultSearchEngine?: string })
          ?.defaultSearchEngine,
      ).toBe('duckduckgo');
    });
  });

  test('editing the custom URL persists it immediately (no save button)', async () => {
    // Custom must be the selected engine for the field to render.
    chromeMock.data['lunma.settings'] = { defaultSearchEngine: 'custom' };
    const { container } = render(Options, { props: {} });
    await waitFor(() => expect(chromeMock.get).toHaveBeenCalled());

    const field = container.querySelector('[data-testid="text-input"]') as HTMLInputElement;
    await fireEvent.input(field, { target: { value: 'https://kagi.com/search?q=%s' } });

    await waitFor(() => {
      expect(
        (chromeMock.data['lunma.settings'] as { customSearchUrl?: string })?.customSearchUrl,
      ).toBe('https://kagi.com/search?q=%s');
    });
  });

  test('a %s-less custom template (with custom selected) flags the field and shows the hint', async () => {
    chromeMock.data['lunma.settings'] = {
      defaultSearchEngine: 'custom',
      customSearchUrl: 'https://kagi.com',
    };
    const { container } = render(Options, { props: {} });
    await waitFor(() => {
      expect(
        (container.querySelector('[data-testid="text-input"]') as HTMLInputElement)?.getAttribute(
          'data-invalid',
        ),
      ).toBe('true');
    });
    expect(
      container.querySelector('[data-testid="custom-url-hint"]')?.getAttribute('data-visible'),
    ).toBe('true');
  });

  test('a built-in engine hides the custom-URL field and its hint entirely', async () => {
    const { container } = render(Options, { props: {} });
    await waitFor(() => expect(chromeMock.get).toHaveBeenCalled());
    // Default engine is google → the custom-engine fields are not rendered at all
    // (no field to flag, no hint slot), so there is nothing to validate.
    expect(container.querySelector('[data-testid="text-input"]')).toBeNull();
    expect(container.querySelector('[data-testid="custom-url-hint"]')).toBeNull();
  });

  test('renders the custom-keyword field and its warning slot (Custom engine)', async () => {
    chromeMock.data['lunma.settings'] = { defaultSearchEngine: 'custom' };
    const { getByText, container } = render(Options, { props: {} });
    await waitFor(() => expect(getByText('Custom search keyword')).not.toBeNull());
    // Two text fields now (custom URL + custom keyword); the warning slot exists.
    expect(container.querySelectorAll('[data-testid="text-input"]').length).toBe(2);
    expect(container.querySelector('[data-testid="custom-keyword-hint"]')).not.toBeNull();
  });

  test('a custom keyword that collides with a built-in shows the inline warning', async () => {
    chromeMock.data['lunma.settings'] = { defaultSearchEngine: 'custom', customSearchKeyword: 'g' }; // collides with Google
    const { container } = render(Options, { props: {} });
    await waitFor(() =>
      expect(
        container
          .querySelector('[data-testid="custom-keyword-hint"]')
          ?.getAttribute('data-visible'),
      ).toBe('true'),
    );
  });

  test('an uppercase custom keyword that shadows a built-in still warns (case-insensitive)', async () => {
    chromeMock.data['lunma.settings'] = { defaultSearchEngine: 'custom', customSearchKeyword: 'G' }; // shadows built-in `g`
    const { container } = render(Options, { props: {} });
    await waitFor(() =>
      expect(
        container
          .querySelector('[data-testid="custom-keyword-hint"]')
          ?.getAttribute('data-visible'),
      ).toBe('true'),
    );
  });

  test('a non-colliding custom keyword leaves the warning hidden', async () => {
    chromeMock.data['lunma.settings'] = { defaultSearchEngine: 'custom', customSearchKeyword: 'k' };
    const { container } = render(Options, { props: {} });
    await waitFor(() =>
      expect(container.querySelector('[data-testid="custom-keyword-hint"]')).not.toBeNull(),
    );
    expect(
      container.querySelector('[data-testid="custom-keyword-hint"]')?.getAttribute('data-visible'),
    ).toBe('false');
  });
});

describe('Options — Auto-archive group (toggle + number)', () => {
  function numberField(container: HTMLElement): HTMLInputElement {
    return container.querySelector(
      '[data-testid="number-autoArchiveIdleMinutes"]',
    ) as HTMLInputElement;
  }

  test('renders the Auto-archive group with both controls reflecting stored values', async () => {
    chromeMock.data['lunma.settings'] = { autoArchiveEnabled: false, autoArchiveIdleMinutes: 30 };
    const { container, getByText } = render(Options, { props: {} });
    expect(getByText('Auto-archive')).not.toBeNull();
    expect(getByText('Auto-archive idle tabs')).not.toBeNull();
    expect(getByText('Idle minutes before archiving')).not.toBeNull();

    await waitFor(() => {
      // The toggle reflects the stored boolean (off selected).
      const off = container.querySelector(
        'input[name="autoArchiveEnabled"][value="off"]',
      ) as HTMLInputElement;
      expect(off?.checked).toBe(true);
      // The number field reflects the stored integer.
      expect(numberField(container)?.value).toBe('30');
    });
  });

  test('toggling the master switch persists a boolean', async () => {
    const { container } = render(Options, { props: {} });
    await waitFor(() => expect(chromeMock.get).toHaveBeenCalled());

    const off = container.querySelector(
      'input[name="autoArchiveEnabled"][value="off"]',
    ) as HTMLInputElement;
    await fireEvent.click(off);

    await waitFor(() => {
      expect(
        (chromeMock.data['lunma.settings'] as { autoArchiveEnabled?: boolean })?.autoArchiveEnabled,
      ).toBe(false);
    });
  });

  test('editing the idle minutes persists an integer', async () => {
    const { container } = render(Options, { props: {} });
    await waitFor(() => expect(chromeMock.get).toHaveBeenCalled());

    await fireEvent.input(numberField(container), { target: { value: '15' } });

    await waitFor(() => {
      expect(
        (chromeMock.data['lunma.settings'] as { autoArchiveIdleMinutes?: number })
          ?.autoArchiveIdleMinutes,
      ).toBe(15);
    });
  });

  test('a non-numeric idle-minutes edit does not persist a non-number', async () => {
    const { container } = render(Options, { props: {} });
    await waitFor(() => expect(chromeMock.get).toHaveBeenCalled());
    chromeMock.set.mockClear();

    await fireEvent.input(numberField(container), { target: { value: 'soon' } });

    // No write at all — a non-number is never persisted.
    expect(chromeMock.set).not.toHaveBeenCalled();
  });

  test('a sub-minimum idle-minutes edit persists the floored integer (min 1)', async () => {
    const { container } = render(Options, { props: {} });
    await waitFor(() => expect(chromeMock.get).toHaveBeenCalled());

    await fireEvent.input(numberField(container), { target: { value: '0' } });

    await waitFor(() => {
      expect(
        (chromeMock.data['lunma.settings'] as { autoArchiveIdleMinutes?: number })
          ?.autoArchiveIdleMinutes,
      ).toBe(1);
    });
  });
});

describe('Options — launcher shortcut guidance', () => {
  test('shows the guidance card when the toggle-launcher shortcut is empty', async () => {
    installChromeMock('');
    const { container } = render(Options, { props: {} });
    await waitFor(() => {
      expect(container.querySelector('.shortcut-card')).not.toBeNull();
    });
    expect(container.querySelector('.shortcut-title')?.textContent).toContain(
      'Set the launcher shortcut',
    );
  });

  test('hides the guidance card when the shortcut is bound', async () => {
    const mock = installChromeMock('Alt+L');
    const { container } = render(Options, { props: {} });
    await waitFor(() => expect(mock.getAll).toHaveBeenCalled());
    await mock.getAll.mock.results[0]?.value; // let the resolved check assign
    await tick(); // flush the reactive `{#if}`
    expect(container.querySelector('.shortcut-card')).toBeNull();
  });

  test('the guidance button opens the chrome shortcuts page', async () => {
    const mock = installChromeMock('');
    const { container } = render(Options, { props: {} });
    await waitFor(() => {
      expect(container.querySelector('.shortcut-action button')).not.toBeNull();
    });
    (container.querySelector('.shortcut-action button') as HTMLButtonElement).click();
    expect(mock.tabsCreate).toHaveBeenCalledWith({ url: 'chrome://extensions/shortcuts' });
  });
});
