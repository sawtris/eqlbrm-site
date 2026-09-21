import { SANITY } from '../config';

// Sanity image references look like: image-<hash>-<width>x<height>-<ext>
const REF = /^image-([a-zA-Z0-9]+)-(\d+)x(\d+)-([a-z]+)$/;

export function imageDims(ref: string): { width: number; height: number } {
  const m = REF.exec(ref);
  return m ? { width: Number(m[2]), height: Number(m[3]) } : { width: 0, height: 0 };
}

export interface Focal {
  x: number;
  y: number;
}

/** Focal point picked in the Studio (the image hotspot), if any. */
export function focalOf(image?: { hotspot?: { x: number; y: number } }): Focal | undefined {
  return image?.hotspot ? { x: image.hotspot.x, y: image.hotspot.y } : undefined;
}

export function imageUrl(ref: string, opts: { w?: number; h?: number; q?: number; focal?: Focal } = {}): string {
  const m = REF.exec(ref);
  if (!m) return '';
  const [, id, w, h, ext] = m;
  const params = new URLSearchParams({ auto: 'format', q: String(opts.q ?? 80) });
  if (opts.w) params.set('w', String(opts.w));
  if (opts.h) params.set('h', String(opts.h));
  if (opts.w && opts.h) {
    params.set('fit', 'crop');
    if (opts.focal) {
      params.set('crop', 'focalpoint');
      params.set('fp-x', String(opts.focal.x));
      params.set('fp-y', String(opts.focal.y));
    }
  }
  return `https://cdn.sanity.io/images/${SANITY.projectId}/${SANITY.dataset}/${id}-${w}x${h}.${ext}?${params}`;
}

export function imageSrcSet(ref: string, widths = [480, 800, 1200, 1600]): string {
  const { width } = imageDims(ref);
  return widths
    .filter((w) => !width || w <= width)
    .map((w) => `${imageUrl(ref, { w })} ${w}w`)
    .join(', ');
}

/** srcset for images cropped to a fixed shape (ratio = width / height), centered on the focal point. */
export function imageSrcSetCrop(ref: string, widths: number[], ratio: number, focal?: Focal): string {
  const { width } = imageDims(ref);
  return widths
    .filter((w) => !width || w <= width)
    .map((w) => `${imageUrl(ref, { w, h: Math.round(w / ratio), focal })} ${w}w`)
    .join(', ');
}
