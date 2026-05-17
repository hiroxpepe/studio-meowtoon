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
