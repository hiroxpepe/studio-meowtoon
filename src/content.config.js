// Content collection schema for all content entries.
// Uses Astro v5 Content Layer API (glob loader). Do NOT use legacy type: 'content'.
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const comic_collection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/comic' }),
  schema: z.object({
    title:       z.string().min(1),
    episode:     z.string().regex(/^\d{3}$/, 'episode must be 3-digit zero-padded string'),
    description: z.string().default(''),
    images:      z.array(z.string().startsWith('/images/')).default([]),
  }),
});

const today_discovery_collection = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/today_discovery' }),
  schema: z.object({
    date:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
    title: z.string().min(1),
    image: z.string().startsWith('/images/').optional(),
    tags:  z.array(z.string()).default([]),
  }),
});

const works_collection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/works' }),
  // category naming convention:
  //   category value (singular) | content dir         | URL path
  //   'game'                    | works/games/        | /games/
  //   'asset'                   | works/assets/       | /assets/
  //   'book'                    | works/books/        | /books/
  //   'project'                 | works/projects/     | /projects/
  schema: z.object({
    title:        z.string().min(1),
    category:     z.enum(['game', 'asset', 'book', 'project']),
    description:  z.string().default(''),
    cover_image:  z.string().startsWith('/images/').optional(),
    url:          z.string().url().optional(),
    published_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    tags:         z.array(z.string()).default([]),
  }),
});

// Privacy Policy entries — one Markdown file per game/app.
// Each file is published at /privacy/{slug}/ and is intended to be registered
// in the Google Play Console (or similar app store) as the privacy policy URL.
// The pages are reachable by URL only — they are NOT linked from the site nav.
const privacy_collection = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/privacy' }),
  schema: z.object({
    slug:                   z.string().min(1),
    title:                  z.string().min(1),
    platform:               z.string().min(1),
    effective_date:         z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'effective_date must be YYYY-MM-DD'),
    developer_name:         z.string().min(1),
    contact_email:          z.string().min(1),
    collects_personal_info: z.boolean(),
    uses_ads:               z.boolean(),
    ad_sdks:                z.array(z.string()).default([]),
    uses_analytics:         z.boolean(),
    analytics_sdks:         z.array(z.string()).default([]),
    uses_iap:               z.boolean(),
    uses_online:            z.boolean(),
    target_audience:        z.enum(['everyone', 'teen', 'mature']),
    permissions:            z.array(z.string()).default([]),
  }),
});

export const collections = {
  comic: comic_collection,
  today_discovery: today_discovery_collection,
  works: works_collection,
  privacy: privacy_collection,
};
