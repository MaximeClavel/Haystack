import { defineConfig, devices } from '@playwright/test';

// Tests de bout en bout sur un téléphone émulé (Chromium, préinstallé dans /opt/pw-browsers).
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
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
