import { describe, expect, it } from 'vitest';
import type { Args, Controls } from './controls';
import { extractVariantCode, generatePlaygroundCode } from './extract-code';

describe('extractVariantCode', () => {
  it('extracts a single-line variant keyed by its label', () => {
    const src = `<Variant label="primary"><Button>Save</Button></Variant>`;
    expect(extractVariantCode(src).get('primary')).toBe('<Button>Save</Button>');
  });

  it('extracts multiple variants and stops at the first closing tag', () => {
    const src = [`<Variant label="a"><X /></Variant>`, `<Variant label="b"><Y /></Variant>`].join(
      '\n',
    );
    const map = extractVariantCode(src);
    expect(map.get('a')).toBe('<X />');
    expect(map.get('b')).toBe('<Y />');
  });

  it('dedents a space-indented multi-line body', () => {
    const src = ['    <Variant label="m">', '      <A />', '      <B />', '    </Variant>'].join(
      '\n',
    );
    expect(extractVariantCode(src).get('m')).toBe('<A />\n<B />');
  });

  it('supports single-quoted labels', () => {
    const src = `<Variant label='q'><Z /></Variant>`;
    expect(extractVariantCode(src).get('q')).toBe('<Z />');
  });
});

describe('generatePlaygroundCode', () => {
  const controls: Controls = {
    variant: { type: 'select', default: 'primary', options: ['primary', 'ghost'] },
    disabled: { type: 'boolean', default: false },
    size: { type: 'text', default: 'md' },
  };

  it('omits args equal to their default', () => {
    const args: Args = { variant: 'primary', disabled: false, size: 'md' };
    const text = generatePlaygroundCode('Button', controls, args)
      .map((t) => t.text)
      .join('');
    expect(text).toBe('<Button>…</Button>');
  });

  it('renders a true boolean as a bare attribute and a changed value as prop="value"', () => {
    const args: Args = { variant: 'ghost', disabled: true, size: 'md' };
    const text = generatePlaygroundCode('Button', controls, args)
      .map((t) => t.text)
      .join('');
    expect(text).toBe('<Button variant="ghost" disabled>…</Button>');
  });

  it('tags the component name and string values with kinds', () => {
    const args: Args = { variant: 'ghost', disabled: false, size: 'md' };
    const tokens = generatePlaygroundCode('Button', controls, args);
    expect(tokens[0]).toEqual({ text: '<Button', kind: 'tag' });
    expect(tokens.find((t) => t.kind === 'str')?.text).toBe('"ghost"');
  });
});
