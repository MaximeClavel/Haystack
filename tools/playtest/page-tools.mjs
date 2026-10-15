// Gestes et lecture de l'interface, côté navigateur (Playwright). Utilisé par le démon (daemon.mjs)
// et par le test de l'outil (selftest.mjs). Voir tools/playtest/README.md et
// docs/journal/phase3-outil-playtest.md.
//
// Principe ANTI-TRICHE : ce module ne lit QUE ce qu'un joueur voit — le texte visible de l'interface
// (DOM rendu), les libellés des boutons et un résumé chiffré de la sauvegarde (nombres seulement).
// Il ne touche jamais à window.__haystack (absent hors ?debug), ne renvoie aucun attribut data-*,
// aucune coordonnée du monde, aucun identifiant d'entité.

import { devices } from '@playwright/test';

/** Clé de sauvegarde du jeu (src/config.ts : STORAGE_KEY). */
export const STORAGE_KEY = 'haystack:v1';

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ----------------------------------------------------------------------------
 * Appareils émulés
 * ------------------------------------------------------------------------- */

export const DEVICE_PRESETS = {
  pixel7: { label: 'Pixel 7', width: 412, height: 915, dpr: 2.625 },
  small: { label: 'petit téléphone', width: 390, height: 844, dpr: 2 },
};

/** { width, height, dpr, label } à partir des options (--device, --width, --height, --dpr). */
export function resolveDevice(flags = {}) {
  const name = String(flags.device ?? 'pixel7').toLowerCase();
  const base = DEVICE_PRESETS[name];
  if (!base) throw new Error(`appareil inconnu « ${name} » (pixel7 ou small)`);
  const num = (v, fallback) => (v === undefined || v === true ? fallback : Number(v));
  const d = {
    label: base.label,
    width: num(flags.width, base.width),
    height: num(flags.height, base.height),
    dpr: num(flags.dpr, base.dpr),
  };
  for (const k of ['width', 'height', 'dpr']) if (!Number.isFinite(d[k]) || d[k] <= 0) throw new Error(`valeur invalide pour --${k}`);
  if (d.width < 280 || d.width > 900 || d.height < 480 || d.height > 1600) throw new Error('taille d\'écran hors limites (280–900 × 480–1600)');
  return d;
}

/** Options de contexte Playwright d'un téléphone (profil Pixel 7, taille et densité surchargées). */
export function contextOptionsFor(device) {
  return {
    ...devices['Pixel 7'],
    viewport: { width: device.width, height: device.height },
    deviceScaleFactor: device.dpr,
    locale: 'fr-FR',
    serviceWorkers: 'block',
  };
}

/**
 * Script injecté dans la page avant tout autre : note chaque message passager (toast) qui apparaît,
 * pour qu'une commande puisse le rapporter même s'il a disparu entre-temps. Ne crée AUCUNE API
 * utilisable depuis l'interface du jeu.
 */
export function toastRecorder() {
  const seen = (window.__ptToasts = []);
  const note = (el) => {
    const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
    if (text) seen.push({ at: Date.now(), text });
  };
  const watch = () => {
    new MutationObserver((muts) => {
      for (const m of muts) {
        for (const n of m.addedNodes) {
          if (n.nodeType !== 1) continue;
          const el = n.classList && n.classList.contains('toast') ? n : n.querySelector && n.querySelector('.toast');
          if (el) note(el);
        }
      }
    }).observe(document.documentElement, { childList: true, subtree: true });
  };
  if (document.documentElement) watch();
  else document.addEventListener('DOMContentLoaded', watch);
}

/* ----------------------------------------------------------------------------
 * Gestes tactiles
 * ------------------------------------------------------------------------- */

const touchPoints = (points) => points.map((p, k) => ({ x: p.x, y: p.y, id: p.id ?? k, radiusX: 2, radiusY: 2, force: 1 }));
const touch = (cdp, type, points) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: touchPoints(points) });

/** Erreur utilisateur (message clair destiné au joueur test). */
export class GestureError extends Error {}

export function viewportOf(page) {
  const v = page.viewportSize();
  return { w: v?.width ?? 412, h: v?.height ?? 915 };
}

function assertOnScreen(page, points) {
  const { w, h } = viewportOf(page);
  for (const [name, p] of points) {
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) throw new GestureError(`${name} : coordonnées invalides`);
    if (p.x < 0 || p.y < 0 || p.x > w || p.y > h) {
      throw new GestureError(`${name} (${Math.round(p.x)}, ${Math.round(p.y)}) est hors de l'écran (${w}×${h} px, origine en haut à gauche)`);
    }
  }
}

/** Attend (1,5 s au plus) la disparition du voile anti-double-tap que l'interface pose après une feuille. */
async function waitNoGuard(page) {
  await page.waitForFunction(() => !document.querySelector('.tap-guard'), null, { timeout: 1500, polling: 40 }).catch(() => {});
}

export async function tapAt(page, x, y) {
  assertOnScreen(page, [['tap', { x, y }]]);
  await waitNoGuard(page);
  await page.touchscreen.tap(x, y);
}

export async function doubleTapAt(page, x, y) {
  assertOnScreen(page, [['dtap', { x, y }]]);
  await waitNoGuard(page);
  await page.touchscreen.tap(x, y);
  await sleep(70);
  await page.touchscreen.tap(x, y);
}

/**
 * Glisser d'un doigt. Par défaut le doigt s'arrête 90 ms avant de se lever : pas d'élan (le déplacement
 * est celui du doigt, exactement). `fling: true` lève le doigt en mouvement (inertie).
 */
export async function dragTouch(page, cdp, from, to, ms = 400, fling = false) {
  assertOnScreen(page, [['départ', from], ['arrivée', to]]);
  if (!(ms >= 80 && ms <= 5000)) throw new GestureError('la durée du glissé doit être comprise entre 80 et 5000 ms');
  await waitNoGuard(page);
  const steps = Math.max(3, Math.round(ms / 16));
  const t0 = performance.now();
  await touch(cdp, 'touchStart', [from]);
  for (let k = 1; k <= steps; k++) {
    const wait = t0 + (k * ms) / steps - performance.now();
    if (wait > 0) await sleep(wait);
    const u = k / steps;
    await touch(cdp, 'touchMove', [{ x: from.x + (to.x - from.x) * u, y: from.y + (to.y - from.y) * u }]);
  }
  if (!fling) await sleep(90);
  await touch(cdp, 'touchEnd', []);
}

/**
 * Pincement centré sur (x, y), deux doigts côte à côte à l'horizontale. factor > 1 : on écarte les doigts
 * (zoom avant), factor < 1 : on les rapproche (zoom arrière). Les doigts doivent tenir à l'écran :
 * l'écartement est borné en conséquence (le facteur réellement appliqué est renvoyé).
 */
export async function pinchTouch(page, cdp, center, factor, ms = 500) {
  assertOnScreen(page, [['centre du pincement', center]]);
  if (!(factor > 0.1 && factor < 10)) throw new GestureError('le facteur de pincement doit être compris entre 0,1 et 10');
  if (!(ms >= 100 && ms <= 5000)) throw new GestureError('la durée du pincement doit être comprise entre 100 et 5000 ms');
  const { w } = viewportOf(page);
  const room = Math.max(40, 2 * Math.min(center.x, w - center.x) - 16);
  let d0;
  let d1;
  if (factor >= 1) {
    d1 = Math.min(room, 330);
    d0 = Math.max(24, d1 / factor);
    // Facteur trop grand pour tenir à l'écran : on part du plus petit écartement possible.
    if (d1 / d0 > factor) d1 = d0 * factor;
  } else {
    d0 = Math.min(room, 330);
    d1 = Math.max(24, d0 * factor);
  }
  const applied = d1 / d0;
  await waitNoGuard(page);
  const pts = (d) => [
    { x: center.x - d / 2, y: center.y, id: 1 },
    { x: center.x + d / 2, y: center.y, id: 2 },
  ];
  const steps = Math.max(4, Math.round(ms / 16));
  const t0 = performance.now();
  await touch(cdp, 'touchStart', pts(d0));
  for (let k = 1; k <= steps; k++) {
    const wait = t0 + (k * ms) / steps - performance.now();
    if (wait > 0) await sleep(wait);
    await touch(cdp, 'touchMove', pts(d0 + (d1 - d0) * (k / steps)));
  }
  await sleep(80);
  await touch(cdp, 'touchEnd', []);
  return applied;
}

/* ----------------------------------------------------------------------------
 * Attente que la carte se stabilise
 * ------------------------------------------------------------------------- */

/**
 * Attend que le canevas de la carte ne change plus (vol de caméra, inertie, rendu des tuiles), puis
 * un court délai pour les animations de l'interface. Renvoie la durée d'attente (ms). Borné par `maxMs`.
 */
export async function settle(page, { maxMs = 3500, quietMs = 260 } = {}) {
  const t0 = Date.now();
  await sleep(120);
  await page
    .evaluate(
      ({ maxMs, quietMs }) =>
        new Promise((resolve) => {
          const map = document.getElementById('map');
          if (!map || !map.width) return resolve(0);
          const s = document.createElement('canvas');
          s.width = 28;
          s.height = 48;
          const x = s.getContext('2d', { willReadFrequently: true });
          x.imageSmoothingQuality = 'high';
          const sample = () => {
            x.drawImage(map, 0, 0, s.width, s.height);
            return x.getImageData(0, 0, s.width, s.height).data;
          };
          let prev = sample();
          let stableSince = performance.now();
          const start = stableSince;
          const tick = () => {
            const cur = sample();
            let diff = 0;
            for (let i = 0; i < cur.length; i += 4) diff += Math.abs(cur[i] - prev[i]) + Math.abs(cur[i + 1] - prev[i + 1]) + Math.abs(cur[i + 2] - prev[i + 2]);
            prev = cur;
            const now = performance.now();
            if (diff > 60) stableSince = now;
            if (now - stableSince >= quietMs || now - start >= maxMs) return resolve(now - start);
            setTimeout(tick, 60);
          };
          setTimeout(tick, 60);
        }),
      { maxMs, quietMs },
    )
    .catch(() => {});
  await sleep(160);
  return Date.now() - t0;
}

/* ----------------------------------------------------------------------------
 * Lecture de l'interface (texte visible, boutons)
 * ------------------------------------------------------------------------- */

/** Fonction exécutée DANS la page : lit le texte visible et les boutons de l'interface. */
function readInterface() {
  const root = document.querySelector('.ui-root');
  if (!root) return { ready: false, regions: {}, buttons: [], phase: null, place: '', dots: null, title: '' };
  const W = window.innerWidth;
  const H = window.innerHeight;
  const norm = (s) => (s || '').replace(/[\s  ]+/g, ' ').trim();
  const memo = new WeakMap();
  const visible = (el) => {
    let v = memo.get(el);
    if (v !== undefined) return v;
    v = el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) && !el.closest('.sr-only');
    if (v) {
      const holder = el.closest('.scroll');
      const r = (holder || el).getBoundingClientRect();
      v = r.width > 0 && r.height > 0 && r.right > 0 && r.bottom > 0 && r.left < W && r.top < H;
    }
    memo.set(el, v);
    return v;
  };
  const blockOf = (el) => {
    const btn = el.closest('button, [role="tab"]');
    if (btn) return btn;
    for (let e = el; e && e !== root; e = e.parentElement) {
      const d = getComputedStyle(e).display;
      if (d !== 'inline' && d !== 'contents' && d !== 'inline-block' && d !== 'inline-flex') return e;
    }
    return root;
  };
  const regionOf = (el) =>
    el.closest('.toast')
      ? 'message'
      : el.closest('[role="dialog"], .sheet')
        ? 'sheet'
        : el.closest('.qpanel')
          ? 'question'
          : el.closest('.topbar')
            ? 'header'
            : el.closest('.place-chip')
              ? 'place'
              : el.closest('.minimap')
                ? 'minimap'
                : 'screen';

  const blocks = new Map();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const p = n.parentElement;
    if (!p || p.closest('svg, canvas, script, style') || !visible(p)) continue;
    const blk = blockOf(p);
    let b = blocks.get(blk);
    if (!b) {
      b = { region: regionOf(blk), text: '', lastParent: p };
      blocks.set(blk, b);
    }
    // Bouton composé (dossier : numéro, titre, tampon, accroche…) : un espace entre ses morceaux.
    if (b.lastParent !== p && blk.matches('button, [role="tab"]') && b.text && n.nodeValue.trim()) b.text += ' ';
    b.lastParent = p;
    b.text += n.nodeValue;
  }
  const regions = {};
  for (const b of blocks.values()) {
    const t = norm(b.text);
    if (!t) continue;
    const list = (regions[b.region] ||= []);
    if (list[list.length - 1] !== t) list.push(t);
  }

  const buttons = [];
  for (const el of root.querySelectorAll('button, [role="button"], [role="tab"], a[href], summary, [role="link"]')) {
    if (!visible(el)) continue;
    const r = el.getBoundingClientRect();
    const cx = Math.round(Math.min(W - 1, Math.max(0, r.left + r.width / 2)));
    const cy = Math.round(Math.min(H - 1, Math.max(0, r.top + r.height / 2)));
    const top = document.elementFromPoint(cx, cy);
    if (!top || !(el === top || el.contains(top) || top.classList.contains('tap-guard'))) continue;
    const text = norm(el.innerText);
    const name = norm(el.getAttribute('aria-label')) || text;
    if (!name) continue;
    buttons.push({
      name,
      text,
      x: cx,
      y: cy,
      disabled: el.disabled === true || el.getAttribute('aria-disabled') === 'true',
      pressed: el.getAttribute('aria-pressed') === 'true',
      selected: el.getAttribute('aria-selected') === 'true',
    });
  }

  const dotsEl = root.querySelector('.progress-dots');
  const m = dotsEl && /(\d+)\D+sur (\d+)/.exec(dotsEl.getAttribute('aria-label') || '');
  const screenEl = document.querySelector('[data-phase]');
  return {
    ready: true,
    regions,
    buttons,
    phase: screenEl ? screenEl.getAttribute('data-phase') : null,
    place: norm(root.querySelector('.place-chip')?.textContent),
    dots: m ? { solved: Number(m[1]), total: Number(m[2]) } : null,
    title: norm(root.querySelector('.topbar h1')?.textContent),
  };
}

export const readUi = (page) => page.evaluate(readInterface);

const PHASES = {
  brief: 'briefing de l’enquête (touchez « Commencer l’enquête »)',
  play: 'enquête en cours',
  end: 'écran de fin d’enquête',
  replay: 'reconstitution de l’histoire',
};

const clip = (s, n) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/** Libellé court d'un bouton pour les listes. */
function buttonLabel(b) {
  const flags = [b.disabled && 'inactif', b.pressed && 'activé', b.selected && 'sélectionné'].filter(Boolean);
  return `« ${clip(b.name, 70)} »${flags.length ? ` (${flags.join(', ')})` : ''}`;
}

/** Texte de la commande « text » : tout ce que l'interface affiche, par zone. */
export function formatText(ui) {
  if (!ui.ready) return 'Le jeu est encore en train de se charger (aucune interface visible). Réessayez dans quelques secondes.';
  const r = ui.regions;
  const out = [];
  const block = (title, lines) => {
    if (lines && lines.length) out.push(`${title}\n${lines.map((l) => `  ${l}`).join('\n')}`);
  };
  out.push(`État : ${ui.phase ? (PHASES[ui.phase] ?? ui.phase) : 'autre écran du jeu (accueil, liste, réglages…)'}`);
  block('Message passager', r.message);
  block('Feuille ouverte', r.sheet);
  block('Panneau de question', r.question);
  block('Écran', r.screen);
  block('En-tête', r.header);
  if (r.place && r.place.length) out.push(`Lieu sous le centre de la carte : ${r.place.join(' ')}`);
  block('Minicarte', r.minimap);
  out.push(ui.buttons.length ? `Boutons : ${ui.buttons.map(buttonLabel).join(' · ')}` : 'Boutons : aucun');
  return out.join('\n');
}

export function formatButtons(ui) {
  if (!ui.ready) return 'Aucun bouton visible : le jeu se charge encore.';
  if (!ui.buttons.length) return 'Aucun bouton visible.';
  return ui.buttons
    .map((b) => `- ${buttonLabel(b)}${b.text && b.text !== b.name ? ` — texte affiché : « ${clip(b.text, 60)} »` : ''} — centre (${b.x}, ${b.y})`)
    .join('\n');
}

/** Empreinte de ce que le joueur a déjà lu (panneau de question, boutons) : sert à ne montrer que les changements. */
export function uiSignature(ui) {
  return { panel: (ui.regions.question ?? []).join('\n'), buttons: ui.buttons.map((b) => b.name).join('|') };
}

/**
 * Résumé court de ce qui est à l'écran après un geste (les messages passagers sont ajoutés par l'appelant).
 * `prev` : empreinte précédente ; le panneau de question et les boutons ne sont répétés que s'ils ont changé.
 */
export function formatDigest(ui, toasts = [], prev = null) {
  const lines = [];
  if (toasts.length) lines.push(`Message à l'écran : ${toasts.map((t) => `« ${t} »`).join(' puis ')}`);
  if (!ui.ready) return lines.join('\n');
  const sig = uiSignature(ui);
  const buttonsLine = `Boutons : ${ui.buttons.map(buttonLabel).join(' · ') || 'aucun'}`;
  if (ui.regions.sheet && ui.regions.sheet.length) {
    // Les libellés de boutons sont listés à part : on ne les répète pas dans le texte de la feuille.
    const names = new Set(ui.buttons.map((b) => b.name));
    lines.push(`Feuille ouverte : ${clip(ui.regions.sheet.filter((l) => !names.has(l)).join(' | '), 700)}`);
    lines.push(buttonsLine);
  } else {
    lines.push('Aucune feuille ouverte (carte libre).');
    if (ui.regions.question?.length && (!prev || sig.panel !== prev.panel)) lines.push(`Panneau de question (modifié) : ${clip(ui.regions.question.join(' | '), 600)}`);
    if (!prev || sig.buttons !== prev.buttons) lines.push(buttonsLine);
  }
  if (ui.regions.place?.length) lines.push(`Lieu sous le centre de la carte : ${ui.regions.place.join(' ')}`);
  return lines.join('\n');
}

/* ----------------------------------------------------------------------------
 * Boutons : recherche et appui
 * ------------------------------------------------------------------------- */

export const fold = (s) =>
  String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[’‘`´']/g, ' ')
    .replace(/[«»"]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/** Trouve le bouton visible portant ce libellé (exact d'abord, puis partiel). Lève GestureError sinon. */
export function findButton(ui, label) {
  const q = fold(label);
  if (!q) throw new GestureError('« press » attend le libellé d\'un bouton, par exemple press "Désigner"');
  const names = (b) => [fold(b.name), fold(b.text)];
  const exact = ui.buttons.filter((b) => names(b).includes(q));
  const partial = ui.buttons.filter((b) => names(b).some((n) => n.includes(q)));
  const pick = exact.length ? exact : partial;
  const uniq = pick.filter((b, i) => pick.findIndex((o) => o.x === b.x && o.y === b.y) === i);
  if (uniq.length === 1) return uniq[0];
  if (uniq.length === 0) {
    throw new GestureError(
      `aucun bouton visible ne s'appelle « ${label} ».\nBoutons visibles : ${ui.buttons.map(buttonLabel).join(' · ') || 'aucun'}`,
    );
  }
  throw new GestureError(`« ${label} » est ambigu, précisez le libellé. Candidats : ${uniq.map(buttonLabel).join(' · ')}`);
}

/** Touche un bouton par son libellé (tap réel au centre du bouton). Renvoie le bouton touché. */
export async function pressButton(page, label) {
  const ui = await readUi(page);
  const b = findButton(ui, label);
  if (b.disabled) throw new GestureError(`le bouton « ${b.name} » est inactif (verrouillé ou grisé) : il ne répond pas au toucher`);
  await tapAt(page, b.x, b.y);
  return b;
}

/* ----------------------------------------------------------------------------
 * Sauvegarde (chiffres seulement) et captures
 * ------------------------------------------------------------------------- */

/** Résumé NON SPOILANT de la progression : lu dans la sauvegarde du navigateur, seulement des nombres. */
export function readProgress(page, caseId) {
  return page.evaluate(
    ({ key, caseId }) => {
      let data = null;
      try {
        data = JSON.parse(localStorage.getItem(key) || 'null');
      } catch {
        data = null;
      }
      const c = data && data.cases ? data.cases[caseId] : null;
      if (!c) return { saved: false };
      const steps = Object.values(c.steps || {});
      return {
        saved: true,
        status: c.status,
        total: steps.length,
        solved: steps.filter((s) => s && s.solvedAt !== undefined && s.solvedAt !== null).length,
        mistakes: steps.reduce((n, s) => n + (Number(s?.mistakes) || 0), 0),
        hints: steps.reduce((n, s) => n + (Number(s?.hints) || 0), 0),
        stars: c.stars ?? null,
      };
    },
    { key: STORAGE_KEY, caseId },
  );
}

/** Grille de repérage (coordonnées écran en px CSS) dessinée par-dessus la page le temps d'une capture. */
function drawGrid({ step, labelEvery, region }) {
  const dpr = window.devicePixelRatio || 1;
  const W = window.innerWidth;
  const H = window.innerHeight;
  const c = document.createElement('canvas');
  c.id = '__pt_grid';
  c.width = Math.round(W * dpr);
  c.height = Math.round(H * dpr);
  c.style.cssText = `position:fixed;left:0;top:0;width:${W}px;height:${H}px;pointer-events:none;z-index:2147483647`;
  const g = c.getContext('2d');
  g.scale(dpr, dpr);
  const x0 = region ? region.x : 0;
  const y0 = region ? region.y : 0;
  const x1 = region ? region.x + region.w : W;
  const y1 = region ? region.y + region.h : H;
  g.font = '600 11px sans-serif';
  g.lineWidth = 1;
  const label = (text, x, y) => {
    g.lineWidth = 3;
    g.strokeStyle = 'rgba(0,0,0,0.75)';
    g.strokeText(text, x, y);
    g.fillStyle = '#fff';
    g.fillText(text, x, y);
  };
  const firstX = Math.ceil(x0 / step) * step;
  const firstY = Math.ceil(y0 / step) * step;
  for (let x = firstX; x <= x1; x += step) {
    const major = x % labelEvery === 0;
    g.lineWidth = 1;
    g.strokeStyle = major ? 'rgba(255,0,200,0.7)' : 'rgba(255,0,200,0.28)';
    g.beginPath();
    g.moveTo(x + 0.5, y0);
    g.lineTo(x + 0.5, y1);
    g.stroke();
  }
  for (let y = firstY; y <= y1; y += step) {
    const major = y % labelEvery === 0;
    g.lineWidth = 1;
    g.strokeStyle = major ? 'rgba(255,0,200,0.7)' : 'rgba(255,0,200,0.28)';
    g.beginPath();
    g.moveTo(x0, y + 0.5);
    g.lineTo(x1, y + 0.5);
    g.stroke();
  }
  g.textBaseline = 'top';
  for (let x = firstX; x <= x1; x += step) if (x % labelEvery === 0) label(String(x), x + 2, y0 + 1);
  for (let y = firstY; y <= y1; y += step) if (y % labelEvery === 0) label(String(y), x0 + 2, y + 1);
  document.body.appendChild(c);
}

/**
 * Capture écran. Sans `crop` : tout l'écran, à l'échelle CSS (1 pixel de l'image = 1 pixel de coordonnée).
 * Avec `crop` {x,y,w,h} : zoom sur cette zone, à la résolution réelle de l'écran (plus de détails).
 * `grid` : superpose une grille de repérage (lignes tous les 50 px, valeurs tous les 100 ; en détail, plus fine).
 */
export async function takeScreenshot(page, file, { grid = false, crop = null } = {}) {
  const { w: W, h: H } = viewportOf(page);
  const opts = { path: file, type: 'png', scale: 'css' };
  let region = null;
  if (crop) {
    const x = Math.max(0, Math.min(W - 10, crop.x));
    const y = Math.max(0, Math.min(H - 10, crop.y));
    const cw = Math.min(W - x, crop.w);
    const ch = Math.min(H - y, crop.h);
    if (!(cw >= 10 && ch >= 10)) throw new GestureError('la zone à agrandir est trop petite ou hors de l\'écran');
    region = { x, y, w: cw, h: ch };
    opts.clip = { x, y, width: cw, height: ch };
    opts.scale = 'device';
  }
  if (grid) {
    const span = region ? Math.max(region.w, region.h) : Math.max(W, H);
    const step = span <= 160 ? 10 : span <= 330 ? 25 : 50;
    await page.evaluate(drawGrid, { step, labelEvery: step * 2, region });
  }
  try {
    await page.screenshot(opts);
  } finally {
    if (grid) await page.evaluate(() => document.getElementById('__pt_grid')?.remove()).catch(() => {});
  }
  return region ? { w: Math.round(region.w), h: Math.round(region.h) } : { w: W, h: H };
}
