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

