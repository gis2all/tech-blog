import rss from "@astrojs/rss";
import { getAllPosts } from "../lib/content/queries";
import { getPostSlug } from "../lib/content/posts";
import { site } from "../lib/site";

export async function GET(context: { site?: URL }) {
  const posts = await getAllPosts();

  return rss({
    title: site.title,
    description: site.description,
    site: context.site?.toString() ?? site.url,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.publishedAt,
      link: `/posts/${getPostSlug(post)}/`
    }))
  });
}
