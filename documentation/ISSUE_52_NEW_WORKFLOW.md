## Problem

The repository currently has two article-authoring lanes:

1. `_posts/` (Jekyll-native; current GitHub Pages format)
2. `content/posts/` (legacy flow from former WordPress pipeline)

Newsletters are authored in `content/newsletters/` and should continue there.

This dual-lane article setup causes drift in front matter conventions, image handling, and workflow behavior (especially Buttondown email draft generation).

## Goal

Standardize on:

- **Articles** authored in `_posts/`
- **Newsletters** authored in `content/newsletters/` (unchanged behavior)

Update `new-post.ps1` and workflows accordingly so article and newsletter paths are clearly separated and intentional.

## Scope

### 1) Update `new-post.ps1` behavior

#### Article path (changed)
When user selects **Article**, script should:

- Create a feature branch (same spirit as today)
- Create a new markdown file in `_posts/` using Jekyll naming:
  - `_posts/YYYY-MM-DD-<slug>.md`
- Prompt for article metadata and write front matter for GitHub Pages/Jekyll:
  - `layout: post`
  - `title`
  - `date` (YYYY-MM-DD or configured date format used in repo)
  - `permalink`
  - `excerpt`
  - `tags`
  - `categories`
  - `featured_image` (leave blank placeholder by default)
- Do **not** create article folders in `content/posts/`
- Do **not** create `images.yml` for articles

#### Newsletter path (mostly unchanged)
When user selects **Newsletter**, script should continue to:

- Create newsletter branch style as currently used
- Create draft in `content/newsletters/...` using existing conventions
- Use simplified newsletter front matter:
  - `title`
  - `date`
  - `email_subject` (if current workflow expects it)
  - `categories: [Newsletter]` (or current equivalent)
- No excerpt/tags/categories complexity required beyond newsletter minimum

### 2) Update workflow logic for article emails

Current article email workflow should no longer read from `content/posts/**`.

Instead, for **articles**:

- Trigger from changes in `_posts/**` (or PRs that include `_posts/**`, depending on existing trigger model)
- Parse front matter from `_posts` markdown
- Build Buttondown email draft from:
  - Article title
  - Article URL/permalink
  - `excerpt` as primary summary body
- Preserve newsletter workflow behavior for `content/newsletters/**` unchanged

### 3) Image convention for articles

Adopt a clear article image policy:

- Keep article images under `assets/post-images/`
- `featured_image` in `_posts` front matter should be a site path (e.g. `/assets/post-images/<filename>`)
- `new-post.ps1` should include blank `featured_image` field so author can fill later

(Optionally, future enhancement: per-post subfolder under `assets/post-images/<slug>/`)

## Acceptance Criteria

- [ ] Creating **Article** via `new-post.ps1` generates `_posts/YYYY-MM-DD-<slug>.md` with correct post front matter and blank `featured_image`.
- [ ] Creating **Article** no longer writes anything under `content/posts/`.
- [ ] Creating **Newsletter** via `new-post.ps1` still writes to `content/newsletters/` with required newsletter front matter.
- [ ] Article email workflow reads `_posts/**` and uses front matter `excerpt` for Buttondown draft content.
- [ ] Newsletter workflow behavior remains functionally unchanged.
- [ ] Documentation/README updated with new authoring flow for Articles vs Newsletters.
- [ ] Legacy `content/posts` is explicitly marked deprecated (or ignored by workflows).

## Notes from repository review

- `_posts/2026-03-23-ai-fire.md` includes `excerpt` and `featured_image`, matching desired direction.
- Legacy `content/posts/20260323_AiFire/draft.md` and `images.yml` reflect old WordPress-era structure and image handling.
- `new-post.ps1` currently routes Articles to `content/posts/<date>_<Pascal>` and Newsletters to `content/newsletters/<date>_<Pascal>`.