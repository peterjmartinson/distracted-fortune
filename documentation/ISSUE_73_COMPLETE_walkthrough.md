# Walkthrough - Issue #72: Publish Post Flag & Automated Workflow Flip

We have implemented an explicit publishing flag (`publish_post: true`) in post/newsletter frontmatter to control Buttondown email creation, automated write-back to flip the flag to `false` after syncing in GitHub Actions, and updated local scaffolding scripts (`new-post.ps1` and `new-post.sh`) with git safety checks (`git pull` before branching).

## Changes Made

### Sync Engine

#### [src/buttondown-sync.js](file:///C:/Users/Admin/Documents/distracted-fortune/src/buttondown-sync.js)
- Added `shouldPublishPost(fileOrDir)` helper to check if frontmatter contains `publish_post: true` or `"true"`.
- Added `flipPublishFlag(fileOrDir)` helper to update `publish_post` from `true` to `false` in markdown frontmatter.

#### [src/index.js](file:///C:/Users/Admin/Documents/distracted-fortune/src/index.js)
- Filtered `articleFiles` and `newsletterDirs` in `handleMerge()` so only posts with `publish_post: true` are processed.
- Called `flipPublishFlag(filePath)` / `flipPublishFlag(dir)` after creating Buttondown draft emails.

---

### GitHub Actions Workflow

#### [.github/workflows/buttondown-sync.yml](file:///C:/Users/Admin/Documents/distracted-fortune/.github/workflows/buttondown-sync.yml)
- Updated permissions to `contents: write`.
- Added automated step to commit and push updated markdown files (`publish_post: false`) with commit message `Auto-flip publish_post flag to false [skip ci]`.

---

### Scaffolding Wizards

#### [new-post.ps1](file:///C:/Users/Admin/Documents/distracted-fortune/new-post.ps1)
- Added git status dirty check and automatic checkout of default branch (`main`) followed by `git pull` prior to creating feature/newsletter branches.
- Updated frontmatter templates for Articles and Newsletters to include `publish_post: true`.

#### [new-post.sh](file:///C:/Users/Admin/Documents/distracted-fortune/new-post.sh)
- Updated Article path to `_posts/YYYY-MM-DD-slug.md`.
- Added git status dirty check, checkout of default branch, and `git pull` before branching out.
- Updated frontmatter templates for Articles and Newsletters to include `publish_post: true`.

---

### Automated Tests

#### [test/should_filter_publish_post.test.js](file:///C:/Users/Admin/Documents/distracted-fortune/test/should_filter_publish_post.test.js)
- Added unit tests verifying `shouldPublishPost` filtering behavior and `flipPublishFlag` frontmatter modification.

## Verification Results

### Automated Tests
Ran full test suite (`npm test`):
- All **56 tests passed** (0 failures).

```text
✔ shouldPublishPost should return true only when publish_post is true (34.5ms)
✔ flipPublishFlag should update publish_post to false in markdown frontmatter (12.1ms)
ℹ tests 56
ℹ pass 56
ℹ fail 0
```
