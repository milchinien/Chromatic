// Design-Tokens als TypeScript-Konstanten. Spiegelt 1:1 die CSS-Variablen
// aus styles.css und die Vorgaben aus plans/DESIGN_REFERENCE.md. Dient als
// einzige Quelle der Wahrheit für JS-Code (insb. das Canvas-Rendering im
// Combat — Canvas kennt keine CSS-Variablen).

export const COLORS_CSS = {
  bg: '#2a2219',
  bg2: '#322a1f',
  surface: '#3d3225',
  surface2: '#4a3d2c',
  surface3: '#5a4a34',
  line: '#5a4733',
  lineHi: '#8b6f47',
  lineSoft: '#3a2e22',

  ink: '#fbf3dc',
  inkDim: '#d8c39a',
  inkMute: '#9b8463',
  inkFaint: '#6b573d',

  gold: '#d6a955',
  goldHi: '#f0c878',
  goldDeep: '#8a6a2c',

  cNatur: '#6aa56a',
  cKrieg: '#c8553d',
  cStein: '#9a8f80',
  cUntot: '#9a6cb6',
  cFarblos: '#ead7a8',

  hp: '#6aa56a',
  hpBad: '#c8553d',
  mana: '#4a8cc8',
  xp: '#d6a955',
} as const;

export const FONTS = {
  display: "'Cinzel', serif",
  body: "'IBM Plex Sans', system-ui, sans-serif",
  mono: "'JetBrains Mono', monospace",
} as const;

import type { Color } from '../../domain/Card';

export const colorToCss = (c: Color): string => {
  switch (c) {
    case 'natur':
      return COLORS_CSS.cNatur;
    case 'krieg':
      return COLORS_CSS.cKrieg;
    case 'stein':
      return COLORS_CSS.cStein;
    case 'untot':
      return COLORS_CSS.cUntot;
    case 'farblos':
      return COLORS_CSS.cFarblos;
  }
};
