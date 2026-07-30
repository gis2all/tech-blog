type ProjectLike = {
  data: {
    draft?: boolean;
    order?: number;
  };
};

export function getPublicProjects<T extends ProjectLike>(projects: readonly T[]): T[] {
  return projects
    .filter((project) => !project.data.draft)
    .sort(
      (a, b) =>
        (a.data.order ?? Number.MAX_SAFE_INTEGER) -
        (b.data.order ?? Number.MAX_SAFE_INTEGER),
    );
}
