import { defineConfig, devices } from '@playwright/test';

// Tests de bout en bout sur un téléphone émulé (Chromium, préinstallé dans /opt/pw-browsers).
// Voir tests/e2e/README.md. Les tests partagent un seul serveur Vite et tournent l'un après
// l'autre (la carte est gourmande en CPU : en parallèle, les délais deviendraient instables).
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  // Marge pour une machine chargée (rendu des tuiles en logiciel, sans GPU).
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:5179/', trace: 'retain-on-failure' },
  projects: [{ name: 'mobile', use: { ...devices['Pixel 7'] } }],
  webServer: {
    command: 'npx vite --port 5179 --strictPort',
    url: 'http://localhost:5179/',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
