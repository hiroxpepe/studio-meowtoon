// Astro build configuration: static output for Cloudflare Pages deployment.
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Production site URL. Read from PUBLIC_SITE_URL environment variable.
// Falls back to a placeholder so the project can build without any .env setup.
// Override via `.env` (see .env.example) before deploying to production.
const SITE_URL = process.env.PUBLIC_SITE_URL || 'https://example.com';

export default defineConfig({
  site: SITE_URL,
  output: 'static',
  trailingSlash: 'always',
  integrations: [sitemap()],
});
