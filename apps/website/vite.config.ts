import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

/**
 * Serves and emits pdf.js module worker with a standard `.js` extension (`/pdf.worker.min.js`)
 * so reverse proxies and web servers that lack an `.mjs` MIME mapping serve it as
 * `application/javascript` instead of blocking dynamic ES module worker imports.
 */
function pdfWorkerJsPlugin(): Plugin {
  const workerPath = require.resolve('pdfjs-dist/build/pdf.worker.min.mjs');

  return {
    name: 'pdf-worker-js',
    configureServer(server) {
      server.middlewares.use('/pdf.worker.min.js', (_req, res, next) => {
        try {
          const content = fs.readFileSync(workerPath);
          res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
          res.end(content);
        } catch (err) {
          next(err);
        }
      });
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'pdf.worker.min.js',
        source: fs.readFileSync(workerPath),
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), pdfWorkerJsPlugin()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@digital-library/types': path.resolve(__dirname, '../../packages/types/src'),
      '@digital-library/ui': path.resolve(__dirname, '../../packages/ui/src'),
      '@digital-library/utils': path.resolve(__dirname, '../../packages/utils/src'),
    },
  },
});
