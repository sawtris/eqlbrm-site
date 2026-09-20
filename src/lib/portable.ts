import { toHTML, uriLooksSafe } from '@portabletext/to-html';
import { escapeHtml } from './format';
import { imageDims, imageSrcSet, imageUrl } from './sanityImage';

/** Turns a Sanity rich-text body into HTML. Text is escaped by the library; we only add images and safe links. */
export function renderBody(blocks: unknown[] = []): string {
  return toHTML(blocks as any, {
    components: {
      types: {
        image: ({ value }: any) => {
          const ref: string | undefined = value?.asset?._ref;
          if (!ref) return '';
          const { width, height } = imageDims(ref);
          const size = width && height ? ` width="${width}" height="${height}"` : '';
          const caption = value.caption ? `<figcaption>${escapeHtml(value.caption)}</figcaption>` : '';
          return (
            `<figure><img src="${escapeHtml(imageUrl(ref, { w: 1200 }))}" srcset="${escapeHtml(imageSrcSet(ref))}" ` +
            `sizes="(min-width: 800px) 720px, 100vw"${size} alt="${escapeHtml(value.alt ?? '')}" ` +
            `loading="lazy" decoding="async">${caption}</figure>`
          );
        },
      },
      marks: {
        link: ({ children, value }: any) => {
          const href: string = value?.href ?? '';
          if (!uriLooksSafe(href)) return children;
          const external = /^https?:\/\//i.test(href);
          return `<a href="${escapeHtml(href)}"${external ? ' target="_blank" rel="noopener"' : ''}>${children}</a>`;
        },
      },
    },
    onMissingComponent: false,
  });
}
