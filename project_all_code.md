# Aggregated Sources (Astro, JS, CSS, Markdown)

Repository: C:\Users\F4176\Documents\Projects\studio-meowtoon
Date: 2026-05-19 18:29:31Z

## FILE: astro.config.mjs

```javascript
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
```

## FILE: docs\adr.md

```markdown
# Architecture Decision Records — studio-meowtoon

> **Rules:**
> - This file is append-only. Past decisions are NEVER deleted or modified.
> - When a decision is superseded, append a new entry at the bottom referencing the old one.
> - Merge conflicts: keep both entries in chronological order.

---

## 2025/01 — Migrate from Hugo to Astro

**Context:**
studio-meowtoon was a static Japanese comic site built with Hugo. The team wanted a JavaScript-native toolchain, TDD support via Vitest, and modern component authoring (`.astro` files) while keeping static output deployable to Cloudflare Pages.

**Options considered:**
1. Keep Hugo — familiar, fast, but no JS test infrastructure
2. Migrate to Next.js — JS-native but over-engineered for a fully static site
3. Migrate to Astro — static output, JS-native, Vitest-compatible, component model, Cloudflare Pages ready

**Decision:** Migrate to **Astro v5** with static output (`output: 'static'`).

**Consequences:**
- Hugo template language removed; replaced with `.astro` components
- Content managed via Astro v5 Content Layer API (`glob` loader)
- Migration scripts (`migrate_content.mjs`, `migrate_images.mjs`) converted Hugo Markdown → Astro content collection format, then deleted after one-time use
- Deployment: Cloudflare Pages builds from `develop` branch via GitHub push (`npm run build`, output to `dist/`)

---

## 2025/01 — Skip `en/` content (YAGNI)

**Context:**
Hugo source had `content/en/comic/everyday/` and `content/en/comic/lusiphite/` directories. Both were empty (0 `.md` files, 0 images).

**Decision:** Skip `en/` entirely. Do not create routes, fixtures, or schema entries for English content.

**Rationale:** YAGNI — the directories existed but contained no content. Adding multi-language infrastructure for empty directories would add complexity with zero user value.

**Consequences:** If English content is added in the future, create `src/content/comic/en/{series}/` entries and the `[lang]` route parameter will handle them automatically.

---

## 2025/01 — Images stored in frontmatter `images` array, NOT Markdown body

**Context:**
Hugo Markdown files stored images as `![Page N](filename.ext)` in the Markdown body. This was Hugo's page bundle convention for inline rendering.

**Decision:** In Astro content collection entries, image paths are stored in the frontmatter `images: ['/images/comic/ja/{series}/{episode}/filename.ext', ...]` array. The Markdown body is empty (no `![...]()` patterns).

**Rationale:**
- Enables Zod schema validation (ensures all paths start with `/images/`)
- Simplifies the episode page template (iterate `entry.data.images`, no Markdown rendering needed)
- Images are served from `public/images/` as static assets — no Astro image optimization pipeline (see D10 below)

---

## 2025/01 — Series metadata hardcoded as JS constants (YAGNI)

**Context:**
Each Hugo series had a `_index.md` with display title and cover image reference. Three series exist: `everyday`, `storyboard`, `lusiphite`.

**Decision:** Series metadata (titles, cover images, display order) is hardcoded in `src/lib/series_meta.js` as a plain JS object, not a content collection.

**Rationale:** YAGNI — with only 3 series and no plan to add more, a separate content collection for series metadata adds complexity without benefit. A constant is simpler, testable, and sufficient.

---

## 2025/01 — Images placed in `public/` (no `astro:assets` optimization) — D10

**Context:**
Astro 3+ supports `<Image>` component and `src/assets/` placement for build-time WebP conversion and size optimization.

**Decision:** All 772 comic images are placed in `public/images/comic/` and served as-is via `<img src="...">` tags. Astro image optimization is **not used**.

**Rationale:**
- 772 images × build-time optimization = significant build time increase
- Cloudflare Pages free tier has a ~20-minute build time limit
- The original images are already appropriately sized for mobile-first display
- Avoiding optimization keeps builds fast and within Cloudflare free tier constraints

**Consequences:** Images are not WebP-converted or resized at build time. If build time allows in the future, migrating to `src/assets/` and `<Image>` can be done incrementally.

---

## 2025/01 — OGP URL uses `import.meta.env.DEV` guard, not `??` fallback

**Context:**
`Astro.site` is set in `astro.config.mjs` and is always defined — even during `npm run dev`. Using `Astro.site ?? Astro.url.origin` would never trigger the fallback.

**Decision:** Use `import.meta.env.DEV ? Astro.url.origin : Astro.site` in `base_layout.astro` to construct OGP image URLs.

**Rationale:** In dev mode, OGP images should point to `http://localhost:4321/...` so local source inspection shows valid URLs. In production build, they point to the real Cloudflare Pages domain.

---

## 2025/01 — Astro v5 Content Layer API (glob loader)

**Context:**
Astro v4 used `defineCollection({ type: 'content', schema: ... })` in `src/content/config.js`. Astro v5 deprecated this in favor of the Content Layer API.

**Decision:** Use Astro v5 Content Layer API with `glob` loader from `astro/loaders`. Config file is `src/content.config.js` (NOT `src/content/config.js`).

```js
import { glob } from 'astro/loaders';
const comic_collection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/comic' }),
  schema: z.object({ ... })
});
```

**Consequences:** Entry `id` values do not include the `.md` extension (e.g. `'ja/everyday/001'`). This differs from v4 behavior where `id` included the extension.
```

## FILE: docs\develop_plan_v1.md

```markdown
# Astro Migration Development Plan v1

## Project Context

Migrate **studio-meowtoon** from Hugo to Astro (static output).
Deployed to Cloudflare Pages via GitHub push.
Language: JavaScript. Testing: Vitest (TDD — Red first).
Conventions: snake_case functions/variables, single-responsibility functions, file-level comments, JSDoc.

---

## Definitive Pre-Migration Analysis (Phase 0 — DONE)

### Content Inventory

| Lang | Series | `.md` files | Images/ep | Image filename pattern |
|---|---|---|---|---|
| ja | everyday | 96 | 4 | `cut-N.jpg` (some `cut-N.png`) |
| ja | storyboard | 96 | 4 | `name-N.jpg` (some `name-N.png`) |
| ja | lusiphite | 1 | 4 | `cut-N.jpg` |
| en | everyday | **0** | **0** | empty directory — **skip** |
| en | lusiphite | **0** | **0** | empty directory — **skip** |

Total: 193 `.md` files · 772 image files (744 jpg + 28 png)

### Frontmatter Fields in Use

| Field | Type | Notes |
|---|---|---|
| `type` | string | Always `"comic"` — Hugo layout selector. **Remove in Astro.** |
| `title` | string | Japanese title. Always present. |
| `episode` | string | Zero-padded, e.g. `"001"`. Used for sort and URL param. |
| `weight` | integer | Hugo sort field, e.g. `14`. **Remove in Astro** (sort by `episode`). |
| `description` | string | 162/193 are non-empty. Contains Japanese, ellipsis `…`, emoji 😭. Wrapped in YAML double-quotes. |

### Image Handling

- Images are in Markdown **body** as `![Page N](filename.ext)` — NOT in frontmatter.
- Each episode folder may contain both `.png` AND `.jpg` files for the same name (e.g. `name-1.png` AND `name-1.jpg`).
- Migration must parse filenames **from the Markdown body in order** to get the correct ones.
- Never glob the image directory to determine which files to use.

### Series Metadata (`_index.md`)

| File | Display Title |
|---|---|
| `content/ja/comic/everyday/_index.md` | `Everyday` |
| `content/ja/comic/storyboard/_index.md` | `Storyboard` |
| `content/ja/comic/lusiphite/_index.md` | `Lusiphite` |

These 3 files must **not** be migrated as episodes.

### Static Assets

```
static/
  css/style.css                     (2295 bytes)
  images/works/everyday.jpg
  images/works/storyboard.jpg
  images/works/lusiphite.jpg
```

No other static files. `resources/` and `hugo_stats.json` do **not** exist.

### `.gitignore` Issues

Current `.gitignore` has `/public/` — Hugo's build output.
In Astro, `public/` = static assets (must be committed); `dist/` = build output (must be ignored).
The `/public/` ignore rule must be removed and `/dist/` added before creating `public/`.

---

## Critical Design Decisions

### D1 — Utility functions receive `entries` as first parameter (pure functions)

All data-access functions in `src/lib/comic.js` accept a pre-fetched entries array.
This makes them testable with fixture data, avoiding Astro module mocks.

```js
// ✅ Testable
get_all_episodes(entries, lang, series)

// ❌ Untestable — hides async Astro dependency
get_all_episodes(lang, series) // calls getCollection() internally
```

### D2 — Images migrate from Markdown body to frontmatter `images` array

**Source (Hugo Markdown)**:
```
---
type: comic
title: "雨降りの休日"
episode: "014"
weight: 14
description: "せっかく釣り竿を準備した..."
---
![Page 1](cut-1.jpg)
```

**Output (Astro Markdown)**:
```
---
title: "雨降りの休日"
episode: "014"
description: "せっかく釣り竿を準備した..."
images:
  - /images/comic/ja/everyday/014/cut-1.jpg
---
```

Fields removed: `type`, `weight`. Body: empty.

### D3 — YAML parsing/stringifying via `gray-matter`

Do NOT parse frontmatter with regex. Use `gray-matter` which uses `js-yaml` internally.
Descriptions contain Japanese, emoji, and ellipsis — require proper YAML handling.

### D4 — Image filename source: Markdown body only

Do NOT glob the episode image directory.
A folder may contain both `name-1.png` AND `name-1.jpg` — the Markdown body specifies which to use.

### D5 — `en/` content skipped entirely

Both `en/` series directories are completely empty (no `.md`, no images).
The current site top page only links to `/ja/`. Skip `en/` (YAGNI).
Document in `docs/adr.md` as a future i18n consideration.

### D6 — Series metadata in `src/lib/series_meta.js` (constants, not a content collection)

Only 3 series exist. A full content collection for series metadata violates YAGNI.
Store display titles, top-page order, and cover image paths as plain JS constants.

### D7 — Base layout in `src/layouts/base_layout.astro`

All 3 page types share `<html>/<head>/<body>`. Extract to one layout (DRY).
`<html lang={lang}>` must be dynamic (passed as prop).

### D8 — Pages call `getCollection` directly; no props passing from `getStaticPaths`

```astro
---
// In the page frontmatter (not getStaticPaths)
const all_entries = await getCollection('comic');
const current = get_episode(all_entries, lang, series, episode);
const nav = build_episode_nav(all_entries, lang, series, episode);
---
```

Astro caches `getCollection` results within a single build — no performance issue.

### D9 — `episode` URL param equals `episode` frontmatter value

Both are zero-padded strings (e.g. `"001"`). The Astro collection entry ID parses to the same value.
This must be verified by a test in Phase 5.

### D10 — Images in `public/` (no `astro:assets` build-time optimization)

Images are placed in `public/images/comic/` and referenced by plain `<img>` tags.
Astro's `astro:assets` integration and `<Image>` component are **intentionally not used**.

**Rationale**: 772 images × WebP conversion + srcset generation at build time would likely exceed
Cloudflare Pages' 20-minute free-tier build timeout. Comic panel images are already sized at
author intent — automatic resizing provides no visual benefit here.

**Consequence**: images are served as raw JPEG/PNG with no WebP conversion or automatic srcset.
Record this decision in `docs/adr.md` (Phase 16).

---

## Phase 1: Repository & Astro Bootstrap

**Goal**: Clean up Hugo artifacts, update `.gitignore`, initialize Astro, configure all tooling.

### 1A — Cleanup

- [x] 1.1 Verify Hugo-specific files exist before deleting: `config.toml`, `hugo.exe`, `.hugo_build.lock`
- [x] 1.2 Delete Hugo build output directory: `public/` (it was gitignored — safe to delete)
- [x] 1.3 Verify `resources/` does NOT exist (confirmed in analysis — skip)
- [x] 1.4 Verify `hugo_stats.json` does NOT exist (confirmed in analysis — skip)

### 1B — `.gitignore` Update

- [x] 1.5 Open `.gitignore`; remove the line `/public/`
- [x] 1.6 Add `/dist/` to `.gitignore` (Astro build output)
- [x] 1.7 Add `/node_modules/` to `.gitignore`
- [x] 1.8 Add `/.astro/` to `.gitignore` (Astro type cache)
- [x] 1.9 Verify final `.gitignore` still contains: `.DS_Store`, `*.lock` (keep existing entries)
- [x] 1.10 Verify `public/` is NOT in `.gitignore` (Astro static assets must be committed)

### 1C — Astro Initialization

- [x] 1.11 Run init command in repo root (choose "keep existing" when prompted about README/.gitignore):
  ```
  npm create astro@latest . -- --template minimal --no-install --no-git
  ```
- [x] 1.12 Verify files created by Astro init: `package.json`, `astro.config.mjs`, `src/pages/index.astro`, `src/env.d.ts`
- [x] 1.13 Verify existing `README.md` and `.gitignore` were NOT overwritten

### 1D — Package Installation

- [x] 1.14 Install Astro and core dependencies: `npm install`
- [x] 1.15 Install sitemap integration: `npm install @astrojs/sitemap`
- [x] 1.16 Install Vitest: `npm install -D vitest`
- [x] 1.17 Install `gray-matter` (frontmatter parse/stringify for migration scripts):
  `npm install -D gray-matter`
- [x] 1.18 Install `fast-glob` (file discovery for migration scripts):
  `npm install -D fast-glob`
- [x] 1.19 Verify `node_modules/` exists and `package-lock.json` generated

### 1E — `package.json` Scripts

- [x] 1.20 Verify or add the following scripts in `package.json`:
  ```json
  "dev":             "astro dev",
  "build":           "astro build",
  "preview":         "astro preview",
  "test":            "vitest run",
  "migrate:content": "node scripts/migrate_content.mjs",
  "migrate:images":  "node scripts/migrate_images.mjs"
  ```
- [x] 1.21 Verify `"type": "module"` **IS** in `package.json` (Astro init adds it automatically; do **not** remove — Astro and Vite require project-wide ESM; `.mjs` extension additionally enforces ESM for Node scripts run directly)

### 1F — Node Version Pinning

- [x] 1.22 Create `.node-version` file in repo root with content: `20`
- [x] 1.23 Node 18 reached EOL April 2025; Node 20 is the current LTS and the default on Cloudflare Pages V2 build system

### 1G — Vitest Configuration

- [x] 1.24 Create `vitest.config.mjs`:
  ```js
  // Vitest configuration: runs tests in Node environment for pure JS utility testing.
  import { defineConfig } from 'vitest/config';

  export default defineConfig({
    test: {
      environment: 'node',
      include: [
        'src/**/*.test.js',
        'scripts/**/*.test.mjs',
      ],
    },
  });
  ```
- [x] 1.25 Verify `npm run test` runs without error (0 test files found is OK at this stage)

### 1H — Astro Configuration

- [x] 1.26 Edit `astro.config.mjs` to final form:
  ```js
  // Astro build configuration: static output for Cloudflare Pages deployment.
  import { defineConfig } from 'astro/config';
  import sitemap from '@astrojs/sitemap';

  export default defineConfig({
    site: 'https://REPLACE_WITH_REAL_DOMAIN.pages.dev',
    output: 'static',
    trailingSlash: 'always',
    integrations: [sitemap()],
  });
  ```
- [x] 1.27 Note: `base` is intentionally omitted (defaults to `/`) — correct for root deployment
- [x] 1.28 Note: update `site` value with the real Cloudflare Pages domain before final deploy

### 1I — Directory Scaffolding

- [x] 1.29 Create all required directories:
  ```
  src/content/comic/
  src/lib/fixtures/
  src/layouts/
  src/components/
  src/pages/[lang]/comic/[series]/[episode]/
  scripts/
  public/css/
  public/images/works/
  ```
  Note: **do NOT create `public/images/comic/`** — `migrate_content.mjs` creates it via `mkdirSync(..., { recursive: true })` per episode. Pre-creating it conflicts with Phase 12.5a verification.
- [x] 1.30 Delete the stub `src/pages/index.astro` generated by Astro init (will be replaced in Phase 11)
- [x] 1.31 Verify `src/env.d.ts` exists (created by Astro init; keep as-is for content type inference)

### 1J — Cloudflare Pages Dashboard

- [x] 1.32 In Cloudflare Pages dashboard, set:
  - Framework preset: `Astro`
  - Build command: `npm run build`
  - Build output directory: `dist`
  - Environment variable: `NODE_VERSION = 20`
- [x] 1.33 Verify GitHub repository is connected to Cloudflare Pages project

### 1K — Smoke Test

- [x] 1.34 Run `npm run dev` → server starts at `http://localhost:4321` with no errors
- [x] 1.35 Stop dev server

---

## Phase 2: Content Collection Schema

**Goal**: Define and validate the `comic` content collection schema.

- [x] 2.1 Create `src/content.config.js` (**Astro v5 location** — `src/` root level, NOT `src/content/config.js` which is the deprecated v4 path):
  ```js
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
  ```
- [x] 2.2 Verify `z.string().regex(/^\d{3}$/)` catches malformed episode values (e.g. `"1"` or `"001a"`)
- [x] 2.3 Verify `z.string().startsWith('/images/')` catches relative paths leaked from migration
- [x] 2.4 Smoke-test schema rejection: temporarily create `src/content/comic/bad.md` with `episode: "1"`, run `npx astro check`, confirm error, then delete `bad.md`
- [x] 2.5 Verify that the glob loader assigns `id` **without** file extension (e.g. file `ja/everyday/001.md` → `entry.id === 'ja/everyday/001'`). This matches the fixture format — no changes to `parse_entry_id` or fixtures required.

---

## Phase 3: Series Metadata Constants

**Goal**: Centralize all series configuration — titles, top-page order, cover image paths.

- [x] 3.1 Create `src/lib/series_meta.js`:
  ```js
  // Single source of truth for series display names, order, and cover image paths.

  /**
   * Maps series slug to display title.
   * @type {Record<string, string>}
   */
  export const series_titles = {
    everyday:   'Everyday',
    storyboard: 'Storyboard',
    lusiphite:  'Lusiphite',
  };

  /**
   * Maps series slug to public cover image path.
   * @type {Record<string, string>}
   */
  export const series_covers = {
    everyday:   '/images/works/everyday.jpg',
    storyboard: '/images/works/storyboard.jpg',
    lusiphite:  '/images/works/lusiphite.jpg',
  };

  /**
   * Series shown on the top page, in display order.
   * @type {string[]}
   */
  export const top_page_series = ['everyday', 'storyboard', 'lusiphite'];
  ```
- [x] 3.2 Verify all 3 series slugs are consistent across `series_titles`, `series_covers`, `top_page_series`

---

## Phase 4: Base Layout Component

**Goal**: Extract shared `<html>/<head>/<body>` boilerplate used by all pages.

- [x] 4.1 Create `src/layouts/base_layout.astro`:
  ```astro
  ---
  // Base HTML layout providing <html>, <head>, <body> wrapper for all page types.
  // Props: title (required), lang (default 'ja'), og_image (optional relative path — enables OGP/Twitter Card).
  const { title, lang = 'ja', og_image } = Astro.props;
  const page_title = `${title} | STUDIO MeowToon`;
  // import.meta.env.DEV is true in dev/preview mode; Astro.site is ALWAYS set (from astro.config.mjs)
  // even during local dev — so Astro.site ?? Astro.url.origin never falls back. Use DEV flag instead.
  const base_url = import.meta.env.DEV ? Astro.url.origin : Astro.site;
  const og_image_abs = og_image ? new URL(og_image, base_url).href : undefined;
  ---
  <!DOCTYPE html>
  <html lang={lang}>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{page_title}</title>
    <meta property="og:title" content={page_title}>
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="STUDIO MeowToon">
    {og_image_abs && <meta property="og:image" content={og_image_abs}>}
    {og_image_abs && <meta name="twitter:card" content="summary_large_image">}
    <link rel="stylesheet" href="/css/style.css">
  </head>
  <body>
    <slot />
  </body>
  </html>
  ```
- [x] 4.2 Confirm `lang` prop propagates to `<html lang={lang}>` (dynamic, not hardcoded `"ja"`)
- [x] 4.3 Confirm `<meta name="viewport">` is present (it was missing from Hugo's `list.html` and `index.html`)
- [x] 4.4 List all CSS class names that MUST appear verbatim in page templates (they are referenced by `style.css` and the inline JS):
  - `.hugo-header` — page/series heading
  - `.hugo-series` — series card title on top page
  - `.hugo-episode` — episode number label
  - `.hugo-title` — episode title
  - `.hugo-description` — description text
  - `.hugo-list` — episode list `<ul>`
  - `.hugo-images` — image container `<div>`
  - `.hugo-nav` — navigation row `<div>` ← **critical**: inline JS uses `.hugo-nav a:first-child` and `.hugo-nav a:last-child`
- [x] 4.5 Confirm `og:title` renders on **all** pages (does not require `og_image` prop)
- [x] 4.6 Confirm `og:image` and `twitter:card` render when `og_image` prop is truthy — in **local dev** (`import.meta.env.DEV === true`) `base_url = Astro.url.origin` (`http://localhost:4321`), in **production build** (`import.meta.env.DEV === false`) `base_url = Astro.site` (real Cloudflare domain). ⚠️ `Astro.site ?? Astro.url.origin` does NOT work here because `Astro.site` is always set from `astro.config.mjs` even in `npm run dev` — the `??` fallback never triggers. Check via browser DevTools → View Page Source during `npm run dev`.

---

## Phase 5: Test Fixtures

**Goal**: Create minimal synthetic entries that exactly match Astro's collection entry shape.

### Fixture Entry Shape (Astro v5 `getCollection` return type)

```js
{
  id:         'ja/everyday/001',   // string: lang/series/episode_id (no .md extension)
  collection: 'comic',
  data: {
    title:       'fixture title 001',
    episode:     '001',
    description: 'fixture description',
    images:      ['/images/comic/ja/everyday/001/cut-1.jpg'],
  },
  body: '',                        // empty after migration
}
```

- [x] 5.1 Create `src/lib/fixtures/fixture_entries.js`:
  - 3 `ja/everyday` entries: ids `001`, `002`, `003`
    - `001`: description `''` (empty, to test conditional rendering)
    - `002`: description `'middle episode desc'`
    - `003`: description `'last everyday desc'` (must be the last `everyday` entry)
  - 2 `ja/storyboard` entries: ids `001`, `002`
  - 1 `ja/lusiphite` entry: id `001`
  - Total: 6 entries
- [x] 5.2 Confirm each fixture entry includes: `id`, `collection`, `data.title`, `data.episode`, `data.description`, `data.images`, `body`
- [x] 5.3 Confirm `data.episode` matches the last segment of `id` for all entries (e.g. id `ja/everyday/001` → `data.episode === '001'`)
- [x] 5.4 Confirm `data.images` array has at least 1 path per entry (for image rendering tests)
- [x] 5.5 Confirm the `id` format uses forward-slashes (Astro normalizes to forward-slash even on Windows)

---

## Phase 6: Utility Functions — RED

**Goal**: Write ALL failing tests in `src/lib/comic.test.js`. Run after each group to confirm RED.

- [x] 6.1 Create `src/lib/comic.test.js` with file-level comment and imports:
  ```js
  // Unit tests for comic.js utility functions. Uses fixture data — no Astro runtime needed.
  import { describe, it, expect } from 'vitest';
  import { fixture_entries } from './fixtures/fixture_entries.js';
  import {
    parse_entry_id,
    get_series_list,
    get_all_episodes,
    get_episode,
    get_prev_episode,
    get_next_episode,
  } from './comic.js';
  ```

#### `parse_entry_id(entry_id)`

- [x] 6.2 Test: `parse_entry_id('ja/everyday/001')` → `{ lang: 'ja', series: 'everyday', episode_id: '001' }`
- [x] 6.3 Test: `parse_entry_id('ja/storyboard/096')` → `{ lang: 'ja', series: 'storyboard', episode_id: '096' }`
- [x] 6.4 Test: result always has exactly keys `lang`, `series`, `episode_id` (no extra keys)

#### `get_series_list(entries, lang)`

- [x] 6.5 Test: `get_series_list(fixture_entries, 'ja')` returns `['everyday', 'lusiphite', 'storyboard']` (sorted alphabetically, no duplicates)
- [x] 6.6 Test: `get_series_list(fixture_entries, 'en')` returns `[]` (no en entries in fixture)
- [x] 6.7 Test: `get_series_list([], 'ja')` returns `[]`

#### `get_all_episodes(entries, lang, series)`

- [x] 6.8 Test: `get_all_episodes(fixture_entries, 'ja', 'everyday')` returns 3 entries
- [x] 6.9 Test: returned entries are sorted ascending: first entry has `data.episode === '001'`, last has `'003'`
- [x] 6.10 Test: `get_all_episodes(fixture_entries, 'ja', 'unknown')` returns `[]`
- [x] 6.11 Test: `get_all_episodes([], 'ja', 'everyday')` returns `[]`

#### `get_episode(entries, lang, series, episode_id)`

- [x] 6.12 Test: `get_episode(fixture_entries, 'ja', 'everyday', '001')` returns entry with `id === 'ja/everyday/001'`
- [x] 6.13 Test: `get_episode(fixture_entries, 'ja', 'everyday', '999')` returns `undefined`
- [x] 6.14 Test: `get_episode(fixture_entries, 'ja', 'everyday', '001').data.episode === '001'` (D9 verification)

#### `get_prev_episode(entries, lang, series, episode_id)`

- [x] 6.15 Test: `get_prev_episode(fixture_entries, 'ja', 'everyday', '003')` returns entry with `data.episode === '002'`
- [x] 6.16 Test: `get_prev_episode(fixture_entries, 'ja', 'everyday', '001')` returns `null` (first — no prev)
- [x] 6.17 Test: `get_prev_episode(fixture_entries, 'ja', 'storyboard', '001')` returns `null` (first in different series)

#### `get_next_episode(entries, lang, series, episode_id)`

- [x] 6.18 Test: `get_next_episode(fixture_entries, 'ja', 'everyday', '001')` returns entry with `data.episode === '002'`
- [x] 6.19 Test: `get_next_episode(fixture_entries, 'ja', 'everyday', '003')` returns `null` (last — no next)
- [x] 6.20 Test: `get_next_episode(fixture_entries, 'ja', 'lusiphite', '001')` returns `null` (only episode in series)

- [x] 6.21 Run `npm run test` → **all 19 tests RED** (confirm import errors are NOT the cause — `comic.js` should exist as an empty file to avoid module-not-found errors)

---

## Phase 7: Utility Functions — GREEN

**Goal**: Implement `src/lib/comic.js` until all Phase 6 tests pass.

- [x] 7.1 Create `src/lib/comic.js` with file-level comment and all JSDoc stubs
- [x] 7.2 Implement and `export` `parse_entry_id(entry_id)`:
  - Split on `/`, destructure to `[lang, series, episode_id]`
  - Return object `{ lang, series, episode_id }`
  - Tests 6.2–6.4 GREEN
- [x] 7.3 Implement and `export` `get_series_list(entries, lang)`:
  - Filter entries by lang using `parse_entry_id`
  - Collect unique series slugs
  - Return sorted alphabetically
  - Tests 6.5–6.7 GREEN
- [x] 7.4 Implement and `export` `get_all_episodes(entries, lang, series)`:
  - Filter entries where `parse_entry_id(entry.id)` matches lang AND series
  - Sort ascending by `entry.data.episode` (string comparison — zero-padded so `<` works correctly)
  - Tests 6.8–6.11 GREEN
- [x] 7.5 Implement and `export` `get_episode(entries, lang, series, episode_id)`:
  - Find entry where `entry.id === \`${lang}/${series}/${episode_id}\``
  - Return entry or `undefined`
  - Tests 6.12–6.14 GREEN
- [x] 7.6 Implement and `export` `get_prev_episode(entries, lang, series, episode_id)`:
  - Get sorted episode list via `get_all_episodes`
  - Find current index; return entry at `index - 1`, or `null` if index is 0
  - Tests 6.15–6.17 GREEN
- [x] 7.7 Implement and `export` `get_next_episode(entries, lang, series, episode_id)`:
  - Get sorted episode list via `get_all_episodes`
  - Find current index; return entry at `index + 1`, or `null` if at last
  - Tests 6.18–6.20 GREEN
- [x] 7.8 Run `npm run test` → **all 19 tests GREEN**
- [x] 7.9 Refactor for readability (DRY, naming) while keeping tests GREEN — re-run test after each change

---

## Phase 8: Page Helper Functions — RED

**Goal**: Write failing tests for functions that prepare data for Astro pages.

- [x] 8.1 Add to `src/lib/comic.test.js` — new imports:
  ```js
  import { top_page_series, series_titles, series_covers } from './series_meta.js';
  import {
    build_top_page_data,
    build_series_paths,
    build_episode_paths,
    build_episode_nav,
  } from './comic.js';
  ```

#### `build_top_page_data(entries)` — data for `index.astro`

- [x] 8.2 Test: returns array of length `top_page_series.length` (3)
- [x] 8.3 Test: first item has shape `{ series, display_title, href, cover_src }`
- [x] 8.4 Test: `everyday` item → `href === '/ja/comic/everyday/'` (trailing slash, lang always `ja`)
- [x] 8.5 Test: `everyday` item → `display_title === 'Everyday'` (from `series_titles`)
- [x] 8.6 Test: `everyday` item → `cover_src === '/images/works/everyday.jpg'` (from `series_covers`)
- [x] 8.7 Test: order matches `top_page_series` constant (everyday → storyboard → lusiphite)

#### `build_series_paths(entries)` — `getStaticPaths` for series list page

- [x] 8.8 Test: returns array with `{ params: { lang, series } }` shape
- [x] 8.9 Test: with fixture data → 3 unique paths: `ja/everyday`, `ja/storyboard`, `ja/lusiphite`
- [x] 8.10 Test: no duplicate `{ lang, series }` pairs in result
- [x] 8.11 Test: `build_series_paths([])` returns `[]`

#### `build_episode_paths(entries)` — `getStaticPaths` for episode page

- [x] 8.12 Test: returns array with `{ params: { lang, series, episode } }` shape
- [x] 8.13 Test: result length equals fixture entry count (6)
- [x] 8.13a Test: every item has `params.lang === 'ja'` and `params.series` is one of `['everyday', 'storyboard', 'lusiphite']` — this test explicitly catches the `ReferenceError: lang is not defined` bug that occurs if the implementation omits `parse_entry_id(entry.id)` to extract these values
- [x] 8.14 Test: `episode` param equals `entry.data.episode` value (not raw path segment) — verifies D9
- [x] 8.15 Test: `build_episode_paths([])` returns `[]`

#### `build_episode_nav(entries, lang, series, episode_id)` — prev/next/list hrefs

- [x] 8.16 Test: middle episode (`'002'`) → `{ prev_href: '/ja/comic/everyday/001/', next_href: '/ja/comic/everyday/003/', list_href: '/ja/comic/everyday/' }`
- [x] 8.17 Test: first episode (`'001'`) → `prev_href === null`
- [x] 8.18 Test: last episode (`'003'`) → `next_href === null`
- [x] 8.19 Test: `list_href` always has trailing slash
- [x] 8.20 Test: `prev_href` and `next_href` (when non-null) always have trailing slash
- [x] 8.21 Test: `build_episode_nav` for single-episode series (`lusiphite/001`) → both `prev_href` and `next_href` are `null`

- [x] 8.22 Run `npm run test` → **21 new tests RED** (19 Phase 6 tests still GREEN)

---

## Phase 9: Page Helper Functions — GREEN

**Goal**: Implement remaining functions in `src/lib/comic.js`.

- [x] 9.1 Implement and `export` `build_top_page_data(entries)`:
  - Import `top_page_series`, `series_titles`, `series_covers` from `./series_meta.js`
  - For each slug in `top_page_series`, build `{ series: slug, display_title, href: \`/ja/comic/${slug}/\`, cover_src }`
  - Returns array in `top_page_series` order
  - Tests 8.2–8.7 GREEN
- [x] 9.2 Implement and `export` `build_series_paths(entries)`:
  - Collect unique `{ lang, series }` pairs from all entries via `parse_entry_id`
  - Return `[{ params: { lang, series } }, ...]` with no duplicates
  - Tests 8.8–8.11 GREEN
- [x] 9.3 Implement and `export` `build_episode_paths(entries)`:
  - For each entry, call `parse_entry_id(entry.id)` to extract `{ lang, series }` — **these variables do NOT exist in the outer function scope**
  - ⚠️ Writing `{ params: { lang, series, episode: entry.data.episode } }` without first destructuring from `parse_entry_id` → **`ReferenceError: lang is not defined` at runtime** (caught by test 8.13a)
  - Return `entries.map(entry => { const { lang, series } = parse_entry_id(entry.id); return { params: { lang, series, episode: entry.data.episode } }; })`
  - Tests 8.12–8.15 GREEN
- [x] 9.4 Implement and `export` `build_episode_nav(entries, lang, series, episode_id)`:
  - Get sorted episodes via `get_all_episodes`
  - Compute `list_href = \`/${lang}/comic/${series}/\``
  - Compute `prev_href`: if prev exists → `\`/${lang}/comic/${series}/${prev.data.episode}/\`` else `null`
  - Compute `next_href`: if next exists → `\`/${lang}/comic/${series}/${next.data.episode}/\`` else `null`
  - Tests 8.16–8.21 GREEN
- [x] 9.5 Run `npm run test` → **all 40 tests GREEN**
- [x] 9.6 Refactor while keeping tests GREEN

---

## Phase 10: Migration Script — RED

**Goal**: Write failing tests for migration script helper functions before implementing them.
Test file: `scripts/migrate_content.test.mjs`

- [x] 10.1 Create empty `scripts/migrate_content.mjs` (prevents import errors in tests)
- [x] 10.2 Create `scripts/migrate_content.test.mjs` with imports:
  ```js
  // Tests for migration script helper functions. All functions are pure.
  import { describe, it, expect } from 'vitest';
  import {
    parse_hugo_md,
    build_image_abs_path,
    build_astro_md,
  } from './migrate_content.mjs';
  ```

#### `parse_hugo_md(raw_string)` — parse Hugo Markdown file content

- [x] 10.3 Test: basic parse — returns `{ title, episode, description, image_filenames }`
- [x] 10.4 Test: `title` field extracted correctly from frontmatter
- [x] 10.5 Test: `episode` field extracted as string `"014"` (not number `14`)
- [x] 10.6 Test: `description` preserved including Japanese characters and emoji `😭`
- [x] 10.7 Test: `description` preserved including ellipsis `…` (multi-byte character)
- [x] 10.8 Test: `image_filenames` returns `['cut-1.jpg', 'cut-2.jpg', 'cut-3.jpg', 'cut-4.jpg']` in order
- [x] 10.9 Test: storyboard-style body `![Page 1](name-1.jpg)...` → `image_filenames` is `['name-1.jpg', 'name-2.jpg', 'name-3.jpg', 'name-4.jpg']`
- [x] 10.10 Test: `type` field is NOT present in returned object (stripped)
- [x] 10.11 Test: `weight` field is NOT present in returned object (stripped)
- [x] 10.12 Test: input with empty `description: ""` → `description` is `''` (empty string, not null/undefined)
- [x] 10.13 Test: input with no `![...]()` lines → `image_filenames` is `[]`

#### `build_image_abs_path(lang, series, episode_id, filename)` — construct public URL

- [x] 10.14 Test: `('ja', 'everyday', '014', 'cut-1.jpg')` → `'/images/comic/ja/everyday/014/cut-1.jpg'`
- [x] 10.15 Test: `('ja', 'storyboard', '001', 'name-1.png')` → `'/images/comic/ja/storyboard/001/name-1.png'`
- [x] 10.16 Test: result always starts with `/images/comic/`
- [x] 10.17 Test: result never contains backslashes (Windows path safety check)

#### `build_astro_md(title, episode, description, image_paths)` — render final Astro Markdown string

- [x] 10.18 Test: output starts with `---\n` and contains second `---\n` (valid frontmatter delimiters)
- [x] 10.19 Test: output contains `title:` with correct value
- [x] 10.20 Test: output contains `episode:` with value `"014"` (string-quoted)
- [x] 10.21 Test: output contains `images:` block with all provided paths as list items
- [x] 10.22 Test: output does NOT contain `type:` field
- [x] 10.23 Test: output does NOT contain `weight:` field
- [x] 10.24 Test: Markdown body (after closing `---`) contains no `![...]()` patterns
- [x] 10.25 Test: `description` with Japanese + emoji is preserved exactly in output
- [x] 10.26 Test: output is parseable by `gray-matter` without error (round-trip test)
- [x] 10.27 Test: `gray-matter` re-parse of output → `data.description === original_description`

- [x] 10.28 Run `npm run test` → **25 new tests RED**, 39 Phase 9 tests still GREEN

---

## Phase 11: Migration Script — GREEN

**Goal**: Implement `migrate_content.mjs` and `migrate_images.mjs`.

### `scripts/migrate_content.mjs`

- [x] 11.1 Add file-level comment: `// Migration script: transforms Hugo Markdown to Astro content collection format.`
- [x] 11.2 Import at top of file:
  ```js
  import matter from 'gray-matter';
  import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync } from 'node:fs';
  import { join, dirname, basename } from 'node:path';
  import { fileURLToPath } from 'node:url';
  import glob from 'fast-glob';
  ```
- [x] 11.3 Implement and `export` `parse_hugo_md(raw_string)`:
  - Use `matter(raw_string)` to parse frontmatter and body
  - Extract `title`, `episode` (as string), `description` from `data`
  - Parse `image_filenames` from `content` (body) using regex `!\[.*?\]\((.+?)\)` globally
  - Return `{ title, episode: String(data.episode).padStart(3,'0'), description: data.description ?? '', image_filenames }`
  - Do NOT include `type` or `weight` in return value
  - Tests 10.3–10.13 GREEN
- [x] 11.4 Implement and `export` `build_image_abs_path(lang, series, episode_id, filename)`:
  - Return `/images/comic/${lang}/${series}/${episode_id}/${filename}` (forward-slashes always)
  - Tests 10.14–10.17 GREEN
- [x] 11.5 Implement and `export` `build_astro_md(title, episode, description, image_paths)`:
  - Build frontmatter object: `{ title, episode, description, images: image_paths }`
  - Use `matter.stringify('', frontmatter_obj)` to serialize
  - Return the stringified result (starts with `---`, ends with `---\n\n`)
  - Tests 10.18–10.27 GREEN
- [x] 11.6 Run `npm run test` → **all 64 tests GREEN**
- [x] 11.7 Implement `run_migration()` main function (NOT exported — not tested as unit):
  ```
  1. Use fast-glob to find all content/ja/comic/**/*.md
  2. Filter out _index.md files
  3. For each .md file:
     a. Parse lang/series/episode_id from path:
           ⚠️ Hugo source is NOT a Leaf Bundle — structure is:
             `content/ja/comic/everyday/001.md`  ← flat .md (episode source)
             `content/ja/comic/everyday/001/`    ← same-named dir containing images
           path segments: content[0] / lang[1] / comic[2] / series[3] / {episode_id}.md[4]
           episode_id = path.basename(filepath, '.md')  → e.g. '001'
           ⚠️ Do NOT use dirname() — every file would yield 'everyday', NOT '001'
     b. Read raw content with readFileSync (encoding: 'utf-8')
     c. Call parse_hugo_md(raw)
     d. Build image_paths array via build_image_abs_path for each filename
     d2. Copy only referenced images (D4 compliance):
           Import { existsSync } from 'node:fs'
           For each filename in image_filenames:
             src  = join('content', lang, 'comic', series, episode_id, filename)
             dest = join('public', 'images', 'comic', lang, series, episode_id, filename)
             mkdirSync(dirname(dest), { recursive: true })
             ⚠️ Guard against ENOENT crash (Markdown typo or missing committed file):
             if (existsSync(src)) {
               cpSync(src, dest)   ← single-file copy, NOT recursive
               img_count++
             } else {
               console.warn(`[WARNING] Missing image: ${src}`)
             }
     e. Build output string via build_astro_md
     f. Compute output path: src/content/comic/{lang}/{series}/{episode_id}.md
     g. mkdirSync(dirname(output_path), { recursive: true })
     h. writeFileSync(output_path, output_str, 'utf-8')
     i. console.log(`Migrated: ${output_path}`)
  4. console.log(`Done: ${count} files migrated, ${img_count} images copied`)
  ```
- [x] 11.8 Add `run_migration()` call at bottom (only when file is run directly, not imported):
  ```js
  // Only run when executed directly (not when imported by tests)
  const is_main = process.argv[1] === fileURLToPath(import.meta.url);
  if (is_main) run_migration();
  ```

### `scripts/migrate_images.mjs`

- [x] 11.9 Add file-level comment: `// Migration script: copies Hugo static assets to Astro public/ directory.`
- [x] 11.10 Import: `import { cpSync, mkdirSync } from 'node:fs';`
- [x] 11.11 Implement `copy_css()`:
  - Source: `static/css/style.css`
  - Destination: `public/css/style.css`
  - `mkdirSync('public/css', { recursive: true })`
  - Use `cpSync(src, dest)`
- [x] 11.12 Implement `copy_covers()`:
  - Source: `static/images/works/`
  - Destination: `public/images/works/`
  - `mkdirSync('public/images/works', { recursive: true })`
  - Use `cpSync(src, dest, { recursive: true })`
  - Verify 3 files: `everyday.jpg`, `storyboard.jpg`, `lusiphite.jpg`
- [x] 11.13 **Do NOT implement `copy_comic_images()`** — this function is eliminated. Per D4, comic images must be copied inside `run_migration()` using only filenames parsed from each Markdown body (step d2 above). Copying entire directories would include unreferenced files when both `.jpg` and `.png` coexist for the same image name in a source folder.
- [x] 11.14 Implement `run_image_migration()` calling only `copy_css()` and `copy_covers()` with progress logs
- [x] 11.15 Add `is_main` guard (same pattern as `migrate_content.mjs`)

---

## Phase 12: Run Migration & Validate

**Goal**: Execute scripts, validate all entries pass schema, fix any errors.

### Run Order

`migrate:images` handles CSS and cover images only (4 files total). Comic episode images are copied by `migrate:content` per D4 — only files referenced in each Markdown body are copied, not entire source directories.

- [x] 12.1 Run `npm run migrate:images`
- [x] 12.2 Verify `public/css/style.css` exists and is non-empty
- [x] 12.3 Verify `public/images/works/everyday.jpg` exists
- [x] 12.4 Verify `public/images/works/storyboard.jpg` exists
- [x] 12.5 Verify `public/images/works/lusiphite.jpg` exists
- [x] 12.5a Verify `public/images/comic/` does **not** yet exist (created by `migrate:content`, not `migrate:images`)

- [x] 12.9 Run `npm run migrate:content`
- [x] 12.10 Verify migration console output: `Done: 193 files migrated, N images copied`
- [x] 12.6 Verify `public/images/comic/ja/everyday/001/` contains 4 image files
- [x] 12.7 Verify `public/images/comic/ja/storyboard/001/` contains files named `name-N.*`
- [x] 12.8 Verify total file count in `public/images/comic/` matches migration log output (D4: only Markdown-referenced files — may differ from Hugo source total of 772 if any source folder has duplicate `.png`/`.jpg` for the same image name)
- [x] 12.11 Verify `src/content/comic/ja/everyday/` has exactly 96 `.md` files
- [x] 12.12 Verify `src/content/comic/ja/storyboard/` has exactly 96 `.md` files
- [x] 12.13 Verify `src/content/comic/ja/lusiphite/` has exactly 1 `.md` file
- [x] 12.14 Verify NO `_index.md` files were created in `src/content/comic/`
- [x] 12.15 Verify `src/content/comic/en/` does NOT exist (en skipped)

### Manual Spot-Checks (read actual file content)

- [x] 12.16 Read `src/content/comic/ja/everyday/001.md`:
  - Has `title: "ねこも花粉症？"` ✓
  - Has `episode: "001"` ✓
  - Has `images:` array ✓
  - No `type:` field ✓
  - No `weight:` field ✓
  - Body below `---` is empty ✓
- [x] 12.17 Read `src/content/comic/ja/everyday/014.md`:
  - `description` contains `😭` emoji ✓
  - Images are `/images/comic/ja/everyday/014/cut-1.jpg` ✓
- [x] 12.18 Read `src/content/comic/ja/storyboard/001.md`:
  - Images are `/images/comic/ja/storyboard/001/name-1.jpg` (NOT `cut-1.jpg`) ✓
- [x] 12.19 Read `src/content/comic/ja/storyboard/050.md`:
  - Images are `name-N.jpg` ✓
- [x] 12.20 Read `src/content/comic/ja/lusiphite/001.md`:
  - Single episode migrated correctly ✓

### Schema Validation

- [x] 12.21 Run `npx astro check` → **zero errors** across all 193 entries
- [x] 12.22 If errors: check for `episode` field format mismatches, fix in script and re-run `migrate:content`
- [x] 12.23 If errors: check for `images` paths not starting with `/images/`, fix in script and re-run

### Re-run safety

- [x] 12.24 Run `npm run migrate:content` a second time → same 193 files overwritten, no errors (idempotent)
- [x] 12.25 Run `npm run test` → all 64 tests still GREEN

---

## Phase 13: `EpisodeNav` Component

**Goal**: Build the navigation component with precise CSS class and DOM structure required by inline JS.

### Critical: Inline JS DOM Selector Analysis

The swipe and keyboard scripts use:
```js
document.querySelector('.hugo-nav a:first-child')   // ← Prev link
document.querySelector('.hugo-nav a:last-child')    // ← Next link
```

**`a:first-child`** matches `<a>` only if it is literally the first child of `.hugo-nav`.
**`a:last-child`** matches `<a>` only if it is literally the last child of `.hugo-nav`.

When a `<span>` is the first child (no prev), `.hugo-nav a:first-child` returns `null` → correct (no navigation).
When a `<span>` is the last child (no next), `.hugo-nav a:last-child` returns `null` → correct.
For middle episodes: `<a>` is both first AND last child candidate → correct.

**The component MUST output exactly 3 children in this order**: `{prev}`, `{list}`, `{next}`.
The `list` link is always an `<a>` — it must NEVER be first or last child.

- [x] 13.1 Create `src/components/episode_nav.astro`:
  ```astro
  ---
  // Episode navigation component: prev/list/next links for the comic reader.
  // IMPORTANT: DOM structure must match .hugo-nav a:first-child / a:last-child selectors in inline script.
  const { prev_href, next_href, list_href } = Astro.props;
  ---
  <div class="hugo-nav">
    {prev_href
      ? <a href={prev_href}>◀️ Prev</a>
      : <span></span>
    }
    <a href={list_href}>⤴️ List</a>
    {next_href
      ? <a href={next_href}>Next ▶️</a>
      : <span></span>
    }
  </div>
  ```
- [x] 13.2 Verify: when `prev_href` is null → first child is `<span>`, not `<a>` → `querySelector('.hugo-nav a:first-child')` returns `null`
- [x] 13.3 Verify: when `next_href` is null → last child is `<span>`, not `<a>` → `querySelector('.hugo-nav a:last-child')` returns `null`
- [x] 13.4 Verify: when both are non-null → first child is `<a>` with `prev_href`, last child is `<a>` with `next_href`

---

## Phase 14: Page Components

**Goal**: Implement all 4 page files and a custom 404 page.

### `src/pages/404.astro`

- [x] 14.1 Create `src/pages/404.astro`:
  ```astro
  ---
  // Custom 404 page for Cloudflare Pages.
  import BaseLayout from '../layouts/base_layout.astro';
  ---
  <BaseLayout title="Page Not Found" lang="ja">
    <div class="hugo-header">404 — Page Not Found</div>
    <div><a href="/">⤴️ Top</a></div>
  </BaseLayout>
  ```
- [x] 14.2 Verify Cloudflare Pages serves this file for unknown URLs (test after deploy)

### `src/pages/index.astro`

- [x] 14.3 Create `src/pages/index.astro`:
  ```astro
  ---
  // Top page: displays all comic series with cover images.
  import { getCollection } from 'astro:content';
  import BaseLayout from '../layouts/base_layout.astro';
  import { build_top_page_data } from '../lib/comic.js';

  const all_entries = await getCollection('comic');
  const series_list = build_top_page_data(all_entries);
  ---
  <BaseLayout title="Comic Series" lang="ja" og_image={series_list[0]?.cover_src}>
    <div class="hugo-header">Emily and Orange the cat</div>
    <div style="margin:0 auto;">
      <div style="display:flex;flex-direction:column;gap:1.5em;">
        {series_list.map(s => (
          <a href={s.href} style="text-decoration:none;color:inherit;">
            <div class="hugo-series">{s.display_title}</div>
            <img src={s.cover_src} alt={s.display_title} width="100%">
          </a>
        ))}
      </div>
    </div>
  </BaseLayout>
  ```
- [x] 14.4 Verify output is data-driven (not hardcoded series list)
- [x] 14.5 Verify series order matches `top_page_series`: everyday → storyboard → lusiphite
- [x] 14.5a Verify `og:image` meta in page source uses the first series cover (everyday.jpg) — check via `view-source:` in browser after `npm run preview`

### `src/pages/[lang]/comic/[series]/index.astro`

- [x] 14.6 Create `src/pages/[lang]/comic/[series]/index.astro`:
  ```astro
  ---
  // Series list page: shows all episodes for a given lang/series.
  import { getCollection } from 'astro:content';
  import BaseLayout from '../../../../layouts/base_layout.astro';
  import { get_all_episodes, build_series_paths } from '../../../../lib/comic.js';
  import { series_titles, series_covers } from '../../../../lib/series_meta.js';

  export async function getStaticPaths() {
    const all_entries = await getCollection('comic');
    return build_series_paths(all_entries);
  }

  const { lang, series } = Astro.params;
  const all_entries = await getCollection('comic');
  const episodes = get_all_episodes(all_entries, lang, series);
  const display_title = series_titles[series] ?? series;
  ---
  <BaseLayout title={display_title} lang={lang} og_image={series_covers[series]}>
    <div class="hugo-header">{display_title} - Episode List</div>
    <ul class="hugo-list">
      {episodes.map(ep => (
        <li>
          <a href={`/${lang}/comic/${series}/${ep.data.episode}/`}>
            {ep.data.episode} {ep.data.title}
          </a>
        </li>
      ))}
    </ul>
    <div style="margin-top:2em;"><a href="/">⤴️ Top</a></div>
  </BaseLayout>
  ```
- [x] 14.7 Verify episode list is in ascending order (guaranteed by `get_all_episodes`)
- [x] 14.8 Verify hrefs have trailing slash
- [x] 14.8a Verify `og:image` in series page source resolves to absolute URL of the correct cover (e.g. `https://…/images/works/everyday.jpg`) — requires `site` field set in `astro.config.mjs`

### `src/pages/[lang]/comic/[series]/[episode]/index.astro`

- [x] 14.9 Create `src/pages/[lang]/comic/[series]/[episode]/index.astro`:
  ```astro
  ---
  // Episode page: displays comic panel images with navigation.
  import { getCollection } from 'astro:content';
  import BaseLayout from '../../../../../layouts/base_layout.astro';
  import EpisodeNav from '../../../../../components/episode_nav.astro';
  import { get_episode, build_episode_paths, build_episode_nav } from '../../../../../lib/comic.js';

  export async function getStaticPaths() {
    const all_entries = await getCollection('comic');
    return build_episode_paths(all_entries);
  }

  const { lang, series, episode } = Astro.params;
  const all_entries = await getCollection('comic');
  const current = get_episode(all_entries, lang, series, episode);
  const { title, description, images } = current.data;
  const nav = build_episode_nav(all_entries, lang, series, episode);
  ---
  <BaseLayout title={title} lang={lang} og_image={images[0]}>
    <div class="hugo-episode">Episode {episode}</div>
    <div class="hugo-title">{title}</div>
    <div class="hugo-images">
      {images.map(src => (
        <img src={src} alt="comic panel">
      ))}
    </div>
    {description && (
      <div class="hugo-description">{description}</div>
    )}
    <EpisodeNav
      prev_href={nav.prev_href}
      next_href={nav.next_href}
      list_href={nav.list_href}
    />
    <script>
    // Swipe navigation: right swipe = prev, left swipe = next.
    let touchStartX = null;
    let touchStartY = null;
    document.body.addEventListener('touchstart', function(e) {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    });
    document.body.addEventListener('touchend', function(e) {
      if (touchStartX === null || touchStartY === null) return;
      let dx = e.changedTouches[0].screenX - touchStartX;
      let dy = e.changedTouches[0].screenY - touchStartY;
      if (Math.abs(dx) > Math.abs(dy) * 0.7 && Math.abs(dx) > 40) {
        e.preventDefault();
        if (dx > 0) {
          let prev = document.querySelector('.hugo-nav a:first-child');
          if (prev && prev.getAttribute('href')) location.href = prev.getAttribute('href');
        } else {
          let next = document.querySelector('.hugo-nav a:last-child');
          if (next && next.getAttribute('href')) location.href = next.getAttribute('href');
        }
      }
      touchStartX = null;
      touchStartY = null;
    });
    // Keyboard navigation: arrow keys.
    document.addEventListener('keydown', function(e) {
      if (e.key === 'ArrowLeft') {
        let prev = document.querySelector('.hugo-nav a:first-child');
        if (prev && prev.getAttribute('href')) location.href = prev.getAttribute('href');
      } else if (e.key === 'ArrowRight') {
        let next = document.querySelector('.hugo-nav a:last-child');
        if (next && next.getAttribute('href')) location.href = next.getAttribute('href');
      }
    });
    </script>
  </BaseLayout>
  ```
- [x] 14.10 Verify `{description && ...}` renders nothing for empty string `""` (JS falsy)
- [x] 14.11 Verify `lang`, `series`, `episode` come from `Astro.params` (not props)
- [x] 14.12 Verify all image `alt="comic panel"` (matches Hugo original)
- [x] 14.12a Verify `og:image` in episode page source is an absolute URL of the first panel (e.g. `https://…/images/comic/ja/everyday/001/cut-1.jpg`) — requires `site` set in `astro.config.mjs`

---

## Phase 15: Build & Full Verification

**Goal**: Confirm Astro-built site is functionally identical to Hugo at every URL and interaction.

### Build

- [x] 15.1 Run `npm run build` — zero errors, zero warnings
- [x] 15.2 Verify `dist/` directory created
- [x] 15.3 Run `npm run preview` — site served at `http://localhost:4321`

### Page Count in `dist/`

- [x] 15.4 Verify `dist/index.html` exists
- [x] 15.5 Verify `dist/ja/comic/everyday/` structure — **`trailingSlash: 'always'` + `[episode]/index.astro` directory routing outputs one subdirectory per episode, NOT 97 flat HTML files**:
  - `dist/ja/comic/everyday/index.html` exists (series list — the only HTML file directly in this dir)
  - Subdirectories `001/` through `096/` exist directly under `dist/ja/comic/everyday/` (96 subdirs total)
  - Each `dist/ja/comic/everyday/NNN/index.html` exists (episode page inside its subdir)
- [x] 15.6 Verify `dist/ja/comic/storyboard/` same structure: `index.html` + 96 subdirectories each containing `index.html`
- [x] 15.7 Verify `dist/ja/comic/lusiphite/` structure: `index.html` (series list) + `001/index.html` only (2 HTML files total, 1 subdir)
- [x] 15.8 Verify `dist/sitemap.xml` exists and contains episode URLs
- [x] 15.9 Verify `dist/404.html` exists

### URL Structure

- [x] 15.10 `/` → top page: 3 series shown (everyday, storyboard, lusiphite) in correct order
- [x] 15.11 `/ja/comic/everyday/` → 96 episodes in ascending order, first is `001 ねこも花粉症？`
- [x] 15.12 `/ja/comic/storyboard/` → 96 episodes listed
- [x] 15.13 `/ja/comic/lusiphite/` → 1 episode listed
- [x] 15.14 `/ja/comic/everyday/001/` → 4 images, title `ねこも花粉症？`, no description div (empty description)
- [x] 15.15 `/ja/comic/everyday/014/` → description `せっかく釣り竿を準備した...😭` rendered
- [x] 15.16 `/ja/comic/storyboard/001/` → images have `name-1.jpg` paths (not `cut-1.jpg`)
- [x] 15.17 `/ja/comic/everyday/001/` → Prev nav is `<span>` (no prev link), Next nav is `<a>`
- [x] 15.18 `/ja/comic/everyday/096/` → Prev nav is `<a>`, Next nav is `<span>` (no next link)

### CSS Rendering

- [x] 15.19 `<html lang="ja">` on all pages (not hardcoded, dynamic from route param)
- [x] 15.20 Episode images fill full viewport width on mobile (check `100vw` in devtools)
- [x] 15.21 PC font-size `30px` base
- [x] 15.22 Tablet font-size `26px` at ≤900px
- [x] 15.23 Mobile font-size `16px` at ≤600px
- [x] 15.24 No margin/padding around images on mobile (body `margin:0; padding:0`)
- [x] 15.24a Open `public/css/style.css`; verify the `body {}` rule contains `touch-action: pan-y` — this tells iOS Safari / Android Chrome to only intercept vertical pan gestures natively, preventing the edge-swipe "back/forward" from conflicting with the episode swipe handler. If missing: add `touch-action: pan-y;` to the `body {}` rule manually.

### Navigation Interactions

- [x] 15.25 `⤴️ List` link on episode page → returns to series list ✓
- [x] 15.26 `⤴️ Top` link on series list page → returns to top page `/` ✓
- [x] 15.27 Swipe right on mobile (episode 002) → navigate to 001 ✓
- [x] 15.28 Swipe left on mobile (episode 001) → navigate to 002 ✓
- [x] 15.29 Swipe right on first episode (001) → no navigation (prev is `<span>`) ✓
- [x] 15.30 Swipe left on last episode (096) → no navigation (next is `<span>`) ✓
- [x] 15.31 `←` key on desktop (episode 002) → navigate to 001 ✓
- [x] 15.32 `→` key on desktop (episode 001) → navigate to 002 ✓

### Cloudflare Deploy

- [x] 15.33 Update `astro.config.mjs` `site` field with real Cloudflare Pages domain
- [x] 15.34 Push branch to GitHub → verify Cloudflare Pages build triggers
- [x] 15.35 Verify build succeeds in Cloudflare Pages dashboard (no npm errors)
- [x] 15.36 Verify live URL loads top page correctly
- [x] 15.37 Verify HTTPS works
- [x] 15.38 Verify live `/ja/comic/everyday/001/` loads images from `/images/comic/...` paths

---

## Phase 16: Cleanup & Documentation

**Goal**: Remove all Hugo artifacts, finalize documentation.

### Remove Hugo Files

- [x] 16.1 Delete `config.toml`
- [x] 16.2 Delete `hugo.exe`
- [x] 16.3 Delete `.hugo_build.lock`
- [x] 16.4 Delete `content/` directory (entire Hugo content tree)
- [x] 16.5 Delete `layouts/` directory
- [x] 16.6 Delete `scripts/` directory (migration scripts are one-time use)
- [x] 16.7 Verify `public/` directory is NOT deleted (it now contains Astro static assets)

### Final Build Verification After Cleanup

- [x] 16.8 Run `npm run build` → clean build with no Hugo references or errors
- [x] 16.9 Run `npm run test` → all 64 tests GREEN (migration script tests removed with `scripts/`)
- [x] 16.10 Verify test count after scripts/ removal: 39 tests (utility + page helpers only)

### Documentation

- [x] 16.11 Create `docs/adr.md`:
  - Record Hugo → Astro migration decision (date, context, options considered, decision, consequences)
  - Record: `en/` content skipped (YAGNI — directories exist but are empty)
  - Record: images moved from Markdown body to frontmatter `images` array
  - Record: series metadata hardcoded (not a content collection — YAGNI)
- [x] 16.12 Update `README.md`:
  - Replace Hugo commands with Astro commands
  - Document: `npm run dev`, `npm run build`, `npm run test`, `npm run preview`
  - Document: Cloudflare Pages automatic deploy on push
  - Document: how to add a new episode (create `.md` in `src/content/comic/ja/{series}/`, add images to `public/images/comic/ja/{series}/{episode_id}/`)
- [x] 16.13 Rewrite `specs/app_spec.md` to reflect Astro project structure
- [x] 16.14 Update `vs.code-workspace` if it contains Hugo-specific path references
- [x] 16.15 Run final `npm run build` + smoke-test one episode URL

---

## Dependency Map

```
Phase 0 ✅ DONE
    │
    ├─ Phase 1 (Bootstrap)
    │       │
    │       ├─ Phase 2 (Schema)
    │       ├─ Phase 3 (Series Meta)
    │       └─ Phase 4 (Base Layout)
    │               │
    │       ┌───────┘
    │       │
    │  Phase 5 (Fixtures)
    │       │
    │  Phase 6 (Utility RED) → Phase 7 (Utility GREEN)
    │                                   │
    │  Phase 8 (Page Helper RED) ← ─────┘
    │       │
    │  Phase 9 (Page Helper GREEN)
    │       │
    │  Phase 10 (Script RED) → Phase 11 (Script GREEN) → Phase 12 (Run Migration)
    │                                                            │
    │                                              Phase 13 (EpisodeNav)
    │                                                            │
    │                                              Phase 14 (Pages) ← needs Phase 12 + 13
    │                                                            │
    │                                              Phase 15 (Verify)
    │                                                            │
    │                                              Phase 16 (Cleanup)
```

**Parallelizable**:
- Phase 2, 3, 4 can proceed in parallel after Phase 1
- Phase 6–7 (utility) and Phase 10–11 (scripts) can proceed in parallel
- Phase 8–9 (page helpers) requires Phase 7 done first
- Phase 14 (pages) requires Phase 12 (migrated content) AND Phase 13 (EpisodeNav)

---

## Checklist Summary

| Phase | Items | Note |
|---|---|---|
| 0 | 5 | ✅ Done |
| 1 | 35 | Bootstrap |
| 2 | 5 | Schema + v5 API |
| 3 | 2 | Series meta |
| 4 | 6 | Base layout + OGP |
| 5 | 5 | Fixtures |
| 6 | 21 | Utility RED |
| 7 | 9 | Utility GREEN |
| 8 | 23 | Page helper RED |
| 9 | 6 | Page helper GREEN |
| 10 | 28 | Script RED |
| 11 | 15 | Script GREEN |
| 12 | 26 | Run migration |
| 13 | 4 | EpisodeNav |
| 14 | 15 | Pages + OGP |
| 15 | 39 | Verify |
| 16 | 15 | Cleanup |
| **Total** | **259** | |
```

## FILE: docs\develop_plan_v2.md

```markdown
# meowtoon.com Development Plan v2

## Project Context

Evolve **studio-meowtoon** from a Japanese comic viewer into the full **meowtoon.com** global
creator site described in 企画書 v6 (2026-05-18).

| Item | Current state | Target (Phase 1) |
|---|---|---|
| Site concept | Comic viewer (3 series, JP only) | Global creator site — "One creator. Every day." |
| Language | Japanese UI | English-first UI |
| Content types | Comic only | Comic + Today's Discovery + Works |
| Navigation | None (plain links) | MD3 bar / rail / drawer |
| Design | Custom CSS | Material Design 3 |
| Backend | None | None — Phase 1 is zero-backend |
| Analytics | None | CF Web Analytics + GA4 |

**Stack:** Astro v5 · Cloudflare Pages · static output · Vitest (TDD)
**Conventions:** snake_case, single-responsibility functions, JSDoc, TDD Red-first

---

## Pre-Implementation Decisions (Resolve Before Coding — NOT checklist items)

| # | Decision | Needed before |
|---|---|---|
| D1 | Seed color for MD3 Dynamic Color palette | Phase 1 |
| D2 | Hero catchphrase / tagline | Phase 14 |
| D3 | Top 4 navigation items and labels | Phase 11 |

> **Ephemerality policy (resolved):** Homepage shows latest 1 discovery;
> archive `/today/` shows latest 30. Older content stays in source tree, not linked from nav.

---

## Codebase State at v2 Start (DONE — do not redo)

All Phase 1–16 of `develop_plan_v1.md` complete. Specifically:
- `src/content.config.js` — `comic` collection defined (Astro v5 Content Layer API)
- `src/lib/comic.js` — 10 functions, all exported, JSDoc'd
- `src/lib/comic.test.js` — 40 tests, all GREEN
- `src/lib/series_meta.js` — `series_titles`, `series_covers`, `top_page_series` constants
- `src/lib/fixtures/fixture_entries.js` — 6 fixture entries (3 `everyday`, 2 `storyboard`, 1 `lusiphite`)
- `src/layouts/base_layout.astro` — minimal layout, OGP, `lang` prop
- `src/components/episode_nav.astro` — prev/list/next, DOM structure for inline JS
- `src/pages/index.astro` — top page, 3 series
- `src/pages/[lang]/comic/[series]/index.astro` — series episode list
- `src/pages/[lang]/comic/[series]/[episode]/index.astro` — episode detail
- `src/pages/404.astro` — custom 404 (needs MD3 reskin in Phase 19)
- `public/css/style.css` — responsive CSS (needs MD3 token refactor in Phase 13)
- 193 comic episode `.md` files, 772 images in `public/images/comic/`

---

## Phase 1: MD3 Design System Tokens

**Goal**: Define all MD3 CSS custom properties that the entire site will consume.
Resolve D1 (seed color) before writing production values; use placeholder orange `#FB8C00`
until final decision.

- [x] 1.1 Create `public/css/md3-tokens.css` with file-level comment:
  `/* Material Design 3 design tokens — generated from seed color. Replace placeholder values after D1 resolution. */`
- [x] 1.2 Define color role tokens (light scheme; full list below):
  ```css
  :root {
    --md-sys-color-primary:              #8B4513;
    --md-sys-color-on-primary:           #FFFFFF;
    --md-sys-color-primary-container:    #FFDBC9;
    --md-sys-color-on-primary-container: #340F00;
    --md-sys-color-secondary:            #765849;
    --md-sys-color-on-secondary:         #FFFFFF;
    --md-sys-color-secondary-container:  #FFDBC9;
    --md-sys-color-on-secondary-container: #2C160B;
    --md-sys-color-surface:              #FFF8F6;
    --md-sys-color-on-surface:           #221A17;
    --md-sys-color-surface-variant:      #F4DED7;
    --md-sys-color-on-surface-variant:   #52443F;
    --md-sys-color-outline:              #85736D;
    --md-sys-color-outline-variant:      #D7C2BB;
    --md-sys-color-error:                #BA1A1A;
    --md-sys-color-on-error:             #FFFFFF;
    --md-sys-color-background:           #FFF8F6;
    --md-sys-color-on-background:        #221A17;
  }
  ```
  Note: These are placeholder values from orange `#FB8C00` seed. Replace with D1 output.
- [x] 1.3 Add `prefers-color-scheme: dark` block with dark scheme counterparts immediately after `:root`
- [x] 1.4 Define typography tokens:
  ```css
  :root {
    --md-sys-typescale-display-large-size:    57px;
    --md-sys-typescale-display-large-line:    64px;
    --md-sys-typescale-headline-large-size:   32px;
    --md-sys-typescale-headline-large-line:   40px;
    --md-sys-typescale-headline-medium-size:  28px;
    --md-sys-typescale-headline-medium-line:  36px;
    --md-sys-typescale-title-large-size:      22px;
    --md-sys-typescale-title-large-line:      28px;
    --md-sys-typescale-title-medium-size:     16px;
    --md-sys-typescale-body-large-size:       16px;
    --md-sys-typescale-body-large-line:       24px;
    --md-sys-typescale-body-medium-size:      14px;
    --md-sys-typescale-label-large-size:      14px;
    --md-sys-typescale-label-medium-size:     12px;
    --md-sys-typescale-font-family:           'Roboto', system-ui, sans-serif;
  }
  ```
- [x] 1.5 Define shape tokens:
  ```css
  :root {
    --md-sys-shape-corner-none:        0px;
    --md-sys-shape-corner-extra-small: 4px;
    --md-sys-shape-corner-small:       8px;
    --md-sys-shape-corner-medium:      12px;
    --md-sys-shape-corner-large:       16px;
    --md-sys-shape-corner-extra-large: 28px;
    --md-sys-shape-corner-full:        9999px;
  }
  ```
- [x] 1.6 Define elevation tokens:
  ```css
  :root {
    --md-sys-elevation-level0: none;
    --md-sys-elevation-level1: 0 1px 2px rgba(0,0,0,.3), 0 1px 3px 1px rgba(0,0,0,.15);
    --md-sys-elevation-level2: 0 1px 2px rgba(0,0,0,.3), 0 2px 6px 2px rgba(0,0,0,.15);
    --md-sys-elevation-level3: 0 4px 8px 3px rgba(0,0,0,.15), 0 1px 3px rgba(0,0,0,.3);
  }
  ```
- [x] 1.7 Add `<link rel="preconnect" href="https://fonts.googleapis.com">` and Roboto import
  `<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">`
  to `src/layouts/base_layout.astro` `<head>` section
- [x] 1.8 Add `<link rel="stylesheet" href="/css/md3-tokens.css">` to `base_layout.astro`
  **before** the existing `<link rel="stylesheet" href="/css/style.css">` line
- [x] 1.9 Run `npm run build` → zero errors (tokens file not yet consumed, no side effects)
- [x] 1.10 Verify browser DevTools shows `--md-sys-color-primary` resolves on any page

---

## Phase 2: Content Schema — today_discovery

**Goal**: Define and validate the `today_discovery` content collection.

- [x] 2.1 Create directory `src/content/today_discovery/` (add `.gitkeep` placeholder file)
- [x] 2.2 Open `src/content.config.js`; add import at top:
  `import { glob } from 'astro/loaders';` (already imported for comic — verify not duplicate)
- [x] 2.3 Add `today_discovery_collection` definition to `src/content.config.js`:
  ```js
  const today_discovery_collection = defineCollection({
    loader: glob({ pattern: '*.md', base: './src/content/today_discovery' }),
    schema: z.object({
      date:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
      title: z.string().min(1),
      image: z.string().startsWith('/images/').optional(),
      tags:  z.array(z.string()).default([]),
    }),
  });
  ```
  > **⚠️ Scale guard:** Pattern is `*.md` (not `**/*.md`) — only loads files directly in the
  > `today_discovery/` root. Archived entries in subdirectories are never loaded at build time.
  > See items 2.9–2.10 for the archival convention.
- [x] 2.4 Export `today_discovery` in the `collections` object:
  `export const collections = { comic: comic_collection, today_discovery: today_discovery_collection };`
- [x] 2.5 Verify file naming convention: `src/content/today_discovery/YYYY-MM-DD.md`
  → Astro glob loader assigns `id` = `YYYY-MM-DD` (filename without `.md`)
- [x] 2.6 Smoke-test schema rejection: create temp `src/content/today_discovery/bad.md` with
  `date: "18-05-2026"` (wrong format), run `npx astro check`, confirm error, delete `bad.md`
- [x] 2.7 Verify `.gitkeep` file does NOT cause schema errors (it will be ignored by glob `*.md`)
- [x] 2.8 Run `npm run test` → all 40 existing tests still GREEN (schema addition is additive)
- [x] 2.9 Create archive directory `src/content/today_discovery/_archive/` (add `.gitkeep`)
  This directory exists so the archival workflow below can be followed without creating the folder ad-hoc.
- [x] 2.10 Document the **Long-Term Archival Convention** in a `src/content/today_discovery/README.md`:
  ```
  ## Archival Convention (prevents Cloudflare Pages build timeout at ~1,000+ entries)
  
  Active entries:  src/content/today_discovery/YYYY-MM-DD.md  (flat root, loaded at build time)
  Archive:         src/content/today_discovery/_archive/YYYY/YYYY-MM-DD.md  (NOT loaded — outside glob '*.md')
  
  When to archive: at the end of each calendar year, move that year's .md files into _archive/YYYY/.
  Trigger:         when 'npm run build' exceeds 5 minutes locally, or CI starts approaching the
                   Cloudflare Pages 20-minute free-tier limit.
  Helper command:  mv src/content/today_discovery/2026-*.md src/content/today_discovery/_archive/2026/
  ```

---

## Phase 3: Fixture Data — today_discovery

**Goal**: Create synthetic fixture entries matching Astro's collection entry shape for `today_discovery`.

- [x] 3.1 Create `src/lib/fixtures/fixture_today_discovery.js`:
  ```js
  // Fixture entries for today_discovery collection tests. Dates are intentionally out of order.
  export const fixture_today_discovery = [
    {
      id: '2026-05-16',
      collection: 'today_discovery',
      data: { date: '2026-05-16', title: 'MD3 elevation insight', tags: ['design'] },
      body: 'Elevation level 1 is enough for cards.',
    },
    {
      id: '2026-05-18',
      collection: 'today_discovery',
      data: { date: '2026-05-18', title: 'Composition trick', tags: ['manga'] },
      body: 'Off-center framing adds tension to panels.',
    },
    {
      id: '2026-05-17',
      collection: 'today_discovery',
      data: { date: '2026-05-17', title: 'Bug fix insight', image: '/images/today/bug.jpg', tags: ['coding'] },
      body: 'The off-by-one was hiding in the sort comparator.',
    },
  ];
  ```
  Note: entries are in **non-chronological order** to prove that sorting logic in helpers works.
- [x] 3.2 Confirm each fixture entry includes: `id`, `collection`, `data.date`, `data.title`,
  `data.tags`, optional `data.image`, `body`
- [x] 3.3 Confirm `data.date` matches `id` for all entries (e.g. id `2026-05-18` → `data.date === '2026-05-18'`)
- [x] 3.4 Confirm entry `2026-05-17` is the ONLY entry with `data.image` set (used in rendering tests)
- [x] 3.5 Confirm entry `2026-05-18` will always be "latest" in sorted output (highest date string)
- [x] 3.6 Confirm entry `2026-05-16` will always be "oldest" in sorted output (lowest date string)

---

## Phase 4: today_discovery Helpers — RED

**Goal**: Write ALL failing tests for `today_discovery.js`. Run `npm run test` after writing
to confirm RED — import errors are not acceptable (create empty `today_discovery.js` first).

- [x] 4.1 Create empty `src/lib/today_discovery.js` with only: `// today_discovery utility functions.`
  (Prevents module-not-found errors during RED phase)
- [x] 4.2 Create `src/lib/today_discovery.test.js` with file-level comment and imports:
  ```js
  // Unit tests for today_discovery.js utility functions. No Astro runtime needed.
  import { describe, it, expect } from 'vitest';
  import { fixture_today_discovery } from './fixtures/fixture_today_discovery.js';
  import {
    get_latest_discovery,
    get_recent_discoveries,
  } from './today_discovery.js';
  ```

#### `get_latest_discovery(entries)`

- [x] 4.3 Test: `get_latest_discovery(fixture_today_discovery)` returns the entry with
  `data.date === '2026-05-18'` (most recent — proves sorting works on unsorted input)
- [x] 4.4 Test: `get_latest_discovery([])` returns `undefined`
- [x] 4.5 Test: result (when non-undefined) has properties `id`, `data.date`, `data.title`, `body`
- [x] 4.6 Test: `get_latest_discovery([fixture_today_discovery[0]])` returns the single entry
  (edge case: array with exactly 1 element)

#### `get_recent_discoveries(entries, n)`

- [x] 4.7 Test: `get_recent_discoveries(fixture_today_discovery, 3)` returns array of length 3
- [x] 4.8 Test: `get_recent_discoveries(fixture_today_discovery, 2)` returns array of length 2
  (n < total — truncation works)
- [x] 4.9 Test: `get_recent_discoveries(fixture_today_discovery, 10)` returns array of length 3
  (n > total — returns all without error)
- [x] 4.10 Test: `get_recent_discoveries([], 5)` returns `[]`
- [x] 4.11 Test: first element of `get_recent_discoveries(fixture_today_discovery, 3)` has
  `data.date === '2026-05-18'` (sorted descending — newest first)
- [x] 4.12 Test: last element of `get_recent_discoveries(fixture_today_discovery, 3)` has
  `data.date === '2026-05-16'` (oldest last)
- [x] 4.13 Test: `get_recent_discoveries(fixture_today_discovery, 3)[0].data.date >
  get_recent_discoveries(fixture_today_discovery, 3)[1].data.date` — string comparison holds
  because YYYY-MM-DD format is lexicographically sortable

- [x] 4.14 Run `npm run test` → **13 new tests RED**, 40 existing tests still GREEN

---

## Phase 5: today_discovery Helpers — GREEN

**Goal**: Implement `src/lib/today_discovery.js` until all Phase 4 tests pass.

- [x] 5.1 Add JSDoc and implement `get_latest_discovery(entries)`:
  ```js
  /**
   * Returns the most recent today_discovery entry by date, or undefined if none.
   * @param {Object[]} entries
   * @returns {Object|undefined}
   */
  export function get_latest_discovery(entries) {
    if (entries.length === 0) return undefined;
    return [...entries].sort((a, b) => b.data.date.localeCompare(a.data.date))[0];
  }
  ```
  Tests 4.3–4.6 GREEN
- [x] 5.2 Add JSDoc and implement `get_recent_discoveries(entries, n)`:
  ```js
  /**
   * Returns up to n today_discovery entries sorted by date descending (newest first).
   * @param {Object[]} entries
   * @param {number} n
   * @returns {Object[]}
   */
  export function get_recent_discoveries(entries, n) {
    return [...entries]
      .sort((a, b) => b.data.date.localeCompare(a.data.date))
      .slice(0, n);
  }
  ```
  Tests 4.7–4.13 GREEN
- [x] 5.3 Run `npm run test` → **all 53 tests GREEN** (40 existing + 13 new)
- [x] 5.4 Refactor for clarity while keeping all 53 GREEN — re-run after each change

---

## Phase 6: Content Schema — works

**Goal**: Define and validate the `works` content collection.

- [x] 6.1 Create directories:
  `src/content/works/games/`, `src/content/works/assets/`,
  `src/content/works/books/`, `src/content/works/projects/`
  (add `.gitkeep` in each)
- [x] 6.2 Add `works_collection` definition to `src/content.config.js`:
  ```js
  const works_collection = defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/works' }),
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
  ```
- [x] 6.3 Add `works` to the `collections` export:
  `export const collections = { comic: comic_collection, today_discovery: today_discovery_collection, works: works_collection };`
- [x] 6.4 Verify `category` enum rejects invalid values: create temp `src/content/works/games/bad.md`
  with `category: "movie"`, run `npx astro check`, confirm error, delete `bad.md`
- [x] 6.5 File naming convention: `src/content/works/{category_dir}/{slug}.md`
  → id = `{category_dir}/{slug}` (e.g. `games/meow-adventure`)
  → `category` in frontmatter must still be set explicitly (id path is informational only)
- [x] 6.6 Run `npm run test` → all 53 tests still GREEN

---

## Phase 7: Fixture Data — works

**Goal**: Create synthetic fixture entries for the `works` collection.

- [x] 7.1 Create `src/lib/fixtures/fixture_works.js`:
  ```js
  // Fixture entries for works collection tests.
  // Note: NO 'project' category entry — intentional, to test has_works(entries, 'project') === false.
  export const fixture_works = [
    {
      id: 'games/meow-adventure',
      collection: 'works',
      data: { title: 'Meow Adventure', category: 'game', description: 'A side-scroller.', tags: ['action'], published_at: '2026-03-01' },
      body: '',
    },
    {
      id: 'games/cat-quiz',
      collection: 'works',
      data: { title: 'Cat Quiz', category: 'game', description: '', tags: [], published_at: '2026-01-15' },
      body: '',
    },
    {
      id: 'assets/cat-pack-vol1',
      collection: 'works',
      data: { title: 'Cat 3D Pack Vol.1', category: 'asset', description: '', tags: ['3d'], published_at: '2026-02-10' },
      body: '',
    },
    {
      id: 'books/dev-diary-vol1',
      collection: 'works',
      data: { title: 'Dev Diary Vol.1', category: 'book', description: '', tags: [], published_at: '2025-12-01' },
      body: '',
    },
  ];
  ```
- [x] 7.2 Confirm 2 `game` entries, 1 `asset` entry, 1 `book` entry, 0 `project` entries
- [x] 7.3 Confirm game entries have distinct `published_at` values (`2026-03-01` and `2026-01-15`)
  so sort order tests are deterministic
- [x] 7.4 Confirm `meow-adventure` (`2026-03-01`) is newer than `cat-quiz` (`2026-01-15`)

---

## Phase 8: works Helpers — RED

**Goal**: Write ALL failing tests for `works.js`.

- [x] 8.1 Create empty `src/lib/works.js` with: `// works utility functions.`
- [x] 8.2 Create `src/lib/works.test.js` with file-level comment and imports:
  ```js
  // Unit tests for works.js utility functions. No Astro runtime needed.
  import { describe, it, expect } from 'vitest';
  import { fixture_works } from './fixtures/fixture_works.js';
  import {
    get_works_by_category,
    has_works,
    get_latest_work,
  } from './works.js';
  ```

#### `get_works_by_category(entries, category)`

- [x] 8.3 Test: `get_works_by_category(fixture_works, 'game')` returns array of length 2
- [x] 8.4 Test: `get_works_by_category(fixture_works, 'asset')` returns array of length 1
- [x] 8.5 Test: `get_works_by_category(fixture_works, 'book')` returns array of length 1
- [x] 8.6 Test: `get_works_by_category(fixture_works, 'project')` returns `[]` (no project entries)
- [x] 8.7 Test: `get_works_by_category([], 'game')` returns `[]`
- [x] 8.8 Test: result for `'game'` is sorted by `published_at` descending — first entry has
  `data.title === 'Meow Adventure'` (`2026-03-01`), second is `'Cat Quiz'` (`2026-01-15`)
- [x] 8.9 Test: every entry in `get_works_by_category(fixture_works, 'game')` has
  `data.category === 'game'` (no cross-category leakage)

#### `has_works(entries, category)`

- [x] 8.10 Test: `has_works(fixture_works, 'game')` → `true`
- [x] 8.11 Test: `has_works(fixture_works, 'asset')` → `true`
- [x] 8.12 Test: `has_works(fixture_works, 'project')` → `false` (no project entries in fixture)
- [x] 8.13 Test: `has_works([], 'game')` → `false`

#### `get_latest_work(entries, category)`

- [x] 8.14 Test: `get_latest_work(fixture_works, 'game')` returns entry with
  `data.title === 'Meow Adventure'` (most recent game by `published_at`)
- [x] 8.15 Test: `get_latest_work(fixture_works, 'project')` returns `undefined`
- [x] 8.16 Test: `get_latest_work([], 'game')` returns `undefined`

- [x] 8.17 Run `npm run test` → **14 new tests RED**, 53 existing tests still GREEN

---

## Phase 9: works Helpers — GREEN

**Goal**: Implement `src/lib/works.js` until all Phase 8 tests pass.

- [x] 9.1 Add JSDoc and implement `get_works_by_category(entries, category)`:
  ```js
  export function get_works_by_category(entries, category) {
    return entries
      .filter(e => e.data.category === category)
      .sort((a, b) => {
        const da = a.data.published_at ?? '';
        const db = b.data.published_at ?? '';
        return db.localeCompare(da);
      });
  }
  ```
  Tests 8.3–8.9 GREEN
- [x] 9.2 Add JSDoc and implement `has_works(entries, category)`:
  ```js
  export function has_works(entries, category) {
    return entries.some(e => e.data.category === category);
  }
  ```
  Tests 8.10–8.13 GREEN
- [x] 9.3 Add JSDoc and implement `get_latest_work(entries, category)`:
  ```js
  export function get_latest_work(entries, category) {
    const list = get_works_by_category(entries, category);
    return list.length > 0 ? list[0] : undefined;
  }
  ```
  Tests 8.14–8.16 GREEN
- [x] 9.4 Run `npm run test` → **all 67 tests GREEN** (40 + 13 + 14)
- [x] 9.5 Refactor while keeping all 67 GREEN

---

## Phase 10: Base Layout Redesign

**Goal**: Update `src/layouts/base_layout.astro` to support MD3 navigation, footer, GA4,
and English-first default language.

- [x] 10.1 Add new props to the frontmatter destructure:
  `const { title, lang = 'en', og_image, current_page = '/' } = Astro.props;`
  Note: `lang` default changes from `'ja'` to `'en'`; all existing pages that pass
  `lang="ja"` explicitly are unaffected
- [x] 10.2 Create build-safe **stub** `src/components/navigation.astro` before importing it
  (Astro is a strict compiler — importing a non-existent file causes a fatal build error;
  the stub satisfies the import so Phase 10 can be verified incrementally):
  ```astro
  ---
  // Navigation stub — full implementation in Phase 11. Do not add logic here.
  const { current_page = '/', lang = 'en' } = Astro.props;
  ---
  <!-- navigation placeholder -->
  ```
  Then add import to `base_layout.astro` frontmatter:
  `import Navigation from '../components/navigation.astro';`
- [x] 10.3 Create build-safe **stub** `src/components/footer.astro` before importing it
  (same reason as 10.2 — stub first, real implementation at step 10.5):
  ```astro
  ---
  // Footer stub — real content added at step 10.5.
  ---
  <!-- footer placeholder -->
  ```
  Then add import to `base_layout.astro` frontmatter:
  `import Footer from '../components/footer.astro';`
- [x] 10.4 Replace `<body><slot /></body>` with the new 3-region layout:
  ```astro
  <body>
    <Navigation current_page={current_page} lang={lang} />
    <main class="md3-page-content">
      <slot />
    </main>
    <Footer />
  </body>
  ```
  Run `npm run build` here → must succeed (stubs satisfy imports; nav/footer are empty but valid)
- [x] 10.5 **Overwrite stub** `src/components/footer.astro` with real content
  (replaces the placeholder created in 10.3):
  ```astro
  ---
  // Site footer: copyright and utility links.
  ---
  <footer class="md3-footer">
    <a href="/about/">About</a>
    <span class="md3-footer-sep">·</span>
    <a href="mailto:hello@meowtoon.com">Contact</a>
    <span class="md3-footer-copy">© 2026 STUDIO MeowToon</span>
  </footer>
  ```
- [x] 10.6 Add GA4 script block (conditional on env var) in `<head>`:
  ```astro
  {import.meta.env.PUBLIC_GA4_ID && (
    <>
      <script async src={`https://www.googletagmanager.com/gtag/js?id=${import.meta.env.PUBLIC_GA4_ID}`}></script>
      <script is:inline define:vars={{ ga4_id: import.meta.env.PUBLIC_GA4_ID }}>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', ga4_id);
      </script>
    </>
  )}
  ```
- [x] 10.7 Verify `PUBLIC_GA4_ID` is NOT set in `.env` or any committed file
  (set only in Cloudflare Pages dashboard environment variables)
- [x] 10.8 Verify OGP tags still render correctly after restructure (check `og:title`, `og:image`)
- [x] 10.9 Verify `lang` prop still flows to `<html lang={lang}>` (unchanged)

---

## Phase 11: Navigation Component (MD3)

**Goal**: Create `src/components/navigation.astro` implementing MD3 bar / rail / drawer.

- [x] 11.1 Create `src/components/navigation.astro` with file-level comment:
  `// MD3 navigation component: renders bar (mobile), rail (tablet), or drawer (desktop) via CSS breakpoints only.`
- [x] 11.2 Define props:
  `const { current_page = '/', lang = 'ja' } = Astro.props;`
- [x] 11.3 Define nav items array in the component frontmatter (replace D3 values when decided):
  ```js
  const nav_items = [
    { icon: '🏠', label: 'Home',  href: '/' },
    { icon: '📖', label: 'Manga', href: `/${lang}/comic/` },
    { icon: '🎨', label: 'Works', href: '/works/' },
    { icon: '👤', label: 'About', href: '/about/' },
  ];
  ```
  Note: Manga href uses `lang` prop — **never hardcoded to `/ja/`**.
- [x] 11.4 Write helper: `const is_active = (href) => current_page === href || current_page.startsWith(href) && href !== '/';`
- [x] 11.5 HTML structure — three sibling `<nav>` elements, CSS shows only the correct one:
  ```astro
  <!-- Mobile: Navigation Bar -->
  <nav class="md3-nav-bar" aria-label="Main navigation">
    {nav_items.map(item => (
      <a href={item.href} class={`md3-nav-bar-item ${is_active(item.href) ? 'active' : ''}`}>
        <span class="md3-nav-icon">{item.icon}</span>
        <span class="md3-nav-label">{item.label}</span>
      </a>
    ))}
  </nav>

  <!-- Tablet: Navigation Rail -->
  <nav class="md3-nav-rail" aria-label="Main navigation">
    {nav_items.map(item => (
      <a href={item.href} class={`md3-nav-rail-item ${is_active(item.href) ? 'active' : ''}`}>
        <span class="md3-nav-icon">{item.icon}</span>
        <span class="md3-nav-label">{item.label}</span>
      </a>
    ))}
  </nav>

  <!-- Desktop: Navigation Drawer -->
  <nav class="md3-nav-drawer" aria-label="Main navigation">
    <div class="md3-nav-drawer-header">STUDIO MeowToon</div>
    {nav_items.map(item => (
      <a href={item.href} class={`md3-nav-drawer-item ${is_active(item.href) ? 'active' : ''}`}>
        <span class="md3-nav-icon">{item.icon}</span>
        <span class="md3-nav-label">{item.label}</span>
      </a>
    ))}
  </nav>
  ```
- [x] 11.6 Add `<style>` block to the component (scoped):
  ```css
  /* Mobile: show bar, hide rail + drawer */
  .md3-nav-rail, .md3-nav-drawer { display: none; }
  .md3-nav-bar {
    display: flex;
    position: fixed; bottom: 0; left: 0; right: 0; z-index: 100;
    height: 80px;
    background: var(--md-sys-color-surface);
    border-top: 1px solid var(--md-sys-color-outline-variant);
    justify-content: space-around;
    align-items: center;
  }

  /* Tablet */
  @media (min-width: 601px) {
    .md3-nav-bar { display: none; }
    .md3-nav-rail {
      display: flex;
      flex-direction: column;
      position: fixed; top: 0; left: 0; bottom: 0; z-index: 100;
      width: 80px;
      background: var(--md-sys-color-surface);
      border-right: 1px solid var(--md-sys-color-outline-variant);
      padding-top: 12px;
      align-items: center;
      gap: 4px;
    }
  }

  /* Desktop */
  @media (min-width: 1241px) {
    .md3-nav-rail { display: none; }
    .md3-nav-drawer {
      display: flex;
      flex-direction: column;
      position: fixed; top: 0; left: 0; bottom: 0; z-index: 100;
      width: 280px;
      background: var(--md-sys-color-surface);
      border-right: 1px solid var(--md-sys-color-outline-variant);
      padding: 16px 0;
      gap: 2px;
    }
  }
  ```
- [x] 11.7 Add active state CSS for each nav variant (`.active` class):
  ```css
  .md3-nav-bar-item.active,
  .md3-nav-rail-item.active,
  .md3-nav-drawer-item.active {
    color: var(--md-sys-color-primary);
    background: var(--md-sys-color-secondary-container);
    border-radius: var(--md-sys-shape-corner-full);
  }
  ```
- [x] 11.8 Verify in browser DevTools: at width ≤ 600px, only `.md3-nav-bar` is visible
- [x] 11.9 Verify in browser DevTools: at width 601–1240px, only `.md3-nav-rail` is visible
- [x] 11.10 Verify in browser DevTools: at width ≥ 1241px, only `.md3-nav-drawer` is visible
- [x] 11.11 Verify active state on homepage: Home item has `active` class; Manga item does not
- [x] 11.12 Verify active state on `/ja/comic/everyday/`: Manga item has `active` class
- [x] 11.13 Verify Manga link is `/${lang}/comic/` — check rendered HTML in page source
- [x] 11.14 Run `npm run build` → zero errors, all pages generate

---

## Phase 12: Slot Components (Reactions & Comments)

**Goal**: Create empty slot components that reserve DOM positions for Phase 2/3 features.

- [x] 12.1 Create `src/components/reactions_slot.astro`:
  ```astro
  ---
  // Phase 1: reserved slot for Phase 2 Reactions feature (❤️ 🔥 ✨ 👀).
  // display:none preserves DOM anchor without affecting layout or accessibility.
  ---
  <div id="reactions-slot" style="display:none;" aria-hidden="true"></div>
  ```
- [x] 12.2 Create `src/components/comments_slot.astro`:
  ```astro
  ---
  // Phase 1: reserved slot for Phase 3 Comments feature.
  // display:none preserves DOM anchor without affecting layout or accessibility.
  ---
  <div id="comments-slot" style="display:none;" aria-hidden="true"></div>
  ```
- [x] 12.3 Verify each component file renders only the empty `<div>` — no visible output
- [x] 12.4 Verify `aria-hidden="true"` is present (slots must not interfere with screen readers)
- [x] 12.5 Note: these components are placed inside the episode detail page in Phase 18;
  they are created here first so Phase 18 can import them without forward-dependency

---

## Phase 13: Responsive CSS Layout

**Goal**: Update `public/css/style.css` to use MD3 tokens and implement the 3-column layout
offset for the navigation component.

- [x] 13.1 Add content offset rules to `public/css/style.css`:
  ```css
  /* Mobile: lift content above fixed nav bar */
  .md3-page-content { padding-bottom: 88px; }

  /* Tablet: shift content right of nav rail */
  @media (min-width: 601px) {
    .md3-page-content { padding-bottom: 0; margin-left: 80px; }
  }

  /* Desktop: shift content right of nav drawer */
  @media (min-width: 1241px) {
    .md3-page-content { margin-left: 280px; }
  }
  ```
- [x] 13.2 Add MD3 Card base class:
  ```css
  .md3-card {
    background: var(--md-sys-color-surface-variant);
    border-radius: var(--md-sys-shape-corner-medium);
    box-shadow: var(--md-sys-elevation-level1);
    padding: 16px;
  }
  .md3-card-elevated {
    background: var(--md-sys-color-surface);
    box-shadow: var(--md-sys-elevation-level2);
  }
  ```
- [x] 13.3 Add MD3 Typography utility classes:
  ```css
  .md3-display-large { font-size: var(--md-sys-typescale-display-large-size); line-height: var(--md-sys-typescale-display-large-line); }
  .md3-headline-large { font-size: var(--md-sys-typescale-headline-large-size); line-height: var(--md-sys-typescale-headline-large-line); }
  .md3-headline-medium { font-size: var(--md-sys-typescale-headline-medium-size); }
  .md3-title-large { font-size: var(--md-sys-typescale-title-large-size); }
  .md3-body-large { font-size: var(--md-sys-typescale-body-large-size); line-height: var(--md-sys-typescale-body-large-line); }
  .md3-label-large { font-size: var(--md-sys-typescale-label-large-size); }
  ```
- [x] 13.4 Add MD3 Button base classes:
  ```css
  .md3-btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 24px;
    border-radius: var(--md-sys-shape-corner-full); font-size: var(--md-sys-typescale-label-large-size);
    font-weight: 500; text-decoration: none; cursor: pointer; border: none; }
  .md3-btn-filled { background: var(--md-sys-color-primary); color: var(--md-sys-color-on-primary); }
  .md3-btn-tonal  { background: var(--md-sys-color-secondary-container); color: var(--md-sys-color-on-secondary-container); }
  .md3-btn-outlined { background: transparent; border: 1px solid var(--md-sys-color-outline); color: var(--md-sys-color-primary); }
  ```
- [x] 13.5 Add MD3 footer styles:
  ```css
  .md3-footer { padding: 24px 16px; display: flex; gap: 16px; align-items: center;
    border-top: 1px solid var(--md-sys-color-outline-variant); flex-wrap: wrap;
    font-size: var(--md-sys-typescale-body-medium-size); color: var(--md-sys-color-on-surface-variant); }
  .md3-footer a { color: var(--md-sys-color-primary); text-decoration: none; }
  .md3-footer-copy { margin-left: auto; }
  ```
- [x] 13.6 Set global base styles using tokens:
  ```css
  body {
    font-family: var(--md-sys-typescale-font-family);
    background: var(--md-sys-color-background);
    color: var(--md-sys-color-on-background);
    margin: 0;
  }
  a { color: var(--md-sys-color-primary); }
  ```
- [x] 13.7 Run `npm run dev` → spot-check that nav bar appears on mobile, page content offset works
- [x] 13.8 Run `npm run build` → zero errors

---

## Phase 14: Landing Page Redesign

**Goal**: Full rewrite of `src/pages/index.astro` with all 5 sections.
Resolve D2 (catchphrase) before finalizing Hero copy; use placeholder `"One creator. Every day."` until then.

- [x] 14.1 Open `src/pages/index.astro`; replace entire content
- [x] 14.2 Add frontmatter imports:
  ```js
  import { getCollection } from 'astro:content';
  import BaseLayout from '../layouts/base_layout.astro';
  import { build_top_page_data } from '../lib/comic.js';
  import { get_latest_discovery } from '../lib/today_discovery.js';
  import { has_works, get_latest_work } from '../lib/works.js';
  ```
- [x] 14.3 Fetch all collections in frontmatter:
  ```js
  const comic_entries        = await getCollection('comic');
  const discovery_entries    = await getCollection('today_discovery');
  const works_entries        = await getCollection('works');
  const series_list          = build_top_page_data(comic_entries);
  const latest_discovery     = get_latest_discovery(discovery_entries);
  const works_categories     = ['game', 'asset', 'book', 'project'];
  ```
- [x] 14.4 Pass `current_page="/"` to `<BaseLayout>`:
  `<BaseLayout title="Home" lang="en" current_page="/">`
- [x] 14.5 **Section 1 — Hero:**
  ```astro
  <section class="md3-hero">
    <h1 class="md3-headline-large">One creator. Every day.</h1>
    <p class="md3-body-large">Games · Manga · 3D Assets · Books · Projects</p>
  </section>
  ```
  Replace `"One creator. Every day."` with D2 value when decided.
- [x] 14.6 **Section 2 — Today's Discovery (conditional):**
  ```astro
  {latest_discovery && (
    <section class="md3-section">
      <h2 class="md3-title-large">Today's Discovery <span class="md3-ephemeral-badge">🔴 Ephemeral</span></h2>
      <div class="md3-card">
        <time class="md3-label-large">{latest_discovery.data.date}</time>
        <h3>{latest_discovery.data.title}</h3>
        <p class="md3-body-large">{latest_discovery.body}</p>
        {latest_discovery.data.image && <img src={latest_discovery.data.image} alt={latest_discovery.data.title} loading="lazy">}
      </div>
      <a href="/today/" class="md3-btn md3-btn-outlined">See archive →</a>
    </section>
  )}
  ```
- [x] 14.7 **Section 3 — Latest Manga (always shown):**
  ```astro
  <section class="md3-section">
    <h2 class="md3-title-large">Manga</h2>
    <div class="md3-card-grid">
      {series_list.map(s => (
        <a href={s.href} class="md3-card md3-card-series">
          <img src={s.cover_src} alt={s.display_title} loading="lazy">
          <span class="md3-title-large">{s.display_title}</span>
        </a>
      ))}
    </div>
  </section>
  ```
- [x] 14.8 **Section 4 — Works (per-category conditional):**
  ```astro
  {works_categories.some(cat => has_works(works_entries, cat)) && (
    <section class="md3-section">
      <h2 class="md3-title-large">Works</h2>
      <div class="md3-card-grid">
        {has_works(works_entries, 'game')    && <a href="/games/"   class="md3-card">🎮 Games</a>}
        {has_works(works_entries, 'asset')   && <a href="/assets/"  class="md3-card">🎲 3D Assets</a>}
        {has_works(works_entries, 'book')    && <a href="/books/"   class="md3-card">📚 Books</a>}
        {has_works(works_entries, 'project') && <a href="/projects/" class="md3-card">💻 Projects</a>}
      </div>
    </section>
  )}
  ```
- [ ] 14.9 Verify Today's Discovery section is **absent** from rendered HTML when `discovery_entries` is empty
  (temporarily remove `.gitkeep` and check, then restore)
- [x] 14.10 Verify Works section is **absent** when no works entries exist
- [x] 14.11 Verify Works section shows only categories with `has_works === true`
- [x] 14.12 Add CSS for landing page sections to `public/css/style.css`:
  ```css
  .md3-section { padding: 24px 16px; max-width: 1200px; margin: 0 auto; }
  .md3-hero { padding: 48px 16px; text-align: center; }
  .md3-card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; margin-top: 16px; }
  .md3-card-series img { width: 100%; border-radius: var(--md-sys-shape-corner-medium); }
  .md3-ephemeral-badge { color: var(--md-sys-color-error); font-size: var(--md-sys-typescale-label-medium-size); margin-left: 8px; }
  ```
- [x] 14.13 Run `npm run build` → zero errors; verify `/index.html` in `dist/`

---

## Phase 15: About Page

**Goal**: Create `src/pages/about.astro` — required for launch per 企画書 v6 §16.

- [x] 15.1 Create `src/pages/about.astro`:
  ```astro
  ---
  import BaseLayout from '../layouts/base_layout.astro';
  ---
  <BaseLayout title="About" lang="en" current_page="/about/">
    <div class="md3-section">
      <h1 class="md3-headline-large">About</h1>
      <div class="md3-card">
        <h2 class="md3-title-large">STUDIO MeowToon</h2>
        <p class="md3-body-large">One creator. Every day.</p>
        <!-- TODO: add creator bio, links, contact -->
      </div>
    </div>
  </BaseLayout>
  ```
- [ ] 15.2 Add creator name, brief bio (1–2 sentences), and social links before launch
- [ ] 15.3 Add contact info (email or form link)
- [x] 15.4 Verify `current_page="/about/"` causes the About nav item to show `active` state
- [x] 15.5 Run `npm run build` → verify `/about/index.html` exists in `dist/`

---

## Phase 16: Today's Discovery Archive Page

**Goal**: Create `/today/` listing the latest 30 discoveries.

- [x] 16.1 Create `src/pages/today/index.astro`:
  ```astro
  ---
  import { getCollection } from 'astro:content';
  import BaseLayout from '../../layouts/base_layout.astro';
  import { get_recent_discoveries } from '../../lib/today_discovery.js';
  const all_entries = await getCollection('today_discovery');
  const discoveries = get_recent_discoveries(all_entries, 30);
  ---
  <BaseLayout title="Today's Discovery" lang="en" current_page="/today/">
    <div class="md3-section">
      <h1 class="md3-headline-large">Today's Discovery</h1>
      {discoveries.length === 0 && <p class="md3-body-large">No discoveries yet.</p>}
      {discoveries.map(d => (
        <div class="md3-card" style="margin-bottom: 16px;">
          <time class="md3-label-large">{d.data.date}</time>
          <h2 class="md3-title-large">{d.data.title}</h2>
          <p class="md3-body-large">{d.body}</p>
          {d.data.image && <img src={d.data.image} alt={d.data.title} loading="lazy">}
        </div>
      ))}
    </div>
  </BaseLayout>
  ```
- [x] 16.2 Verify "No discoveries yet." message shows when collection is empty
- [x] 16.3 Verify entries are shown newest-first (Phase 5 guarantees sort order)
- [x] 16.4 Run `npm run build` → verify `/today/index.html` in `dist/`

---

## Phase 17: Works Pages (Structure)

**Goal**: Create works listing pages. Each page shows content if it exists; shows a
friendly "coming soon" message if no content for that category. No empty-looking broken UI.

- [x] 17.1 Create `src/pages/works/index.astro` — overview of all categories:
  ```astro
  ---
  import { getCollection } from 'astro:content';
  import BaseLayout from '../../layouts/base_layout.astro';
  import { has_works } from '../../lib/works.js';
  const works_entries = await getCollection('works');
  ---
  <BaseLayout title="Works" lang="en" current_page="/works/">
    <div class="md3-section">
      <h1 class="md3-headline-large">Works</h1>
      <div class="md3-card-grid">
        {has_works(works_entries, 'game')    && <a href="/games/"    class="md3-card">🎮 Games</a>}
        {has_works(works_entries, 'asset')   && <a href="/assets/"   class="md3-card">🎲 3D Assets</a>}
        {has_works(works_entries, 'book')    && <a href="/books/"    class="md3-card">📚 Books</a>}
        {has_works(works_entries, 'project') && <a href="/projects/" class="md3-card">💻 Projects</a>}
        {['game','asset','book','project'].every(c => !has_works(works_entries, c)) && (
          <p class="md3-body-large">Works coming soon.</p>
        )}
      </div>
    </div>
  </BaseLayout>
  ```
- [x] 17.2 Create `src/pages/games/index.astro`, `src/pages/assets/index.astro`,
  `src/pages/books/index.astro`, `src/pages/projects/index.astro` —
  each using the same pattern: fetch works, filter by category, render list or "coming soon"
- [x] 17.3 Verify each category page shows "coming soon" when no works entries exist for that category
- [x] 17.4 Run `npm run build` → verify all 5 works pages exist in `dist/`

---

## Phase 18: Manga Pages — MD3 Reskin

**Goal**: Apply MD3 tokens to all manga pages and place slot components in episode detail.

### `src/pages/[lang]/comic/[series]/index.astro` (Series Episode List)

- [x] 18.1 Wrap episode list in `<div class="md3-section">`
- [x] 18.2 Series heading: add class `md3-headline-large`
- [x] 18.3 Episode list items: replace inline styles with `md3-card` class
- [x] 18.4 Pass `current_page={`/${lang}/comic/`}` to `<BaseLayout>`

### `src/pages/[lang]/comic/[series]/[episode]/index.astro` (Episode Detail)

- [x] 18.5 Import slot components:
  ```js
  import ReactionsSlot from '../../../../components/reactions_slot.astro';
  import CommentsSlot  from '../../../../components/comments_slot.astro';
  ```
- [x] 18.6 Place `<ReactionsSlot />` immediately after the panel images block
- [x] 18.7 Place `<CommentsSlot />` immediately after `<ReactionsSlot />`
- [x] 18.8 Verify rendered HTML contains `<div id="reactions-slot"` and `<div id="comments-slot"`
  with `display:none` and `aria-hidden="true"` — confirm no visible effect
- [x] 18.9 Pass `current_page={`/${lang}/comic/`}` to `<BaseLayout>` (Manga nav item active)
- [x] 18.10 Episode title: add class `md3-title-large`
- [x] 18.11 Episode description: add class `md3-body-large`
- [x] 18.12 Panel images: `<img>` tags keep `width="100%"` (existing), add `loading="lazy"`

### `src/components/episode_nav.astro` (Prev/List/Next Navigation)

- [x] 18.13 Replace emoji labels with English text + MD3 button styling:
  - `◀️ Prev` → `← Previous` with class `md3-btn md3-btn-outlined`
  - `⤴️ List` → `All Episodes` with class `md3-btn md3-btn-tonal`
  - `Next ▶️` → `Next →` with class `md3-btn md3-btn-outlined`
- [x] 18.14 Preserve the exact DOM structure: `{prev}` → `{list}` → `{next}` (3 children, no reordering)
  The existing inline JS uses `.hugo-nav a:first-child` and `.hugo-nav a:last-child` —
  changing element order would break swipe and keyboard navigation.
- [x] 18.15 Verify swipe navigation still works on mobile (existing `touchstart`/`touchend` script)
- [x] 18.16 Verify keyboard navigation still works on desktop (existing `keydown` script)
- [x] 18.17 Run `npm run build` → all 193+ episode pages still generate without error
- [x] 18.18 Run `npm run test` → all 67 tests still GREEN (no utility function changes)

---

## Phase 19: 404 Page — MD3 Reskin

**Goal**: Apply MD3 styling to the existing `src/pages/404.astro` and fix the language
context problem — the static `/404.html` is always served regardless of which language path
the user was on, so the nav's Manga link would otherwise incorrectly point to `/en/comic/`
for a Japanese user who typo'd a `/ja/comic/...` URL.

- [x] 19.1 Open `src/pages/404.astro`; add `current_page="/404/"` prop to `<BaseLayout>`
  Leave `lang="en"` (default) as the server-side prop — client-side correction is in 19.6.
- [x] 19.2 Apply MD3 typography: heading class `md3-headline-large`, body class `md3-body-large`
- [x] 19.3 Replace `<a href="/">⤴️ Top</a>` with `<a href="/" class="md3-btn md3-btn-filled">← Back to Home</a>`
- [x] 19.4 Wrap content in `<div class="md3-section">`
- [x] 19.5 Make the body copy **bilingual** (Japanese + English) so no user feels linguistically
  abandoned regardless of what the client-side script detects:
  ```astro
  <h1 class="md3-headline-large">404 — Page Not Found</h1>
  <p class="md3-body-large">
    お探しのページは見つかりませんでした。<br>
    The page you're looking for doesn't exist.
  </p>
  ```
- [x] 19.6 Add a `<script is:inline>` **at the bottom of 404.astro's `<body>`** that patches the
  Navigation's Manga link based on where the user came from (fixes the language context
  without any server-side logic):
  ```html
  <script is:inline>
  // Repair nav Manga link language context on 404: base_layout renders lang="en" by default,
  // but the user may have arrived from a /ja/ URL. Patch client-side from referrer or navigator.
  document.addEventListener('DOMContentLoaded', function () {
    var ref_lang = (document.referrer.match(/\/(ja|en)\//) || [])[1];
    var nav_lang = ref_lang || (navigator.language.startsWith('ja') ? 'ja' : 'en');
    document.querySelectorAll('a[href*="/en/comic/"], a[href*="/ja/comic/"]').forEach(function (el) {
      el.href = el.href.replace(/\/(ja|en)\/comic\//, '/' + nav_lang + '/comic/');
    });
  });
  </script>
  ```
  Detection priority: `document.referrer` URL path → `navigator.language` fallback.
  This means a Japanese user who typo'd a `/ja/comic/` URL will see the Manga nav link
  correctly pointing to `/ja/comic/` instead of `/en/comic/`.
- [x] 19.7 Verify in browser: visit `/404` by typing a non-existent `/ja/comic/fakepage/` URL →
  confirm the Manga nav link in the 404 page's navigation points to `/ja/comic/` (not `/en/comic/`)
- [x] 19.8 Run `npm run build` → verify `dist/404.html` exists and does not have `hugo-header` class

---

## Phase 20: Analytics Integration

**Goal**: Connect GA4; verify Cloudflare Web Analytics is active.

- [ ] 20.1 Create a GA4 property at analytics.google.com → obtain Measurement ID (`G-XXXXXXXXXX`)
- [ ] 20.2 In Cloudflare Pages dashboard → Settings → Environment variables → add:
  `PUBLIC_GA4_ID = G-XXXXXXXXXX` (Production environment only)
- [ ] 20.3 Verify the GA4 script in `base_layout.astro` (added in Phase 10.6) is correct:
  `import.meta.env.PUBLIC_GA4_ID` — Astro exposes env vars prefixed with `PUBLIC_` to the client
- [ ] 20.4 In local dev (no `PUBLIC_GA4_ID` set): verify GA4 script block is absent from HTML
  (`curl http://localhost:4321` should not contain `googletagmanager`)
- [ ] 20.5 In production: verify `<script async src="https://www.googletagmanager.com/gtag/js...">` present
- [ ] 20.6 Cloudflare Web Analytics: enable via Cloudflare Pages dashboard → Analytics tab
  (no code changes required — cookie-free, active automatically)
- [ ] 20.7 Confirm analytics both tools are tracking after first deploy

---

## Phase 21: Pre-launch Content

**Goal**: Ensure minimum launch content is in place per 企画書 v6 §16.

- [ ] 21.1 Write first `today_discovery` post:
  create `src/content/today_discovery/YYYY-MM-DD.md` with today's date,
  `date: YYYY-MM-DD`, `title: "..."`, and 1–3 sentences of discovery body
- [ ] 21.2 Run `npm run dev` → verify Today's Discovery card appears on homepage
- [ ] 21.3 Verify Today's Discovery card shows date, title, body correctly
- [ ] 21.4 Confirm at least 1 quality-checked manga episode is in `src/content/comic/ja/`
  (all 193 are already migrated; "quality-checked" = author has reviewed for publication)
- [ ] 21.5 Complete About page content: add real creator bio, social links, contact info (Phase 15.2–15.3)
- [ ] 21.6 Run `npm run test` → all 67 tests GREEN
- [ ] 21.7 Run `npm run build` → zero errors

---

## Phase 22: Final Build & Deploy Verification

**Goal**: Full end-to-end check before public launch.

- [ ] 22.1 Run `npm run build` → confirm build succeeds with zero errors
- [ ] 22.2 Run `npm run preview` → spot-check all pages at `http://localhost:4321`
- [ ] 22.3 Mobile check (Chrome DevTools 375px): Navigation Bar visible at bottom, content offset correct,
  Today's Discovery card readable, Manga section shows series covers, swipe navigation works on episode page
- [ ] 22.4 Tablet check (Chrome DevTools 768px): Navigation Rail visible on left, content offset 80px,
  layout not broken
- [ ] 22.5 Desktop check (Chrome DevTools 1440px): Navigation Drawer visible on left at 280px,
  content offset correct, About nav item links correctly
- [ ] 22.6 Verify no empty sections visible anywhere (Works section should be hidden — no works content yet)
- [ ] 22.7 Verify no broken links: all nav hrefs resolve to existing pages
- [ ] 22.8 Verify `<div id="reactions-slot">` and `<div id="comments-slot">` present in episode
  page HTML but invisible (open browser DevTools Elements panel to confirm)
- [ ] 22.9 Push to GitHub → Cloudflare Pages build starts automatically
- [ ] 22.10 Verify deployed site at `meowtoon.com`: Today's Discovery card, Manga section,
  navigation bar on mobile — all functional

---

## File Change Summary

### New files

```
public/css/md3-tokens.css
src/components/navigation.astro
src/components/footer.astro
src/components/reactions_slot.astro          (Phase 2 placeholder)
src/components/comments_slot.astro           (Phase 3 placeholder)
src/content/today_discovery/                 (directory + .gitkeep)
src/content/works/games/                     (directory + .gitkeep)
src/content/works/assets/                    (directory + .gitkeep)
src/content/works/books/                     (directory + .gitkeep)
src/content/works/projects/                  (directory + .gitkeep)
src/lib/today_discovery.js
src/lib/today_discovery.test.js
src/lib/works.js
src/lib/works.test.js
src/lib/fixtures/fixture_today_discovery.js
src/lib/fixtures/fixture_works.js
src/pages/about.astro
src/pages/today/index.astro
src/pages/works/index.astro
src/pages/games/index.astro
src/pages/assets/index.astro
src/pages/books/index.astro
src/pages/projects/index.astro
```

### Modified files

```
public/css/style.css                              MD3 tokens + responsive layout offsets
src/content.config.js                             add today_discovery + works collections
src/layouts/base_layout.astro                     Navigation + Footer + GA4 + lang=en default + current_page prop
src/pages/index.astro                             full landing page redesign
src/pages/[lang]/comic/[series]/index.astro       MD3 reskin
src/pages/[lang]/comic/[series]/[episode]/index.astro  MD3 reskin + slot components
src/components/episode_nav.astro                  MD3 button styling + EN labels (DOM structure preserved)
src/pages/404.astro                               MD3 reskin
```

---

## Future Phases (not in this plan)

| Phase | Trigger | Additions |
|---|---|---|
| **Phase 2** | Repeat visitor rate ≥ 30% OR avg session time ≥ 3 min | Go API (Cloud Run) + Firestore + Reactions (❤️ 🔥 ✨ 👀) wired to `#reactions-slot` |
| **Phase 3** | Comment demand confirmed | OAuth: Google / X / Instagram / Anonymous + Turnstile + Comments wired to `#comments-slot` |
| **Phase 4** | Fan retention confirmed | Dashboard: creator view + fan view + badges + influence score |

Phase 2 API design is **intentionally deferred** to Phase 2 — no pre-designed endpoints in Phase 1.

---

*develop_plan_v2.md · 2026-05-18 · 22 phases · 188 checklist items · TDD RED/GREEN fully separated*
*Based on 企画書 v6 · Gemini 3.1 Pro review incorporated*
```

## FILE: package.json

```json
{
  "name": "studio-meowtoon",
  "type": "module",
  "version": "0.0.1",
  "scripts": {
    "dev":             "astro dev",
    "build":           "astro build",
    "preview":         "astro preview",
    "test":            "vitest run",
    "migrate:content": "node scripts/migrate_content.mjs",
    "migrate:images":  "node scripts/migrate_images.mjs"
  },
  "dependencies": {
    "astro": "^5.0.0",
    "@astrojs/sitemap": "^3.0.0"
  },
  "devDependencies": {
    "vitest": "^2.0.0",
    "gray-matter": "^4.0.3",
    "fast-glob": "^3.3.0"
  }
}
```

## FILE: public\css\md3-tokens.css

```css
/* Material Design 3 design tokens — generated from seed color. Replace placeholder values after D1 resolution. */

:root {
  --md-sys-color-primary:              #8B4513;
  --md-sys-color-on-primary:           #FFFFFF;
  --md-sys-color-primary-container:    #FFDBC9;
  --md-sys-color-on-primary-container: #340F00;
  --md-sys-color-secondary:            #765849;
  --md-sys-color-on-secondary:         #FFFFFF;
  --md-sys-color-secondary-container:  #FFDBC9;
  --md-sys-color-on-secondary-container: #2C160B;
  --md-sys-color-surface:              #FFF8F6;
  --md-sys-color-on-surface:           #221A17;
  --md-sys-color-surface-variant:      #F4DED7;
  --md-sys-color-on-surface-variant:   #52443F;
  --md-sys-color-outline:              #85736D;
  --md-sys-color-outline-variant:      #D7C2BB;
  --md-sys-color-error:                #BA1A1A;
  --md-sys-color-on-error:             #FFFFFF;
  --md-sys-color-background:           #FFF8F6;
  --md-sys-color-on-background:        #221A17;
}

@media (prefers-color-scheme: dark) {
  :root {
    --md-sys-color-primary:              #FFB59A;
    --md-sys-color-on-primary:           #531E00;
    --md-sys-color-primary-container:    #742E00;
    --md-sys-color-on-primary-container: #FFDBC9;
    --md-sys-color-secondary:            #E6BEAE;
    --md-sys-color-on-secondary:         #432B1E;
    --md-sys-color-secondary-container:  #5C4132;
    --md-sys-color-on-secondary-container: #FFDBC9;
    --md-sys-color-surface:              #1A110E;
    --md-sys-color-on-surface:           #F0DEDA;
    --md-sys-color-surface-variant:      #52443F;
    --md-sys-color-on-surface-variant:   #D7C2BB;
    --md-sys-color-outline:              #A08C85;
    --md-sys-color-outline-variant:      #52443F;
    --md-sys-color-error:                #FFB4AB;
    --md-sys-color-on-error:             #690005;
    --md-sys-color-background:           #1A110E;
    --md-sys-color-on-background:        #F0DEDA;
  }
}

:root {
  --md-sys-typescale-display-large-size:    57px;
  --md-sys-typescale-display-large-line:    64px;
  --md-sys-typescale-headline-large-size:   32px;
  --md-sys-typescale-headline-large-line:   40px;
  --md-sys-typescale-headline-medium-size:  28px;
  --md-sys-typescale-headline-medium-line:  36px;
  --md-sys-typescale-title-large-size:      22px;
  --md-sys-typescale-title-large-line:      28px;
  --md-sys-typescale-title-medium-size:     16px;
  --md-sys-typescale-body-large-size:       16px;
  --md-sys-typescale-body-large-line:       24px;
  --md-sys-typescale-body-medium-size:      14px;
  --md-sys-typescale-label-large-size:      14px;
  --md-sys-typescale-label-medium-size:     12px;
  --md-sys-typescale-font-family: system-ui, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
}

:root {
  --md-sys-shape-corner-none:        0px;
  --md-sys-shape-corner-extra-small: 4px;
  --md-sys-shape-corner-small:       8px;
  --md-sys-shape-corner-medium:      12px;
  --md-sys-shape-corner-large:       16px;
  --md-sys-shape-corner-extra-large: 28px;
  --md-sys-shape-corner-full:        9999px;
}

:root {
  --md-sys-elevation-level0: none;
  --md-sys-elevation-level1: 0 1px 2px rgba(0,0,0,.3), 0 1px 3px 1px rgba(0,0,0,.15);
  --md-sys-elevation-level2: 0 1px 2px rgba(0,0,0,.3), 0 2px 6px 2px rgba(0,0,0,.15);
  --md-sys-elevation-level3: 0 4px 8px 3px rgba(0,0,0,.15), 0 1px 3px rgba(0,0,0,.3);
}
```

## FILE: public\css\style.css

```css
/* Comic reader styles: .hugo-* classes are still actively used by
   src/pages/[lang]/comic/[series]/[episode]/index.astro and components.
   DO NOT remove. Font-size values use rem units relative to html breakpoints below. */
.hugo-images p {
  margin: 0 !important;
  padding: 0 !important;
  display: block !important;
  width: 100vw !important;
  box-sizing: border-box !important;
}
.hugo-images {
  width: 100vw !important;
  margin: 0 !important;
  padding: 0 !important;
  box-sizing: border-box !important;
}
.hugo-images img {
  display: block !important;
  width: 100vw !important;
  max-width: 100vw !important;
  height: auto !important;
  margin: 0 !important;
  border: none !important;
  box-sizing: border-box !important;
  background:#ffff !important;
  object-fit: cover !important;
  padding-top: 0;
  padding-bottom: 0;
}
body {
  font-family: var(--md-sys-typescale-font-family);
  background: var(--md-sys-color-background);
  color: var(--md-sys-color-on-background);
  margin: 0 !important;
  padding: 0 !important;
  touch-action: pan-y;
}
a { color: var(--md-sys-color-primary); }

/* PC用 */
html { font-size: 30px; }
body { font-size: 1rem; }
.hugo-header { font-size: 1rem;}
.hugo-series { font-size: 1rem;}
.hugo-episode { font-size: 1rem;}
.hugo-title { font-size: 1rem;}
.hugo-description { font-size: 0.75rem;}
.hugo-list { font-size: 1rem; }
.hugo-images img {
  padding-top: 1rem;
  padding-bottom: 1rem;
}

/* タブレット用 */
@media (max-width: 900px) {
  html { font-size: 26px; }
  body { font-size: 1rem; }
  .hugo-header { font-size: 1rem; }
  .hugo-series { font-size: 1rem; }
  .hugo-episode { font-size: 1rem; }
  .hugo-title { font-size: 1rem; }
  .hugo-description { font-size: 0.75rem; }
  .hugo-list { font-size: 1rem; }
  .hugo-images img {
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
  }
}

/* スマホ用 */
@media (max-width: 600px) {
  html { font-size: 16px; }
  body { font-size: 1rem; }
  .hugo-header { font-size: 1rem; }
  .hugo-series { font-size: 1rem; }
  .hugo-episode { font-size: 1rem; }
  .hugo-title { font-size: 1rem; }
  .hugo-description { font-size: 0.75rem; }
  .hugo-list { font-size: 1rem; }
  .hugo-images img {
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
  }
}

/* --- MD3 Layout --- */

/* Mobile: lift content and footer above fixed nav bar */
.md3-page-content { padding-bottom: 88px; }
.md3-footer       { padding-bottom: 96px; }

/* Tablet: shift content and footer right of nav rail */
@media (min-width: 601px) {
  .md3-page-content { padding-bottom: 0; margin-left: 80px; }
  .md3-footer       { padding-bottom: 0; margin-left: 80px; }
}

/* Desktop: shift content and footer right of nav drawer */
@media (min-width: 1241px) {
  .md3-page-content { margin-left: 280px; }
  .md3-footer       { margin-left: 280px; }
}

/* MD3 Card */
.md3-card {
  background: var(--md-sys-color-surface-variant);
  border-radius: var(--md-sys-shape-corner-medium);
  box-shadow: var(--md-sys-elevation-level1);
  padding: 16px;
}
.md3-card-elevated {
  background: var(--md-sys-color-surface);
  box-shadow: var(--md-sys-elevation-level2);
}

/* MD3 Typography */
.md3-display-large  { font-size: var(--md-sys-typescale-display-large-size);   line-height: var(--md-sys-typescale-display-large-line); }
.md3-headline-large { font-size: var(--md-sys-typescale-headline-large-size);  line-height: var(--md-sys-typescale-headline-large-line); }
.md3-headline-medium { font-size: var(--md-sys-typescale-headline-medium-size); }
.md3-title-large    { font-size: var(--md-sys-typescale-title-large-size); }
.md3-body-large     { font-size: var(--md-sys-typescale-body-large-size);      line-height: var(--md-sys-typescale-body-large-line); }
.md3-label-large    { font-size: var(--md-sys-typescale-label-large-size); }

/* MD3 Buttons */
.md3-btn {
  display: inline-flex; align-items: center; gap: 8px; padding: 10px 24px;
  border-radius: var(--md-sys-shape-corner-full);
  font-size: var(--md-sys-typescale-label-large-size);
  font-weight: 500; text-decoration: none; cursor: pointer; border: none;
}
.md3-btn-filled   { background: var(--md-sys-color-primary); color: var(--md-sys-color-on-primary); }
.md3-btn-tonal    { background: var(--md-sys-color-secondary-container); color: var(--md-sys-color-on-secondary-container); }
.md3-btn-outlined { background: transparent; border: 1px solid var(--md-sys-color-outline); color: var(--md-sys-color-primary); }

/* MD3 Footer */
.md3-footer {
  padding: 24px 16px; display: flex; gap: 16px; align-items: center;
  border-top: 1px solid var(--md-sys-color-outline-variant); flex-wrap: wrap;
  font-size: var(--md-sys-typescale-body-medium-size); color: var(--md-sys-color-on-surface-variant);
}
.md3-footer a { color: var(--md-sys-color-primary); text-decoration: none; }
.md3-footer-copy { margin-left: auto; }

/* MD3 Sections & Landing */
.md3-section    { padding: 24px 16px; max-width: 1200px; margin: 0 auto; }
.md3-hero       { padding: 48px 16px; text-align: center; }
.md3-card-grid  { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; margin-top: 16px; }
.md3-card-series img { width: 100%; border-radius: var(--md-sys-shape-corner-medium); }
.md3-ephemeral-badge { color: var(--md-sys-color-error); font-size: var(--md-sys-typescale-label-medium-size); margin-left: 8px; }

```

## FILE: README.md

```markdown
# studio-meowtoon

A static Japanese comic website for STUDIO MeowToon.
Built with **Astro v5** (static output). Deployed to **Cloudflare Pages** via GitHub push.

---

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Start local dev server at `http://localhost:4321` |
| `npm run build` | Build static site to `dist/` |
| `npm run preview` | Preview built site at `http://localhost:4321` |
| `npm run test` | Run all unit tests (Vitest) |

## Deploy

Push to the `develop` branch → Cloudflare Pages automatically builds and deploys.

Build command: `npm run build`
Output directory: `dist`

## Project Structure

```
studio-meowtoon/
├── src/
│   ├── content/
│   │   └── comic/
│   │       └── ja/
│   │           ├── everyday/    ← 96 episode .md files
│   │           ├── storyboard/  ← 96 episode .md files
│   │           └── lusiphite/   ← 1 episode .md file
│   ├── lib/
│   │   ├── comic.js             ← utility + page helper functions
│   │   ├── comic.test.js        ← 40 unit tests
│   │   ├── series_meta.js       ← series titles, covers, order
│   │   └── fixtures/
│   │       └── fixture_entries.js
│   ├── layouts/
│   │   └── base_layout.astro    ← base HTML + OGP
│   ├── components/
│   │   └── episode_nav.astro    ← prev/list/next navigation
│   ├── pages/
│   │   ├── index.astro
│   │   ├── 404.astro
│   │   └── [lang]/comic/[series]/
│   │       ├── index.astro           ← series list
│   │       └── [episode]/index.astro ← episode page
│   └── content.config.js        ← Astro v5 content collection schema
├── public/
│   ├── css/style.css
│   └── images/
│       ├── comic/               ← 772 episode images
│       └── works/               ← series cover images
├── docs/
│   ├── develop_plan_v1.md       ← full migration plan
│   └── adr.md                   ← architecture decision records
└── specs/
    └── app_spec.md
```

## How to Add a New Episode

1. Create `src/content/comic/ja/{series}/{episode_id}.md` with frontmatter:
   ```yaml
   ---
   title: "Episode title in Japanese"
   episode: "097"
   description: "Optional description."
   images:
     - /images/comic/ja/{series}/097/cut-1.jpg
     - /images/comic/ja/{series}/097/cut-2.jpg
     - /images/comic/ja/{series}/097/cut-3.jpg
     - /images/comic/ja/{series}/097/cut-4.jpg
   ---
   ```
2. Add images to `public/images/comic/ja/{series}/{episode_id}/`
3. Run `npm run build` to verify, then push to GitHub to deploy.
```

## FILE: specs\app_spec.md

```markdown
# studio-meowtoon Application Specification

## Overview

This project is a static Japanese comic website for STUDIO MeowToon.
Built with **Astro v5** (static output). Deployed to **Cloudflare Pages** via GitHub push.

---

## Directory Structure

```
studio-meowtoon/
├── .git/
├── .gitignore
├── .node-version           ← Node.js version pin (20)
├── README.md
├── astro.config.mjs        ← Astro config (static, sitemap, trailingSlash)
├── package.json
├── vitest.config.mjs
├── vs.code-workspace
├── src/
│   ├── content/
│   │   └── comic/
│   │       └── ja/
│   │           ├── everyday/    ← 96 episode Markdown files
│   │           ├── storyboard/  ← 96 episode Markdown files
│   │           └── lusiphite/   ← 1 episode Markdown file
│   ├── content.config.js        ← Astro v5 Content Layer API schema
│   ├── lib/
│   │   ├── comic.js             ← 10 utility + page helper functions
│   │   ├── comic.test.js        ← 40 Vitest unit tests
│   │   ├── series_meta.js       ← series display metadata (constants)
│   │   └── fixtures/
│   │       └── fixture_entries.js
│   ├── layouts/
│   │   └── base_layout.astro    ← base HTML layout, OGP meta tags
│   ├── components/
│   │   └── episode_nav.astro    ← prev / list / next navigation
│   └── pages/
│       ├── index.astro
│       ├── 404.astro
│       └── [lang]/comic/[series]/
│           ├── index.astro           ← series episode list
│           └── [episode]/index.astro ← episode detail page
├── public/
│   ├── css/style.css            ← responsive stylesheet
│   └── images/
│       ├── comic/               ← 772 episode panel images
│       │   └── ja/{series}/{episode_id}/cut-N.jpg
│       └── works/               ← series cover images
├── dist/                        ← Astro build output (198 pages)
├── docs/
│   ├── develop_plan_v1.md       ← full 16-phase migration plan
│   └── adr.md                   ← architecture decision records
└── specs/
    └── app_spec.md              ← this file
```

---

## Implemented Features

- Static site generation with Astro v5
- Japanese comic content (3 series, 193 episodes total)
- Episode Markdown files with frontmatter: `title`, `episode`, `description`, `images`
- Content validated via Zod schema (Content Layer API)
- Top page: series list with cover images
- Series list page: all episodes in ascending order
- Episode detail page: panel images, description, prev/list/next navigation
- Swipe navigation (mobile: right=prev, left=next)
- Keyboard navigation (desktop: ←=prev, →=next)
- OGP / Twitter Card meta tags (dynamic per page)
- Custom 404 page
- Sitemap (`sitemap-index.xml`)
- Responsive design (mobile-first CSS)

---

## Content Schema

Each episode `.md` file (`src/content/comic/ja/{series}/{episode_id}.md`):

```yaml
---
title: "Japanese episode title"
episode: "001"          # 3-digit zero-padded string
description: ""         # optional, may contain Japanese, emoji
images:
  - /images/comic/ja/{series}/{episode_id}/cut-1.jpg
  - /images/comic/ja/{series}/{episode_id}/cut-2.jpg
  - /images/comic/ja/{series}/{episode_id}/cut-3.jpg
  - /images/comic/ja/{series}/{episode_id}/cut-4.jpg
---
```

---

## Page Routes

| URL | Page |
|---|---|
| `/` | Top page — 3 series |
| `/ja/comic/{series}/` | Series episode list |
| `/ja/comic/{series}/{episode}/` | Episode detail |
| `/404` | Custom 404 page |

---

## How to Add a New Episode

1. Create `src/content/comic/ja/{series}/{episode_id}.md` with the schema above
2. Add images to `public/images/comic/ja/{series}/{episode_id}/`
3. Run `npm run build` to verify, then push to GitHub to deploy

---

## Testing

- Framework: Vitest
- Test files: `src/lib/comic.test.js` (40 tests)
- Convention: TDD (Red first), snake_case, single-responsibility functions
- Run: `npm run test`

```

## FILE: src\components\comments_slot.astro

```astro
---
// Phase 1: reserved slot for Phase 3 Comments feature.
// display:none preserves DOM anchor without affecting layout or accessibility.
---
<div id="comments-slot" style="display:none;" aria-hidden="true"></div>
```

## FILE: src\components\episode_nav.astro

```astro
---
// Episode navigation component: prev/list/next links for the comic reader.
// IMPORTANT: DOM structure must match .hugo-nav a:first-child / a:last-child selectors in inline script.
const { prev_href, next_href, list_href } = Astro.props;
---
<div class="hugo-nav" style="display:flex;gap:12px;justify-content:center;margin-top:2em;">
  {prev_href
    ? <a href={prev_href} class="md3-btn md3-btn-outlined">← Previous</a>
    : <span style="visibility:hidden;" class="md3-btn md3-btn-outlined">← Previous</span>
  }
  <a href={list_href} class="md3-btn md3-btn-tonal">All Episodes</a>
  {next_href
    ? <a href={next_href} class="md3-btn md3-btn-outlined">Next →</a>
    : <span style="visibility:hidden;" class="md3-btn md3-btn-outlined">Next →</span>
  }
</div>
```

## FILE: src\components\footer.astro

```astro
---
// Site footer: copyright and utility links.
---
<footer class="md3-footer">
  <a href="/about/">About</a>
  <span class="md3-footer-sep">·</span>
  <a href="/about/#contact">Contact</a>
  <span class="md3-footer-copy">© 2026 STUDIO MeowToon</span>
</footer>
```

## FILE: src\components\navigation.astro

```astro
---
// MD3 navigation component: renders bar (mobile), rail (tablet), or drawer (desktop) via CSS breakpoints only.
const { current_page = '/' } = Astro.props;

const nav_items = [
  { icon: '🏠', label: 'Home',  href: '/' },
  { icon: '📖', label: 'Manga', href: '/ja/comic/' },
  { icon: '🎨', label: 'Works', href: '/works/' },
  { icon: '👤', label: 'About', href: '/about/' },
];

const is_active = (href) => current_page === href || (href !== '/' && current_page.startsWith(href));
---

<!-- Mobile: Navigation Bar -->
<nav class="md3-nav-bar" aria-label="Main navigation">
  {nav_items.map(item => (
    <a href={item.href} class={`md3-nav-bar-item ${is_active(item.href) ? 'active' : ''}`}>
      <span class="md3-nav-icon">{item.icon}</span>
      <span class="md3-nav-label">{item.label}</span>
    </a>
  ))}
</nav>

<!-- Tablet: Navigation Rail -->
<nav class="md3-nav-rail" aria-label="Main navigation">
  {nav_items.map(item => (
    <a href={item.href} class={`md3-nav-rail-item ${is_active(item.href) ? 'active' : ''}`}>
      <span class="md3-nav-icon">{item.icon}</span>
      <span class="md3-nav-label">{item.label}</span>
    </a>
  ))}
</nav>

<!-- Desktop: Navigation Drawer -->
<nav class="md3-nav-drawer" aria-label="Main navigation">
  <div class="md3-nav-drawer-header">STUDIO MeowToon</div>
  {nav_items.map(item => (
    <a href={item.href} class={`md3-nav-drawer-item ${is_active(item.href) ? 'active' : ''}`}>
      <span class="md3-nav-icon">{item.icon}</span>
      <span class="md3-nav-label">{item.label}</span>
    </a>
  ))}
</nav>

<style>
  /* Mobile: show bar, hide rail + drawer */
  .md3-nav-rail, .md3-nav-drawer { display: none; }
  .md3-nav-bar {
    display: flex;
    position: fixed; bottom: 0; left: 0; right: 0; z-index: 100;
    height: 80px;
    background: var(--md-sys-color-surface);
    border-top: 1px solid var(--md-sys-color-outline-variant);
    justify-content: space-around;
    align-items: center;
  }

  /* Tablet */
  @media (min-width: 601px) {
    .md3-nav-bar { display: none; }
    .md3-nav-rail {
      display: flex;
      flex-direction: column;
      position: fixed; top: 0; left: 0; bottom: 0; z-index: 100;
      width: 80px;
      background: var(--md-sys-color-surface);
      border-right: 1px solid var(--md-sys-color-outline-variant);
      padding-top: 12px;
      align-items: center;
      gap: 4px;
    }
  }

  /* Desktop */
  @media (min-width: 1241px) {
    .md3-nav-rail { display: none; }
    .md3-nav-drawer {
      display: flex;
      flex-direction: column;
      position: fixed; top: 0; left: 0; bottom: 0; z-index: 100;
      width: 280px;
      background: var(--md-sys-color-surface);
      border-right: 1px solid var(--md-sys-color-outline-variant);
      padding: 16px 0;
      gap: 2px;
    }
  }

  .md3-nav-bar-item,
  .md3-nav-rail-item,
  .md3-nav-drawer-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 8px 12px;
    text-decoration: none;
    color: var(--md-sys-color-on-surface-variant);
    font-size: var(--md-sys-typescale-label-medium-size);
    border-radius: var(--md-sys-shape-corner-full);
  }

  .md3-nav-drawer-item {
    flex-direction: row;
    gap: 12px;
    padding: 12px 24px;
    border-radius: var(--md-sys-shape-corner-full);
    margin: 0 8px;
    font-size: var(--md-sys-typescale-label-large-size);
  }

  .md3-nav-drawer-header {
    padding: 16px 24px;
    font-size: var(--md-sys-typescale-title-large-size);
    font-weight: 700;
    color: var(--md-sys-color-on-surface);
    margin-bottom: 8px;
  }

  .md3-nav-bar-item.active,
  .md3-nav-rail-item.active,
  .md3-nav-drawer-item.active {
    color: var(--md-sys-color-primary);
    background: var(--md-sys-color-secondary-container);
    border-radius: var(--md-sys-shape-corner-full);
  }

  .md3-nav-icon { font-size: 20px; }
</style>
```

## FILE: src\components\reactions_slot.astro

```astro
---
// Phase 1: reserved slot for Phase 2 Reactions feature (❤️ 🔥 ✨ 👀).
// display:none preserves DOM anchor without affecting layout or accessibility.
---
<div id="reactions-slot" style="display:none;" aria-hidden="true"></div>
```

## FILE: src\content.config.js

```javascript
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

export const collections = { comic: comic_collection, today_discovery: today_discovery_collection, works: works_collection };
```

## FILE: src\layouts\base_layout.astro

```astro
---
// Base HTML layout providing <html>, <head>, <body> wrapper for all page types.
// Props: title (required), lang (default 'en'), og_image (optional), current_page (for nav active state).
import Navigation from '../components/navigation.astro';
import Footer from '../components/footer.astro';
const { title, lang = 'en', og_image, current_page = '/' } = Astro.props;
const page_title = `${title} | STUDIO MeowToon`;
// import.meta.env.DEV is true in dev/preview mode; Astro.site is ALWAYS set (from astro.config.mjs)
// even during local dev — so Astro.site ?? Astro.url.origin never falls back. Use DEV flag instead.
const base_url = import.meta.env.DEV ? Astro.url.origin : Astro.site;
const og_image_abs = og_image ? new URL(og_image, base_url).href : undefined;
const og_url = new URL(Astro.url.pathname, base_url).href;
---
<!DOCTYPE html>
<html lang={lang}>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{page_title}</title>
  <meta property="og:title" content={page_title}>
  <meta property="og:type" content="website">
  <meta property="og:url" content={og_url}>
  <meta property="og:site_name" content="STUDIO MeowToon">
  {og_image_abs && <meta property="og:image" content={og_image_abs}>}
  {og_image_abs && <meta name="twitter:card" content="summary_large_image">}
  <link rel="stylesheet" href="/css/md3-tokens.css">
  <link rel="stylesheet" href="/css/style.css">
  {import.meta.env.PUBLIC_GA4_ID && (
    <>
      <script async src={`https://www.googletagmanager.com/gtag/js?id=${import.meta.env.PUBLIC_GA4_ID}`}></script>
      <script is:inline define:vars={{ ga4_id: import.meta.env.PUBLIC_GA4_ID }}>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', ga4_id);
      </script>
    </>
  )}
</head>
<body>
  <Navigation current_page={current_page} />
  <main class="md3-page-content">
    <slot />
  </main>
  <Footer />
</body>
</html>
```

## FILE: src\lib\comic.js

```javascript
// Utility functions for comic content access and page data building.
// All functions accept a pre-fetched entries array (D1 — pure, testable, no Astro runtime).

import { series_titles, series_covers, top_page_series } from './series_meta.js';

/**
 * Parses a collection entry id into its lang/series/episode_id components.
 * @param {string} entry_id - e.g. 'ja/everyday/001'
 * @returns {{ lang: string, series: string, episode_id: string }}
 */
export function parse_entry_id(entry_id) {
  const [lang, series, episode_id] = entry_id.split('/');
  return { lang, series, episode_id };
}

/**
 * Returns a sorted list of unique series slugs for a given language.
 * @param {Object[]} entries - Astro collection entries
 * @param {string} lang
 * @returns {string[]}
 */
export function get_series_list(entries, lang) {
  const slugs = entries
    .map(e => parse_entry_id(e.id))
    .filter(p => p.lang === lang)
    .map(p => p.series);
  return [...new Set(slugs)].sort();
}

/**
 * Returns all episodes for a lang/series combination, sorted ascending by episode field.
 * @param {Object[]} entries
 * @param {string} lang
 * @param {string} series
 * @returns {Object[]}
 */
export function get_all_episodes(entries, lang, series) {
  return entries
    .filter(e => {
      const p = parse_entry_id(e.id);
      return p.lang === lang && p.series === series;
    })
    .sort((a, b) => a.data.episode < b.data.episode ? -1 : a.data.episode > b.data.episode ? 1 : 0);
}

/**
 * Returns the single entry matching lang/series/episode_id, or undefined if not found.
 * @param {Object[]} entries
 * @param {string} lang
 * @param {string} series
 * @param {string} episode_id
 * @returns {Object|undefined}
 */
export function get_episode(entries, lang, series, episode_id) {
  return entries.find(e => e.id === `${lang}/${series}/${episode_id}`);
}

/**
 * Returns the previous episode in the series, or null if current is first.
 * @param {Object[]} entries
 * @param {string} lang
 * @param {string} series
 * @param {string} episode_id
 * @returns {Object|null}
 */
export function get_prev_episode(entries, lang, series, episode_id) {
  const eps = get_all_episodes(entries, lang, series);
  const idx = eps.findIndex(e => e.data.episode === episode_id);
  return idx > 0 ? eps[idx - 1] : null;
}

/**
 * Returns the next episode in the series, or null if current is last.
 * @param {Object[]} entries
 * @param {string} lang
 * @param {string} series
 * @param {string} episode_id
 * @returns {Object|null}
 */
export function get_next_episode(entries, lang, series, episode_id) {
  const eps = get_all_episodes(entries, lang, series);
  const idx = eps.findIndex(e => e.data.episode === episode_id);
  return idx >= 0 && idx < eps.length - 1 ? eps[idx + 1] : null;
}

/**
 * Builds the data array for the top page — one item per series in top_page_series order.
 * @param {Object[]} entries
 * @returns {{ series: string, display_title: string, href: string, cover_src: string }[]}
 */
export function build_top_page_data(entries) {
  return top_page_series.map(slug => ({
    series:        slug,
    display_title: series_titles[slug],
    href:          `/ja/comic/${slug}/`,
    cover_src:     series_covers[slug],
  }));
}

/**
 * Builds getStaticPaths output for the series list page.
 * @param {Object[]} entries
 * @returns {{ params: { lang: string, series: string } }[]}
 */
export function build_series_paths(entries) {
  const seen = new Set();
  const result = [];
  for (const e of entries) {
    const { lang, series } = parse_entry_id(e.id);
    const key = `${lang}/${series}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push({ params: { lang, series } });
    }
  }
  return result;
}

/**
 * Builds getStaticPaths output for the episode page.
 * ⚠️ Must call parse_entry_id(entry.id) to extract lang/series — they are NOT in outer scope.
 * @param {Object[]} entries
 * @returns {{ params: { lang: string, series: string, episode: string } }[]}
 */
export function build_episode_paths(entries) {
  return entries.map(entry => {
    const { lang, series } = parse_entry_id(entry.id);
    return { params: { lang, series, episode: entry.data.episode } };
  });
}

/**
 * Builds prev/next/list hrefs for episode navigation.
 * @param {Object[]} entries
 * @param {string} lang
 * @param {string} series
 * @param {string} episode_id
 * @returns {{ prev_href: string|null, next_href: string|null, list_href: string }}
 */
export function build_episode_nav(entries, lang, series, episode_id) {
  const prev = get_prev_episode(entries, lang, series, episode_id);
  const next = get_next_episode(entries, lang, series, episode_id);
  const list_href  = `/${lang}/comic/${series}/`;
  const prev_href  = prev ? `/${lang}/comic/${series}/${prev.data.episode}/` : null;
  const next_href  = next ? `/${lang}/comic/${series}/${next.data.episode}/` : null;
  return { prev_href, next_href, list_href };
}
```

## FILE: src\lib\comic.test.js

```javascript
// Unit tests for comic.js utility functions. Uses fixture data — no Astro runtime needed.
import { describe, it, expect } from 'vitest';
import { fixture_entries } from './fixtures/fixture_entries.js';
import { top_page_series, series_titles, series_covers } from './series_meta.js';
import {
  parse_entry_id,
  get_series_list,
  get_all_episodes,
  get_episode,
  get_prev_episode,
  get_next_episode,
  build_top_page_data,
  build_series_paths,
  build_episode_paths,
  build_episode_nav,
} from './comic.js';

// --- parse_entry_id ---

describe('parse_entry_id', () => {
  it('parses ja/everyday/001 correctly', () => {
    expect(parse_entry_id('ja/everyday/001')).toEqual({ lang: 'ja', series: 'everyday', episode_id: '001' });
  });

  it('parses ja/storyboard/096 correctly', () => {
    expect(parse_entry_id('ja/storyboard/096')).toEqual({ lang: 'ja', series: 'storyboard', episode_id: '096' });
  });

  it('result has exactly keys lang, series, episode_id', () => {
    const result = parse_entry_id('ja/everyday/001');
    expect(Object.keys(result).sort()).toEqual(['episode_id', 'lang', 'series']);
  });
});

// --- get_series_list ---

describe('get_series_list', () => {
  it('returns unique sorted series for ja', () => {
    expect(get_series_list(fixture_entries, 'ja')).toEqual(['everyday', 'lusiphite', 'storyboard']);
  });

  it('returns empty array for en (no en entries in fixture)', () => {
    expect(get_series_list(fixture_entries, 'en')).toEqual([]);
  });

  it('returns empty array for empty entries', () => {
    expect(get_series_list([], 'ja')).toEqual([]);
  });
});

// --- get_all_episodes ---

describe('get_all_episodes', () => {
  it('returns 3 entries for ja/everyday', () => {
    expect(get_all_episodes(fixture_entries, 'ja', 'everyday')).toHaveLength(3);
  });

  it('returns entries sorted ascending by episode', () => {
    const eps = get_all_episodes(fixture_entries, 'ja', 'everyday');
    expect(eps[0].data.episode).toBe('001');
    expect(eps[eps.length - 1].data.episode).toBe('003');
  });

  it('returns empty array for unknown series', () => {
    expect(get_all_episodes(fixture_entries, 'ja', 'unknown')).toEqual([]);
  });

  it('returns empty array for empty entries', () => {
    expect(get_all_episodes([], 'ja', 'everyday')).toEqual([]);
  });
});

// --- get_episode ---

describe('get_episode', () => {
  it('returns entry with matching id', () => {
    const entry = get_episode(fixture_entries, 'ja', 'everyday', '001');
    expect(entry.id).toBe('ja/everyday/001');
  });

  it('returns undefined for non-existent episode', () => {
    expect(get_episode(fixture_entries, 'ja', 'everyday', '999')).toBeUndefined();
  });

  it('data.episode matches episode_id param (D9 verification)', () => {
    const entry = get_episode(fixture_entries, 'ja', 'everyday', '001');
    expect(entry.data.episode).toBe('001');
  });
});

// --- get_prev_episode ---

describe('get_prev_episode', () => {
  it('returns episode 002 as prev of 003', () => {
    const prev = get_prev_episode(fixture_entries, 'ja', 'everyday', '003');
    expect(prev.data.episode).toBe('002');
  });

  it('returns null for first episode (001)', () => {
    expect(get_prev_episode(fixture_entries, 'ja', 'everyday', '001')).toBeNull();
  });

  it('returns null for first episode in storyboard', () => {
    expect(get_prev_episode(fixture_entries, 'ja', 'storyboard', '001')).toBeNull();
  });
});

// --- get_next_episode ---

describe('get_next_episode', () => {
  it('returns episode 002 as next of 001', () => {
    const next = get_next_episode(fixture_entries, 'ja', 'everyday', '001');
    expect(next.data.episode).toBe('002');
  });

  it('returns null for last episode (003)', () => {
    expect(get_next_episode(fixture_entries, 'ja', 'everyday', '003')).toBeNull();
  });

  it('returns null for only episode in lusiphite', () => {
    expect(get_next_episode(fixture_entries, 'ja', 'lusiphite', '001')).toBeNull();
  });
});

// --- build_top_page_data ---

describe('build_top_page_data', () => {
  it('returns array of length top_page_series.length', () => {
    expect(build_top_page_data(fixture_entries)).toHaveLength(top_page_series.length);
  });

  it('first item has shape { series, display_title, href, cover_src }', () => {
    const item = build_top_page_data(fixture_entries)[0];
    expect(item).toHaveProperty('series');
    expect(item).toHaveProperty('display_title');
    expect(item).toHaveProperty('href');
    expect(item).toHaveProperty('cover_src');
  });

  it('everyday item has correct href', () => {
    const item = build_top_page_data(fixture_entries).find(i => i.series === 'everyday');
    expect(item.href).toBe('/ja/comic/everyday/');
  });

  it('everyday item has correct display_title', () => {
    const item = build_top_page_data(fixture_entries).find(i => i.series === 'everyday');
    expect(item.display_title).toBe('Everyday');
  });

  it('everyday item has correct cover_src', () => {
    const item = build_top_page_data(fixture_entries).find(i => i.series === 'everyday');
    expect(item.cover_src).toBe('/images/works/everyday.jpg');
  });

  it('order matches top_page_series constant', () => {
    const result = build_top_page_data(fixture_entries);
    expect(result.map(i => i.series)).toEqual(top_page_series);
  });
});

// --- build_series_paths ---

describe('build_series_paths', () => {
  it('returns array with { params: { lang, series } } shape', () => {
    const result = build_series_paths(fixture_entries);
    expect(result[0]).toHaveProperty('params');
    expect(result[0].params).toHaveProperty('lang');
    expect(result[0].params).toHaveProperty('series');
  });

  it('returns 3 unique paths with fixture data', () => {
    const result = build_series_paths(fixture_entries);
    expect(result).toHaveLength(3);
    const pairs = result.map(r => `${r.params.lang}/${r.params.series}`);
    expect(pairs).toContain('ja/everyday');
    expect(pairs).toContain('ja/storyboard');
    expect(pairs).toContain('ja/lusiphite');
  });

  it('no duplicate lang/series pairs', () => {
    const result = build_series_paths(fixture_entries);
    const pairs = result.map(r => `${r.params.lang}/${r.params.series}`);
    expect(new Set(pairs).size).toBe(pairs.length);
  });

  it('returns empty array for empty entries', () => {
    expect(build_series_paths([])).toEqual([]);
  });
});

// --- build_episode_paths ---

describe('build_episode_paths', () => {
  it('returns array with { params: { lang, series, episode } } shape', () => {
    const result = build_episode_paths(fixture_entries);
    expect(result[0].params).toHaveProperty('lang');
    expect(result[0].params).toHaveProperty('series');
    expect(result[0].params).toHaveProperty('episode');
  });

  it('result length equals fixture entry count', () => {
    expect(build_episode_paths(fixture_entries)).toHaveLength(fixture_entries.length);
  });

  it('every item has lang=ja and valid series (catches missing parse_entry_id bug)', () => {
    const result = build_episode_paths(fixture_entries);
    const valid_series = ['everyday', 'storyboard', 'lusiphite'];
    for (const item of result) {
      expect(item.params.lang).toBe('ja');
      expect(valid_series).toContain(item.params.series);
    }
  });

  it('episode param equals entry.data.episode (D9 verification)', () => {
    const result = build_episode_paths(fixture_entries);
    for (let i = 0; i < result.length; i++) {
      expect(result[i].params.episode).toBe(fixture_entries[i].data.episode);
    }
  });

  it('returns empty array for empty entries', () => {
    expect(build_episode_paths([])).toEqual([]);
  });
});

// --- build_episode_nav ---

describe('build_episode_nav', () => {
  it('middle episode 002 returns correct prev/next/list hrefs', () => {
    const nav = build_episode_nav(fixture_entries, 'ja', 'everyday', '002');
    expect(nav).toEqual({
      prev_href: '/ja/comic/everyday/001/',
      next_href: '/ja/comic/everyday/003/',
      list_href: '/ja/comic/everyday/',
    });
  });

  it('first episode 001 has prev_href null', () => {
    const nav = build_episode_nav(fixture_entries, 'ja', 'everyday', '001');
    expect(nav.prev_href).toBeNull();
  });

  it('last episode 003 has next_href null', () => {
    const nav = build_episode_nav(fixture_entries, 'ja', 'everyday', '003');
    expect(nav.next_href).toBeNull();
  });

  it('list_href always has trailing slash', () => {
    const nav = build_episode_nav(fixture_entries, 'ja', 'everyday', '002');
    expect(nav.list_href).toMatch(/\/$/);
  });

  it('prev_href and next_href (when non-null) have trailing slash', () => {
    const nav = build_episode_nav(fixture_entries, 'ja', 'everyday', '002');
    expect(nav.prev_href).toMatch(/\/$/);
    expect(nav.next_href).toMatch(/\/$/);
  });

  it('single-episode series (lusiphite/001) has both prev_href and next_href null', () => {
    const nav = build_episode_nav(fixture_entries, 'ja', 'lusiphite', '001');
    expect(nav.prev_href).toBeNull();
    expect(nav.next_href).toBeNull();
  });
});
```

## FILE: src\lib\fixtures\fixture_entries.js

```javascript
// Synthetic fixture entries matching Astro v5 getCollection() return shape.
// Used by all unit tests in comic.test.js — no Astro runtime required.

/**
 * @typedef {Object} FixtureEntry
 * @property {string} id
 * @property {string} collection
 * @property {{ title: string, episode: string, description: string, images: string[] }} data
 * @property {string} body
 */

/** @type {FixtureEntry[]} */
export const fixture_entries = [
  {
    id:         'ja/everyday/001',
    collection: 'comic',
    data: {
      title:       'fixture title 001',
      episode:     '001',
      description: '',
      images:      ['/images/comic/ja/everyday/001/cut-1.jpg'],
    },
    body: '',
  },
  {
    id:         'ja/everyday/002',
    collection: 'comic',
    data: {
      title:       'fixture title 002',
      episode:     '002',
      description: 'middle episode desc',
      images:      ['/images/comic/ja/everyday/002/cut-1.jpg'],
    },
    body: '',
  },
  {
    id:         'ja/everyday/003',
    collection: 'comic',
    data: {
      title:       'fixture title 003',
      episode:     '003',
      description: 'last everyday desc',
      images:      ['/images/comic/ja/everyday/003/cut-1.jpg'],
    },
    body: '',
  },
  {
    id:         'ja/storyboard/001',
    collection: 'comic',
    data: {
      title:       'storyboard title 001',
      episode:     '001',
      description: 'storyboard desc',
      images:      ['/images/comic/ja/storyboard/001/name-1.jpg'],
    },
    body: '',
  },
  {
    id:         'ja/storyboard/002',
    collection: 'comic',
    data: {
      title:       'storyboard title 002',
      episode:     '002',
      description: 'storyboard desc 002',
      images:      ['/images/comic/ja/storyboard/002/name-1.jpg'],
    },
    body: '',
  },
  {
    id:         'ja/lusiphite/001',
    collection: 'comic',
    data: {
      title:       'lusiphite title 001',
      episode:     '001',
      description: 'lusiphite desc',
      images:      ['/images/comic/ja/lusiphite/001/cut-1.jpg'],
    },
    body: '',
  },
];
```

## FILE: src\lib\fixtures\fixture_today_discovery.js

```javascript
// Fixture entries for today_discovery collection tests. Dates are intentionally out of order.
export const fixture_today_discovery = [
  {
    id: '2026-05-16',
    collection: 'today_discovery',
    data: { date: '2026-05-16', title: 'MD3 elevation insight', tags: ['design'] },
    body: 'Elevation level 1 is enough for cards.',
  },
  {
    id: '2026-05-18',
    collection: 'today_discovery',
    data: { date: '2026-05-18', title: 'Composition trick', tags: ['manga'] },
    body: 'Off-center framing adds tension to panels.',
  },
  {
    id: '2026-05-17',
    collection: 'today_discovery',
    data: { date: '2026-05-17', title: 'Bug fix insight', image: '/images/today/bug.jpg', tags: ['coding'] },
    body: 'The off-by-one was hiding in the sort comparator.',
  },
];
```

## FILE: src\lib\fixtures\fixture_works.js

```javascript
// Fixture entries for works collection tests.
// Note: NO 'project' category entry — intentional, to test has_works(entries, 'project') === false.
export const fixture_works = [
  {
    id: 'games/meow-adventure',
    collection: 'works',
    data: { title: 'Meow Adventure', category: 'game', description: 'A side-scroller.', tags: ['action'], published_at: '2026-03-01' },
    body: '',
  },
  {
    id: 'games/cat-quiz',
    collection: 'works',
    data: { title: 'Cat Quiz', category: 'game', description: '', tags: [], published_at: '2026-01-15' },
    body: '',
  },
  {
    id: 'assets/cat-pack-vol1',
    collection: 'works',
    data: { title: 'Cat 3D Pack Vol.1', category: 'asset', description: '', tags: ['3d'], published_at: '2026-02-10' },
    body: '',
  },
  {
    id: 'books/dev-diary-vol1',
    collection: 'works',
    data: { title: 'Dev Diary Vol.1', category: 'book', description: '', tags: [], published_at: '2025-12-01' },
    body: '',
  },
];
```

## FILE: src\lib\series_meta.js

```javascript
// Single source of truth for series display names, order, and cover image paths.

/**
 * Maps series slug to display title.
 * @type {Record<string, string>}
 */
export const series_titles = {
  everyday:   'Everyday',
  storyboard: 'Storyboard',
  lusiphite:  'Lusiphite',
};

/**
 * Maps series slug to public cover image path.
 * @type {Record<string, string>}
 */
export const series_covers = {
  everyday:   '/images/works/everyday.jpg',
  storyboard: '/images/works/storyboard.jpg',
  lusiphite:  '/images/works/lusiphite.jpg',
};

/**
 * Series shown on the top page, in display order.
 * @type {string[]}
 */
export const top_page_series = ['everyday', 'storyboard', 'lusiphite'];
```

## FILE: src\lib\today_discovery.js

```javascript
// today_discovery utility functions.

/**
 * Returns the most recent today_discovery entry by date, or undefined if none.
 * @param {Object[]} entries
 * @returns {Object|undefined}
 */
export function get_latest_discovery(entries) {
  if (entries.length === 0) return undefined;
  return [...entries].sort((a, b) => b.data.date.localeCompare(a.data.date))[0];
}

/**
 * Returns up to n today_discovery entries sorted by date descending (newest first).
 * @param {Object[]} entries
 * @param {number} n
 * @returns {Object[]}
 */
export function get_recent_discoveries(entries, n) {
  return [...entries]
    .sort((a, b) => b.data.date.localeCompare(a.data.date))
    .slice(0, n);
}
```

## FILE: src\lib\today_discovery.test.js

```javascript
// Unit tests for today_discovery.js utility functions. No Astro runtime needed.
import { describe, it, expect } from 'vitest';
import { fixture_today_discovery } from './fixtures/fixture_today_discovery.js';
import {
  get_latest_discovery,
  get_recent_discoveries,
} from './today_discovery.js';

// --- get_latest_discovery ---

describe('get_latest_discovery', () => {
  it('returns the entry with the most recent date from unsorted input', () => {
    const result = get_latest_discovery(fixture_today_discovery);
    expect(result.data.date).toBe('2026-05-18');
  });

  it('returns undefined for empty array', () => {
    expect(get_latest_discovery([])).toBeUndefined();
  });

  it('result has properties id, data.date, data.title, body', () => {
    const result = get_latest_discovery(fixture_today_discovery);
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('data.date');
    expect(result).toHaveProperty('data.title');
    expect(result).toHaveProperty('body');
  });

  it('returns the single entry when array has exactly one element', () => {
    const result = get_latest_discovery([fixture_today_discovery[0]]);
    expect(result).toBe(fixture_today_discovery[0]);
  });
});

// --- get_recent_discoveries ---

describe('get_recent_discoveries', () => {
  it('returns array of length 3 when n=3 and 3 entries exist', () => {
    expect(get_recent_discoveries(fixture_today_discovery, 3)).toHaveLength(3);
  });

  it('returns array of length 2 when n=2 (truncation)', () => {
    expect(get_recent_discoveries(fixture_today_discovery, 2)).toHaveLength(2);
  });

  it('returns all 3 entries when n=10 exceeds total (no error)', () => {
    expect(get_recent_discoveries(fixture_today_discovery, 10)).toHaveLength(3);
  });

  it('returns empty array for empty input', () => {
    expect(get_recent_discoveries([], 5)).toEqual([]);
  });

  it('first element has the most recent date (2026-05-18)', () => {
    const result = get_recent_discoveries(fixture_today_discovery, 3);
    expect(result[0].data.date).toBe('2026-05-18');
  });

  it('last element has the oldest date (2026-05-16)', () => {
    const result = get_recent_discoveries(fixture_today_discovery, 3);
    expect(result[result.length - 1].data.date).toBe('2026-05-16');
  });

  it('first date is lexicographically greater than second (YYYY-MM-DD sort)', () => {
    const result = get_recent_discoveries(fixture_today_discovery, 3);
    expect(result[0].data.date > result[1].data.date).toBe(true);
  });
});
```

## FILE: src\lib\works.js

```javascript
// works utility functions.

/**
 * Returns all works entries for a given category, sorted by published_at descending.
 * @param {Object[]} entries
 * @param {string} category
 * @returns {Object[]}
 */
export function get_works_by_category(entries, category) {
  return entries
    .filter(e => e.data.category === category)
    .sort((a, b) => {
      const da = a.data.published_at ?? '';
      const db = b.data.published_at ?? '';
      return db.localeCompare(da);
    });
}

/**
 * Returns true if any works entry exists for the given category.
 * @param {Object[]} entries
 * @param {string} category
 * @returns {boolean}
 */
export function has_works(entries, category) {
  return entries.some(e => e.data.category === category);
}

/**
 * Returns the most recently published work for a given category, or undefined if none.
 * @param {Object[]} entries
 * @param {string} category
 * @returns {Object|undefined}
 */
export function get_latest_work(entries, category) {
  const list = get_works_by_category(entries, category);
  return list.length > 0 ? list[0] : undefined;
}
```

## FILE: src\lib\works.test.js

```javascript
// Unit tests for works.js utility functions. No Astro runtime needed.
import { describe, it, expect } from 'vitest';
import { fixture_works } from './fixtures/fixture_works.js';
import {
  get_works_by_category,
  has_works,
  get_latest_work,
} from './works.js';

// --- get_works_by_category ---

describe('get_works_by_category', () => {
  it('returns array of length 2 for game category', () => {
    expect(get_works_by_category(fixture_works, 'game')).toHaveLength(2);
  });

  it('returns array of length 1 for asset category', () => {
    expect(get_works_by_category(fixture_works, 'asset')).toHaveLength(1);
  });

  it('returns array of length 1 for book category', () => {
    expect(get_works_by_category(fixture_works, 'book')).toHaveLength(1);
  });

  it('returns empty array for project category (no entries)', () => {
    expect(get_works_by_category(fixture_works, 'project')).toEqual([]);
  });

  it('returns empty array for empty entries', () => {
    expect(get_works_by_category([], 'game')).toEqual([]);
  });

  it('game results sorted descending by published_at — first is Meow Adventure (2026-03-01)', () => {
    const result = get_works_by_category(fixture_works, 'game');
    expect(result[0].data.title).toBe('Meow Adventure');
  });

  it('every entry in game result has data.category === game (no cross-category leakage)', () => {
    const result = get_works_by_category(fixture_works, 'game');
    for (const item of result) {
      expect(item.data.category).toBe('game');
    }
  });
});

// --- has_works ---

describe('has_works', () => {
  it('returns true for game category', () => {
    expect(has_works(fixture_works, 'game')).toBe(true);
  });

  it('returns true for asset category', () => {
    expect(has_works(fixture_works, 'asset')).toBe(true);
  });

  it('returns false for project category (no entries)', () => {
    expect(has_works(fixture_works, 'project')).toBe(false);
  });

  it('returns false for empty entries', () => {
    expect(has_works([], 'game')).toBe(false);
  });
});

// --- get_latest_work ---

describe('get_latest_work', () => {
  it('returns Meow Adventure as latest game (published_at 2026-03-01)', () => {
    const result = get_latest_work(fixture_works, 'game');
    expect(result.data.title).toBe('Meow Adventure');
  });

  it('returns undefined for project category (no entries)', () => {
    expect(get_latest_work(fixture_works, 'project')).toBeUndefined();
  });

  it('returns undefined for empty entries', () => {
    expect(get_latest_work([], 'game')).toBeUndefined();
  });
});
```

## FILE: src\pages\[category]\index.astro

```astro
---
// Works category page: only generated when the category has content (§16: no empty/coming-soon pages).
// getStaticPaths runs in isolation, so CATEGORY_META must be defined inside the function.
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/base_layout.astro';
import { get_works_by_category, has_works } from '../../lib/works.js';

export async function getStaticPaths() {
  const CATEGORY_META = {
    game:    { slug: 'games',    title: '🎮 Games',     page_title: 'Games' },
    asset:   { slug: 'assets',   title: '🎲 3D Assets',  page_title: '3D Assets' },
    book:    { slug: 'books',    title: '📚 Books',      page_title: 'Books' },
    project: { slug: 'projects', title: '💻 Projects',   page_title: 'Projects' },
  };
  let works_entries = [];
  try {
    const result = await getCollection('works');
    if (Array.isArray(result)) works_entries = result;
  } catch {}
  if (works_entries.length === 0) return [];
  return Object.entries(CATEGORY_META)
    .filter(([cat]) => has_works(works_entries, cat))
    .map(([cat, meta]) => ({
      params: { category: meta.slug },
      props: { cat, meta, items: get_works_by_category(works_entries, cat) },
    }));
}

const { cat, meta, items } = Astro.props;
---
<BaseLayout title={meta.page_title} lang="en" current_page={`/${meta.slug}/`}>
  <div class="md3-section">
    <h1 class="md3-headline-large">{meta.title}</h1>
    <div class="md3-card-grid">
      {items.map(item => (
        <div class="md3-card">
          <h2 class="md3-title-large">{item.data.title}</h2>
          {item.data.description && <p class="md3-body-large">{item.data.description}</p>}
          {item.data.url && <a href={item.data.url} class="md3-btn md3-btn-outlined" target="_blank" rel="noopener">View →</a>}
        </div>
      ))}
    </div>
  </div>
</BaseLayout>

```

## FILE: src\pages\[lang]\comic\[series]\[episode]\index.astro

```astro
---
// Episode page: displays comic panel images with navigation.
import { getCollection } from 'astro:content';
import BaseLayout from '../../../../../layouts/base_layout.astro';
import EpisodeNav from '../../../../../components/episode_nav.astro';
import ReactionsSlot from '../../../../../components/reactions_slot.astro';
import CommentsSlot from '../../../../../components/comments_slot.astro';
import { get_episode, build_episode_paths, build_episode_nav } from '../../../../../lib/comic.js';

export async function getStaticPaths() {
  const all_entries = await getCollection('comic');
  return build_episode_paths(all_entries);
}

const { lang, series, episode } = Astro.params;
const all_entries = await getCollection('comic');
const current = get_episode(all_entries, lang, series, episode);
const { title, description, images } = current.data;
const nav = build_episode_nav(all_entries, lang, series, episode);
---
<BaseLayout title={title} lang={lang} og_image={images[0]} current_page={`/${lang}/comic/`}>
  <div class="md3-section">
    <div class="hugo-episode md3-label-large">Episode {episode}</div>
    <h1 class="hugo-title md3-title-large">{title}</h1>
    <div class="hugo-images">
      {images.map(src => (
        <img src={src} alt="comic panel" loading="lazy">
      ))}
    </div>
    {description && (
      <div class="hugo-description md3-body-large">{description}</div>
    )}
    <ReactionsSlot />
    <CommentsSlot />
    <EpisodeNav
      prev_href={nav.prev_href}
      next_href={nav.next_href}
      list_href={nav.list_href}
    />
  </div>
  <script>
  // Swipe navigation: right swipe = prev, left swipe = next.
  let touchStartX = null;
  let touchStartY = null;
  document.body.addEventListener('touchstart', function(e) {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  });
  document.body.addEventListener('touchend', function(e) {
    if (touchStartX === null || touchStartY === null) return;
    let dx = e.changedTouches[0].screenX - touchStartX;
    let dy = e.changedTouches[0].screenY - touchStartY;
    if (Math.abs(dx) > Math.abs(dy) * 0.7 && Math.abs(dx) > 40) {
      e.preventDefault();
      if (dx > 0) {
        let prev = document.querySelector('.hugo-nav a:first-child');
        if (prev && prev.getAttribute('href')) location.href = prev.getAttribute('href');
      } else {
        let next = document.querySelector('.hugo-nav a:last-child');
        if (next && next.getAttribute('href')) location.href = next.getAttribute('href');
      }
    }
    touchStartX = null;
    touchStartY = null;
  });
  // Keyboard navigation: arrow keys.
  document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowLeft') {
      let prev = document.querySelector('.hugo-nav a:first-child');
      if (prev && prev.getAttribute('href')) location.href = prev.getAttribute('href');
    } else if (e.key === 'ArrowRight') {
      let next = document.querySelector('.hugo-nav a:last-child');
      if (next && next.getAttribute('href')) location.href = next.getAttribute('href');
    }
  });
  </script>
</BaseLayout>
```

## FILE: src\pages\[lang]\comic\[series]\index.astro

```astro
---
// Series list page: shows all episodes for a given lang/series.
import { getCollection } from 'astro:content';
import BaseLayout from '../../../../layouts/base_layout.astro';
import { get_all_episodes, build_series_paths } from '../../../../lib/comic.js';
import { series_titles, series_covers } from '../../../../lib/series_meta.js';

export async function getStaticPaths() {
  const all_entries = await getCollection('comic');
  return build_series_paths(all_entries);
}

const { lang, series } = Astro.params;
const all_entries = await getCollection('comic');
const episodes = get_all_episodes(all_entries, lang, series);
const display_title = series_titles[series] ?? series;
---
<BaseLayout title={display_title} lang={lang} og_image={series_covers[series]} current_page={`/${lang}/comic/`}>
  <div class="md3-section">
    <h1 class="md3-headline-large">{display_title}</h1>
    <ul class="hugo-list">
      {episodes.map(ep => (
        <li style="padding: 8px 0; border-bottom: 1px solid var(--md-sys-color-outline-variant);">
          <a href={`/${lang}/comic/${series}/${ep.data.episode}/`}>
            {ep.data.episode} {ep.data.title}
          </a>
        </li>
      ))}
    </ul>
    <div style="margin-top:2em;"><a href="/" class="md3-btn md3-btn-tonal">← Home</a></div>
  </div>
</BaseLayout>
```

## FILE: src\pages\404.astro

```astro
---
// Custom 404 page for Cloudflare Pages.
import BaseLayout from '../layouts/base_layout.astro';
---
<BaseLayout title="Page Not Found" lang="en" current_page="/404/">
  <div class="md3-section">
    <h1 class="md3-headline-large">404 — Page Not Found</h1>
    <p class="md3-body-large">
      お探しのページは見つかりませんでした。<br>
      The page you're looking for doesn't exist.
    </p>
    <a href="/" class="md3-btn md3-btn-filled">← Back to Home</a>
  </div>
</BaseLayout>
```

## FILE: src\pages\about.astro

```astro
---
// About page: creator information.
import BaseLayout from '../layouts/base_layout.astro';
---
<BaseLayout title="About" lang="en" current_page="/about/">
  <div class="md3-section">
    <h1 class="md3-headline-large">About</h1>
    <div class="md3-card">
      <h2 class="md3-title-large">STUDIO MeowToon</h2>
      <p class="md3-body-large">One creator. Every day.</p>
      <!-- Phase 21.5: add creator bio, social links -->
    </div>
    <div class="md3-card" id="contact" style="margin-top: 16px;">
      <h2 class="md3-title-large">Contact</h2>
      <p class="md3-body-large">hello [at] meowtoon [dot] com</p>
    </div>
  </div>
</BaseLayout>
```

## FILE: src\pages\index.astro

```astro
---
// Top page: landing page with Hero, Today's Discovery, Manga, and Works sections.
import { getCollection } from 'astro:content';
import BaseLayout from '../layouts/base_layout.astro';
import { build_top_page_data } from '../lib/comic.js';
import { get_latest_discovery } from '../lib/today_discovery.js';
import { has_works, get_latest_work } from '../lib/works.js';

const comic_entries     = await getCollection('comic');
const discovery_entries = await getCollection('today_discovery');
const works_entries     = await getCollection('works');
const series_list       = build_top_page_data(comic_entries);
const latest_discovery  = get_latest_discovery(discovery_entries);
const DiscoveryContent  = latest_discovery ? (await latest_discovery.render()).Content : null;
const works_categories  = ['game', 'asset', 'book', 'project'];
---
<BaseLayout title="Home" lang="en" current_page="/" og_image={series_list[0]?.cover_src}>

  <!-- Section 1: Hero -->
  <section class="md3-hero">
    <h1 class="md3-headline-large">One creator. Every day.</h1>
    <p class="md3-body-large">Games · Manga · 3D Assets · Books · Projects</p>
  </section>

  <!-- Section 2: Today's Discovery (conditional) -->
  {latest_discovery && (
    <section class="md3-section">
      <h2 class="md3-title-large">Today's Discovery <span class="md3-ephemeral-badge">🔴 Ephemeral</span></h2>
      <div class="md3-card">
        <time datetime={latest_discovery.data.date} class="md3-label-large">{latest_discovery.data.date}</time>
        <h3 class="md3-title-large">{latest_discovery.data.title}</h3>
        {DiscoveryContent && <DiscoveryContent />}
        {latest_discovery.data.image && <img src={latest_discovery.data.image} alt={latest_discovery.data.title} loading="lazy">}
      </div>
      <a href="/today/" class="md3-btn md3-btn-outlined" style="margin-top:16px;display:inline-flex;">See archive →</a>
    </section>
  )}

  <!-- Section 3: Latest Manga (always shown) -->
  <section class="md3-section">
    <h2 class="md3-title-large">Manga</h2>
    <div class="md3-card-grid">
      {series_list.map(s => (
        <a href={s.href} class="md3-card md3-card-series" style="text-decoration:none;color:inherit;">
          <img src={s.cover_src} alt={s.display_title} loading="lazy">
          <span class="md3-title-large">{s.display_title}</span>
        </a>
      ))}
    </div>
  </section>

  <!-- Section 4: Works (per-category conditional) -->
  {works_categories.some(cat => has_works(works_entries, cat)) && (
    <section class="md3-section">
      <h2 class="md3-title-large">Works</h2>
      <div class="md3-card-grid">
        {has_works(works_entries, 'game')    && <a href="/games/"    class="md3-card" style="text-decoration:none;">🎮 Games</a>}
        {has_works(works_entries, 'asset')   && <a href="/assets/"   class="md3-card" style="text-decoration:none;">🎲 3D Assets</a>}
        {has_works(works_entries, 'book')    && <a href="/books/"    class="md3-card" style="text-decoration:none;">📚 Books</a>}
        {has_works(works_entries, 'project') && <a href="/projects/" class="md3-card" style="text-decoration:none;">💻 Projects</a>}
      </div>
    </section>
  )}

</BaseLayout>
```

## FILE: src\pages\today\index.astro

```astro
---
// Today's Discovery archive page: shows latest 30 discoveries.
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/base_layout.astro';
import { get_recent_discoveries } from '../../lib/today_discovery.js';

const all_entries  = await getCollection('today_discovery');
const discoveries  = get_recent_discoveries(all_entries, 30);
const rendered     = await Promise.all(discoveries.map(d => d.render()));
---
<BaseLayout title="Today's Discovery" lang="en" current_page="/today/">
  <div class="md3-section">
    <h1 class="md3-headline-large">Today's Discovery</h1>
    {discoveries.length === 0 && <p class="md3-body-large">No discoveries yet.</p>}
    {discoveries.map((d, i) => {
      const { Content } = rendered[i];
      return (
        <div class="md3-card" style="margin-bottom: 16px;">
          <time datetime={d.data.date} class="md3-label-large">{d.data.date}</time>
          <h2 class="md3-title-large">{d.data.title}</h2>
          <Content />
          {d.data.image && <img src={d.data.image} alt={d.data.title} loading="lazy">}
        </div>
      );
    })}
  </div>
</BaseLayout>
```

## FILE: src\pages\works\index.astro

```astro
---
// Works overview page. Redirects to / if no works at all (§16: no empty/coming-soon pages).
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/base_layout.astro';
import { has_works } from '../../lib/works.js';

const works_entries = await getCollection('works');
const has_any = ['game', 'asset', 'book', 'project'].some(c => has_works(works_entries, c));
---
{!has_any
  ? <script is:inline>window.location.replace('/');</script>
  : <BaseLayout title="Works" lang="en" current_page="/works/">
      <div class="md3-section">
        <h1 class="md3-headline-large">Works</h1>
        <div class="md3-card-grid">
          {has_works(works_entries, 'game')    && <a href="/games/"    class="md3-card" style="text-decoration:none;">🎮 Games</a>}
          {has_works(works_entries, 'asset')   && <a href="/assets/"   class="md3-card" style="text-decoration:none;">🎲 3D Assets</a>}
          {has_works(works_entries, 'book')    && <a href="/books/"    class="md3-card" style="text-decoration:none;">📚 Books</a>}
          {has_works(works_entries, 'project') && <a href="/projects/" class="md3-card" style="text-decoration:none;">💻 Projects</a>}
        </div>
      </div>
    </BaseLayout>
}
```

## FILE: vitest.config.mjs

```javascript
// Vitest configuration: runs tests in Node environment for pure JS utility testing.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    passWithNoTests: true,
    include: [
      'src/**/*.test.js',
      'scripts/**/*.test.mjs',
    ],
  },
});
```

