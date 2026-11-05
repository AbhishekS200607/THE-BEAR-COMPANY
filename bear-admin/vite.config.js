import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: '/admin/',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5174,
    open: true,
  },
});
