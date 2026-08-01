import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
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
