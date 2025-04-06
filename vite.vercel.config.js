// vite.vercel.config.js - Special configuration for Vercel deployment
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Disable Rollup completely
  build: {
    // Use esbuild directly instead of Rollup
    minify: 'esbuild',
    rollupOptions: undefined,
    // Other build options
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    cssCodeSplit: false,
    chunkSizeWarningLimit: 1000,
  },
  // Resolve path aliases
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
