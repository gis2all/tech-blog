import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { satteri } from "@astrojs/markdown-satteri";
import createImagePerformancePlugin from "./src/lib/markdown/satteri-image-performance.mjs";

export default defineConfig({
  site: "https://gis2all-blog.netlify.app",
  integrations: [sitemap()],
  markdown: {
    processor: satteri({
      hastPlugins: [createImagePerformancePlugin()]
    }),
    shikiConfig: {
      theme: "github-dark",
      wrap: true
    }
  }
});
