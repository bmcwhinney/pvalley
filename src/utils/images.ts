import type { ImageMetadata } from 'astro';

/**
 * Eagerly loads every processed image in src/assets/images so we can resolve
 * data-driven references (e.g. "/images/foo.webp" stored in site.json) to the
 * ImageMetadata that <Image>/<Picture> need for optimization.
 */
const modules = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/images/*.{webp,jpg,jpeg,png,avif}',
  { eager: true },
);

const byName = new Map<string, ImageMetadata>();
for (const [path, mod] of Object.entries(modules)) {
  const name = path.split('/').pop();
  if (name) byName.set(name, mod.default);
}

/** Resolve a "/images/foo.webp" (or bare "foo.webp") reference to ImageMetadata. */
export function img(ref: string): ImageMetadata {
  const name = ref.split('/').pop() ?? ref;
  const found = byName.get(name);
  if (!found) {
    throw new Error(`[img] "${ref}" not found in src/assets/images/`);
  }
  return found;
}

/**
 * Build a responsive `widths` list capped to the image's intrinsic width so we
 * never request upscaled variants (Astro would warn / skip those).
 */
export function widthsFor(meta: ImageMetadata, candidates: number[]): number[] {
  const capped = candidates.filter((w) => w < meta.width);
  capped.push(meta.width);
  return [...new Set(capped)].sort((a, b) => a - b);
}
