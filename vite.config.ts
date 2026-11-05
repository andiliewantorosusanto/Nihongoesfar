import { defineConfig } from 'vite';
import { existsSync } from 'node:fs';
import { grammarAuthoring } from './scripts/content/vite-grammar.ts';
export default defineConfig(() => {
  if (!existsSync('public/notebook.json'))
    throw new Error('Missing public/notebook.json library manifest.');
  return {
    plugins: [grammarAuthoring()],
    server: {
      host: '127.0.0.1',
      port: 5173,
      strictPort: true,
      watch: { usePolling: true },
    },
    build: { target: 'es2022' },
  };
});
