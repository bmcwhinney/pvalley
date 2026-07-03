import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.paradisevalleydominica.com',
  compressHTML: true,
  build: {
    inlineStylesheets: 'auto',
  },
});
