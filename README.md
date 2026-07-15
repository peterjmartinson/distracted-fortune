This holds the content for https://distractedfortune.com

Authoring content
-----------------

| Type | Location | Images |
|------|----------|--------|
| Articles | `_posts/YYYY-MM-DD-slug.md` | `assets/post-images/` |
| Newsletters | `content/newsletters/YYYYMMDD_Title/draft.md` | inline links |

> **Legacy:** `content/posts/` is no longer used for new articles. See `content/posts/README.md`.

Article front matter example:

```yaml
layout: post
title: "Your Title"
date: 2026-06-25
permalink: /your-slug/
excerpt: One sentence summary shown in the email and on the index page.
tags:
  - tag1
  - tag2
categories:
  - Article
  - Entrepreneurship
featured_image: /assets/post-images/your-image.jpg
```

`featured_image` is a site-root path. Leave it as `""` while drafting.

Publishing workflow
-------------------

Content is organized into two types, detected by file path:

**Articles** (`_posts/YYYY-MM-DD-slug.md`)
- On PR merge: a Buttondown draft email is created using the `excerpt` field and a link to the live post. You review and send it manually in Buttondown.

**Newsletters** (`content/newsletters/YYYYMMDD_Title/draft.md`)
- On PR open: nothing happens.
- On PR merge: a Buttondown draft email is created with the full newsletter content converted to HTML. You review and send it manually in Buttondown.

Required GitHub Actions secrets
- `BUTTONDOWN_API_KEY` — Buttondown API key (Settings → API Keys in Buttondown)

Giscus (GitHub Discussions) comments
-------------------------------

This site supports client-side comments via Giscus (backed by GitHub Discussions). Comments are lazy-loaded on demand and enabled by default for posts. To configure:

1. In `_config.yml` set the `giscus.repo` value to `peterjmartinson/distracted-fortune` (already pre-filled). Optionally set `repo_id`, `category` or `category_id` for deterministic mapping. The default `mapping` is `pathname`.

2. To opt-out a specific post from showing comments, add `comments: false` to the post's front-matter.

3. Privacy: comments are lazy-loaded — the Giscus client script is only requested after a user clicks the "Show comments" button on a post, reducing third-party requests for privacy/GDPR considerations.

4. Comment counts on index pages: a GitHub Actions workflow (`.github/workflows/fetch_discussion_counts.yml`) attempts to fetch discussion comment counts at build time and writes them to `_data/discussion_counts.yml` so counts can be displayed next to posts. This workflow requires a token with permission to read Discussions. See `.github/workflows/fetch_discussion_counts.yml` and `scripts/fetch_discussion_counts.js` for details and customization notes.

Setup for fetching discussion counts
-----------------------------------

1. Enable GitHub Discussions in the repository settings for `peterjmartinson/distracted-fortune`.
2. Add a repository secret named `DISCUSSIONS_TOKEN` containing a Personal Access Token (classic) or fine-grained token that has permission to read Discussions (e.g., `read:discussion` or `repo` scope). If `DISCUSSIONS_TOKEN` is not present, the workflow will attempt to use the default `GITHUB_TOKEN`, which may not have Discussions access in some repositories.
3. The workflow will run on pushes to `_posts/` and when manually triggered. It writes `_data/discussion_counts.yml` and commits it back to the repo (the action uses a push; you can adjust this behavior if you prefer manual review).

Security note: Keep `DISCUSSIONS_TOKEN` secret. If you prefer not to store a token in repo secrets, you can run `scripts/fetch_discussion_counts.js` locally and commit the generated `_data/discussion_counts.yml` yourself.

Moderation
----------
Moderation happens via GitHub Discussions. Visit the Discussions tab on the configured repository to moderate, pin, or close threads. Ensure Discussions are enabled in the repository settings.

Notes
-----
- If you prefer comments disabled by default, set `page.comments` handling accordingly in `_layouts/post.html`.
- For stable discussion mapping across permalink changes, you can add `discussion_id: "some-stable-id"` to a post's front-matter and the post layout will provide it to Giscus as `data-term`.
