import { describe, expect, it } from 'vitest';
import { resolveControls } from './registry';
import { defineStory } from './story';

// A title the deriver never produced (no `src/ui/__test_no_derived__.svelte`),
// so `derivedControls[title]` is undefined and the merge base is only the
// story's authored controls / overrides / excludes.
const UNDERIVED = '__test_no_derived__';

describe('resolveControls', () => {
  describe('given a component the deriver could not reach', () => {
    it('then surfaces the story-authored controls', () => {
      const meta = defineStory({
        title: UNDERIVED,
        group: 'G',
        controls: { checked: { type: 'boolean', default: true, description: 'On.' } },
      });
      expect(resolveControls(meta)).toEqual({
        checked: { type: 'boolean', default: true, description: 'On.' },
      });
    });

    it('then patches an authored control with controlOverrides', () => {
      const meta = defineStory({
        title: UNDERIVED,
        group: 'G',
        controls: { v: { type: 'select', default: 'a', options: ['a', 'b'] } },
        controlOverrides: { v: { description: 'chosen' } },
      });
      expect(resolveControls(meta).v).toMatchObject({
        type: 'select',
        default: 'a',
        description: 'chosen',
      });
    });

    it('then drops an excluded authored control', () => {
      const meta = defineStory({
        title: UNDERIVED,
        group: 'G',
        controls: {
          a: { type: 'text', default: '' },
          b: { type: 'text', default: '' },
        },
        excludeControls: { b: 'not a live control' },
      });
      expect(Object.keys(resolveControls(meta))).toEqual(['a']);
    });
  });

  describe('given a derivable primitive whose story also authors controls', () => {
    it('then a derived control wins over an authored one of the same name', () => {
      // `Button`'s `variant` is a derived `select`; an authored `text` for the
      // same name must NOT override it (derived spread wins).
      const meta = defineStory({
        title: 'Button',
        group: 'Atoms',
        controls: { variant: { type: 'text', default: 'zzz' } },
      });
      expect(resolveControls(meta).variant?.type).toBe('select');
    });
  });
});
