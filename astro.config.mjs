import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.paradisevalleydominica.com',
  compressHTML: true,
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
  experimental: {
    clientPrerender: true,
  },
  build: {
    inlineStylesheets: 'always',
  },
});
