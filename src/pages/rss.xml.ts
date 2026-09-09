import rss from "@astrojs/rss";
import { getPostDescription, getPostSlug } from "../lib/content/posts";
import { getAllPosts } from "../lib/content/queries";
import { site } from "../lib/site";

export async function GET(context: { site?: URL }) {
  const posts = await getAllPosts();

  return rss({
    title: site.title,
    description: site.description,
    site: context.site?.toString() ?? site.url,
    items: posts.map((post) => ({
      title: post.data.title,
      description: getPostDescription(post),
      pubDate: post.data.publishedAt,
      link: `/posts/${getPostSlug(post)}/`,
    })),
  });
}
