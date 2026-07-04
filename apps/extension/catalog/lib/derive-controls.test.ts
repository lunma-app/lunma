import { describe, expect, it } from 'vitest';
import { deriveControls } from './derive-controls';
import type { StoryMeta } from './story';

function fixture(propsBody: string, destructure: string): string {
  return `<script lang="ts">
interface Props {
${propsBody}
}

const ${destructure}: Props = $props();
</script>

<div></div>
`;
}

describe('deriveControls', () => {
  it('classifies boolean, number, string, and string-literal-union props', () => {
    const source = fixture(
      `  disabled?: boolean | undefined;
  count: number;
  label: string;
  variant?: 'primary' | 'secondary' | undefined;`,
      "{ disabled = false, count, label, variant = 'primary' }",
    );
    const { controls, unclassified } = deriveControls(source);

    expect(unclassified).toEqual([]);
    expect(controls.disabled).toMatchObject({ type: 'boolean', default: false });
    expect(controls.count).toMatchObject({ type: 'number', default: 0 });
    expect(controls.label).toMatchObject({ type: 'text', default: '' });
    expect(controls.variant).toMatchObject({
      type: 'select',
      options: ['primary', 'secondary'],
      default: 'primary',
    });
  });

  it('marks Snippet, callback, array, object-literal, and imported-type props unclassified', () => {
    const source = fixture(
      `  children: Snippet;
  onclick: () => void;
  items: string[];
  meta: { id: string };
  option: SomeImportedType;`,
      '{ children, onclick, items, meta, option }',
    );
    const { controls, unclassified } = deriveControls(source);

    expect(controls).toEqual({});
    expect(unclassified.sort()).toEqual(['children', 'items', 'meta', 'onclick', 'option'].sort());
  });

  it('reads destructured default values, including $bindable(default)', () => {
    const source = fixture(
      `  size?: 'sm' | 'md' | undefined;
  open?: boolean | undefined;`,
      "{ size = 'md', open = $bindable(false) }",
    );
    const { controls } = deriveControls(source);

    expect(controls.size?.default).toBe('md');
    expect(controls.open?.default).toBe(false);
  });

  it('falls back to a type-based default when no destructured default exists', () => {
    const source = fixture(
      `  active: boolean;
  total: number;
  title: string;
  tone: 'a' | 'b';`,
      '{ active, total, title, tone }',
    );
    const { controls } = deriveControls(source);

    expect(controls.active?.default).toBe(false);
    expect(controls.total?.default).toBe(0);
    expect(controls.title?.default).toBe('');
    expect(controls.tone?.default).toBe('a');
  });

  it('derives description from JSDoc and typeLabel from the type text', () => {
    const source = fixture(
      `  /** Style variant. */
  variant?: 'primary' | 'secondary' | undefined;`,
      "{ variant = 'primary' }",
    );
    const { controls } = deriveControls(source);

    expect(controls.variant?.description).toBe('Style variant.');
    expect(controls.variant?.typeLabel).toBe("'primary' | 'secondary' | undefined");
  });

  it('returns empty when there is no Props interface', () => {
    const source = `<script lang="ts">
const x = 1;
</script>
<div></div>
`;
    expect(deriveControls(source)).toEqual({ controls: {}, unclassified: [] });
  });

  it('ignores a module-level interface named Props-adjacent helper types', () => {
    const source = `<script lang="ts" module>
export interface SelectOption {
  value: string;
}
</script>
<script lang="ts">
interface Props {
  options: SelectOption[];
  value: string;
}

const { options, value }: Props = $props();
</script>
<div></div>
`;
    const { controls, unclassified } = deriveControls(source);
    expect(unclassified).toEqual(['options']);
    expect(controls.value).toMatchObject({ type: 'text', default: '' });
  });
});

// Drift guard (derive-catalog-controls-from-props, design D7): calls
// deriveControls() directly against each real src/ui primitive's current
// source — independent of the generated codegen module — and cross-checks
// against each primitive's story `meta.excludeControls`/`controlOverrides`.
// Bidirectional: nothing a primitive's Props declares may go unaccounted for
// (the Button drift this change fixes), and no story may reference a prop
// that no longer exists (a stale exclusion/override left behind by a rename).
const primitiveSources = import.meta.glob<string>('../../src/ui/*.svelte', {
  eager: true,
  query: '?raw',
  import: 'default',
});
const storyMetas = import.meta.glob<StoryMeta>('../stories/ui/*.stories.svelte', {
  eager: true,
  import: 'meta',
});

function primitiveNameFromPath(path: string): string {
  return path.replace(/^.*\//, '').replace(/\.svelte$/, '');
}

function storyNameFromPath(path: string): string {
  return path.replace(/^.*\//, '').replace(/\.stories\.svelte$/, '');
}

function primitiveEntries(): Array<{ name: string; source: string }> {
  return Object.entries(primitiveSources)
    .map(([path, source]) => ({ name: primitiveNameFromPath(path), source }))
    .filter(({ name }) => !name.includes('.test.'));
}

function storyMetaByName(): Map<string, StoryMeta> {
  const byName = new Map<string, StoryMeta>();
  for (const [path, meta] of Object.entries(storyMetas)) {
    byName.set(storyNameFromPath(path), meta);
  }
  return byName;
}

describe('derive-controls drift guard', () => {
  it('enumerates a non-empty primitive set (sanity)', () => {
    expect(primitiveEntries().length).toBeGreaterThan(0);
  });

  it('every Props member is derived or explicitly excluded', () => {
    const metas = storyMetaByName();
    const failures: string[] = [];
    for (const { name, source } of primitiveEntries()) {
      const meta = metas.get(name);
      const { controls, unclassified } = deriveControls(source);
      // A Props member is accounted for when it's derived, excluded, OR
      // author-declared via meta.controls (the escape hatch for a prop the
      // deriver can't reach — surfacing it counts, same as excluding it).
      const accountedFor = new Set([
        ...Object.keys(controls),
        ...(meta?.controls ? Object.keys(meta.controls) : []),
        ...(meta?.excludeControls ? Object.keys(meta.excludeControls) : []),
      ]);
      const missing = unclassified.filter((prop) => !accountedFor.has(prop));
      if (missing.length > 0) {
        failures.push(
          `${name}: unaccounted-for prop(s) ${missing.join(', ')} — add to meta.excludeControls or meta.controls`,
        );
      }
    }
    expect(failures).toEqual([]);
  });

  it('every excludeControls/controlOverrides key names a real Props member', () => {
    const metas = storyMetaByName();
    const failures: string[] = [];
    for (const { name, source } of primitiveEntries()) {
      const meta = metas.get(name);
      if (!meta) continue;
      const { controls, unclassified } = deriveControls(source);
      const realProps = new Set([...Object.keys(controls), ...unclassified]);
      for (const prop of Object.keys(meta.excludeControls ?? {})) {
        if (!realProps.has(prop)) failures.push(`${name}: stale excludeControls entry '${prop}'`);
      }
      for (const prop of Object.keys(meta.controlOverrides ?? {})) {
        if (!realProps.has(prop)) failures.push(`${name}: stale controlOverrides entry '${prop}'`);
      }
    }
    expect(failures).toEqual([]);
  });
});
