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
