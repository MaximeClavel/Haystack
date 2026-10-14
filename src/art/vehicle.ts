// Véhicules de profil (face à droite, miroir pour facing = 'left'). Ancre = sol, au milieu.
// Tailles nominales : VEHICLE_SIZE (bounds.ts).

import type { PersonAppearance, VehicleEntity } from '../types';
import { VEHICLE_SIZE } from './bounds';
import type { Lod } from './lod';
import { COLOR_DARK, COLOR_HEX, COLOR_LIGHT, HAIR_HEX, INK, MAT, SKIN_HEX, mix } from './palette';
import { drawHeadOnly, drawRider } from './person';
import type { RideSpec } from './skeleton';
import { fitTextUpright, isPlate } from './text';
import { TAU, type Ctx, boxFS, circleFS, groundShadow, polyFS, quickRand, rboxFS, seedOf } from './util';

const GLASS = '#a9c6d3';
const GLASS_DARK = '#7f9fae';
const BUMPER = '#8f9396';

export function drawVehicle(ctx: Ctx, e: VehicleEntity, lod: Lod): void {
  const x = e.x;
  const y = e.y - (e.z ?? 0);
  const dir = e.facing === 'left' ? -1 : 1;
  const [L, Hh] = VEHICLE_SIZE[e.vehicle];
  const body = COLOR_HEX[e.color];
  if (lod === 2) {
    ctx.fillStyle = e.vehicle === 'police' || e.vehicle === 'ambulance' ? '#f3f0e8' : body;
    if (e.vehicle === 'bicycle' || e.vehicle === 'scooter') ctx.fillRect(x - L * 0.35, y - Hh * 0.7, L * 0.7, Hh * 0.7);
    else if (e.vehicle === 'boat') ctx.fillRect(x - L / 2, y - Hh * 0.45, L, Hh * 0.55);
    else ctx.fillRect(x - L / 2, y - Hh * 0.85, L, Hh * 0.85);
    return;
  }
  const fine = lod === 0;
  ctx.save();
  ctx.translate(x, y);
  if (dir < 0) ctx.scale(-1, 1);
  ctx.strokeStyle = INK;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.lineWidth = fine ? 0.6 : 0.9;
  const v: VCtx = { ctx, e, lod, fine, dir, body, dark: COLOR_DARK[e.color], light: COLOR_LIGHT[e.color], seed: seedOf(e.id) };
  switch (e.vehicle) {
    case 'car':
    case 'taxi':
    case 'police':
      drawCar(v);
      break;
    case 'van':
      drawVan(v, false);
      break;
    case 'ambulance':
      drawVan(v, true);
      break;
    case 'bus':
      drawBus(v);
      break;
    case 'truck':
      drawTruck(v);
      break;
    case 'bicycle':
      drawBicycle(v);
      break;
    case 'scooter':
      drawScooter(v);
      break;
    case 'boat':
      drawBoat(v);
      break;
  }
  ctx.restore();
}

interface VCtx {
  ctx: Ctx;
  e: VehicleEntity;
  lod: Lod;
  fine: boolean;
  dir: number;
  body: string;
  dark: string;
  light: string;
  seed: number;
}

/** Plaque d'immatriculation (5,6 × 1,9 u), coin haut-gauche en (x, y). */
function plateAt(v: VCtx, x: number, y: number, label: string): void {
  const { ctx } = v;
  const lw = ctx.lineWidth;
  ctx.lineWidth = 0.35;
  boxFS(ctx, x, y, 5.6, 1.9, '#f6f3ea');
  ctx.lineWidth = lw;
  fitTextUpright(ctx, v.dir, label, x + 2.8, y + 0.95, 5.0, 1.5, '#203060');
}

function wheel(v: VCtx, cx: number, cy: number, r: number): void {
  const { ctx } = v;
  circleFS(ctx, cx, cy, r, MAT.tire);
  ctx.fillStyle = '#c9cccd';
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.52, 0, TAU);
  ctx.fill();
  if (v.fine) {
    ctx.lineWidth = 0.3;
    ctx.stroke();
    ctx.fillStyle = '#7d8285';
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.18, 0, TAU);
    ctx.fill();
    ctx.lineWidth = 0.6;
  }
}

function arch(v: VCtx, cx: number, cy: number, r: number): void {
  const { ctx } = v;
  ctx.fillStyle = '#3a3330';
  ctx.beginPath();
  ctx.arc(cx, cy, r + 1.1, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
}

/** Tête du conducteur, découpée dans la vitre (path courant = vitre). */
function driverInWindow(v: VCtx, ap: PersonAppearance | undefined, hx: number, hy: number, scale: number): void {
  if (!ap) return;
  const { ctx } = v;
  if (!v.fine) {
    ctx.fillStyle = SKIN_HEX[ap.skin];
    ctx.beginPath();
    ctx.arc(hx, hy, 2.75 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = HAIR_HEX[ap.hairColor];
    ctx.beginPath();
    ctx.arc(hx, hy, 2.75 * scale, Math.PI, 0);
    ctx.fill();
    return;
  }
  ctx.save();
  ctx.clip();
  ctx.translate(hx, hy);
  drawHeadOnly(ctx, ap, v.lod, scale);
  ctx.restore();
}

function glassReflection(v: VCtx, x0: number, y0: number, x1: number, y1: number): void {
  if (!v.fine) return;
  const { ctx } = v;
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.beginPath();
  ctx.moveTo(x0, y1);
  ctx.lineTo(x0 + (y1 - y0) * 0.6, y0);
  ctx.lineTo(x0 + (y1 - y0) * 0.6 + 1.2, y0);
  ctx.lineTo(x0 + 1.2, y1);
  ctx.closePath();
  ctx.fill();
  void x1;
}

/* ----------------------------------------------------------------------------
 * Voiture, taxi, police
 * ------------------------------------------------------------------------- */

function drawCar(v: VCtx): void {
  const { ctx, e, fine } = v;
  const police = e.vehicle === 'police';
  const taxi = e.vehicle === 'taxi';
  const body = police ? '#f4f2ec' : v.body;
  groundShadow(ctx, 0, 0.4, 21.5, 2);
  // carrosserie
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(-21.2, -3.2);
  ctx.lineTo(-21.6, -8.6);
  ctx.quadraticCurveTo(-21.4, -11.4, -18.5, -11.6);
  ctx.lineTo(-13.4, -11.9);
  ctx.lineTo(-9.8, -18.6);
  ctx.quadraticCurveTo(-9.3, -19.2, -8.4, -19.2);
  ctx.lineTo(5.0, -19.2);
  ctx.quadraticCurveTo(6.0, -19.2, 6.6, -18.4);
  ctx.lineTo(11.4, -12.1);
  ctx.lineTo(19.4, -11.1);
  ctx.quadraticCurveTo(21.8, -10.6, 21.8, -8.0);
  ctx.lineTo(21.5, -3.2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // passages de roue
  arch(v, -13.2, -3.6, 3.7);
  arch(v, 13.4, -3.6, 3.7);
  // vitres
  ctx.fillStyle = GLASS;
  ctx.beginPath();
  ctx.moveTo(-12.4, -12.4);
  ctx.lineTo(-9.3, -18.1);
  ctx.lineTo(-2.4, -18.1);
  ctx.lineTo(-2.4, -12.4);
  ctx.closePath();
  ctx.moveTo(-1.2, -12.4);
  ctx.lineTo(-1.2, -18.1);
  ctx.lineTo(5.2, -18.1);
  ctx.lineTo(9.9, -12.4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // conducteur dans la vitre avant
  if (e.driver) {
    ctx.beginPath();
    ctx.moveTo(-1.2, -12.4);
    ctx.lineTo(-1.2, -18.1);
    ctx.lineTo(5.2, -18.1);
    ctx.lineTo(9.9, -12.4);
    ctx.closePath();
    driverInWindow(v, e.driver, 2.6, -14.0, 0.72);
  }
  glassReflection(v, 6.0, -17.5, 9.0, -13);
  // portes
  if (fine) {
    ctx.lineWidth = 0.35;
    ctx.beginPath();
    ctx.moveTo(-1.8, -12.0);
    ctx.lineTo(-1.8, -4.4);
    ctx.moveTo(10.6, -11.6);
    ctx.quadraticCurveTo(10.2, -6, 9.4, -4.4);
    ctx.moveTo(-12.6, -11.6);
    ctx.lineTo(-12.0, -7.6);
    ctx.stroke();
    ctx.fillStyle = v.dark;
    ctx.fillRect(-0.4, -10.3, 2.0, 0.6);
    ctx.fillRect(-11.2, -10.3, 2.0, 0.6);
    ctx.lineWidth = 0.6;
  }
  // bandes de livrée
  if (police) {
    ctx.fillStyle = MAT.policeBlue;
    ctx.fillRect(-21.4, -9.6, 43, 2.8);
    ctx.fillStyle = MAT.red;
    ctx.fillRect(-21.4, -6.8, 43, 0.8);
    fitTextUpright(ctx, v.dir, 'POLICE', 4.4, -8.15, 12, 2.4, '#ffffff');
  }
  if (taxi && fine) {
    // damier
    for (let i = 0; i < 16; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#2b2726' : '#f6f3ea';
      ctx.fillRect(-18 + i * 2.2, -9.3, 2.2, 1.1);
      ctx.fillStyle = i % 2 === 1 ? '#2b2726' : '#f6f3ea';
      ctx.fillRect(-18 + i * 2.2, -8.2, 2.2, 1.1);
    }
  }
  // pare-chocs, phares
  rboxFS(ctx, 19.6, -5.4, 2.8, 1.8, 0.6, BUMPER);
  rboxFS(ctx, -22.4, -5.4, 2.8, 1.8, 0.6, BUMPER);
  ctx.fillStyle = MAT.lamp;
  ctx.beginPath();
  ctx.ellipse(20.6, -8.7, 1.0, 0.8, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = MAT.red;
  ctx.fillRect(-21.7, -10.2, 1.0, 2.0);
  // plaque
  if (fine && e.label && !police) plateAt(v, -20.6, -7.2, e.label);
  // gyrophare / lumineux
  if (police) {
    rboxFS(ctx, -4.5, -21.0, 9, 1.9, 0.5, '#e9e6de');
    ctx.fillStyle = '#2f6fd8';
    ctx.beginPath();
    ctx.ellipse(-2.4, -21.1, 1.6, 1.3, 0, Math.PI, 0);
    ctx.ellipse(2.4, -21.1, 1.6, 1.3, 0, Math.PI, 0);
    ctx.fill();
    ctx.stroke();
    if (fine) {
      ctx.strokeStyle = 'rgba(80,140,255,0.8)';
      ctx.lineWidth = 0.35;
      ctx.beginPath();
      ctx.moveTo(-5, -23.4);
      ctx.lineTo(-6.6, -24.6);
      ctx.moveTo(5, -23.4);
      ctx.lineTo(6.6, -24.6);
      ctx.moveTo(0, -23.4);
      ctx.lineTo(0, -24.7);
      ctx.stroke();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 0.6;
    }
  }
  if (taxi) {
    rboxFS(ctx, -3.6, -23.6, 7.2, 4.0, 0.7, '#fbe9a3');
    fitTextUpright(ctx, v.dir, 'TAXI', 0, -21.6, 6, 2.6, '#2b2726');
  }
  // portière ouverte
  if (e.doorOpen) {
    ctx.fillStyle = '#3a3330';
    ctx.fillRect(-1.6, -12.0, 11.0, 7.4);
    polyFS(ctx, [9.8, -12.2, 14.2, -14.6, 14.2, -5.2, 9.8, -4.6], body);
    ctx.fillStyle = GLASS;
    ctx.beginPath();
    ctx.moveTo(10.4, -12.4);
    ctx.lineTo(13.6, -14.1);
    ctx.lineTo(13.6, -11.2);
    ctx.lineTo(10.4, -9.8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  wheel(v, -13.2, -3.6, 3.6);
  wheel(v, 13.4, -3.6, 3.6);
}

/* ----------------------------------------------------------------------------
 * Fourgon, ambulance
 * ------------------------------------------------------------------------- */

function drawVan(v: VCtx, ambulance: boolean): void {
  const { ctx, e, fine } = v;
  const L = ambulance ? 56 : 52;
  const h = ambulance ? 29 : 27;
  const half = L / 2;
  const body = ambulance ? '#f6f4ee' : v.body;
  groundShadow(ctx, 0, 0.4, half - 0.5, 2);
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(-half + 0.4, -3.4);
  ctx.lineTo(-half, -h + 1.5);
  ctx.quadraticCurveTo(-half, -h, -half + 1.5, -h);
  ctx.lineTo(half - 13, -h);
  ctx.quadraticCurveTo(half - 11.5, -h, half - 10.5, -h + 1.2);
  ctx.lineTo(half - 4.5, -14.2);
  ctx.quadraticCurveTo(half, -13.2, half, -10);
  ctx.lineTo(half - 0.3, -3.4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  arch(v, -half + 11, -3.8, 4);
  arch(v, half - 10, -3.8, 4);
  // pare-brise et vitre de cabine
  ctx.fillStyle = GLASS;
  ctx.beginPath();
  ctx.moveTo(half - 11.3, -h + 2);
  ctx.lineTo(half - 5.4, -14.8);
  ctx.lineTo(half - 11.3, -14.8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  if (e.driver) {
    ctx.beginPath();
    ctx.moveTo(half - 11.3, -h + 2);
    ctx.lineTo(half - 5.4, -14.8);
    ctx.lineTo(half - 11.3, -14.8);
    ctx.closePath();
    driverInWindow(v, e.driver, half - 9.6, -17.2, 0.7);
  }
  // séparation cabine / caisse
  ctx.beginPath();
  ctx.moveTo(half - 13, -h + 0.4);
  ctx.lineTo(half - 13, -4.5);
  ctx.stroke();
  if (ambulance) {
    ctx.fillStyle = MAT.red;
    ctx.fillRect(-half + 0.4, -12.8, L - 1.2, 2.6);
    // croix
    const cx = -half + 18;
    const cy = -20;
    boxFS(ctx, cx - 4.6, cy - 4.6, 9.2, 9.2, '#ffffff');
    ctx.fillStyle = MAT.red;
    ctx.fillRect(cx - 3.6, cy - 1.2, 7.2, 2.4);
    ctx.fillRect(cx - 1.2, cy - 3.6, 2.4, 7.2);
    if (fine) fitTextUpright(ctx, v.dir, 'AMBULANCE', -6, -11.4, 30, 2.1, '#ffffff');
    if (e.label && !isPlate(e.label)) fitTextUpright(ctx, v.dir, e.label, 4.5, -20, 17, 5, MAT.red);
    // gyrophares
    ctx.fillStyle = '#2f6fd8';
    ctx.beginPath();
    ctx.ellipse(half - 14, -h - 0.2, 1.7, 1.4, 0, Math.PI, 0);
    ctx.ellipse(-half + 3, -h - 0.2, 1.7, 1.4, 0, Math.PI, 0);
    ctx.fill();
    ctx.stroke();
  } else {
    // porte coulissante et enseigne peinte
    if (fine) {
      ctx.lineWidth = 0.35;
      ctx.beginPath();
      ctx.moveTo(-4, -h + 2);
      ctx.lineTo(-4, -4.5);
      ctx.moveTo(8, -h + 2);
      ctx.lineTo(8, -4.5);
      ctx.stroke();
      ctx.fillStyle = v.dark;
      ctx.fillRect(5.5, -14.5, 2, 0.6);
      ctx.lineWidth = 0.6;
    }
    if (e.label && !isPlate(e.label)) {
      const lc = COLOR_HEX[e.color] && ['white', 'beige', 'yellow', 'pink'].includes(e.color) ? '#283f78' : '#fbf6ea';
      fitTextUpright(ctx, v.dir, e.label, -half + 18, -18, 26, 4.5, lc);
    } else if (fine) {
      ctx.fillStyle = v.light;
      ctx.fillRect(-half + 3, -h + 4, L - 20, 2);
    }
  }
  if (e.doorOpen) {
    ctx.fillStyle = '#3a3330';
    ctx.fillRect(-4, -h + 2.5, 11.5, h - 7);
  }
  rboxFS(ctx, half - 1.8, -6, 2.6, 2.0, 0.6, BUMPER);
  rboxFS(ctx, -half - 0.8, -6, 2.6, 2.0, 0.6, BUMPER);
  if (fine && e.label && isPlate(e.label)) plateAt(v, -half + 1.2, -8.6, e.label);
  ctx.fillStyle = MAT.lamp;
  ctx.beginPath();
  ctx.ellipse(half - 1.0, -10.6, 0.9, 0.9, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = MAT.red;
  ctx.fillRect(-half - 0.2, -12, 1, 2.4);
  wheel(v, -half + 11, -3.8, 3.9);
  wheel(v, half - 10, -3.8, 3.9);
}

/* ----------------------------------------------------------------------------
 * Bus
 * ------------------------------------------------------------------------- */

const PASSENGER_SKIN = ['#f8e0cd', '#efc6a1', '#d39b6b', '#a76b48', '#6e4632'];
const PASSENGER_HAIR = ['#2b2421', '#714529', '#e6c25f', '#c65a26', '#9d9890'];
const PASSENGER_TOP = ['#cc4238', '#4b92dc', '#3f9e55', '#f0cb3f', '#8d55ad', '#ec8b2f', '#283f78'];

function drawBus(v: VCtx): void {
  const { ctx, e, fine } = v;
  groundShadow(ctx, 0, 0.4, 49.5, 2.2);
  rboxFS(ctx, -50, -33.5, 100, 29.6, 2.8, v.body);
  // bande claire
  ctx.fillStyle = MAT.cream;
  ctx.fillRect(-49.6, -15.6, 99.2, 2.8);
  arch(v, -32, -4.4, 4.5);
  arch(v, 33, -4.4, 4.5);
  // vitres latérales + passagers
  const rnd = quickRand(v.seed);
  for (let i = 0; i < 8; i++) {
    const wx = -45 + i * 9.6;
    ctx.fillStyle = GLASS;
    ctx.beginPath();
    ctx.rect(wx, -29.5, 8.2, 11);
    ctx.fill();
    if (rnd() < 0.72) {
      const hx = wx + 3 + rnd() * 2.4;
      // passager : buste + tête
      ctx.fillStyle = PASSENGER_TOP[Math.floor(rnd() * PASSENGER_TOP.length)];
      ctx.beginPath();
      ctx.ellipse(hx, -19.4, 2.6, 2.0, 0, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = PASSENGER_SKIN[Math.floor(rnd() * PASSENGER_SKIN.length)];
      ctx.beginPath();
      ctx.arc(hx, -23.4, 2.1, 0, TAU);
      ctx.fill();
      if (fine) {
        ctx.lineWidth = 0.4;
        ctx.stroke();
        ctx.fillStyle = PASSENGER_HAIR[Math.floor(rnd() * PASSENGER_HAIR.length)];
        ctx.beginPath();
        ctx.arc(hx, -23.4, 2.2, Math.PI * 1.05, Math.PI * 1.95);
        ctx.fill();
        ctx.fillStyle = INK;
        ctx.beginPath();
        ctx.arc(hx + 0.9, -23.4, 0.25, 0, TAU);
        ctx.fill();
        ctx.lineWidth = 0.6;
      }
    }
    ctx.beginPath();
    ctx.rect(wx, -29.5, 8.2, 11);
    ctx.stroke();
  }
  // pare-brise, conducteur
  ctx.fillStyle = GLASS;
  ctx.beginPath();
  ctx.moveTo(32.8, -29.5);
  ctx.lineTo(48.4, -29.5);
  ctx.lineTo(49.0, -17.8);
  ctx.lineTo(32.8, -17.8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  if (e.driver) {
    ctx.beginPath();
    ctx.rect(33, -29.3, 15.6, 11.3);
    driverInWindow(v, e.driver, 42.5, -22.6, 0.75);
  }
  glassReflection(v, 44.5, -28.8, 47, -19);
  // porte
  boxFS(ctx, 34, -16.4, 8.6, 12.2, GLASS_DARK);
  if (fine) {
    ctx.lineWidth = 0.35;
    ctx.beginPath();
    ctx.moveTo(38.3, -16.4);
    ctx.lineTo(38.3, -4.2);
    ctx.stroke();
    ctx.lineWidth = 0.6;
  }
  // girouette
  boxFS(ctx, 20, -33.2, 27, 3.4, '#2b2726');
  if (e.label) fitTextUpright(ctx, v.dir, e.label, 33.5, -31.5, 25, 2.6, '#ffb23a');
  rboxFS(ctx, 48.6, -8, 2.4, 3.6, 0.6, BUMPER);
  ctx.fillStyle = MAT.lamp;
  ctx.beginPath();
  ctx.ellipse(49.2, -11.2, 0.9, 1.0, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  wheel(v, -32, -4.4, 4.3);
  wheel(v, 33, -4.4, 4.3);
}

/* ----------------------------------------------------------------------------
 * Camion
 * ------------------------------------------------------------------------- */

function drawTruck(v: VCtx): void {
  const { ctx, e, fine } = v;
  groundShadow(ctx, 0, 0.4, 39.5, 2.2);
  // châssis
  ctx.fillStyle = '#3c3836';
  ctx.fillRect(-39, -8, 76, 3);
  // caisse
  const box = ['white', 'beige', 'yellow'].includes(e.color) ? v.body : mix(v.body, '#ffffff', 0.12);
  boxFS(ctx, -40, -32, 60, 24.5, box);
  if (fine) {
    ctx.strokeStyle = v.dark;
    ctx.lineWidth = 0.3;
    ctx.beginPath();
    for (let x = -36; x < 20; x += 6) {
      ctx.moveTo(x, -31.5);
      ctx.lineTo(x, -8);
    }
    ctx.stroke();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 0.6;
  }
  if (e.label && !isPlate(e.label)) {
    boxFS(ctx, -34, -26, 48, 10, '#fbf6ea');
    fitTextUpright(ctx, v.dir, e.label, -10, -21, 44, 6.5, v.dark);
  } else if (fine && e.label) plateAt(v, -39.4, -10.6, e.label);
  // cabine
  ctx.fillStyle = v.body;
  ctx.beginPath();
  ctx.moveTo(21, -4.5);
  ctx.lineTo(21, -26);
  ctx.quadraticCurveTo(21, -27.5, 22.5, -27.5);
  ctx.lineTo(32, -27.5);
  ctx.lineTo(38.5, -16);
  ctx.quadraticCurveTo(40, -14.5, 40, -12);
  ctx.lineTo(40, -4.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  arch(v, -28, -4.2, 4.2);
  arch(v, -17.5, -4.2, 4.2);
  arch(v, 30, -4.2, 4.2);
  ctx.fillStyle = GLASS;
  ctx.beginPath();
  ctx.moveTo(24, -25.5);
  ctx.lineTo(31.2, -25.5);
  ctx.lineTo(36.6, -16.5);
  ctx.lineTo(24, -16.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  if (e.driver) {
    ctx.beginPath();
    ctx.moveTo(24, -25.5);
    ctx.lineTo(31.2, -25.5);
    ctx.lineTo(36.6, -16.5);
    ctx.lineTo(24, -16.5);
    ctx.closePath();
    driverInWindow(v, e.driver, 29.5, -19.5, 0.72);
  }
  rboxFS(ctx, 38.6, -7, 2.6, 2.4, 0.6, BUMPER);
  ctx.fillStyle = MAT.lamp;
  ctx.beginPath();
  ctx.ellipse(39.4, -11.2, 0.9, 0.9, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  wheel(v, -28, -4.2, 4.0);
  wheel(v, -17.5, -4.2, 4.0);
  wheel(v, 30, -4.2, 4.0);
}

/* ----------------------------------------------------------------------------
 * Vélo, scooter (avec pilote)
 * ------------------------------------------------------------------------- */

const BIKE_SPEC: RideSpec = {
  hip: { x: -3.0, y: -11.6 },
  lean: 30,
  feet: [
    { x: -1.0, y: -2.6 },
    { x: 1.4, y: -5.0 },
  ],
  hands: [
    { x: 4.2, y: -12.4 },
    { x: 4.8, y: -12.6 },
  ],
};

const SCOOTER_SPEC: RideSpec = {
  hip: { x: -4.6, y: -12.2 },
  lean: 6,
  feet: [
    { x: 0.6, y: -4.2 },
    { x: 2.0, y: -4.2 },
  ],
  hands: [
    { x: 5.4, y: -15.6 },
    { x: 6.0, y: -15.8 },
  ],
};

function spokeWheel(v: VCtx, cx: number, cy: number, r: number): void {
  const { ctx } = v;
  ctx.lineWidth = 0.9;
  ctx.strokeStyle = MAT.tire;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, TAU);
  ctx.stroke();
  if (v.fine) {
    ctx.lineWidth = 0.18;
    ctx.strokeStyle = '#6d7275';
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI;
      ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      ctx.lineTo(cx - Math.cos(a) * r, cy - Math.sin(a) * r);
    }
    ctx.stroke();
  }
  ctx.strokeStyle = INK;
  ctx.lineWidth = 0.6;
}

function drawBicycle(v: VCtx): void {
  const { ctx, e } = v;
  groundShadow(ctx, 0, 0.3, 10, 1.4);
  const ap = e.driver;
  if (ap) drawRider(ctx, ap, 'bicycle', BIKE_SPEC, v.lod, 'back');
  spokeWheel(v, -6.4, -3.4, 3.4);
  spokeWheel(v, 6.4, -3.4, 3.4);
  // cadre
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.1;
  const frame = [-6.4, -3.4, -1.0, -3.8, -2.6, -10.4, 4.4, -10.0, -1.0, -3.8];
  ctx.beginPath();
  ctx.moveTo(frame[0], frame[1]);
  for (let i = 2; i < frame.length; i += 2) ctx.lineTo(frame[i], frame[i + 1]);
  ctx.moveTo(-6.4, -3.4);
  ctx.lineTo(-2.6, -10.4);
  ctx.moveTo(4.4, -10.0);
  ctx.lineTo(6.4, -3.4);
  ctx.moveTo(4.4, -10.0);
  ctx.lineTo(4.0, -12.4);
  ctx.stroke();
  ctx.strokeStyle = v.body;
  ctx.lineWidth = 0.55;
  ctx.stroke();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 0.6;
  // selle, guidon
  rboxFS(ctx, -4.6, -11.4, 3.6, 1.1, 0.5, '#2f2a28');
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(3.2, -12.6);
  ctx.lineTo(5.4, -12.8);
  ctx.stroke();
  ctx.lineWidth = 0.6;
  // pédalier
  circleFS(ctx, -1.0, -3.8, 0.9, '#8f9396');
  if (ap) drawRider(ctx, ap, 'bicycle', BIKE_SPEC, v.lod, 'front');
  else {
    // béquille
    ctx.beginPath();
    ctx.moveTo(-1.0, -3.8);
    ctx.lineTo(-2.4, 0);
    ctx.stroke();
  }
}

function drawScooter(v: VCtx): void {
  const { ctx, e, fine } = v;
  groundShadow(ctx, 0, 0.3, 10.5, 1.4);
  const ap = e.driver;
  if (ap) drawRider(ctx, ap, 'scooter', SCOOTER_SPEC, v.lod, 'back');
  // coque arrière
  ctx.fillStyle = v.body;
  ctx.beginPath();
  ctx.moveTo(-10.4, -4.5);
  ctx.quadraticCurveTo(-11.4, -10.8, -6.0, -11.0);
  ctx.lineTo(-1.6, -10.6);
  ctx.quadraticCurveTo(-0.6, -7.5, -1.2, -4.6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // plancher
  boxFS(ctx, -1.8, -4.8, 6.6, 1.4, '#4a4442');
  // tablier avant
  ctx.fillStyle = v.body;
  ctx.beginPath();
  ctx.moveTo(4.2, -4.0);
  ctx.lineTo(5.0, -14.2);
  ctx.quadraticCurveTo(6.4, -14.6, 7.0, -13.8);
  ctx.quadraticCurveTo(8.4, -8, 8.6, -4.6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // selle
  rboxFS(ctx, -9.6, -12.4, 7.2, 1.7, 0.8, '#3a302c');
  // guidon et phare
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(5.6, -14.4);
  ctx.lineTo(6.2, -16.2);
  ctx.moveTo(4.9, -16.0);
  ctx.lineTo(7.2, -16.4);
  ctx.stroke();
  ctx.lineWidth = 0.6;
  ctx.fillStyle = MAT.lamp;
  ctx.beginPath();
  ctx.arc(7.3, -15.0, 0.9, 0, TAU);
  ctx.fill();
  ctx.stroke();
  if (fine) {
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.ellipse(-7.5, -9.2, 1.6, 0.7, -0.2, 0, TAU);
    ctx.fill();
  }
  wheel(v, -7.4, -2.9, 2.8);
  wheel(v, 7.6, -2.9, 2.8);
  if (ap) drawRider(ctx, ap, 'scooter', SCOOTER_SPEC, v.lod, 'front');
}

/* ----------------------------------------------------------------------------
 * Bateau
 * ------------------------------------------------------------------------- */

function drawBoat(v: VCtx): void {
  const { ctx, e, fine } = v;
  // reflet / rides sous la coque
  ctx.fillStyle = 'rgba(60, 100, 120, 0.18)';
  ctx.beginPath();
  ctx.ellipse(0, 3.2, 44, 3.6, 0, 0, TAU);
  ctx.fill();
  // cabine
  const cabin = '#f6f3ea';
  boxFS(ctx, -22, -24, 26, 12.5, cabin);
  rboxFS(ctx, -24, -26.5, 30, 3, 0.8, v.dark);
  // hublots / vitres
  ctx.fillStyle = GLASS;
  ctx.beginPath();
  ctx.rect(-19, -21.5, 6.5, 5.5);
  ctx.rect(-10.5, -21.5, 6.5, 5.5);
  ctx.moveTo(-2, -21.5);
  ctx.lineTo(3.5, -21.5);
  ctx.lineTo(3.5, -16);
  ctx.lineTo(-2, -16);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  if (e.driver) {
    ctx.beginPath();
    ctx.rect(-2, -21.5, 5.5, 5.5);
    driverInWindow(v, e.driver, 0.8, -18.2, 0.62);
  }
  // mât et fanion
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(-14, -26.5);
  ctx.lineTo(-14, -37);
  ctx.stroke();
  polyFS(ctx, [-14, -37, -8.5, -35.6, -14, -34.2], MAT.red);
  // coque
  ctx.fillStyle = v.body;
  ctx.beginPath();
  ctx.moveTo(-44.5, -11.5);
  ctx.lineTo(38, -11.5);
  ctx.quadraticCurveTo(43, -12, 45.5, -15.5);
  ctx.quadraticCurveTo(43, -2, 32, 4.6);
  ctx.lineTo(-38, 4.6);
  ctx.quadraticCurveTo(-43.5, 2, -44.5, -11.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // liston blanc et nom
  ctx.fillStyle = '#f6f3ea';
  ctx.beginPath();
  ctx.moveTo(-44.2, -10.0);
  ctx.lineTo(40.5, -10.0);
  ctx.lineTo(41.3, -8.6);
  ctx.lineTo(-44.0, -8.6);
  ctx.closePath();
  ctx.fill();
  if (e.label) {
    const light = ['white', 'beige', 'yellow', 'pink'].includes(e.color);
    fitTextUpright(ctx, v.dir, e.label, -4, -4.2, 46, 5.2, light ? '#283f78' : '#fbf6ea');
  }
  // ligne de flottaison (sous l'eau : voile translucide)
  ctx.fillStyle = 'rgba(120, 170, 190, 0.55)';
  ctx.beginPath();
  ctx.moveTo(-40, 0.2);
  ctx.lineTo(39.5, 0.2);
  ctx.quadraticCurveTo(36, 3.2, 32, 4.6);
  ctx.lineTo(-38, 4.6);
  ctx.quadraticCurveTo(-40, 3, -40, 0.2);
  ctx.closePath();
  ctx.fill();
  if (fine) {
    ctx.strokeStyle = '#e8f3f6';
    ctx.lineWidth = 0.45;
    ctx.beginPath();
    for (const [x0, y0, w] of [
      [-46, 6.2, 9],
      [-30, 6.6, 12],
      [-8, 6.2, 10],
      [16, 6.6, 12],
      [36, 6.0, 8],
    ]) {
      ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo(x0 + w / 2, y0 - 0.9, x0 + w, y0);
    }
    ctx.stroke();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 0.6;
    // bouée
    ctx.lineWidth = 1.0;
    ctx.strokeStyle = MAT.red;
    ctx.beginPath();
    ctx.arc(-17, -14.4, 1.6, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 0.6;
  }
}

