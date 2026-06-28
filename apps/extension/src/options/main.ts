import { mount } from 'svelte';
import { initLocale } from '../shared/i18n';
import { readSettings } from '../shared/settings';
import Options from './Options.svelte';

const target = document.getElementById('app');
if (!target) throw new Error('options: #app not found');

// Async boot so the locale is seeded BEFORE first paint (no English-then-locale
// flash). Unlike the sidebar/new-tab surfaces, options previously mounted
// synchronously and read settings in `onMount` (after first paint); seeding the
// Options locale pre-paint requires this small boot. `readSettings()` is awaited
// alongside `initLocale()` to warm the same storage read the component repeats.
async function boot(root: HTMLElement): Promise<void> {
  await Promise.all([readSettings(), initLocale()]);
  mount(Options, { target: root });
}

void boot(target);
