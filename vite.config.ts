import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@core": path.resolve(__dirname, "./src/core"),
      "@themes": path.resolve(__dirname, "./src/themes"),
      "@ui": path.resolve(__dirname, "./src/ui"),
      "@utils": path.resolve(__dirname, "./src/utils"),
      "@types": path.resolve(__dirname, "./src/types"),
      "@components": path.resolve(__dirname, "./src/components"),
    },
  },

  optimizeDeps: {
    include: ["react", "react-dom", "zustand"],
    exclude: [],
  },

  build: {
    target: "es2020",
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom"],
          "vendor-radix": ["@radix-ui/react-slider", "@radix-ui/react-select"],
          "vendor-state": ["zustand"],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },

  server: {
    port: 3000,
    host: true,
    open: true,
  },

  preview: {
    port: 4173,
  },

  esbuild: {
    target: "es2020",
  },
});
