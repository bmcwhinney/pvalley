#!/usr/bin/env node
/**
 * Recompress src/assets/images WebPs for mobile performance.
 * - Photos: long edge capped at 1400, WebP q72
 * - Square banners used as wide headers: center-cropped to 1600×900 (16:9)
 * - Overwrites in place (git history retains prior versions)
 */
import sharp from 'sharp';
import { readdir, stat, rename, unlink } from 'node:fs/promises';
import { join, basename } from 'node:path';

const ASSETS = new URL('../src/assets/images/', import.meta.url).pathname;
const PUBLIC = new URL('../public/images/', import.meta.url).pathname;

/** Square page banners that are displayed as wide headers (object-fit: cover). */
const BANNER_CROP = new Set([
  'about-banner.webp',
  'events-banner.webp',
  'gallery-banner.webp',
]);

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;

async function recompress(file, { maxLongEdge = 1400, quality = 72, crop16x9 = false } = {}) {
  const before = (await stat(file)).size;
  const meta = await sharp(file).metadata();
  const tmp = `${file}.tmp.webp`;

  let pipeline = sharp(file);

  if (crop16x9 && meta.width && meta.height) {
    // Center-crop to 16:9 then resize — drops wasted square pixels for headers.
    const targetW = Math.min(1600, meta.width);
    const targetH = Math.round(targetW * (9 / 16));
    pipeline = pipeline.resize(targetW, targetH, { fit: 'cover', position: 'centre' });
  } else if (meta.width && meta.height) {
    const long = Math.max(meta.width, meta.height);
    if (long > maxLongEdge) {
      if (meta.width >= meta.height) {
        pipeline = pipeline.resize({ width: maxLongEdge, withoutEnlargement: true });
      } else {
        pipeline = pipeline.resize({ height: maxLongEdge, withoutEnlargement: true });
      }
    }
  }

  await pipeline.webp({ quality, effort: 6 }).toFile(tmp);
  const after = (await stat(tmp)).size;

  if (after >= before * 0.98) {
    // Not worth replacing — keep original.
    await unlink(tmp);
    console.log(`  skip ${basename(file)}  ${kb(before)} (no gain)`);
    return { before, after: before, skipped: true };
  }

  await unlink(file);
  await rename(tmp, file);
  console.log(`  ${basename(file)}  ${kb(before)} → ${kb(after)}  (-${Math.round((1 - after / before) * 100)}%)`);
  return { before, after, skipped: false };
}

async function shrinkPublicPeacock() {
  const file = join(PUBLIC, 'peacock.webp');
  try {
    await stat(file);
  } catch {
    return;
  }
  const before = (await stat(file)).size;
  const tmp = `${file}.tmp.webp`;
  // Nav slot is ~120×80 — 240px wide is plenty for 2× DPR.
  await sharp(file).resize({ width: 240, withoutEnlargement: true }).webp({ quality: 70 }).toFile(tmp);
  const after = (await stat(tmp)).size;
  await unlink(file);
  await rename(tmp, file);
  console.log(`  public peacock.webp  ${kb(before)} → ${kb(after)}`);
}

async function run() {
  let totalBefore = 0;
  let totalAfter = 0;

  console.log('src/assets/images (WebP q72, banners → 16:9):');
  for (const name of (await readdir(ASSETS)).sort()) {
    if (!name.endsWith('.webp')) continue;
    const file = join(ASSETS, name);
    const { before, after } = await recompress(file, {
      maxLongEdge: 1400,
      quality: 72,
      crop16x9: BANNER_CROP.has(name),
    });
    totalBefore += before;
    totalAfter += after;
  }

  console.log('\npublic/images peacock (nav):');
  await shrinkPublicPeacock();

  // Also recompress duplicate public photos that aren't decor/OG.
  console.log('\npublic/images large photos:');
  for (const name of ['pvalley.webp', 'pval44.webp', 'jazzandarts.webp']) {
    const file = join(PUBLIC, name);
    try {
      await stat(file);
    } catch {
      continue;
    }
    const { before, after } = await recompress(file, { maxLongEdge: 1400, quality: 72 });
    totalBefore += before;
    totalAfter += after;
  }

  console.log(`\nTotal: ${kb(totalBefore)} → ${kb(totalAfter)}  (saved ${kb(totalBefore - totalAfter)})`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
