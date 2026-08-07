import { access, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const root = fileURLToPath(new URL("../", import.meta.url));

const expectedProjects = [
  {
    id: "xdata-collector",
    order: 1,
    repoUrl: "https://github.com/gis2all/xdata-collector",
    tech: ["TypeScript", "Python", "Electron"],
  },
  {
    id: "focus-flow",
    order: 2,
    repoUrl: "https://github.com/gis2all/focus-flow",
    tech: ["TypeScript", "Electron", "React"],
  },
  {
    id: "tech-blog",
    order: 3,
    repoUrl: "https://github.com/gis2all/tech-blog",
    tech: ["Astro", "TypeScript", "CSS"],
  },
];

describe("projects page", () => {
  test("publishes the three ordered gis2all projects with local images", async () => {
    const records = await Promise.all(
      expectedProjects.map(async (project) => ({
        id: project.id,
        data: JSON.parse(
          await readFile(`${root}src/content/projects/${project.id}.json`, "utf8"),
        ),
      })),
    );

    expect(
      records.map(({ id, data }) => ({
        id,
        order: data.order,
        repoUrl: data.repoUrl,
        tech: data.tech,
      })),
    ).toEqual(expectedProjects);

    for (const { data } of records) {
      expect(data.image).toMatch(/^\/images\/projects\/.+\.webp$/);
      expect(data.imageAlt).toBeTruthy();
      await expect(access(`${root}public${data.image}`)).resolves.toBeUndefined();
    }
  });

  test("renders linked screenshot cards with a responsive 16:9 layout", async () => {
    const [page, css] = await Promise.all([
      readFile(`${root}src/pages/projects.astro`, "utf8"),
      readFile(`${root}src/styles/global.css`, "utf8"),
    ]);

    expect(page).toContain("<p>我的开源项目与工程实践</p>");
    expect(page).toContain('class="project-card-media"');
    expect(page).toContain('class="project-card-title"');
    expect(page).toContain('class="button project-card-repo"');
    expect(page).toContain('loading="lazy"');
    expect(css).toMatch(
      /\.project-grid\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/s,
    );
    expect(css).toMatch(/\.project-card-media\s*\{[^}]*aspect-ratio:\s*16\s*\/\s*9/s);
    expect(css).toMatch(
      /\.project-card-media img\s*\{[^}]*object-fit:\s*cover[^}]*object-position:\s*top center/s,
    );
    expect(css).toMatch(
      /@media\s*\(max-width:\s*900px\)[\s\S]*?\.project-grid\s*\{[^}]*grid-template-columns:\s*1fr/s,
    );
  });
});
