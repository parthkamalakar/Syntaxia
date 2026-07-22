import { defineConfig } from 'vite';

export default defineConfig({
  server: { port: 5173 },
  build: { outDir: 'dist', target: 'es2020' },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
  },
});
