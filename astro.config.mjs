import { satteri } from "@astrojs/markdown-satteri";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";
import coverThumbnailDevPlugin from "./src/lib/dev-cover-thumbnail-plugin.mjs";
import createImagePerformancePlugin from "./src/lib/markdown/satteri-image-performance.mjs";

export default defineConfig({
  site: "https://blog.gis2all.top",
  integrations: [sitemap()],
  markdown: {
    processor: satteri({
      hastPlugins: [createImagePerformancePlugin()],
    }),
    shikiConfig: {
      theme: "github-dark",
      wrap: true,
    },
  },
  vite: {
    plugins: [coverThumbnailDevPlugin()],
  },
});
