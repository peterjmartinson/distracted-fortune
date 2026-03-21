import test from 'node:test';
import assert from 'node:assert/strict';
import { extractLocalImages } from '../src/sync.js';

test('should_return_image_refs_from_markdown', () => {
  const images = extractLocalImages('![Alt text](hero.png)');
  assert.equal(images.length, 1);
  assert.equal(images[0].src, 'hero.png');
  assert.equal(images[0].alt, 'Alt text');
});

test('should_strip_leading_dot_slash_from_src', () => {
  const images = extractLocalImages('![Alt](./images/photo.jpg)');
  assert.equal(images[0].src, 'images/photo.jpg');
});

test('should_exclude_external_http_images', () => {
  const images = extractLocalImages('![Alt](https://example.com/photo.jpg)');
  assert.equal(images.length, 0);
});

test('should_return_empty_array_when_no_images_present', () => {
  const images = extractLocalImages('No images here, just text.');
  assert.equal(images.length, 0);
});
