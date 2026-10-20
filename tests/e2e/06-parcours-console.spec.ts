// 6. Parcours complet de l'interface sans aucune erreur console : accueil, comment jouer, réglages,
// exploration, dossiers, enquête (carnet, notes, punaise, approche de loin), retour.
// La surveillance de la console (fixture automatique de helpers.ts) s'applique à TOUS les tests ;
// celui-ci visite en plus chaque écran dans une même page, sans rechargement.
import { expect, mapIdle, openGame, readSave, tapUi, tapWorld, test } from './helpers';

test('parcours de tous les écrans sans erreur console', async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await openGame(page);

  // Comment jouer (glisser horizontal pour changer d'étape).
  await tapUi(page.getByTestId('menu-howto'));
  await expect(page.getByTestId('screen-howto')).toContainText('Étape 1 sur 4');
  await tapUi(page.getByTestId('howto-next'));
  await expect(page.getByTestId('screen-howto')).toContainText('Étape 2 sur 4');
  await tapUi(page.getByTestId('back'));

  // Réglages, aller-retour.
  await tapUi(page.getByTestId('menu-settings'));
  await expect(page.getByTestId('screen-settings')).toBeVisible();
  await tapUi(page.getByTestId('back'));

  // Exploration + minicarte.
  await tapUi(page.getByTestId('menu-explore'));
  await expect(page.getByTestId('screen-explore')).toBeVisible();
  await tapUi(page.getByTestId('explore-minimap'));
  await expect(page.getByTestId('minimap')).toBeVisible();
  await tapUi(page.getByTestId('explore-minimap'));
  await tapUi(page.getByTestId('back'));
  await expect(page.getByTestId('screen-home')).toBeVisible();

  // Dossiers → tutoriel.
  await tapUi(page.getByTestId('menu-cases'));
  await tapUi(page.getByTestId('folder-c00'));
  await tapUi(page.getByTestId('brief-start'));
  await mapIdle(page);

  // Tap de loin (sous le zoom de désignation) : la carte se rapproche au lieu de désigner.
  const far = await page.evaluate(() => {
    const h = window.__haystack;
    return h.entityCenter('c00.picotin.1');
  });
  await tapWorld(page, far, 0.8);
  await expect(page.getByTestId('toast')).toContainText('Rapprochez-vous');
  await expect(page.getByTestId('confirm-sheet')).toHaveCount(0);
  await mapIdle(page);
  expect((await page.evaluate(() => window.__haystack.map.getCamera())).zoom).toBeGreaterThanOrEqual(1.5);

  // Replier / déplier la question.
  await tapUi(page.getByTestId('collapse'));
  await expect(page.getByTestId('collapse')).toHaveAttribute('aria-expanded', 'false');
  await tapUi(page.getByTestId('collapse'));
  await expect(page.getByTestId('collapse')).toHaveAttribute('aria-expanded', 'true');

  // Carnet : notes enregistrées, punaise depuis le carnet.
  await tapUi(page.getByTestId('open-notebook'));
  const nb = page.getByTestId('notebook');
  await expect(nb).toBeVisible();
  await page.getByTestId('notes').fill('Picotin a faim. Le livreur dort.');
  await tapUi(page.getByTestId('nb-pin-mode'));
  await expect(nb).toHaveCount(0);
  await expect(page.getByTestId('pin-banner')).toBeVisible();
  const c = await page.evaluate(() => {
    const r = window.__haystack.host.freeWorldRect();
    return { x: r.x + r.w / 2 + 40, y: r.y + r.h / 2 };
  });
  await tapWorld(page, c, (await page.evaluate(() => window.__haystack.map.getCamera())).zoom);
  await expect(page.getByTestId('toast')).toContainText('Punaise posée');
  await tapUi(page.getByTestId('open-notebook'));
  await expect(nb.getByRole('button', { name: 'Voir la punaise 1' })).toBeVisible();
  await tapUi(nb.getByRole('button', { name: 'Retirer la punaise 1' }));
  await expect(nb.getByRole('button', { name: 'Voir la punaise 1' })).toHaveCount(0);
  await tapUi(page.getByTestId('notebook-close'));
  await expect(nb).toHaveCount(0);
  const save = await readSave(page);
  expect(save?.cases.c00?.status).toBe('active');
  expect(save?.cases.c00 && (save.cases.c00 as unknown as { notes: string }).notes).toContain('Picotin a faim');

  // Retour aux dossiers : en cours.
  await tapUi(page.getByTestId('back'));
  await expect(page.getByTestId('folder-c00')).toContainText('En cours');
  await tapUi(page.getByTestId('back'));
  await expect(page.getByTestId('screen-home')).toBeVisible();

  testInfo.annotations.push({ type: 'console', description: `${errors.length} erreur(s)` });
  expect(errors).toEqual([]);
});
