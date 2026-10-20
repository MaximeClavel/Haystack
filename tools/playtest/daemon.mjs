// Démon du « joueur test aveugle » : garde un navigateur ouvert sur le jeu (son propre serveur Vite,
// profil neuf, SANS ?debug) et obéit aux commandes envoyées par blind.mjs sur un petit serveur HTTP local.
//
// Lancé par « blind.mjs start » (détaché, journal dans daemon.log) ; ne se lance pas à la main.
//   node tools/playtest/daemon.mjs --case c00 [--player nom] [--port N] [--device pixel7|small]
//
// Cycle de vie : s'arrête sur « stop », après PLAYTEST_IDLE_MS d'inactivité (25 min par défaut), sur
// SIGTERM/SIGINT/SIGHUP, si le navigateur se ferme ou si le serveur plante. Un démon ne survit jamais seul.

import { createServer as createViteServer } from 'vite';
import { chromium } from '@playwright/test';
import { createServer as createHttpServer } from 'node:http';
import { appendFileSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { join } from 'node:path';
import {
  DEFAULT_IDLE_MS,
  ROOT,
  UsageError,
  checkCaseId,
  checkPlayer,
  parseArgs,
  sessionDir,
} from './common.mjs';
import {
  GestureError,
  contextOptionsFor,
  doubleTapAt,
  dragTouch,
  formatButtons,
  formatDigest,
  formatText,
  pinchTouch,
  pressButton,
  readProgress,
  readUi,
  resolveDevice,
  settle,
  sleep,
  takeScreenshot,
  tapAt,
  toastRecorder,
  uiSignature,
} from './page-tools.mjs';

const { flags } = parseArgs(process.argv.slice(2));
const caseId = checkCaseId(String(flags.case ?? ''));
const player = checkPlayer(flags.player);
const device = resolveDevice(flags);
const dir = sessionDir(caseId, player);
const idleMs = Number(process.env.PLAYTEST_IDLE_MS) > 0 ? Number(process.env.PLAYTEST_IDLE_MS) : DEFAULT_IDLE_MS;
const COMMAND_BUDGET_MS = 26_000;
const token = randomBytes(16).toString('hex');
const startedAt = Date.now();

mkdirSync(dir, { recursive: true });
const infoFile = join(dir, 'daemon.json');
const jsonlFile = join(dir, 'commands.jsonl');

const stamp = () => new Date().toISOString();
function log(msg) {
  // stdout est redirigé vers daemon.log par « start ».
  process.stdout.write(`[${stamp()}] ${msg}\n`);
}

/* ----------------------------------------------------------------------------
 * État
 * ------------------------------------------------------------------------- */

let vite = null;
let browser = null;
let context = null;
let page = null;
let cdp = null;
let httpServer = null;
let shuttingDown = false;
let idleTimer = null;
let shotCount = 0;
let commandCount = 0;
const pageIncidents = { errors: 0, warnings: 0, failedRequests: 0 };
let info = null;

function writeInfo(patch) {
  info = { ...(info ?? {}), ...patch };
  writeFileSync(infoFile, JSON.stringify(info, null, 2));
}

function armIdle() {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => void shutdown(`inactivité de ${Math.round(idleMs / 60000)} min`), idleMs);
  idleTimer.unref?.();
}

async function shutdown(reason, code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  log(`arrêt : ${reason}`);
  clearTimeout(idleTimer);
  const hard = setTimeout(() => process.exit(code || 1), 9000);
  hard.unref?.();
  try {
    await Promise.race([browser?.close(), sleep(5000)]);
  } catch {}
  try {
    await Promise.race([vite?.close(), sleep(3000)]);
  } catch {}
  try {
    httpServer?.close();
  } catch {}
  rmSync(infoFile, { force: true });
  log('démon arrêté');
  process.exit(code);
}

for (const sig of ['SIGTERM', 'SIGINT', 'SIGHUP']) process.on(sig, () => void shutdown(`signal ${sig}`));
process.on('exit', () => rmSync(infoFile, { force: true }));
process.on('uncaughtException', (err) => {
  log(`exception non rattrapée : ${err?.stack ?? err}`);
  void shutdown('exception non rattrapée', 1);
});
process.on('unhandledRejection', (err) => {
  log(`promesse rejetée : ${err?.stack ?? err}`);
});

/* ----------------------------------------------------------------------------
 * Commandes
 * ------------------------------------------------------------------------- */

const num = (v, name) => {
  const n = Number(v);
  if (v === undefined || v === '' || !Number.isFinite(n)) throw new UsageError(`${name} doit être un nombre`);
  return n;
};

/** Message(s) passager(s) apparus depuis `mark` (index dans le journal injecté dans la page). */
const toastMark = () => page.evaluate(() => (window.__ptToasts ? window.__ptToasts.length : 0));
const toastsSince = async (mark) =>
  page.evaluate((m) => (window.__ptToasts ? window.__ptToasts.slice(m).map((t) => t.text) : []), mark);

/** Attend la stabilisation de la carte puis résume ce qui est à l'écran. */
let lastSig = null;
async function afterGesture(mark) {
  await settle(page);
  const ui = await readUi(page);
  const toasts = await toastsSince(mark);
  const digest = formatDigest(ui, toasts, lastSig);
  lastSig = uiSignature(ui);
  return digest;
}

function parseCrop(v) {
  if (v === undefined) return null;
  const parts = String(v)
    .split(/[,\s]+/)
    .map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) throw new UsageError('--crop attend « x,y,largeur,hauteur » (pixels écran), par exemple --crop 150,300,120,120');
  return { x: parts[0], y: parts[1], w: parts[2], h: parts[3] };
}

/** `--nth N` de « press » : rang (à partir de 1) du bouton parmi ceux qui portent le même libellé. */
function parseNth(v) {
  if (v === undefined) return undefined;
  const n = Number(v);
  if (v === true || !Number.isInteger(n) || n < 1) throw new UsageError('--nth attend un entier à partir de 1 : le rang du bouton, de haut en bas (par exemple press Voir --nth 2)');
  return n;
}

const commands = {
  async ping() {
    return 'pong';
  },

  async shot({ positional, flags }) {
    const raw = positional[0];
    let name;
    if (raw !== undefined) {
      name = String(raw).toLowerCase().replace(/\.png$/, '').replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
      if (!name) throw new UsageError('nom de capture invalide (lettres, chiffres, - et _)');
    } else {
      name = String(shotCount + 1).padStart(3, '0');
    }
    const crop = parseCrop(flags.crop);
    await settle(page, { maxMs: 2500, quietMs: 200 });
    let file = join(dir, `${name}.png`);
    for (let k = 2; existsSync(file); k++) file = join(dir, `${name}-${k}.png`);
    const size = await takeScreenshot(page, file, { grid: flags.grid === true, crop });
    shotCount++;
    let what;
    if (crop) {
      const z = size.zone;
      const clipped = z.w !== Math.round(crop.w) || z.h !== Math.round(crop.h) || z.x !== Math.round(crop.x) || z.y !== Math.round(crop.y);
      const zone = `(${z.x}, ${z.y}) ${z.w}×${z.h} px d'écran${clipped ? ' (zone ramenée aux bords de l\'écran)' : ''}`;
      what =
        size.factor > 1
          ? `zone agrandie ${zone} → image de ${size.w}×${size.h} px (agrandie ×${size.factor} ; les détails réels sont ceux de l'écran, l'agrandissement est lissé)`
          : `zone ${zone} → image de ${size.w}×${size.h} px (déjà assez grande : pas d'agrandissement ; les détails réels sont ceux de l'écran)`;
    } else what = `écran complet ${size.w}×${size.h} px (1 pixel de l'image = 1 pixel de coordonnée)`;
    return `Capture n°${shotCount} : ${file}\n${what}${flags.grid === true ? ' — grille rose : lignes tous les ' + (crop ? '10 à 50' : '50') + ' px, valeurs en coordonnées écran' : ''}.\nLisez ce fichier avec l'outil Read.`;
  },

  async tap({ positional }) {
    const [x, y] = [num(positional[0], 'x'), num(positional[1], 'y')];
    const mark = await toastMark();
    await tapAt(page, x, y);
    return `Tap en (${x}, ${y}).\n${await afterGesture(mark)}`;
  },

  async dtap({ positional }) {
    const [x, y] = [num(positional[0], 'x'), num(positional[1], 'y')];
    const mark = await toastMark();
    await doubleTapAt(page, x, y);
    return `Double tap en (${x}, ${y}).\n${await afterGesture(mark)}`;
  },

  async drag({ positional, flags }) {
    const [x1, y1, x2, y2] = ['x1', 'y1', 'x2', 'y2'].map((n, i) => num(positional[i], n));
    const ms = positional[4] !== undefined ? num(positional[4], 'durée') : flags.duration !== undefined ? num(flags.duration, 'durée') : 400;
    const mark = await toastMark();
    await dragTouch(page, cdp, { x: x1, y: y1 }, { x: x2, y: y2 }, ms, flags.fling === true);
    return `Glissé de (${x1}, ${y1}) à (${x2}, ${y2}) en ${ms} ms${flags.fling === true ? ' (doigt levé en mouvement : inertie)' : ''}.\n${await afterGesture(mark)}`;
  },

  async pinch({ positional }) {
    const [x, y, factor] = [num(positional[0], 'x'), num(positional[1], 'y'), num(positional[2], 'facteur')];
    const ms = positional[3] !== undefined ? num(positional[3], 'durée') : 500;
    const mark = await toastMark();
    const applied = await pinchTouch(page, cdp, { x, y }, factor, ms);
    const note = Math.abs(applied - factor) > 0.02 ? ` (facteur limité à ×${applied.toFixed(2)} : les doigts doivent tenir à l'écran, répétez le geste)` : '';
    return `Pincement centré en (${x}, ${y}), facteur ×${factor}${note}.\n${await afterGesture(mark)}`;
  },

  async wait({ positional }) {
    const ms = num(positional[0] ?? 1000, 'durée');
    if (ms < 0 || ms > 20_000) throw new UsageError('« wait » accepte de 0 à 20000 ms');
    const mark = await toastMark();
    await sleep(ms);
    return `Attendu ${ms} ms.\n${await afterGesture(mark)}`;
  },

  async text() {
    const ui = await readUi(page);
    lastSig = uiSignature(ui);
    return formatText(ui);
  },

  async buttons() {
    const ui = await readUi(page);
    lastSig = uiSignature(ui);
    return formatButtons(ui);
  },

  async press({ positional, flags }) {
    const label = positional.join(' ').trim();
    const nth = parseNth(flags.nth);
    const mark = await toastMark();
    const b = await pressButton(page, label, nth);
    return `Bouton « ${b.name} »${nth !== undefined ? ` (n° ${nth} de haut en bas)` : ''} touché en (${b.x}, ${b.y}).\n${await afterGesture(mark)}`;
  },

  async status() {
    const ui = await readUi(page);
    const p = await readProgress(page, caseId);
    const secs = Math.round((Date.now() - startedAt) / 1000);
    const dur = `${Math.floor(secs / 60)} min ${String(secs % 60).padStart(2, '0')} s`;
    const phase = ui.phase ? ({ brief: 'briefing', play: 'en cours', end: 'terminée (écran de fin)', replay: 'reconstitution' }[ui.phase] ?? ui.phase) : 'hors enquête';
    const lines = [
      `Enquête : ${caseId}${ui.title ? ` — « ${ui.title} »` : ''}${player ? ` (joueur ${player})` : ''}`,
      `Phase : ${phase}`,
    ];
    if (p.saved) {
      lines.push(`Questions résolues : ${p.solved} sur ${p.total}`);
      lines.push(`Erreurs : ${p.mistakes} · Indices utilisés : ${p.hints}${p.stars ? ` · Étoiles : ${p.stars} sur 3` : ''}`);
    } else {
      lines.push(ui.dots ? `Questions résolues : 0 sur ${ui.dots.total}` : 'Questions résolues : 0 (le nombre de questions s\'affiche une fois l\'enquête commencée)');
      lines.push('Erreurs : 0 · Indices utilisés : 0');
    }
    lines.push(`Durée écoulée : ${dur} · Captures prises : ${shotCount} · Commandes : ${commandCount}`);
    // Toujours affichée (même à zéro) : sans elle, on ne peut pas distinguer « aucun incident » de « incidents non comptés ».
    const inc = pageIncidents.errors + pageIncidents.failedRequests;
    lines.push(inc > 0 ? `Incidents techniques de la page : ${inc} (voir daemon.log ; à signaler à l'organisateur)` : 'Incidents techniques de la page : 0');
    return lines.join('\n');
  },

  async stop() {
    setTimeout(() => void shutdown('commande stop'), 80);
    return 'Arrêt demandé.';
  },
};

/** Options d'une commande à noter au journal (hors --case / --player, répétés à chaque commande). */
function loggedFlags(flags) {
  const kept = Object.entries(flags ?? {}).filter(([k]) => k !== 'case' && k !== 'player');
  return kept.length ? Object.fromEntries(kept) : undefined;
}

let queue = Promise.resolve();

/** Exécute une commande (une seule à la fois), avec un budget de temps. */
function runCommand(cmd, args) {
  const task = queue.then(async () => {
    const fn = commands[cmd];
    if (!fn) throw new UsageError(`commande inconnue : « ${cmd} »`);
    commandCount++;
    const t0 = Date.now();
    let ok = true;
    let errMsg = '';
    try {
      return await Promise.race([
        fn({ positional: (args?.positional ?? []).map(String), flags: args?.flags ?? {} }),
        sleep(COMMAND_BUDGET_MS).then(() => {
          throw new Error(`la commande « ${cmd} » a dépassé ${Math.round(COMMAND_BUDGET_MS / 1000)} s (page bloquée ?)`);
        }),
      ]);
    } catch (err) {
      ok = false;
      errMsg = err?.message ?? String(err);
      throw err;
    } finally {
      try {
        appendFileSync(jsonlFile, JSON.stringify({ t: stamp(), cmd, args: args?.positional ?? [], flags: loggedFlags(args?.flags), ms: Date.now() - t0, ok, error: ok ? undefined : errMsg }) + '\n');
      } catch {}
    }
  });
  queue = task.catch(() => {});
  return task;
}

/* ----------------------------------------------------------------------------
 * Démarrage
 * ------------------------------------------------------------------------- */

async function main() {
  log(`démarrage : enquête ${caseId}, appareil ${device.label} ${device.width}×${device.height} @${device.dpr}, dossier ${dir}`);

  // Serveur de contrôle d'abord (pour que « stop » fonctionne même pendant le chargement).
  httpServer = createHttpServer((req, res) => {
    const send = (code, body) => {
      res.writeHead(code, { 'content-type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(body));
    };
    if (req.method !== 'POST' || req.url !== '/cmd' || req.headers['x-playtest-token'] !== token) return send(403, { ok: false, error: 'accès refusé' });
    armIdle();
    let raw = '';
    req.on('data', (c) => {
      raw += c;
      if (raw.length > 100_000) req.destroy();
    });
    req.on('end', async () => {
      let body;
      try {
        body = JSON.parse(raw || '{}');
      } catch {
        return send(400, { ok: false, error: 'requête illisible' });
      }
      if (!page && body.cmd !== 'stop' && body.cmd !== 'ping') return send(200, { ok: false, error: 'le jeu est encore en train de démarrer, patientez.' });
      try {
        const text = await runCommand(String(body.cmd), body.args);
        send(200, { ok: true, text });
      } catch (err) {
        const msg = err?.message ?? String(err);
        const kind = err instanceof UsageError || err instanceof GestureError ? 'usage' : 'internal';
        if (kind === 'internal') log(`erreur interne (${body.cmd}) : ${err?.stack ?? err}`);
        send(200, { ok: false, error: kind === 'usage' ? msg : `erreur technique : ${msg}` });
      }
    });
  });
  await new Promise((resolve, reject) => {
    httpServer.once('error', reject);
    httpServer.listen(0, '127.0.0.1', resolve);
  });
  const controlPort = httpServer.address().port;
  writeInfo({ pid: process.pid, controlPort, token, caseId, player, dir, device, startedAt, ready: false });
  armIdle();

  // Serveur Vite propre à cette partie, sur un port libre (ou celui demandé par --port).
  const wanted = flags.port !== undefined && flags.port !== true ? Number(flags.port) : 0;
  if (!Number.isInteger(wanted) || wanted < 0 || wanted > 65535) throw new Error(`--port invalide : ${flags.port}`);
  vite = await createViteServer({
    configFile: join(ROOT, 'vite.config.ts'),
    root: ROOT,
    server: { port: wanted, host: '127.0.0.1', strictPort: wanted !== 0, hmr: false },
    logLevel: 'error',
    clearScreen: false,
  });
  await vite.listen();
  const addr = vite.httpServer.address();
  const vitePort = typeof addr === 'object' && addr ? addr.port : wanted;
  const base = `http://127.0.0.1:${vitePort}`;
  writeInfo({ vitePort });
  log(`serveur Vite sur ${base}`);

  browser = await chromium.launch();
  browser.on('disconnected', () => void shutdown('le navigateur s\'est fermé', 1));
  context = await browser.newContext(contextOptionsFor(device));
  await context.addInitScript(toastRecorder);
  page = await context.newPage();
  cdp = await context.newCDPSession(page);
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      // « Failed to load resource… » double une requête échouée ou une réponse HTTP ≥ 400, déjà comptées plus bas :
      // on la note au journal mais on ne la compte pas une seconde fois.
      if (/^Failed to load resource/i.test(msg.text())) {
        log(`[page:ressource] ${msg.text().slice(0, 300)} (déjà comptée par la requête)`);
        return;
      }
      pageIncidents.errors++;
      log(`[page:error] ${msg.text().slice(0, 300)}`);
    } else if (msg.type() === 'warning') {
      pageIncidents.warnings++;
    }
  });
  page.on('crash', () => void shutdown('la page du navigateur a planté', 1));
  page.on('pageerror', (err) => {
    pageIncidents.errors++;
    log(`[page:exception] ${String(err.message).slice(0, 300)}`);
  });
  page.on('requestfailed', (r) => {
    const why = r.failure()?.errorText ?? '';
    if (!/ERR_ABORTED/.test(why)) {
      pageIncidents.failedRequests++;
      log(`[page:requête échouée] ${r.url()} ${why}`);
    }
  });
  page.on('response', (r) => {
    if (r.status() >= 400) {
      pageIncidents.failedRequests++;
      log(`[page:HTTP ${r.status()}] ${r.url()}`);
    }
  });

  // Jamais de ?debug : aucune API de triche dans la page. Profil neuf (contexte vierge).
  await page.goto(`${base}/?case=${encodeURIComponent(caseId)}`, { waitUntil: 'load', timeout: 60_000 });
  await page.waitForFunction(() => window.__haystackReady === true, null, { timeout: 70_000 });
  await settle(page, { maxMs: 4000 });
  const ui = await readUi(page);
  if (!ui.phase) throw new Error(`l'enquête « ${caseId} » n'existe pas (le jeu ne l'a pas ouverte)`);
  const leaked = await page.evaluate(() => typeof window.__haystack !== 'undefined');
  if (leaked) throw new Error('le jeu expose window.__haystack sans ?debug : arrêt par sécurité (anti-triche)');
  writeInfo({ ready: true, readyAt: Date.now() });
  log(`prêt (${Math.round((Date.now() - startedAt) / 100) / 10} s)`);
}

main().catch(async (err) => {
  log(`échec du démarrage : ${err?.stack ?? err}`);
  writeInfo({ ready: false, failed: String(err?.message ?? err) });
  await sleep(300);
  await shutdown('échec du démarrage', 1);
});

