import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const postsDir = path.join(rootDir, '_posts');
const featuredPrefix = '/assets/post-images/';

test('should_define_custom_head_include_for_favicons', () => {
  const headCustom = fs.readFileSync(path.join(rootDir, '_includes', 'head_custom.html'), 'utf8');

  assert.match(headCustom, /favicon_beige_32\.png/);
  assert.match(headCustom, /favicon_beige_16x16\.png/);
  assert.match(headCustom, /favicon_bw_180x180\.png/);
});

test('should_define_post_layout_that_renders_featured_image', () => {
  const postLayout = fs.readFileSync(path.join(rootDir, '_layouts', 'post.html'), 'utf8');

  assert.match(postLayout, /\{\% if page\.featured_image %\}/);
  assert.match(postLayout, /page\.featured_image \| relative_url/);
  assert.match(postLayout, /post-featured-image/);
});

test('should_point_posts_at_existing_featured_image_assets', () => {
  const posts = fs.readdirSync(postsDir).filter((file) => file.endsWith('.md'));

  for (const postFile of posts) {
    const postContent = fs.readFileSync(path.join(postsDir, postFile), 'utf8');
    const featuredImage = postContent.match(/^featured_image:\s*(.+)$/m)?.[1]?.trim();

    if (!featuredImage) continue;

    assert.ok(
      featuredImage.startsWith(featuredPrefix),
      `${postFile} should use ${featuredPrefix}`,
    );

    const assetPath = path.join(rootDir, featuredImage.slice(1));
    assert.ok(fs.existsSync(assetPath), `${postFile} references missing asset ${featuredImage}`);
  }
});
