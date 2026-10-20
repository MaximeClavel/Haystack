// Outils partagés du « joueur test aveugle » : chemins, arguments, découverte des parties en cours,
// appel du démon. Voir tools/playtest/README.md (mode d'emploi) et docs/journal/phase3-outil-playtest.md.
//
// Modules Node purs (aucune dépendance autre que la bibliothèque standard).

import { existsSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

export const ROOT = resolve(import.meta.dirname, '..', '..');
export const PLAY_ROOT = join(ROOT, '.shots', 'playtest');
/** Inactivité au bout de laquelle un démon s'arrête seul (surchargeable par PLAYTEST_IDLE_MS, pour les tests). */
export const DEFAULT_IDLE_MS = 25 * 60 * 1000;
/** Délai maximal d'une commande (hors `start`). */
export const COMMAND_TIMEOUT_MS = 30_000;
export const START_TIMEOUT_MS = 90_000;

/** Options qui prennent une valeur ; toutes les autres options `--x` sont des interrupteurs. */
export const VALUE_FLAGS = new Set(['case', 'player', 'port', 'device', 'width', 'height', 'dpr', 'crop', 'duration', 'nth']);

/** Découpe argv en { positional, flags }. `--x=valeur` et `--x valeur` sont acceptés. */
export function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--') && a.length > 2) {
      const eq = a.indexOf('=');
      const key = (eq > 0 ? a.slice(2, eq) : a.slice(2)).toLowerCase();
      if (eq > 0) flags[key] = a.slice(eq + 1);
      else if (VALUE_FLAGS.has(key)) {
        const next = argv[i + 1];
        if (next === undefined) throw new UsageError(`l'option --${key} attend une valeur`);
        flags[key] = next;
        i++;
      } else flags[key] = true;
    } else positional.push(a);
  }
  return { positional, flags };
}

/** Erreur d'usage (code de sortie 2) : message destiné au joueur test. */
export class UsageError extends Error {}

const ID_RE = /^[a-z0-9][a-z0-9-]{0,40}$/;
const PLAYER_RE = /^[a-z0-9][a-z0-9_-]{0,30}$/;

export function checkCaseId(id) {
  const v = typeof id === 'string' ? id.toLowerCase() : '';
  if (!v || !ID_RE.test(v)) throw new UsageError(`identifiant d'enquête invalide : « ${id ?? ''} » (attendu : c00, c01…)`);
  return v;
}

export function checkPlayer(name) {
  if (name === undefined || name === true) return null;
  const n = String(name).toLowerCase();
  if (!PLAYER_RE.test(n)) throw new UsageError(`nom de joueur invalide : « ${name} » (lettres, chiffres, - et _, 31 caractères au plus)`);
  return n;
}

/** Dossier d'une partie : .shots/playtest/<caseId>/ (ou .../<caseId>/<joueur>/). */
export function sessionDir(caseId, player) {
  return player ? join(PLAY_ROOT, caseId, player) : join(PLAY_ROOT, caseId);
}

export const sessionKey = (caseId, player) => (player ? `${caseId} --player ${player}` : caseId);

export function isAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 1) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err.code === 'EPERM';
  }
}

export function readSessionFile(dir) {
  try {
    return JSON.parse(readFileSync(join(dir, 'daemon.json'), 'utf8'));
  } catch {
    return null;
  }
}

/** Parties dont le démon vit encore (les fichiers d'état périmés sont supprimés au passage). */
export function listSessions() {
  const found = [];
  if (!existsSync(PLAY_ROOT)) return found;
  const consider = (dir) => {
    const s = readSessionFile(dir);
    if (!s) return;
    if (isAlive(s.pid)) found.push({ ...s, dir });
    else rmSync(join(dir, 'daemon.json'), { force: true });
  };
  for (const a of readdirSync(PLAY_ROOT)) {
    const d1 = join(PLAY_ROOT, a);
    if (!statSync(d1).isDirectory()) continue;
    consider(d1);
    for (const b of readdirSync(d1)) {
      const d2 = join(d1, b);
      if (statSync(d2).isDirectory()) consider(d2);
    }
  }
  return found;
}

/** Retrouve la partie visée par les options (--case / --player) ou, à défaut, l'unique partie en cours. */
export function resolveSession(flags) {
  const player = checkPlayer(flags.player);
  if (flags.case !== undefined && flags.case !== true) {
    const caseId = checkCaseId(String(flags.case));
    const dir = sessionDir(caseId, player);
    const s = readSessionFile(dir);
    if (!s || !isAlive(s.pid)) throw new UsageError(`aucune partie en cours pour ${sessionKey(caseId, player)} : lancez d'abord « start ${caseId}${player ? ` --player ${player}` : ''} ».`);
    return { ...s, dir };
  }
  const live = listSessions().filter((s) => (player ? s.player === player : true));
  if (live.length === 0) throw new UsageError('aucune partie en cours : lancez d\'abord « node tools/playtest/blind.mjs start <idEnquête> ».');
  if (live.length > 1) {
    const list = live.map((s) => `  - ${sessionKey(s.caseId, s.player)}`).join('\n');
    throw new UsageError(`plusieurs parties sont en cours sur cette machine, précisez la vôtre avec --case <id> [--player <nom>] :\n${list}`);
  }
  return live[0];
}

/** Envoie une commande au démon. Renvoie { ok, text | error }. */
export async function callDaemon(session, cmd, args, timeoutMs = COMMAND_TIMEOUT_MS) {
  let res;
  try {
    res = await fetch(`http://127.0.0.1:${session.controlPort}/cmd`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-playtest-token': session.token },
      body: JSON.stringify({ cmd, args }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
      return { ok: false, error: `la commande « ${cmd} » a dépassé ${Math.round(timeoutMs / 1000)} s (machine surchargée ?). Réessayez ; en cas de blocage : « stop » puis « start ».` };
    }
    return {
      ok: false,
      error: `le démon de la partie ${sessionKey(session.caseId, session.player)} ne répond plus (arrêté par inactivité, par « stop », ou planté : voir ${join(session.dir, 'daemon.log')}). Relancez « start ».`,
      gone: true,
    };
  }
  let body;
  try {
    body = await res.json();
  } catch {
    return { ok: false, error: `réponse illisible du démon (HTTP ${res.status})` };
  }
  return body;
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
