import { defineConfig } from 'vitest/config';
import preact from '@preact/preset-vite';

// base relative : le site fonctionne aussi bien à la racine qu'à /Haystack/ (GitHub Pages).
export default defineConfig({
  base: './',
  plugins: [preact()],
  server: { host: true },
  build: { target: 'es2022', sourcemap: true },
  test: {
    include: ['src/**/*.test.ts', 'tests/unit/**/*.test.ts'],
    environment: 'node',
    passWithNoTests: true,
  },
});
