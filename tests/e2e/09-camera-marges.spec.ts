// 9. Bornes de la caméra et marges de l'interface : la barre haute et le panneau de question comptent
// (moteur : clampCamera(…, insets), mapHost.setInsets → map.setInsets). Sur c03, au zoom d'ensemble, la rive
// sud (jardins ouvriers, quais) restait sous le panneau de question : glisser ne faisait plus rien.
import type { Page } from '@playwright/test';
import type { Vec2 } from '../../src/types';
import { expect, mapIdle, openGame, tapUi, test } from './helpers';

const PHONES = [
  { width: 390, height: 844 },
  { width: 412, height: 915 },
];

/** Bords nord et sud de la ville à l'écran, et limites de la zone libre (entre la barre haute et le panneau). */
const frame = (page: Page) =>
  page.evaluate(() => {
    const h = window.__haystack;
    const ins = h.host.getInsets();
    const vp = h.host.viewport();
    return {
      south: h.map.worldToScreen({ x: h.world.width / 2, y: h.world.height }).y,
      north: h.map.worldToScreen({ x: h.world.width / 2, y: 0 }).y,
      freeTop: ins.top,
      freeBottom: vp.height - ins.bottom,
      zoom: h.map.getCamera().zoom,
    };
  });

/** Ouvre c03 (briefing passé) sur un téléphone de la taille demandée. */
async function openC03(page: Page, size: { width: number; height: number }): Promise<void> {
  await page.setViewportSize(size);
  await openGame(page, '&case=c03');
  await tapUi(page.getByTestId('brief-start'));
  await expect(page.getByTestId('screen-case')).toHaveAttribute('data-phase', 'play');
  await mapIdle(page);
}

/** Pincement à deux doigts (événements tactiles CDP) centré sur un point, de l'écartement d0 à d1. */
async function touchPinch(page: Page, center: Vec2, d0: number, d1: number, ms = 400): Promise<void> {
  const cdp = await page.context().newCDPSession(page);
  const pts = (d: number) => [
    { x: center.x - d / 2, y: center.y, id: 1, radiusX: 2, radiusY: 2, force: 1 },
    { x: center.x + d / 2, y: center.y, id: 2, radiusX: 2, radiusY: 2, force: 1 },
  ];
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pts(d0) });
  const steps = Math.max(4, Math.round(ms / 16));
  for (let k = 1; k <= steps; k++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pts(d0 + ((d1 - d0) * k) / steps) });
    await page.waitForTimeout(16);
  }
  await page.waitForTimeout(120);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await cdp.detach();
}

/** Glisser d'un doigt, lâché à l'arrêt (pas d'inertie). */
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

test('c03 : à tous les zooms, la rive sud passe au-dessus du panneau et le nord sous la barre haute', async ({ page }) => {
  test.setTimeout(90_000);
  for (const size of PHONES) {
    await openC03(page, size);
    const min = await page.evaluate(() => window.__haystack.map.getMinZoom());
    for (const zoom of [min, 0.1, 0.15, 0.188, 0.25, 0.5, 1, 2, 4]) {
      const z = Math.max(min, zoom);
      await page.evaluate((z) => window.__haystack.map.setCamera({ zoom: z, y: 1e6 }), z);
      const s = await frame(page);
      expect(s.south, `${size.width}×${size.height}, zoom ${z.toFixed(3)} : le bord sud est au-dessus du panneau`).toBeLessThanOrEqual(s.freeBottom + 0.5);
      await page.evaluate(() => window.__haystack.map.setCamera({ y: -1e6 }));
      const n = await frame(page);
      expect(n.north, `${size.width}×${size.height}, zoom ${z.toFixed(3)} : le bord nord est sous la barre haute`).toBeGreaterThanOrEqual(n.freeTop - 0.5);
    }
  }
});

test('c03 : dézoomé au doigt, un glissé vers le sud amène la rive sud au-dessus du panneau', async ({ page }) => {
  test.setTimeout(90_000);
  for (const size of PHONES) {
    await openC03(page, size);
    const free = await frame(page);
    const mid: Vec2 = { x: size.width / 2, y: (free.freeTop + free.freeBottom) / 2 };
    // Comme le joueur : trois pincements ×0,5 (1,5 → 0,19), où la ville tient presque en hauteur à l'écran.
    for (let k = 0; k < 3; k++) {
      await touchPinch(page, mid, 240, 120);
      await mapIdle(page);
    }
    const zoom = (await frame(page)).zoom;
    expect(zoom).toBeLessThan(0.25);
    // Le contenu monte avec le doigt : on va vers le sud. Plusieurs glissés, jusqu'à la butée.
    for (let k = 0; k < 4; k++) {
      await touchDrag(page, { x: mid.x + 40, y: mid.y + 150 }, { x: mid.x + 40, y: mid.y - 150 });
      await mapIdle(page);
    }
    const s = await frame(page);
    expect(s.south, `${size.width}×${size.height} : la rive sud est visible`).toBeLessThanOrEqual(s.freeBottom + 0.5);
    expect(s.south).toBeGreaterThan(s.freeTop);
    // Et le haut de la ville, depuis là, redescend sous la barre haute.
    for (let k = 0; k < 6; k++) {
      await touchDrag(page, { x: mid.x + 40, y: mid.y - 150 }, { x: mid.x + 40, y: mid.y + 150 });
      await mapIdle(page);
    }
    const n = await frame(page);
    expect(n.north, `${size.width}×${size.height} : le haut de la ville n'est pas caché par la barre`).toBeGreaterThanOrEqual(n.freeTop - 0.5);
  }
});

test('un panneau qui change de taille fait glisser les bornes sans saut de caméra', async ({ page }) => {
  test.setTimeout(60_000);
  await openC03(page, PHONES[0]);
  await page.waitForTimeout(1000); // les minuteries de l'interface (garde anti-double tap) ont fini de re-mesurer les marges
  const res = await page.evaluate(async () => {
    const h = window.__haystack;
    // Butée sud avec un grand panneau (fiche d'indice dépliée)…
    h.map.setCamera({ zoom: 0.188 });
    h.host.setInsets(62, 268);
    h.map.setCamera({ y: 1e6 });
    const at = h.map.getCamera().y;
    // …le panneau se replie : la butée recule, mais la caméra ne saute pas (elle suit en 180 ms).
    h.host.setInsets(62, 223);
    const right = h.map.getCamera().y;
    await h.map.whenIdle();
    const end = h.map.getCamera().y;
    // Cible : la butée de la nouvelle taille.
    h.map.setCamera({ y: 1e6 });
    const limit = h.map.getCamera().y;
    return { at, right, end, limit };
  });
  expect(res.right, 'pas de saut au changement de marges').toBe(res.at);
  expect(res.end, 'la caméra a glissé jusqu’à la nouvelle butée').toBeLessThan(res.at - 50);
  expect(res.end).toBeCloseTo(res.limit, 3);
});
