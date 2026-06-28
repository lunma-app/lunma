import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { parse } from 'svelte/compiler';
import { describe, expect, test } from 'vitest';

// i18n enforcement gate (localize-extension-ui D4). Fails `pnpm verify` when a
// user-visible literal string is introduced in a migrated surface
// (`sidebar/`, `launcher/`, `options/`) instead of a `m.*` message. Biome has no
// `no-literal-string` rule and the repo is Biome-only, so this Vitest guard —
// riding `verify` like `version-parity` / `overlay.budget` — is the mechanism.
//
// It parses each surface `.svelte` template with the Svelte compiler and flags
// user-visible literal text nodes + user-facing attribute literals, EXCEPT:
//   - whitespace / punctuation / symbol-only text (no letters),
//   - the brand string "Lunma",
//   - text inside `code` / `pre` elements,
//   - an inline `<!-- i18n-exempt: reason -->` comment immediately before the
//     element/text (the escape hatch for an intentional literal).
// `<style>`/`<script>` are excluded by construction (not in the template AST).

const SURFACES = ['sidebar', 'launcher', 'options'];
// User-facing attribute / component-prop names whose literal string values are
// rendered to the user. Covers HTML attributes (`placeholder`, `title`,
// `aria-label`, `alt`) AND the component props this codebase uses to pass copy
// (`heading`, `label`, `description`, `subtitle`, `ariaLabel`) — so a hardcoded
// `<SettingsCard heading="…">` or `<Button label="…">` is caught, not just
// template text. An expression value (`heading={m.x()}`) is not a literal and is
// skipped; an intentional literal uses the `i18n-exempt` hatch.
const USER_FACING_ATTRS = new Set([
  'placeholder',
  'title',
  'aria-label',
  'ariaLabel',
  'alt',
  'heading',
  'label',
  'description',
  'subtitle',
]);
const TEXT_EXEMPT_ELEMENTS = new Set(['code', 'pre']);
// Literals that are intentionally not localized (brand, separators rendered as text).
const ALLOWLIST = new Set(['Lunma']);
const EXEMPT_MARKER = 'i18n-exempt';
// A literal is user-visible only if it carries a letter (Unicode). Pure
// punctuation/symbols/whitespace (·, ↵, ⇧↵, %, —, …) are not flagged.
const HAS_LETTER = /\p{L}/u;

interface Violation {
  file: string;
  line: number;
  text: string;
  kind: 'text' | 'attr';
}

function svelteFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...svelteFiles(full));
    // Shipping surfaces only — skip `.test.*` / `*.harness.svelte` fixtures.
    else if (entry.name.endsWith('.svelte') && !/\.(test|harness)\./.test(entry.name))
      out.push(full);
  }
  return out;
}

function lineOf(source: string, index: number): number {
  let line = 1;
  for (let i = 0; i < index && i < source.length; i++) if (source[i] === '\n') line++;
  return line;
}

function isExemptLiteral(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed === '') return true;
  if (!HAS_LETTER.test(trimmed)) return true;
  if (ALLOWLIST.has(trimmed)) return true;
  return false;
}

/** Collect user-visible literal violations from one `.svelte` source. */
function findViolations(source: string, file: string): Violation[] {
  const violations: Violation[] = [];
  let ast: ReturnType<typeof parse>;
  try {
    ast = parse(source, { modern: true, filename: file });
  } catch {
    return violations; // a parse failure surfaces elsewhere (svelte-check)
  }

  // Recursive walk over the template fragment. `exempt` is set when the most
  // recent sibling comment carried the escape-hatch marker; `inExemptEl` skips
  // text inside code/pre.
  const walk = (nodes: unknown[], inExemptEl: boolean): void => {
    let exemptNext = false;
    for (const raw of nodes) {
      const node = raw as Record<string, unknown>;
      const type = node.type as string;

      if (type === 'Comment') {
        if (String(node.data ?? '').includes(EXEMPT_MARKER)) exemptNext = true;
        continue;
      }

      if (type === 'Text') {
        const data = String(node.data ?? '');
        // Whitespace-only text between a comment and its target is a no-op — skip
        // it WITHOUT clearing `exemptNext`, so the marker still reaches the next
        // real node (e.g. `<!-- i18n-exempt -->\n  <span>RSS</span>`).
        if (data.trim() === '') continue;
        if (!inExemptEl && !exemptNext && !isExemptLiteral(data)) {
          violations.push({
            file,
            line: lineOf(source, (node.start as number) ?? 0),
            text: data.trim(),
            kind: 'text',
          });
        }
        exemptNext = false;
        continue;
      }

      // Elements / components: check user-facing literal attributes, then recurse.
      // An `i18n-exempt` comment immediately before an element exempts that
      // element's WHOLE subtree (its attributes + text children) — so a marker
      // before `<span>RSS</span>` covers the inner text, not just the span node.
      const name = String(node.name ?? '');
      const exemptThis = exemptNext;
      const childExempt = inExemptEl || exemptThis || TEXT_EXEMPT_ELEMENTS.has(name);
      if (!exemptThis && Array.isArray(node.attributes)) {
        for (const attrRaw of node.attributes) {
          const attr = attrRaw as Record<string, unknown>;
          if (attr.type !== 'Attribute' || !USER_FACING_ATTRS.has(String(attr.name))) continue;
          const value = attr.value;
          // A literal attribute value is `[{ type: 'Text', data }]`; an
          // expression (`title={m.x()}`) is `[{ type: 'ExpressionTag' }]` → skip.
          if (!Array.isArray(value) || value.length !== 1) continue;
          const only = value[0] as Record<string, unknown>;
          if (only.type !== 'Text') continue;
          const data = String(only.data ?? '');
          if (!isExemptLiteral(data)) {
            violations.push({
              file,
              line: lineOf(source, (attr.start as number) ?? (node.start as number) ?? 0),
              text: `${String(attr.name)}="${data.trim()}"`,
              kind: 'attr',
            });
          }
        }
      }

      // Recurse into any child fragment / branch the node carries.
      for (const key of ['fragment', 'consequent', 'alternate', 'body', 'fallback']) {
        const branch = node[key] as { nodes?: unknown[] } | undefined;
        if (branch?.nodes) walk(branch.nodes, childExempt);
      }
      exemptNext = false;
    }
  };

  const fragment = (ast as { fragment?: { nodes?: unknown[] } }).fragment;
  if (fragment?.nodes) walk(fragment.nodes, false);
  return violations;
}

const root = resolve(process.cwd(), 'src');
const allViolations: Violation[] = [];
for (const surface of SURFACES) {
  for (const file of svelteFiles(join(root, surface))) {
    allViolations.push(...findViolations(readFileSync(file, 'utf8'), relative(root, file)));
  }
}

describe('i18n enforcement: no un-localized literals in migrated surfaces', () => {
  if (process.env.I18N_REPORT) {
    test('REPORT', () => {
      for (const v of allViolations) console.log(`${v.file}:${v.line}  [${v.kind}]  ${v.text}`);
      console.log(`\nTOTAL: ${allViolations.length}`);
    });
  }

  test('every user-visible string renders through a message (or is exempt)', () => {
    const report = allViolations
      .map((v) => `  ${v.file}:${v.line} [${v.kind}] ${v.text}`)
      .join('\n');
    expect(allViolations, `Un-localized literals found:\n${report}`).toEqual([]);
  });
});
