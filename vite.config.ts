import { defineConfig } from 'vite';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const pages = ['index', 'quiz', 'result', 'method', 'credits'];
const input: Record<string, string> = {};
for (const p of pages) {
  const f = resolve(__dirname, `${p}.html`);
  if (existsSync(f)) input[p] = f;
}

export default defineConfig({
  base: './',
  build: { rollupOptions: { input } },
  test: { include: ['src/**/*.test.ts'] },
});
