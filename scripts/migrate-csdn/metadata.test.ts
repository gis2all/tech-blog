import { describe, expect, it } from "vitest";

import { buildMetadata, createSlug } from "./metadata.js";
import type { MetadataInput } from "./model.js";

const semanticMarkdown = `# Ignored heading

Jenkins Pipeline automation makes repeatable delivery easier for the whole team. It also keeps CI feedback close to every change.

\`\`\`groovy
pipeline { agent any }
\`\`\`

![Ignored diagram](https://example.com/diagram.png)
`;

function article(overrides: Partial<MetadataInput> = {}): MetadataInput {
  return {
    articleId: "119208326",
    title: "Jenkins Groovy Practices",
    publishedAt: "2021-08-01",
    columns: ["Jenkins", "DevOps"],
    keywords: ["Jenkins, DevOps", "Groovy", "CI/CD, Pipeline", "Script, Docker"],
    markdown: semanticMarkdown,
    ...overrides,
  };
}

describe("buildMetadata", () => {
  it("uses category priority and rejects unmapped columns", () => {
    expect(buildMetadata(article({ columns: ["Coding", "GIS", "Books"] })).frontmatter.category).toBe("GIS");
    expect(buildMetadata(article({ columns: [], keywords: ["Jenkins, permissions"] })).frontmatter.category).toBe("DevOps");
    expect(() => buildMetadata(article({ columns: ["Photography"] }))).toThrow(/manual review/i);
  });

  it("normalizes aliases while preserving tag order and limiting tags", () => {
    expect(buildMetadata(article()).frontmatter.tags).toEqual([
      "Jenkins",
      "DevOps",
      "Groovy",
      "CI/CD",
      "Pipeline",
      "Script",
    ]);
  });

  it("deduplicates equivalent aliases after normalization", () => {
    const result = buildMetadata(article({
      columns: ["Jenkins"],
      keywords: ["JENKINS, Dev Ops", "devops", "CICD, CI/CD", "VSCode, vs code", "Python"],
    }));

    expect(result.frontmatter.tags).toEqual(["Jenkins", "DevOps", "CI/CD", "VS Code", "Python"]);
  });

  it("extracts a 60-120 character description without headings or code", () => {
    const description = buildMetadata(article()).frontmatter.description;

    expect(description.length).toBeGreaterThanOrEqual(60);
    expect(description.length).toBeLessThanOrEqual(120);
    expect(description).not.toContain("Ignored heading");
    expect(description).not.toContain("pipeline {");
    expect(buildMetadata(article({ markdown: "Short but genuine prose." })).frontmatter.description)
      .toBe("Short but genuine prose.");
  });

  it.each([
    ["a tilde-fenced code block", `~~~typescript\n${"const hidden = 'code'; ".repeat(4)}\n~~~`],
    ["an indented backtick-fenced code block", `   \`\`\`typescript\n${"const hidden = 'code'; ".repeat(4)}\n   \`\`\``],
    ["an image with long alt text", `![${"Diagram label that is not prose ".repeat(3)}](https://example.com/diagram.png)`],
  ])("rejects %s as a description", (_label, markdown) => {
    expect(() => buildMetadata(article({ markdown }))).toThrow(/60/i);
  });

  it.each([
    ["a four-backtick fence with an embedded three-backtick line", `\`\`\`\`typescript\n${"const hidden = 'code'; ".repeat(3)}\n\`\`\`\n${"const trailing = 'code'; ".repeat(3)}\n\`\`\`\``],
    ["a four-tilde fence with an embedded three-tilde line", `~~~~typescript\n${"const hidden = 'code'; ".repeat(3)}\n~~~\n${"const trailing = 'code'; ".repeat(3)}\n~~~~`],
    ["an unterminated fence", `\`\`\`typescript\n${"const hidden = 'code'; ".repeat(6)}`],
  ])("does not extract %s", (_label, markdown) => {
    expect(() => buildMetadata(article({ markdown }))).toThrow(/60/i);
  });

  it("truncates descriptions by Unicode code points", () => {
    const description = buildMetadata(article({ markdown: `${"a".repeat(119)}😀more prose that exceeds the extraction limit` })).frontmatter.description;

    expect(description.isWellFormed()).toBe(true);
    expect(Array.from(description).length).toBeLessThanOrEqual(120);
  });

  it("uses pilot metadata defaults without source fields", () => {
    const result = buildMetadata(article({ updatedAt: "2021-08-02", cover: "/cover.webp", coverAlt: "Cover" }));

    expect(result).toEqual({
      slug: "jenkins-groovy-practices",
      frontmatter: {
        title: "Jenkins Groovy Practices",
        description: result.frontmatter.description,
        publishedAt: "2021-08-01",
        updatedAt: "2021-08-02",
        category: "DevOps",
        tags: ["Jenkins", "DevOps", "Groovy", "CI/CD", "Pipeline", "Script"],
        cover: "/cover.webp",
        coverAlt: "Cover",
        draft: true,
        featured: false,
      },
    });
    expect(result.frontmatter).not.toHaveProperty("sourceUrl");
    expect(result.frontmatter).not.toHaveProperty("sourcePlatform");
    expect(result.frontmatter).not.toHaveProperty("migrationNotice");
  });
});

describe("createSlug", () => {
  it("creates deterministic pinyin slugs and prefixes Windows reserved names", () => {
    expect(createSlug("2", "测试文章")).toBe("ce-shi-wen-zhang");
    expect(createSlug("3", "CON")).toBe("post-con");
    expect(createSlug("2", "测试文章")).toBe("ce-shi-wen-zhang");
  });
});
