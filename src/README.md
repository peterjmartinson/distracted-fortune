# WP GitHub Sync

A small GitHub Actions + Node.js toolset that lets you write posts locally (Vim), commit them to your repo, and have GitHub Actions create or update WordPress drafts for PRs and publish on merge to `master`.

Overview
- Create a post at `content/posts/YYYYMMDD_ShortTitle/draft.md` with YAML frontmatter.
- Optionally include images in the same folder and an `images.yml` with captions/alt text.
- Open a PR: the workflow creates/updates a draft in WordPress and posts a comment on the PR containing the WP post ID and URL.
- Merge the PR into `master`: the workflow publishes the post (if frontmatter date is in the future it will be scheduled).

Files of interest
- `.github/workflows/wp-sync.yml` — workflow to run on PR events.
- `src/index.js` — main script: converts Markdown → HTML, uploads media, creates/updates posts.
- `src/wp-client.js` — WP REST helper.
- `package.json` — dependencies.

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
