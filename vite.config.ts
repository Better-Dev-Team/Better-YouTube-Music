import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: false, // Don't empty, we have main process files there
    rollupOptions: {
      input: {
        settings: resolve(__dirname, 'settings.html')
      }
    }
  },
  server: {
    port: 5173
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
});

