import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { shouldPublishPost, flipPublishFlag } from '../src/buttondown-sync.js';

test('shouldPublishPost should return true only when publish_post is true', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pub-test-'));

  const fileTrue = path.join(tmpDir, 'post_true.md');
  fs.writeFileSync(fileTrue, '---\ntitle: Test\npublish_post: true\n---\nBody');

  const fileStringTrue = path.join(tmpDir, 'post_str_true.md');
  fs.writeFileSync(fileStringTrue, '---\ntitle: Test\npublish_post: "true"\n---\nBody');

  const fileFalse = path.join(tmpDir, 'post_false.md');
  fs.writeFileSync(fileFalse, '---\ntitle: Test\npublish_post: false\n---\nBody');

  const fileMissing = path.join(tmpDir, 'post_missing.md');
  fs.writeFileSync(fileMissing, '---\ntitle: Test\n---\nBody');

  assert.equal(shouldPublishPost(fileTrue), true, 'publish_post: true should return true');
  assert.equal(shouldPublishPost(fileStringTrue), true, 'publish_post: "true" should return true');
  assert.equal(shouldPublishPost(fileFalse), false, 'publish_post: false should return false');
  assert.equal(shouldPublishPost(fileMissing), false, 'missing publish_post should return false');

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('flipPublishFlag should update publish_post to false in markdown frontmatter', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pub-flip-test-'));

  const fileTrue = path.join(tmpDir, 'post_true.md');
  fs.writeFileSync(fileTrue, '---\ntitle: Test Post\npublish_post: true\nexcerpt: Hello\n---\nBody text');

  flipPublishFlag(fileTrue);

  const updatedRaw = fs.readFileSync(fileTrue, 'utf8');
  assert.ok(updatedRaw.includes('publish_post: false'), 'file should contain publish_post: false');
  assert.equal(shouldPublishPost(fileTrue), false, 'shouldPublishPost should return false after flip');

  fs.rmSync(tmpDir, { recursive: true, force: true });
});
