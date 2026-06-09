// Architecture-integrity guardrail (capability: architecture-integrity).
// Enforces the token/primitive half of the component-library contract from
// openspec/specs/visual-system/spec.md: src/ui PRIMITIVES must reference design
// tokens for the gated properties, not raw literals. Run via `pnpm lint:styles`.
//
// Scope (deliberate): only the cleanly-decidable primitive rules are mechanised —
// `font-size` must be a `--text-*` token and `z-index` a `--z-*` token (both already
// hold across src/ui today). The OTHER half — "feature components must not reach past
// primitives to consume tokens, nor re-roll primitives" — is NOT mechanically
// enforceable without flagging legitimate feature CSS (e.g. a tinted glass shelf that
// uses `--glass-*`/`--glow-*` by design), so it stays a proposal-review concern per the
// component-library policy. Raw `scale()` is intentionally NOT banned: primitives use it
// legitimately in @keyframes / hover animations (it is the PRESS transform that owes
// `--press-scale`, which is not mechanically separable from decorative scales).
//
// `postcss-html` is imported here (not referenced by name) so its resolution is
// anchored to this config's package (`apps/extension`), where the dependency is
// linked. Under pnpm's isolated store, stylelint's own `customSyntax` string
// resolver looks relative to stylelint's location and cannot see a sibling
// package's dep — passing the resolved syntax object sidesteps that.
import postcssHtml from 'postcss-html';

export default {
  plugins: ['stylelint-declaration-strict-value'],
  rules: {},
  overrides: [
    {
      // Every Svelte SFC under src/: enable <style> parsing. No primitive rules here —
      // feature styles are reviewed, not linted; this override only lets stylelint parse.
      files: ['src/**/*.svelte'],
      customSyntax: postcssHtml,
    },
    {
      // PRIMITIVES: the token contract is enforced here.
      files: ['src/ui/**/*.svelte'],
      customSyntax: postcssHtml,
      rules: {
        'scale-unlimited/declaration-strict-value': [
          ['font-size', 'z-index'],
          {
            ignoreValues: ['inherit', 'initial', 'unset', 'revert', 'auto'],
            disableFix: true,
            message:
              'Primitive must use a design token for "${property}" ' +
              '(e.g. var(--text-*) / var(--z-*)), not a raw value — see ' +
              'openspec/specs/visual-system/spec.md.',
          },
        ],
      },
    },
  ],
};
