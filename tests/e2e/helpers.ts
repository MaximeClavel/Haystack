// Outils partagés des tests de bout en bout (téléphone émulé, voir playwright.config.ts).
//
// Principe : les positions viennent du mode debug (`?debug` → window.__haystack) mais tous les
// gestes sont de VRAIS taps sur l'écran (page.touchscreen.tap / locator.tap) ; le résultat est
// vérifié dans l'interface (feuilles, toasts) et dans la sauvegarde.
import { test as base, expect, type Locator, type Page, type TestInfo } from '@playwright/test';
import type { Vec2 } from '../../src/types';
import type { DebugApi } from '../../src/ui/debug';

declare global {
  interface Window {
    __haystack: DebugApi;
  }
}

/** Zoom auquel on désigne (au-dessus de PICK_MIN_ZOOM = 1,5, comme un joueur qui s'est rapproché). */
export const PLAY_ZOOM = 2;
/** Clé de sauvegarde (src/config.ts : STORAGE_KEY). */
export const STORAGE_KEY = 'haystack:v1';

/**
 * `test` avec une surveillance automatique de la console : toute erreur console, exception de
 * page, réponse HTTP en erreur ou requête échouée fait échouer le test (les avertissements de la
 * console sont seulement recopiés dans le rapport).
 */
export const test = base.extend<{ consoleErrors: string[] }>({
  consoleErrors: [
    async ({ page }, use, testInfo) => {
      const errors: string[] = [];
      page.on('console', (m) => {
        if (m.type() === 'error') errors.push(`console.error : ${m.text()}`);
        else if (m.type() === 'warning') testInfo.annotations.push({ type: 'avertissement console', description: m.text() });
      });
      page.on('pageerror', (e) => errors.push(`exception : ${e.message}`));
      // Ressources introuvables ou refusées (police, icône, module…).
      page.on('response', (r) => {
        if (r.status() >= 400) errors.push(`réponse HTTP ${r.status()} : ${r.url()}`);
      });
      page.on('requestfailed', (r) => {
        const why = r.failure()?.errorText ?? '';
        // Requêtes interrompues par une navigation (rechargement) : sans conséquence.
        if (!/ERR_ABORTED/.test(why)) errors.push(`requête échouée : ${r.url()} (${why})`);
      });
      await use(errors);
      expect(errors, 'aucune erreur dans la console').toEqual([]);
    },
    { auto: true },
  ],
});
export { expect };

/** Ouvre le jeu et attend la fin du premier rendu (window.__haystackReady). */
export async function openGame(page: Page, query = ''): Promise<void> {
  await page.goto(`/?debug${query}`);
  await page.waitForFunction(() => window.__haystackReady === true, null, { timeout: 45_000 });
}

/** Attend que la carte soit au repos (aucune animation, tuiles visibles rendues). */
export async function mapIdle(page: Page): Promise<void> {
  await page.evaluate(() => window.__haystack.map.whenIdle());
}

/** Tap tactile réel sur un élément d'interface. */
export async function tapUi(target: Locator): Promise<void> {
  await target.waitFor({ state: 'visible' });
  await target.tap();
}

export interface TapReport {
  /** Point écran tapé (px CSS). */
  screen: Vec2;
  /** Point monde visé. */
  world: Vec2;
  /** Entité désignée par le tap réel, lue dans le HUD de débogage (pickAt au lâcher du doigt). */
  picked: string | null;
}

/**
 * Amène la caméra sur `target` (id d'entité ou de zone, ou point monde) au zoom `zoom`, au centre
 * de la zone libre (entre la barre haute et le panneau de question), attend le repos, vérifie que
 * le point n'est pas sous l'interface, puis TAPE l'écran à cet endroit.
 */
export async function tapWorld(page: Page, target: string | Vec2, zoom = PLAY_ZOOM): Promise<TapReport> {
  const pos = await page.evaluate(
    async ({ t, z }) => {
      const h = window.__haystack;
      const p = typeof t === 'string' ? h.entityCenter(t) : t;
      await h.map.flyTo(h.host.cameraFor(p, z), { duration: 300 });
      await h.map.whenIdle();
      const s = h.map.worldToScreen(p);
      const el = document.elementFromPoint(s.x, s.y);
      return {
        world: p,
        screen: s,
        onMap: el === h.host.canvas,
        under: el ? `${el.tagName.toLowerCase()}.${String(el.className)}` : 'rien',
      };
    },
    { t: target, z: zoom },
  );
  expect(pos.onMap, `le point visé (${fmt(pos.screen)}) doit être sur la carte, pas sous l'interface (${pos.under})`).toBe(true);
  await page.touchscreen.tap(pos.screen.x, pos.screen.y);
  // Le HUD de débogage note, dès le lâcher du doigt, le point monde touché et l'entité désignée
  // (pickAt au zoom courant) : on attend la ligne qui correspond à CE tap.
  const hud = page.locator('.debug-hud');
  let picked: string | null = null;
  await expect
    .poll(
      async () => {
        const m = /appui \((-?\d+), (-?\d+)\) (\S+)/.exec((await hud.textContent()) ?? '');
        if (!m || Math.abs(Number(m[1]) - pos.world.x) > 3 || Math.abs(Number(m[2]) - pos.world.y) > 3) return false;
        picked = m[3] === '—' ? null : m[3];
        return true;
      },
      { message: `le tap en (${fmt(pos.screen)}) doit atteindre la carte`, timeout: 3_000 },
    )
    .toBe(true);
  return { screen: pos.screen, world: pos.world, picked };
}

/** Choisit la question à laquelle on répond quand plusieurs sont ouvertes (onglets). */
export async function selectStep(page: Page, stepId: string): Promise<void> {
  const tab = page.getByTestId(`tab-${stepId}`);
  if (await tab.isVisible()) {
    if ((await tab.getAttribute('aria-selected')) !== 'true') await tapUi(tab);
    await expect(tab).toHaveAttribute('aria-selected', 'true');
  }
  const active = await page.evaluate(() => {
    const s = window.__haystack.session;
    return s ? s.openSteps().map((x) => x.id) : [];
  });
  expect(active, `la question ${stepId} doit être ouverte`).toContain(stepId);
}

/**
 * Tape la cible et attend la feuille de confirmation. Renvoie ce que le tap a réellement désigné.
 * Si la feuille n'apparaît pas, capture l'écran pour le diagnostic.
 */
export async function tapAndSelect(page: Page, target: string | Vec2, testInfo?: TestInfo): Promise<TapReport> {
  const report = await tapWorld(page, target);
  try {
    await page.getByTestId('confirm-sheet').waitFor({ state: 'visible', timeout: 5_000 });
  } catch (err) {
    if (testInfo) await attachShot(page, testInfo, `pas-de-confirmation-${String(target)}`);
    throw err;
  }
  return report;
}

/** Joint une capture d'écran au rapport du test. */
export async function attachShot(page: Page, testInfo: TestInfo, name: string): Promise<void> {
  const body = await page.screenshot();
  await testInfo.attach(name.replace(/[^a-z0-9._-]+/gi, '_'), { body, contentType: 'image/png' });
}

export function fmt(p: Vec2): string {
  return `${p.x.toFixed(0)}, ${p.y.toFixed(0)}`;
}

/** Point de la carte proche de la caméra où un tap ne désigne aucune réponse ni fausse piste de l'étape. */
export async function findEmptySpot(page: Page, stepId: string): Promise<Vec2> {
  const p = await page.evaluate((sid) => {
    const h = window.__haystack;
    const s = h.session;
    if (!s) return null;
    const step = s.getStep(sid);
    const ids = new Set([...step.accept, ...(step.nearMiss ?? []).map((n) => n.id)]);
    const z = 2;
    const free = h.host.freeWorldRect();
    const c = { x: free.x + free.w / 2, y: free.y + free.h / 2 };
    for (let r = 20; r <= 200; r += 12) {
      for (let a = 0; a < 16; a++) {
        const q = { x: c.x + r * Math.cos((a / 16) * 2 * Math.PI), y: c.y + r * Math.sin((a / 16) * 2 * Math.PI) };
        const pick = h.pickAt(h.world, q, z);
        if (pick.entityId === null) return q;
        if (ids.has(pick.entityId)) continue;
        // Une réponse « bâtiment » ou une zone pourrait contenir le point : on évite les bâtiments.
        const e = h.world.byId.get(pick.entityId);
        if (e && e.kind !== 'building') return q;
      }
    }
    return null;
  }, stepId);
  expect(p, 'un point « vide » doit exister près de la caméra').not.toBeNull();
  return p as Vec2;
}

/** Luminance moyenne (0–255) d'un carré du canevas de la carte, centré sur un point écran (px CSS). */
export async function mapLuminance(page: Page, at: Vec2, size = 24): Promise<number> {
  return page.evaluate(
    ({ at, size }) => {
      const c = window.__haystack.host.canvas;
      const k = c.width / c.clientWidth;
      const w = Math.round(size * k);
      // Copie du carré dans un petit canevas lisible (pas de relecture répétée du canevas de la carte).
      const tmp = document.createElement('canvas');
      tmp.width = w;
      tmp.height = w;
      const ctx = tmp.getContext('2d', { willReadFrequently: true });
      if (!ctx) return -1;
      ctx.drawImage(c, Math.max(0, Math.round((at.x - size / 2) * k)), Math.max(0, Math.round((at.y - size / 2) * k)), w, w, 0, 0, w, w);
      const d = ctx.getImageData(0, 0, w, w).data;
      let sum = 0;
      for (let i = 0; i < d.length; i += 4) sum += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
      return sum / (d.length / 4);
    },
    { at, size },
  );
}

/** Lit la sauvegarde telle qu'enregistrée dans le navigateur. */
export async function readSave(page: Page): Promise<{
  cases: Record<string, { status: string; stars?: number; steps: Record<string, { found: string[]; hints: number; mistakes: number }> }>;
  settings: { haptics: boolean; leftHanded: boolean; reducedMotion: boolean };
} | null> {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null'), STORAGE_KEY);
}
