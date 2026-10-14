#!/usr/bin/env node
// Mesure de fluidité et contrôle des gestes du moteur de carte (dev/map.html), sur un téléphone
// émulé (Playwright, Chromium, profil « Pixel 7 »).
//
// Usage :
//   node scripts/perf-map.mjs                  parcours scripté, sans puis avec ralentissement CPU ×4
//   node scripts/perf-map.mjs --rates 1,4,6    taux de ralentissement CPU à mesurer
//   node scripts/perf-map.mjs --json out.json  écrit aussi les mesures brutes
//   node scripts/perf-map.mjs --gestures       contrôles fonctionnels des gestes (code de sortie ≠ 0 si échec)
//   node scripts/perf-map.mjs --path "/dev/map.html?cases=0"   autre page / paramètres
//   node scripts/perf-map.mjs --startup        durée du démarrage (buildWorld + premier rendu),
//                                              ×1 et ×4 (--rates), 3 pages neuves par taux (--repeat N)
//
// Parcours scripté : vol vers la gare, glissers (avec inertie), pincements (zoom avant / arrière),
// double-taps, vols à travers la ville (avec dézoom intermédiaire), retour à la ville entière.
// Les durées d'image sont les intervalles entre rappels requestAnimationFrame d'une boucle de
// mesure indépendante du moteur : elles reflètent ce que voit le joueur (une image ratée = 33 ms).
// La colonne « JS moteur » donne le temps de calcul de chaque image du moteur (rendu de tuiles
// compris) : un grand écart entre les deux révèle un coût de composition hors JS (navigateur).
// Objectif sans ralentissement : p95 < 20 ms.
//
// Le script reste valable quand le dessin du module art évolue : relancez-le après chaque
// changement notable de art ou de world. Les mesures dépendent de la machine (sans GPU ici :
// rendu logiciel) et de la charge (autres processus) : comparez des mesures faites au même moment.

import { createServer } from 'vite';
import { chromium, devices } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

function parseArgs(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) opts[key] = true;
    else {
      opts[key] = next;
      i++;
    }
  }
  return opts;
}

const args = parseArgs(process.argv.slice(2));
const rates = String(args.rates ?? '1,4')
  .split(',')
  .map(Number)
  .filter((n) => n >= 1);
const basePath = String(args.path ?? '/dev/map.html');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ----------------------------------------------------------------------------
 * Serveur et navigateur
 * ------------------------------------------------------------------------- */

const root = resolve(import.meta.dirname, '..');
const server = await createServer({
  configFile: resolve(root, 'vite.config.ts'),
  root,
  server: { port: 0, host: '127.0.0.1', strictPort: false, hmr: false },
  logLevel: 'error',
});
await server.listen();
const addr = server.httpServer.address();
const base = `http://127.0.0.1:${typeof addr === 'object' && addr ? addr.port : 5173}`;
const browser = await chromium.launch();

function withParams(path, extra) {
  const u = new URL(path, base);
  for (const [k, v] of Object.entries(extra)) if (!u.searchParams.has(k)) u.searchParams.set(k, String(v));
  return u.href;
}

async function openMap(extraParams = {}, contextOpts = devices['Pixel 7']) {
  const context = await browser.newContext({ ...contextOpts });
  const page = await context.newPage();
  page.on('pageerror', (err) => console.log(`[page:exception] ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') console.log(`[page:${msg.type()}] ${msg.text()}`);
  });
  await page.goto(withParams(basePath, extraParams), { waitUntil: 'load' });
  await page.waitForFunction(() => window.__haystackReady === true, null, { timeout: 60_000 });
  const cdp = await context.newCDPSession(page);
  return { context, page, cdp };
}

/* ----------------------------------------------------------------------------
 * Toucher (CDP Input.dispatchTouchEvent)
 * ------------------------------------------------------------------------- */

function touchPoints(points) {
  return points.map((p, k) => ({ x: p.x, y: p.y, id: p.id ?? k, radiusX: 2, radiusY: 2, force: 1 }));
}

async function touch(cdp, type, points) {
  await cdp.send('Input.dispatchTouchEvent', { type, touchPoints: touchPoints(points) });
}

/** Attend jusqu'à l'instant `t` (ms, horloge performance de Node). */
async function until(t) {
  const d = t - performance.now();
  if (d > 0) await sleep(d);
}

/**
 * Glisser d'un doigt de `from` à `to` en `ms`, puis lâcher (après `hold` ms d'immobilité :
 * 0 = lâcher en mouvement → inertie).
 */
async function drag(cdp, from, to, ms, hold = 0) {
  const steps = Math.max(2, Math.round(ms / 16));
  const t0 = performance.now();
  await touch(cdp, 'touchStart', [from]);
  for (let k = 1; k <= steps; k++) {
    await until(t0 + (k * ms) / steps);
    const u = k / steps;
    await touch(cdp, 'touchMove', [{ x: from.x + (to.x - from.x) * u, y: from.y + (to.y - from.y) * u }]);
  }
  if (hold) await sleep(hold);
  await touch(cdp, 'touchEnd', []);
}

/** Pincement : deux doigts symétriques autour de `mid`, écartement d0 → d1, le milieu allant à `mid1`. */
async function pinch(cdp, mid, d0, d1, ms, mid1 = mid, hold = 60) {
  const steps = Math.max(2, Math.round(ms / 16));
  const pts = (m, d) => [
    { x: m.x - d / 2, y: m.y, id: 1 },
    { x: m.x + d / 2, y: m.y, id: 2 },
  ];
  const t0 = performance.now();
  await touch(cdp, 'touchStart', pts(mid, d0));
  for (let k = 1; k <= steps; k++) {
    await until(t0 + (k * ms) / steps);
    const u = k / steps;
    const m = { x: mid.x + (mid1.x - mid.x) * u, y: mid.y + (mid1.y - mid.y) * u };
    await touch(cdp, 'touchMove', pts(m, d0 + (d1 - d0) * u));
  }
  if (hold) await sleep(hold);
  await touch(cdp, 'touchEnd', []);
}

async function tap(cdp, p) {
  await touch(cdp, 'touchStart', [p]);
  await sleep(40);
  await touch(cdp, 'touchEnd', []);
}

async function doubleTap(cdp, p) {
  await tap(cdp, p);
  await sleep(90);
  await tap(cdp, p);
}

async function idle(page) {
  await page.evaluate(() => window.__haystack.map.whenIdle());
}

const cam = (page) => page.evaluate(() => window.__haystack.map.getCamera());

/* ----------------------------------------------------------------------------
 * Mesure des images
 * ------------------------------------------------------------------------- */

async function installFrameProbe(page) {
  await page.evaluate(() => {
    const probe = { phase: null, data: {}, js: {}, last: 0, frames: 0 };
    const loop = (ts) => {
      if (probe.phase) {
        if (probe.last) (probe.data[probe.phase] ??= []).push(ts - probe.last);
        probe.last = ts;
        // Temps JS de l'image du moteur (si une image moteur a eu lieu depuis le dernier passage).
        const s = window.__haystack.map.debugStats();
        if (s.frames !== probe.frames) (probe.js[probe.phase] ??= []).push(s.lastFrameMs);
        probe.frames = s.frames;
      } else probe.last = 0;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    window.__probe = probe;
  });
}

async function phase(page, name, fn) {
  await page.evaluate((n) => {
    window.__probe.phase = n;
    window.__probe.last = 0;
  }, name);
  await fn();
  await page.evaluate(() => {
    window.__probe.phase = null;
  });
}

function summarize(list) {
  const s = [...list].sort((a, b) => a - b);
  const q = (p) => (s.length ? s[Math.min(s.length - 1, Math.floor(p * (s.length - 1) + 0.5))] : 0);
  return {
    frames: s.length,
    p50: q(0.5),
    p95: q(0.95),
    max: s.length ? s[s.length - 1] : 0,
    over33: s.filter((v) => v > 33.4).length,
  };
}

function fmt(n) {
  return n.toFixed(1).padStart(6);
}

async function runCourse(rate) {
  const { context, page, cdp } = await openMap({ hud: 1 });
  if (rate > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate });
  await installFrameProbe(page);
  const vp = page.viewportSize();
  const c = { x: vp.width / 2, y: vp.height / 2 };
  const target = await page.evaluate(() => {
    const lm = window.__haystack.world.landmarks;
    const pick = (id) => lm.find((l) => l.id === id) ?? lm[0];
    const center = (l) => ({ x: l.rect.x + l.rect.w / 2, y: l.rect.y + l.rect.h / 2 });
    const ids = ['parvis-gare', 'grand-place', 'port', 'parc', 'musee', 'eglise'];
    return ids.map((id) => ({ id, ...center(pick(id)) }));
  });

  await phase(page, 'vol initial', async () => {
    await page.evaluate((t) => window.__haystack.map.flyTo({ x: t.x, y: t.y, zoom: 2 }), target[0]);
    await idle(page);
  });

  await phase(page, 'glisser', async () => {
    const moves = [
      [-160, -60],
      [150, 40],
      [-40, -220],
      [60, 200],
      [-200, 120],
      [180, -120],
    ];
    for (const [dx, dy] of moves) {
      await drag(cdp, { x: c.x - dx / 2, y: c.y - dy / 2 }, { x: c.x + dx / 2, y: c.y + dy / 2 }, 180);
      await sleep(450);
    }
    await sleep(300);
  });

  await phase(page, 'pincer', async () => {
    await pinch(cdp, c, 120, 300, 500); // zoom avant
    await sleep(250);
    await pinch(cdp, { x: c.x, y: c.y - 80 }, 300, 70, 600, { x: c.x + 40, y: c.y + 40 }); // arrière + déplacement
    await sleep(250);
    await pinch(cdp, c, 260, 60, 500); // arrière
    await sleep(250);
    await pinch(cdp, { x: c.x - 50, y: c.y + 100 }, 80, 320, 600); // avant
    await sleep(400);
  });

  await phase(page, 'double-tap', async () => {
    await page.evaluate(() => window.__haystack.map.setCamera({ zoom: 0.7 }));
    await sleep(200);
    await doubleTap(cdp, { x: c.x - 60, y: c.y - 100 });
    await sleep(500);
    await doubleTap(cdp, { x: c.x + 40, y: c.y + 60 });
    await sleep(600);
  });

  await phase(page, 'vols', async () => {
    for (const t of target.slice(1)) {
      await page.evaluate((p) => window.__haystack.map.flyTo({ x: p.x, y: p.y, zoom: 2.2 }), t);
      await sleep(250);
    }
  });

  await phase(page, 'ville entière', async () => {
    await page.evaluate(() => window.__haystack.map.flyTo({ zoom: window.__haystack.map.getMinZoom() }));
    await sleep(300);
    await page.evaluate((p) => window.__haystack.map.flyTo({ x: p.x, y: p.y, zoom: 3 }), target[1]);
    await sleep(300);
  });

  const data = await page.evaluate(() => window.__probe.data);
  const js = await page.evaluate(() => window.__probe.js);
  const stats = await page.evaluate(() => window.__haystack.map.debugStats());
  await context.close();
  return { rate, data, js, stats };
}

function report(run) {
  console.log(`\n=== Ralentissement CPU ×${run.rate} (${devices['Pixel 7'].viewport.width}×${devices['Pixel 7'].viewport.height}, dpr moteur ${run.stats.dpr}) ===`);
  console.log('                  ----- intervalles d\'image (ms) -----  -- JS moteur (ms) --');
  console.log('phase             images    p50    p95    max  >33ms      p95    max');
  const all = [];
  const allJs = [];
  for (const [name, list] of Object.entries(run.data)) {
    all.push(...list);
    const js = run.js[name] ?? [];
    allJs.push(...js);
    const s = summarize(list);
    const j = summarize(js);
    console.log(
      `${name.padEnd(16)} ${String(s.frames).padStart(7)} ${fmt(s.p50)} ${fmt(s.p95)} ${fmt(s.max)} ${String(s.over33).padStart(6)}   ${fmt(j.p95)} ${fmt(j.max)}`,
    );
  }
  const s = summarize(all);
  const j = summarize(allJs);
  console.log(
    `${'TOTAL'.padEnd(16)} ${String(s.frames).padStart(7)} ${fmt(s.p50)} ${fmt(s.p95)} ${fmt(s.max)} ${String(s.over33).padStart(6)}   ${fmt(j.p95)} ${fmt(j.max)}`,
  );
  const st = run.stats;
  console.log(
    `moteur : ${st.tilesRendered} tuiles rendues (${st.tilesAborted} abandonnées), ` +
      `rendu moyen ${st.avgTileMs.toFixed(1)} ms, max ${st.maxTileMs.toFixed(1)} ms, ` +
      `cache ${st.tilesCached}/${st.cacheCapacity}, offscreen=${st.offscreen}`,
  );
  return s;
}

/* ----------------------------------------------------------------------------
 * Contrôles fonctionnels des gestes
 * ------------------------------------------------------------------------- */

async function runGestures() {
  const results = [];
  const check = (name, ok, detail = '') => {
    results.push({ name, ok });
    console.log(`${ok ? '  ok ' : 'ÉCHEC'}  ${name}${detail ? ` — ${detail}` : ''}`);
  };
  const near = (a, b, tol) => Math.abs(a - b) <= tol;

  const { context, page, cdp } = await openMap({ x: 3200, y: 2400, zoom: 1 });
  const vp = page.viewportSize();
  const reset = async (c) => {
    await page.evaluate((cc) => window.__haystack.map.setCamera(cc), c);
    await idle(page);
  };

  // 1. Glisser lent (sans inertie) : la carte suit exactement le doigt.
  await reset({ x: 3200, y: 2400, zoom: 1 });
  await drag(cdp, { x: 250, y: 500 }, { x: 150, y: 420 }, 300, 150);
  await idle(page);
  let k = await cam(page);
  check('glisser : déplacement = déplacement du doigt / zoom', near(k.x, 3300, 1.5) && near(k.y, 2480, 1.5), `caméra (${k.x.toFixed(1)}, ${k.y.toFixed(1)})`);

  // 2. Lancer : l'inertie prolonge le mouvement.
  await reset({ x: 3200, y: 2400, zoom: 1 });
  await drag(cdp, { x: 300, y: 500 }, { x: 150, y: 500 }, 100, 0);
  await sleep(1200);
  await idle(page);
  k = await cam(page);
  check('inertie : le lancer continue après le lâcher', k.x - 3200 > 250, `déplacement ${(k.x - 3200).toFixed(0)} u pour 150 px de doigt`);

  // 3. Pincement : zoom ×2 ancré au milieu des doigts.
  await reset({ x: 3200, y: 2400, zoom: 1 });
  const mid = { x: 180, y: 380 };
  const w0 = await page.evaluate((m) => window.__haystack.map.screenToWorld(m), mid);
  await pinch(cdp, mid, 100, 200, 400);
  await idle(page);
  k = await cam(page);
  let s = await page.evaluate((w) => window.__haystack.map.worldToScreen(w), w0);
  check('pincer : zoom ×2', near(k.zoom, 2, 0.04), `zoom ${k.zoom.toFixed(3)}`);
  check('pincer : point sous les doigts fixe', near(s.x, mid.x, 2) && near(s.y, mid.y, 2), `(${s.x.toFixed(1)}, ${s.y.toFixed(1)})`);

  // 4. Pincement avec déplacement simultané : le point suit le milieu des doigts.
  await reset({ x: 3200, y: 2400, zoom: 1 });
  const w1 = await page.evaluate((m) => window.__haystack.map.screenToWorld(m), mid);
  const mid1 = { x: 240, y: 470 };
  await pinch(cdp, mid, 200, 100, 400, mid1);
  await idle(page);
  k = await cam(page);
  s = await page.evaluate((w) => window.__haystack.map.worldToScreen(w), w1);
  check('pincer + déplacer : zoom ×0,5', near(k.zoom, 0.5, 0.02), `zoom ${k.zoom.toFixed(3)}`);
  check('pincer + déplacer : le point suit le milieu', near(s.x, mid1.x, 2) && near(s.y, mid1.y, 2), `(${s.x.toFixed(1)}, ${s.y.toFixed(1)})`);

  // 5. Double-tap : zoom ×2 animé au point touché, sans tap simple.
  await reset({ x: 3200, y: 2400, zoom: 1 });
  let taps0 = await page.evaluate(() => window.__haystack.taps.length);
  const pt = { x: 100, y: 300 };
  const w2 = await page.evaluate((m) => window.__haystack.map.screenToWorld(m), pt);
  await doubleTap(cdp, pt);
  await sleep(100);
  const during = await cam(page);
  await sleep(500);
  await idle(page);
  k = await cam(page);
  s = await page.evaluate((w) => window.__haystack.map.worldToScreen(w), w2);
  let taps1 = await page.evaluate(() => window.__haystack.taps.length);
  check('double-tap : zoom ×2', near(k.zoom, 2, 0.01), `zoom ${k.zoom.toFixed(3)}`);
  check('double-tap : animé', during.zoom > 1.01 && during.zoom < 1.99, `zoom à mi-course ${during.zoom.toFixed(3)}`);
  check('double-tap : point touché fixe', near(s.x, pt.x, 1.5) && near(s.y, pt.y, 1.5), `(${s.x.toFixed(1)}, ${s.y.toFixed(1)})`);
  check('double-tap : aucun onTap', taps1 === taps0);

  // 6. Tap : retardé, au bon point, avec l'entité la plus en avant.
  const target = await page.evaluate(() => {
    const p = window.__haystack.world.entities.find(
      (e) => e.kind === 'person' && e.pose === 'stand' && !e.z && e.x > 500 && e.x < 5900 && e.y > 500 && e.y < 4300,
    );
    return { id: p.id, x: p.x, y: p.y };
  });
  await reset({ x: target.x, y: target.y - 10, zoom: 3 });
  taps0 = await page.evaluate(() => window.__haystack.taps.length);
  await tap(cdp, { x: vp.width / 2, y: vp.height / 2 });
  await sleep(100);
  const early = await page.evaluate(() => window.__haystack.taps.length);
  await sleep(300);
  const last = await page.evaluate(() => window.__haystack.taps.at(-1));
  taps1 = await page.evaluate(() => window.__haystack.taps.length);
  check('tap : émis après ~220 ms (pas avant)', early === taps0 && taps1 === taps0 + 1);
  check('tap : coordonnées monde', last && near(last.world.x, target.x, 0.5) && near(last.world.y, target.y - 10, 0.5), last ? `(${last.world.x.toFixed(1)}, ${last.world.y.toFixed(1)})` : '');
  check('tap : entité sous le doigt', last && last.id === target.id, last ? `${last.id} (attendu ${target.id})` : '');
  const hud = await page.evaluate(() => document.getElementById('hud').innerText);
  check('tap : HUD mis à jour', hud.includes(target.id));

  // 7. Glisser court (< 8 px) = tap ; glisser plus long = pas de tap.
  taps0 = await page.evaluate(() => window.__haystack.taps.length);
  await drag(cdp, { x: 200, y: 400 }, { x: 205, y: 403 }, 80, 0);
  await sleep(400);
  taps1 = await page.evaluate(() => window.__haystack.taps.length);
  check('micro-glisser (< 8 px) : compte comme un tap', taps1 === taps0 + 1);
  await drag(cdp, { x: 200, y: 400 }, { x: 230, y: 400 }, 120, 100);
  await sleep(400);
  const taps2 = await page.evaluate(() => window.__haystack.taps.length);
  check('glisser (30 px) : pas de tap', taps2 === taps1);

  // 8. Tap à deux doigts : zoom ÷2.
  await reset({ x: 3200, y: 2400, zoom: 2 });
  await touch(cdp, 'touchStart', [
    { x: 150, y: 400, id: 1 },
    { x: 250, y: 400, id: 2 },
  ]);
  await sleep(60);
  await touch(cdp, 'touchEnd', []);
  await sleep(500);
  await idle(page);
  k = await cam(page);
  check('tap à deux doigts : zoom ÷2', near(k.zoom, 1, 0.01), `zoom ${k.zoom.toFixed(3)}`);

  // 9. Bornes : impossible de perdre la ville.
  await reset({ x: 3200, y: 2400, zoom: 1 });
  for (let i = 0; i < 6; i++) await drag(cdp, { x: 50, y: 100 }, { x: 380, y: 800 }, 120, 0);
  await sleep(1200);
  await idle(page);
  k = await cam(page);
  check('bornes : le centre reste dans la ville', k.x >= 0 && k.y >= 0 && k.x <= 6400 && k.y <= 4800, `(${k.x.toFixed(0)}, ${k.y.toFixed(0)})`);
  await reset({ zoom: 0.001 });
  k = await cam(page);
  const minZ = await page.evaluate(() => window.__haystack.map.getMinZoom());
  check('bornes : zoom minimal = ville entière', near(k.zoom, minZ, 1e-9) && near(k.x, 3200, 0.5) && near(k.y, 2400, 0.5), `zoom ${k.zoom.toFixed(4)}`);

  // 10. onCameraChange au plus une fois par image.
  await reset({ x: 3200, y: 2400, zoom: 1 });
  const f0 = await page.evaluate(() => [window.__haystack.cameraChanges, window.__haystack.map.debugStats().frames]);
  await drag(cdp, { x: 300, y: 600 }, { x: 100, y: 200 }, 300, 0);
  await sleep(800);
  const f1 = await page.evaluate(() => [window.__haystack.cameraChanges, window.__haystack.map.debugStats().frames]);
  check('onCameraChange ≤ 1 par image', f1[0] - f0[0] <= f1[1] - f0[1] && f1[0] > f0[0], `${f1[0] - f0[0]} appels pour ${f1[1] - f0[1]} images`);

  // 11. Repos : plus aucune image quand rien ne bouge.
  await idle(page);
  await sleep(1500); // fin des préchargements
  const r0 = await page.evaluate(() => window.__haystack.map.debugStats().frames);
  await sleep(500);
  const r1 = await page.evaluate(() => window.__haystack.map.debugStats().frames);
  check('au repos, aucune image n’est calculée', r1 === r0, `${r1 - r0} images en 500 ms`);

  // 12. flyTo / fitRect / mouvement réduit.
  await reset({ x: 1000, y: 1000, zoom: 2 });
  const t0 = Date.now();
  await page.evaluate(() => window.__haystack.map.flyTo({ x: 5500, y: 4000, zoom: 2 }));
  const dur = Date.now() - t0;
  k = await cam(page);
  check('flyTo : arrive à destination', near(k.x, 5500, 0.01) && near(k.y, 4000, 0.01) && k.zoom === 2, `${dur} ms`);
  await page.evaluate(() => window.__haystack.map.fitRect({ x: 2000, y: 2000, w: 300, h: 200 }, { padding: 20 }));
  k = await cam(page);
  check('fitRect : cadre le rectangle', near(k.x, 2150, 0.01) && near(k.zoom, (vp.width - 40) / 300, 0.001), `zoom ${k.zoom.toFixed(3)}`);
  await page.evaluate(() => window.__haystack.map.setReducedMotion(true));
  const t1 = Date.now();
  await page.evaluate(() => window.__haystack.map.flyTo({ x: 1000, y: 1000, zoom: 1 }));
  check('mouvement réduit : flyTo instantané', Date.now() - t1 < 100, `${Date.now() - t1} ms`);
  await page.evaluate(() => window.__haystack.map.setReducedMotion(false));

  // 13. Vignette (renderSnapshot).
  const snap = await page.evaluate(() => {
    const c = document.createElement('canvas');
    c.width = 200;
    c.height = 120;
    const t = performance.now();
    window.__haystack.map.renderSnapshot(c, { x: 400, y: 1500, w: 800, h: 400 });
    const ms = performance.now() - t;
    const d = c.getContext('2d').getImageData(0, 0, 200, 120).data;
    const colors = new Set();
    for (let i = 0; i < d.length; i += 4 * 37) colors.add((d[i] << 16) | (d[i + 1] << 8) | d[i + 2]);
    return { ms, colors: colors.size };
  });
  check('renderSnapshot : vignette dessinée', snap.colors > 20, `${snap.colors} couleurs, ${snap.ms.toFixed(0)} ms`);
  await context.close();

  // 14. Souris (bureau) : molette ancrée au curseur, glisser, clavier.
  const desk = await openMap({ x: 3200, y: 2400, zoom: 1 }, { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  const dp = desk.page;
  const cur = { x: 300, y: 250 };
  const w3 = await dp.evaluate((m) => window.__haystack.map.screenToWorld(m), cur);
  await dp.mouse.move(cur.x, cur.y);
  await dp.mouse.wheel(0, -300);
  await sleep(600);
  await idle(dp);
  k = await cam(dp);
  s = await dp.evaluate((w) => window.__haystack.map.worldToScreen(w), w3);
  check('molette : zoom avant', k.zoom > 1.5, `zoom ${k.zoom.toFixed(3)}`);
  check('molette : ancrée au curseur', near(s.x, cur.x, 1.5) && near(s.y, cur.y, 1.5), `(${s.x.toFixed(1)}, ${s.y.toFixed(1)})`);
  const z0 = k.zoom;
  await dp.mouse.move(600, 400);
  await dp.mouse.down();
  for (let i = 1; i <= 10; i++) await dp.mouse.move(600 - i * 10, 400);
  await sleep(120);
  await dp.mouse.up();
  await idle(dp);
  const k2 = await cam(dp);
  check('souris : glisser', near(k2.x - k.x, 100 / z0, 1), `Δx ${(k2.x - k.x).toFixed(1)}`);
  await dp.keyboard.press('+');
  await sleep(500);
  await idle(dp);
  const k3 = await cam(dp);
  check('clavier : + double le zoom', near(k3.zoom, Math.min(4, 2 * z0), 0.01), `zoom ${k3.zoom.toFixed(3)}`);
  await dp.keyboard.press('ArrowRight');
  await sleep(1200);
  await idle(dp);
  const k4 = await cam(dp);
  check('clavier : flèche droite', k4.x > k3.x + 20, `Δx ${(k4.x - k3.x).toFixed(1)}`);
  await desk.context.close();

  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} contrôles réussis`);
  return failed;
}

/* ----------------------------------------------------------------------------
 * Démarrage : construction du monde et premier rendu
 * ------------------------------------------------------------------------- */

/**
 * Mesure, dans une page neuve (Pixel 7 émulé), ce que coûte le démarrage du jeu :
 * `buildWorld({ cases: CASES })` à froid (cache vide, JIT froid), puis le premier rendu complet
 * de la carte (`createMapView` → `whenIdle()`) à la vue « ville entière » et à une vue de jeu.
 * Les modules sont chargés AVANT le ralentissement CPU : en développement, Vite sert des centaines
 * de modules un par un, ce qui n'est pas représentatif du paquet de production.
 */
async function runStartup(rate, repeat) {
  const out = [];
  for (let k = 0; k < repeat; k++) {
    const context = await browser.newContext({ ...devices['Pixel 7'] });
    const page = await context.newPage();
    page.on('pageerror', (err) => console.log(`[page:exception] ${err.message}`));
    await page.route('**/__startup.html', (route) =>
      route.fulfill({
        contentType: 'text/html',
        body:
          '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' +
          '<body style="margin:0"><div style="position:fixed;inset:0"><canvas id="map"></canvas></div></body>',
      }),
    );
    await page.goto(`${base}/__startup.html`, { waitUntil: 'load' });
    await page.evaluate(async () => {
      window.__mods = await Promise.all([
        import('/src/world/index.ts'),
        import('/src/content/index.ts'),
        import('/src/engine/index.ts'),
      ]);
    });
    const cdp = await context.newCDPSession(page);
    if (rate > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate });
    const r = await page.evaluate(async () => {
      const [W, C, E] = window.__mods;
      const t0 = performance.now();
      const world = W.buildWorld({ cases: C.CASES });
      const t1 = performance.now();
      W.buildWorld({ cases: C.CASES }); // monde ambiant en cache : intégration des enquêtes seule
      const t2 = performance.now();
      const map = E.createMapView({ canvas: document.getElementById('map'), world });
      await map.whenIdle();
      const t3 = performance.now();
      const c00 = C.CASES[0].start;
      map.setCamera({ x: c00.x, y: c00.y, zoom: Math.max(2, c00.zoom) });
      await map.whenIdle();
      const t4 = performance.now();
      const s = map.debugStats();
      map.destroy();
      return {
        build: t1 - t0,
        rebuild: t2 - t1,
        firstRender: t3 - t2,
        gameView: t4 - t3,
        entities: world.entities.length,
        tiles: s.tilesRendered,
      };
    });
    out.push(r);
    await context.close();
  }
  const med = (key) => {
    const v = out.map((r) => r[key]).sort((a, b) => a - b);
    return v[Math.floor(v.length / 2)];
  };
  const list = (key) => out.map((r) => r[key].toFixed(0)).join(' / ');
  console.log(`\n=== Démarrage, CPU ×${rate} (${out[0].entities} entités, ${repeat} pages neuves) ===`);
  console.log(`buildWorld({ cases }) à froid  : médiane ${med('build').toFixed(0).padStart(5)} ms  (${list('build')})`);
  console.log(`  idem, monde ambiant en cache : médiane ${med('rebuild').toFixed(0).padStart(5)} ms  (${list('rebuild')})`);
  console.log(`premier rendu, ville entière   : médiane ${med('firstRender').toFixed(0).padStart(5)} ms  (${list('firstRender')})`);
  console.log(`puis vue de jeu (c00, zoom ≥ 2) : médiane ${med('gameView').toFixed(0).padStart(5)} ms  (${list('gameView')})`);
  return { rate, runs: out };
}

/* ----------------------------------------------------------------------------
 * Programme
 * ------------------------------------------------------------------------- */

let exitCode = 0;
try {
  if (args.startup) {
    const runs = [];
    for (const rate of rates) runs.push(await runStartup(rate, Math.max(1, Number(args.repeat ?? 3))));
    if (args.json) writeFileSync(String(args.json), JSON.stringify(runs, null, 1));
  } else if (args.gestures) {
    console.log('Contrôles des gestes (Pixel 7 émulé, puis bureau) :');
    exitCode = (await runGestures()) > 0 ? 1 : 0;
  } else {
    const runs = [];
    for (const rate of rates) {
      const run = await runCourse(rate);
      runs.push(run);
      const s = report(run);
      if (rate === 1) console.log(`objectif p95 < 20 ms : ${s.p95 < 20 ? 'atteint' : 'NON atteint'} (${s.p95.toFixed(1)} ms)`);
    }
    if (args.json) writeFileSync(String(args.json), JSON.stringify(runs, null, 1));
  }
} finally {
  await browser.close();
  await server.close();
}
process.exit(exitCode);
