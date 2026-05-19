// Astro build configuration: static output for Cloudflare Pages deployment.
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // TODO Phase 22: change to 'https://meowtoon.com' after custom domain is confirmed.
  site: 'https://studio-meowtoon.pages.dev',
  output: 'static',
  trailingSlash: 'always',
  integrations: [sitemap()],
});
