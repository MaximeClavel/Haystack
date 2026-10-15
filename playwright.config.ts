import { defineConfig, devices } from '@playwright/test';

// Tests de bout en bout sur un téléphone émulé (Chromium, préinstallé dans /opt/pw-browsers).
// Voir tests/e2e/README.md. Les tests partagent un seul serveur Vite et tournent l'un après
// l'autre (la carte est gourmande en CPU : en parallèle, les délais deviendraient instables).
// Port du serveur Vite : E2E_PORT permet de lancer plusieurs suites en même temps sans collision.
const PORT = Number(process.env.E2E_PORT ?? 5179);

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  // Marge pour une machine chargée (rendu des tuiles en logiciel, sans GPU).
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: { baseURL: `http://localhost:${PORT}/`, trace: 'retain-on-failure' },
  projects: [{ name: 'mobile', use: { ...devices['Pixel 7'] } }],
  webServer: {
    command: `npx vite --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
