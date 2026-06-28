#!/usr/bin/env node
// PostToolUse(Edit|Write|MultiEdit) advisory nudge (component-catalog D7, layer
// 2): when a `apps/extension/src/ui/<Name>.svelte` PRIMITIVE is added or edited
// and no sibling `apps/extension/catalog/stories/ui/<Name>.stories.svelte`
// exists, exit 2 with a message prompting the author to add/update the story.
// Advisory only — the vitest coverage guard (stories-coverage.test.ts) remains
// the authoritative `verify`/CI gate. Reads the hook JSON from stdin.
import { existsSync } from 'node:fs';

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', () => resolve(data));
  });
}

const raw = await readStdin();
let filePath = '';
try {
  filePath = JSON.parse(raw)?.tool_input?.file_path ?? '';
} catch {
  process.exit(0); // Malformed payload — nothing to advise on.
}

// Only `apps/extension/src/ui/<Name>.svelte` primitives, excluding `*.test.*`
// fixtures (the `*.test.harness.svelte` set and any future `*.test.svelte`).
const match = filePath.match(/(.*\/apps\/extension)\/src\/ui\/([^/]+)\.svelte$/);
if (!match) process.exit(0);

const [, extensionRoot, name] = match;
if (name.includes('.test.')) process.exit(0);

const storyPath = `${extensionRoot}/catalog/stories/ui/${name}.stories.svelte`;
if (existsSync(storyPath)) process.exit(0);

process.stderr.write(
  `Catalog coverage: '${name}' is a src/ui primitive with no catalog story. ` +
    `Add or update apps/extension/catalog/stories/ui/${name}.stories.svelte in this ` +
    `change (the stories-coverage.test.ts gate will otherwise fail pnpm verify).\n`,
);
process.exit(2);
