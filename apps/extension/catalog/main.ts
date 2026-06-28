// The catalog's dual-typeface brand system + atmosphere recipes come from the
// CSS-only @lunma/tokens package — exactly as the extension surfaces import them
// (App.svelte, NewTab.svelte). No TS edge to ui/; this is a stylesheet import.
import '@lunma/tokens/tokens.css';
import '@lunma/tokens/fonts.css';
import '@lunma/tokens/recipes.css';
import './catalog.css';
import { mount } from 'svelte';
import Catalog from './Catalog.svelte';

const target = document.getElementById('app');
if (!target) throw new Error('catalog: #app mount target is missing');

mount(Catalog, { target });
