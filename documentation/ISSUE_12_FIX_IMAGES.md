# WP post body images: ensure markdown images are replaced with uploaded URLs and show inline in Gutenberg editor 

## Summary
Images in post body markdown are uploaded to the WordPress Media Library, but after syncing to WP via the workflow, the WP draft displays placeholders instead of actual images until I manually edit the post and replace markdown references with the real URLs. This does **not** affect the featured (frontmatter) image, which works as expected.

This ticket documents a bulletproof, step-by-step plan to have images referenced in markdown display correctly in both Gutenberg editor and on the published site, with the sync workflow replacing each markdown image reference with the WP image (using an image block if possible). The goal is to never have to touch the WP draft manually for image corrections.

### Status quo
- Images are referenced in markdown like: `![Transaction](02_transaction_detail.png)`
- Images are placed in the same content/posts/{postdir}/ folder as the draft.md
- On PR, the workflow (`wp-sync.yml` · `src/index.js`) runs, uploads these images to WP, and attempts to replace references. But images in the body content show as missing/placeholder in both the Gutenberg editor and the front-end until replaced by hand.
- Media do upload, with correct caption/alt from images.yml, and are visible in the Media Library.

---

## Implementation Plan: Step-by-step (backwards-compatible)
1. **Parse draft.md** before markdown→HTML conversion, extract all body images (`![](...)`), and for each:
     - If local file, compute hash (SHA256 or similar)
     - Search WP media for any file with the **same filename**
         - If found, download and compare hash (only among matching filenames)
         - Reuse media if hash matches; otherwise upload file
     - Capture attachment `id` and `source_url`
2. **Replace markdown refs** for images with true Gutenberg image blocks using the returned `id` and `source_url` (structure: `<!-- wp:image {"id":123} -->\n<figure class=...><img ... /></figure>\n<!-- /wp:image -->`).
3. **Convert markdown→HTML**, preserving new image block replacements.
4. **Publish post content** (create/update WP draft) with these blocks embedded; continue to upload images per-post (leave repo markdown unchanged).
5. **(Optional) Attach media** to the created/updated post (`media.post = postId`) to reflect proper ownership in WP.
6. **Show errors in PR comment** if any images fail to upload/attach, but always proceed to push the post. Report names and error details.
7. If images are missing from images.yml, upload with only required metadata (skip alt/caption if not in YAML).
8. Only images in the post folder are processed; do not attempt global duplicate detection by hash.
9. Continue to use JWT auth (no further changes needed).

---

## Acceptance Criteria / Test Plan
- [ ] Images referenced in post markdown are correctly displayed inline in Gutenberg and on the front-end
- [ ] Uploaded images are attached to the post (in WP Media Library)
- [ ] No manual fixup is needed after PR is opened/synced
- [ ] Featured (frontmatter) images continue to work as before
- [ ] Sync succeeds if any one image fails (with warning in PR comment)
- [ ] Repo markdown files remain unmodified
- [ ] Duplicate filenames in different post folders do **not** cause hash or URL reuse (unless same content & filename)
- [ ] No CDN or URL rewriting required

## References
- Example PR: #10
- Discussion: https://github.com/peterjmartinson/distracted-fortune/pull/10

## Notes
- Please do **not** raise a PR for this issue automatically; leave implementation to repo owner when ready.
- When replacing markdown images, prefer the Gutenberg image block markup over a simple absolute URL for maximum editor compatibility.

---

**Owner handoff:** Review these steps before beginning. If you have questions about edge cases (e.g., future support for external images, other folders, or global dedupe), leave a comment here.