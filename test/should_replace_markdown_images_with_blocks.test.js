import test from 'node:test';
import assert from 'node:assert/strict';
import { replaceMarkdownImagesWithBlocks } from '../src/sync.js';

const IMAGE_MAP = {
  'hero.png': { id: 123, source_url: 'https://wp.test/uploads/hero.png', alt: 'Hero', caption: '' },
};

test('should_replace_local_image_ref_with_gutenberg_block', () => {
  const result = replaceMarkdownImagesWithBlocks('![Alt](hero.png)', IMAGE_MAP);
  assert.ok(result.includes('<!-- wp:image'), 'local image should be replaced with a Gutenberg block');
  assert.ok(result.includes('"id":123'), 'Gutenberg block should contain the attachment id');
});

test('should_preserve_alt_text_from_markdown_in_block', () => {
  const result = replaceMarkdownImagesWithBlocks('![My custom alt](hero.png)', IMAGE_MAP);
  assert.ok(result.includes('My custom alt'), 'alt text from markdown should appear in the Gutenberg block');
});

test('should_leave_external_http_images_unchanged', () => {
  const md = '![Ext](https://cdn.example.com/photo.jpg)';
  const result = replaceMarkdownImagesWithBlocks(md, IMAGE_MAP);
  assert.equal(result, md, 'external images should not be replaced');
});

test('should_leave_unrecognised_local_images_unchanged', () => {
  const md = '![Unknown](unknown.png)';
  const result = replaceMarkdownImagesWithBlocks(md, IMAGE_MAP);
  assert.equal(result, md, 'images absent from the image map should not be replaced');
});
