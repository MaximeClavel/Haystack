#!/usr/bin/env node
// Test de l'outil « joueur test aveugle » (blind.mjs). Ce n'est PAS un joueur test : il connaît les solutions.
//
//   node tools/playtest/selftest.mjs            (≈ 1 min ; code de sortie ≠ 0 si un contrôle échoue)
//
// Partie A — l'outil : démarrage, capture, texte, tap, Annuler, erreurs claires, état, absence de fuite.
// Partie B — gestes (pincement, double tap, glissé) mesurés sur la page oracle avec le MÊME code que le démon.
// Partie C — un passage complet de c00 par les commandes de l'outil (taps en pixels) jusqu'à « Affaire classée ».
//   Pour savoir OÙ taper sans voir la carte, le test ouvre une seconde page « oracle » (?debug, dans son propre
//   navigateur, jamais accessible par l'outil) qui rejoue exactement les mêmes gestes : même téléphone, même
//   état de caméra, donc mêmes coordonnées d'écran. Si les deux pages divergeaient, la feuille « Désigner »
//   n'apparaîtrait pas dans l'outil et le test échouerait.
// Partie D — « stop » nettoie : plus aucun processus, plus de fichier d'état, serveur fermé.
// Au passage : « status » affiche toujours la ligne d'incidents techniques (0 ici), les captures `--crop` sont
// agrandies (côté ≥ 480 px), `press <libellé> --nth N` départage des boutons de même libellé.
// Pendant tout le test, aucune sortie de l'outil ne doit contenir d'identifiant d'entité, d'indice, de texte de
// réussite à venir, d'épilogue ou de légende de reconstitution (contrôle de fuite).
// À la fin : durée moyenne par commande.

import { chromium } from '@playwright/test';
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { createConnection } from 'node:net';
import { join } from 'node:path';
import { ROOT, sessionDir } from './common.mjs';
import {
  contextOptionsFor,
  cropFactor,
  doubleTapAt,
  dragTouch,
  findButton,
  fold,
  pinchTouch,
  pressButton,
  resolveDevice,
  sleep,
  tapAt,
} from './page-tools.mjs';

const CLI = join(import.meta.dirname, 'blind.mjs');
const CASE = 'c00';
const PLAYER = `selftest${process.pid}`;
const device = resolveDevice({});

let failures = 0;
const check = (ok, label, detail = '') => {
  console.log(`${ok ? 'OK    ' : 'ÉCHEC '} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures++;
  return ok;
};
const section = (t) => console.log(`\n== ${t}`);

/* ----------------------------------------------------------------------------
 * Appel du CLI, mesure des temps, recherche de fuites
 * ------------------------------------------------------------------------- */

const timings = new Map();
const allOutputs = [];

function runCli(args) {
  return new Promise((resolve) => {
    const t0 = performance.now();
    const child = spawn(process.execPath, [CLI, ...args], { cwd: ROOT });
    let out = '';
    let err = '';
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (err += d));
    const timer = setTimeout(() => child.kill('SIGKILL'), 120_000);
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ code, out, err, ms: performance.now() - t0 });
    });
  });
}

/** Commande de l'outil pour la partie du test. */
async function blind(cmd, ...args) {
  const r = await runCli([cmd, ...args.map(String), '--case', CASE, '--player', PLAYER]);
  if (!timings.has(cmd)) timings.set(cmd, []);
  timings.get(cmd).push(r.ms);
  allOutputs.push({ cmd, args, text: r.out + r.err });
  scanForLeaks({ cmd, text: r.out + r.err });
  return r;
}

const squash = (s) => String(s).replace(/[\s  ]+/g, '').toLowerCase();
let forbidden = []; // { label, needle } : ne doit apparaître dans AUCUNE sortie de l'outil
const leaksIn = (text) => forbidden.filter((f) => squash(text).includes(f.needle)).map((f) => f.label);
function scanForLeaks({ cmd, text }) {
  for (const label of leaksIn(text)) check(false, `fuite dans la sortie de « ${cmd} »`, label);
}

/* ----------------------------------------------------------------------------
 * Page oracle (?debug) : lit les positions, rejoue les gestes
 * ------------------------------------------------------------------------- */

let oracleBrowser = null;
let oracle = null;
const oracleIdle = async () => {
  await sleep(150);
  await oracle.page.evaluate(() => window.__haystack.map.whenIdle());
  await sleep(500); // animations de l'interface + voile anti-double-tap (320 ms)
};

async function openOracle(vitePort) {
  oracleBrowser = await chromium.launch();
  const context = await oracleBrowser.newContext(contextOptionsFor(device));
  const page = await context.newPage();
  await page.goto(`http://127.0.0.1:${vitePort}/?debug&case=${CASE}`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__haystackReady === true, null, { timeout: 60_000 });
  oracle = { context, page, cdp: await context.newCDPSession(page) };
  await oracleIdle();
}

/** Point d'écran où taper pour désigner `id` (centre, ou point « sûr » voisin si une autre entité le masque). */
function aimOnScreen(id) {
  return oracle.page.evaluate((id) => {
    const h = window.__haystack;
    const zoom = h.map.getCamera().zoom;
    const center = h.entityCenter(id);
    let pt = center;
    const e = h.world.byId.get(id);
    const picks = (q) => h.pickAt(h.world, q, zoom).entityId === id;
    let partial = false;
    if (e && e.kind !== 'building' && !h.world.zones.has(id) && !picks(center)) {
      partial = true;
      const r = h.world.bounds.get(id) ?? { x: center.x - 40, y: center.y - 40, w: 80, h: 80 };
      let bestD = Infinity;
      for (let y = r.y + 1; y < r.y + r.h; y += 2) {
        for (let x = r.x + 1; x < r.x + r.w; x += 2) {
          const d = (x - center.x) ** 2 + (y - center.y) ** 2;
          if (d >= bestD || !picks({ x, y })) continue;
          const safe = [[2, 0], [-2, 0], [0, 2], [0, -2]].every(([ax, ay]) => picks({ x: x + ax, y: y + ay }));
          if (safe) {
            bestD = d;
            pt = { x, y };
          }
        }
      }
    }
    const s = h.map.worldToScreen(pt);
    const el = document.elementFromPoint(s.x, s.y);
    return { x: Math.round(s.x), y: Math.round(s.y), free: h.host.isFree(s), onMap: el === h.host.canvas, zoom, partial };
  }, id);
}

/** Point d'écran libre où rien n'est désigné (pour provoquer une erreur volontaire). */
function emptySpotOnScreen() {
  return oracle.page.evaluate(() => {
    const h = window.__haystack;
    const zoom = h.map.getCamera().zoom;
    for (let y = 160; y < 640; y += 20) {
      for (let x = 30; x < 390; x += 20) {
        const s = { x, y };
        const el = document.elementFromPoint(x, y);
        if (el !== h.host.canvas || !h.host.isFree(s)) continue;
        const w = h.map.screenToWorld(s);
        if (h.pickAt(h.world, w, zoom).entityId === null) return s;
      }
    }
    return null;
  });
}

/* ----------------------------------------------------------------------------
 * Divers
 * ------------------------------------------------------------------------- */

function pngInfo(file) {
  try {
    const buf = readFileSync(file);
    const isPng = buf.length > 24 && buf.subarray(0, 8).toString('hex') === '89504e470d0a1a0a';
    return { isPng, width: isPng ? buf.readUInt32BE(16) : 0, height: isPng ? buf.readUInt32BE(20) : 0, size: buf.length };
  } catch {
    return { isPng: false, width: 0, height: 0, size: 0 };
  }
}

const shotPath = (out) => /Capture n°\d+ : (\S+\.png)/.exec(out)?.[1];

function processTree(rootPid) {
  const r = spawnSync('ps', ['-eo', 'pid=,ppid='], { encoding: 'utf8' });
  const kids = new Map();
  for (const line of r.stdout.trim().split('\n')) {
    const [pid, ppid] = line.trim().split(/\s+/).map(Number);
    if (!kids.has(ppid)) kids.set(ppid, []);
    kids.get(ppid).push(pid);
  }
  const all = [];
  const stack = [rootPid];
  while (stack.length) {
    const p = stack.pop();
    all.push(p);
    for (const k of kids.get(p) ?? []) stack.push(k);
  }
  return all;
}
const alive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return e.code === 'EPERM';
  }
};
const portOpen = (port) =>
  new Promise((resolve) => {
    const s = createConnection({ port, host: '127.0.0.1' });
    s.once('connect', () => (s.destroy(), resolve(true)));
    s.once('error', () => resolve(false));
  });

/* ----------------------------------------------------------------------------
 * Déroulement
 * ------------------------------------------------------------------------- */

async function main() {
  const dir = sessionDir(CASE, PLAYER);
  let info = null;
  let tree = [];
  let shotsTaken = 0;
  try {
    /* ---------------------------------------------------------------- A : l'outil */
    section('A. L\'outil');
    const started = await blind('start', CASE);
    check(started?.code === 0, 'start c00 réussit', started ? `${(started.ms / 1000).toFixed(1)} s` : 'exception');
    if (started?.code !== 0) throw new Error(`démarrage impossible :\n${started?.out}\n${started?.err}`);
    check(/Commencer l.enquête/.test(started.out), 'l\'état initial affiche le briefing et son bouton');
    check(/Écran émulé : Pixel 7 412×915/.test(started.out), 'l\'écran émulé est annoncé');
    info = JSON.parse(readFileSync(join(dir, 'daemon.json'), 'utf8'));
    tree = processTree(info.pid);
    check(info.pid > 1 && tree.length >= 2, 'démon + navigateur lancés', `${tree.length} processus`);

    await openOracle(info.vitePort);
    const def = await oracle.page.evaluate((id) => {
      const c = window.__haystack.cases.find((x) => x.id === id);
      return JSON.parse(JSON.stringify(c));
    }, CASE);

    const N = def.steps.length;
    // Ce que l'outil ne doit JAMAIS afficher (identifiants, indices, textes de réussite à venir, épilogue, légendes).
    const ids = new Set([...def.entities.map((e) => e.id), ...def.characters.map((c) => c.id)]);
    for (const s of def.steps) {
      s.accept.forEach((a) => ids.add(a));
      (s.nearMiss ?? []).forEach((n) => ids.add(n.id));
    }
    const base = [
      ...[...ids].map((id) => ({ label: `identifiant « ${id} »`, needle: squash(id) })),
      { label: 'attribut data-testid', needle: 'data-testid' },
      { label: 'window.__haystack', needle: '__haystack' },
    ];
    // Jamais affichés par un joueur qui n'utilise ni indice ni fausse piste ni reconstitution.
    const alwaysSecret = [];
    for (const s of def.steps) {
      for (const h of s.hints) alwaysSecret.push({ label: `indice de ${s.id}`, needle: squash(h.text).slice(0, 40) });
      for (const n of s.nearMiss ?? []) alwaysSecret.push({ label: `commentaire de fausse piste de ${s.id}`, needle: squash(n.feedback).slice(0, 40) });
    }
    for (const r of def.replay) alwaysSecret.push({ label: 'légende de la reconstitution', needle: squash(r.caption).slice(0, 40) });
    /** Les textes de réussite des étapes déjà résolues et l'épilogue (écran de fin) sont, eux, légitimes. */
    const setForbidden = (solvedCount, ended) => {
      forbidden = [
        ...base,
        ...alwaysSecret,
        ...def.steps.slice(solvedCount).map((s) => ({ label: `texte de réussite de ${s.id}`, needle: squash(s.solved).slice(0, 50) })),
        ...(ended ? [] : [{ label: 'épilogue', needle: squash(def.epilogue).slice(0, 50) }]),
      ];
    };
    setForbidden(0, false);
    // Contrôles du détecteur lui-même : il doit voir une fuite, et ne pas crier au loup devant le texte légitime.
    check(leaksIn(`… ${def.steps[0].accept[0]} …`).length > 0, 'détecteur de fuite : un identifiant d\'entité serait repéré');
    check(leaksIn(def.steps[0].hints[0].text).length > 0, 'détecteur de fuite : un texte d\'indice serait repéré');
    check(leaksIn(def.steps[0].solved).length > 0 && leaksIn(def.epilogue).length > 0, 'détecteur de fuite : un texte de réussite et l\'épilogue seraient repérés');
    check(leaksIn('<button data-testid="x">').length > 0, 'détecteur de fuite : un attribut data-testid serait repéré');
    check(leaksIn(def.intro + ' ' + def.steps[0].question + ' Désigner cette personne ?').length === 0, 'détecteur de fuite : le briefing et la question (légitimes) ne sont pas signalés');

    const first = shotPath(started.out);
    const png = pngInfo(first ?? '');
    shotsTaken = 1;
    check(!!first && png.isPng && png.width === 412 && png.height === 915 && png.size > 30_000, 'la capture initiale est un vrai PNG 412×915 non vide', `${png.size} octets`);

    let r = await blind('text');
    check(r.code === 0 && /Dossier n° 00/.test(r.out) && /Commencer l.enquête/.test(r.out), '« text » renvoie le briefing');

    r = await blind('buttons');
    check(r.code === 0 && /Commencer l.enquête/.test(r.out) && /centre \(\d+, \d+\)/.test(r.out), '« buttons » liste les boutons avec leur position');

    r = await blind('press', 'commencer l enquete');
    check(r.code === 0 && /Aucune feuille ouverte/.test(r.out), '« press » (libellé approximatif, sans accents) lance l\'enquête', r.err.trim());
    await pressButton(oracle.page, 'commencer l enquete');
    await oracleIdle();

    r = await blind('text');
    const q1 = fold(def.steps[0].question).replace(/\s/g, '');
    check(r.code === 0 && fold(r.out).replace(/\s/g, '').includes(q1), '« text » renvoie la question en cours (étape 1)');
    check(new RegExp(`Question 1 sur ${N}`).test(r.out), `« text » indique la progression « Question 1 sur ${N} »`);
    check(/« Minicarte » · « Punaise » · « Indice »/.test(r.out), '« text » liste les boutons Minicarte, Punaise, Indice');

    r = await blind('status');
    check(new RegExp(`Questions résolues : 0 sur ${N}`).test(r.out) && /Phase : en cours/.test(r.out) && /Erreurs : 0 · Indices utilisés : 0/.test(r.out), '« status » (début) est cohérent', r.out.split('\n').slice(1, 4).join(' / '));
    check(r.out.trimEnd().split('\n').at(-1) === 'Incidents techniques de la page : 0', '« status » (début) affiche toujours la ligne « Incidents techniques de la page : 0 »', r.out.trimEnd().split('\n').at(-1));

    // Un tap sur la carte : feuille de confirmation OU approche (« Rapprochez-vous »).
    const spot = await emptySpotOnScreen();
    check(!!spot, 'un point libre existe sur la carte');
    r = await blind('tap', spot.x, spot.y);
    await tapAt(oracle.page, spot.x, spot.y);
    await oracleIdle();
    let sheet = /Désigner/.test(r.out) && /Annuler/.test(r.out);
    const approach = /Rapprochez-vous pour désigner/.test(r.out);
    check(r.code === 0 && (sheet || approach), 'un tap sur la carte ouvre la feuille de confirmation ou lance l\'approche', sheet ? 'feuille' : 'approche');
    if (!sheet) {
      r = await blind('tap', 206, 450);
      await tapAt(oracle.page, 206, 450);
      await oracleIdle();
      sheet = /Annuler/.test(r.out);
      check(sheet, 'après l\'approche, un second tap ouvre la feuille de confirmation');
    }
    check(/cet endroit|cette personne|cet objet|cet animal|ce bâtiment|cet arbre|ce véhicule/.test(r.out), 'la feuille nomme ce qui est désigné');

    r = await blind('press', 'Annuler');
    await pressButton(oracle.page, 'Annuler');
    await oracleIdle();
    check(r.code === 0 && /Aucune feuille ouverte/.test(r.out), '« press Annuler » referme la feuille');
    r = await blind('buttons');
    check(!/« Désigner »/.test(r.out) && !/« Annuler »/.test(r.out), 'plus de bouton Désigner / Annuler après Annuler');

    // Erreurs d'usage : messages clairs, codes de sortie.
    r = await blind('tap', 9999, 9999);
    check(r.code === 1 && /hors de l'écran/.test(r.err), 'un tap hors écran est refusé clairement', r.err.trim());
    r = await blind('tap', 'abc', 5);
    check(r.code === 1 && /doit être un nombre/.test(r.err), 'des coordonnées non numériques sont refusées', r.err.trim());
    r = await blind('press', 'Bouton inexistant');
    check(r.code === 1 && /Boutons visibles/.test(r.err), '« press » sur un libellé inconnu liste les boutons visibles');
    r = await runCli(['nimportequoi']);
    check(r.code === 2 && /commande inconnue/.test(r.err), 'une commande inconnue est refusée (code 2)');

    // Carnet : s'ouvre, ne révèle aucun personnage avant la première trouvaille, se referme.
    r = await blind('press', 'Ouvrir le carnet');
    await pressButton(oracle.page, 'Ouvrir le carnet');
    await oracleIdle();
    const names = def.characters.map((c) => ({ label: `nom du personnage « ${c.name} » (carnet avant toute trouvaille)`, needle: squash(c.name) }));
    for (const n of names) {
      if (squash(r.out).includes(n.needle)) check(false, 'fuite dans le carnet', n.label);
    }
    check(r.code === 0 && /Feuille ouverte/.test(r.out), 'le carnet s\'ouvre');
    r = await blind('press', 'Fermer le carnet');
    await pressButton(oracle.page, 'Fermer le carnet');
    await oracleIdle();
    check(r.code === 0 && /Aucune feuille ouverte/.test(r.out), 'le carnet se referme');

    // Erreur volontaire : « Désigner » sur un endroit vide → message « Ce n'est pas ça… » (rapporté malgré sa brièveté).
    const spot2 = await emptySpotOnScreen();
    r = await blind('tap', spot2.x, spot2.y);
    await tapAt(oracle.page, spot2.x, spot2.y);
    await oracleIdle();
    r = await blind('press', 'Désigner');
    await pressButton(oracle.page, 'Désigner');
    await oracleIdle();
    check(r.code === 0 && /Message à l'écran : « (Ce n’est pas ça|Pas tout à fait)/.test(r.out), '« Désigner » sur un mauvais endroit renvoie le message d\'erreur du jeu', r.out.split('\n')[1]);
    r = await blind('status');
    check(/Erreurs : 1 /.test(r.out), '« status » compte l\'erreur', r.out.split('\n')[3]);

    r = await blind('shot', 'selftest-grille', '--grid');
    shotsTaken++;
    const grid = pngInfo(shotPath(r.out) ?? '');
    check(r.code === 0 && grid.isPng && grid.width === 412 && grid.height === 915, '« shot --grid » produit une capture 412×915');
    r = await blind('shot', 'selftest-detail', '--crop', '100,300,120,120');
    shotsTaken++;
    const crop = pngInfo(shotPath(r.out) ?? '');
    // 120×120 px d'écran à la densité 2,625 = 315×315 ; facteur entier 2 pour atteindre 480 px de côté → 630×630.
    check(r.code === 0 && crop.isPng && crop.width === 630 && crop.height === 630, '« shot --crop » agrandit une zone (côté ≥ 480 px, facteur entier)', `${crop.width}×${crop.height}`);
    check(/zone agrandie \(100, 300\) 120×120 px d'écran → image de 630×630 px \(agrandie ×2 ; les détails réels sont ceux de l'écran, l'agrandissement est lissé\)/.test(r.out), '« shot --crop » annonce la zone, la taille réelle de l\'image et le facteur', r.out.split('\n')[1]);
    r = await blind('shot', 'selftest-detail-minuscule', '--crop', '150,300,20,20', '--grid');
    shotsTaken++;
    const tiny = pngInfo(shotPath(r.out) ?? '');
    check(r.code === 0 && tiny.isPng && Math.min(tiny.width, tiny.height) >= 480 && tiny.width === tiny.height, '« shot --crop » d\'une toute petite zone (avec grille) donne tout de même une image d\'au moins 480 px', `${tiny.width}×${tiny.height}`);
    r = await blind('shot', 'selftest-detail-large', '--crop', '0,0,412,915');
    shotsTaken++;
    const wide = pngInfo(shotPath(r.out) ?? '');
    check(r.code === 0 && wide.isPng && Math.abs(wide.width - 412 * 2.625) <= 1 && /pas d'agrandissement/.test(r.out), '« shot --crop » d\'une grande zone n\'est pas agrandi davantage', `${wide.width}×${wide.height}`);
    r = await blind('wait', 300);
    check(r.code === 0 && /Attendu 300 ms/.test(r.out), '« wait » fonctionne');

    // Fonctions pures : facteur d'agrandissement des captures et choix d'un bouton parmi des libellés identiques.
    check(cropFactor(140, 140) === 4 && cropFactor(184, 184) === 3 && cropFactor(40, 40) === 12 && cropFactor(580, 600) === 1, 'cropFactor : 140→×4, 184→×3, 40→×12, 580×600→×1');
    check(cropFactor(100, 2000) === 1 && cropFactor(200, 1000) === 1 && cropFactor(300, 700) === 2, 'cropFactor : une zone très allongée ne produit pas d\'image démesurée (≤ 1800 px)');
    const fake = {
      buttons: [
        { name: 'Voir la réponse de la question 2', text: 'Voir', x: 330, y: 520 },
        { name: 'Voir la réponse de la question 1', text: 'Voir', x: 330, y: 400 },
        { name: 'Voir la réponse de la question 3', text: 'Voir', x: 330, y: 640 },
        { name: 'Continuer', text: 'Continuer', x: 200, y: 800 },
      ],
    };
    const same = { buttons: [1, 2, 3].map((k) => ({ name: 'Voir', text: 'Voir', x: 330, y: 280 + k * 120 })) };
    const msgOf = (fn) => {
      try {
        fn();
        return '';
      } catch (e) {
        return e.message;
      }
    };
    check(findButton(fake, 'Voir', 2).y === 520 && findButton(fake, 'Voir', 1).y === 400 && findButton(fake, 'Voir', 3).y === 640, 'findButton : --nth compte de haut en bas (indépendamment de l\'ordre du DOM)');
    check(findButton(fake, 'Voir la réponse de la question 3').y === 640 && findButton(fake, 'Continuer').y === 800, 'findButton : un libellé précis ou unique reste accepté sans --nth');
    let msg = msgOf(() => findButton(fake, 'Voir'));
    check(/3 boutons/.test(msg) && /\(330, 400\)/.test(msg) && /\(330, 640\)/.test(msg) && /--nth 2/.test(msg) && /tap x y/.test(msg), 'findButton : « Voir » ambigu → les candidats avec leur centre, `--nth` et `tap x y` proposés', msg.slice(0, 90));
    msg = msgOf(() => findButton(same, 'Voir'));
    check(/« Voir » existe 3 fois, de haut en bas : \(330, 400\), \(330, 520\), \(330, 640\)\. Choisissez avec `press Voir --nth 2`, ou touchez-le avec `tap x y`\./.test(msg), 'findButton : trois « Voir » identiques → message « existe 3 fois… » exact', msg);
    check(/n'existe que 3 fois \(--nth 5 demandé\)/.test(msgOf(() => findButton(same, 'Voir', 5))) && /entier/.test(msgOf(() => findButton(same, 'Voir', 0))), 'findButton : --nth hors limites ou invalide → message clair');
    check(/`press "oui, un indice" --nth 2`/.test(msgOf(() => findButton({ buttons: [{ name: 'Oui, un indice', text: 'Oui, un indice', x: 1, y: 2 }, { name: 'Oui, un indice', text: 'Oui, un indice', x: 1, y: 9 }] }, 'oui, un indice'))) , 'findButton : un libellé à espaces est proposé entre guillemets');

    /* ---------------------------------------------------------------- C : gestes */
    section('B. Gestes (code du démon, mesurés sur la page oracle)');
    const cam = () => oracle.page.evaluate(() => window.__haystack.map.getCamera());
    const synced = await cam();
    const reset = async () => {
      // Même cadrage que le jeu au départ de l'enquête (host.focus), pour que la page oracle reste synchrone.
      await oracle.page.evaluate((st) => window.__haystack.host.focus({ x: st.x, y: st.y }, st.zoom, { instant: true }), def.start);
      await oracleIdle();
    };
    await reset();
    const back = await cam();
    check(Math.abs(back.x - synced.x) < 0.5 && Math.abs(back.y - synced.y) < 0.5 && Math.abs(back.zoom - synced.zoom) < 0.01, 'le cadrage de départ est retrouvé à l\'identique (page oracle synchrone)', `${synced.x.toFixed(1)},${synced.y.toFixed(1)} z${synced.zoom.toFixed(2)} → ${back.x.toFixed(1)},${back.y.toFixed(1)} z${back.zoom.toFixed(2)}`);
    let c0 = await cam();
    const applied = await pinchTouch(oracle.page, oracle.cdp, { x: 206, y: 450 }, 1.5, 500);
    await oracleIdle();
    let c1 = await cam();
    check(Math.abs(c1.zoom / c0.zoom - 1.5) < 0.2, 'pincement ×1,5 : le zoom est multiplié d\'environ 1,5', `${(c1.zoom / c0.zoom).toFixed(2)} (facteur appliqué ${applied.toFixed(2)})`);
    c0 = c1;
    await pinchTouch(oracle.page, oracle.cdp, { x: 206, y: 450 }, 0.5, 500);
    await oracleIdle();
    c1 = await cam();
    check(c1.zoom < c0.zoom * 0.7, 'pincement ×0,5 : dézoome', `${(c1.zoom / c0.zoom).toFixed(2)}`);
    await reset();
    c0 = await cam();
    await doubleTapAt(oracle.page, 206, 450);
    await oracleIdle();
    c1 = await cam();
    check(c1.zoom > c0.zoom * 1.3, 'double tap : zoome', `${c0.zoom.toFixed(2)} → ${c1.zoom.toFixed(2)}`);
    await reset();
    c0 = await cam();
    await dragTouch(oracle.page, oracle.cdp, { x: 300, y: 500 }, { x: 100, y: 300 }, 400, false);
    await oracleIdle();
    c1 = await cam();
    const dx = (c1.x - c0.x) * c0.zoom;
    const dy = (c1.y - c0.y) * c0.zoom;
    check(Math.abs(dx - 200) < 30 && Math.abs(dy - 200) < 30, 'glissé sans élan : la carte suit le doigt (≈ 200 px)', `déplacement de la carte ${dx.toFixed(0)}, ${dy.toFixed(0)} px`);
    await reset();
    const resynced = await cam();
    check(Math.abs(resynced.x - synced.x) < 0.5 && Math.abs(resynced.y - synced.y) < 0.5 && Math.abs(resynced.zoom - synced.zoom) < 0.01, 'après les gestes, la page oracle est de nouveau synchrone avec la page de l\'outil');

    /* ---------------------------------------------------------------- B : passage complet */
    section('C. Passage complet de c00 par l\'outil');
    let lastCard = '';
    for (let i = 0; i < def.steps.length; i++) {
      const step = def.steps[i];
      const target = step.accept[0];
      const aim = await aimOnScreen(target);
      if (!aim.onMap || !aim.free || aim.zoom < 1.5) throw new Error(`étape ${step.id} : la cible n'est pas atteignable sans navigation (écran ${aim.x}, ${aim.y} ; zoom ${aim.zoom.toFixed(2)} ; libre ${aim.free} ; carte ${aim.onMap}) : le test doit être adapté`);
      setForbidden(i, false);
      r = await blind('text');
      check(fold(r.out).replace(/\s/g, '').includes(fold(step.question).replace(/\s/g, '')), `étape ${i + 1} : « text » affiche la question`);
      r = await blind('tap', aim.x, aim.y);
      await tapAt(oracle.page, aim.x, aim.y);
      await oracleIdle();
      check(/Désigner/.test(r.out) && /Annuler/.test(r.out), `étape ${i + 1} : le tap en (${aim.x}, ${aim.y}) ouvre la confirmation`, r.out.split('\n').find((l) => /Feuille/.test(l))?.slice(-70) ?? r.out.slice(0, 120));
      setForbidden(i + 1, false); // la carte de réussite de CETTE étape est désormais légitime
      r = await blind('press', 'Désigner');
      await pressButton(oracle.page, 'Désigner');
      await oracleIdle();
      const solvedText = fold(step.solved).replace(/\s/g, '').slice(0, 40);
      check(fold(r.out).replace(/\s/g, '').includes(solvedText), `étape ${i + 1} : « Désigner » mène à « résolue » (carte de réussite avec le texte de l'étape)`, r.out.split('\n').find((l) => /Feuille/.test(l))?.slice(0, 110));
      lastCard = r.out;
      r = await blind('status');
      const m = new RegExp(`Questions résolues : ${i + 1} sur ${N}`).test(r.out);
      check(m, `étape ${i + 1} : « status » affiche ${i + 1} sur ${N}`);
      const last = i === def.steps.length - 1;
      const label = last ? 'Conclure l’enquête' : 'Continuer';
      if (last) setForbidden(def.steps.length, true); // l'épilogue s'affiche à l'écran de fin
      r = await blind('press', label);
      await pressButton(oracle.page, label);
      await oracleIdle();
      check(r.code === 0, `étape ${i + 1} : « press ${label} » réussit`, r.err.trim());
      if (i === 1) {
        // Carnet avec deux réponses trouvées : deux boutons « Voir ». Sans --nth, refus informatif ; ouverture/fermeture
        // reproduites sur la page oracle (aucun vol de caméra : la suite du parcours reste synchrone).
        r = await blind('press', 'Ouvrir le carnet');
        await pressButton(oracle.page, 'Ouvrir le carnet');
        await oracleIdle();
        r = await blind('press', 'Voir');
        check(r.code === 1 && /(existe 2 fois|correspond à 2 boutons)/.test(r.err) && /\(\d+, \d+\)/.test(r.err) && /--nth 2/.test(r.err), '« press Voir » avec deux « Voir » dans le carnet est refusé en listant leur position et `--nth`', r.err.trim().slice(0, 140));
        r = await blind('press', 'Voir', '--nth', 3);
        check(r.code === 1 && /n'existe que 2 fois \(--nth 3 demandé\)/.test(r.err), '« press Voir --nth 3 » (il n\'y en a que 2) est refusé clairement', r.err.trim().slice(0, 120));
        r = await blind('press', 'Fermer le carnet');
        await pressButton(oracle.page, 'Fermer le carnet');
        await oracleIdle();
        check(r.code === 0 && /Aucune feuille ouverte/.test(r.out), 'le carnet se referme (étape 2)');
      }
    }
    check(/Conclure/.test(lastCard), 'la dernière carte propose « Conclure l\'enquête »');
    r = await blind('text');
    check(/Affaire classée/.test(r.out) && /fin d.enquête/.test(r.out), '« text » affiche l\'écran de fin « Affaire classée »');
    r = await blind('status');
    check(new RegExp(`Questions résolues : ${N} sur ${N}`).test(r.out) && /terminée/.test(r.out) && /Étoiles : 3 sur 3/.test(r.out) && /Erreurs : 1 /.test(r.out), `« status » final : ${N} sur ${N}, terminée, 3 étoiles (1 erreur volontaire tolérée)`, r.out.split('\n').slice(2, 4).join(' / '));
    check(r.out.trimEnd().split('\n').at(-1) === 'Incidents techniques de la page : 0', '« status » (fin) : aucun incident technique de la page', r.out.trimEnd().split('\n').at(-1));
    r = await blind('shot', 'selftest-fin');
    shotsTaken++;
    r = await blind('status');
    check(new RegExp(`Captures prises : ${shotsTaken} `).test(r.out), '« status » compte les captures', `${shotsTaken}`);

    // Fin d'enquête : le carnet liste les réponses, chacune avec un bouton « Voir » ; `--nth` choisit le n-ième de haut en bas.
    await blind('press', 'Ouvrir le carnet');
    const voirList = await blind('buttons');
    const voirs = [...voirList.out.matchAll(/« Voir[^»]*»[^\n]*centre \((\d+), (\d+)\)/g)].map((m) => ({ x: Number(m[1]), y: Number(m[2]) })).sort((a, b) => a.y - b.y);
    check(voirs.length >= 2, 'le carnet de fin d\'enquête montre au moins deux boutons « Voir »', `${voirs.length}`);
    r = await blind('press', 'Voir', '--nth', 2);
    const touched = /touché en \((\d+), (\d+)\)/.exec(r.out);
    check(r.code === 0 && /\(n° 2 de haut en bas\)/.test(r.out) && !!touched && voirs.length >= 2 && Number(touched[1]) === voirs[1].x && Number(touched[2]) === voirs[1].y && /Aucune feuille ouverte/.test(r.out), '« press Voir --nth 2 » touche le deuxième « Voir » du carnet (de haut en bas) et le referme', r.out.split('\n')[0]);

    /* ---------------------------------------------------------------- D : arrêt propre */
    section('D. Arrêt propre');
    tree = [...new Set([...tree, ...processTree(info.pid)])];
    await oracleBrowser.close();
    oracleBrowser = null;
    r = await blind('stop');
    check(r.code === 0 && /arrêtée/.test(r.out) && /Bilan final/.test(r.out), '« stop » arrête la partie et donne le bilan', `${(r.ms / 1000).toFixed(1)} s`);
    await sleep(500);
    const still = tree.filter(alive);
    check(still.length === 0, 'plus aucun processus (démon, navigateur) après « stop »', still.length ? `restent : ${still.join(', ')}` : `${tree.length} processus terminés`);
    check(!existsSync(join(dir, 'daemon.json')), 'le fichier d\'état du démon est supprimé');
    check(!(await portOpen(info.vitePort)) && !(await portOpen(info.controlPort)), 'les ports (jeu et contrôle) sont fermés');
    r = await runCli(['list']);
    check(!r.out.includes(PLAYER), '« list » ne montre plus la partie');
    r = await blind('tap', 100, 100);
    check(r.code !== 0 && /aucune partie en cours/.test(r.err), 'une commande après « stop » échoue clairement', r.err.trim().slice(0, 100));
    check(existsSync(join(dir, 'commands.jsonl')) && existsSync(join(dir, 'daemon.log')), 'journaux conservés (daemon.log, commands.jsonl)');
    const log = readFileSync(join(dir, 'daemon.log'), 'utf8');
    check(!/\[page:(error|exception|ressource|HTTP|requête échouée)/.test(log), 'aucune erreur de page, ressource en échec ou réponse HTTP ≥ 400 dans daemon.log', (log.match(/\[page:[^\n]*/g) ?? []).slice(0, 2).join(' | '));
  } catch (err) {
    failures++;
    console.log(`ÉCHEC  exception : ${err?.stack ?? err}`);
  } finally {
    try {
      await oracleBrowser?.close();
    } catch {}
    // Filet de sécurité : jamais de démon laissé derrière nous.
    const left = await runCli(['stop', '--case', CASE, '--player', PLAYER]);
    if (/arrêtée|tuée/.test(left.out) && failures === 0) console.log('(le filet de sécurité a dû arrêter une partie restée ouverte)');
  }

  section('Temps par commande (durée totale du processus CLI, démarrage de Node compris)');
  const rows = [...timings.entries()].map(([cmd, v]) => {
    const s = [...v].sort((a, b) => a - b);
    return { cmd, n: v.length, mean: v.reduce((a, b) => a + b, 0) / v.length, med: s[Math.floor(s.length / 2)], max: s[s.length - 1] };
  });
  rows.sort((a, b) => b.mean - a.mean);
  console.log('commande   n    moyenne   médiane       max');
  for (const x of rows) console.log(`${x.cmd.padEnd(9)} ${String(x.n).padStart(3)}  ${x.mean.toFixed(0).padStart(6)} ms  ${x.med.toFixed(0).padStart(6)} ms  ${x.max.toFixed(0).padStart(6)} ms`);
  const gestures = rows.filter((x) => ['tap', 'dtap', 'drag', 'pinch', 'press', 'wait'].includes(x.cmd));
  const total = (xs) => xs.reduce((a, x) => a + x.mean * x.n, 0) / Math.max(1, xs.reduce((a, x) => a + x.n, 0));
  console.log(`moyenne des gestes (tap/press/wait…) : ${total(gestures).toFixed(0)} ms ; de toutes les commandes hors start/stop : ${total(rows.filter((x) => x.cmd !== 'start' && x.cmd !== 'stop')).toFixed(0)} ms`);

  console.log(`\n${failures === 0 ? 'SELFTEST OK : tous les contrôles passent.' : `SELFTEST ÉCHEC : ${failures} contrôle(s) en échec.`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
