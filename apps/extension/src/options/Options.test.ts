import { fireEvent, render, waitFor } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { SETTINGS } from '../shared/settings';
import Options from './Options.svelte';

// Mirrors `Options.svelte`'s `SEGMENTED_MAX`: an enum wider than this renders as a
// Select (no radios) rather than a SegmentedControl.
const SEGMENTED_MAX = 4;
// Registry-derived radio tally (no magic literal): every enum that fits a
// SegmentedControl contributes one radio per option, and every toggle contributes
// two (Off|On). Enums too wide render as a Select, and text/number settings render
// as inputs — neither contributes radios. Adding a setting updates this count.
const REGISTRY_RADIOS = SETTINGS.reduce((n, decl) => {
  if (decl.type === 'enum' && decl.options.length <= SEGMENTED_MAX) return n + decl.options.length;
  if (decl.type === 'toggle') return n + 2;
  return n;
}, 0);

// Options is now an orchestrator: the Connections / Result-sources / Shortcut
// guidance behaviours are covered by `ConnectionsCard.test.ts`,
// `ResultSourcesCard.test.ts`, and `ShortcutGuidanceCard.test.ts`. This mock
// only carries what the orchestrator + its still-mounted child cards need on
// mount (settings sync, a benign storage.local for the data cards, and stubbed
// commands/permissions so those children mount without throwing).
interface ChromeMock {
  data: Record<string, unknown>;
  get: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
}

function installChromeMock(): ChromeMock {
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
  };
  (globalThis as unknown as { chrome: unknown }).chrome = {
    storage: {
      sync: { get: mock.get, set: mock.set },
      // The Connections / RecentlyArchived child cards read storage.local
      // on mount; an empty record is fine for the orchestrator's own tests.
      local: {
        get: vi.fn(async () => ({})),
        set: vi.fn(async () => undefined),
      },
      onChanged: { addListener: vi.fn(), removeListener: vi.fn() },
    },
    runtime: {
      getManifest: () => ({ version: '0.0.0' }),
      getURL: (p: string) => `chrome-extension://x/${p}`,
    },
    // ShortcutGuidanceCard probes this on mount (optional-chained) — report the
    // shortcut bound so its guidance card stays hidden.
    commands: { getAll: vi.fn(async () => [{ name: 'toggle-launcher', shortcut: 'Alt+L' }]) },
    // ResultSourcesCard queries + observes permissions on mount.
    permissions: {
      contains: vi.fn(async () => false),
      request: vi.fn(async () => true),
      onAdded: { addListener: vi.fn(), removeListener: vi.fn() },
      onRemoved: { addListener: vi.fn(), removeListener: vi.fn() },
    },
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
    // Radio count is registry-derived (REGISTRY_RADIOS), plus the BackupRestore
    // card's one "Include settings" Off|On toggle (+2) — it mounts inside the
    // orchestrator. No magic literal: adding a segmented/toggle setting flows
    // through REGISTRY_RADIOS automatically.
    const radios = container.querySelectorAll('input[type="radio"]');
    expect(radios).toHaveLength(REGISTRY_RADIOS + 2);
  });

  test('each registry section card shows a one-line intro under its heading', () => {
    const { getByText } = render(Options, { props: {} });
    // Intro copy from GROUP_INTRO renders beneath the section heading.
    expect(getByText(/across every Lunma surface/)).not.toBeNull();
    expect(getByText(/How the launcher finds, ranks, and opens/)).not.toBeNull();
    expect(getByText(/never your pinned ones/)).not.toBeNull();
  });

  test('renders the pinned-tab boundary control under the Tabs group (folded in)', () => {
    const { getByText } = render(Options, { props: {} });
    expect(getByText('Tabs')).not.toBeNull();
    expect(getByText('Lock pinned tabs to their site')).not.toBeNull();
  });

  test('renders the Tabs group with the navigation-dedup toggle (navigation-tab-dedup)', () => {
    const { getByText } = render(Options, { props: {} });
    // The "Tabs" group heading + the toggle's label, rendered purely from the
    // declarative registry (no Options.svelte code for this setting).
    expect(getByText('Tabs')).not.toBeNull();
    expect(getByText('Switch to an already-open tab')).not.toBeNull();
  });

  test('shows the manifest version', () => {
    const { getByText } = render(Options, { props: {} });
    expect(getByText('v0.0.0')).not.toBeNull();
  });

  test('links out to the privacy policy in a new tab', () => {
    const { container } = render(Options, { props: {} });
    const link = container.querySelector(
      '[data-testid="options-privacy-link"]',
    ) as HTMLAnchorElement;
    expect(link).not.toBeNull();
    expect(link.getAttribute('href')).toBe('https://lunma.app/privacy');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
    expect(link.textContent?.trim()).toBe('Privacy policy');
  });

  test('pre-selects the saved density', async () => {
    chromeMock.data['lunma.settings'] = { density: 'compact' };
    const { container } = render(Options, { props: {} });
    // Scope to the density radio directly — other segmented controls (e.g. the
    // Search-group Launcher scope) also carry a checked default, so a global
    // `input:checked` would no longer uniquely identify the density selection.
    await waitFor(() => {
      const compact = container.querySelector('input[value="compact"]') as HTMLInputElement;
      expect(compact?.checked).toBe(true);
    });
  });

  test('selecting a density writes it and applies data-density to the document', async () => {
    const { container } = render(Options, { props: {} });
    // Let the initial read settle (comfort is the default, so it is pre-applied).
    await waitFor(() => expect(chromeMock.get).toHaveBeenCalled());

    // Pick compact — comfort is the default/pre-selected, so it would fire no change.
    const compact = container.querySelector('input[value="compact"]') as HTMLInputElement;
    await fireEvent.click(compact);

    await waitFor(() => {
      // The merge carries every field, so the persisted object includes the
      // `tint`, boundary-default, and Search defaults alongside the changed
      // `density`.
      expect(chromeMock.set).toHaveBeenCalledWith({
        'lunma.settings': {
          density: 'compact',
          tint: 'vivid',
          theme: 'dark',
          showGlares: true,
          reduceMotion: false,
          pinnedTabBoundaryDefault: 'off',
          defaultSearchEngine: 'google',
          customSearchUrl: '',
          customSearchKeyword: '',
          launcherScope: 'prefer-current-space',
          dedupNewTabNavigations: true,
          autoArchiveEnabled: true,
          autoArchiveIdleMinutes: 720,
          autoArchiveRetentionDays: 7,
        },
      });
    });
    expect(document.documentElement.dataset.density).toBe('compact');
  });

  test('selecting a colour intensity persists the tint', async () => {
    const { container } = render(Options, { props: {} });
    await waitFor(() => expect(chromeMock.get).toHaveBeenCalled());

    const subtle = container.querySelector('input[value="subtle"]') as HTMLInputElement;
    await fireEvent.click(subtle);

    await waitFor(() => {
      expect(chromeMock.set).toHaveBeenCalledWith({
        'lunma.settings': {
          density: 'comfort',
          tint: 'subtle',
          theme: 'dark',
          showGlares: true,
          reduceMotion: false,
          pinnedTabBoundaryDefault: 'off',
          defaultSearchEngine: 'google',
          customSearchUrl: '',
          customSearchKeyword: '',
          launcherScope: 'prefer-current-space',
          dedupNewTabNavigations: true,
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
          density: 'comfort',
          tint: 'vivid',
          theme: 'dark',
          showGlares: true,
          reduceMotion: false,
          pinnedTabBoundaryDefault: 'domain',
          defaultSearchEngine: 'google',
          customSearchUrl: '',
          customSearchKeyword: '',
          launcherScope: 'prefer-current-space',
          dedupNewTabNavigations: true,
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
});

describe('Options — Search group', () => {
  test('renders the Search group + engine dropdown; custom fields hidden until Custom is selected', async () => {
    const { container, getByText, queryByText } = render(Options, { props: {} });
    expect(getByText('Search & launcher')).not.toBeNull();
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

  test('registry groups render in order: Search & launcher → Appearance → Tabs → Auto-archive', () => {
    const { container } = render(Options, { props: {} });
    // Connections is a standalone card (no group-heading testid), so the first
    // registry group-heading is Search & launcher. There is no Look & feel group.
    const labels = [...container.querySelectorAll('[data-testid="group-heading"]')].map((el) =>
      el.textContent?.trim(),
    );
    expect(labels[0]).toBe('Search & launcher');
    expect(labels).not.toContain('Look & feel');
    expect(labels.indexOf('Search & launcher')).toBeLessThan(labels.indexOf('Appearance'));
    expect(labels.indexOf('Appearance')).toBeLessThan(labels.indexOf('Tabs'));
    expect(labels.indexOf('Tabs')).toBeLessThan(labels.indexOf('Auto-archive'));
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
  function retentionField(container: HTMLElement): HTMLInputElement {
    return container.querySelector(
      '[data-testid="number-autoArchiveRetentionDays"]',
    ) as HTMLInputElement;
  }

  test('renders the retention-days field reflecting the stored value', async () => {
    chromeMock.data['lunma.settings'] = { autoArchiveRetentionDays: 14 };
    const { container, getByText } = render(Options, { props: {} });
    expect(getByText('Keep archived tabs for (days)')).not.toBeNull();
    await waitFor(() => expect(retentionField(container)?.value).toBe('14'));
  });

  test('a sub-minimum retention-days edit persists the floored integer (min 1)', async () => {
    const { container } = render(Options, { props: {} });
    await waitFor(() => expect(chromeMock.get).toHaveBeenCalled());

    await fireEvent.input(retentionField(container), { target: { value: '0' } });

    await waitFor(() => {
      expect(
        (chromeMock.data['lunma.settings'] as { autoArchiveRetentionDays?: number })
          ?.autoArchiveRetentionDays,
      ).toBe(1);
    });
  });

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

  test('the Auto-archive group exposes the #auto-archive deep-link anchor', () => {
    // The sidebar first-run notice's "Manage in settings" deep-links here via
    // `#auto-archive` (Options.svelte's `groupSlug`); the section carries that id.
    const { container } = render(Options, { props: {} });
    // Assert via the `#auto-archive` id alone — the `section.group` coupling
    // doesn't survive the move onto the `SettingsCard` primitive.
    const section = container.querySelector('#auto-archive') as HTMLElement;
    expect(section).not.toBeNull();
    expect(section.textContent).toContain('Auto-archive idle tabs');
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
