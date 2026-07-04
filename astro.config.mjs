import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.paradisevalleydominica.com',
  compressHTML: true,
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
  build: {
    inlineStylesheets: 'always',
  },
});
