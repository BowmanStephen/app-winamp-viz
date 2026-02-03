import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@core": path.resolve(__dirname, "./src/core"),
      "@visualizers": path.resolve(__dirname, "./src/visualizers"),
      "@themes": path.resolve(__dirname, "./src/themes"),
      "@audio": path.resolve(__dirname, "./src/audio"),
      "@ui": path.resolve(__dirname, "./src/ui"),
      "@utils": path.resolve(__dirname, "./src/utils"),
      "@types": path.resolve(__dirname, "./src/types"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@hooks": path.resolve(__dirname, "./src/hooks"),
      "@store": path.resolve(__dirname, "./src/store"),
    },
  },

  optimizeDeps: {
    include: ["three", "react", "react-dom", "zustand"],
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
          "vendor-three": ["three"],
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
