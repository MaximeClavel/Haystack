// Overlays d'une enquête, calculés depuis la session (fonctions pures, sans DOM).
import type { Circle, Entity, HintResult, Overlay, Pick, Rect, World } from '../../../types';
import { getEntityBounds, getHitRect } from '../../../art';
import { targetRect, type CaseSession } from '../../../game';

/** Réponses trouvées : cadre vert. */
export function foundOverlays(session: CaseSession, world: World): Overlay[] {
  const out: Overlay[] = [];
  for (const m of session.foundMarks()) {
    const r = targetRect(world, m.id);
    if (r) out.push({ kind: 'box', rect: r, style: 'found' });
  }
  return out;
}

export function threadOverlays(session: CaseSession): Overlay[] {
  return session.threads().map((t) => ({ kind: 'thread', from: t.from, to: t.to }));
}

export function pinOverlays(session: CaseSession): Overlay[] {
  return session.pins().map((p, i) => ({ kind: 'pin', at: p, label: String(i + 1) }));
}

/** Indice courant : projecteur (niveau 2) ou révélation (niveau 3). */
export function hintOverlays(h: HintResult | null, world: World): Overlay[] {
  if (!h) return [];
  if (h.level === 2 && h.area) return [{ kind: 'spotlight', circle: h.area }];
  if (h.level === 3) {
    // Révélation : un anneau doré (pulsant) autour de chaque réponse montrée.
    const out: Overlay[] = [];
    for (const id of h.reveal ?? []) {
      const r = targetRect(world, id);
      if (r)
        out.push({
          kind: 'ring',
          circle: { x: r.x + r.w / 2, y: r.y + r.h / 2, radius: Math.hypot(r.w, r.h) / 2 + 4 },
          style: 'reveal',
        });
    }
    if (out.length === 0 && h.area) out.push({ kind: 'ring', circle: h.area, style: 'reveal' });
    return out;
  }
  return [];
}

/** Cercle autour de ce qui a été désigné (anneaux de retour : faux, fausse piste…). */
export function pickCircle(world: World, pick: Pick, zoom: number): Circle {
  const e = pick.entityId ? world.byId.get(pick.entityId) : undefined;
  if (e) {
    const r = getHitRect(e);
    return { x: r.x + r.w / 2, y: r.y + r.h / 2, radius: Math.hypot(r.w, r.h) / 2 + 3 };
  }
  return { x: pick.point.x, y: pick.point.y, radius: 12 / Math.max(0.1, zoom) };
}

/** Marque de sélection (feuille de confirmation ouverte). */
export function selectOverlay(world: World, pick: Pick, zoom: number): Overlay {
  const e = pick.entityId ? world.byId.get(pick.entityId) : undefined;
  if (e) return { kind: 'box', rect: getHitRect(e), style: 'select' };
  return { kind: 'ring', circle: pickCircle(world, pick, zoom), style: 'select' };
}

/**
 * Rectangle monde montré dans la vignette de confirmation : la cible, bien zoomée. Le zoom suit le
 * rectangle de désignation (le corps), mais la vue est centrée sur l'emprise VISUELLE : parapluie,
 * haut-de-forme, cheminée ou bulle dépassent du corps, et une vue centrée sur le corps les rognait.
 * Comme tout le dessin tient dans `getEntityBounds`, la vue contient toujours l'emprise entière.
 */
export function thumbRect(entity: Entity | null, point: { x: number; y: number }): Rect {
  const MIN_W = 52;
  const MIN_H = 39;
  if (!entity) return { x: point.x - MIN_W / 2, y: point.y - MIN_H / 2, w: MIN_W, h: MIN_H };
  const r = getHitRect(entity);
  const b = getEntityBounds(entity);
  const w = Math.max(MIN_W, r.w * 1.4, b.w);
  const h = Math.max(MIN_H, r.h * 1.4, b.h);
  return { x: b.x + b.w / 2 - w / 2, y: b.y + b.h / 2 - h / 2, w, h };
}

/** Rectangle englobant d'un cercle. */
export function circleRect(c: Circle): Rect {
  return { x: c.x - c.radius, y: c.y - c.radius, w: 2 * c.radius, h: 2 * c.radius };
}

/** Rectangle englobant de toutes les réponses trouvées (cadrage de fin). */
export function foundBounds(session: CaseSession, world: World): Rect | null {
  let r: Rect | null = null;
  for (const m of session.foundMarks()) {
    const t = targetRect(world, m.id);
    if (!t) continue;
    if (!r) r = { ...t };
    else {
      const x = Math.min(r.x, t.x);
      const y = Math.min(r.y, t.y);
      r = { x, y, w: Math.max(r.x + r.w, t.x + t.w) - x, h: Math.max(r.y + r.h, t.y + t.h) - y };
    }
  }
  return r;
}

/**
 * Dernière réponse trouvée, dans l'ordre chronologique (étapes résolues par `solvedAt` croissant ;
 * une étape en cours, par exemple 3 aiguilles sur 10, passe après les résolues). Sert à reprendre
 * une enquête là où le joueur s'est arrêté. `null` si rien n'a été trouvé.
 */
export function lastFoundId(session: CaseSession): string | null {
  let best: { id: string; at: number } | null = null;
  for (const step of session.def.steps) {
    const p = session.stepProgress(step.id);
    if (p.found.length === 0) continue;
    const at = p.solvedAt ?? Number.MAX_SAFE_INTEGER;
    // Égalité : l'étape la plus loin dans le tableau (la suite de l'histoire) l'emporte.
    if (!best || at >= best.at) best = { id: p.found[p.found.length - 1], at };
  }
  return best?.id ?? null;
}
