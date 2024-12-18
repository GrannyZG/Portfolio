import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Osigurava relativne putanje za GitHub Pages
  build: {
    outDir: 'dist', // Produkcijski build ide u 'dist'
  }
});