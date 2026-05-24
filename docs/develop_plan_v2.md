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
- [x] 14.9 Verify Today's Discovery section is **absent** from rendered HTML when `discovery_entries` is empty
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
- [x] 15.2 Add creator name, brief bio (1–2 sentences), and social links before launch
- [x] 15.3 Add contact info (email or form link)
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

- [x] 21.1 Write first `today_discovery` post:
  create `src/content/today_discovery/YYYY-MM-DD.md` with today's date,
  `date: YYYY-MM-DD`, `title: "..."`, and 1–3 sentences of discovery body
- [x] 21.2 Run `npm run dev` → verify Today's Discovery card appears on homepage
- [x] 21.3 Verify Today's Discovery card shows date, title, body correctly
- [ ] 21.4 Confirm at least 1 quality-checked manga episode is in `src/content/comic/ja/`
  (all 193 are already migrated; "quality-checked" = author has reviewed for publication)
- [x] 21.5 Complete About page content: add real creator bio, social links, contact info (Phase 15.2–15.3)
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

## v0.19.11 — OSS Configuration Externalization & Privacy Policy Pages

Post-Phase-22 work to harden Koleco as an open-source project that other
creators can fork. Not part of the 22-phase plan above; tracked here as an
addendum so the change history stays in one place.

### Goals

- Move user-specific identity values out of components into a single config module.
- Provide an `.env`-driven production URL so forks can build without code edits.
- Add per-app Privacy Policy pages so creators can register a URL in app stores
  (e.g. Google Play Console) using their own domain.

### Checklist

- [x] v0.19.11.1 Create `src/config/site.js` — site name, creator profile, social handles, email
- [x] v0.19.11.2 Create `.env.example` — `PUBLIC_SITE_URL`, `PUBLIC_GA4_ID` with sane defaults
- [x] v0.19.11.3 Update `astro.config.mjs` — read `PUBLIC_SITE_URL` from env, fall back to `https://example.com` so the project builds without `.env`
- [x] v0.19.11.4 Update `src/layouts/base_layout.astro` — `<title>` and `og:site_name` reference `site.name`
- [x] v0.19.11.5 Update `src/pages/about.astro` — read all identity / social / email values from `site.js`, render social rows conditionally (hide rows whose handle is empty)
- [x] v0.19.11.6 Update `package.json` — set `name` to `"koleco"`
- [x] v0.19.11.7 Add `privacy` collection to `src/content.config.js` — Zod schema for per-app frontmatter (slug, title, platform, effective_date, developer_name, contact_email, collects_personal_info, uses_ads, ad_sdks, uses_analytics, analytics_sdks, uses_iap, uses_online, target_audience, permissions)
- [x] v0.19.11.8 Create `src/content/privacy/germio.md` — sample app entry with placeholder developer/contact values; all SDK flags set to `false` for the simplest possible offline single-player baseline
- [x] v0.19.11.9 Create `src/pages/privacy/[game]/index.astro` — dynamic route that renders one Privacy Policy page per `privacy` collection entry; sections conditionally rendered from frontmatter booleans; common GDPR / CCPA / COPPA legal boilerplate always shown
- [x] v0.19.11.10 Pages are reachable by direct URL only — NOT linked from navigation or footer (intentional: app stores consume the URL directly, no need to expose `/privacy/` in site nav)
- [x] v0.19.11.11 No index page at `/privacy/` — only `/privacy/{slug}/` paths exist
- [x] v0.19.11.12 No TDD helper module — template uses simple conditional rendering only; revisit if logic grows
- [x] v0.19.11.13 Update `README.md` — Forking section now reflects `site.js` + `.env` workflow; includes the Privacy Policy step
- [x] v0.19.11.14 Create `docs/privacy_policy_design.md` — purpose, URL structure, file structure, schema, page template behavior, sample app explanation, procedure to add a new app, Google Play Console registration steps, decisions & rationale, future considerations

### Decisions (recorded for future reference)

- **Public identity (name, bio, social, email) lives in `site.js`** rather than `.env`, because it is not secret and is more pleasant to edit as a JS module than as flat KEY=VALUE pairs.
- **Production URL and GA4 ID live in `.env`** because they are environment-specific and (in GA4's case) sensitive.
- **`series_meta.js` stays separate from `site.js`.** Series metadata is closer to content than to site identity, and combining them would bloat `site.js` and blur responsibilities.
- **`PUBLIC_SITE_URL` falls back to `https://example.com`** when unset, so a fresh clone builds with no setup. This trades a small risk of accidentally shipping `example.com` in OGP for a much smoother first-build experience for forks. Production deployments must set `.env`.
- **Privacy Policy is English-only.** Most app stores accept an English policy globally, and maintaining translated versions multiplies the risk of legal drift between languages.
- **Per-app URLs, not a shared one.** App store review processes treat the privacy URL as app-specific, and per-app pages let each policy show only the practices that actually apply to that app.

### Out of scope

- Migrating `src/lib/series_meta.js` into `site.js` (kept separate by decision above)
- Translating Privacy Policy template into other languages
- Building a `/privacy/` index page
- Adding tests for the Privacy Policy template

### Files

**New**

```
.env.example
src/config/site.js
src/content/privacy/germio.md
src/pages/privacy/[game]/index.astro
docs/privacy_policy_design.md
```

**Modified**

```
astro.config.mjs                          PUBLIC_SITE_URL env + fallback
package.json                              name -> koleco
src/content.config.js                     add privacy collection
src/layouts/base_layout.astro             site.name for <title> and og:site_name
src/pages/about.astro                     read identity from site.js, conditional social rows
README.md                                 Forking section reflects site.js + .env workflow
docs/develop_plan_v2.md                   this addendum
```

---

*develop_plan_v2.md · 2026-05-18 · 22 phases · 188 checklist items · TDD RED/GREEN fully separated*
