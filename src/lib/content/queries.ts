import { getCollection, type CollectionEntry } from "astro:content";
import { getPublicPosts, sortPostsByDate } from "./posts";

export type PostEntry = CollectionEntry<"posts">;
export type SeriesEntry = CollectionEntry<"series">;
export type ProjectEntry = CollectionEntry<"projects">;

export async function getAllPosts(): Promise<PostEntry[]> {
  const posts = await getCollection("posts");
  return getPublicPosts(posts);
}

export async function getAllPostsIncludingDrafts(): Promise<PostEntry[]> {
  const posts = await getCollection("posts");
  return sortPostsByDate(posts);
}

export async function getAllSeries(): Promise<SeriesEntry[]> {
  const entries = await getCollection("series");
  return entries
    .filter((entry) => !entry.data.draft)
    .sort((a, b) => (a.data.order ?? 999) - (b.data.order ?? 999));
}

export async function getAllProjects(): Promise<ProjectEntry[]> {
  const entries = await getCollection("projects");
  return entries
    .filter((entry) => !entry.data.draft)
    .sort((a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime());
}
