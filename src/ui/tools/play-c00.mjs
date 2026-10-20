// Joue le tutoriel c00 de bout en bout sur un téléphone émulé (taps réels sur l'écran, positions
// obtenues via window.__haystack et worldToScreen), vérifie chaque étape et la console, et capture
// les états clés (briefing, sélection + vignette, bonne réponse, fausse piste, erreur, indices,
// fil rouge, carnet, fin, reconstitution).
// Usage : node src/ui/tools/play-c00.mjs [dossier-de-sortie]   (défaut : .shots/ui/play)
import { createServer } from 'vite';
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..', '..', '..');
const out = resolve(process.argv[2] ?? resolve(root, '.shots/ui/play'));
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
const errors = [];
const check = (cond, msg) => {
  if (!cond) {
    errors.push(`ÉCHEC : ${msg}`);
    console.log(`  ✗ ${msg}`);
  } else console.log(`  ✓ ${msg}`);
};

try {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await ctx.newPage();
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') {
      console.log(`[page:${m.type()}] ${m.text()}`);
      if (m.type() === 'error') errors.push(`console : ${m.text()}`);
    }
  });
  page.on('pageerror', (e) => {
    console.log('[pageerror]', e.message);
    errors.push(`exception : ${e.message}`);
  });

  const shot = async (name) => {
    await page.waitForTimeout(350);
    await page.screenshot({ path: resolve(out, `${name}.png`) });
    console.log(`[capture] ${name}`);
  };
  const idle = () => page.evaluate(() => window.__haystack.map.whenIdle());
  /** Tape réellement l'écran sur une entité (ou un point monde), après l'avoir amenée dans la zone libre si besoin. */
  const tapWorld = async (target) => {
    const pos = await page.evaluate((t) => {
      const h = window.__haystack;
      const p = typeof t === 'string' ? h.entityCenter(t) : t;
      let s = h.map.worldToScreen(p);
      if (
        !h.host.isFree(s) ||
        s.y > h.host.viewport().height - h.host.getInsets().bottom - 30 ||
        s.y < h.host.getInsets().top + 30
      ) {
        h.map.setCamera(h.host.cameraFor(p, h.map.getCamera().zoom));
        s = h.map.worldToScreen(p);
      }
      return s;
    }, target);
    await idle();
    await page.touchscreen.tap(pos.x, pos.y);
    return pos;
  };
  const designate = async (target) => {
    // Le voile anti double tap avale les appuis pendant 320 ms après un changement de feuille.
    await page.waitForTimeout(400);
    await tapWorld(target);
    await page.waitForSelector('[data-testid=confirm-sheet]', { timeout: 5000 });
  };

  await page.goto(`${base}/?debug&case=c00${process.env.EXTRA ?? ''}`);
  await page.waitForFunction(() => window.__haystackReady === true, null, { timeout: 30000 });
  // Le HUD de débogage n'a pas sa place sur les captures.
  await page.addStyleTag({ content: '.debug-hud { display: none !important; }' });
  check(await page.isVisible('[data-testid=briefing]'), 'briefing affiché au premier lancement');
  await shot('01-briefing');

  await page.click('[data-testid=brief-start]');
  await page.waitForTimeout(300);
  await idle();
  const cam = await page.evaluate(() => window.__haystack.map.getCamera());
  check(Math.abs(cam.zoom - 1.6) < 0.01, `vol vers def.start (zoom ${cam.zoom.toFixed(2)})`);
  await shot('02-question');

  // Étape 1 : Picotin.
  await designate('c00.picotin.1');
  check(await page.isVisible('canvas.thumb'), 'vignette dans la feuille de confirmation');
  await shot('03-selection');
  await page.click('[data-testid=confirm-designate]');
  await page.waitForSelector('[data-testid=result-solved]');
  check(true, 'étape 1 résolue (Picotin)');
  await shot('04-bonne-reponse');
  await page.click('[data-testid=result-continue]');

  // Étape 2 : fausse piste (le livreur plus tôt), puis erreur, puis indices, puis bonne réponse.
  await designate('c00.livreur.1');
  await page.click('[data-testid=confirm-designate]');
  await page.waitForSelector('[data-testid=result-near]');
  check(true, 'fausse piste reconnue (livreur avec la tarte)');
  await shot('05-fausse-piste');
  await page.click('[data-testid=result-continue]');

  // Un point vide, loin des réponses : erreur.
  const empty = await page.evaluate(() => {
    const h = window.__haystack;
    const s = h.session;
    const step = s.openSteps()[0];
    const ids = new Set([...step.accept, ...(step.nearMiss ?? []).map((n) => n.id)]);
    const c = h.map.getCamera();
    for (let dy = -60; dy <= 120; dy += 12) {
      for (let dx = -120; dx <= 120; dx += 12) {
        const p = { x: c.x + dx, y: c.y + dy };
        const pick = h.pickAt(h.world, p, c.zoom);
        if (pick.entityId === null && h.host.isFree(h.map.worldToScreen(p))) return p;
        if (
          pick.entityId &&
          !ids.has(pick.entityId) &&
          !pick.entityId.startsWith('b.') &&
          !pick.entityId.startsWith('lm.') &&
          h.host.isFree(h.map.worldToScreen(p))
        )
          return p;
      }
    }
    return null;
  });
  await designate(empty);
  await page.click('[data-testid=confirm-designate]');
  await page.waitForSelector('[data-testid=toast]');
  const toast = await page.textContent('[data-testid=toast]');
  check(/pas ça|Pas tout/.test(toast ?? ''), `erreur signalée sans humilier (« ${toast} »)`);
  await page.waitForTimeout(250);
  await shot('06-erreur');

  // Indices : niveau 1 puis 2 (projecteur).
  await page.click('[data-testid=action-hint]');
  check(await page.isVisible('[data-testid=hint-ask]'), 'confirmation d’indice intégrée');
  await shot('07-indice-confirmation');
  await page.click('[data-testid=hint-confirm]');
  check(await page.isVisible('[data-testid=hint-box]'), 'indice niveau 1 affiché');
  await page.click('[data-testid=action-hint]');
  await page.click('[data-testid=hint-confirm]');
  await page.waitForTimeout(400);
  await idle();
  const level = await page.evaluate(() => window.__haystack.session.currentHint('s2')?.level);
  check(level === 2, `indice niveau 2 (${level})`);
  await shot('08-indice-niveau2');

  await designate('c00.livreur.2');
  await page.click('[data-testid=confirm-designate]');
  await page.waitForSelector('[data-testid=result-solved]');
  check(true, 'étape 2 résolue (livreur endormi)');
  await page.click('[data-testid=result-continue]');
  await page.waitForTimeout(300);
  await shot('09-fil-rouge');

  // Punaise.
  await page.click('[data-testid=action-pin]');
  check(await page.isVisible('[data-testid=pin-banner]'), 'mode punaise');
  const cam2 = await page.evaluate(() => window.__haystack.map.getCamera());
  await tapWorld({ x: cam2.x + 40, y: cam2.y - 80 });
  await page.waitForTimeout(400);
  const pins = await page.evaluate(() => window.__haystack.session.pins().length);
  check(pins === 1, `punaise posée (${pins})`);

  // Carnet.
  await page.click('[data-testid=open-notebook]');
  await page.waitForSelector('[data-testid=notebook]');
  await page.fill('[data-testid=notes]', 'Le livreur dort. Qui a mangé la tarte ?');
  await page.waitForTimeout(700);
  await page.evaluate(() => document.querySelector('.nb-scroll')?.scrollTo(0, 0));
  await shot('10-carnet');
  await page.click('[data-testid=notebook-close]');
  const notes = await page.evaluate(() => window.__haystack.session.notes());
  check(notes.includes('livreur'), 'notes enregistrées');

  // Étape 3 : Croquette.
  await designate('c00.croquette');
  await page.click('[data-testid=confirm-designate]');
  await page.waitForSelector('[data-testid=result-solved]');
  check(await page.textContent('[data-testid=result-continue]').then((t) => /Conclure/.test(t ?? '')), 'enquête résolue');
  await page.click('[data-testid=result-continue]');
  await page.waitForSelector('[data-testid=case-end]');
  await page.waitForTimeout(400);
  await idle();
  await shot('11-fin');

  await page.click('[data-testid=end-replay]');
  await page.waitForSelector('[data-testid=replay]');
  await page.waitForTimeout(300);
  await idle();
  await shot('12-reconstitution');
  await page.click('[data-testid=replay-close]');
  await page.click('[data-testid=end-exit]');
  await page.waitForSelector('[data-testid=screen-cases]');
  const save = await page.evaluate(() => JSON.parse(localStorage.getItem('haystack:v1') ?? 'null'));
  check(save?.cases?.c00?.status === 'solved', `sauvegarde : c00 résolu (${save?.cases?.c00?.stars} étoiles)`);
  await shot('13-dossiers-apres');

  // Rechargement : la progression est relue.
  await page.goto(`${base}/?screen=dossiers`);
  await page.waitForFunction(() => window.__haystackReady === true, null, { timeout: 30000 });
  const unlocked = await page.evaluate(
    () => !document.querySelector('[data-testid=folder-c01]')?.closest('.folder')?.classList.contains('locked'),
  );
  check(unlocked, 'c01 débloqué après rechargement');
  await ctx.close();
} finally {
  await browser.close();
  await server.close();
}
console.log(errors.length === 0 ? '\nOK : tutoriel joué sans erreur.' : `\n${errors.length} problème(s) :\n${errors.join('\n')}`);
process.exit(errors.length === 0 ? 0 : 1);
