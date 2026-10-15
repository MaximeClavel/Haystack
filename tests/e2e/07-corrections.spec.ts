// 7. Corrections issues des revues (UX et code) : chaque constat confirmé a son test.
//   R1 recommencer ne reverrouille pas · R2 réponse d'une autre question ouverte · M1 nom du lieu
//   M2 reprise sur la dernière trouvaille · M4/R3 bouton Retour du système · R4 double tap
//   R7 notes à pagehide · R8 barre d'actions à 320 px · R10 second onglet · R11 sauvegarde réconciliée
//   R12 écran de secours · M5 désignation dans la zone éclairée (petit écran) · M6 testament du bonus
import { expect, mapIdle, openGame, readSave, STORAGE_KEY, tapAndSelect, tapUi, test } from './helpers';
import type { Page } from '@playwright/test';

/** Injecte des progressions : { id: nombre d'étapes résolues | 'all' } (réponses prises dans accept). */
async function seed(page: Page, spec: Record<string, number | 'all'>): Promise<void> {
  await page.evaluate((spec) => {
    const h = window.__haystack;
    h.store.update((s) => {
      const cases = { ...s.cases };
      for (const [id, n] of Object.entries(spec)) {
        const def = h.cases.find((c) => c.id === id)!;
        const steps: Record<string, { found: string[]; hints: number; mistakes: number; solvedAt?: number }> = {};
        def.steps.forEach((st, i) => {
          const solved = n === 'all' || i < n;
          steps[st.id] = solved
            ? { found: st.accept.slice(0, Math.max(1, st.required ?? 1)), hints: 0, mistakes: 0, solvedAt: 10 + i }
            : { found: [], hints: 0, mistakes: 0 };
        });
        cases[id] = {
          caseId: id,
          status: n === 'all' ? 'solved' : 'active',
          steps,
          pins: [],
          notes: '',
          startedAt: 1,
          ...(n === 'all' ? { solvedAt: 99, stars: 3 as const, bestStars: 3 as const } : {}),
        };
      }
      return { ...s, cases };
    });
  }, spec);
}

test('R1 : recommencer une enquête résolue ne reverrouille pas la suivante', async ({ page }) => {
  await openGame(page);
  await seed(page, { c00: 'all', c01: 'all' });
  await page.evaluate(() => window.__haystack.screen('dossiers'));
  await tapUi(page.getByTestId('folder-c00'));
  await expect(page.getByTestId('case-end')).toBeVisible();
  await tapUi(page.getByRole('button', { name: 'Recommencer' }));
  await tapUi(page.getByRole('button', { name: 'Oui' }));
  await expect(page.getByTestId('briefing')).toBeVisible();
  await tapUi(page.getByTestId('back'));
  const c01 = page.getByTestId('folder-c01');
  await expect(c01).not.toHaveAttribute('aria-disabled', 'true');
  await expect(c01).toContainText('Résolu');
  await expect(page.getByTestId('screen-cases')).toContainText('2 enquêtes résolues sur 6');
  // L'ancienne progression est bien effacée, le meilleur résultat gardé.
  const save = await readSave(page);
  expect(save?.cases.c00.status).toBe('new');
  expect((save?.cases.c00 as { bestStars?: number }).bestStars).toBe(3);
  await expect(page.getByTestId('folder-c00')).not.toContainText('Résolu');
  await tapUi(page.getByTestId('folder-c01'));
  await expect(page.getByTestId('case-end')).toBeVisible();
});

test('R2 : la bonne réponse d’une autre question ouverte (c05) compte, sans erreur', async ({ page }, testInfo) => {
  await openGame(page);
  await seed(page, { c05: 1 });
  await page.evaluate(() => window.__haystack.openCase('c05'));
  await expect(page.getByTestId('question-panel')).toBeVisible();
  // L'onglet actif est la question 2 (faux infirmier) : on désigne Gontran, réponse de la question 5.
  await expect(page.getByTestId('tab-s2')).toHaveAttribute('aria-selected', 'true');
  // Les pistes parallèles sont nommées, pas « Question 2 / 3 / 4 / 5 ».
  await expect(page.getByTestId('tab-s2')).toHaveText('Infirmier');
  await expect(page.getByTestId('tab-s5')).toHaveText('Gontran');
  await tapAndSelect(page, 'c05.gontran.1', testInfo);
  // La feuille de confirmation rappelle la question en cours (on compare la vignette à ses indices visuels).
  await expect(page.getByTestId('confirm-question')).toContainText('faux infirmier');
  await tapUi(page.getByTestId('confirm-designate'));
  await expect(page.getByTestId('result-solved')).toBeVisible();
  const st = await page.evaluate(() => {
    const s = window.__haystack.session!;
    return { mistakes: s.totals().mistakes, s5: s.stepProgress('s5').found, s2: s.stepProgress('s2').found };
  });
  expect(st).toEqual({ mistakes: 0, s5: ['c05.gontran.1'], s2: [] });
  // L'onglet a suivi la réponse.
  await tapUi(page.getByTestId('result-continue'));
  await expect(page.getByTestId('tab-s2')).toBeVisible();
});

test('M1 + M2 : le lieu s’affiche en enquête ; la reprise cadre la dernière trouvaille', async ({ page }) => {
  await openGame(page);
  await seed(page, { c03: 4 });
  await page.evaluate(() => window.__haystack.openCase('c03'));
  await expect(page.getByTestId('question-panel')).toBeVisible();
  await mapIdle(page);
  await expect(page.getByTestId('place')).toContainText(/\S/);
  const d = await page.evaluate(() => {
    const h = window.__haystack;
    const c = h.map.getCamera();
    const marks = h.session!.foundMarks();
    const last = h.entityCenter(marks[marks.length - 1].id);
    return { dist: Math.hypot(c.x - last.x, c.y - last.y), start: h.cases.find((x) => x.id === 'c03')!.start };
  });
  expect(d.dist, 'la caméra est sur la dernière trouvaille, pas au départ').toBeLessThan(300);
  // Minicarte ouverte : la pastille du lieu passe sous la minicarte (rien ne se recouvre).
  await tapUi(page.getByTestId('action-minimap'));
  await page.waitForTimeout(450); // fin de l'animation d'entrée de la minicarte
  const chip = await page.getByTestId('place').boundingBox();
  const mini = await page.getByTestId('minimap').boundingBox();
  expect(chip && mini && chip.y >= mini.y + mini.height - 1).toBe(true);
});

test('M4 / R3 : le bouton Retour du système remonte d’un écran au lieu de quitter le jeu', async ({ page }) => {
  await openGame(page);
  await tapUi(page.getByTestId('menu-cases'));
  await tapUi(page.getByTestId('folder-c00'));
  await expect(page.getByTestId('briefing')).toBeVisible();
  await tapUi(page.getByTestId('brief-start'));
  await mapIdle(page);
  // Carnet ouvert : Retour le ferme d'abord.
  await tapUi(page.getByTestId('open-notebook'));
  await expect(page.getByTestId('notebook')).toBeVisible();
  await page.goBack();
  await expect(page.getByTestId('notebook')).toHaveCount(0);
  await expect(page.getByTestId('screen-case')).toBeVisible();
  // Enquête → dossiers → accueil.
  await page.goBack();
  await expect(page.getByTestId('screen-cases')).toBeVisible();
  await page.goBack();
  await expect(page.getByTestId('screen-home')).toBeVisible();
  expect(page.url()).toContain('localhost:5179');
  // Le bouton ‹ de l'interface continue de fonctionner, puis Retour système.
  await tapUi(page.getByTestId('menu-settings'));
  await tapUi(page.getByTestId('back'));
  await expect(page.getByTestId('screen-home')).toBeVisible();
  await tapUi(page.getByTestId('menu-howto'));
  await page.goBack();
  await expect(page.getByTestId('screen-home')).toBeVisible();
});

test('R4 : un double tap sur « Désigner » ne ferme pas la carte « Bien vu ! » sans lecture', async ({ page }, testInfo) => {
  await openGame(page);
  await page.evaluate(() => window.__haystack.openCase('c00'));
  await tapUi(page.getByTestId('brief-start'));
  await mapIdle(page);
  await tapAndSelect(page, 'c00.picotin.1', testInfo);
  const btn = page.getByTestId('confirm-designate');
  await expect(page.getByTestId('confirm-sheet')).toBeVisible();
  const b = (await btn.boundingBox())!;
  const x = b.x + b.width / 2;
  const y = b.y + b.height / 2;
  // Premier tap dès que la feuille a fini d'apparaître, second tap 70 ms plus tard au même endroit.
  await page.waitForTimeout(450);
  await page.touchscreen.tap(x, y);
  await page.waitForTimeout(70);
  await page.touchscreen.tap(x, y);
  await page.waitForTimeout(500);
  await expect(page.getByTestId('result-solved')).toBeVisible();
  // Le texte reste lisible jusqu'à un vrai « Continuer ».
  await tapUi(page.getByTestId('result-continue'));
  await expect(page.getByTestId('result-solved')).toHaveCount(0);
});

test('R7 : les notes du carnet sont enregistrées dès que la page passe en arrière-plan', async ({ page }) => {
  await openGame(page);
  await page.evaluate(() => window.__haystack.openCase('c00'));
  await tapUi(page.getByTestId('brief-start'));
  await tapUi(page.getByTestId('open-notebook'));
  await page.getByTestId('notes').fill('ma déduction');
  await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
  const notes = await page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? 'null')?.cases?.c00?.notes ?? null, STORAGE_KEY);
  expect(notes).toBe('ma déduction');
});

test('R10 : un second onglet périmé n’écrase pas ce que l’autre a enregistré', async ({ page }) => {
  await openGame(page);
  const other = await page.context().newPage();
  await other.goto('/?debug');
  await other.waitForFunction(() => window.__haystackReady === true, null, { timeout: 45_000 });
  await page.evaluate(() => window.__haystack.store.setSettings({ haptics: false }));
  // L'autre onglet, ouvert avant ce réglage, change un autre réglage.
  await other.evaluate(() => window.__haystack.store.setSettings({ leftHanded: true }));
  const s = await other.evaluate((k) => JSON.parse(localStorage.getItem(k)!).settings, STORAGE_KEY);
  expect(s).toMatchObject({ haptics: false, leftHanded: true });
  await other.close();
});

test('R11 : un statut « résolu » incohérent avec le contenu est réconcilié au démarrage', async ({ page }) => {
  await page.addInitScript((key) => {
    if (localStorage.getItem('__seeded')) return;
    localStorage.setItem('__seeded', '1');
    const done = { found: [] as string[], hints: 0, mistakes: 0, solvedAt: 1 };
    localStorage.setItem(
      key,
      JSON.stringify({
        version: 1,
        seenHowTo: true,
        settings: { haptics: true, leftHanded: false, reducedMotion: false },
        cases: {
          c00: {
            caseId: 'c00',
            status: 'solved',
            stars: 3,
            solvedAt: 5,
            pins: [],
            notes: '',
            steps: { s1: { ...done, found: ['c00.disparu'] }, s2: { ...done, found: ['c00.livreur.2'] }, s3: { ...done, found: ['c00.croquette'] } },
          },
        },
      }),
    );
  }, STORAGE_KEY);
  await openGame(page);
  const c00 = (await readSave(page))!.cases.c00;
  expect(c00.status).toBe('active');
  await page.evaluate(() => window.__haystack.screen('dossiers'));
  await expect(page.getByTestId('folder-c00')).toContainText('En cours');
  // Même vérité dans l'enquête : elle s'ouvre en jeu (pas sur l'écran de fin).
  await tapUi(page.getByTestId('folder-c00'));
  await expect(page.getByTestId('screen-case')).toHaveAttribute('data-phase', 'play');
  // c01 reste débloqué : c00 a déjà été résolue une fois (bestStars conservé par la réconciliation).
  expect(((await readSave(page))!.cases.c00 as { bestStars?: number }).bestStars).toBe(3);
});

test('R12 : une exception d’affichage montre un écran de secours avec une issue', async ({ page, consoleErrors }) => {
  await openGame(page);
  await page.evaluate(() => window.__haystack.openCase('c00'));
  await tapUi(page.getByTestId('brief-start'));
  await expect(page.getByTestId('question-panel')).toBeVisible();
  await page.evaluate(() => {
    window.__haystack.session!.currentHint = () => {
      throw new Error('boom');
    };
  });
  await page.getByTestId('collapse').dispatchEvent('click'); // provoque un nouveau rendu
  const fb = page.getByTestId('error-fallback');
  await expect(fb).toBeVisible();
  // L'erreur provoquée est volontaire : elle est journalisée, et on la retire de la surveillance.
  expect(consoleErrors.join('\n')).toContain('erreur d’affichage');
  consoleErrors.splice(0);
  await tapUi(fb.getByRole('button', { name: 'Retour aux enquêtes' }));
  await expect(page.getByTestId('screen-cases')).toBeVisible();
});

test('R9 : une sauvegarde impossible est signalée (toast une fois, accueil)', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException('quota', 'QuotaExceededError');
    };
  });
  await openGame(page);
  await expect(page.getByTestId('screen-home')).toContainText('progression');
  await page.evaluate(() => window.__haystack.store.setSettings({ haptics: false }));
  await expect(page.getByTestId('toast')).toContainText('sauvegarde est impossible');
  await expect(page.getByTestId('screen-home')).toContainText('Navigation privée');
  // Une seule fois : un second changement n'en refait pas un.
  await page.waitForTimeout(6500);
  await page.evaluate(() => window.__haystack.store.setSettings({ haptics: true }));
  await page.waitForTimeout(300);
  await expect(page.getByTestId('toast')).toHaveCount(0);
});

test('M6 : le testament du bonus garde ses vers, relisible en jeu, avec les aiguilles trouvées cochées', async ({ page }) => {
  await openGame(page);
  await seed(page, { c00: 'all' });
  await page.evaluate(() => window.__haystack.openCase('bonus-aiguilles'));
  await expect(page.getByTestId('briefing')).toBeVisible();
  const ws = await page.evaluate(() => getComputedStyle(document.querySelector('.brief-text p')!).whiteSpace);
  expect(ws).toBe('pre-line');
  await tapUi(page.getByTestId('brief-start'));
  await tapUi(page.getByTestId('open-briefing'));
  const nb = page.getByTestId('notebook');
  await expect(nb.locator('.nb-verses li')).toHaveCount(10);
  await expect(nb.locator('.nb-verses li.done')).toHaveCount(0);
  await tapUi(page.getByTestId('notebook-close'));
  // Une aiguille trouvée (injectée) : son vers est coché.
  await page.evaluate(() => {
    const h = window.__haystack;
    h.session!.submit('s1', { point: h.entityCenter('bonus-aiguilles.aiguille.3'), entityId: 'bonus-aiguilles.aiguille.3' });
  });
  await tapUi(page.getByTestId('open-briefing'));
  await expect(nb.locator('.nb-verses li').nth(2)).toHaveClass(/done/);
});

test.describe('petits écrans', () => {
  test.use({ viewport: { width: 320, height: 568 } });

  test('R8 : la barre d’actions (dont « Indice ») tient entièrement dans l’écran à 320 px', async ({ page }) => {
    await openGame(page);
    await seed(page, { c05: 1 });
    await page.evaluate(() => window.__haystack.openCase('c05'));
    await expect(page.getByTestId('question-panel')).toBeVisible();
    for (const id of ['action-minimap', 'action-pin', 'action-hint']) {
      const b = (await page.getByTestId(id).boundingBox())!;
      expect(b.x, id).toBeGreaterThanOrEqual(0);
      expect(b.x + b.width, id).toBeLessThanOrEqual(320);
      expect(b.height, id).toBeGreaterThanOrEqual(44);
    }
    // Pas de défilement horizontal de la page.
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test.describe('téléphone étroit (360 × 740)', () => {
  test.use({ viewport: { width: 360, height: 740 } });

  test('M5 : après l’indice 2, un tap sur la réponse éclairée ouvre la confirmation (pas un vol)', async ({ page }) => {
    await openGame(page);
    await seed(page, { c00: 1 });
    await page.evaluate(() => window.__haystack.openCase('c00'));
    await expect(page.getByTestId('question-panel')).toBeVisible();
    await mapIdle(page);
    for (let i = 0; i < 2; i++) {
      await tapUi(page.getByTestId('action-hint'));
      await tapUi(page.getByTestId('hint-confirm'));
      await expect(page.getByTestId('hint-box')).toBeVisible();
      await mapIdle(page);
    }
    const pt = await page.evaluate(() => {
      const h = window.__haystack;
      return h.map.worldToScreen(h.entityCenter('c00.livreur.2'));
    });
    await page.touchscreen.tap(pt.x, pt.y);
    await expect(page.getByTestId('confirm-sheet')).toBeVisible({ timeout: 3_000 });
  });
});
