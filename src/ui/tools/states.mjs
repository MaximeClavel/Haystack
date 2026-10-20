// Captures des autres états de l'interface (onglets, approche, minicarte, gaucher, paysage, tablette…),
// avec quelques contrôles fonctionnels. Sortie : .shots/ui/states/.
// Usage : node src/ui/tools/states.mjs [noms,séparés,par,des,virgules]
import { createServer } from 'vite';
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..', '..', '..');
const out = resolve(root, '.shots/ui/states');
mkdirSync(out, { recursive: true });
const server = await createServer({
  configFile: resolve(root, 'vite.config.ts'),
  root,
  server: { port: 0, host: '127.0.0.1', hmr: false },
  logLevel: 'error',
});
await server.listen();
const base = `http://127.0.0.1:${server.httpServer.address().port}`;
const browser = await chromium.launch();
const problems = [];
const only = process.argv[2] ? new Set(process.argv[2].split(',')) : null;

const SOLVED_C00 = { caseId: 'c00', status: 'solved', steps: {}, pins: [], notes: '', stars: 3 };
function saveWith(settings = {}, cases = {}) {
  return JSON.stringify({
    version: 1,
    cases,
    settings: { haptics: true, leftHanded: false, reducedMotion: false, ...settings },
    seenHowTo: true,
  });
}

async function run(name, { width = 390, height = 844, dpr = 2, save = null, path }, fn) {
  if (only && !only.has(name)) return;
  const touch = width < 1000;
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: dpr, isMobile: touch, hasTouch: touch });
  if (save) await ctx.addInitScript((s) => localStorage.setItem('haystack:v1', s), save);
  const page = await ctx.newPage();
  page.on('console', (m) => {
    if (m.type() === 'error') problems.push(`${name} console : ${m.text()}`);
  });
  page.on('pageerror', (e) => problems.push(`${name} exception : ${e.message}`));
  await page.goto(base + path);
  await page.waitForFunction(() => window.__haystackReady === true, null, { timeout: 30000 });
  await page.addStyleTag({ content: '.debug-hud { display: none !important; }' });
  const shot = async (suffix = '') => {
    await page.waitForTimeout(400);
    await page.screenshot({ path: resolve(out, `${name}${suffix}.png`) });
    console.log(`[capture] ${name}${suffix}`);
  };
  try {
    await fn(page, shot);
  } catch (e) {
    problems.push(`${name} : ${e.message}`);
    await shot('-ERREUR');
  }
  await ctx.close();
}
const idle = (page) => page.evaluate(() => window.__haystack.map.whenIdle());

await run('onglets-c04', { path: '/?debug&case=c04' }, async (page, shot) => {
  await page.click('[data-testid=brief-start]');
  await page.waitForTimeout(300);
  await idle(page);
  const tabs = await page.locator('[role=tab]').count();
  if (tabs !== 2) problems.push(`onglets-c04 : ${tabs} onglets (attendu 2)`);
  await page.click('[data-testid=tab-s4]');
  await shot();
});

await run(
  'approche-bonus',
  { path: '/?debug&case=bonus-aiguilles', save: saveWith({}, { c00: SOLVED_C00 }) },
  async (page, shot) => {
    await page.click('[data-testid=brief-start]');
    await page.waitForTimeout(300);
    await idle(page);
    await page.touchscreen.tap(200, 400);
    await page.waitForSelector('[data-testid=toast]');
    const t = await page.textContent('[data-testid=toast]');
    if (!/Rapprochez/.test(t ?? '')) problems.push(`approche : toast « ${t} »`);
    await page.waitForTimeout(250);
    await shot();
    await idle(page);
    const z = await page.evaluate(() => window.__haystack.map.getCamera().zoom);
    if (z < 1.5) problems.push(`approche : zoom ${z} après le tap`);
  },
);

await run(
  'minicarte',
  {
    path: '/?debug&case=c00',
    save: saveWith(
      {},
      {
        c00: {
          caseId: 'c00',
          status: 'active',
          steps: { s1: { found: ['c00.picotin.1'], hints: 0, mistakes: 0 } },
          pins: [{ x: 1700, y: 1950 }],
          notes: '',
        },
      },
    ),
  },
  async (page, shot) => {
    await idle(page);
    await page.click('[data-testid=action-minimap]');
    await page.waitForSelector('[data-testid=minimap]');
    await shot();
    const box = await page.locator('.minimap-view').boundingBox();
    await page.touchscreen.tap(box.x + box.width * 0.75, box.y + box.height * 0.3);
    await page.waitForTimeout(300);
    await idle(page);
    const c = await page.evaluate(() => window.__haystack.map.getCamera());
    if (c.x < 4000) problems.push(`minicarte : la caméra n'a pas bougé (${c.x.toFixed(0)})`);
    await shot('-apres');
  },
);

await run(
  'gaucher',
  {
    path: '/?case=c00',
    save: saveWith({ leftHanded: true }, { c00: { caseId: 'c00', status: 'active', steps: {}, pins: [], notes: 'x' } }),
  },
  async (page, shot) => {
    await page.waitForTimeout(300);
    await page.click('[data-testid=action-minimap]');
    await shot();
  },
);

await run('explorer-minicarte', { path: '/?screen=explorer' }, async (page, shot) => {
  await page.click('[data-testid=explore-minimap]');
  await page.waitForSelector('[data-testid=minimap]');
  await shot();
});

await run('paysage-accueil', { width: 844, height: 390, path: '/' }, async (_p, shot) => shot());
await run(
  'paysage-enquete',
  {
    width: 844,
    height: 390,
    path: '/?case=c00',
    save: saveWith({}, { c00: { caseId: 'c00', status: 'active', steps: {}, pins: [], notes: 'x' } }),
  },
  async (_p, shot) => shot(),
);
await run(
  'paysage-brief',
  { width: 844, height: 390, path: '/?case=c01', save: saveWith({}, { c00: SOLVED_C00 }) },
  async (_p, shot) => shot(),
);
await run(
  'tablette-dossiers',
  { width: 820, height: 1180, path: '/?screen=dossiers', save: saveWith({}, { c00: SOLVED_C00 }) },
  async (_p, shot) => shot(),
);
await run(
  'tablette-enquete',
  {
    width: 820,
    height: 1180,
    path: '/?case=c01',
    save: saveWith({}, { c00: SOLVED_C00, c01: { caseId: 'c01', status: 'active', steps: {}, pins: [], notes: 'x' } }),
  },
  async (_p, shot) => shot(),
);
await run('bureau-accueil', { width: 1440, height: 900, dpr: 1, path: '/' }, async (_p, shot) => shot());
await run(
  'petit-ecran',
  {
    width: 360,
    height: 640,
    path: '/?case=c00',
    save: saveWith({}, { c00: { caseId: 'c00', status: 'active', steps: {}, pins: [], notes: 'x' } }),
  },
  async (_p, shot) => shot(),
);
await run('petit-accueil', { width: 360, height: 640, path: '/' }, async (_p, shot) => shot());
await run('carte-seule', { path: '/?ui=0&x=2850&y=2060&zoom=2' }, async (_p, shot) => shot());

await run('regles', { path: '/?screen=regles' }, async (page, shot) => {
  for (let i = 2; i <= 4; i++) {
    await page.click('[data-testid=howto-next]');
    await shot(`-${i}`);
  }
});

await run('reglages-reset', { path: '/?screen=reglages', save: saveWith({}, { c00: SOLVED_C00 }) }, async (page, shot) => {
  await page.click('[data-testid=reset]');
  await shot();
  await page.click('[data-testid=reset-confirm]');
  const s = await page.evaluate(() => JSON.parse(localStorage.getItem('haystack:v1')));
  if (Object.keys(s.cases).length !== 0) problems.push('réinitialisation : progression non effacée');
});

await run(
  'indice-niveau3',
  {
    path: '/?debug&case=c00',
    save: saveWith(
      {},
      {
        c00: {
          caseId: 'c00',
          status: 'active',
          steps: { s1: { found: ['c00.picotin.1'], hints: 0, mistakes: 0 } },
          pins: [],
          notes: '',
        },
      },
    ),
  },
  async (page, shot) => {
    await idle(page);
    for (let i = 0; i < 3; i++) {
      await page.click('[data-testid=action-hint]');
      await page.click('[data-testid=hint-confirm]');
      await page.waitForTimeout(200);
    }
    await page.waitForTimeout(400);
    await idle(page);
    await shot();
  },
);

await run('dossiers-bas', { path: '/?screen=dossiers', save: saveWith({}, { c00: SOLVED_C00 }) }, async (page, shot) => {
  await page.evaluate(() => document.querySelector('.cases .scroll').scrollTo(0, 99999));
  await shot();
});

await run('chargement', { path: '/?screen=accueil' }, async (page, shot) => {
  // Écran de chargement rendu seul (le monde est déjà construit) pour la capture.
  await page.evaluate(() => {
    const el = document.createElement('div');
    el.innerHTML =
      '<div class="screen loading" style="z-index:99"><div class="loading-box"><div class="loading-mark"><span class="loading-lens"></span></div><p class="loading-text">Meulebourg se réveille…</p><p class="loading-sub">On dessine les rues, les passants et les pigeons.</p></div></div>';
    document.querySelector('.ui-root').appendChild(el.firstChild);
  });
  await shot();
});

await browser.close();
await server.close();
console.log(problems.length ? `\n${problems.length} problème(s) :\n${problems.join('\n')}` : '\nOK : aucun problème.');
