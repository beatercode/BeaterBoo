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
    // Utilizziamo esbuild per la minificazione per performance migliori
    minify: 'esbuild',
    // Altre opzioni di build
    sourcemap: false,
    // Target moderno per bundle più piccoli
    target: 'esnext',
    // Disabilitiamo il code splitting CSS per aumentare la performance
    cssCodeSplit: false,
    // Riduciamo la dimensione dei chunk
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: undefined,
        inlineDynamicImports: true
      }
    }
  },
  // Resolve path aliases
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
