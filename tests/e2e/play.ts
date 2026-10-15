// Jouer une enquête au doigt : ouvrir un dossier, répondre à chaque question par de vrais taps,
// conclure. Utilisé par le tutoriel (02) et par la résolution de toutes les enquêtes (04).
import type { Page, TestInfo } from '@playwright/test';
import type { Vec2 } from '../../src/types';
import { attachShot, expect, fmt, PLAY_ZOOM, selectStep, tapAndSelect, tapUi } from './helpers';

/** Description d'une étape lue dans le contenu publié (window.__haystack.cases). */
export interface StepInfo {
  id: string;
  question: string;
  accept: string[];
  required: number;
  solved: string;
}

export async function caseSteps(page: Page, caseId: string): Promise<StepInfo[]> {
  return page.evaluate((id) => {
    const def = window.__haystack.cases.find((c) => c.id === id);
    if (!def) throw new Error(`enquête inconnue ${id}`);
    return def.steps.map((s) => ({
      id: s.id,
      question: s.question,
      accept: [...s.accept],
      required: Math.max(1, Math.min(s.accept.length, s.required ?? 1)),
      solved: s.solved,
    }));
  }, caseId);
}

/** Depuis l'écran des dossiers : ouvre le dossier (qui doit être déverrouillé), lit le briefing, commence. */
export async function openCaseFromFolders(page: Page, caseId: string, title: string): Promise<void> {
  await expect(page.getByTestId('screen-cases')).toBeVisible();
  const folder = page.getByTestId(`folder-${caseId}`);
  await folder.scrollIntoViewIfNeeded();
  await expect(folder, `le dossier ${caseId} doit être déverrouillé`).toHaveAttribute('aria-disabled', 'false');
  await tapUi(folder);
  const screen = page.getByTestId('screen-case');
  await expect(screen).toHaveAttribute('data-phase', 'brief');
  await expect(page.getByTestId('briefing')).toContainText(title);
  await tapUi(page.getByTestId('brief-start'));
  await expect(screen).toHaveAttribute('data-phase', 'play');
  await page.evaluate(() => window.__haystack.map.whenIdle());
}

interface AimPoint {
  point: Vec2;
  /** Le centre de la cible est masqué : on vise une partie visible. */
  partial: boolean;
  /** Aucune partie de la cible n'est désignable. */
  unreachable: boolean;
  /** Ce qui est désigné au centre de la cible (si autre chose qu'elle). */
  atCenter: string | null;
  kind: 'entity' | 'zone' | 'building';
}

/**
 * Point où taper pour désigner `id` : le centre de la cible (centroïde pour une zone) ; si une
 * autre entité y est désignée à sa place (arbre, véhicule, passant devant), le point « sûr » (ses
 * voisins désignent aussi la cible) le plus proche du centre. `null` si l'id est inconnu.
 */
async function aimPoint(page: Page, id: string): Promise<AimPoint | null> {
  return page.evaluate(
    ({ id, zoom }): AimPoint | null => {
      const h = window.__haystack;
      if (!h.world.zones.has(id) && !h.world.byId.has(id)) return null;
      const center = h.entityCenter(id);
      const base = { point: center, partial: false, unreachable: false, atCenter: null };
      if (h.world.zones.has(id)) return { ...base, kind: 'zone' };
      const e = h.world.byId.get(id)!;
      // Bâtiment : accepté dès que le point est sur son toit ou sa façade (règle de submit).
      if (e.kind === 'building') return { ...base, kind: 'building' };
      const atCenter = h.pickAt(h.world, center, zoom).entityId;
      if (atCenter === id) return { ...base, kind: 'entity' };
      const picks = (q: { x: number; y: number }): boolean => h.pickAt(h.world, q, zoom).entityId === id;
      // Balayage de l'emprise visuelle (qui contient le rectangle de désignation), pas de 2 u.
      const r = h.world.bounds.get(id) ?? { x: center.x - 40, y: center.y - 40, w: 80, h: 80 };
      let best: { x: number; y: number } | null = null;
      let bestD = Infinity;
      for (let y = r.y + 1; y < r.y + r.h; y += 2) {
        for (let x = r.x + 1; x < r.x + r.w; x += 2) {
          const q = { x, y };
          const d = (x - center.x) ** 2 + (y - center.y) ** 2;
          if (d >= bestD || !picks(q)) continue;
          // Point « sûr » : ses voisins à 2 u désignent aussi la cible (pas un liseré d'un pixel).
          const safe = [
            [2, 0],
            [-2, 0],
            [0, 2],
            [0, -2],
          ].every(([ax, ay]) => picks({ x: q.x + ax, y: q.y + ay }));
          if (safe) {
            bestD = d;
            best = q;
          }
        }
      }
      return { point: best ?? center, partial: true, unreachable: best === null, atCenter, kind: 'entity' };
    },
    { id, zoom: PLAY_ZOOM },
  );
}

/** Décrit une entité pour un message d'échec (« c01.sac (prop:moneybag) »). */
async function describeEntity(page: Page, id: string | null): Promise<string> {
  if (!id) return 'rien';
  return page.evaluate((i) => {
    const e = window.__haystack.world.byId.get(i) as unknown as Record<string, unknown> | undefined;
    if (!e) return i;
    const sub = (e.prop ?? e.vehicle ?? e.tree ?? e.style ?? e.pose ?? '') as string;
    return `${i} (${String(e.kind)}${sub ? ':' + sub : ''})`;
  }, id);
}

/**
 * Tape la cible `id` et vérifie qu'elle est réellement désignée (HUD : pickAt au lâcher du doigt).
 * En cas d'échec : capture jointe au rapport et message précis (enquête, étape, entité, masque).
 */
export async function tapTarget(page: Page, caseId: string, stepId: string, id: string, testInfo: TestInfo): Promise<AimPoint> {
  const aim = await aimPoint(page, id);
  expect(aim, `${caseId} / ${stepId} : la cible ${id} existe dans le monde`).not.toBeNull();
  if (aim!.unreachable) {
    await page.evaluate(
      ({ p, z }) => window.__haystack.host.focus(p, z, { instant: true }),
      { p: aim!.point, z: PLAY_ZOOM },
    );
    await page.evaluate(() => window.__haystack.map.whenIdle());
    await attachShot(page, testInfo, `${caseId}-${stepId}-${id}-masque`);
    const mask = await describeEntity(page, aim!.atCenter);
    throw new Error(
      `${caseId} / ${stepId} : la réponse ${id} n'est PAS désignable — aucune partie de son rectangle de désignation ne la désigne ; au centre (${fmt(aim!.point)}), un tap désigne ${mask}.`,
    );
  }
  if (aim!.partial) {
    const mask = await describeEntity(page, aim!.atCenter);
    const description = `${caseId} / ${stepId} : ${id} — au centre, un tap désigne ${mask} ; désignée en (${fmt(aim!.point)}).`;
    testInfo.annotations.push({ type: 'réponse partiellement masquée', description });
    console.log(`  [attention] réponse partiellement masquée : ${description}`);
  }
  const report = await tapAndSelect(page, aim!.point, testInfo);
  // E2E_SHOTS=1 : capture de la cible au zoom de jeu (relecture visuelle des masquages).
  if (process.env.E2E_SHOTS) {
    const r = 70;
    await page.screenshot({
      path: `.shots/e2e/${caseId}-${stepId}-${id}.png`,
      clip: { x: Math.max(0, report.screen.x - r), y: Math.max(0, report.screen.y - r), width: 2 * r, height: 2 * r },
      style: '.debug-hud { visibility: hidden !important; }',
    });
  }
  if (aim!.kind === 'entity' && report.picked !== id) {
    await attachShot(page, testInfo, `${caseId}-${stepId}-${id}-mauvaise-cible`);
    const got = await describeEntity(page, report.picked);
    throw new Error(`${caseId} / ${stepId} : le tap sur ${id} (écran ${fmt(report.screen)}) désigne ${got}.`);
  }
  return aim!;
}

/** Vérifie qu'une réponse alternative (non utilisée pour résoudre) est désignable, puis annule. */
async function checkAlternative(page: Page, caseId: string, stepId: string, id: string, testInfo: TestInfo): Promise<void> {
  await tapTarget(page, caseId, stepId, id, testInfo);
  await tapUi(page.getByTestId('confirm-cancel'));
  await expect(page.getByTestId('confirm-sheet')).toHaveCount(0);
}

/**
 * Répond à une étape par de vrais taps : vérifie d'abord que les réponses alternatives sont
 * désignables (puis annule), désigne ensuite les réponses nécessaires et contrôle le retour
 * (carte « Bien vu ! », toast de progression, sauvegarde). Renvoie true si l'enquête est résolue.
 */
export async function solveStep(page: Page, caseId: string, step: StepInfo, testInfo: TestInfo): Promise<boolean> {
  await selectStep(page, step.id);
  await expect(page.getByTestId('question')).toHaveText(step.question);
  const already = await page.evaluate((sid) => window.__haystack.session!.stepProgress(sid).found, step.id);
  const todo = step.accept.filter((a) => !already.includes(a));
  const chosen = todo.slice(0, step.required - already.length);
  const alternatives = todo.slice(chosen.length);

  for (const alt of alternatives) await checkAlternative(page, caseId, step.id, alt, testInfo);

  let caseSolved = false;
  for (let k = 0; k < chosen.length; k++) {
    const id = chosen[k];
    await tapTarget(page, caseId, step.id, id, testInfo);
    await tapUi(page.getByTestId('confirm-designate'));
    const last = k === chosen.length - 1;
    if (last) {
      const card = page.getByTestId('result-solved');
      await expect(card, `${caseId} / ${step.id} : ${id} résout l'étape`).toBeVisible();
      await expect(card).toContainText(step.solved.slice(0, 60));
      caseSolved = (await page.getByTestId('result-continue').textContent())?.includes('Conclure') ?? false;
    } else {
      await expect(page.getByTestId('toast')).toContainText(`Bien vu ! ${already.length + k + 1} sur ${step.required}`);
    }
    const found = await page.evaluate((sid) => window.__haystack.session!.stepProgress(sid).found, step.id);
    expect(found, `${caseId} / ${step.id} : ${id} est compté comme trouvé`).toContain(id);
  }
  const progress = await page.evaluate((sid) => window.__haystack.session!.stepProgress(sid), step.id);
  expect(progress.mistakes, `${caseId} / ${step.id} : aucune erreur`).toBe(0);
  return caseSolved;
}

/**
 * Résout toute l'enquête ouverte, question après question (dans l'ordre du dossier parmi les
 * questions ouvertes), puis conclut : écran de fin avec étoiles.
 */
export async function solveOpenCase(page: Page, caseId: string, testInfo: TestInfo): Promise<{ stars: number }> {
  const steps = await caseSteps(page, caseId);
  let done = false;
  for (let guard = 0; guard < steps.length && !done; guard++) {
    const open = await page.evaluate(() => window.__haystack.session!.openSteps().map((s) => s.id));
    expect(open.length, `${caseId} : il reste une question ouverte`).toBeGreaterThan(0);
    const step = steps.find((s) => s.id === open[0])!;
    done = await solveStep(page, caseId, step, testInfo);
    if (!done) {
      await tapUi(page.getByTestId('result-continue'));
      await expect(page.getByTestId('result-solved')).toHaveCount(0);
    }
  }
  expect(done, `${caseId} : toutes les questions sont résolues`).toBe(true);
  await expect(page.getByTestId('result-continue')).toHaveText('Conclure l’enquête');
  await tapUi(page.getByTestId('result-continue'));
  const end = page.getByTestId('case-end');
  await expect(end).toBeVisible();
  await expect(page.getByTestId('screen-case')).toHaveAttribute('data-phase', 'end');
  await expect(end).toContainText('Affaire classée');
  const stars = end.getByRole('img', { name: /étoiles? sur 3/ });
  await expect(stars).toBeVisible();
  const label = (await stars.getAttribute('aria-label')) ?? '';
  return { stars: Number(label.split(' ')[0]) };
}
