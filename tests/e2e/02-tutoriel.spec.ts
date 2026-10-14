// 2. Tutoriel c00 résolu par de vrais taps : cible → caméra (flyTo zoom 2) → worldToScreen →
// page.touchscreen.tap → « Désigner » → retour ; écran de fin avec étoiles ; après rechargement,
// l'enquête est marquée résolue.
import { expect, openGame, readSave, tapUi, test } from './helpers';
import { caseSteps, openCaseFromFolders, solveOpenCase } from './play';

test('tutoriel c00 joué au doigt jusqu’à l’écran de fin, puis relu après rechargement', async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  await openGame(page);
  await tapUi(page.getByTestId('menu-cases'));
  await openCaseFromFolders(page, 'c00', 'La Tarte de bienvenue');

  // Après « Commencer », la caméra a volé vers le cadrage de départ du dossier.
  const cam = await page.evaluate(() => window.__haystack.map.getCamera());
  expect(cam.zoom).toBeCloseTo(1.6, 1);

  const steps = await caseSteps(page, 'c00');
  expect(steps.map((s) => s.id)).toEqual(['s1', 's2', 's3']);
  // Une seule question ouverte au départ ; la vignette de confirmation est bien rendue.
  await expect(page.getByTestId('question')).toHaveText(steps[0].question);

  const { stars } = await solveOpenCase(page, 'c00', testInfo);
  // Sans indice ni erreur : trois étoiles.
  expect(stars).toBe(3);
  await expect(page.getByTestId('case-end')).toContainText('aucun');
  // Fils rouges posés entre les scènes trouvées (au moins un, c00 en déclare).
  const threads = await page.evaluate(() => window.__haystack.session!.threads().length);
  expect(threads).toBeGreaterThan(0);

  // Reconstitution : s'ouvre, avance, se ferme.
  await tapUi(page.getByTestId('end-replay'));
  await expect(page.getByTestId('replay')).toBeVisible();
  await expect(page.getByTestId('screen-case')).toHaveAttribute('data-phase', 'replay');
  await expect(page.getByTestId('replay')).toContainText('Reconstitution · 1/');
  await tapUi(page.getByTestId('replay-next'));
  await expect(page.getByTestId('replay')).toContainText('Reconstitution · 2/');
  await tapUi(page.getByTestId('replay-close'));
  await expect(page.getByTestId('case-end')).toBeVisible();

  // Retour aux dossiers : tutoriel résolu, c01 et le bonus débloqués.
  await tapUi(page.getByTestId('end-exit'));
  await expect(page.getByTestId('screen-cases')).toBeVisible();
  await expect(page.getByTestId('folder-c00')).toContainText('Résolu');
  await expect(page.getByTestId('folder-c01')).toHaveAttribute('aria-disabled', 'false');
  const save = await readSave(page);
  expect(save?.cases.c00?.status).toBe('solved');
  expect(save?.cases.c00?.stars).toBe(3);

  // Rechargement : la progression est relue depuis le navigateur.
  await page.reload();
  await page.waitForFunction(() => window.__haystackReady === true, null, { timeout: 45_000 });
  await expect(page.getByTestId('screen-home')).toBeVisible();
  await expect(page.getByTestId('menu-cases')).toContainText('1/6');
  await tapUi(page.getByTestId('menu-cases'));
  const folder = page.getByTestId('folder-c00');
  await expect(folder).toContainText('Résolu');
  await expect(folder.getByRole('img', { name: '3 étoiles sur 3' })).toBeVisible();
  await expect(page.getByTestId('folder-c01')).toHaveAttribute('aria-disabled', 'false');
  await expect(page.getByTestId('folder-c01')).toContainText('Nouveau');
  await expect(page.getByTestId('folder-c02')).toHaveAttribute('aria-disabled', 'true');
  await expect(page.getByTestId('folder-bonus-aiguilles')).toHaveAttribute('aria-disabled', 'false');
  await expect(page.getByTestId('screen-cases')).toContainText('1 affaire classée sur 6');

  // Rouvrir une enquête résolue mène directement à l'écran de fin.
  await tapUi(folder);
  await expect(page.getByTestId('screen-case')).toHaveAttribute('data-phase', 'end');
  await expect(page.getByTestId('case-end').getByRole('img', { name: '3 étoiles sur 3' })).toBeVisible();
});
