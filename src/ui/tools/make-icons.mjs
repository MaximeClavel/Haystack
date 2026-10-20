#!/usr/bin/env node
// Génère les icônes PNG de la PWA à partir de public/icon.svg (rendu par Chromium via Playwright).
// Usage : node src/ui/tools/make-icons.mjs
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..', '..', '..');
const svg = readFileSync(resolve(root, 'public/icon.svg'), 'utf8');
const sizes = [
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['apple-touch-icon.png', 180],
];
const browser = await chromium.launch();
try {
  for (const [name, size] of sizes) {
    const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
    await page.setContent(
      `<!doctype html><html><body style="margin:0;background:#2b2622">` +
        `<img src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}" width="${size}" height="${size}" style="display:block">` +
        `</body></html>`,
    );
    await page.waitForFunction(() => document.images[0]?.complete);
    await page.screenshot({ path: resolve(root, 'public', name), omitBackground: false });
    await page.close();
    console.log(`[icônes] public/${name} (${size} px)`);
  }
} finally {
  await browser.close();
}
