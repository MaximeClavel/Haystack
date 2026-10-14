// 5. Explorer la ville (glisser au doigt, nom du lieu, tap sur un lieu remarquable), minicarte,
// « Comment jouer », réglages (mouvement réduit, mode gaucher, réinitialisation de la progression).
import type { Page } from '@playwright/test';
import type { CameraState, Vec2 } from '../../src/types';
import { expect, mapIdle, openGame, readSave, tapUi, tapWorld, test } from './helpers';

const camera = (page: Page): Promise<CameraState> => page.evaluate(() => window.__haystack.map.getCamera());

/** Glisser d'un doigt (événements tactiles CDP), lâché à l'arrêt pour éviter l'inertie. */
async function touchDrag(page: Page, from: Vec2, to: Vec2, ms = 300): Promise<void> {
  const cdp = await page.context().newCDPSession(page);
  const pt = (p: Vec2) => [{ x: p.x, y: p.y, id: 1, radiusX: 2, radiusY: 2, force: 1 }];
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pt(from) });
  const steps = Math.max(2, Math.round(ms / 16));
  for (let k = 1; k <= steps; k++) {
    const u = k / steps;
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: pt({ x: from.x + (to.x - from.x) * u, y: from.y + (to.y - from.y) * u }),
    });
    await page.waitForTimeout(16);
  }
  await page.waitForTimeout(150);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await cdp.detach();
}

/**
 * Tap sur la minicarte à une position relative (0–1). Le tap attend que la minicarte soit stable
 * (fin de son animation d'apparition) : la position est prise dans la boîte finale.
 */
async function tapMinimap(page: Page, rel: Vec2): Promise<void> {
  const view = page.getByTestId('minimap').locator('canvas.minimap-view');
  const size = await view.evaluate((c) => ({ w: c.clientWidth, h: c.clientHeight }));
  await view.tap({ position: { x: size.w * rel.x, y: size.h * rel.y } });
}

/** Centre de la zone libre de la carte (hors barres d'interface), en coordonnées monde. */
const freeCenter = (page: Page): Promise<Vec2> =>
  page.evaluate(() => {
    const r = window.__haystack.host.freeWorldRect();
    return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
  });

test('explorer la ville : glisser, nom du lieu, lieu remarquable, minicarte', async ({ page }) => {
  test.setTimeout(90_000);
  await openGame(page);
  await tapUi(page.getByTestId('menu-explore'));
  await expect(page.getByTestId('screen-explore')).toBeVisible();
  await mapIdle(page);
  const place = page.getByTestId('place');
  await expect(place).not.toBeEmpty();
  const start = await camera(page);
  expect(start.zoom).toBeCloseTo(1, 1);

  // Glisser d'un doigt vers la gauche : la vue part vers l'est.
  const vp = page.viewportSize()!;
  const mid = { x: vp.width / 2, y: vp.height / 2 };
  await touchDrag(page, { x: mid.x + 120, y: mid.y }, { x: mid.x - 120, y: mid.y });
  await mapIdle(page);
  const moved = await camera(page);
  expect(moved.x - start.x).toBeGreaterThan(150 / start.zoom);
  expect(Math.abs(moved.y - start.y)).toBeLessThan(40);

  // Tap sur un lieu remarquable bâti : son nom s'affiche.
  const target = await page.evaluate(() => {
    const h = window.__haystack;
    for (const lm of h.world.landmarks) {
      if (lm.kind !== 'building' || !lm.entityId) continue;
      const r = h.world.bounds.get(lm.entityId);
      if (!r) continue;
      // Un point du toit qui désigne bien le bâtiment au zoom 2.
      for (let fy = 0.15; fy < 0.6; fy += 0.05) {
        for (let fx = 0.3; fx <= 0.7; fx += 0.1) {
          const p = { x: r.x + r.w * fx, y: r.y + r.h * fy };
          if (h.pickAt(h.world, p, 2).entityId === lm.entityId) return { p, name: lm.name };
        }
      }
    }
    return null;
  });
  expect(target).not.toBeNull();
  const tap = await tapWorld(page, target!.p);
  expect(tap.picked).not.toBeNull();
  await expect(page.getByTestId('toast')).toHaveText(target!.name);
  // Le nom du lieu suit la caméra.
  await expect(place).not.toBeEmpty();

  // Minicarte : s'ouvre, un tap y emmène la caméra, se ferme.
  const toggle = page.getByTestId('explore-minimap');
  await tapUi(toggle);
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  const mini = page.getByTestId('minimap');
  await expect(mini).toBeVisible();
  const rel = { x: 0.3, y: 0.65 };
  await tapMinimap(page, rel);
  const goal = await page.evaluate((r) => ({ x: r.x * window.__haystack.world.width, y: r.y * window.__haystack.world.height }), rel);
  await expect
    .poll(async () => {
      await mapIdle(page);
      const c = await freeCenter(page);
      return Math.hypot(c.x - goal.x, c.y - goal.y);
    })
    .toBeLessThan(60);
  await tapUi(mini.getByRole('button', { name: 'Fermer la minicarte' }));
  await expect(mini).toHaveCount(0);
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');

  await tapUi(page.getByTestId('back'));
  await expect(page.getByTestId('screen-home')).toBeVisible();
});

test('minicarte pendant une enquête', async ({ page }) => {
  await openGame(page, '&case=c00');
  await tapUi(page.getByTestId('brief-start'));
  await mapIdle(page);
  await tapUi(page.getByTestId('action-minimap'));
  const mini = page.getByTestId('minimap');
  await expect(mini).toBeVisible();
  await expect(page.getByTestId('action-minimap')).toHaveAttribute('aria-pressed', 'true');
  await tapMinimap(page, { x: 0.7, y: 0.3 });
  const goal = await page.evaluate(() => ({ x: 0.7 * window.__haystack.world.width, y: 0.3 * window.__haystack.world.height }));
  await expect
    .poll(async () => {
      await mapIdle(page);
      const c = await freeCenter(page);
      return Math.hypot(c.x - goal.x, c.y - goal.y);
    })
    .toBeLessThan(60);
  await tapUi(page.getByTestId('action-minimap'));
  await expect(mini).toHaveCount(0);
});

test('comment jouer : quatre étapes puis les dossiers', async ({ page }) => {
  await openGame(page);
  const howto = page.getByTestId('menu-howto');
  await expect(howto.locator('.dot-new')).toHaveCount(1);
  await tapUi(howto);
  await expect(page.getByTestId('screen-howto')).toContainText('Étape 1 sur 4');
  for (let k = 2; k <= 4; k++) {
    await tapUi(page.getByTestId('howto-next'));
    await expect(page.getByTestId('screen-howto')).toContainText(`Étape ${k} sur 4`);
  }
  await tapUi(page.getByTestId('howto-done'));
  await expect(page.getByTestId('screen-cases')).toBeVisible();
  expect((await page.evaluate(() => window.__haystack.store.get().seenHowTo))).toBe(true);
  await tapUi(page.getByTestId('back'));
  await expect(page.getByTestId('menu-howto').locator('.dot-new')).toHaveCount(0);
});

test('réglages : mouvement réduit, mode gaucher, réinitialisation de la progression', async ({ page }) => {
  test.setTimeout(90_000);
  await openGame(page);
  // L'accueil dérive lentement (mouvement normal) : la caméra finit par bouger.
  const a = await camera(page);
  await expect
    .poll(async () => {
      const b = await camera(page);
      return Math.hypot(b.x - a.x, b.y - a.y);
    }, { timeout: 8_000 })
    .toBeGreaterThan(2);

  await tapUi(page.getByTestId('menu-settings'));
  await expect(page.getByTestId('screen-settings')).toBeVisible();
  // Aucune progression : rien à réinitialiser.
  await expect(page.getByTestId('reset')).toBeDisabled();

  // Mouvement réduit.
  const motion = page.locator('#set-motion');
  await expect(motion).toHaveAttribute('aria-checked', 'false');
  await tapUi(motion);
  await expect(motion).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-reduced', '');
  expect((await readSave(page))?.settings.reducedMotion).toBe(true);
  // Les vols de la carte deviennent instantanés.
  const instant = await page.evaluate(async () => {
    const m = window.__haystack.map;
    const t = performance.now();
    await m.flyTo({ x: 3000, y: 2000, zoom: 1.2 });
    const c = m.getCamera();
    return { ms: performance.now() - t, ok: Math.abs(c.x - 3000) < 1 && Math.abs(c.zoom - 1.2) < 0.01 };
  });
  expect(instant.ok).toBe(true);
  expect(instant.ms).toBeLessThan(150);

  // Mode gaucher.
  const left = page.locator('#set-left');
  await tapUi(left);
  await expect(left).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-hand', 'left');
  await tapUi(left);
  await expect(page.locator('html')).toHaveAttribute('data-hand', 'right');

  // Le réglage survit au rechargement ; l'accueil ne dérive plus.
  await page.reload();
  await page.waitForFunction(() => window.__haystackReady === true, null, { timeout: 45_000 });
  await expect(page.locator('html')).toHaveAttribute('data-reduced', '');
  const c1 = await camera(page);
  await page.waitForTimeout(2_500);
  const c2 = await camera(page);
  expect(Math.hypot(c2.x - c1.x, c2.y - c1.y)).toBeLessThan(0.01);

  // Un peu de progression, par le jeu : une punaise posée dans le tutoriel.
  await tapUi(page.getByTestId('menu-cases'));
  await tapUi(page.getByTestId('folder-c00'));
  await tapUi(page.getByTestId('brief-start'));
  await mapIdle(page);
  await tapUi(page.getByTestId('action-pin'));
  await expect(page.getByTestId('pin-banner')).toBeVisible();
  const cam = await freeCenter(page);
  await tapWorld(page, { x: cam.x + 30, y: cam.y - 30 }, (await camera(page)).zoom);
  await expect(page.getByTestId('toast')).toContainText('Punaise posée');
  expect((await readSave(page))?.cases.c00?.status).toBe('active');
  await tapUi(page.getByTestId('back'));
  await expect(page.getByTestId('folder-c00')).toContainText('En cours');
  await tapUi(page.getByTestId('back'));

  // Réinitialisation : confirmation intégrée, annulable.
  await tapUi(page.getByTestId('menu-settings'));
  const reset = page.getByTestId('reset');
  await expect(reset).toBeEnabled();
  await tapUi(reset);
  await tapUi(page.getByRole('button', { name: 'Annuler' }));
  expect((await readSave(page))?.cases.c00?.status).toBe('active');
  await tapUi(reset);
  await tapUi(page.getByTestId('reset-confirm'));
  await expect(page.getByTestId('toast')).toHaveText('Progression réinitialisée');
  const save = await readSave(page);
  expect(save?.cases).toEqual({});
  // Les réglages sont conservés.
  expect(save?.settings.reducedMotion).toBe(true);
  await expect(page.getByTestId('reset')).toBeDisabled();
  await tapUi(page.getByTestId('back'));
  await tapUi(page.getByTestId('menu-cases'));
  await expect(page.getByTestId('folder-c00')).toContainText('Nouveau');
  await expect(page.getByTestId('folder-c01')).toHaveAttribute('aria-disabled', 'true');
});
