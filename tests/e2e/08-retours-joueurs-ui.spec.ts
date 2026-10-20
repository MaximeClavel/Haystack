// 8. Interface : corrections issues des joueurs test aveugles (phase 3). Chaque correction visible a son test :
//   « N pistes ouvertes » et suite du fil · indice replié (« relire », actions accessibles) · « Non merci » sous le
//   bouton Indice · toast du bonus avec le début du vers · carnet (libellés, rubrique vide) · fin du bonus sans bande
//   noire · Comment jouer (fil rouge, étoiles) · difficulté nommée au briefing · onglets de c05 à 360 px.
import type { Page } from '@playwright/test';
import { expect, mapIdle, openGame, tapUi, test } from './helpers';
import { caseSteps, solveStep, tapTarget } from './play';

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

/** Ouvre une enquête (par le pont de débogage), lit le briefing s'il y en a un, et commence. */
async function startCase(page: Page, id: string): Promise<void> {
  await page.evaluate((id) => window.__haystack.openCase(id), id);
  const start = page.getByTestId('brief-start');
  if (await start.isVisible()) await tapUi(start);
  await expect(page.getByTestId('question-panel')).toBeVisible();
  await mapIdle(page);
}

/** Replie le texte de l'indice, comme le fait tout geste du joueur sur la carte (pointerdown sur le canevas). */
async function touchMap(page: Page): Promise<void> {
  await page.evaluate(() => window.__haystack.host.canvas.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })));
}

test('deux fils ouverts : « 2 pistes ouvertes », et après « Le voisin » le panneau passe à « La tarte » (c04)', async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  await openGame(page);
  await startCase(page, 'c04');
  const panel = page.getByTestId('question-panel');
  await expect(panel).toContainText('2 pistes ouvertes');
  await expect(panel).not.toContainText('Question');
  const steps = await caseSteps(page, 'c04');
  await solveStep(page, 'c04', steps.find((s) => s.id === 's4')!, testInfo);
  await tapUi(page.getByTestId('result-continue'));
  // La suite du fil du voisin (s5), pas la première question de la liste (s1, l'autre fil).
  await expect(page.getByTestId('tab-s5')).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByTestId('tab-s1')).toHaveAttribute('aria-selected', 'false');
  await expect(panel).toContainText('2 pistes ouvertes');
});

test('indice replié : la barre dit « relire », la zone reste accessible, toucher la barre rouvre le texte (c01)', async ({ page }) => {
  await openGame(page);
  await startCase(page, 'c01');
  for (let i = 0; i < 2; i++) {
    await tapUi(page.getByTestId('action-hint'));
    await tapUi(page.getByTestId('hint-confirm'));
    await expect(page.getByTestId('hint-box')).toBeVisible();
    await mapIdle(page);
  }
  const box = page.getByTestId('hint-box');
  const toggle = page.getByTestId('hint-toggle');
  await expect(box).not.toHaveClass(/folded/);
  await expect(toggle).not.toContainText('relire');

  await touchMap(page);
  await expect(box).toHaveClass(/folded/);
  await expect(toggle).toContainText('Indice 2 sur 3 · relire');
  await expect(box.getByRole('button', { name: 'Voir la zone' })).toBeVisible();
  await expect(box.getByRole('button', { name: 'Masquer le projecteur' })).toBeVisible();
  await expect(box.locator('.hint-text')).toHaveCount(0);

  await tapUi(toggle);
  await expect(box).not.toHaveClass(/folded/);
  await expect(toggle).not.toContainText('relire');
  await expect(box.locator('.hint-text').first()).toBeVisible();
});

for (const hand of ['right', 'left'] as const) {
  test(`${hand === 'right' ? 'droitier' : 'gaucher'} : « Non merci » prend la place du bouton Indice, un second tap au même endroit ne dépense rien (c01)`, async ({
    page,
  }) => {
    await openGame(page);
    await page.evaluate(
      (left) => window.__haystack.store.update((s) => ({ ...s, settings: { ...s.settings, leftHanded: left } })),
      hand === 'left',
    );
    await expect(page.locator('html')).toHaveAttribute('data-hand', hand);
    await startCase(page, 'c01');
    await doubleTapOnHintButton(page);
  });
}

async function doubleTapOnHintButton(page: Page): Promise<void> {
  const hintBtn = (await page.getByTestId('action-hint').boundingBox())!;
  const at = { x: hintBtn.x + hintBtn.width / 2, y: hintBtn.y + hintBtn.height / 2 };
  await tapUi(page.getByTestId('action-hint'));
  const cancel = (await page.getByTestId('hint-cancel').boundingBox())!;
  const confirm = (await page.getByTestId('hint-confirm').boundingBox())!;
  const covers = (b: { x: number; y: number; width: number; height: number }): boolean =>
    at.x >= b.x && at.x <= b.x + b.width && at.y >= b.y && at.y <= b.y + b.height;
  expect(covers(cancel), '« Non merci » recouvre le centre du bouton Indice').toBe(true);
  expect(covers(confirm), '« Oui, un indice » ne le recouvre pas').toBe(false);
  // Au-delà de la garde anti-double tap (320 ms) : le second tap tombe sur « Non merci ».
  await page.waitForTimeout(600);
  await page.touchscreen.tap(at.x, at.y);
  await expect(page.getByTestId('hint-ask')).toHaveCount(0);
  expect(await page.evaluate(() => window.__haystack.session!.totals().hints)).toBe(0);
}

test('bonus : le toast rappelle le début du vers, le carnet compte les aiguilles et nomme chaque « Voir »', async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  await openGame(page);
  await startCase(page, 'bonus-aiguilles');
  const steps = await caseSteps(page, 'bonus-aiguilles');
  const intro = await page.evaluate(() => window.__haystack.cases.find((c) => c.bonus)!.intro);
  await tapTarget(page, 'bonus-aiguilles', steps[0].id, steps[0].accept[2], testInfo);
  await tapUi(page.getByTestId('confirm-designate'));
  const toast = page.getByTestId('toast');
  await expect(toast).toContainText(/^Bien vu ! 1 sur 10 · \S+/);
  const excerpt = ((await toast.textContent()) ?? '').split(' · ')[1].replace(/…$/, '');
  expect(intro, 'l’extrait est le début d’un vers du testament').toContain(excerpt);

  await tapUi(page.getByTestId('open-notebook'));
  const nb = page.getByTestId('notebook');
  await expect(nb).toContainText('1 aiguille trouvée sur 10, cochée dans le testament.');
  await tapUi(nb.getByText('Relire le briefing'));
  await expect(nb.getByRole('button', { name: 'Voir l’aiguille 3' })).toBeVisible();
  // Le bonus n'a aucun personnage : pas de rubrique qui ne pourrait jamais se remplir.
  await expect(nb).not.toContainText('Personnages identifiés');
});

test('bonus résolu : l’écran de fin cadre la vue d’ensemble (pas de bande noire) et explique la note', async ({ page }) => {
  await openGame(page);
  await seed(page, { 'bonus-aiguilles': 'all' });
  await page.evaluate(() => window.__haystack.openCase('bonus-aiguilles'));
  await expect(page.getByTestId('case-end')).toBeVisible();
  await mapIdle(page);
  // Au zoom minimal (≈ 0,065) le monde est plus petit que l'écran : la bande noire. La vue d'ensemble est à ≈ 0,2.
  await expect.poll(() => page.evaluate(() => window.__haystack.map.getCamera().zoom)).toBeGreaterThan(0.12);
  await expect(page.getByTestId('stars-why')).toContainText('le maximum');
});

test('carnet de c04 : chaque « Voir » dit de quelle question il s’agit', async ({ page }) => {
  await openGame(page);
  await seed(page, { c04: 2 });
  await startCase(page, 'c04');
  await tapUi(page.getByTestId('open-notebook'));
  const nb = page.getByTestId('notebook');
  await expect(nb.getByRole('button', { name: 'Voir la réponse de la question 1' })).toBeVisible();
  await expect(nb.getByRole('button', { name: 'Voir la réponse de la question 2' })).toBeVisible();
  // Le texte visible reste « Voir ».
  await expect(page.getByTestId('nb-show-s1')).toHaveText('Voir');
});

test('briefing : la difficulté est nommée (c03)', async ({ page }) => {
  await openGame(page);
  await page.evaluate(() => window.__haystack.openCase('c03'));
  const brief = page.getByTestId('briefing');
  await expect(brief).toContainText('Difficulté');
  await expect(brief.getByRole('img', { name: 'Difficulté 3 sur 5' })).toBeVisible();
});

test('Comment jouer : le fil rouge et la règle des étoiles sont expliqués', async ({ page }) => {
  await openGame(page);
  await page.evaluate(() => window.__haystack.screen('regles'));
  const howto = page.getByTestId('screen-howto');
  await expect(howto).toBeVisible();
  await tapUi(page.getByTestId('howto-next'));
  await expect(howto).toContainText('fil rouge');
  await tapUi(page.getByTestId('howto-next'));
  await expect(howto).toContainText('Jusqu’à deux erreurs');
  await tapUi(page.getByTestId('howto-next'));
  await expect(howto).toContainText('Le premier indice vous fait perdre une étoile');
});

test.describe('téléphone étroit (360 × 740)', () => {
  test.use({ viewport: { width: 360, height: 740 } });

  test('c05 : les quatre onglets de pistes tiennent sans balayage', async ({ page }) => {
    await openGame(page);
    await seed(page, { c05: 1 });
    await startCase(page, 'c05');
    await expect(page.getByTestId('question-panel')).toContainText('4 pistes ouvertes');
    const m = await page.evaluate(() => {
      const t = document.querySelector('.tabs')!;
      return { scroll: t.scrollWidth, client: t.clientWidth, n: t.children.length };
    });
    expect(m.n).toBe(4);
    expect(m.scroll, 'aucun onglet coupé').toBeLessThanOrEqual(m.client);
  });
});
