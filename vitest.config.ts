import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "happy-dom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts"],
    exclude: ["tests/e2e/**", "node_modules/**"],

    // Coverage settings
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "tests/", "**/*.d.ts", "**/*.config.ts"],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },

    // Test timeout
    testTimeout: 10000,

    // Reporter
    reporter: ["verbose"],

    // TypeScript
    typecheck: {
      enabled: true,
      tsconfig: "./tsconfig.json",
    },
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@core": path.resolve(__dirname, "./src/core"),
      "@visualizers": path.resolve(__dirname, "./src/visualizers"),
      "@themes": path.resolve(__dirname, "./src/themes"),
      "@audio": path.resolve(__dirname, "./src/audio"),
      "@utils": path.resolve(__dirname, "./src/utils"),
    },
  },

  // ESBuild for TypeScript
  esbuild: {
    target: "es2020",
  },
});
