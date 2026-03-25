import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'es2020',
    minify: 'terser',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          engine: ['./src/engine/game-engine.ts', './src/engine/rules.ts'],
          board: ['./src/board/hex-grid.ts', './src/board/hex-renderer.ts'],
        },
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
