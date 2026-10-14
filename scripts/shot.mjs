#!/usr/bin/env node
// Captures d'écran automatisées (outil de vérification visuelle pour les agents et les humains).
//
// Usage :
//   node scripts/shot.mjs <chemin-url> <sortie.png> [--width 390] [--height 844] [--dpr 2] [--wait 200]
//   node scripts/shot.mjs --batch captures.json
//
// <chemin-url> est relatif au serveur de dev, ex. "/?debug&ui=0&x=2850&y=2060&zoom=2"
// ou "/dev/gallery.html". Le script démarre son propre serveur Vite sur un port libre,
// attend que la page signale `window.__haystackReady === true` (30 s max), puis capture.
// Les erreurs console de la page sont affichées (préfixe [page]).
//
// Format du fichier batch : [{ "path": "...", "out": "...", "width": 390, "height": 844, "dpr": 2, "wait": 200 }]

import { createServer } from 'vite';
import { chromium } from '@playwright/test';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

function parseArgs(argv) {
  const opts = { positional: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) opts[key] = true;
      else {
        opts[key] = next;
        i++;
      }
    } else opts.positional.push(a);
  }
  return opts;
}

const args = parseArgs(process.argv.slice(2));
let jobs;
if (args.batch) {
  jobs = JSON.parse(readFileSync(String(args.batch), 'utf8'));
} else {
  const [path, out] = args.positional;
  if (!path || !out) {
    console.error('Usage : node scripts/shot.mjs <chemin-url> <sortie.png> [--width N --height N --dpr N --wait ms]');
    process.exit(2);
  }
  jobs = [{ path, out, width: args.width, height: args.height, dpr: args.dpr, wait: args.wait }];
}

const server = await createServer({
  configFile: resolve(import.meta.dirname, '..', 'vite.config.ts'),
  root: resolve(import.meta.dirname, '..'),
  server: { port: 0, host: '127.0.0.1', strictPort: false, hmr: false },
  logLevel: 'error',
});
await server.listen();
const addr = server.httpServer.address();
const base = `http://127.0.0.1:${typeof addr === 'object' && addr ? addr.port : 5173}`;

const browser = await chromium.launch();
let failures = 0;
try {
  for (const job of jobs) {
    const width = Number(job.width ?? 390);
    const height = Number(job.height ?? 844);
    const dpr = Number(job.dpr ?? 2);
    const context = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: dpr,
      isMobile: width < 800,
      hasTouch: width < 800,
    });
    const page = await context.newPage();
    page.on('console', (msg) => {
      if (msg.type() === 'error' || msg.type() === 'warning') console.log(`[page:${msg.type()}] ${msg.text()}`);
    });
    page.on('pageerror', (err) => console.log(`[page:exception] ${err.message}`));
    const url = new URL(job.path, base).href;
    await page.goto(url, { waitUntil: 'load' });
    const ready = await page
      .waitForFunction(() => window.__haystackReady === true, null, { timeout: 30_000 })
      .then(() => true)
      .catch(() => false);
    if (!ready) console.log(`[shot] avertissement : __haystackReady non signalé pour ${job.path}`);
    await page.waitForTimeout(Number(job.wait ?? 200));
    const out = resolve(String(job.out));
    mkdirSync(dirname(out), { recursive: true });
    await page.screenshot({ path: out, fullPage: Boolean(job.full) });
    console.log(`[shot] ${job.path} -> ${out}${ready ? '' : ' (non prêt)'}`);
    if (!ready) failures++;
    await context.close();
  }
} finally {
  await browser.close();
  await server.close();
}
process.exit(failures > 0 && jobs.length === 1 ? 1 : 0);
