import { describe, expect, test } from "vitest";
import { getPublicProjects } from "./projects";

const projects = [
  { id: "unordered", data: { draft: false } },
  { id: "second", data: { draft: false, order: 2 } },
  { id: "draft", data: { draft: true, order: 0 } },
  { id: "first", data: { draft: false, order: 1 } },
];

describe("project helpers", () => {
  test("getPublicProjects filters drafts and sorts explicit order first", () => {
    expect(getPublicProjects(projects).map((project) => project.id)).toEqual([
      "first",
      "second",
      "unordered",
    ]);
    expect(projects.map((project) => project.id)).toEqual([
      "unordered",
      "second",
      "draft",
      "first",
    ]);
  });

  test("getPublicProjects treats missing and zero order consistently", () => {
    const unordered = [
      { id: "a", data: {} },
      { id: "b", data: { order: 0 } },
    ];
    expect(getPublicProjects(unordered).map((project) => project.id)).toEqual(["b", "a"]);
  });
});
