import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: {
        main: resolve(__dirname, 'src/main/index.ts'),
        preload: resolve(__dirname, 'src/preload/index.ts')
      },
      formats: ['cjs']
    },
    rollupOptions: {
      external: ['electron'],
      output: {
        entryFileNames: '[name]/index.js'
      }
    },
    outDir: 'dist',
    emptyOutDir: true
  }
});

