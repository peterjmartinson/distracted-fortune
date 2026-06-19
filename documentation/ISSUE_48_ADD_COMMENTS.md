Summary

This site is currently a static Jekyll/GitHub Pages blog that renders posts with _layouts/post.html. Add a commenting system using Giscus (GitHub Discussions-backed comments) so readers can leave comments on posts.

Motivation

- Allow readers to engage with posts and leave feedback.
- Use GitHub Discussions as the backend (via Giscus) to avoid third-party tracking and keep comments under GitHub's moderation tools.
- Keep the implementation lightweight and configurable (able to enable/disable per post).

Proposed implementation

1) Config
   - Add site config variables to _config.yml, e.g.:
     giscus:
       repo: "owner/repo"            # GitHub repo that hosts discussions (usually owner/owner.github.io or owner/repo where Discussions are enabled)
       repo_id: ""                  # optional (giscus can discover by repo string, but repo_id is more robust)
       category: ""                 # Discussions category name (optional)
       category_id: ""              # optional (useful for deterministic mapping)
       mapping: "pathname"         # recommended: 'pathname' or 'url' or 'title' (how giscus maps pages to discussions)
       reactions_enabled: true
       metadata: "true"            # whether to send page metadata to GitHub (optional)
       theme: "light"              # or 'dark', 'preferred_color_scheme', etc.
       lang: "en"
   - Alternatively store the minimal `giscus_repo` and `giscus_mapping` keys if you prefer flat keys. Use nested `giscus:` for clarity.

2) Per-post toggle
   - Support a front-matter flag in posts to enable/disable comments, e.g. `comments: true` or `giscus: true`.
   - Default behavior: comments disabled unless `comments: true` is present (safer for existing content).

3) Post layout changes (_layouts/post.html)
   - After the post content (below .post-content), add a conditional that renders the Giscus container when site.giscus.repo is set and page.comments is true.
   - Example (pseudocode):
     <div id="giscus_container">
       <div class="giscus" data-repo="{{ site.giscus.repo }}" data-repo-id="{{ site.giscus.repo_id }}" data-category="{{ site.giscus.category }}" data-category-id="{{ site.giscus.category_id }}" data-mapping="{{ site.giscus.mapping | default: 'pathname' }}" data-reactions-enabled="{{ site.giscus.reactions_enabled | default: true }}" data-emit-metadata="{{ site.giscus.metadata | default: 'false' }}" data-theme="{{ site.giscus.theme | default: 'light' }}" data-lang="{{ site.giscus.lang | default: 'en' }}"></div>
       <script src="https://giscus.app/client.js" crossorigin="anonymous" async></script>
     </div>
   - Make sure to include the script only when giscus config exists. Keep existing subscribe section unchanged.

4) Optional: comment counts in index/list views
   - Giscus doesn't provide a native lightweight count script like Disqus, but you can implement counts via the Discussions API or avoid counts entirely. Offer counts as an opt-in advanced step using GitHub API calls (requires token if private) or client-side fetching.

5) Documentation
   - Update README.md with setup instructions: where to set the Giscus repo and mapping, how to enable comments per post, and how to moderate discussions in GitHub.

6) Privacy & policy notes
   - Add a short note in README about privacy/GDPR implications. Giscus uses GitHub; it is generally more privacy-friendly than Disqus but still communicates with GitHub. Mention option for lazy-load / load-on-click for extra privacy compliance.

Files likely to change

- _layouts/post.html — add Giscus container & client script (primary change)
- _config.yml — add giscus config key(s)
- README.md — add setup and docs for the feature
- index.md or other listing templates — (optional) add comment count support

Implementation tasks (suggested checklist)

- [ ] Add giscus config to _config.yml and set placeholder values
- [ ] Update _layouts/post.html to render Giscus when enabled for the post and site.giscus.repo exists
- [ ] Add front-matter support for `comments: true` in post drafts
- [ ] Update README.md with setup instructions and privacy notes
- [ ] (Optional) Add support for discussion/comment counts on listing pages (requires API or server-side provisioning)
- [ ] (Optional) Add a site-level toggle for enabling comments by default
- [ ] Test on GitHub Pages (Giscus is client-side JS; ensure pages load and comments appear)

Acceptance criteria

- When `site.giscus.repo` (or equivalent config) is set and a post has `comments: true` in its front matter, the post page shows the Giscus comment thread and visitors can post comments (backed by GitHub Discussions).
- When `site.giscus.repo` is unset or `comments: false`, no giscus script is injected.
- README contains clear setup steps for the owner to configure Giscus and notes on moderation/privacy.

Notes & implementation hints

- Giscus mapping: prefer `pathname` or `url` for stable identifiers. If your site uses permalinks that might change, use a stable front-matter identifier (e.g., `discussion_id`) instead.
- Lazy-load approach: render a "Show comments" button that injects the giscus <script> and container on demand to avoid third-party requests until the user opts in.
- Alternatives: Utterances or Gitalk are other GitHub-backed options. Giscus is recommended when you want GitHub Discussions integration (recommended for moderation and visibility).

Questions for the repo owner (please answer in this issue)

1. Which repository should Giscus use for Discussions (e.g., `peterjmartinson/distracted-fortune` or a separate repo)?
2. Do you want comments enabled by default for all posts, or opt-in per post via `comments: true`?
3. Do you want lazy/load-on-click behavior for privacy, or automatic embedding on page load?
4. Do you want to attempt showing comment counts on index pages (note: requires additional API work)?

Additional code references found while reviewing the repo

- Post layout: _layouts/post.html — this is the correct place to render the comment thread after the post content.
  https://github.com/peterjmartinson/distracted-fortune/blob/main/_layouts/post.html

- The site already contains many posts with prompts to "please leave a comment" in post content; enabling comments will make those actionable.
