// Derives a base `Controls` schema from a `src/ui/<Name>.svelte` primitive's
// own `Props` interface, so the catalog's live controls/API table can't drift
// from the component's real contract (see the `derive-catalog-controls-from-props`
// OpenSpec change). Parsing is syntactic only: `svelte/compiler`'s `parse()`
// isolates the instance (`<script lang="ts">`, non-`module`) script range, and
// the TypeScript compiler API walks that range's `Props` interface and the
// `$props()` destructuring statement — no `ts.createProgram`/type-checking, so
// a prop typed via an imported alias is never silently mis-derived, only
// reported as unclassified.
import { parse } from 'svelte/compiler';
import ts from 'typescript';
import type { ControlDef, Controls, ControlType } from './controls';

/** The result of deriving a primitive's controls from its `Props` interface. */
export interface DerivedControls {
  /** Base controls for every mechanically-classifiable `Props` member. */
  controls: Controls;
  /** `Props` member names whose type isn't mechanically derivable — a story
   * must list these in `meta.excludeControls`. */
  unclassified: string[];
}

const EMPTY: DerivedControls = { controls: {}, unclassified: [] };

/** Parse a `.svelte` file's full source and derive its `Props` controls. */
export function deriveControls(source: string): DerivedControls {
  const ast = parse(source, { modern: true });
  const instance = ast.instance;
  if (!instance) return EMPTY;

  // `instance.content` is typed as an ESTree `Program` (no `start`/`end` in
  // that interface), but svelte's parser always attaches acorn's range fields
  // at runtime.
  const content = instance.content as unknown as { start: number; end: number };
  const scriptSource = source.slice(content.start, content.end);
  const sf = ts.createSourceFile(
    'component.ts',
    scriptSource,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );

  const propsInterface = sf.statements.find(
    (stmt): stmt is ts.InterfaceDeclaration =>
      ts.isInterfaceDeclaration(stmt) && stmt.name.text === 'Props',
  );
  if (!propsInterface) return EMPTY;

  const defaults = readDestructuredDefaults(sf);

  const controls: Controls = {};
  const unclassified: string[] = [];

  for (const member of propsInterface.members) {
    if (!ts.isPropertySignature(member) || !member.type) continue;
    const name = member.name.getText(sf);
    const classification = classifyType(member.type);
    if (!classification) {
      unclassified.push(name);
      continue;
    }
    const description = readJsDocDescription(member);
    const def: ControlDef = {
      type: classification.type,
      default: resolveDefault(classification, defaults[name]),
      typeLabel: member.type.getText(sf),
      ...(classification.options ? { options: classification.options } : {}),
      ...(description ? { description } : {}),
    };
    controls[name] = def;
  }

  return { controls, unclassified };
}

interface Classification {
  type: ControlType;
  options?: readonly string[];
}

/** `boolean`→boolean, `number`→number, `string`→text, a union of only
 * string-literal types (optionally with `undefined` for an optional prop)→
 * select. Everything else (`Snippet`, callbacks, arrays, object literals,
 * imported type references) is unclassified. */
function classifyType(typeNode: ts.TypeNode): Classification | undefined {
  const members = ts.isUnionTypeNode(typeNode) ? [...typeNode.types] : [typeNode];
  const nonUndefined = members.filter((member) => member.kind !== ts.SyntaxKind.UndefinedKeyword);
  if (nonUndefined.length === 0) return undefined;

  if (nonUndefined.length === 1) {
    const single = nonUndefined.at(0);
    if (!single) return undefined;
    if (single.kind === ts.SyntaxKind.BooleanKeyword) return { type: 'boolean' };
    if (single.kind === ts.SyntaxKind.NumberKeyword) return { type: 'number' };
    if (single.kind === ts.SyntaxKind.StringKeyword) return { type: 'text' };
    const literal = stringLiteralValue(single);
    return literal === undefined ? undefined : { type: 'select', options: [literal] };
  }

  const options: string[] = [];
  for (const member of nonUndefined) {
    const literal = stringLiteralValue(member);
    if (literal === undefined) return undefined;
    options.push(literal);
  }
  return { type: 'select', options };
}

function stringLiteralValue(node: ts.TypeNode): string | undefined {
  return ts.isLiteralTypeNode(node) && ts.isStringLiteral(node.literal)
    ? node.literal.text
    : undefined;
}

/** Fallback seed value for a control with no destructured default — `false`,
 * `0`, or the first `select` option / `''` for a plain `string`. */
function resolveDefault(
  classification: Classification,
  destructured: boolean | string | number | undefined,
): boolean | string | number {
  if (destructured !== undefined) return destructured;
  switch (classification.type) {
    case 'boolean':
      return false;
    case 'number':
      return 0;
    case 'select':
      return classification.options?.[0] ?? '';
    case 'text':
      return '';
  }
}

/** Read the `$props()` destructuring statement's per-prop default values
 * (including `$bindable(default)` — the default is its first argument). */
function readDestructuredDefaults(sf: ts.SourceFile): Record<string, boolean | string | number> {
  const defaults: Record<string, boolean | string | number> = {};
  for (const stmt of sf.statements) {
    if (!ts.isVariableStatement(stmt)) continue;
    for (const decl of stmt.declarationList.declarations) {
      if (!decl.initializer || !ts.isCallExpression(decl.initializer)) continue;
      if (decl.initializer.expression.getText(sf) !== '$props') continue;
      if (!ts.isObjectBindingPattern(decl.name)) continue;
      for (const element of decl.name.elements) {
        const propName = (element.propertyName ?? element.name).getText(sf);
        const value = literalValue(unwrapBindable(element.initializer, sf));
        if (value !== undefined) defaults[propName] = value;
      }
    }
  }
  return defaults;
}

function unwrapBindable(
  node: ts.Expression | undefined,
  sf: ts.SourceFile,
): ts.Expression | undefined {
  if (node && ts.isCallExpression(node) && node.expression.getText(sf) === '$bindable') {
    return node.arguments[0];
  }
  return node;
}

function literalValue(node: ts.Expression | undefined): boolean | string | number | undefined {
  if (!node) return undefined;
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  return undefined;
}

function readJsDocDescription(member: ts.PropertySignature): string | undefined {
  const parts: string[] = [];
  for (const doc of ts.getJSDocCommentsAndTags(member)) {
    if (!ts.isJSDoc(doc)) continue;
    const { comment } = doc;
    if (typeof comment === 'string') parts.push(comment);
    else if (comment) parts.push(comment.map((c) => c.text).join(''));
  }
  return parts.length > 0 ? parts.join(' ').trim() : undefined;
}
