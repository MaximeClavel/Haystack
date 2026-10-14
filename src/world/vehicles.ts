// Véhicules : circulation sur les rues est-ouest (voie nord vers l'ouest, voie sud vers l'est :
// on roule à droite), voitures garées le long des trottoirs, parkings, vélos dans le parc,
// bateaux sur la rivière.
//
// Les véhicules sont dessinés de profil (facing gauche/droite) : on ne les place donc que sur des
// voies est-ouest (un profil sur une rue nord-sud aurait l'air de la traverser).
import type { Color, Rect, VehicleKind } from '../types';
import type { Rng } from '../lib/rng';
import { VEHICLE_SIZE } from '../art/bounds';
import { addVehicle, makeRng, type Gen } from './context';
import { F_BUILDING, F_CROSS, F_HIDDEN, F_PATH, F_PERSON, F_ROAD, F_SOLID } from './raster';
import { randomAppearance } from './appearance';
import { BOAT_NAMES, plate } from './names';
import { RIVER } from './layoutSpec';
import { convexSpanInBand, rectXY } from './geom';

const CAR_COLORS: readonly (readonly [Color, number])[] = [
  ['red', 10], ['blue', 10], ['navy', 8], ['green', 6], ['yellow', 4], ['white', 12], ['black', 10], ['grey', 12],
  ['beige', 5], ['orange', 3], ['brown', 4], ['olive', 3], ['purple', 2], ['pink', 2],
];

function vehicleFits(g: Gen, kind: VehicleKind, x: number, y: number, ground: readonly string[]): boolean {
  const [len] = VEHICLE_SIZE[kind];
  const base: Rect = { x: x - len / 2 - 4, y: y - 7, w: len + 8, h: 8 };
  if (g.raster.any(base, F_SOLID | F_CROSS)) return false;
  // Pas sous le toit d'un bâtiment situé plus au sud (il serait invisible).
  for (const b of g.bandHash.query(base)) if (b.footprint.y > y - 2) return false;
  for (const dx of [-len / 2, 0, len / 2]) {
    if (!ground.includes(g.gi.kindAt(x + dx, y - 1))) return false;
    if (!ground.includes(g.gi.kindAt(x + dx, y - 6))) return false;
  }
  return true;
}

function driverFor(rng: Rng, kind: VehicleKind) {
  if (kind === 'police') return randomAppearance(rng, 'police');
  if (kind === 'bicycle') return randomAppearance(rng, 'cyclist');
  if (kind === 'scooter') return { ...randomAppearance(rng, 'cyclist'), hat: 'helmet' as const };
  if (kind === 'truck' || kind === 'van') return randomAppearance(rng, rng.chance(0.5) ? 'docker' : 'adult');
  return randomAppearance(rng, rng.chance(0.15) ? 'business' : 'adult');
}

export function placeVehicles(g: Gen): void {
  const rng = makeRng(g.seed, 'vehicles');
  traffic(g, rng);
  parkings(g, rng);
  river(g, rng);
  parkBikes(g, rng);
  parkedBikes(g, rng);
}

/** Vélos garés (sans cycliste) dans les cours et sur les placettes. */
function parkedBikes(g: Gen, rng: Rng): void {
  let n = 0;
  for (const b of g.plan.blocks) {
    if (n >= 16) break;
    if (b.kind !== 'urban' || !rng.chance(0.25)) continue;
    const r = b.rect;
    for (let i = 0; i < 20; i++) {
      const x = r.x + 20 + rng.float() * (r.w - 40);
      const y = r.y + 20 + rng.float() * (r.h - 40);
      if (g.raster.any({ x: x - 14, y: y - 10, w: 28, h: 12 }, F_SOLID | F_ROAD | F_BUILDING | F_HIDDEN | F_PERSON)) continue;
      if (g.gi.kindAt(x, y - 1) !== 'courtyard') continue;
      addVehicle(g, 'bicycle', x, y, rng.chance(0.5) ? 'left' : 'right', rng.pick<Color>(['red', 'blue', 'green', 'yellow', 'black', 'white']));
      n++;
      break;
    }
  }
}

function traffic(g: Gen, rng: Rng): void {
  const streets = g.plan.streets;
  for (const s of streets) {
    if (s.axis !== 'h') continue;
    const rr = s.roadRect;
    const mid = rr.y + rr.h / 2;
    // Intervalles bloqués : carrefours (autres rues) et voie ferrée
    const blocked: [number, number][] = [[200, 320]];
    for (const t of streets) {
      if (t === s || t.axis === 'h') continue;
      const span = convexSpanInBand(t.poly, s.rect.y, s.rect.y + s.rect.h);
      if (span) blocked.push([span[0] - 30, span[1] + 30]);
    }
    const free = (x: number, len: number): boolean => !blocked.some(([a, b]) => x + len / 2 > a && x - len / 2 < b);
    const avenue = s.kind === 'avenue';
    const port = s.kind === 'port';
    const lanes: { y: number; facing: 'left' | 'right'; parked: boolean }[] = [];
    if (avenue || port) {
      lanes.push({ y: mid - 3, facing: 'left', parked: false }, { y: rr.y + rr.h - 3, facing: 'right', parked: false });
    } else {
      // Rue : stationnement d'un côté (pas partout), circulation de l'autre.
      const parkNorth = rng.chance(0.5);
      if (s.kind !== 'lane' && rng.chance(0.36)) lanes.push({ y: parkNorth ? rr.y + 19 : rr.y + rr.h - 1.5, facing: parkNorth ? 'left' : 'right', parked: true });
      lanes.push({ y: parkNorth ? rr.y + rr.h - 2 : mid - 1, facing: parkNorth ? 'right' : 'left', parked: false });
    }
    for (const lane of lanes) {
      let x = rr.x + rng.int(20, 200);
      while (x < rr.x + rr.w - 30) {
        let kind: VehicleKind;
        if (port) kind = rng.weighted([['truck', 45], ['van', 35], ['car', 15], ['bicycle', 5]] as const);
        else if (lane.parked) kind = rng.weighted([['car', 82], ['van', 10], ['taxi', 2], ['scooter', 6]] as const);
        else if (avenue) kind = rng.weighted([['car', 62], ['van', 8], ['taxi', 6], ['bicycle', 7], ['scooter', 6], ['truck', 4], ['bus', 3], ['police', 2], ['ambulance', 1]] as const);
        else kind = rng.weighted([['car', 66], ['van', 8], ['taxi', 4], ['bicycle', 12], ['scooter', 8], ['police', 2]] as const);
        const [len] = VEHICLE_SIZE[kind];
        const cx = x + len / 2;
        if (free(cx, len) && vehicleFits(g, kind, cx, lane.y, ['road', 'bridge'])) {
          const color: Color = kind === 'taxi' ? 'black' : kind === 'police' || kind === 'ambulance' ? 'white' : kind === 'bus' ? rng.pick<Color>(['green', 'blue', 'red']) : rng.weighted(CAR_COLORS);
          const driven = !lane.parked || rng.chance(0.05);
          addVehicle(g, kind, cx, lane.y, lane.facing, color, {
            driver: driven ? driverFor(rng, kind) : undefined,
            label: kind === 'bus' ? `LIGNE ${rng.int(1, 9)}` : kind === 'ambulance' ? 'SAMU' : kind === 'bicycle' ? undefined : plate(rng),
            doorOpen: lane.parked && rng.chance(0.04),
          });
        }
        // Espacement : serré pour le stationnement, aéré pour la circulation.
        x += len + (lane.parked ? (rng.chance(0.35) ? rng.int(80, 300) : rng.int(8, 60)) : avenue ? rng.int(160, 520) : port ? rng.int(180, 700) : rng.int(340, 1300));
      }
    }
  }
}

/** Parkings : îlots « parking » et emplacements dessinés (gare). */
function parkings(g: Gen, rng: Rng): void {
  const lots: Rect[] = [];
  for (const b of g.plan.blocks) if (b.kind === 'parking') lots.push(b.rect);
  for (const sp of g.plan.spots) if (sp.id === 'parking-gare') lots.push(sp.rect);
  for (const r of lots) {
    for (let y = r.y + 34; y < r.y + r.h - 4; y += 46) {
      for (let x = r.x + 30; x + 24 < r.x + r.w; x += 52) {
        if (!rng.chance(0.6)) continue;
        const kind = rng.weighted([['car', 85], ['van', 10], ['taxi', 2], ['police', 1], ['scooter', 2]] as const);
        if (!vehicleFits(g, kind, x, y, ['parking'])) continue;
        addVehicle(g, kind, x, y, rng.chance(0.5) ? 'left' : 'right', kind === 'taxi' ? 'black' : kind === 'police' ? 'white' : rng.weighted(CAR_COLORS), {
          label: plate(rng),
          doorOpen: rng.chance(0.05),
        });
      }
    }
  }
}

/** Bateaux sur la rivière : péniches et barques qui naviguent, bateaux amarrés au quai nord. */
function river(g: Gen, rng: Rng): void {
  let n = 0;
  // Pas de bateau sous un pont : la coque entière doit être sur l'eau.
  const onWater = (x: number, y: number): boolean => [-50, 0, 50].every((dx) => g.gi.kindAt(x + dx, y - 2) === 'water' && g.gi.kindAt(x + dx, y - 30) === 'water');
  for (let x = 500; x < 6300; x += rng.int(500, 900)) {
    const y = rng.int(RIVER.y0 + 80, RIVER.y1 - 30);
    if (g.raster.any({ x: x - 50, y: y - 8, w: 100, h: 10 }, F_SOLID) || !onWater(x, y)) continue;
    addVehicle(g, 'boat', x, y, rng.chance(0.5) ? 'left' : 'right', rng.pick<Color>(['white', 'blue', 'red', 'navy', 'green', 'yellow', 'brown']), {
      label: BOAT_NAMES[(n++ * 5) % BOAT_NAMES.length],
      driver: randomAppearance(rng, rng.chance(0.5) ? 'fisher' : 'adult'),
    });
  }
  // Amarrés le long du quai nord (hors ponts)
  for (let x = 420; x < 4100; x += rng.int(380, 700)) {
    if (Math.abs(x - 2200) < 120) continue;
    const y = RIVER.y0 + 40;
    if (g.raster.any({ x: x - 50, y: y - 8, w: 100, h: 10 }, F_SOLID) || !onWater(x, y)) continue;
    addVehicle(g, 'boat', x, y, rng.chance(0.5) ? 'left' : 'right', rng.pick<Color>(['white', 'green', 'red', 'blue']), { label: BOAT_NAMES[(n++ * 7) % BOAT_NAMES.length] });
  }
}

/** Quelques cyclistes dans les allées du parc. */
function parkBikes(g: Gen, rng: Rng): void {
  const p = rectXY(4400, 160, 6260, 1940);
  let placed = 0;
  for (let i = 0; i < 400 && placed < 10; i++) {
    const x = p.x + rng.float() * p.w;
    const y = p.y + rng.float() * p.h;
    if (!g.raster.all({ x: x - 8, y: y - 3, w: 16, h: 4 }, F_PATH)) continue;
    if (g.raster.any({ x: x - 14, y: y - 6, w: 28, h: 8 }, F_SOLID | F_ROAD)) continue;
    addVehicle(g, 'bicycle', x, y, rng.chance(0.5) ? 'left' : 'right', rng.pick<Color>(['red', 'blue', 'green', 'yellow', 'black']), { driver: driverFor(rng, 'bicycle') });
    placed++;
  }
}
