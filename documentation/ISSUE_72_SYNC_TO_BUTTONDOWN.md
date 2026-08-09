# Issue #72: Sync to Buttondown

## Problem Statement

When a pull request is merged to `main`/`master`, the Buttondown sync workflow (`buttondown-sync.yml` running `src/index.js`) identifies all articles/newsletters added or modified in that PR and syncs them. If the PR contains typo fixes or formatting changes to older articles, those are also picked up, resulting in unwanted duplicate draft emails in Buttondown.

We need a way to selectively sync only the intended articles or newsletters.

## Proposed Solution

Implement an explicit sync flag (`publish_post: true`) inside the frontmatter of posts and newsletters, combined with an automated post-sync workflow flip and wizard integration.

## Scope & Implementation Details

### 1. Frontmatter Flag & Sync Filtering
- Update `src/index.js` to read the YAML frontmatter of modified files.
- Only sync files that explicitly contain `publish_post: true`.

### 2. Automated Workflow Write-back (Flip to False)
- Modify the GitHub Actions workflow to run a script after successful syncs.
- This script will rewrite the synced files, changing `publish_post` to `false` (or removing it).
- The workflow will commit and push this change back to `main`/`master` (using `[skip ci]` in the commit message to avoid trigger loops).

### 3. Wizard Scaffolding (`new-post.ps1` & `new-post.sh`)
- Update local scaffolding scripts to include `publish_post: true` in the frontmatter of new templates.
- **Git Pull Automation**: To prevent local git branches from going out of sync (since the workflow pushes commits back to remote), update the scripts to run a safety check:
  1. Ensure the working tree is clean.
  2. Switch to the default branch (`main` or `master`).
  3. Pull the latest remote changes (`git pull`).
  4. Branch out for the new post.

## Acceptance Criteria

- [ ] `src/index.js` reads YAML frontmatter of modified files and only syncs posts with `publish_post: true`.
- [ ] Post-sync workflow step updates synced markdown files to set `publish_post: false` (or remove it).
- [ ] Post-sync workflow commits and pushes updated files back to `main`/`master` with `[skip ci]`.
- [ ] `new-post.ps1` and `new-post.sh` scaffolding scripts populate `publish_post: true` in frontmatter for new articles/newsletters.
- [ ] Scaffolding scripts check clean working tree, switch to default branch, run `git pull`, and branch out before creating new posts.
