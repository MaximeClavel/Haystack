// Contrôle des enquêtes publiées (src/content/cases, registre CASES) contre la vraie ville.
// Usage : npx tsx tools/content/check.ts [--verbose]
//
// 1. validateAllCases (module game) : placements praticables, toits, zones d'indice, fils, ids…
// 2. Règles supplémentaires de la bible (docs/CONTENT.md § « Comment écrire une nouvelle enquête ») :
//    - hors chaussée (sauf véhicules) ; véhicules sur chaussée ou parking ; bateaux sur l'eau ;
//    - aucune entité de deux enquêtes différentes à moins de 80 u (ancre à ancre) ;
//    - personnages d'enquête : au moins 3 attributs saillants d'écart (sauf sosies déclarés
//      et personnages récurrents, qui doivent alors être identiques) ;
//    - aucun passant ambiant à moins de 3 attributs d'un personnage (règle anti-sosie du monde) ;
//    - rayon des zones d'indice entre 60 et 450 u ; caméra de départ proche de la première scène ;
//    - couleur d'un chapeau citée dans un texte : celle qu'on voit à l'écran ;
//    - couleur d'un bas (short, pantalon, jupe) citée dans un texte alors qu'un tablier, un manteau ou une robe le cache :
//      erreur si le bas est entièrement caché, note s'il n'en dépasse qu'une partie (voir tools/content/hidden.ts).
import type { Entity, PersonEntity, World } from '../../src/types';
import { buildWorld, appearanceDistance, groundAt, onCrosswalk, isHiddenByRoof } from '../../src/world';
import { validateAllCases } from '../../src/game/validate';
import { compareDrawOrder, getEntityBounds, getHitRect } from '../../src/art/bounds';
import { targetCenter } from '../../src/game/geometry';
import { CASES as DRAFT_CASES } from '../../src/content';
import { LOOKALIKES, RECURRING } from '../../src/content/meta';
import { describeAlert, hiddenBottomAlerts, selfTest as hiddenBottomSelfTest, type PersonRef } from './hidden';

const verbose = process.argv.includes('--verbose');
const t0 = Date.now();
const world: World = buildWorld({ cases: DRAFT_CASES });
const problems: string[] = [];
const notes: string[] = [];

// --- 1. Validateur officiel
problems.push(...validateAllCases(DRAFT_CASES, world));

// --- 2. Règles de la bible
const caseOf = new Map<string, string>();
for (const c of DRAFT_CASES) for (const e of c.entities) caseOf.set(e.id, c.id);

for (const c of DRAFT_CASES) {
  for (const e of c.entities) {
    const p = { x: e.x, y: e.y };
    const g = groundAt(world, p);
    const high = (e.z ?? 0) > 0 || (e.kind === 'person' && e.pose === 'window');
    if (e.kind === 'vehicle') {
      if (e.vehicle === 'boat') continue;
      if (e.vehicle !== 'bicycle' && e.vehicle !== 'scooter' && g !== 'road' && g !== 'parking') {
        problems.push(`[${c.id}] ${e.id} : véhicule hors chaussée (${g})`);
      }
    } else if (!high && e.kind !== 'building') {
      if (g === 'road' && !onCrosswalk(world, p)) problems.push(`[${c.id}] ${e.id} : sur la chaussée (${e.x}, ${e.y})`);
      if (g === 'railbed') problems.push(`[${c.id}] ${e.id} : sur le ballast`);
      // Le corps entier doit être visible (pas seulement les pieds) : on teste aussi le haut du corps.
      const r = getHitRect(e);
      for (const q of [{ x: r.x + r.w / 2, y: r.y }, { x: r.x, y: r.y + r.h / 2 }, { x: r.x + r.w, y: r.y + r.h / 2 }]) {
        if (isHiddenByRoof(world, q)) {
          notes.push(`[${c.id}] ${e.id} : le haut du corps est caché par un toit (${Math.round(q.x)}, ${Math.round(q.y)})`);
          break;
        }
      }
    }
  }
}

// Distance entre enquêtes (ancres)
const all: { c: string; e: Entity }[] = [];
for (const c of DRAFT_CASES) for (const e of c.entities) all.push({ c: c.id, e });
for (let i = 0; i < all.length; i++) {
  for (let j = i + 1; j < all.length; j++) {
    const a = all[i];
    const b = all[j];
    if (a.c === b.c) continue;
    const d = Math.hypot(a.e.x - b.e.x, a.e.y - b.e.y);
    if (d < 80) problems.push(`[${a.c}/${b.c}] ${a.e.id} et ${b.e.id} à ${d.toFixed(0)} u (< 80)`);
  }
}

// Apparences des personnages d'enquête
const chars = DRAFT_CASES.flatMap((c) => c.characters.map((ch) => ({ c: c.id, ch })));
const pairKey = (a: string, b: string): string => (a < b ? `${a}|${b}` : `${b}|${a}`);
const look = new Set<string>();
for (const fam of LOOKALIKES) for (const a of fam) for (const b of fam) if (a !== b) look.add(pairKey(a, b));
const recurring = new Map<string, string>();
for (const group of RECURRING) for (const id of group) recurring.set(id, group[0]);
for (let i = 0; i < chars.length; i++) {
  for (let j = i + 1; j < chars.length; j++) {
    const A = chars[i].ch;
    const B = chars[j].ch;
    const d = appearanceDistance(A.appearance, B.appearance);
    const same = recurring.has(A.id) && recurring.get(A.id) === recurring.get(B.id);
    if (same) {
      if (d !== 0 || A.appearance.build !== B.appearance.build) problems.push(`récurrent ${A.id} / ${B.id} : apparences différentes (${d})`);
      continue;
    }
    if (look.has(pairKey(A.id, B.id))) {
      if (d < 1) problems.push(`sosies ${A.id} / ${B.id} : apparences identiques`);
      else if (verbose) notes.push(`sosies ${A.id} / ${B.id} : ${d} attribut(s) d'écart`);
      continue;
    }
    if (d < 3) problems.push(`${A.id} / ${B.id} : seulement ${d} attribut(s) saillant(s) d'écart`);
  }
}

// Figurants (personnes d'enquête sans personnage) : ne doivent ressembler à aucun personnage
for (const c of DRAFT_CASES) {
  for (const e of c.entities) {
    if (e.kind !== 'person' || e.character) continue;
    for (const { ch } of chars) {
      const d = appearanceDistance(e.appearance, ch.appearance);
      if (d < 3) problems.push(`[${c.id}] figurant ${e.id} : à ${d} attribut(s) du personnage ${ch.id}`);
    }
  }
}

// Passants ambiants proches d'un personnage
const people = world.entities.filter((e): e is PersonEntity => e.kind === 'person' && !(e.tags ?? []).includes('story'));
for (const { c, ch } of chars) {
  const near = people.filter((p) => appearanceDistance(p.appearance, ch.appearance) < 3);
  if (near.length) problems.push(`[${c}] ${ch.id} : ${near.length} passant(s) ambiant(s) à moins de 3 attributs (${near.slice(0, 3).map((p) => p.id).join(', ')})`);
  // Passants à exactement 3 attributs ET à moins de 500 u d'une apparition du personnage : risque de confusion.
  const spots = DRAFT_CASES.flatMap((d) => d.entities).filter((e) => e.kind === 'person' && e.character === ch.id);
  const three = people.filter(
    (p) => appearanceDistance(p.appearance, ch.appearance) === 3 && spots.some((s) => Math.hypot(s.x - p.x, s.y - p.y) < 500),
  );
  for (const p of three) {
    const diff = (Object.keys(ch.appearance) as (keyof typeof ch.appearance)[]).filter((k) => p.appearance[k] !== ch.appearance[k]);
    notes.push(`[${c}] ${ch.id} ~ ${p.id} (${Math.round(p.x)}, ${Math.round(p.y)}) ne diffère que par : ${diff.join(', ')}`);
  }
}

// Zones d'indice, caméra de départ
for (const c of DRAFT_CASES) {
  for (const s of c.steps) {
    const area = s.hints[1]?.area;
    if (!area) {
      if (!c.bonus) problems.push(`[${c.id}] ${s.id} : l'indice 2 n'a pas de zone`);
    }
    else if (area.radius < 60 || area.radius > 450) problems.push(`[${c.id}] ${s.id} : rayon d'indice ${area.radius} hors [60, 450]`);
    if (s.hints.length !== 2) notes.push(`[${c.id}] ${s.id} : ${s.hints.length} indices`);
  }
  const first = c.steps.filter((s) => (s.after ?? []).length === 0 || s === c.steps[0]);
  const ds = first.flatMap((s) => s.accept.map((a) => targetCenter(world, a))).filter((p) => p !== undefined);
  if (ds.length && !c.bonus) {
    const dmin = Math.min(...ds.map((p) => Math.hypot(p.x - c.start.x, p.y - c.start.y)));
    if (dmin > 700) notes.push(`[${c.id}] caméra de départ à ${dmin.toFixed(0)} u de la première réponse`);
  }
}

// Occultation : une réponse (ou fausse piste) ne doit pas être masquée par une entité dessinée devant elle.
for (const c of DRAFT_CASES) {
  const ids = new Set(c.steps.flatMap((s) => [...s.accept, ...(s.nearMiss ?? []).map((n) => n.id)]));
  for (const id of ids) {
    const e = world.byId.get(id);
    if (!e || e.kind === 'building') continue;
    const r = getHitRect(e);
    const area = r.w * r.h;
    for (const o of world.index.query(r)) {
      if (o.id === e.id || compareDrawOrder(o, e) <= 0) continue;
      const q = getHitRect(o);
      const ix = Math.max(0, Math.min(r.x + r.w, q.x + q.w) - Math.max(r.x, q.x));
      const iy = Math.max(0, Math.min(r.y + r.h, q.y + q.h) - Math.max(r.y, q.y));
      const f = (ix * iy) / area;
      if (f > 0.35) problems.push(`[${c.id}] ${id} masqué à ${Math.round(f * 100)} % par ${o.id} (dessiné devant)`);
      else if (f > 0.1) notes.push(`[${c.id}] ${id} recouvert à ${Math.round(f * 100)} % par ${o.id}`);
    }
  }
}

// Couleur d'un chapeau citée dans un texte : la couleur de chaque type de chapeau est fixe à l'écran
// (HAT_HEX), « bonnet noir » devant un bonnet orange fait chercher le mauvais personnage.
const HAT_WORDS: Record<string, { color: string; words: string[] }> = {
  cap: { color: 'rouge', words: ['casquette'] },
  beanie: { color: 'orange', words: ['bonnet'] },
  helmet: { color: 'jaune', words: ['casque'] },
  police: { color: 'bleu', words: ['képi'] },
  straw: { color: 'jaune', words: ['chapeau de paille'] },
};
const ANY_COLOR = '(rouge|orange|jaune|rose|violet|bleu|vert|kaki|marron|beige|noir|blanc|gris)';
for (const c of DRAFT_CASES) {
  const texts: string[] = [c.intro, c.epilogue, ...c.replay.map((r) => r.caption)];
  for (const s of c.steps) texts.push(s.question, s.solved, ...s.hints.map((h) => h.text), ...(s.nearMiss ?? []).map((n) => n.feedback));
  for (const t of texts) {
    for (const [hat, { color, words }] of Object.entries(HAT_WORDS)) {
      for (const w of words) {
        for (const m of t.matchAll(new RegExp(`\\b${w}s?\\s+${ANY_COLOR}s?\\b`, 'gi'))) {
          if (m[1].toLowerCase() !== color) problems.push(`[${c.id}] « ${m[0]} » : un ${hat} est ${color} à l'écran`);
        }
      }
    }
  }
}

// Couleur d'un bas citée dans un texte alors qu'un tablier, un manteau ou une robe le cache : le joueur cherche
// un détail qu'il ne peut pas voir (« short rouge » sous un tablier). Erreur si tout est caché, note si le bas dépasse en partie.
problems.push(...hiddenBottomSelfTest());
for (const c of DRAFT_CASES) {
  const people: PersonRef[] = [
    ...c.characters.map((ch) => ({ id: ch.id, appearance: ch.appearance })),
    ...c.entities.filter((e): e is PersonEntity => e.kind === 'person' && !e.character).map((e) => ({ id: e.id, appearance: e.appearance })),
  ];
  const texts: { where: string; text: string }[] = [
    { where: 'briefing', text: c.intro },
    { where: 'épilogue', text: c.epilogue },
    ...c.replay.map((r) => ({ where: `reconstitution ${r.id}`, text: r.caption })),
  ];
  for (const s of c.steps) {
    texts.push({ where: `${s.id} question`, text: s.question }, { where: `${s.id} résolution`, text: s.solved });
    s.hints.forEach((h, k) => texts.push({ where: `${s.id} indice ${k + 1}`, text: h.text }));
    for (const n of s.nearMiss ?? []) texts.push({ where: `${s.id} fausse piste ${n.id}`, text: n.feedback });
  }
  for (const { where, text } of texts) {
    for (const a of hiddenBottomAlerts(text, people)) {
      (a.level === 'total' ? problems : notes).push(`[${c.id}] ${where} : ${describeAlert(a)}`);
    }
  }
}

// Ambiants retirés autour des scènes (information)
if (verbose) {
  for (const c of DRAFT_CASES) {
    let overlapped = 0;
    for (const e of c.entities) {
      const b = getEntityBounds(e);
      overlapped += world.index.query(b).filter((x) => x.kind !== 'building' && !(x.tags ?? []).includes('story')).length;
    }
    notes.push(`[${c.id}] ${c.entities.length} entités, ${overlapped} entités ambiantes voisines (emprises qui se touchent)`);
  }
}

console.log(`Monde construit avec ${DRAFT_CASES.length} enquêtes (${DRAFT_CASES.reduce((n, c) => n + c.entities.length, 0)} entités) en ${Date.now() - t0} ms.`);
for (const n of notes) console.log('  note : ' + n);
if (problems.length === 0) console.log('OK : aucun problème.');
else {
  console.log(`${problems.length} problème(s) :`);
  for (const p of problems) console.log('  - ' + p);
  process.exitCode = 1;
}
