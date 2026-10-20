// Bas (short, pantalon, jupe) caché par un vêtement du haut : règle partagée par check.ts (alerte quand un texte
// d'enquête cite la couleur d'un bas qu'on ne voit pas) et gen.ts (marque « masqué » dans les signes distinctifs).
//
// Mesuré sur le dessin (src/art/person.ts, src/art/skeleton.ts : garmentKinds, legsFill, topOverlayShape) :
//   - tablier, manteau, robe couvrent le bassin et les cuisses jusqu'au genou (tablier, robe) ou sous le genou
//     (manteau) : un SHORT n'apparaît plus (au plus un liseré de quelques pixels) ;
//   - une JUPE sous un manteau n'est pas dessinée du tout ; sous un tablier ou une robe, seul son bord dépasse ;
//   - un PANTALON reste visible du genou (tablier, robe) ou du mollet (manteau) aux chevilles ;
//   - la salopette ne cache rien du bas (sa bavette ne couvre que le buste).
// Module pur (aucune dépendance au monde ni au DOM).
import type { BottomKind, CaseDef, Color, PersonAppearance, PersonEntity, TopKind } from '../../src/types';

/** `total` : la couleur du bas n'est plus visible ; `partial` : seule une partie (bas des jambes, bord de jupe) dépasse. */
export type Hiding = 'total' | 'partial';

const COVERING_TOPS: TopKind[] = ['apron', 'coat', 'dress'];

export function bottomHiding(top: TopKind, bottom: BottomKind): Hiding | null {
  if (!COVERING_TOPS.includes(top)) return null;
  if (bottom === 'shorts') return 'total';
  if (bottom === 'skirt') return top === 'coat' ? 'total' : 'partial';
  return 'partial';
}

/** « le manteau », « la robe »… (pour « masqué par … », « sous … »). */
export const COVER_NAME: Partial<Record<TopKind, string>> = { apron: 'le tablier', coat: 'le manteau', dress: 'la robe' };
const COVER_NOUN: Partial<Record<TopKind, string>> = { apron: 'tablier', coat: 'manteau', dress: 'robe' };

/** « masqué par le tablier » / « en partie masqué par le manteau », ou null si le bas se voit. */
export function hidingLabel(a: Pick<PersonAppearance, 'top' | 'bottom'>): string | null {
  const h = bottomHiding(a.top, a.bottom);
  if (!h) return null;
  return `${h === 'total' ? 'masqué' : 'en partie masqué'} par ${COVER_NAME[a.top]}`;
}

/* ------------------------------------------------------------------ citations dans les textes */

const BOTTOM_OF_WORD: [RegExp, BottomKind][] = [
  [/^(short|bermuda)/, 'shorts'],
  [/^(pantalon|jean)/, 'trousers'],
  [/^jupe/, 'skirt'],
];

function colorOfWord(w: string): Color | null {
  if (/^bleu\s+(marine|nuit|fonc)|^marine/.test(w)) return 'navy';
  const table: [RegExp, Color][] = [
    [/^bleu/, 'blue'],
    [/^rouge/, 'red'],
    [/^vert/, 'green'],
    [/^(olive|kaki)/, 'olive'],
    [/^jaune/, 'yellow'],
    [/^orange/, 'orange'],
    [/^rose/, 'pink'],
    [/^(violet|mauve)/, 'purple'],
    [/^(marron|brun)/, 'brown'],
    [/^beige/, 'beige'],
    [/^noir/, 'black'],
    [/^blanc/, 'white'],
    [/^gris/, 'grey'],
  ];
  return table.find(([re]) => re.test(w))?.[1] ?? null;
}

// « short rouge », « pantalon NOIR », « jupe verte », « bermuda de couleur beige », « pantalon long orange »…
const CITATION = new RegExp(
  '\\b(shorts?|bermudas?|pantalons?|jeans?|jupes?)\\s+' +
    '(?:(?:de couleur|en)\\s+)?' +
    '(?:(?:long|court|large|serré|clair|foncé|vif)e?s?\\s+)?' +
    '(bleu\\s+(?:marine|nuit|foncé)|marine|rouge|bleu|vert|olive|kaki|jaune|orange|rose|violet|mauve|marron|brun|beige|noir|blanc|gris)' +
    '(?:e|s|es|te|tes|he|hes|che|ches)?(?![\\p{L}])',
  'giu',
);

export interface BottomCitation {
  /** Texte cité, tel qu'écrit (« short rouge »). */
  quote: string;
  bottom: BottomKind;
  color: Color;
  /** Phrase qui contient la citation (pour repérer qu'elle reconnaît elle-même que le bas est caché). */
  sentence: string;
}

/** Toutes les couleurs de bas citées dans un texte. */
export function bottomCitations(text: string): BottomCitation[] {
  const out: BottomCitation[] = [];
  for (const m of text.matchAll(CITATION)) {
    const bottom = BOTTOM_OF_WORD.find(([re]) => re.test(m[1].toLowerCase()))?.[1];
    const color = colorOfWord(m[2].toLowerCase());
    if (!bottom || !color) continue;
    const at = m.index ?? 0;
    const start = Math.max(0, ...['.', '!', '?', '…', '\n'].map((c) => text.lastIndexOf(c, at - 1) + 1));
    const ends = ['.', '!', '?', '…', '\n'].map((c) => text.indexOf(c, at + m[0].length)).filter((i) => i >= 0);
    const end = ends.length ? Math.min(...ends) + 1 : text.length;
    out.push({ quote: m[0], bottom, color, sentence: text.slice(start, end) });
  }
  return out;
}

/** La phrase dit-elle elle-même que le bas est caché ou dépasse (« qui dépasse du manteau », « caché sous le tablier ») ? */
const ACKNOWLEDGES = /d[ée]pass|chevill|cach[ée]|masqu|invisible|à peine|sous (?:le |la |l[’']|son |sa |ce |cette |un |une )?(?:tablier|manteau|robe)/i;

export interface PersonRef {
  id: string;
  appearance: PersonAppearance;
}

/** Ce qu'il faut d'une enquête pour retrouver ses personnes (un CaseDef complet, ou un extrait dans l'autotest). */
export type CasePeopleSource = Pick<CaseDef, 'characters' | 'entities'>;

/**
 * Apparence DESSINÉE d'une personne d'enquête. Le monde remplace celle d'une entité qui a un `character` par celle du
 * personnage (src/world/story.ts, integrateCases) : seule une entité sans personnage garde la sienne. Aucun validateur
 * n'impose l'égalité des deux, c'est donc celle du personnage qui fait foi (un personnage inconnu ne remplace rien,
 * comme dans le monde).
 */
export function drawnAppearance(c: CasePeopleSource, e: PersonEntity): PersonAppearance {
  const ch = e.character ? c.characters.find((x) => x.id === e.character) : undefined;
  return ch ? ch.appearance : e.appearance;
}

/** Les personnes d'une enquête telles qu'on les voit : ses personnages, puis ses figurants (personnes sans personnage). */
export function casePeople(c: CasePeopleSource): PersonRef[] {
  return [
    ...c.characters.map((ch) => ({ id: ch.id, appearance: ch.appearance })),
    ...c.entities.filter((e): e is PersonEntity => e.kind === 'person' && !e.character).map((e) => ({ id: e.id, appearance: e.appearance })),
  ];
}

/** Les personnes que désignent des ids d'entités (cibles d'une étape, cible d'une fausse piste), avec l'apparence dessinée. */
export function entityPeople(c: CasePeopleSource, ids: readonly string[]): PersonRef[] {
  return ids.flatMap((id) => {
    const e = c.entities.find((x) => x.id === id);
    return e && e.kind === 'person' ? [{ id: e.id, appearance: drawnAppearance(c, e) }] : [];
  });
}

export interface HiddenBottomAlert {
  quote: string;
  level: Hiding;
  /** Personnages de l'enquête qui portent ce bas, tous cachés. */
  holders: PersonRef[];
}

/**
 * Alertes d'un texte : il cite la couleur d'un bas que PERSONNE de l'enquête ne porte à découvert (si l'un des porteurs
 * a le bas visible, la citation peut le désigner : pas d'alerte), et dont la phrase ne reconnaît pas qu'il est caché.
 * `level` = `total` si tous les porteurs le cachent entièrement, sinon `partial`.
 *
 * `subjects` (facultatif) : les personnes dont parle le texte (cibles de l'étape pour sa question, ses indices et sa
 * réussite ; cible de la fausse piste pour son message). Si l'une d'elles porte le bas cité, c'est d'elle qu'il s'agit :
 * l'alerte est jugée sur elles seules, même si un autre personnage de l'enquête porte le même bas à découvert
 * (c05 : le « pantalon orange » du comédien en costume se voit, celui de la comédienne sous le manteau beaucoup moins).
 */
export function hiddenBottomAlerts(text: string, people: PersonRef[], subjects: PersonRef[] = []): HiddenBottomAlert[] {
  const alerts: HiddenBottomAlert[] = [];
  const seen = new Set<string>();
  for (const c of bottomCitations(text)) {
    const wears = (p: PersonRef): boolean => p.appearance.bottom === c.bottom && p.appearance.bottomColor === c.color;
    const aboutSubjects = subjects.filter(wears);
    const holders = aboutSubjects.length ? aboutSubjects : people.filter(wears);
    if (holders.length === 0) continue;
    const levels = holders.map((p) => bottomHiding(p.appearance.top, p.appearance.bottom));
    if (levels.some((l) => l === null)) continue;
    if (ACKNOWLEDGES.test(c.sentence)) continue;
    const key = c.quote.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    alerts.push({ quote: c.quote, level: levels.every((l) => l === 'total') ? 'total' : 'partial', holders });
  }
  return alerts;
}

/** Message d'alerte (sans préfixe d'enquête). */
export function describeAlert(a: HiddenBottomAlert): string {
  const who = a.holders.map((h) => `${h.id} : ${COVER_NOUN[h.appearance.top]}`).join(', ');
  return a.level === 'total'
    ? `« ${a.quote} » : ce bas est entièrement caché à l'écran (${who}) ; citez un signe visible (haut, chapeau, accessoire)`
    : `« ${a.quote} » : ce bas n'est visible qu'en partie (${who}) ; dites-le (« qui dépasse du… ») ou citez un autre signe`;
}

/* ------------------------------------------------------------------ autotest de la règle */

/** Cas d'école vérifiés à chaque `content:check` : une règle qui se casse en silence ne signalerait plus rien. */
export function selfTest(): string[] {
  const person = (id: string, top: TopKind, bottom: BottomKind, bottomColor: Color): PersonRef => ({
    id,
    appearance: { skin: 'light', hair: 'short', hairColor: 'black', hat: 'none', top, topColor: 'white', topPattern: 'plain', bottom, bottomColor, face: 'none', accessory: 'none', build: 'regular' },
  });
  const fails: string[] = [];
  const expect = (label: string, got: unknown, want: unknown): void => {
    if (JSON.stringify(got) !== JSON.stringify(want)) fails.push(`autotest du bas masqué : ${label} (obtenu ${JSON.stringify(got)}, attendu ${JSON.stringify(want)})`);
  };
  const levels = (text: string, people: PersonRef[]): string[] => hiddenBottomAlerts(text, people).map((a) => `${a.quote}:${a.level}`);
  const livreur = person('x.livreur', 'apron', 'shorts', 'red');
  expect('short rouge sous un tablier', levels('Tablier blanc, short rouge, casquette.', [livreur]), ['short rouge:total']);
  expect('casse, pluriel et accord', levels('Des SHORTS Rouges.', [livreur]), ['SHORTS Rouges:total']);
  expect('jupe verte sous un manteau', levels('Une jupe verte.', [person('x.zita', 'coat', 'skirt', 'green')]), ['jupe verte:total']);
  expect('pantalon orange sous un manteau', levels('Un pantalon orange.', [person('x.p', 'coat', 'trousers', 'orange')]), ['pantalon orange:partial']);
  expect('pantalon bleu marine ≠ bleu', levels('Un pantalon bleu marine.', [person('x.p', 'coat', 'trousers', 'navy')]), ['pantalon bleu marine:partial']);
  expect('jupe blanche sous une robe', levels('Une jupe blanche.', [person('x.r', 'dress', 'skirt', 'white')]), ['jupe blanche:partial']);
  expect('le bas est visible (salopette)', levels('Un short orange.', [person('x.l', 'overalls', 'shorts', 'orange')]), []);
  expect('le bas est visible (t-shirt)', levels('Un short rouge.', [person('x.t', 'tshirt', 'shorts', 'red')]), []);
  expect('un autre porteur le montre à découvert', levels('Un short rouge.', [livreur, person('x.t', 'tshirt', 'shorts', 'red')]), []);
  expect('personne ne porte ce bas', levels('Un short rouge.', [person('x.t', 'tshirt', 'trousers', 'red')]), []);
  expect('couleur d\'un autre bas', levels('Un pantalon rouge.', [livreur]), []);
  expect('la phrase reconnaît que le bas dépasse', levels('Pantalon orange qui dépasse du long manteau vert.', [person('x.p', 'coat', 'trousers', 'orange')]), []);
  expect('la reconnaissance ne vaut que pour sa phrase', levels('Il dépasse tout le monde. Pantalon orange.', [person('x.p', 'coat', 'trousers', 'orange')]), ['Pantalon orange:partial']);
  // Personnes dont parle le texte (cibles de l'étape) : c'est d'elles qu'il s'agit, même si un autre porteur montre le bas.
  const costume = person('x.costume', 'suit', 'trousers', 'orange');
  const manteau = person('x.manteau', 'coat', 'trousers', 'orange');
  const alertsAbout = (text: string, people: PersonRef[], subjects: PersonRef[]): string[] =>
    hiddenBottomAlerts(text, people, subjects).map((a) => `${a.quote}:${a.level}`);
  expect('la cible cache le bas, un autre porteur le montre', alertsAbout('Un pantalon orange.', [costume, manteau], [manteau]), ['pantalon orange:partial']);
  expect('la cible montre le bas', alertsAbout('Un pantalon orange.', [costume, manteau], [costume]), []);
  expect('la cible ne porte pas ce bas : on juge sur tous', alertsAbout('Un pantalon orange.', [costume, manteau], [livreur]), []);
  expect('la cible reconnaît que le bas dépasse', alertsAbout('Pantalon orange qui dépasse du manteau.', [costume, manteau], [manteau]), []);
  expect('« short » seul, sans couleur', levels('Il porte un short.', [livreur]), []);
  expect('couleur citée ailleurs que près du bas', levels('Un short et une casquette rouge.', [livreur]), []);

  // Entité et personnage qui divergent : le monde dessine le PERSONNAGE (story.ts), c'est sur lui que les cibles sont jugées.
  const enquete = (entityTop: TopKind, characterTop: TopKind): CasePeopleSource => ({
    characters: [{ id: 'x.perso', name: 'X', appearance: person('x.perso', characterTop, 'trousers', 'orange').appearance }],
    entities: [
      { id: 'x.perso.1', kind: 'person', x: 0, y: 0, pose: 'stand', facing: 'right', character: 'x.perso', appearance: person('x.e', entityTop, 'trousers', 'orange').appearance },
      { id: 'x.figurant', kind: 'person', x: 0, y: 0, pose: 'stand', facing: 'right', appearance: person('x.f', 'coat', 'shorts', 'red').appearance },
      { id: 'x.prop', kind: 'prop', x: 0, y: 0, prop: 'bin' },
    ],
  });
  const alertsOfTarget = (c: CasePeopleSource, text: string, ids: string[]): string[] =>
    hiddenBottomAlerts(text, casePeople(c), entityPeople(c, ids)).map((a) => `${a.quote}:${a.level}`);
  const cacheParLePersonnage = enquete('tshirt', 'coat');
  const montreParLePersonnage = enquete('coat', 'tshirt');
  expect('cible : l\'apparence est celle du personnage (manteau), pas celle de l\'entité (t-shirt)', alertsOfTarget(cacheParLePersonnage, 'Un pantalon orange.', ['x.perso.1']), ['pantalon orange:partial']);
  expect('cible : l\'entité cache le bas, le personnage le montre', alertsOfTarget(montreParLePersonnage, 'Un pantalon orange.', ['x.perso.1']), []);
  expect('cible : le personnage est ce que dessine le monde', entityPeople(cacheParLePersonnage, ['x.perso.1']).map((p) => p.appearance.top), ['coat']);
  expect('cible : une entité sans personnage garde sa propre apparence', entityPeople(cacheParLePersonnage, ['x.figurant']).map((p) => p.appearance.top), ['coat']);
  expect('cible : un personnage inconnu ne remplace rien', entityPeople({ characters: [], entities: cacheParLePersonnage.entities }, ['x.perso.1']).map((p) => p.appearance.top), ['tshirt']);
  expect('cible : une entité qui n\'est pas une personne, ou un id inconnu, n\'est pas une cible', entityPeople(cacheParLePersonnage, ['x.prop', 'x.absent']), []);
  expect('personnes de l\'enquête : personnages (leur apparence), puis figurants', casePeople(cacheParLePersonnage).map((p) => `${p.id}:${p.appearance.top}`), ['x.perso:coat', 'x.figurant:coat']);
  return fails;
}
