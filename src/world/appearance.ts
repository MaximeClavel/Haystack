// Apparences des passants : tirages plausibles et variés selon un « rôle » (docker, vendeur, policier…),
// et règle anti-sosie (aucun passant ne doit ressembler à un personnage d'enquête).
import type {
  Accessory,
  BottomKind,
  Build,
  Color,
  FaceDetail,
  HairColor,
  HairStyle,
  Hat,
  Pattern,
  PersonAppearance,
  SkinTone,
  TopKind,
} from '../types';
import { hashString, Rng } from '../lib/rng';
import { appearanceDistance, SALIENT_KEYS } from './query';

export const COLORS: Color[] = ['red', 'blue', 'navy', 'green', 'olive', 'yellow', 'orange', 'pink', 'purple', 'brown', 'beige', 'black', 'white', 'grey'];
export const SKINS: SkinTone[] = ['pale', 'light', 'tan', 'brown', 'dark'];
export const HAIRS: HairStyle[] = ['bald', 'short', 'long', 'bun', 'ponytail', 'curly', 'spiky'];
export const HAIR_COLORS: HairColor[] = ['black', 'brown', 'blond', 'red', 'grey', 'white'];
export const HATS: Hat[] = ['none', 'cap', 'beret', 'bowler', 'tophat', 'beanie', 'fedora', 'helmet', 'chef', 'police', 'straw'];
export const TOPS: TopKind[] = ['tshirt', 'shirt', 'sweater', 'coat', 'suit', 'dress', 'apron', 'hoodie', 'uniform', 'overalls'];
export const BOTTOMS: BottomKind[] = ['trousers', 'shorts', 'skirt'];
export const PATTERNS: Pattern[] = ['plain', 'stripes', 'dots', 'checks'];
export const FACES: FaceDetail[] = ['none', 'glasses', 'sunglasses', 'mustache', 'beard', 'mask'];
export const ACCESSORIES: Accessory[] = ['none', 'handbag', 'briefcase', 'backpack', 'umbrella', 'cane', 'camera', 'newspaper', 'flowers', 'balloon', 'suitcase', 'scarf'];
export const BUILDS: Build[] = ['slim', 'regular', 'large', 'child'];

export type Role =
  | 'adult'
  | 'child'
  | 'elder'
  | 'business'
  | 'tourist'
  | 'traveler'
  | 'docker'
  | 'worker'
  | 'vendor'
  | 'police'
  | 'gardener'
  | 'musician'
  | 'nurse'
  | 'doctor'
  | 'chef'
  | 'jogger'
  | 'fisher'
  | 'mourner'
  | 'waiter'
  | 'student'
  | 'cyclist';

type W<T> = readonly (readonly [T, number])[];

const ADULT_HAIR: W<HairStyle> = [['bald', 7], ['short', 33], ['long', 18], ['bun', 10], ['ponytail', 10], ['curly', 14], ['spiky', 8]];
const ADULT_HAIR_COLOR: W<HairColor> = [['black', 25], ['brown', 32], ['blond', 16], ['red', 8], ['grey', 12], ['white', 7]];
const ADULT_HAT: W<Hat> = [['none', 64], ['cap', 8], ['beret', 7], ['bowler', 3], ['tophat', 1], ['beanie', 6], ['fedora', 5], ['straw', 5], ['helmet', 0.6]];
const ADULT_TOP: W<TopKind> = [['tshirt', 22], ['shirt', 18], ['sweater', 16], ['coat', 14], ['suit', 7], ['dress', 9], ['hoodie', 10], ['overalls', 1.5], ['apron', 0.6], ['uniform', 0.4]];
const PATTERN_W: W<Pattern> = [['plain', 62], ['stripes', 16], ['dots', 10], ['checks', 12]];
const BOTTOM_COLOR: W<Color> = [
  ['navy', 18], ['black', 14], ['grey', 12], ['brown', 10], ['beige', 10], ['blue', 12], ['olive', 5], ['white', 4],
  ['red', 3], ['green', 3], ['yellow', 1.5], ['orange', 1], ['pink', 1.5], ['purple', 1.5],
];
const TOP_COLOR: W<Color> = COLORS.map((c) => [c, c === 'white' || c === 'grey' || c === 'navy' || c === 'black' ? 9 : 7] as const);
const ADULT_FACE: W<FaceDetail> = [['none', 64], ['glasses', 15], ['sunglasses', 7], ['mustache', 6], ['beard', 8], ['mask', 0.15]];
const ADULT_ACC: W<Accessory> = [
  ['none', 40], ['handbag', 12], ['briefcase', 5], ['backpack', 10], ['umbrella', 5], ['cane', 2], ['camera', 3],
  ['newspaper', 6], ['flowers', 2], ['balloon', 0.8], ['suitcase', 1.5], ['scarf', 11],
];

/** Apparence aléatoire plausible pour un rôle donné. */
export function randomAppearance(rng: Rng, role: Role = 'adult'): PersonAppearance {
  const child = role === 'child';
  const elder = role === 'elder';
  const a: PersonAppearance = {
    skin: rng.pick(SKINS),
    hair: rng.weighted(ADULT_HAIR),
    hairColor: rng.weighted(ADULT_HAIR_COLOR),
    hat: rng.weighted(ADULT_HAT),
    top: rng.weighted(ADULT_TOP),
    topColor: rng.weighted(TOP_COLOR),
    topPattern: rng.weighted(PATTERN_W),
    bottom: rng.weighted<BottomKind>([['trousers', 68], ['shorts', 14], ['skirt', 18]]),
    bottomColor: rng.weighted(BOTTOM_COLOR),
    face: rng.weighted(ADULT_FACE),
    accessory: rng.weighted(ADULT_ACC),
    build: rng.weighted<Build>([['slim', 30], ['regular', 45], ['large', 25]]),
  };
  if (child) {
    a.build = 'child';
    a.hair = rng.weighted<HairStyle>([['short', 30], ['long', 18], ['ponytail', 18], ['curly', 16], ['spiky', 14], ['bun', 4]]);
    a.hairColor = rng.weighted<HairColor>([['black', 28], ['brown', 34], ['blond', 26], ['red', 12]]);
    a.hat = rng.weighted<Hat>([['none', 62], ['cap', 18], ['beanie', 10], ['straw', 6], ['beret', 4]]);
    a.top = rng.weighted<TopKind>([['tshirt', 36], ['sweater', 18], ['hoodie', 18], ['dress', 14], ['overalls', 8], ['shirt', 6]]);
    a.bottom = rng.weighted<BottomKind>([['shorts', 45], ['trousers', 40], ['skirt', 15]]);
    a.face = rng.weighted<FaceDetail>([['none', 90], ['glasses', 8], ['sunglasses', 2]]);
    a.accessory = rng.weighted<Accessory>([['none', 52], ['backpack', 22], ['balloon', 16], ['scarf', 6], ['camera', 2], ['flowers', 2]]);
  }
  if (elder) {
    a.hair = rng.weighted<HairStyle>([['bald', 30], ['short', 35], ['bun', 20], ['curly', 10], ['long', 5]]);
    a.hairColor = rng.weighted<HairColor>([['grey', 50], ['white', 45], ['brown', 5]]);
    a.hat = rng.weighted<Hat>([['none', 40], ['beret', 20], ['bowler', 10], ['fedora', 12], ['straw', 8], ['tophat', 2], ['beanie', 8]]);
    a.top = rng.weighted<TopKind>([['coat', 34], ['suit', 18], ['sweater', 24], ['shirt', 14], ['dress', 10]]);
    a.accessory = rng.weighted<Accessory>([['cane', 30], ['none', 25], ['newspaper', 14], ['umbrella', 10], ['handbag', 12], ['scarf', 9]]);
    a.face = rng.weighted<FaceDetail>([['glasses', 40], ['none', 30], ['mustache', 15], ['beard', 15]]);
  }
  switch (role) {
    case 'business':
      a.top = 'suit';
      a.topPattern = rng.chance(0.8) ? 'plain' : 'stripes';
      a.topColor = rng.pick<Color>(['navy', 'grey', 'black', 'brown', 'beige', 'blue']);
      a.accessory = rng.weighted<Accessory>([['briefcase', 55], ['newspaper', 15], ['umbrella', 12], ['none', 18]]);
      a.hat = rng.weighted<Hat>([['none', 70], ['bowler', 12], ['fedora', 14], ['tophat', 4]]);
      a.bottom = rng.chance(0.75) ? 'trousers' : 'skirt';
      break;
    case 'tourist':
      a.accessory = rng.weighted<Accessory>([['camera', 50], ['backpack', 30], ['handbag', 10], ['none', 10]]);
      a.hat = rng.weighted<Hat>([['none', 40], ['cap', 25], ['straw', 25], ['beret', 10]]);
      a.top = rng.weighted<TopKind>([['tshirt', 50], ['shirt', 35], ['hoodie', 15]]);
      if (rng.chance(0.4)) a.bottom = 'shorts';
      if (rng.chance(0.3)) a.face = 'sunglasses';
      break;
    case 'traveler':
      a.accessory = rng.weighted<Accessory>([['suitcase', 70], ['backpack', 20], ['handbag', 10]]);
      if (rng.chance(0.4)) a.top = 'coat';
      break;
    case 'docker':
      a.hat = rng.weighted<Hat>([['helmet', 55], ['beanie', 25], ['cap', 20]]);
      a.top = rng.weighted<TopKind>([['overalls', 60], ['sweater', 25], ['tshirt', 15]]);
      a.topColor = rng.pick<Color>(['blue', 'navy', 'orange', 'yellow', 'olive', 'grey', 'red']);
      a.bottom = 'trousers';
      a.bottomColor = rng.pick<Color>(['navy', 'blue', 'brown', 'grey', 'olive']);
      a.accessory = 'none';
      if (a.top === 'sweater' && rng.chance(0.5)) a.topPattern = 'stripes';
      if (a.build === 'slim' && rng.chance(0.5)) a.build = 'large';
      break;
    case 'worker':
      a.hat = rng.chance(0.92) ? 'helmet' : 'cap';
      a.top = rng.weighted<TopKind>([['overalls', 50], ['tshirt', 35], ['sweater', 15]]);
      a.topColor = rng.pick<Color>(['orange', 'yellow', 'blue', 'white', 'grey']);
      a.topPattern = 'plain';
      a.bottom = 'trousers';
      a.bottomColor = rng.pick<Color>(['blue', 'navy', 'grey', 'brown']);
      a.accessory = 'none';
      break;
    case 'vendor':
      a.top = rng.chance(0.85) ? 'apron' : 'shirt';
      a.topColor = rng.pick<Color>(['white', 'blue', 'green', 'red', 'beige', 'brown']);
      a.topPattern = rng.weighted<Pattern>([['plain', 50], ['stripes', 40], ['checks', 10]]);
      a.hat = rng.weighted<Hat>([['none', 40], ['cap', 20], ['beret', 20], ['straw', 15], ['chef', 5]]);
      a.accessory = 'none';
      if (a.bottom === 'skirt' && rng.chance(0.5)) a.bottom = 'trousers';
      break;
    case 'police':
      a.hat = 'police';
      a.top = 'uniform';
      a.topColor = rng.chance(0.8) ? 'navy' : 'blue';
      a.topPattern = 'plain';
      a.bottom = 'trousers';
      a.bottomColor = 'navy';
      a.accessory = 'none';
      a.face = rng.weighted<FaceDetail>([['none', 60], ['mustache', 20], ['glasses', 10], ['sunglasses', 10]]);
      if (a.build === 'child') a.build = 'regular';
      break;
    case 'gardener':
      a.hat = rng.weighted<Hat>([['straw', 60], ['cap', 20], ['beanie', 10], ['none', 10]]);
      a.top = rng.weighted<TopKind>([['overalls', 45], ['shirt', 30], ['sweater', 15], ['tshirt', 10]]);
      a.topColor = rng.pick<Color>(['green', 'olive', 'blue', 'brown', 'beige', 'white']);
      a.bottom = 'trousers';
      a.bottomColor = rng.pick<Color>(['brown', 'olive', 'blue', 'beige']);
      a.accessory = 'none';
      break;
    case 'musician':
      a.hat = rng.weighted<Hat>([['fedora', 25], ['bowler', 20], ['beret', 20], ['tophat', 15], ['none', 20]]);
      a.top = rng.weighted<TopKind>([['uniform', 40], ['suit', 30], ['shirt', 20], ['coat', 10]]);
      a.topColor = rng.pick<Color>(['red', 'navy', 'black', 'purple', 'green']);
      a.accessory = 'none';
      break;
    case 'nurse':
      a.top = 'uniform';
      a.topColor = rng.chance(0.6) ? 'white' : 'blue';
      a.topPattern = 'plain';
      a.hat = 'none';
      a.face = rng.chance(0.55) ? 'mask' : 'none';
      a.accessory = 'none';
      a.bottomColor = a.topColor;
      a.bottom = 'trousers';
      break;
    case 'doctor':
      a.top = 'coat';
      a.topColor = 'white';
      a.topPattern = 'plain';
      a.hat = 'none';
      a.face = rng.weighted<FaceDetail>([['glasses', 50], ['none', 25], ['mask', 15], ['beard', 10]]);
      a.accessory = rng.chance(0.3) ? 'briefcase' : 'none';
      break;
    case 'chef':
      a.hat = 'chef';
      a.top = 'apron';
      a.topColor = 'white';
      a.topPattern = 'plain';
      a.accessory = 'none';
      break;
    case 'jogger':
      a.top = rng.chance(0.6) ? 'tshirt' : 'hoodie';
      a.bottom = 'shorts';
      a.hat = rng.weighted<Hat>([['none', 60], ['cap', 35], ['beanie', 5]]);
      a.accessory = 'none';
      if (a.build === 'large' && rng.chance(0.6)) a.build = 'slim';
      break;
    case 'fisher':
      a.hat = rng.weighted<Hat>([['beanie', 35], ['straw', 25], ['cap', 25], ['fedora', 15]]);
      a.top = rng.weighted<TopKind>([['coat', 30], ['sweater', 35], ['overalls', 25], ['hoodie', 10]]);
      a.bottom = 'trousers';
      a.accessory = 'none';
      break;
    case 'mourner':
      a.top = rng.chance(0.6) ? 'coat' : 'suit';
      a.topColor = rng.pick<Color>(['black', 'grey', 'navy', 'brown']);
      a.topPattern = 'plain';
      a.accessory = rng.weighted<Accessory>([['flowers', 55], ['umbrella', 20], ['handbag', 15], ['none', 10]]);
      break;
    case 'waiter':
      a.top = rng.chance(0.6) ? 'shirt' : 'apron';
      a.topColor = rng.chance(0.6) ? 'white' : 'black';
      a.topPattern = 'plain';
      a.bottom = 'trousers';
      a.bottomColor = 'black';
      a.hat = 'none';
      a.accessory = 'none';
      break;
    case 'student':
      a.accessory = rng.weighted<Accessory>([['backpack', 60], ['newspaper', 10], ['none', 20], ['scarf', 10]]);
      a.top = rng.weighted<TopKind>([['hoodie', 35], ['tshirt', 30], ['sweater', 20], ['shirt', 15]]);
      if (a.hairColor === 'white' || a.hairColor === 'grey') a.hairColor = 'brown';
      break;
    case 'cyclist':
      a.hat = rng.chance(0.5) ? 'helmet' : rng.pick<Hat>(['cap', 'none', 'beret']);
      a.accessory = rng.chance(0.4) ? 'backpack' : 'none';
      break;
    default:
      break;
  }
  if (a.top === 'dress') {
    a.bottom = 'skirt';
    if (a.hair === 'bald') a.hair = 'bun';
  }
  if (a.hair === 'bald' && (a.hat === 'none' || rng.chance(0.5))) {
    // Les chauves gardent une couleur « de sourcils » neutre.
    if (a.hairColor === 'red' || a.hairColor === 'blond') a.hairColor = 'grey';
  }
  return a;
}

/** Personnage de référence pour la règle anti-sosie. */
export interface Signature {
  id: string;
  appearance: PersonAppearance;
}

const ALT: { [K in (typeof SALIENT_KEYS)[number]]: readonly PersonAppearance[K][] } = {
  hat: HATS.filter((h) => h !== 'police' && h !== 'chef'),
  top: TOPS.filter((t) => t !== 'uniform' && t !== 'apron'),
  topColor: COLORS,
  topPattern: PATTERNS,
  accessory: ACCESSORIES,
  hair: HAIRS,
  hairColor: HAIR_COLORS,
  bottomColor: COLORS,
  face: FACES.filter((f) => f !== 'mask'),
};

/** Ordre des attributs modifiés : d'abord ce qui se voit le plus (couleur du haut, chapeau…). */
const CHANGE_ORDER: (typeof SALIENT_KEYS)[number][] = ['topColor', 'hat', 'accessory', 'topPattern', 'bottomColor', 'top', 'face', 'hairColor', 'hair'];

/** Distance minimale exigée entre un passant et un personnage scénarisé. */
export const MIN_SOSIE_DISTANCE = 3;

/**
 * Règle anti-sosie : si l'apparence diffère de moins de 3 attributs saillants d'un personnage,
 * on la modifie de façon déterministe (graine = id du passant). Renvoie null si rien à changer.
 */
export function deSosie(id: string, a: PersonAppearance, refs: readonly Signature[]): PersonAppearance | null {
  if (refs.length === 0) return null;
  let culprit = refs.find((r) => appearanceDistance(a, r.appearance) < MIN_SOSIE_DISTANCE);
  if (!culprit) return null;
  const rng = new Rng(hashString(`sosie:${id}`));
  const out: PersonAppearance = { ...a };
  let guard = 0;
  while (culprit && guard++ < 40) {
    const target = culprit.appearance;
    // Change le premier attribut identique à celui du personnage, vers une valeur différente de tous.
    const key = CHANGE_ORDER.find((k) => out[k] === target[k]) ?? CHANGE_ORDER[guard % CHANGE_ORDER.length];
    const options = (ALT[key] as readonly string[]).filter(
      (v) => v !== target[key] && !refs.some((r) => r.appearance[key] === v && appearanceDistance(out, r.appearance) < MIN_SOSIE_DISTANCE + 1),
    );
    const pool = options.length ? options : (ALT[key] as readonly string[]).filter((v) => v !== target[key]);
    (out as unknown as Record<string, string>)[key] = rng.pick(pool);
    if (out.top === 'dress') out.bottom = 'skirt';
    culprit = refs.find((r) => appearanceDistance(out, r.appearance) < MIN_SOSIE_DISTANCE);
  }
  return out;
}
