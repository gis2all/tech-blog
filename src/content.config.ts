import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const referenceSchema = z.object({
  title: z.string(),
  url: z.url()
});

const changelogSchema = z.object({
  date: z.coerce.date(),
  note: z.string()
});

const posts = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/posts" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    category: z.string(),
    tags: z.array(z.string()).default([]),
    cover: z.string().optional(),
    coverAlt: z.string().optional(),
    draft: z.boolean().default(false),
    featured: z.boolean().default(false),
    series: z.string().optional(),
    seriesOrder: z.number().int().positive().optional(),
    repoUrl: z.url().optional(),
    references: z.array(referenceSchema).default([]),
    changelog: z.array(changelogSchema).default([])
  })
});

const series = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/series" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    slug: z.string(),
    image: z.string(),
    imageAlt: z.string(),
    order: z.number().int().positive().optional(),
    draft: z.boolean().default(false)
  })
});

const projects = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/projects" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    url: z.url().optional(),
    repoUrl: z.url().optional(),
    tech: z.array(z.string()),
    image: z.string(),
    imageAlt: z.string(),
    order: z.number().int().positive(),
    featured: z.boolean().default(false),
    publishedAt: z.coerce.date(),
    draft: z.boolean().default(false)
  })
});

export const collections = { posts, series, projects };
