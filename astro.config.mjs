import { defineConfig } from 'astro/config';

import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.paradisevalleydominica.com',
  compressHTML: true,

  // Hover-only prefetch — viewport prefetchAll contended with LCP on mobile.
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'hover',
  },

  build: {
    inlineStylesheets: 'always',
  },

  image: {
    // Slightly lower default quality for smaller AVIF/WebP derivatives.
    service: {
      entrypoint: 'astro/assets/services/sharp',
      config: {
        limitInputPixels: false,
      },
    },
  },

  integrations: [sitemap()],
});
