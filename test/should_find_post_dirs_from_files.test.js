import test from 'node:test';
import assert from 'node:assert/strict';
import { findPostDirsFromFiles } from '../src/find-post-dirs.js';

test('should_detect_draft_under_posts_directory', () => {
  const dirs = findPostDirsFromFiles(['content/posts/my-post/draft.md']);
  assert.deepEqual(dirs, ['content/posts/my-post']);
});

test('should_detect_draft_under_newsletters_directory', () => {
  const dirs = findPostDirsFromFiles(['content/newsletters/20260418_NutUp/draft.md']);
  assert.deepEqual(dirs, ['content/newsletters/20260418_NutUp']);
});

test('should_detect_drafts_from_both_posts_and_newsletters', () => {
  const dirs = findPostDirsFromFiles([
    'content/posts/my-post/draft.md',
    'content/newsletters/20260418_NutUp/draft.md',
  ]);
  assert.equal(dirs.length, 2);
  assert.ok(dirs.includes('content/posts/my-post'));
  assert.ok(dirs.includes('content/newsletters/20260418_NutUp'));
});

test('should_return_empty_array_when_no_draft_files_present', () => {
  const dirs = findPostDirsFromFiles(['content/posts/my-post/index.md', 'README.md']);
  assert.deepEqual(dirs, []);
});

test('should_deduplicate_the_same_draft_file', () => {
  const dirs = findPostDirsFromFiles([
    'content/posts/my-post/draft.md',
    'content/posts/my-post/draft.md',
  ]);
  assert.deepEqual(dirs, ['content/posts/my-post']);
});
