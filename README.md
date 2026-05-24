This holds the content for https://distractedfortune.com

Publishing workflow
-------------------

Content is organized into two types, detected by directory path:

**Articles** (`content/posts/YYYYMMDD_Title/draft.md`)
- On PR open: a draft is created (or updated) in WordPress.
- On PR merge: a Buttondown draft email is created containing the post excerpt and a link to the WordPress post. You review and send it manually in Buttondown.

**Newsletters** (`content/newsletters/YYYYMMDD_Title/draft.md`)
- On PR open: nothing happens — newsletters never go to WordPress.
- On PR merge: a Buttondown draft email is created with the full newsletter content converted to HTML. You review and send it manually in Buttondown.

Required GitHub Actions secrets
- `BOT_USERNAME` / `BOT_PASSWORD` — WordPress credentials for JWT auth (articles only)
- `WP_URL` — WordPress site URL (articles only)
- `WP_USER` — WordPress username (articles only)
- `BUTTONDOWN_API_KEY` — Buttondown API key (Settings → API Keys in Buttondown)

CI and forked pull requests
----------------------------

The wp-sync workflow needs repository secrets (BOT_USERNAME and BOT_PASSWORD) to fetch a JWT token for the WordPress site. GitHub does not expose repository secrets to workflows triggered by pull requests from forks. If you open a PR from a fork, the workflow will fail early with a clear error message.

If you need to allow a job to use secrets for PRs from forks, consider moving the secret-using step into a `pull_request_target` workflow (see https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#pull_request_target) and take security precautions (do not run untrusted PR code before using secrets). For more about secrets and Actions, see https://docs.github.com/en/actions/security-guides/encrypted-secrets.
