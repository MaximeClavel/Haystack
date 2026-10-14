// Palette de Meulebourg : papier crème, encre brun-noir, aplats légèrement désaturés.
//
// Toutes les couleurs sont calculées une seule fois au chargement du module (chaînes CSS prêtes
// à l'emploi) : aucune conversion de couleur pendant le dessin.

import type { Color, HairColor, SkinTone } from '../types';

/** Fond papier (le moteur remplit chaque tuile avec cette couleur avant le sol). */
export const PAPER = '#f3ecdc';
/** Encre des contours (brun-noir chaud). */
export const INK = '#2f2622';
/** Encre adoucie (détails fins, contours secondaires). */
export const INK_SOFT = '#5a4a40';
/** Ombre portée au sol (ellipse translucide). */
export const SHADOW = 'rgba(70, 48, 30, 0.2)';
/** Ombre plus légère (sous les grands objets, auvents). */
export const SHADOW_LIGHT = 'rgba(70, 48, 30, 0.12)';

/**
 * Les 14 couleurs du vocabulaire (vêtements, véhicules, auvents…).
 * Choisies pour rester distinguables deux à deux au zoom 1,5 (voir palette.test.ts) :
 * navy / blue / purple, olive / green / brown, beige / white / yellow, red / orange / pink.
 */
export const COLOR_HEX: Record<Color, string> = {
  red: '#cc4238',
  orange: '#ec8b2f',
  yellow: '#f0cb3f',
  pink: '#f19bb8',
  purple: '#8d55ad',
  blue: '#4b92dc',
  navy: '#283f78',
  green: '#3f9e55',
  olive: '#9a9234',
  brown: '#8b5533',
  beige: '#d3bd92',
  black: '#33302f',
  white: '#faf8f2',
  grey: '#9c9fa3',
};

export const COLORS: readonly Color[] = Object.keys(COLOR_HEX) as Color[];

/** Noms français (galerie, aides). */
export const COLOR_NAME_FR: Record<Color, string> = {
  red: 'rouge',
  orange: 'orange',
  yellow: 'jaune',
  pink: 'rose',
  purple: 'violet',
  blue: 'bleu',
  navy: 'bleu marine',
  green: 'vert',
  olive: 'kaki',
  brown: 'marron',
  beige: 'beige',
  black: 'noir',
  white: 'blanc',
  grey: 'gris',
};

/* ----------------------------------------------------------------------------
 * Outils de couleur (utilisés uniquement à l'initialisation)
 * ------------------------------------------------------------------------- */

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function toHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

/** Mélange linéaire de deux couleurs hexadécimales (t = 0 → a, t = 1 → b). */
export function mix(a: string, b: string, t: number): string {
  const [r1, g1, b1] = parseHex(a);
  const [r2, g2, b2] = parseHex(b);
  return toHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}

/** Version translucide d'une couleur hexadécimale. */
export function alpha(hex: string, a: number): string {
  const [r, g, b] = parseHex(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/** Luminance relative approximative (0 = noir, 1 = blanc). */
export function luminance(hex: string): number {
  const [r, g, b] = parseHex(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function mapColors(f: (c: Color, hex: string) => string): Record<Color, string> {
  const out = {} as Record<Color, string>;
  for (const c of COLORS) out[c] = f(c, COLOR_HEX[c]);
  return out;
}

/** Teinte ombrée (plis, côtés à l'ombre, détails). */
export const COLOR_DARK = mapColors((c, h) => (c === 'black' ? '#1f1c1b' : mix(h, INK, c === 'white' ? 0.18 : 0.28)));
/** Teinte éclairée (reflets). */
export const COLOR_LIGHT = mapColors((c, h) => (c === 'white' ? '#ffffff' : mix(h, '#ffffff', 0.35)));
/** Couleur de contraste pour les motifs (rayures, pois) : crème sur fond foncé, marine sur fond clair. */
export const PATTERN_INK = mapColors((_c, h) => (luminance(h) > 0.62 ? '#33466e' : '#f7f2e6'));

/** Murs : versions plus douces (crépi, pierre peinte). */
export const WALL_HEX: Record<Color, string> = {
  ...mapColors((_c, h) => mix(h, PAPER, 0.32)),
  white: '#f6f1e6',
  beige: '#e4d1ab',
  grey: '#c3c1bb',
  black: '#5d5651',
  navy: '#536690',
  yellow: '#f0d77e',
  brown: '#b07d5c',
};
export const WALL_DARK = mapColors((c) => mix(WALL_HEX[c], INK, 0.22));
export const WALL_LIGHT = mapColors((c) => mix(WALL_HEX[c], '#ffffff', 0.3));

/** Toitures : terre cuite, ardoise, zinc, cuivre vert-de-gris… */
export const ROOF_HEX: Record<Color, string> = {
  ...mapColors((_c, h) => mix(h, INK, 0.12)),
  red: '#bd5d40',
  orange: '#cf7a45',
  brown: '#87563a',
  grey: '#8d939b',
  navy: '#4d5b7c',
  black: '#4a4542',
  green: '#5f9178',
  blue: '#5f84ad',
  white: '#d9d6cf',
  beige: '#c2ab84',
};
export const ROOF_DARK = mapColors((c) => mix(ROOF_HEX[c], INK, 0.25));
export const ROOF_LIGHT = mapColors((c) => mix(ROOF_HEX[c], '#ffffff', 0.18));

/** Teintes de peau. */
export const SKIN_HEX: Record<SkinTone, string> = {
  pale: '#f8e0cd',
  light: '#efc6a1',
  tan: '#d39b6b',
  brown: '#a76b48',
  dark: '#6e4632',
};
export const SKIN_DARK: Record<SkinTone, string> = {
  pale: mix(SKIN_HEX.pale, INK, 0.2),
  light: mix(SKIN_HEX.light, INK, 0.2),
  tan: mix(SKIN_HEX.tan, INK, 0.2),
  brown: mix(SKIN_HEX.brown, INK, 0.2),
  dark: mix(SKIN_HEX.dark, INK, 0.2),
};

/** Couleurs de cheveux. */
export const HAIR_HEX: Record<HairColor, string> = {
  black: '#2b2421',
  brown: '#714529',
  blond: '#e6c25f',
  red: '#c65a26',
  grey: '#9d9890',
  white: '#f1ede5',
};
export const HAIR_DARK: Record<HairColor, string> = {
  black: '#141110',
  brown: mix(HAIR_HEX.brown, INK, 0.3),
  blond: mix(HAIR_HEX.blond, INK, 0.3),
  red: mix(HAIR_HEX.red, INK, 0.3),
  grey: mix(HAIR_HEX.grey, INK, 0.3),
  white: mix(HAIR_HEX.white, INK, 0.25),
};

/** Couleurs « matières » fixes. */
export const MAT = {
  shoe: '#3a2e29',
  shoeLight: '#5b4a40',
  glass: '#a8c4cf',
  glassDark: '#86a6b4',
  glassLight: '#d7e7ec',
  windowFrame: '#f6f2e8',
  interior: '#4a3d37',
  litGlass: '#f7d77a',
  litGlassLight: '#fcefc0',
  wood: '#a8774f',
  woodDark: '#7c5536',
  woodLight: '#c99a6c',
  metal: '#9aa0a4',
  metalDark: '#5f666b',
  metalLight: '#cfd4d6',
  iron: '#3c3f42',
  gold: '#e3b23c',
  goldDark: '#a77a1e',
  goldLight: '#f7de8b',
  silver: '#d9dee2',
  stone: '#cfc6b4',
  stoneDark: '#a99e88',
  stoneLight: '#e6dfcf',
  brick: '#b5603f',
  brickDark: '#8c4630',
  foliage: '#79a957',
  foliageDark: '#557f3e',
  foliageLight: '#9cc472',
  pine: '#3f7650',
  pineDark: '#2c5a3b',
  pineLight: '#5b9268',
  trunk: '#7d5a40',
  trunkDark: '#5a3f2d',
  water: '#a7cad6',
  waterDark: '#86b0c0',
  waterLight: '#d6e9ee',
  paper: '#fbf7ec',
  paperLine: '#b9ae9c',
  cardboard: '#c99d63',
  cardboardDark: '#a07843',
  straw: '#e7cd78',
  strawDark: '#c3a654',
  cream: '#f7f0dd',
  white: '#fbf9f4',
  red: '#cc4238',
  redDark: '#9b2f28',
  blueLight: '#4fa3e8',
  policeBlue: '#2b4f9e',
  lamp: '#fff3c4',
  tire: '#2c2725',
  asphalt: '#bab4a8',
};

/** Couleur des chapeaux (fixe par type, pour que « la casquette rouge » soit dessinable). */
export const HAT_HEX = {
  cap: '#cc4238',
  beret: '#7d2d40',
  bowler: '#2f2b2a',
  tophat: '#2a2726',
  beanie: '#ec8b2f',
  fedora: '#7b6551',
  helmet: '#f2c234',
  chef: '#fbf9f4',
  police: '#283f78',
  straw: '#e7cd78',
} as const;
