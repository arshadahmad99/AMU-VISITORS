import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        timeout: 300000,
        proxyTimeout: 300000,
      },
    },
  },
  resolve: {
    alias: {
      '@digital-library/types': path.resolve(__dirname, '../../packages/types/src'),
      '@digital-library/utils': path.resolve(__dirname, '../../packages/utils/src'),
    },
  },
});
