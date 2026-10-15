// 3. Sur c01 : mauvaise réponse, fausse piste (nearMiss), indices des niveaux 1 à 3 avec projecteur.
import type { Page } from '@playwright/test';
import { expect, findEmptySpot, mapLuminance, openGame, readSave, tapAndSelect, tapUi, test } from './helpers';

const REVEAL_TEXT = 'Voici où regarder.';

async function hintState(page: Page) {
  return page.evaluate(() => {
    const s = window.__haystack.session!;
    const h = s.currentHint('s1');
    return { level: h?.level ?? 0, area: h?.area ?? null, reveal: h?.reveal ?? [], used: s.stepProgress('s1').hints };
  });
}

test('c01 : erreur, fausse piste et indices 1 → 3 (projecteur, révélation)', async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  await openGame(page, '&case=c01');
  const screen = page.getByTestId('screen-case');
  await expect(screen).toHaveAttribute('data-phase', 'brief');
  await tapUi(page.getByTestId('brief-start'));
  await expect(screen).toHaveAttribute('data-phase', 'play');
  await page.evaluate(() => window.__haystack.map.whenIdle());

  const def = await page.evaluate(() => {
    const d = window.__haystack.cases.find((c) => c.id === 'c01')!;
    const s1 = d.steps[0];
    return { question: s1.question, hints: s1.hints.map((h) => h.text), near: s1.nearMiss ?? [], answer: s1.accept[0] };
  });
  await expect(page.getByTestId('question')).toHaveText(def.question);

  /* ---------------------------------------------------------------- mauvaise réponse */
  const empty = await findEmptySpot(page, 's1');
  await tapAndSelect(page, empty, testInfo);
  await tapUi(page.getByTestId('confirm-designate'));
  await expect(page.getByTestId('toast')).toContainText(/pas ça|Pas tout/);
  await expect(page.getByTestId('result-solved')).toHaveCount(0);
  expect(await page.evaluate(() => window.__haystack.session!.stepProgress('s1').mistakes)).toBe(1);

  /* ---------------------------------------------------------------- fausse piste */
  expect(def.near.length).toBeGreaterThan(0);
  const near = def.near[0];
  const tap = await tapAndSelect(page, near.id, testInfo);
  expect(tap.picked).toBe(near.id);
  await expect(page.getByTestId('confirm-sheet')).toContainText('Désigner');
  // La feuille de confirmation montre une vignette rapprochée de la cible.
  await expect(page.locator('[data-testid=confirm-sheet] canvas.thumb')).toBeVisible();
  await tapUi(page.getByTestId('confirm-designate'));
  const nearCard = page.getByTestId('result-near');
  await expect(nearCard).toBeVisible();
  await expect(nearCard).toContainText('Pas tout à fait');
  await expect(nearCard).toContainText(near.feedback);
  await tapUi(page.getByTestId('result-continue'));
  await expect(nearCard).toHaveCount(0);
  // Une fausse piste n'est pas une erreur, et la question reste ouverte.
  const afterNear = await page.evaluate(() => ({
    mistakes: window.__haystack.session!.stepProgress('s1').mistakes,
    open: window.__haystack.session!.isStepOpen('s1'),
  }));
  expect(afterNear).toEqual({ mistakes: 1, open: true });

  /* ---------------------------------------------------------------- indices */
  // Demander puis renoncer : rien n'est compté.
  await tapUi(page.getByTestId('action-hint'));
  await expect(page.getByTestId('hint-ask')).toContainText('Votre note passera de 3 à 2 étoiles au plus');
  await expect(page.getByTestId('hint-ask')).toContainText('Indice 1 sur 3');
  await tapUi(page.getByTestId('hint-cancel'));
  await expect(page.getByTestId('hint-ask')).toHaveCount(0);
  expect((await hintState(page)).used).toBe(0);

  // Niveau 1 : un conseil écrit, pas de projecteur.
  await tapUi(page.getByTestId('action-hint'));
  await tapUi(page.getByTestId('hint-confirm'));
  const box = page.getByTestId('hint-box');
  await expect(box).toContainText('Indice 1 sur 3');
  await expect(box).toContainText(def.hints[0]);
  let st = await hintState(page);
  expect(st.level).toBe(1);
  expect(st.area).toBeNull();

  // Niveau 2 : texte + zone éclairée (projecteur) et vol vers la zone.
  await tapUi(page.getByTestId('action-hint'));
  await expect(page.getByTestId('hint-ask')).toContainText('Indice 2 sur 3');
  await tapUi(page.getByTestId('hint-confirm'));
  await expect(box).toContainText('Indice 2 sur 3');
  await expect(box).toContainText(def.hints[0]);
  await expect(box).toContainText(def.hints[1]);
  st = await hintState(page);
  expect(st.level).toBe(2);
  expect(st.area).not.toBeNull();
  const area = st.area!;
  // La caméra a cadré la zone : son centre est au centre de la zone libre.
  await expect
    .poll(async () => {
      await page.evaluate(() => window.__haystack.map.whenIdle());
      return page.evaluate((a) => {
        const r = window.__haystack.host.freeWorldRect();
        return Math.hypot(r.x + r.w / 2 - a.x, r.y + r.h / 2 - a.y);
      }, area);
    })
    .toBeLessThan(area.radius / 2);
  // Le projecteur assombrit la carte hors du cercle : comparaison avec le projecteur masqué.
  const probe = await page.evaluate((a) => {
    const h = window.__haystack;
    const c = h.map.worldToScreen({ x: a.x, y: a.y });
    const r = a.radius * h.map.getCamera().zoom;
    const ins = h.host.getInsets();
    // Un point de la zone libre, nettement hors du cercle.
    const out = { x: 30, y: ins.top + 30 };
    return { inside: c, outside: out, outsideDist: Math.hypot(out.x - c.x, out.y - c.y), r };
  }, area);
  expect(probe.outsideDist).toBeGreaterThan(probe.r + 20);
  const darkOut = await mapLuminance(page, probe.outside);
  const darkIn = await mapLuminance(page, probe.inside);
  await tapUi(box.getByRole('button', { name: 'Masquer le projecteur' }));
  await page.evaluate(() => window.__haystack.map.whenIdle());
  await page.waitForTimeout(100);
  const lightOut = await mapLuminance(page, probe.outside);
  const lightIn = await mapLuminance(page, probe.inside);
  testInfo.annotations.push({
    type: 'projecteur',
    description: `luminance hors cercle ${darkOut.toFixed(0)} (projecteur) / ${lightOut.toFixed(0)} (masqué) ; dans le cercle ${darkIn.toFixed(0)} / ${lightIn.toFixed(0)}`,
  });
  expect(darkOut).toBeLessThan(lightOut * 0.7);
  expect(Math.abs(darkIn - lightIn)).toBeLessThan(lightIn * 0.15);
  await tapUi(box.getByRole('button', { name: 'Afficher le projecteur' }));
  await page.evaluate(() => window.__haystack.map.whenIdle());
  await page.waitForTimeout(100);
  expect(await mapLuminance(page, probe.outside)).toBeLessThan(lightOut * 0.7);

  // Niveau 3 : révélation de la réponse.
  await tapUi(page.getByTestId('action-hint'));
  await expect(page.getByTestId('hint-ask')).toContainText('Indice 3 sur 3');
  await tapUi(page.getByTestId('hint-confirm'));
  await expect(box).toContainText('Indice 3 sur 3');
  await expect(box).toContainText(REVEAL_TEXT);
  st = await hintState(page);
  expect(st.level).toBe(3);
  expect(st.reveal).toContain(def.answer);
  await expect(page.getByTestId('action-hint')).toContainText('Revoir');
  // La caméra montre la réponse dans la zone libre.
  await page.evaluate(() => window.__haystack.map.whenIdle());
  const shown = await page.evaluate((id) => {
    const h = window.__haystack;
    return h.host.isFree(h.map.worldToScreen(h.entityCenter(id)));
  }, def.answer);
  expect(shown).toBe(true);
  // « Revoir » ne coûte plus rien.
  await tapUi(page.getByTestId('action-hint'));
  await expect(page.getByTestId('hint-ask')).toHaveCount(0);
  expect((await hintState(page)).used).toBe(3);

  /* ---------------------------------------------------------------- bonne réponse */
  const ok = await tapAndSelect(page, def.answer, testInfo);
  expect(ok.picked).toBe(def.answer);
  await tapUi(page.getByTestId('confirm-designate'));
  await expect(page.getByTestId('result-solved')).toBeVisible();
  await tapUi(page.getByTestId('result-continue'));
  // Question suivante, sans indice affiché.
  await expect(page.getByTestId('hint-box')).toHaveCount(0);
  const save = await readSave(page);
  expect(save?.cases.c01?.status).toBe('active');
  expect(save?.cases.c01?.steps.s1).toMatchObject({ found: [def.answer], hints: 3, mistakes: 1 });
  // Une révélation coûte des étoiles : estimation à 1 étoile.
  expect(await page.evaluate(() => window.__haystack.session!.stars())).toBe(1);
});
