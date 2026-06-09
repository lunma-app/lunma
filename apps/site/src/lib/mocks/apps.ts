// Stand-in "favicons" for the sidebar/launcher mocks. Self-hosted, offline,
// dependency-free: a brand-coloured plate + the app's initial — enough to read
// as a real favicon row without fetching anything (matching the no-CDN ethos).
export interface FaviconSpec {
  letter: string;
  /** OKLCH hue for the favicon plate. */
  hue: number;
  /** OKLCH chroma; 0 for a neutral (grey) icon. Defaults to 0.14. */
  chroma?: number;
}

export const FAV = {
  figma: { letter: 'F', hue: 30 },
  linear: { letter: 'L', hue: 286 },
  docs: { letter: 'D', hue: 250 },
  github: { letter: 'G', hue: 0, chroma: 0 },
  calendar: { letter: 'C', hue: 22 },
  mail: { letter: 'M', hue: 245 },
  notes: { letter: 'N', hue: 62 },
  music: { letter: '♪', hue: 150 },
  maps: { letter: '◆', hue: 150 },
  shop: { letter: 'S', hue: 200 },
  reader: { letter: 'R', hue: 320 },
  cloud: { letter: 'C', hue: 230 },
} satisfies Record<string, FaviconSpec>;
