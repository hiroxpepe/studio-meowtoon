// Content collection schema for all comic episode entries.
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

export const collections = { comic: comic_collection };
