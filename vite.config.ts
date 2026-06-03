/// <reference types="vitest" />
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    // Wunsch-Port 3000. strictPort: false → ist 3000 belegt, sucht Vite
    // automatisch den nächsten freien Port (3001, 3002, ...).
    port: 3000,
    strictPort: false,
  },
  build: {
    target: 'es2022',
    sourcemap: true,
  },
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
  },
});
