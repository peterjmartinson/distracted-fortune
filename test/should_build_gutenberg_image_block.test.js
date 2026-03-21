import test from 'node:test';
import assert from 'node:assert/strict';
import { buildGutenbergImageBlock } from '../src/sync.js';

test('should_include_wp_image_block_comment_with_id', () => {
  const block = buildGutenbergImageBlock(42, 'https://example.com/img.png', 'Alt', '');
  assert.ok(block.includes('<!-- wp:image {"id":42'), 'block should open with Gutenberg comment containing the id');
});

test('should_include_closing_wp_image_block_comment', () => {
  const block = buildGutenbergImageBlock(42, 'https://example.com/img.png', '', '');
  assert.ok(block.includes('<!-- /wp:image -->'), 'block should close with Gutenberg comment');
});

test('should_include_source_url_in_img_tag', () => {
  const block = buildGutenbergImageBlock(42, 'https://example.com/img.png', '', '');
  assert.ok(block.includes('https://example.com/img.png'), 'block should contain the source URL in the img src');
});

test('should_include_figcaption_when_caption_provided', () => {
  const block = buildGutenbergImageBlock(42, 'https://example.com/img.png', '', 'My caption');
  assert.ok(block.includes('<figcaption'), 'block should include a figcaption element when caption is provided');
  assert.ok(block.includes('My caption'), 'figcaption should contain the caption text');
});

test('should_omit_figcaption_when_no_caption_provided', () => {
  const block = buildGutenbergImageBlock(42, 'https://example.com/img.png', '', '');
  assert.ok(!block.includes('<figcaption'), 'block should not include figcaption when caption is empty');
});

test('should_escape_html_special_chars_in_alt_text', () => {
  const block = buildGutenbergImageBlock(42, 'https://example.com/img.png', 'Alt <script>xss</script>', '');
  assert.ok(!block.includes('<script>'), 'unescaped script tag should not appear in alt text');
  assert.ok(block.includes('&lt;script&gt;'), 'angle brackets should be HTML-escaped in alt text');
});
