import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPosts } from '../lib/sanity';
import { SITE } from '../config';

export async function GET(context: APIContext) {
  const posts = await getPosts();
  return rss({
    title: `${SITE.legalName} blog`,
    description: 'Practical thinking on strategy, operations, and growth.',
    site: context.site ?? SITE.url,
    items: posts.map((post) => ({
      title: post.title,
      pubDate: new Date(post.publishedAt),
      description: post.excerpt ?? '',
      link: `/blog/${post.slug}`,
    })),
    trailingSlash: false,
    customData: '<language>en-us</language>',
  });
}
