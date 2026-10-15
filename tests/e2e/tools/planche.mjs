// Planche contact des captures de cibles (relecture visuelle des réponses au zoom de jeu).
//
//   E2E_SHOTS=1 npx playwright test tests/e2e/04-toutes-les-enquetes.spec.ts   # remplit .shots/e2e/
//   node tests/e2e/tools/planche.mjs [.shots/e2e] [.shots/e2e-planche.jpg] [filtre]
//
// Chaque vignette (140 × 140 px CSS) est centrée sur le point tapé, avec le cadre de sélection
// blanc posé par l'interface ; la légende donne <enquête>-<étape>-<entité>.
import { chromium } from '@playwright/test';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2] ?? '.shots/e2e';
const out = process.argv[3] ?? '.shots/e2e-planche.jpg';
const filter = process.argv[4] ?? '';
const files = readdirSync(dir)
  .filter((f) => f.endsWith('.png') && f.includes(filter))
  .sort();
if (files.length === 0) {
  console.error(`Aucune capture dans ${dir} (lancer d'abord le test 04 avec E2E_SHOTS=1).`);
  process.exit(1);
}
const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
const cells = files
  .map(
    (f) =>
      `<figure><img src="data:image/png;base64,${readFileSync(join(dir, f)).toString('base64')}"><figcaption>${esc(f.replace(/\.png$/, ''))}</figcaption></figure>`,
  )
  .join('');
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
body{margin:0;background:#222;color:#eee;font:11px sans-serif;display:flex;flex-wrap:wrap;width:1316px}
figure{margin:3px;width:182px}img{width:182px;height:182px;display:block}figcaption{word-break:break-all;padding:2px 0}
</style></head><body>${cells}</body></html>`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1316, height: 800 } });
await page.setContent(html);
await page.screenshot({ path: out, fullPage: true, ...(out.endsWith('.jpg') ? { type: 'jpeg', quality: 82 } : {}) });
await browser.close();
console.log(`${files.length} vignettes → ${out}`);
