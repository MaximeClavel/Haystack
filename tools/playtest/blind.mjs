#!/usr/bin/env node
// « Joueur test aveugle » : jouer à une enquête de Haystack comme un vrai joueur (un doigt, un écran),
// SANS accès aux solutions. Ce fichier est le client en ligne de commande ; le navigateur vit dans un
// démon (daemon.mjs) lancé par « start ». Mode d'emploi complet : tools/playtest/README.md.
//
//   node tools/playtest/blind.mjs start <idEnquête> [--player nom] [--port N] [--device pixel7|small]
//   node tools/playtest/blind.mjs shot [nom] [--grid] [--crop x,y,l,h]
//   node tools/playtest/blind.mjs tap x y | dtap x y | drag x1 y1 x2 y2 [ms] | pinch x y facteur | wait ms
//   node tools/playtest/blind.mjs text | buttons | press <libellé> [--nth N] | status
//   node tools/playtest/blind.mjs stop [--all]   |   list
//
// Après « start », ajoutez --case <idEnquête> (et --player <nom> s'il y en a un) à chaque commande.

import { closeSync, existsSync, mkdirSync, openSync, readdirSync, readFileSync, renameSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import {
  COMMAND_TIMEOUT_MS,
  ROOT,
  START_TIMEOUT_MS,
  UsageError,
  callDaemon,
  checkCaseId,
  checkPlayer,
  isAlive,
  listSessions,
  parseArgs,
  readSessionFile,
  resolveSession,
  sessionDir,
  sessionKey,
  sleep,
} from './common.mjs';

const SELF = 'node tools/playtest/blind.mjs';

const HELP = `Joueur test aveugle de Haystack — jouer comme un vrai joueur, sans voir les solutions.

Démarrer / arrêter
  start <idEnquête>            ouvre le jeu sur un profil neuf (ex. : start c00). Options :
                               --player <nom>   votre nom, si plusieurs joueurs jouent la même enquête
                               --port <N>       port du serveur du jeu (par défaut : un port libre)
                               --device pixel7|small   écran 412×915 (défaut) ou 390×844
  stop                         ferme la partie (--all : toutes les parties de cette machine)
  list                         parties en cours

Voir
  shot [nom]                   capture de tout l'écran dans .shots/playtest/<enquête>/ (à lire avec l'outil Read)
       --grid                  ajoute une grille de repérage (coordonnées écran)
       --crop x,y,l,h          agrandit une zone (x,y = coin haut gauche, l×h en pixels écran) : image d'au moins
                               480 px de côté, agrandissement lissé (visez au moins 100×100 pour un personnage entier)
  text                         texte visible de l'interface (question, feuilles, messages, boutons)
  buttons                      boutons visibles, avec leur position
  status                       progression (non spoilante) : questions résolues, erreurs, indices, durée, captures,
                               incidents techniques de la page (toujours affichés, même à 0)

Agir (coordonnées en pixels de l'écran, origine en haut à gauche)
  tap x y                      toucher
  dtap x y                     double toucher (zoom)
  drag x1 y1 x2 y2 [ms]        glisser un doigt (--fling : avec élan)
  pinch x y facteur [ms]       pincer : facteur > 1 zoome, < 1 dézoome
  press <libellé>              toucher le bouton portant ce libellé (ex. : press Désigner)
       --nth N                 si plusieurs boutons portent le même libellé (les « Voir » du carnet) : le n-ième,
                               de haut en bas (ex. : press Voir --nth 2)
  wait ms                      attendre

Après « start », ajoutez --case <idEnquête> (et --player <nom>) à chaque commande.
Mode d'emploi : tools/playtest/README.md`;

const FORWARDED = new Set(['shot', 'tap', 'dtap', 'drag', 'pinch', 'wait', 'text', 'buttons', 'press', 'status']);

function fail(msg, code = 1) {
  process.stderr.write(`Erreur : ${msg}\n`);
  process.exit(code);
}

function tail(file, n = 12) {
  try {
    return readFileSync(file, 'utf8').trimEnd().split('\n').slice(-n).join('\n');
  } catch {
    return '(journal introuvable)';
  }
}

/** Range les fichiers d'une partie précédente (captures, journaux) dans _archive/<date>/ : rien n'est supprimé. */
function archivePrevious(dir) {
  if (!existsSync(dir)) return;
  const files = readdirSync(dir, { withFileTypes: true }).filter((e) => e.isFile() && /\.(png|log|jsonl)$/.test(e.name));
  if (files.length === 0) return;
  const arch = join(dir, '_archive', new Date().toISOString().replace(/[:.]/g, '-'));
  mkdirSync(arch, { recursive: true });
  for (const f of files) renameSync(join(dir, f.name), join(arch, f.name));
}

async function waitDead(pid, ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (!isAlive(pid)) return true;
    await sleep(100);
  }
  return !isAlive(pid);
}

async function start(positional, flags) {
  const caseId = checkCaseId(positional[0] ?? (flags.case === true ? undefined : flags.case));
  const player = checkPlayer(flags.player);
  if (flags.device !== undefined && !['pixel7', 'small'].includes(String(flags.device))) throw new UsageError('--device accepte pixel7 ou small');
  if (flags.port !== undefined && !/^\d{2,5}$/.test(String(flags.port))) throw new UsageError('--port attend un numéro de port');
  const dir = sessionDir(caseId, player);
  const key = sessionKey(caseId, player);

  const existing = readSessionFile(dir);
  // Un fichier d'état dont le processus vit mais ne répond plus (numéro de processus réutilisé) est périmé.
  const answers = existing && isAlive(existing.pid) ? (await callDaemon({ ...existing, dir }, 'ping', { positional: [], flags: {} }, 2500)).ok : false;
  if (existing && isAlive(existing.pid) && answers) {
    throw new UsageError(
      `une partie est déjà en cours pour ${key} (démon ${existing.pid}). Continuez-la, ou arrêtez-la d'abord : ${SELF} stop --case ${caseId}${player ? ` --player ${player}` : ''}`,
    );
  }
  mkdirSync(dir, { recursive: true });
  archivePrevious(dir);

  const logPath = join(dir, 'daemon.log');
  const fd = openSync(logPath, 'a');
  const args = [join(import.meta.dirname, 'daemon.mjs'), '--case', caseId];
  if (player) args.push('--player', player);
  for (const k of ['port', 'device', 'width', 'height', 'dpr']) if (flags[k] !== undefined && flags[k] !== true) args.push(`--${k}`, String(flags[k]));
  const child = spawn(process.execPath, args, { cwd: ROOT, detached: true, stdio: ['ignore', fd, fd], env: process.env });
  closeSync(fd);
  let exited = false;
  child.on('exit', () => {
    exited = true;
  });
  child.unref();

  const t0 = Date.now();
  let session = null;
  while (Date.now() - t0 < START_TIMEOUT_MS) {
    await sleep(250);
    if (exited) break;
    const s = readSessionFile(dir);
    if (s && s.ready) {
      session = { ...s, dir };
      break;
    }
  }
  if (!session) {
    try {
      if (!exited) process.kill(child.pid, 'SIGTERM');
    } catch {}
    await waitDead(child.pid, 6000);
    const why = /échec du démarrage : (?:Error: )?(.*)/.exec(tail(logPath, 40))?.[1];
    fail(
      `le jeu n'a pas pu démarrer (${why ?? (exited ? 'le démon s\'est arrêté' : 'délai de ' + START_TIMEOUT_MS / 1000 + ' s dépassé')}).\nDerniers messages de ${logPath} :\n${tail(logPath)}`,
    );
  }

  const dev = session.device;
  const lines = [
    `Partie démarrée : enquête ${caseId}${player ? ` (joueur ${player})` : ''} — prête en ${((Date.now() - t0) / 1000).toFixed(1)} s.`,
    `Écran émulé : ${dev.label} ${dev.width}×${dev.height} px. Toutes les coordonnées sont en pixels de cet écran (origine en haut à gauche, x vers la droite, y vers le bas).`,
    `Pour toutes vos commandes : ${SELF} <commande> --case ${caseId}${player ? ` --player ${player}` : ''}`,
    `Mode d'emploi : tools/playtest/README.md. Captures : ${dir}`,
    '',
    '--- À l\'écran ---',
  ];
  const text = await callDaemon(session, 'text', { positional: [], flags: {} });
  lines.push(text.ok ? text.text : `(texte indisponible : ${text.error})`);
  const shot = await callDaemon(session, 'shot', { positional: [], flags: {} });
  lines.push('', '--- Première capture ---', shot.ok ? shot.text : `(capture indisponible : ${shot.error})`);
  console.log(lines.join('\n'));
}

async function stopSession(s) {
  const status = await callDaemon(s, 'status', { positional: [], flags: {} }, 8000);
  const res = await callDaemon(s, 'stop', { positional: [], flags: {} }, 8000);
  let how = 'arrêtée';
  if (!(await waitDead(s.pid, 12_000))) {
    try {
      process.kill(s.pid, 'SIGTERM');
    } catch {}
    how = 'arrêtée (SIGTERM)';
    if (!(await waitDead(s.pid, 5000))) {
      try {
        process.kill(s.pid, 'SIGKILL');
      } catch {}
      how = 'tuée (SIGKILL)';
      await waitDead(s.pid, 3000);
    }
  } else if (!res.ok && !res.gone) {
    how = `arrêtée (${res.error})`;
  }
  const head = `Partie ${sessionKey(s.caseId, s.player)} ${how}.`;
  return status.ok ? `${head}\nBilan final :\n${status.text}` : head;
}

async function stop(flags) {
  if (flags.all === true) {
    const all = listSessions();
    if (all.length === 0) return console.log('Aucune partie en cours.');
    for (const s of all) console.log(await stopSession(s));
    return;
  }
  let session;
  try {
    session = resolveSession(flags);
  } catch (err) {
    if (err instanceof UsageError && /aucune partie/.test(err.message)) return console.log('Aucune partie en cours : rien à arrêter.');
    throw err;
  }
  console.log(await stopSession(session));
}

function list() {
  const all = listSessions();
  if (all.length === 0) return console.log('Aucune partie en cours.');
  for (const s of all) {
    const mins = Math.round((Date.now() - s.startedAt) / 60000);
    console.log(`- ${sessionKey(s.caseId, s.player)} — démon ${s.pid}, jeu sur le port ${s.vitePort}, ouverte depuis ${mins} min — ${s.dir}`);
  }
}

async function main() {
  const { positional, flags } = parseArgs(process.argv.slice(2));
  const cmd = positional.shift();
  if (!cmd || cmd === 'help' || flags.help === true || flags.h === true) {
    console.log(HELP);
    return;
  }
  if (cmd === 'start') return start(positional, flags);
  if (cmd === 'stop') return stop(flags);
  if (cmd === 'list') return list();
  if (!FORWARDED.has(cmd)) throw new UsageError(`commande inconnue : « ${cmd} ». Commandes : start, stop, list, shot, tap, dtap, drag, pinch, wait, text, buttons, press, status (aide : ${SELF} help)`);
  const session = resolveSession(flags);
  const res = await callDaemon(session, cmd, { positional, flags }, COMMAND_TIMEOUT_MS);
  if (!res.ok) fail(res.error, 1);
  console.log(res.text);
}

main().catch((err) => {
  if (err instanceof UsageError) fail(err.message, 2);
  fail(err?.stack ?? String(err), 1);
});
