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
        statements: 90,
        branches: 82,
        functions: 92,
        lines: 94,
        "src/lib/**": {
          statements: 95,
          branches: 84,
          functions: 95,
          lines: 98,
        },
        "public/admin/**": {
          statements: 88,
          branches: 82,
          functions: 90,
          lines: 92,
        },
      },
    },
  },
});
