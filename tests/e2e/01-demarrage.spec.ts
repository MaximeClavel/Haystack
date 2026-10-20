// 1. Démarrage : l'accueil s'affiche sans erreur ; Enquêtes → Dossiers → ouverture du tutoriel.
import { expect, openGame, tapUi, test } from './helpers';

test('accueil, dossiers et ouverture du tutoriel', async ({ page }) => {
  await page.goto('/');
  // L'écran de chargement s'affiche avant la construction de la ville…
  await page.waitForFunction(() => window.__haystackReady === true, null, { timeout: 45_000 });
  // … puis l'accueil.
  const home = page.getByTestId('screen-home');
  await expect(home).toBeVisible();
  await expect(page.getByTestId('loading')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Haystack' })).toBeVisible();
  await expect(page.getByTestId('menu-cases')).toBeVisible();
  await expect(page.getByTestId('menu-explore')).toBeVisible();
  await expect(page.getByTestId('menu-howto')).toBeVisible();
  await expect(page.getByTestId('menu-settings')).toBeVisible();
  // Une seule carte, plein écran, sous l'interface.
  await expect(page.locator('canvas#map')).toHaveCount(1);
  const vp = page.viewportSize()!;
  const box = await page.locator('canvas#map').boundingBox();
  expect(box && Math.round(box.width) === vp.width && Math.round(box.height) === vp.height).toBe(true);
  // Aucune page ne défile.
  const scroll = await page.evaluate(() => ({
    w: document.documentElement.scrollWidth,
    h: document.documentElement.scrollHeight,
  }));
  expect(scroll.w).toBeLessThanOrEqual(vp.width);
  expect(scroll.h).toBeLessThanOrEqual(vp.height);

  // Dossiers.
  await tapUi(page.getByTestId('menu-cases'));
  await expect(page.getByTestId('screen-cases')).toBeVisible();
  const c00 = page.getByTestId('folder-c00');
  await expect(c00).toContainText('La Tarte de bienvenue');
  await expect(c00).toContainText('Tutoriel');
  await expect(c00).toContainText('Nouveau');
  // Les enquêtes suivantes sont verrouillées tant que le tutoriel n'est pas résolu.
  await expect(page.getByTestId('folder-c01')).toHaveAttribute('aria-disabled', 'true');
  await expect(page.getByTestId('folder-c01')).toContainText('Verrouillé');
  await expect(page.getByTestId('folder-bonus-aiguilles')).toHaveAttribute('aria-disabled', 'true');
  // Un dossier verrouillé ne s'ouvre pas (aria-disabled : tap forcé, comme un vrai doigt).
  await page.getByTestId('folder-c01').tap({ force: true });
  await page.waitForTimeout(300);
  await expect(page.getByTestId('screen-cases')).toBeVisible();

  // Ouverture du tutoriel : briefing.
  await tapUi(c00);
  const screen = page.getByTestId('screen-case');
  await expect(screen).toBeVisible();
  await expect(screen).toHaveAttribute('data-phase', 'brief');
  await expect(page.getByTestId('briefing')).toContainText('La Tarte de bienvenue');
  await tapUi(page.getByTestId('brief-start'));
  await expect(screen).toHaveAttribute('data-phase', 'play');
  await expect(page.getByTestId('question')).toBeVisible();

  // Retour aux dossiers puis à l'accueil.
  await tapUi(page.getByTestId('back'));
  await expect(page.getByTestId('screen-cases')).toBeVisible();
  // Le tutoriel est maintenant « en cours »… ou encore « nouveau » (aucune action) : il reste ouvrable.
  await expect(page.getByTestId('folder-c00')).toHaveAttribute('aria-disabled', 'false');
  await tapUi(page.getByTestId('back'));
  await expect(page.getByTestId('screen-home')).toBeVisible();
});

test('mode debug : window.__haystack est exposé', async ({ page }) => {
  await openGame(page);
  const api = await page.evaluate(() => {
    const h = window.__haystack;
    return {
      cases: h.cases.map((c) => c.id),
      entities: h.world.entities.length,
      zoom: h.map.getCamera().zoom,
    };
  });
  expect(api.cases).toEqual(['c00', 'c01', 'c02', 'c03', 'c04', 'c05', 'bonus-aiguilles']);
  expect(api.entities).toBeGreaterThan(1000);
  expect(api.zoom).toBeGreaterThan(0);
  await expect(page.locator('.debug-hud')).toContainText('zoom');
});
