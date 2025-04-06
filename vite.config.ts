import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: true,
  },
  build: {
    // Disable chunk splitting to avoid Rollup issues
    rollupOptions: {
      output: {
        manualChunks: undefined,
        inlineDynamicImports: true
      }
    },
    // Use esbuild for minification instead of terser
    minify: 'esbuild',
    // Other build options
    sourcemap: false,
    // Reduce the number of Rollup operations
    target: 'esnext',
    cssCodeSplit: false
  },
  // Resolve path aliases
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
