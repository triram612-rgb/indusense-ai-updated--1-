import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import path from 'path';

/**
 * Standalone preview build: everything inlined into one HTML file, hash
 * routing so deep links work without server rewrites. Used for the hosted
 * demo; `npm run build` remains the normal deployable build.
 */
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  define: { 'import.meta.env.VITE_HASH_ROUTER': JSON.stringify('1') },
  build: {
    outDir: 'dist-preview',
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
});
