// Code shown in a story's Examples and Playground. Two sources:
//
//  • Examples — the EXACT markup the author wrote for each `<Variant>`,
//    extracted verbatim from the story source so the per-instance code is real
//    and can't drift. Purely syntactic (a scan for `<Variant label>…</Variant>`
//    blocks); no compiler.
//  • Playground — LIVE code rebuilt from the current control values, so it
//    tracks the knobs. It reconstructs the component's usage from its name (the
//    story's `meta.title`, which by convention IS the primitive's component
//    name) and the non-default args. Children/content is shown as a `…`
//    placeholder since the catalog only knows the derived prop contract, not the
//    story's authored children.
import type { Args, Controls } from './controls';

/** `<Variant label="…">INNER</Variant>` → `{ label → trimmed+dedented INNER }`.
 * Variants aren't nested, so a non-greedy match to the first `</Variant>` is
 * exact. */
export function extractVariantCode(source: string): Map<string, string> {
  const out = new Map<string, string>();
  const re = /<Variant\s+label=(?:"([^"]*)"|'([^']*)')[^>]*>([\s\S]*?)<\/Variant>/g;
  let m: RegExpExecArray | null = re.exec(source);
  while (m !== null) {
    const label = m[1] ?? m[2] ?? '';
    out.set(label, dedent(m[3] ?? ''));
    m = re.exec(source);
  }
  return out;
}

/** Strip a common leading indent (spaces or tabs) and surrounding blank lines so
 * extracted markup reads cleanly out of its source indentation. */
function dedent(block: string): string {
  const lines = block.replace(/^\n+|\s+$/g, '').split('\n');
  const indent = Math.min(
    ...lines.filter((l) => l.trim()).map((l) => l.match(/^[ \t]*/)?.[0].length ?? 0),
  );
  return lines.map((l) => l.slice(indent)).join('\n');
}

/** A syntax-colorable token of generated code. */
export interface CodeToken {
  text: string;
  kind: 'tag' | 'attr' | 'str' | 'plain';
}

/**
 * Live playground code as colorable tokens: the component reconstructed from its
 * name + the args that differ from their defaults (a boolean at `true` renders as
 * a bare attribute; `false`/default props are omitted). Children are a `…`
 * placeholder — the actual content renders in the canvas above.
 */
export function generatePlaygroundCode(name: string, controls: Controls, args: Args): CodeToken[] {
  const tokens: CodeToken[] = [{ text: `<${name}`, kind: 'tag' }];
  for (const [prop, def] of Object.entries(controls)) {
    const value = args[prop];
    if (value === undefined || value === def.default) continue;
    if (def.type === 'boolean') {
      if (value === true) tokens.push({ text: ` ${prop}`, kind: 'attr' });
      continue;
    }
    tokens.push(
      { text: ` ${prop}`, kind: 'attr' },
      { text: '=', kind: 'plain' },
      { text: `"${value}"`, kind: 'str' },
    );
  }
  tokens.push(
    { text: '>', kind: 'tag' },
    { text: '…', kind: 'plain' },
    { text: `</${name}>`, kind: 'tag' },
  );
  return tokens;
}
