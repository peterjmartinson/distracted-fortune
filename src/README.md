# WP GitHub Sync

A small GitHub Actions + Node.js toolset that lets you write posts locally (Vim), commit them to your repo, and have GitHub Actions create or update WordPress drafts for PRs and publish on merge to `master`.

Overview
- Create a post at `content/posts/YYYYMMDD_ShortTitle/draft.md` with YAML frontmatter.
- Optionally include images in the same folder and an `images.yml` with captions/alt text.
- Open a PR: the workflow creates/updates a draft in WordPress and posts a comment on the PR containing the WP post ID and URL.
- Merge the PR into `master`: the workflow publishes the post (if frontmatter date is in the future it will be scheduled).

Files of interest
- `.github/workflows/wp-sync.yml` — workflow to run on PR events.
- `src/index.js` — thin entry point: reads environment, wires the WP client and PR helpers, then delegates to `sync.js`.
- `src/sync.js` — core sync logic: extracts and uploads images, builds Gutenberg blocks, converts Markdown → HTML, creates/updates WP posts.
- `src/wp-client.js` — WP REST helper.
- `package.json` — dependencies and `npm test` script.

Frontmatter fields supported (in draft.md)
- title: string
- date: ISO 8601 timestamp (used for scheduling on publish)
- excerpt: short summary
- tags: [array]
- categories: [array]
- featured_image: relative filename in same folder or absolute URL

Example post structure
````markdown name=content/posts/20260224_MyShortTitle/draft.md
---
title: "My Short Title"
date: 2026-02-24T12:00:00-05:00
excerpt: "A one-line summary for previews."
tags:
  - idea
  - writing
categories:
  - Essays
featured_image: hero.jpg
---

Your markdown content here. Include local images with typical markdown:
![Alt text](hero.jpg)

Body images are automatically uploaded to the WP Media Library and replaced with
Gutenberg `<!-- wp:image -->` blocks in the post content, so they render correctly
in both the Gutenberg editor and the front-end without any manual edits.
Captions and alt text come from the companion `images.yml` file (alt text written
in the markdown takes precedence over the `images.yml` value).

Running tests
Run `npm test` from the repo root. Tests use Node's built-in test runner (Node ≥ 18
required) and rely on fixture files under `test/fixtures/`.
