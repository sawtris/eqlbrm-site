import { createClient } from '@sanity/client';
import { SANITY } from '../config';

const client = createClient({
  projectId: SANITY.projectId,
  dataset: SANITY.dataset,
  apiVersion: SANITY.apiVersion,
  useCdn: false, // builds always want fresh content
});

export interface CoverImage {
  alt?: string;
  asset?: { _ref: string };
  hotspot?: { x: number; y: number; width: number; height: number };
}

export interface Post {
  _id: string;
  title: string;
  slug: string;
  publishedAt: string;
  excerpt?: string;
  seoTitle?: string;
  seoDescription?: string;
  coverImage?: CoverImage;
  body?: unknown[];
}

// Future-dated posts stay hidden until the first rebuild after their date.
const QUERY = `*[_type == "post" && defined(slug.current) && publishedAt <= now()] | order(publishedAt desc){
  _id, title, "slug": slug.current, publishedAt, excerpt, seoTitle, seoDescription, coverImage, body
}`;

let cache: Promise<Post[]> | undefined;

/**
 * All published posts, fetched once per build.
 * If Sanity can't be reached, the build fails on purpose so the live site stays as it was
 * instead of publishing an empty blog. (Set SKIP_SANITY=1 to build without a connection.)
 */
export function getPosts(): Promise<Post[]> {
  if (process.env.SKIP_SANITY === '1') return Promise.resolve([]);
  cache ??= client.fetch<Post[]>(QUERY);
  return cache;
}
