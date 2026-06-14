// Stand-in "favicons" for the sidebar/launcher mocks. Self-hosted, offline,
// no-CDN: a brand-coloured OKLCH plate with the app's brand glyph (from
// simple-icons, CC0-1.0, inlined at build time) for real apps, or the app's
// initial for generic mock content. No runtime fetch or icon font.
import {
  siFigma,
  siGithub,
  siGmail,
  siGooglecalendar,
  siGoogledocs,
  siGooglemaps,
  siGooglephotos,
  siLinear,
  siSpotify,
  siWhatsapp,
  siYoutubemusic,
} from 'simple-icons';

export interface FaviconSpec {
  letter: string;
  /** OKLCH hue for the favicon plate. */
  hue: number;
  /** OKLCH chroma; 0 for a neutral (grey) icon. Defaults to 0.14. */
  chroma?: number;
  /** 24×24 SVG path data (simple-icons); rendered instead of the letter. */
  path?: string;
}

export const FAV = {
  // Work / context tools — used by the per-Space tab rows in the demo.
  figma: { letter: 'F', hue: 30, path: siFigma.path },
  linear: { letter: 'L', hue: 286, path: siLinear.path },
  docs: { letter: 'D', hue: 250, path: siGoogledocs.path },
  github: { letter: 'G', hue: 0, chroma: 0, path: siGithub.path },
  calendar: { letter: 'C', hue: 22, path: siGooglecalendar.path },
  mail: { letter: 'M', hue: 245 },
  notes: { letter: 'N', hue: 62 },
  music: { letter: '♪', hue: 150 },
  maps: { letter: '◆', hue: 150 },
  shop: { letter: 'S', hue: 200 },
  reader: { letter: 'R', hue: 320 },
  cloud: { letter: 'C', hue: 230 },
  // Common consumer apps — the "my apps" set for the global favourites row
  // (brand glyphs on OKLCH plates, self-hosted; generic entries keep letters).
  whatsapp: { letter: 'W', hue: 155, path: siWhatsapp.path },
  gmail: { letter: 'M', hue: 25, path: siGmail.path },
  ytmusic: { letter: '▶', hue: 25, path: siYoutubemusic.path },
  spotify: { letter: 'S', hue: 150, path: siSpotify.path },
  gmaps: { letter: '◆', hue: 250, path: siGooglemaps.path },
  photos: { letter: 'P', hue: 200, path: siGooglephotos.path },
} satisfies Record<string, FaviconSpec>;
