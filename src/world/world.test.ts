import { describe, expect, it } from 'vitest';
import type { CaseDef, Entity, PersonAppearance, PersonEntity, Rect, World } from '../types';
import { WORLD_SEED } from '../config';
import { compareDrawOrder, getEntityBounds } from '../art/bounds';
import { appearanceDistance, buildingAt, buildWorld, groundAt, isWalkable, onCrosswalk, worldMeta } from './index';
import { generateAmbient } from './generate';
import { LANDMARKS } from './layoutSpec';
import { inflate, intersects, rectIntersectsConvex } from './geom';
import { ACCESSORIES, BUILDS, COLORS, FACES, HAIR_COLORS, HAIRS, HATS, PATTERNS, SKINS, TOPS, BOTTOMS } from './appearance';

const world = buildWorld();
const meta = worldMeta(world)!;
const persons = world.entities.filter((e): e is PersonEntity => e.kind === 'person');
const buildings = world.entities.filter((e) => e.kind === 'building');

function count(kind: Entity['kind'], w: World = world): number {
  return w.entities.filter((e) => e.kind === kind).length;
}

describe('déterminisme', () => {
  it('deux générations de la même graine sont identiques', () => {
    const a = generateAmbient(WORLD_SEED);
    const b = generateAmbient(WORLD_SEED);
    expect(a.entities.length).toBe(b.entities.length);
    expect(JSON.stringify(a.entities)).toBe(JSON.stringify(b.entities));
    expect(JSON.stringify(a.ground)).toBe(JSON.stringify(b.ground));
  });

  it('buildWorld renvoie le même monde à chaque appel', () => {
    const w2 = buildWorld();
    expect(w2.entities.map((e) => e.id)).toEqual(world.entities.map((e) => e.id));
    expect(JSON.stringify(w2.entities)).toBe(JSON.stringify(world.entities));
  });

  it('modifier un monde obtenu n’altère pas les suivants (copies)', () => {
    const w1 = buildWorld();
    const p = w1.entities.find((e) => e.kind === 'person');
    const b = w1.byId.get('lm.banque');
    if (p?.kind === 'person') p.appearance.topColor = p.appearance.topColor === 'red' ? 'blue' : 'red';
    if (b?.kind === 'building') b.footprint.x += 1000;
    const w2 = buildWorld();
    expect(JSON.stringify(w2.entities)).toBe(JSON.stringify(world.entities));
  });

  it('une autre graine donne une autre ville', () => {
    const other = buildWorld({ seed: 7 });
    expect(JSON.stringify(other.entities.slice(0, 200))).not.toBe(JSON.stringify(world.entities.slice(0, 200)));
  });
});

describe('lieux remarquables', () => {
  it('chaque bâtiment remarquable a exactement l’emprise et le style du plan', () => {
    for (const lm of LANDMARKS.filter((l) => l.kind === 'building')) {
      const e = world.byId.get(`lm.${lm.id}`);
      expect(e, lm.id).toBeDefined();
      if (!e || e.kind !== 'building') continue;
      expect(e.footprint).toEqual(lm.rect);
      expect(e.style).toBe(lm.style);
      expect(e.height).toBe(lm.height);
      expect(e.sign).toBe(lm.sign);
      expect(e.wall).toBe(lm.wall);
      expect(e.roof).toBe(lm.roof);
      expect(e.tags).toContain('landmark');
      expect(e.x).toBe(lm.rect.x + lm.rect.w / 2);
      expect(e.y).toBe(lm.rect.y + lm.rect.h);
    }
  });

  it('chaque lieu de type « area » a sa zone z.<id>, et World.landmarks reprend le plan', () => {
    for (const lm of LANDMARKS) {
      if (lm.kind === 'area') {
        const z = world.zones.get(`z.${lm.id}`);
        expect(z, lm.id).toBeDefined();
        expect(z!.label).toBe(lm.name);
        expect(z!.points.length).toBeGreaterThanOrEqual(4);
      }
      const l = world.landmarks.find((x) => x.id === lm.id);
      expect(l).toBeDefined();
      expect(l!.rect).toEqual(lm.rect);
    }
    expect(world.byId.get('lm.fontaine')?.kind).toBe('prop');
    expect(world.byId.get('lm.kiosque')?.kind).toBe('prop');
    expect(world.byId.get('lm.statue')?.kind).toBe('prop');
  });

  it('le sol des lieux correspond à leur type', () => {
    const c = (r: Rect) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 + 3 });
    for (const lm of LANDMARKS) {
      if (lm.kind !== 'area' || !lm.ground) continue;
      const r = lm.rect;
      // Un point du lieu, loin des objets posés au centre.
      const p = { x: r.x + 6, y: r.y + r.h - 6 };
      const k = groundAt(world, lm.id === 'etang' ? c(r) : p);
      expect([lm.ground, 'sand', 'plaza'], lm.id).toContain(k);
    }
  });
});

describe('sol', () => {
  it('rivière, ponts, voie ferrée, avenues, passages piétons, marquage', () => {
    expect(groundAt(world, { x: 1000, y: 3830 })).toBe('water');
    expect(groundAt(world, { x: 2163, y: 3830 })).toBe('bridge'); // trottoir du Pont Central
    expect(groundAt(world, { x: 2200, y: 3830 })).toBe('road'); // chaussée sur le pont
    expect(groundAt(world, { x: 4213, y: 3830 })).toBe('bridge');
    expect(groundAt(world, { x: 260, y: 3830 })).toBe('bridge'); // pont ferroviaire
    expect(groundAt(world, { x: 260, y: 600 })).toBe('railbed');
    expect(groundAt(world, { x: 3000, y: 1300 })).toBe('road'); // boulevard des Halles
    expect(groundAt(world, { x: 3000, y: 1268 })).toBe('sidewalk');
    expect(groundAt(world, { x: 2850, y: 1900 })).toBe('plaza'); // Grand-Place
    expect(groundAt(world, { x: 5300, y: 300 })).toBe('park');
    expect(isWalkable(world, { x: 1000, y: 3830 })).toBe(false);
    expect(isWalkable(world, { x: 2163, y: 3830 })).toBe(true);
    expect(isWalkable(world, { x: 2850, y: 1700 })).toBe(false); // dans l'Hôtel de Ville
    expect(buildingAt(world, { x: 2850, y: 1700 })?.id).toBe('lm.hotel-de-ville');
    const kinds = new Set(world.ground.lines.map((l) => l.kind));
    for (const k of ['laneline', 'crosswalk', 'rail', 'path', 'fence', 'hedge', 'wall'] as const) expect(kinds, k).toContain(k);
    expect(world.ground.lines.filter((l) => l.kind === 'rail').length).toBeGreaterThanOrEqual(2);
    expect(world.ground.lines.filter((l) => l.kind === 'crosswalk').length).toBeGreaterThan(100);
    const shapeKinds = new Set(world.ground.shapes.map((s) => s.kind));
    for (const k of ['water', 'bridge', 'railbed', 'road', 'sidewalk', 'plaza', 'park', 'dock', 'garden', 'courtyard', 'parking', 'sand'] as const) expect(shapeKinds, k).toContain(k);
  });

  it('des rues secondaires variées découpent les quartiers (dont rues en biais et impasses)', () => {
    const secondary = meta.streets.filter((s) => s.kind !== 'avenue');
    expect(secondary.length).toBeGreaterThan(80);
    expect(meta.streets.some((s) => s.axis === 'd')).toBe(true);
    expect(meta.streets.some((s) => s.deadEnd)).toBe(true);
    const urban = meta.blocks.filter((b) => b.kind === 'urban');
    const depths = new Set(urban.map((b) => Math.round(b.rect.h / 40)));
    const widths = new Set(urban.map((b) => Math.round(b.rect.w / 40)));
    expect(depths.size).toBeGreaterThan(5);
    expect(widths.size).toBeGreaterThan(5);
  });
});

describe('bâtiments', () => {
  const generated = buildings.filter((b) => b.id.startsWith('b.'));
  const roadPolys = meta.streets.flatMap((s) => [s.poly, ...(s.extra ? [s.extra.sidewalk] : [])]);
  const water = world.ground.shapes.filter((s) => s.kind === 'water').map((s) => s.points);
  const areasNoBuild = LANDMARKS.filter((l) => l.kind === 'area' && l.id !== 'entrepots' && l.id !== 'jardins-ouvriers' && !l.id.startsWith('pont'));

  it('assez nombreux, ids par quartier', () => {
    expect(generated.length).toBeGreaterThan(600);
    for (const b of generated) expect(b.id).toMatch(/^b\.(gare|halles|centre|faubourg|parc|arts|riviere|jardins|port)\.\d+$/);
  });

  it('aucun chevauchement entre emprises', () => {
    const bad: string[] = [];
    for (let i = 0; i < buildings.length; i++) {
      const a = buildings[i];
      if (a.kind !== 'building') continue;
      for (let j = i + 1; j < buildings.length; j++) {
        const b = buildings[j];
        if (b.kind === 'building' && intersects(a.footprint, b.footprint)) bad.push(`${a.id} × ${b.id}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('aucun bâtiment sur une rue, dans l’eau, sur la voie ferrée ou dans une zone de lieu', () => {
    const bad: string[] = [];
    for (const b of buildings) {
      if (b.kind !== 'building') continue;
      const f = inflate(b.footprint, -0.5);
      if (roadPolys.some((p) => rectIntersectsConvex(f, p))) bad.push(`${b.id} sur une rue`);
      if (water.some((p) => rectIntersectsConvex(f, p))) bad.push(`${b.id} dans l'eau`);
      if (intersects(f, { x: 225, y: 0, w: 70, h: 4800 })) bad.push(`${b.id} sur le rail`);
      if (!b.id.startsWith('b.')) continue;
      for (const a of areasNoBuild) if (intersects(f, a.rect)) bad.push(`${b.id} dans ${a.id}`);
    }
    expect(bad).toEqual([]);
  });

  it('lisibilité : un toit généré ne masque ni une autre façade ni une rue', () => {
    const band = (b: { footprint: Rect; height: number }): Rect => ({ x: b.footprint.x, y: b.footprint.y - b.height, w: b.footprint.w, h: b.footprint.h + b.height });
    const bands = buildings.map((b) => (b.kind === 'building' ? band(b) : { x: 0, y: 0, w: 0, h: 0 }));
    const bad: string[] = [];
    generated.forEach((a) => {
      if (a.kind !== 'building') return;
      const ba = inflate(band(a), -1);
      buildings.forEach((b, j) => {
        if (b !== a && intersects(ba, bands[j])) bad.push(`${a.id} masque ${b.id}`);
      });
      const roof = inflate({ x: a.footprint.x, y: a.footprint.y - a.height, w: a.footprint.w, h: a.height }, -0.5);
      for (const s of meta.streets) if (rectIntersectsConvex(roof, s.poly)) bad.push(`${a.id} couvre ${s.name}`);
    });
    expect(bad).toEqual([]);
  });

  it('styles variés par quartier, enseignes françaises, détails de façade', () => {
    const styles = new Set(generated.map((b) => (b.kind === 'building' ? b.style : '')));
    for (const s of ['house', 'townhouse', 'apartment', 'shop', 'cafe', 'bar', 'hotel', 'warehouse', 'factory', 'shed', 'greenhouse', 'garage'] as const) expect(styles, s).toContain(s);
    const signs = new Set(generated.map((b) => (b.kind === 'building' ? b.sign : undefined)).filter(Boolean));
    for (const s of ['TABAC', 'ÉPICERIE', 'COIFFEUR', 'PRESSING', 'QUINCAILLERIE', 'FROMAGERIE', 'OPTICIEN', 'LAVERIE', 'HORLOGER', 'CORDONNIER', 'DROGUERIE', 'CHAPELIER']) expect(signs, s).toContain(s);
    // Les enseignes des lieux remarquables restent uniques.
    for (const s of ['BOULANGERIE', 'BOUCHERIE', 'FLEURISTE', 'LIBRAIRIE', 'PHARMACIE', 'BIJOUTERIE CARAT', 'BANQUE DUFRIC', 'POLICE']) expect(signs.has(s), s).toBe(false);
    const feats = new Set(generated.flatMap((b) => (b.kind === 'building' ? (b.features ?? []).map((f) => f.kind) : [])));
    for (const k of ['awning', 'balcony', 'litWindow', 'poster', 'graffiti'] as const) expect(feats, k).toContain(k);
    const port = generated.filter((b) => b.id.startsWith('b.port.'));
    expect(port.some((b) => b.kind === 'building' && b.features?.some((f) => f.kind === 'graffiti'))).toBe(true);
    expect(port.filter((b) => b.kind === 'building' && b.sign?.startsWith('ENTREPÔT')).length).toBeGreaterThanOrEqual(8);
  });

  it('hauteurs dans les gabarits', () => {
    const ranges: Record<string, [number, number]> = { house: [44, 56], townhouse: [60, 90], apartment: [90, 140], shop: [50, 64], warehouse: [50, 70] };
    for (const b of generated) {
      if (b.kind !== 'building' || !ranges[b.style]) continue;
      const [lo, hi] = ranges[b.style];
      expect(b.height, b.id).toBeGreaterThanOrEqual(lo);
      expect(b.height, b.id).toBeLessThanOrEqual(hi);
    }
  });
});

describe('foule', () => {
  const ground = persons.filter((p) => !p.z && p.pose !== 'window');

  it('effectif dans la fourchette', () => {
    expect(persons.length).toBeGreaterThanOrEqual(2500);
    expect(persons.length).toBeLessThanOrEqual(3500);
    for (const p of persons) expect(p.id).toMatch(/^a\.p\.\d+$/);
  });

  it('personne dans l’eau, sur la chaussée (hors passage piéton), sur le ballast ou dans un bâtiment', () => {
    const bad: string[] = [];
    for (const p of ground) {
      for (const dx of [-3, 0, 3]) {
        const q = { x: p.x + dx, y: p.y };
        const k = groundAt(world, q);
        if (k === 'water' || k === 'railbed') bad.push(`${p.id} sur ${k}`);
        if (k === 'road' && !onCrosswalk(world, q)) bad.push(`${p.id} sur la chaussée`);
      }
      if (buildingAt(world, p)) bad.push(`${p.id} dans un bâtiment`);
    }
    expect(bad).toEqual([]);
  });

  it('apparences variées : toutes les valeurs du vocabulaire apparaissent', () => {
    const vocab: Record<keyof PersonAppearance, readonly string[]> = {
      skin: SKINS, hair: HAIRS, hairColor: HAIR_COLORS, hat: HATS, top: TOPS, topColor: COLORS, topPattern: PATTERNS,
      bottom: BOTTOMS, bottomColor: COLORS, face: FACES, accessory: ACCESSORIES, build: BUILDS,
    };
    for (const [k, values] of Object.entries(vocab) as [keyof PersonAppearance, readonly string[]][]) {
      const seen = new Set(persons.map((p) => p.appearance[k]));
      for (const v of values) expect(seen, `${k}=${v}`).toContain(v);
    }
  });

  it('vie crédible : poses, émotions, chiens en laisse, enfants, rôles', () => {
    const poses = new Set(persons.map((p) => p.pose));
    for (const p of ['stand', 'walk', 'run', 'sit', 'lie', 'crouch', 'point', 'wave', 'carry', 'phone', 'read', 'window', 'climb'] as const) expect(poses, p).toContain(p);
    const emotes = new Set(persons.map((p) => p.emote ?? 'none'));
    for (const e of ['talk', 'music', 'heart', 'exclaim', 'question', 'sleep', 'sweat'] as const) expect(emotes, e).toContain(e);
    expect(emotes.has('ko')).toBe(false);
    const dogs = world.entities.filter((e) => e.kind === 'prop' && e.prop === 'dog');
    const leashes = persons.filter((p) => p.holding === 'leash');
    expect(leashes.length).toBeGreaterThan(30);
    for (const p of leashes) {
      const near = dogs.some((d) => Math.abs(d.y - p.y) < 2 && Math.abs(d.x - p.x - (p.facing === 'right' ? 16 : -16)) < 1);
      expect(near, `${p.id} sans chien`).toBe(true);
    }
    expect(persons.filter((p) => p.appearance.build === 'child').length).toBeGreaterThan(100);
    expect(persons.filter((p) => p.appearance.hat === 'police').length).toBeGreaterThanOrEqual(3);
    expect(persons.filter((p) => p.appearance.hat === 'helmet' && p.appearance.top === 'overalls').length).toBeGreaterThan(10);
    expect(persons.filter((p) => p.appearance.top === 'apron').length).toBeGreaterThan(30);
    // Aucun objet compromettant dans les mains des passants
    for (const p of persons) expect(['knife', 'moneybag', 'painting', 'crowbar', 'jewel', 'needle']).not.toContain(p.holding ?? 'none');
  });

  it('densité : places et marché bondés, Faubourg et Jardins calmes', () => {
    const density = (r: Rect) => ground.filter((p) => p.x >= r.x && p.x < r.x + r.w && p.y >= r.y && p.y < r.y + r.h).length / ((r.w * r.h) / 10000);
    const gp = LANDMARKS.find((l) => l.id === 'grand-place')!.rect;
    const halles = LANDMARKS.find((l) => l.id === 'halles')!.rect;
    const faubourg = { x: 1486, y: 2936, w: 2728, h: 682 };
    const jardins = { x: 2236, y: 4042, w: 1978, h: 758 };
    expect(density(gp)).toBeGreaterThan(5);
    expect(density(halles)).toBeGreaterThan(5);
    expect(density(faubourg)).toBeLessThan(1.5);
    expect(density(jardins)).toBeLessThan(1);
  });
});

describe('véhicules, arbres, objets', () => {
  it('comptes dans les fourchettes', () => {
    expect(count('vehicle')).toBeGreaterThanOrEqual(200);
    expect(count('vehicle')).toBeLessThanOrEqual(300);
    expect(count('tree')).toBeGreaterThanOrEqual(800);
    expect(count('tree')).toBeLessThanOrEqual(1200);
    expect(count('prop')).toBeGreaterThan(1500);
  });

  it('ids conformes et uniques', () => {
    expect(world.byId.size).toBe(world.entities.length);
    expect(world.bounds.size).toBe(world.entities.length);
    for (const e of world.entities) {
      if (e.id.startsWith('lm.')) continue;
      const re = e.kind === 'vehicle' ? /^a\.v\.\d+$/ : e.kind === 'tree' ? /^a\.t\.\d+$/ : e.kind === 'prop' ? /^a\.o\.\d+$/ : e.kind === 'person' ? /^a\.p\.\d+$/ : /^b\./;
      expect(e.id, e.id).toMatch(re);
    }
  });

  it('les voitures roulent à droite et sont sur la chaussée', () => {
    let checked = 0;
    for (const v of world.entities) {
      if (v.kind !== 'vehicle' || !v.driver || v.vehicle === 'boat' || v.vehicle === 'bicycle') continue;
      const s = meta.streets.find((st) => st.axis === 'h' && v.x >= st.roadRect.x && v.x <= st.roadRect.x + st.roadRect.w && v.y - 4 >= st.roadRect.y && v.y - 4 <= st.roadRect.y + st.roadRect.h);
      if (!s) continue;
      const mid = s.roadRect.y + s.roadRect.h / 2;
      if (v.facing === 'right') expect(v.y, v.id).toBeGreaterThan(mid);
      else expect(v.y - 6, v.id).toBeLessThan(mid);
      checked++;
    }
    expect(checked).toBeGreaterThan(80);
    for (const v of world.entities) {
      if (v.kind !== 'vehicle') continue;
      const k = groundAt(world, { x: v.x, y: v.y - 2 });
      expect(['road', 'parking', 'bridge', 'water', 'park', 'courtyard', 'dock'], v.id).toContain(k);
      if (v.vehicle === 'boat') expect(k).toBe('water');
    }
  });

  it('aucun arbre n’a le pied sur la chaussée ni dans l’eau', () => {
    const bad: string[] = [];
    for (const t of world.entities) {
      if (t.kind !== 'tree') continue;
      const k = groundAt(world, t);
      if (k === 'road' || k === 'water') bad.push(`${t.id} (${t.x.toFixed(0)}, ${t.y.toFixed(0)}) sur ${k}`);
    }
    expect(bad).toEqual([]);
  });

  it('vocabulaire des véhicules, arbres et objets bien représenté', () => {
    const v = new Set(world.entities.map((e) => (e.kind === 'vehicle' ? e.vehicle : '')));
    for (const k of ['car', 'van', 'taxi', 'police', 'bus', 'truck', 'ambulance', 'bicycle', 'scooter', 'boat'] as const) expect(v, k).toContain(k);
    const t = new Set(world.entities.map((e) => (e.kind === 'tree' ? e.tree : '')));
    for (const k of ['round', 'pine', 'poplar', 'bare'] as const) expect(t, k).toContain(k);
    const o = new Set(world.entities.map((e) => (e.kind === 'prop' ? e.prop : '')));
    for (const k of ['bench', 'lamp', 'bin', 'mailbox', 'hydrant', 'phonebooth', 'kiosk', 'busstop', 'sign', 'cone', 'barrier', 'manhole', 'fountain', 'statue', 'bandstand', 'stall', 'parasol', 'table', 'chair', 'cart', 'crate', 'barrel', 'pallet', 'crane', 'scaffold', 'playground', 'bush', 'flowerbed', 'rock', 'dog', 'cat', 'pigeons', 'duck'] as const) expect(o, k).toContain(k);
    for (const k of ['moneybag', 'knife', 'painting', 'safe', 'footprints', 'letter', 'key', 'jewel', 'needle'] as const) expect(o.has(k), k).toBe(false);
  });
});

describe('index spatial', () => {
  it('query = filtrage exhaustif, dans l’ordre de dessin, sans doublon', () => {
    let seed = 1;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let k = 0; k < 40; k++) {
      const r = { x: rnd() * 6200, y: rnd() * 4600, w: 20 + rnd() * 600, h: 20 + rnd() * 600 };
      const got = world.index.query(r).map((e) => e.id);
      const want = world.entities.filter((e) => intersects(world.bounds.get(e.id)!, r)).map((e) => e.id);
      expect(got).toEqual(want);
    }
    for (let i = 1; i < world.entities.length; i++) expect(compareDrawOrder(world.entities[i - 1], world.entities[i])).toBeLessThanOrEqual(0);
  });

  it('une requête de 256 × 256 u prend bien moins d’une milliseconde', () => {
    const n = 2000;
    let sum = 0;
    const t0 = performance.now();
    for (let i = 0; i < n; i++) sum += world.index.query({ x: (i * 977) % 6100, y: (i * 613) % 4500, w: 256, h: 256 }).length;
    const per = (performance.now() - t0) / n;
    console.log(`[world] requête 256×256 : ${(per * 1000).toFixed(1)} µs en moyenne (${(sum / n).toFixed(0)} entités)`);
    expect(per).toBeLessThan(0.5);
  });

  it('les emprises correspondent à getEntityBounds', () => {
    for (const e of world.entities.slice(0, 2000)) expect(world.bounds.get(e.id)).toEqual(getEntityBounds(e));
  });
});

/* ----------------------------------------------------------------------------
 * Enquêtes
 * ------------------------------------------------------------------------- */

function fakeCase(lookalike: PersonAppearance, at: { x: number; y: number }): CaseDef {
  return {
    id: 'cx',
    title: 'Enquête factice',
    difficulty: 1,
    teaser: '',
    intro: '',
    start: { x: at.x, y: at.y, zoom: 2 },
    steps: [],
    epilogue: '',
    replay: [],
    characters: [{ id: 'cx.suspect', name: 'Suspect', appearance: lookalike }],
    entities: [
      { id: 'cx.suspect', kind: 'person', x: at.x, y: at.y, pose: 'stand', facing: 'left', character: 'cx.suspect', appearance: { ...lookalike, hat: 'none' } },
      { id: 'cx.sac', kind: 'prop', prop: 'moneybag', x: at.x + 30, y: at.y },
    ],
    zones: [{ id: 'cx.zone.place', label: 'La place', points: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }] }],
    landmarkOverrides: { banque: { sign: 'BANQUE FERMÉE', features: [{ kind: 'brokenWindow', at: 0.5, floor: 1 }] } },
  };
}

describe('intégration des enquêtes', () => {
  // On copie l'apparence d'un passant existant : il doit être « dé-sosifié ».
  const victim = persons.find((p) => p.pose === 'walk' && p.appearance.build !== 'child')!;
  const gp = LANDMARKS.find((l) => l.id === 'grand-place')!.rect;
  const at = { x: gp.x + 80, y: gp.y + 300 };
  const c = fakeCase({ ...victim.appearance }, at);
  const w = buildWorld({ cases: [c] });

  it('ajoute les entités, applique le personnage, les zones et les modifications de lieux', () => {
    const s = w.byId.get('cx.suspect');
    expect(s?.kind).toBe('person');
    if (s?.kind === 'person') expect(s.appearance).toEqual(victim.appearance);
    expect(s?.tags).toContain('story');
    expect(s?.tags).toContain('case:cx');
    expect(w.zones.get('cx.zone.place')).toBeDefined();
    expect(w.zones.get('z.parc')).toBeDefined();
    const bank = w.byId.get('lm.banque');
    expect(bank?.kind === 'building' && bank.sign).toBe('BANQUE FERMÉE');
    expect(bank?.kind === 'building' && bank.features?.some((f) => f.kind === 'brokenWindow')).toBe(true);
    // Le monde de base n'est pas modifié
    const bank0 = buildWorld().byId.get('lm.banque');
    expect(bank0?.kind === 'building' && bank0.sign).toBe('BANQUE DUFRIC');
  });

  it('règle anti-sosie : aucun passant à moins de 3 attributs d’un personnage', () => {
    const ref = c.characters[0].appearance;
    let fixed = 0;
    for (const e of w.entities) {
      if (e.kind !== 'person' || !e.id.startsWith('a.')) continue;
      expect(appearanceDistance(e.appearance, ref), e.id).toBeGreaterThanOrEqual(3);
      const before = world.byId.get(e.id) as PersonEntity;
      if (JSON.stringify(before.appearance) !== JSON.stringify(e.appearance)) fixed++;
    }
    expect(fixed).toBeGreaterThan(0);
    const v = w.byId.get(victim.id);
    if (v?.kind === 'person') expect(appearanceDistance(v.appearance, ref)).toBeGreaterThanOrEqual(3);
  });

  it('l’ambiant qui chevauche une scène est retiré ; le reste garde ses ids et ses positions', () => {
    const storyBounds = ['cx.suspect', 'cx.sac'].map((id) => inflate(w.bounds.get(id)!, 6));
    for (const e of w.entities) {
      if (!e.id.startsWith('a.')) continue;
      for (const sb of storyBounds) expect(intersects(w.bounds.get(e.id)!, sb), `${e.id} chevauche la scène`).toBe(false);
    }
    const removed = world.entities.filter((e) => !w.byId.has(e.id));
    expect(removed.length).toBeGreaterThan(0);
    for (const e of removed) expect(e.id.startsWith('a.')).toBe(true);
    for (const e of w.entities) {
      if (e.id.startsWith('cx.')) continue;
      const e0 = world.byId.get(e.id);
      expect(e0, e.id).toBeDefined();
      expect([e.x, e.y, e.kind]).toEqual([e0!.x, e0!.y, e0!.kind]);
    }
    expect(w.entities.length).toBe(world.entities.length - removed.length + 2);
  });

  it('un id en double est refusé', () => {
    const bad = fakeCase(victim.appearance, at);
    bad.entities.push({ ...bad.entities[1] });
    expect(() => buildWorld({ cases: [bad] })).toThrow(/double/);
  });
});

describe('performance', () => {
  it('génération complète en moins de ~400 ms', () => {
    // Graine inédite : rien en cache.
    const t0 = performance.now();
    generateAmbient(WORLD_SEED + 1);
    const ms = performance.now() - t0;
    const t1 = performance.now();
    buildWorld({ seed: WORLD_SEED + 2 });
    const ms2 = performance.now() - t1;
    console.log(`[world] génération : ${ms.toFixed(0)} ms (puis ${ms2.toFixed(0)} ms pour buildWorld complet)`);
    expect(Math.min(ms, ms2)).toBeLessThan(600);
  });
});

describe('robustesse : autres graines', () => {
  it.each([1, 2, 3])('graine %i : pas de chevauchement de bâtiments, pas de passant mal placé', (seed) => {
    const w = buildWorld({ seed });
    const bs = w.entities.filter((e) => e.kind === 'building');
    const bad: string[] = [];
    for (let i = 0; i < bs.length; i++) {
      const a = bs[i];
      if (a.kind !== 'building') continue;
      for (let j = i + 1; j < bs.length; j++) {
        const b = bs[j];
        if (b.kind === 'building' && intersects(a.footprint, b.footprint)) bad.push(`${a.id} × ${b.id}`);
      }
    }
    for (const p of w.entities) {
      if (p.kind !== 'person' || p.z || p.pose === 'window') continue;
      for (const dx of [-3, 0, 3]) {
        const q = { x: p.x + dx, y: p.y };
        const k = groundAt(w, q);
        if (k === 'water' || k === 'railbed' || (k === 'road' && !onCrosswalk(w, q))) bad.push(`${p.id} sur ${k}`);
      }
      if (buildingAt(w, p)) bad.push(`${p.id} dans un bâtiment`);
    }
    expect(bad).toEqual([]);
    expect(count('person', w)).toBeGreaterThan(2400);
    expect(count('tree', w)).toBeGreaterThan(700);
  });
});
