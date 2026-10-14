// Génère docs/CONTENT.md à partir du gabarit tools/content/CONTENT.template.md et des enquêtes
// publiées (src/content/cases) : les tableaux techniques (personnages, entités, étapes,
// récapitulatif) sont ainsi TOUJOURS identiques au code vérifié par check.ts.
//
// Usage : npx tsx tools/content/gen.ts
// Balises reconnues dans le gabarit (une par ligne) :
//   <!-- GEN:textes:<id> -->  <!-- GEN:fiche:<id> -->  <!-- GEN:personnages:<id> -->
//   <!-- GEN:entites:<id> -->  <!-- GEN:etapes:<id> -->  <!-- GEN:replay:<id> -->
//   <!-- GEN:recap -->  <!-- GEN:vocabulaire -->
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CaseDef, Entity, PersonAppearance, PersonEntity, Vec2, World } from '../../src/types';
import { buildWorld, worldMeta } from '../../src/world';
import { districtName, nearestStreet } from '../../src/world/meta';
import { stepDependencies } from '../../src/game/session';
import { DISTRICTS } from '../../src/world/layoutSpec';
import { CASES as DRAFT_CASES } from '../../src/content';

const here = dirname(fileURLToPath(import.meta.url));
const world: World = buildWorld({ cases: DRAFT_CASES });
const meta = worldMeta(world)!;
const ambient = world.entities.filter((e): e is PersonEntity => e.kind === 'person' && !(e.tags ?? []).includes('story'));

const q = (v: unknown): string => (typeof v === 'string' ? `'${v}'` : String(v));
const code = (s: string): string => '`' + s + '`';
const esc = (s: string): string => s.replace(/\|/g, '\\|').replace(/\n/g, ' ');
const caseById = (id: string): CaseDef => DRAFT_CASES.find((c) => c.id === id)!;

/* ------------------------------------------------------------------ lieux */

function placeOf(p: Vec2): string {
  let best: { name: string; d: number } | null = null;
  for (const lm of world.landmarks) {
    const r = lm.rect;
    const dx = Math.max(r.x - p.x, 0, p.x - (r.x + r.w));
    const dy = Math.max(r.y - p.y, 0, p.y - (r.y + r.h));
    const d = Math.hypot(dx, dy);
    if (!best || d < best.d) best = { name: lm.name, d };
  }
  const dist = DISTRICTS.find((d) => d.id === districtName(world, p))?.name ?? '?';
  if (best && best.d === 0) return `${best.name} (${dist})`;
  if (best && best.d <= 90) return `près de : ${best.name} (${dist})`;
  const st = nearestStreet(meta, p);
  return st ? `${st.name} (${dist})` : dist;
}

/* ------------------------------------------------------------------ rareté */

const FR: Record<string, string> = {
  none: 'aucun', cap: 'casquette', beret: 'béret', bowler: 'chapeau melon', tophat: 'haut-de-forme', beanie: 'bonnet',
  fedora: 'feutre', helmet: 'casque', chef: 'toque', police: 'casquette de police', straw: 'chapeau de paille',
  tshirt: 't-shirt', shirt: 'chemise', sweater: 'pull', coat: 'manteau', suit: 'costume', dress: 'robe', apron: 'tablier',
  hoodie: 'sweat à capuche', uniform: 'uniforme', overalls: 'salopette', trousers: 'pantalon', shorts: 'short', skirt: 'jupe',
  plain: 'uni', stripes: 'rayé', dots: 'à pois', checks: 'à carreaux',
  glasses: 'lunettes', sunglasses: 'lunettes noires', mustache: 'moustache', beard: 'barbe', mask: 'cagoule / masque',
  handbag: 'sac à main', briefcase: 'mallette', backpack: 'sac à dos', umbrella: 'parapluie', cane: 'canne', camera: 'appareil photo',
  newspaper: 'journal', flowers: 'bouquet', balloon: 'ballon', suitcase: 'valise', scarf: 'écharpe',
  bald: 'chauve', short: 'courts', long: 'longs', bun: 'chignon', ponytail: 'queue-de-cheval', curly: 'bouclés', spiky: 'en épis',
  red: 'rouge', blue: 'bleu', navy: 'marine', green: 'vert', olive: 'olive', yellow: 'jaune', orange: 'orange', pink: 'rose',
  purple: 'violet', brown: 'marron', beige: 'beige', black: 'noir', white: 'blanc', grey: 'gris', blond: 'blonds',
  slim: 'mince', regular: 'moyen', large: 'costaud', child: 'enfant',
};
const fr = (v: string): string => FR[v] ?? v;

interface Trait {
  label: string;
  match: (a: PersonAppearance) => boolean;
}

function traitsOf(a: PersonAppearance): Trait[] {
  const t: Trait[] = [];
  if (a.hat !== 'none') t.push({ label: fr(a.hat), match: (b) => b.hat === a.hat });
  t.push({ label: fr(a.top), match: (b) => b.top === a.top });
  t.push({
    label: `haut ${fr(a.topColor)}${a.topPattern === 'plain' ? '' : ' ' + fr(a.topPattern)}`,
    match: (b) => b.topColor === a.topColor && b.topPattern === a.topPattern,
  });
  t.push({ label: `bas ${fr(a.bottomColor)}`, match: (b) => b.bottomColor === a.bottomColor });
  if (a.face !== 'none') t.push({ label: fr(a.face), match: (b) => b.face === a.face });
  if (a.accessory !== 'none') t.push({ label: fr(a.accessory), match: (b) => b.accessory === a.accessory });
  t.push({
    label: a.hair === 'bald' ? 'chauve' : `cheveux ${fr(a.hair)} ${fr(a.hairColor)}`,
    match: (b) => b.hair === a.hair && (a.hair === 'bald' || b.hairColor === a.hairColor),
  });
  if (a.build === 'child' || a.build === 'large') t.push({ label: fr(a.build), match: (b) => b.build === a.build });
  return t;
}

function rareTraits(a: PersonAppearance): string {
  const n = ambient.length;
  const rows = traitsOf(a)
    .map((t) => ({ ...t, f: ambient.filter((p) => t.match(p.appearance)).length / n }))
    .filter((t) => t.f <= 0.05)
    .sort((x, y) => x.f - y.f);
  if (rows.length === 0) return '— (aucun trait isolé sous 5 % : reconnaissable par la combinaison)';
  return rows.map((r) => `${r.label} (${(r.f * 100).toFixed(1).replace('.', ',')} %)`).join(', ');
}

/* ------------------------------------------------------------------ blocs */

function textes(c: CaseDef): string {
  const quote = (s: string): string => s.split('\n').map((l) => (l ? '> ' + l : '>')).join('\n');
  return [`**Accroche** (\`teaser\`) : ${c.teaser}`, '', '**Briefing** (`intro`) :', '', quote(c.intro), '', '**Épilogue** (`epilogue`) :', '', quote(c.epilogue)].join('\n');
}

function fiche(c: CaseDef): string {
  const districts = new Set<string>();
  let north = false;
  let south = false;
  for (const e of c.entities) {
    const d = districtName(world, e);
    if (d) districts.add(DISTRICTS.find((x) => x.id === d)!.name);
    if (e.y < 3700) north = true;
    if (e.y > 3960) south = true;
  }
  const parallel = c.steps.filter((_s, i) => stepDependencies(c, i).length === 0).map((s) => s.id);
  const rows: [string, string][] = [
    ['id', code(c.id)],
    ['titre', c.title],
    ['difficulté', String(c.difficulty)],
    ['déblocage (`unlockAfter`)', c.unlockAfter?.length ? c.unlockAfter.map(code).join(', ') : '— (disponible d’emblée)'],
    ['bonus', c.bonus ? 'oui' : 'non'],
    ['caméra de départ (`start`)', code(`{ x: ${c.start.x}, y: ${c.start.y}, zoom: ${c.start.zoom} }`)],
    ['étapes', `${c.steps.length} — ouvertes dès le début : ${parallel.map(code).join(', ')}`],
    ['personnages / entités', `${c.characters.length} / ${c.entities.length}`],
    ['quartiers', [...districts].join(', ')],
    ['traverse la rivière', north && south ? 'oui' : 'non'],
    ['`landmarkOverrides`', c.landmarkOverrides ? code(JSON.stringify(c.landmarkOverrides)) : '—'],
    ['`zones`', c.zones?.length ? c.zones.map((z) => code(z.id)).join(', ') : '— (aucune zone d’enquête)'],
  ];
  return ['| champ | valeur |', '|---|---|', ...rows.map(([k, v]) => `| ${k} | ${esc(v)} |`)].join('\n');
}

const APP_KEYS: (keyof PersonAppearance)[] = ['skin', 'hair', 'hairColor', 'hat', 'top', 'topColor', 'topPattern', 'bottom', 'bottomColor', 'face', 'accessory', 'build'];

function personnages(c: CaseDef): string {
  const figurants = c.entities.filter((e): e is PersonEntity => e.kind === 'person' && !e.character);
  const out: string[] = [];
  if (c.characters.length) {
    out.push(`| id | nom | rôle | ${APP_KEYS.join(' | ')} |`);
    out.push(`|---|---|---|${APP_KEYS.map(() => '---').join('|')}|`);
    for (const ch of c.characters) {
      out.push(`| ${code(ch.id)} | ${esc(ch.name)} | ${esc(ch.role ?? '')} | ${APP_KEYS.map((k) => code(ch.appearance[k])).join(' | ')} |`);
    }
    out.push('', '**Signes distinctifs** (traits portés par au plus 5 % des 3 231 passants ambiants, du plus rare au moins rare) :', '');
    for (const ch of c.characters) out.push(`- ${code(ch.id)} : ${rareTraits(ch.appearance)}`);
  } else out.push('_Aucun personnage._');
  if (figurants.length) {
    out.push('', '**Figurants** (personnes d’enquête SANS `character` : apparence portée par l’entité, sans effet sur la règle anti-sosie) :', '');
    out.push(`| entité | ${APP_KEYS.join(' | ')} |`);
    out.push(`|---|${APP_KEYS.map(() => '---').join('|')}|`);
    for (const f of figurants) out.push(`| ${code(f.id)} | ${APP_KEYS.map((k) => code(f.appearance[k])).join(' | ')} |`);
  }
  return out.join('\n');
}

function details(e: Entity): string {
  const kv = (k: string, v: unknown): string | null => (v === undefined || v === null ? null : `${k}: ${q(v)}`);
  let parts: (string | null)[] = [];
  switch (e.kind) {
    case 'person':
      parts = [kv('pose', e.pose), kv('facing', e.facing), kv('holding', e.holding), kv('emote', e.emote)];
      break;
    case 'prop':
      parts = [kv('prop', e.prop), kv('variant', e.variant), kv('color', e.color), kv('label', e.label), kv('scale', e.scale), kv('facing', e.facing)];
      break;
    case 'vehicle':
      parts = [kv('vehicle', e.vehicle), kv('facing', e.facing), kv('color', e.color), kv('label', e.label), kv('doorOpen', e.doorOpen), e.driver ? 'driver: (apparence)' : null];
      break;
    case 'tree':
      parts = [kv('tree', e.tree), kv('size', e.size)];
      break;
    case 'building':
      parts = [kv('style', e.style)];
      break;
  }
  if (e.tags?.length) parts.push(`tags: ${JSON.stringify(e.tags)}`);
  return parts.filter(Boolean).join(', ');
}

function entites(c: CaseDef): string {
  const out = ['| id | kind | x | y | z / sortY | détails | character | lieu |', '|---|---|---|---|---|---|---|---|'];
  for (const e of c.entities) {
    const zs = e.z !== undefined || e.sortY !== undefined ? `${e.z ?? 0} / ${e.sortY ?? '—'}` : '—';
    const ch = e.kind === 'person' && e.character ? code(e.character) : e.kind === 'person' ? '_figurant_' : '';
    out.push(`| ${code(e.id)} | ${e.kind} | ${e.x} | ${e.y} | ${zs} | ${esc(details(e))} | ${ch} | ${esc(placeOf(e))} |`);
  }
  return out.join('\n');
}

function etapes(c: CaseDef): string {
  const out: string[] = [];
  c.steps.forEach((s, i) => {
    const deps = stepDependencies(c, i);
    out.push(`##### Étape ${code(s.id)} — après : ${deps.length ? deps.map(code).join(', ') : 'rien (ouverte dès le début)'}${s.after ? ` (\`after: ${JSON.stringify(s.after)}\`)` : ' (`after` omis)'}`);
    out.push('');
    out.push(`- **Question** : ${s.question}`);
    out.push(`- **Réponses** (\`accept\`) : ${s.accept.map(code).join(', ')}${s.required ? ` — \`required: ${s.required}\`` : ''}`);
    if (s.nearMiss?.length) {
      out.push('- **Fausses pistes** (`nearMiss`) :');
      for (const n of s.nearMiss) out.push(`  - ${code(n.id)} → « ${n.feedback} »`);
    }
    s.hints.forEach((h, k) => {
      const area = h.area ? ` — zone ${code(`{ x: ${h.area.x}, y: ${h.area.y}, radius: ${h.area.radius} }`)}` : k === 1 ? ' — _pas de zone : projecteur automatique autour d’une réponse non trouvée_' : '';
      out.push(`- **Indice ${k + 1}** : ${h.text}${area}`);
    });
    out.push(`- **Résolution** (\`solved\`) : ${s.solved}`);
    if (s.thread?.length) out.push(`- **Fils rouges** (\`thread\`) : ${s.thread.map(([a, b]) => `${code(a)} → ${code(b)}`).join(' ; ')}`);
    out.push('');
  });
  return out.join('\n').trimEnd();
}

function replay(c: CaseDef): string {
  if (!c.replay.length) return '_Pas de reconstitution (enquête bonus, sans chronologie)._';
  return c.replay.map((r, i) => `${i + 1}. ${code(r.id)} — ${r.caption}`).join('\n');
}

function recap(): string {
  const all = DRAFT_CASES.flatMap((c) => c.entities.map((e) => ({ c: c.id, e })));
  let worst = { d: Infinity, a: '', b: '' };
  const out = ['| enquête | id | x | y | lieu | autre enquête la plus proche |', '|---|---|---|---|---|---|'];
  for (const { c, e } of all) {
    let near = { d: Infinity, id: '' };
    for (const o of all) {
      if (o.c === c) continue;
      const d = Math.hypot(o.e.x - e.x, o.e.y - e.y);
      if (d < near.d) near = { d, id: o.e.id };
      if (d < worst.d) worst = { d, a: e.id, b: o.e.id };
    }
    out.push(`| ${c} | ${code(e.id)} | ${e.x} | ${e.y} | ${esc(placeOf(e))} | ${code(near.id)} à ${Math.round(near.d)} u |`);
  }
  out.push('');
  out.push(
    `**Vérification** : ${all.length} entités d’enquête. Plus petite distance entre deux entités d’enquêtes différentes : **${Math.round(worst.d)} u** (${code(worst.a)} ↔ ${code(worst.b)}) — ${worst.d >= 80 ? 'règle des 80 u respectée' : '**RÈGLE DES 80 u VIOLÉE**'}.`,
  );
  return out.join('\n');
}

/* ------------------------------------------------------------------ assemblage */

const template = readFileSync(resolve(here, 'CONTENT.template.md'), 'utf8');
const out = template.replace(/^<!-- GEN:([a-z]+)(?::([a-z0-9-]+))? -->$/gm, (_m, kind: string, id?: string) => {
  const c = id ? caseById(id) : undefined;
  if (id && !c) throw new Error(`enquête inconnue : ${id}`);
  switch (kind) {
    case 'textes':
      return textes(c!);
    case 'fiche':
      return fiche(c!);
    case 'personnages':
      return personnages(c!);
    case 'entites':
      return entites(c!);
    case 'etapes':
      return etapes(c!);
    case 'replay':
      return replay(c!);
    case 'recap':
      return recap();
    default:
      throw new Error(`balise inconnue : ${kind}`);
  }
});
const target = resolve(here, '..', '..', 'docs', 'CONTENT.md');
writeFileSync(target, out);
console.log(`docs/CONTENT.md écrit (${out.split('\n').length} lignes).`);
