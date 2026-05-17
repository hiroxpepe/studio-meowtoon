// Astro build configuration: static output for Cloudflare Pages deployment.
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://studio-meowtoon.pages.dev',
  output: 'static',
  trailingSlash: 'always',
  integrations: [sitemap()],
});
