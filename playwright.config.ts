import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./test/e2e",
  fullyParallel: true,
  timeout: 60000,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4321",
    channel: "chromium",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "site",
      testIgnore: "**/admin/**",
    },
    {
      name: "admin",
      testMatch: "**/admin/**",
      fullyParallel: false,
      workers: 1,
      // Run after the site project: the admin tests create/remove content
      // files, which makes the shared Astro dev server reload. Running the
      // two projects concurrently could reload a page mid axe-scan.
      dependencies: ["site"],
    },
  ],
  webServer: [
    {
      command: "npm run dev -- --host 127.0.0.1 --port 4321",
      url: "http://127.0.0.1:4321",
      reuseExistingServer: true,
    },
    {
      command: "npm run cms:local",
      url: "http://127.0.0.1:4322/",
      reuseExistingServer: true,
    },
  ],
});
