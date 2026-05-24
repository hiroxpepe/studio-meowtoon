# Privacy Policy Pages — Design Document

This document describes how Koleco hosts per-app Privacy Policy pages that can
be registered as the privacy policy URL for mobile apps published to app
stores such as Google Play.

---

## Purpose

App stores require every published app to provide a privacy policy URL.
Hosting the policy on your own creator site (rather than a generic
third-party generator) gives you:

- A stable URL under your own domain
- Full control over wording and structure
- Easy updates by editing one Markdown file
- A single source of truth across multiple apps

Koleco supports an arbitrary number of apps. Each app has its own URL and its
own Markdown configuration file.

---

## URL Structure

```
/privacy/{slug}/
```

Each entry in `src/content/privacy/` is published at this URL.

For example, the included sample `germio.md` is reachable at:

```
/privacy/germio/
```

There is no `/privacy/` index page. Privacy pages are reachable by direct URL
only and are intentionally not linked from site navigation or the footer.
This is by design: app stores expect a direct, stable URL, and creators
usually do not want privacy pages competing with creative content for
attention in the main navigation.

---

## File Structure

```
src/
├── content/
│   └── privacy/
│       └── germio.md            # sample app entry (replace with your own)
└── pages/
    └── privacy/
        └── [game]/
            └── index.astro      # single template, generates all pages
```

The single `[game]/index.astro` template renders one page per Markdown file
using Astro's dynamic routing (`getStaticPaths`). To add a new app, create
a new Markdown file in `src/content/privacy/` — no code changes are needed.

---

## Content Schema

Each Markdown file declares the app's data-handling profile via frontmatter.
The schema is enforced by Zod in `src/content.config.js`.

| Field | Type | Description |
|---|---|---|
| `slug` | string | URL segment. Must match the filename (without `.md`). |
| `title` | string | App display name shown in the policy heading. |
| `platform` | string | E.g. `Android / Google Play`, `iOS / App Store`. |
| `effective_date` | string (YYYY-MM-DD) | Date the policy takes effect. |
| `developer_name` | string | Legal/developer name shown in the policy. |
| `contact_email` | string | Email address shown in the Contact section. |
| `collects_personal_info` | boolean | Whether the app directly collects PII. |
| `uses_ads` | boolean | Toggles the Advertising section. |
| `ad_sdks` | string[] | E.g. `["AdMob"]`. Listed under Advertising. |
| `uses_analytics` | boolean | Toggles the Analytics section. |
| `analytics_sdks` | string[] | E.g. `["Firebase Analytics"]`. |
| `uses_iap` | boolean | Toggles the In-App Purchases section. |
| `uses_online` | boolean | Toggles the Online Features section. |
| `target_audience` | enum | `everyone` / `teen` / `mature`. |
| `permissions` | string[] | Android permissions, e.g. `["INTERNET"]`. |

---

## Page Template Behavior

The page template at `src/pages/privacy/[game]/index.astro` renders sections
conditionally based on the boolean fields above:

| Section | Always shown | Conditional on |
|---|---|---|
| Introduction | yes | — |
| Information We Collect | yes | wording adapts to `collects_personal_info` |
| Advertising | no | `uses_ads === true` |
| Analytics | no | `uses_analytics === true` |
| In-App Purchases | no | `uses_iap === true` |
| Online Features | no | `uses_online === true` |
| Device Permissions | no | `permissions.length > 0` |
| Data Sharing | yes | — |
| Data Retention | yes | — |
| Your Rights (GDPR / CCPA) | yes | — |
| Children's Privacy | yes | wording adapts to `target_audience` |
| Changes to This Policy | yes | — |
| Contact | yes | — |

This keeps the policy honest: a section about advertising is only shown when
the app actually uses ads, which is what reviewers (and users) expect.

---

## Sample App: germio

The included sample is configured as the simplest possible case:

- Does not collect personal information
- No ads, no analytics, no in-app purchases, no online features
- No special permissions
- Target audience: everyone

This means the sample's published page shows the legal boilerplate sections
only, which is appropriate for a minimal, offline single-player app.

The placeholder values for `developer_name` and `contact_email` must be
replaced with real values before submitting the URL to an app store.

---

## Adding a New App

1. Copy `src/content/privacy/germio.md` to a new file using your app's slug.
   - Filename: `src/content/privacy/{slug}.md`
   - The filename (without `.md`) must match the `slug` field in frontmatter.
2. Edit the frontmatter fields to reflect your app's real data practices.
3. Run `npm run build` and verify that `/privacy/{slug}/` is generated.
4. Register the resulting URL in your app store's console.

---

## Google Play Console Registration

In the Google Play Console, the privacy policy URL is set per app:

```
Policy → App content → Privacy policy
```

Paste your published URL (for example, `https://your-domain.com/privacy/{slug}/`)
into that field. The URL must be publicly accessible and must contain only
content relevant to that specific app's data handling.

---

## Decisions and Rationale

### Why per-app URLs?

App stores expect one privacy URL per app, and review processes can flag a
shared URL that mixes data practices from multiple apps. A per-app URL also
makes the policy more honest: it shows only the practices that actually
apply to that app, with no "if applicable" weasel wording.

### Why English only?

Most app stores accept an English privacy policy globally. Maintaining
translations multiplies the risk of one language drifting from another and
producing inconsistent legal statements. Translated versions can be added
later (for example, under `/privacy/ja/{slug}/`) once a single source of
truth in English is stable.

### Why Markdown frontmatter for app metadata?

Frontmatter keeps the configuration data type-checked (via Zod) and free of
HTML, which lowers the cognitive load when editing. It also keeps app
profiles diff-friendly in version control: changes to a single app's policy
appear as small, focused commits.

### Why no `/privacy/` index page?

App stores never link to an index — they consume a single per-app URL — and
exposing an index from site navigation invites users into a section that is
not part of the creative experience. Leaving it out keeps the site focused
and avoids a footer link that nobody needs to click.

### Why not use a TDD helper module?

The template uses only simple conditional rendering and array iteration.
Splitting this into helper functions with tests would add files and indirection
without catching a real class of bug. If logic grows in the future (for example,
computing aggregate properties across SDKs), revisit this decision.

---

## Future Considerations

- **Localized versions.** If a Japanese (or other-language) version is
  required by a specific store, add it under `/privacy/{lang}/{slug}/`
  rather than mixing languages inside one Markdown file.
- **Versioned policies.** Some jurisdictions encourage preserving historical
  policy versions. A future enhancement could publish dated archives under
  `/privacy/{slug}/archive/{date}/`.
- **More toggles.** Add new boolean fields to the schema (and matching
  conditional sections in the template) as new SDK categories appear. Keep
  the section "always show, wording adapts" pattern for legal sections that
  apply regardless of features.
- **Sitemap exclusion.** Privacy pages currently appear in the sitemap. If
  this is undesirable, exclude the `/privacy/` path in the sitemap
  integration configuration.
