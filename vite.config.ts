import { defineConfig } from 'vite';
import { existsSync } from 'node:fs';
export default defineConfig(({ mode }) => {
  if (mode === 'static' && !existsSync('public/notebook.json'))
    throw new Error('Run npm run export:static before building the static site.');
  return {
    define: { 'import.meta.env.VITE_STATIC_SITE': JSON.stringify(mode === 'static') },
    server: {
      host: '127.0.0.1',
      port: 5173,
      strictPort: true,
      proxy: { '/api': { target: 'http://127.0.0.1:3001', changeOrigin: false } },
      watch: { usePolling: true },
    },
    build: { target: 'es2022' },
  };
});
