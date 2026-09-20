import { SANITY } from '../config';

// Sanity image references look like: image-<hash>-<width>x<height>-<ext>
const REF = /^image-([a-zA-Z0-9]+)-(\d+)x(\d+)-([a-z]+)$/;

export function imageDims(ref: string): { width: number; height: number } {
  const m = REF.exec(ref);
  return m ? { width: Number(m[2]), height: Number(m[3]) } : { width: 0, height: 0 };
}

export function imageUrl(ref: string, opts: { w?: number; h?: number; q?: number } = {}): string {
  const m = REF.exec(ref);
  if (!m) return '';
  const [, id, w, h, ext] = m;
  const params = new URLSearchParams({ auto: 'format', q: String(opts.q ?? 80) });
  if (opts.w) params.set('w', String(opts.w));
  if (opts.h) params.set('h', String(opts.h));
  if (opts.w && opts.h) params.set('fit', 'crop');
  return `https://cdn.sanity.io/images/${SANITY.projectId}/${SANITY.dataset}/${id}-${w}x${h}.${ext}?${params}`;
}

export function imageSrcSet(ref: string, widths = [480, 800, 1200, 1600]): string {
  const { width } = imageDims(ref);
  return widths
    .filter((w) => !width || w <= width)
    .map((w) => `${imageUrl(ref, { w })} ${w}w`)
    .join(', ');
}
