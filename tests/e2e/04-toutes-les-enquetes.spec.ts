// 4. Résolution de TOUTES les enquêtes (c00 à c05, puis le bonus) par de vrais taps, en les
// débloquant dans l'ordre depuis l'écran des dossiers. Ce test prouve que chaque réponse (y compris
// chaque réponse alternative acceptée) est réellement désignable au doigt : ni masquée par un
// arbre, un véhicule ou une autre entité, ni sous l'interface. En cas d'échec, le message nomme
// l'enquête, l'étape, l'entité et ce qui la masque, et une capture est jointe au rapport.
import { expect, openGame, readSave, tapUi, test } from './helpers';
import { openCaseFromFolders, solveOpenCase } from './play';

const ORDER = ['c00', 'c01', 'c02', 'c03', 'c04', 'c05', 'bonus-aiguilles'];

test('toutes les enquêtes résolues au doigt, dans l’ordre de déblocage', async ({ page }, testInfo) => {
  test.setTimeout(8 * 60_000);
  await openGame(page);
  const cases = await page.evaluate(() =>
    window.__haystack.cases.map((c) => ({ id: c.id, title: c.title, unlockAfter: c.unlockAfter ?? [], bonus: !!c.bonus })),
  );
  expect(cases.map((c) => c.id)).toEqual(ORDER);

  await tapUi(page.getByTestId('menu-cases'));
  await expect(page.getByTestId('screen-cases')).toBeVisible();
  const solved = new Set<string>();

  for (const def of cases) {
    await test.step(`${def.id} — ${def.title}`, async () => {
      // État des verrous avant de commencer : seules les enquêtes dont les prérequis sont résolus s'ouvrent.
      for (const other of cases) {
        if (solved.has(other.id)) continue;
        const unlocked = other.unlockAfter.every((u) => solved.has(u));
        await expect(page.getByTestId(`folder-${other.id}`), `${other.id} ${unlocked ? 'déverrouillé' : 'verrouillé'}`).toHaveAttribute(
          'aria-disabled',
          unlocked ? 'false' : 'true',
        );
      }

      const t0 = Date.now();
      await openCaseFromFolders(page, def.id, def.title);
      const { stars } = await solveOpenCase(page, def.id, testInfo);
      expect(stars, `${def.id} : trois étoiles sans indice ni erreur`).toBe(3);
      const description = `${def.id} en ${((Date.now() - t0) / 1000).toFixed(1)} s`;
      testInfo.annotations.push({ type: 'enquête résolue', description });
      console.log(`  résolue au doigt : ${description}`);

      await tapUi(page.getByTestId('end-exit'));
      await expect(page.getByTestId('screen-cases')).toBeVisible();
      const folder = page.getByTestId(`folder-${def.id}`);
      await expect(folder).toContainText('Résolu');
      await expect(folder.getByRole('img', { name: '3 étoiles sur 3' })).toBeVisible();
      solved.add(def.id);
      const save = await readSave(page);
      expect(save?.cases[def.id]?.status).toBe('solved');
    });
  }

  // Tout est résolu : compteur des dossiers et de l'accueil.
  await expect(page.getByTestId('screen-cases')).toContainText('6 affaires classées sur 6');
  await tapUi(page.getByTestId('back'));
  await expect(page.getByTestId('menu-cases')).toContainText('6/6');
  // Relu après rechargement.
  await page.reload();
  await page.waitForFunction(() => window.__haystackReady === true, null, { timeout: 45_000 });
  const save = await readSave(page);
  for (const id of ORDER) expect(save?.cases[id]?.status, `${id} résolu après rechargement`).toBe('solved');
});
