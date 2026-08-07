import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: [
      ...configDefaults.exclude,
      "test/e2e/**",
      ".worktrees/**",
      ".codex-temp/**",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      include: [
        "src/lib/**/*.{ts,tsx}",
        "public/admin/*-domain.js",
        "public/admin/editorial-workflow.js",
        "public/admin/tag-operations.js",
      ],
      exclude: ["src/lib/content/queries.ts", "src/lib/**/*.test.ts", ".worktrees/**"],
      thresholds: {
        statements: 75,
        branches: 72,
        functions: 80,
        lines: 75,
        "src/lib/**": {
          statements: 85,
          branches: 85,
          functions: 85,
          lines: 85,
        },
        "public/admin/**": {
          statements: 70,
          branches: 70,
          functions: 75,
          lines: 70,
        },
      },
    },
  },
});
