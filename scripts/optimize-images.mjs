#!/usr/bin/env node
/**
 * One-off (re-runnable) image optimizer for public/images.
 *
 * - Decor PNGs: displayed as small faint accents (~160px, 12% opacity) but
 *   authored at 688px. Resized to 400px and converted to WebP (with alpha).
 * - Photo JPGs: converted to WebP, capped at 1600px on the long edge.
 * - Skipped: logo.png (crisp UI mark) and pvsocialshare.png (OG image kept as
 *   PNG for social-scraper compatibility).
 *
 * Originals are removed after successful conversion; git history retains them.
 */
import sharp from 'sharp';
import { readdir, stat, unlink } from 'node:fs/promises';
import { join, extname, basename } from 'node:path';

const IMAGES_DIR = new URL('../public/images/', import.meta.url).pathname;
const DECOR_DIR = join(IMAGES_DIR, 'decor');
const KEEP = new Set(['logo.png', 'pvsocialshare.png']);

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;

async function convert(file, { maxWidth, quality }) {
  const before = (await stat(file)).size;
  const out = file.replace(/\.(jpe?g|png)$/i, '.webp');
  await sharp(file)
    .resize({ width: maxWidth, withoutEnlargement: true })
    .webp({ quality })
    .toFile(out);
  const after = (await stat(out)).size;
  await unlink(file);
  console.log(`  ${basename(file)} → ${basename(out)}  ${kb(before)} → ${kb(after)}  (-${Math.round((1 - after / before) * 100)}%)`);
  return { before, after };
}

async function run() {
  let totalBefore = 0;
  let totalAfter = 0;

  console.log('Decor PNGs (resize 400px, WebP q80):');
  for (const name of await readdir(DECOR_DIR)) {
    if (extname(name).toLowerCase() !== '.png') continue;
    const { before, after } = await convert(join(DECOR_DIR, name), { maxWidth: 400, quality: 80 });
    totalBefore += before;
    totalAfter += after;
  }

  console.log('\nPhoto JPGs (cap 1600px, WebP q82):');
  for (const name of await readdir(IMAGES_DIR)) {
    if (KEEP.has(name)) continue;
    if (extname(name).toLowerCase() !== '.jpg' && extname(name).toLowerCase() !== '.jpeg') continue;
    const { before, after } = await convert(join(IMAGES_DIR, name), { maxWidth: 1600, quality: 82 });
    totalBefore += before;
    totalAfter += after;
  }

  console.log(`\nTotal: ${kb(totalBefore)} → ${kb(totalAfter)}  (saved ${kb(totalBefore - totalAfter)}, -${Math.round((1 - totalAfter / totalBefore) * 100)}%)`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
