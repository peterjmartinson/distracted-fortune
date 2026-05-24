# WP GitHub Sync + Buttondown

A small GitHub Actions + Node.js toolset that lets you write posts locally, commit them to the repo, and have GitHub Actions sync to WordPress (articles) and create Buttondown draft emails (articles and newsletters).

Overview
- Create an article at `content/posts/YYYYMMDD_ShortTitle/draft.md` with YAML frontmatter.
- Create a newsletter at `content/newsletters/YYYYMMDD_ShortTitle/draft.md` with YAML frontmatter.
- Optionally include images in the same folder and an `images.yml` with captions/alt text (articles only).
- **On PR open (articles only):** the workflow creates/updates a draft in WordPress and posts a comment on the PR containing the WP post ID and URL. Newsletter PRs have no WordPress action.
- **On PR merge:** a Buttondown draft email is created automatically.
  - Articles: excerpt + link to the WordPress post.
  - Newsletters: full post content as HTML.
  - You review the draft in Buttondown and hit Send manually.

Files of interest
- `.github/workflows/wp-sync.yml` — workflow triggered on PR events (WordPress sync for articles).
- `.github/workflows/buttondown-sync.yml` — workflow triggered on push to main (Buttondown draft creation).
- `src/index.js` — entry point: supports `pr` and `merge` modes.
- `src/sync.js` — core WP sync logic: images, Gutenberg blocks, Markdown → HTML, post create/update.
- `src/wp-client.js` — WP REST helper.
- `src/buttondown-client.js` — Buttondown API helper.
- `src/buttondown-sync.js` — builds Buttondown email content for articles and newsletters.
- `package.json` — dependencies and `npm test` script.

Frontmatter fields supported (in draft.md)
- title: string
- date: ISO 8601 timestamp (used for scheduling on WP publish)
- excerpt: short summary (included in the article Buttondown email)
- email_subject: override for the Buttondown email subject line (falls back to title)
- tags: [array] (articles only — applied as WP tags)
- categories: [array] (articles only — applied as WP categories)
- featured_image: relative filename in same folder or absolute URL (articles only)

Example article structure
````markdown name=content/posts/20260224_MyShortTitle/draft.md
---
title: "My Short Title"
date: 2026-02-24T12:00:00-05:00
excerpt: "A one-line summary for previews and the Buttondown email."
email_subject: "[Distracted Fortune] My Short Title"
tags:
  - idea
  - writing
categories:
  - Essays
featured_image: hero.jpg
---

Your markdown content here.
````

Example newsletter structure
````markdown name=content/newsletters/20260224_MyNewsletter/draft.md
---
title: "My Newsletter"
date: 2026-02-24T09:00:00-05:00
email_subject: "[Distracted Fortune] My Newsletter Subject"
categories:
  - Newsletter
---

Good morning!

Full newsletter body here. This goes directly to Buttondown — never to WordPress.
````

Running tests
Run `npm test` from the repo root. Tests use Node's built-in test runner (Node ≥ 18
required) and rely on fixture files under `test/fixtures/`.
