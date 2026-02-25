Thanks — perfect answers. I’ve incorporated everything and now I’ll give you a full implementation proposal: a reusable GitHub Action workflow plus a small Node.js helper script that converts Markdown → HTML, uploads images, creates/updates WP drafts on PR open/sync, and publishes on merge to master. I also include example post layout and a README with setup steps and the exact GitHub secrets you’ll need.

High-level recap of the final design (short)
- Repo layout: content/posts/YYYYMMDD_ShortTitle/draft.md plus assets and images.yml in the same folder.
- On PR opened / synchronized / reopened: Action converts the post, uploads any local images from that post folder (using images.yml metadata), creates or updates a WP draft (status = draft regardless of frontmatter date), and leaves a bot comment on the PR with a hidden mapping block (post_id + post_url).
- On PR closed → merged into master: Action publishes the mapped WP post. If frontmatter date is in the future, the post will be created/published with WP "future" scheduling so WP will schedule it. Repo is authoritative (merges overwrite WP).
- Tags/categories: created if missing (case-insensitive).
- Authentication: WordPress Application Password (Basic auth); secrets in GitHub.
- Draft visibility: WP draft (post_status = draft). Action does not try to suppress Jetpack / Publicize on publish — you said let Jetpack do its thing.

Files I’m proposing
- .github/workflows/wp-sync.yml — workflow (reusable).
- package.json — node dependencies.
- src/index.js — the main Node script.
- src/wp-client.js — lightweight helper (WP REST API).
- example content/post with draft.md and images.yml.
- README.md with setup & secrets.

All files below.

````yaml name=.github/workflows/wp-sync.yml
````

```json name=package.json
```

```javascript name=src/wp-client.js
```

```javascript name=src/index.js
```

````markdown name=README.md
````

Example images.yml
````markdown name=content/posts/20260224_MyShortTitle/images.yml
images:
  - file: hero.jpg
    caption: "A hero caption"
    alt: "An alt string for accessibility"
    credit: "Photo by Me"
````

Required GitHub secrets
- WP_URL — full site url, e.g. `https://example.com`
- WP_USER — WP username or user email for the application password
- WP_APP_PASSWORD — the application password you created for that WP user
- (The workflow uses `GITHUB_TOKEN` for PR comments; GitHub provides this automatically)

Notes & caveats
- The Action uses Basic auth with WP Application Passwords (recommended and supported by WP core).
- For PRs from forked repositories, GitHub does not make secrets available — so this workflow requires branches in the same repo or a different approach for forks.
- Drafts are created as WP drafts (not private), per your preference.
- On publish we allow Jetpack/Publicize to run normally.
- Repo is the source of truth; later merges will overwrite WP content.
- Tag and category creation is case-insensitive.

Security
- Keep the Application Password limited to a user with the level of access you want (author/editor).
- Rotate Application Passwords periodically (you can regenerate and update GitHub secret).

Next steps / optional improvements
- Add richer HTML processing (syntax highlighting, shortcodes).
- Support nested categories/hierarchical categories.
- Add a staging preview URL helper (requires WP configuration).
- Convert the Node script into a Docker-based action for distribution; currently this is a reusable workflow you can drop into any repo.

If you'd like, I can:
- Turn this node script into a packaged reusable action in its own repo for easy reuse across your projects.
- Add unit tests and improved error handling / retries for media uploads.
- Add explicit control over Jetpack Publicize behavior (suppress or trigger).

Finally, a short checklist to apply in your repository
- Add the workflow `.github/workflows/wp-sync.yml` to your repository.
- Add `src/` and `package.json` files and commit.
- Create a WordPress Application Password: WP Admin → Users → Your Profile → Application Passwords.
- Save secrets in GitHub repo Settings → Secrets:
  - WP_URL (e.g., https://yourdomain.com)
  - WP_USER (your WP username or email)
  - WP_APP_PASSWORD (application password)
- Create a new post directory `content/posts/YYYYMMDD_ShortTitle` with `draft.md`, `images.yml` and images.
- Open a PR — the workflow will run and create a WP draft and comment the PR with the post link.

Would you like me to:
- (A) produce a packaged, reusable action repo (action.yml + Dockerfile) you can reuse in any repo, or
- (B) keep this as a workspace-level solution (workflow + node script) to drop into `peterjmartinson/writing` or a separate DistractedFortune repo?

Also tell me if you want me to:
- Add automatic slug generation (from title) or
- Add explicit checks to fail the CI if required frontmatter fields are missing.

I can generate the packaged action next (option A) or finalize the workflow files for the current repo (option B). Which do you prefer?
