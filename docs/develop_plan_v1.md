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
