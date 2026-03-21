import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createOrUpdateDraftFromDir } from '../src/sync.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE = path.join(__dirname, 'fixtures', '01_simple_post');

function makeFakeWp(overrides = {}) {
  return {
    uploadMedia: async (_stream, filename) => ({
      id: 123,
      source_url: `https://wp.test/uploads/${filename}`,
    }),
    attachMediaToPost: async () => ({}),
    findOrCreateTerm: async () => 1,
    createPost: async (payload) => ({
      id: 999,
      link: 'https://wp.test/?p=999',
      slug: 'test-post',
      date: '2026-01-01',
      ...payload,
    }),
    updatePost: async () => {
      throw new Error('updatePost should not be called in this test');
    },
    ...overrides,
  };
}

function makeFakePrHelpers(overrides = {}) {
  return {
    readMapping: async () => null,
    writeMapping: async () => {},
    commentOnPR: async () => {},
    ...overrides,
  };
}

test('should_insert_gutenberg_image_blocks_for_local_images', async () => {
  let capturedContent = null;
  const fakeWp = makeFakeWp({
    createPost: async (payload) => {
      capturedContent = payload.content;
      return { id: 999, link: 'https://wp.test/?p=999', slug: 'test-post', date: '2026-01-01' };
    },
  });

  await createOrUpdateDraftFromDir(FIXTURE, 1, fakeWp, makeFakePrHelpers());

  assert.ok(capturedContent, 'createPost should have been called with content');
  assert.ok(
    capturedContent.includes('<!-- wp:image'),
    'post content should contain a Gutenberg image block comment',
  );
  assert.ok(
    capturedContent.includes('"id":123'),
    'Gutenberg block should include the uploaded image attachment id',
  );
  assert.ok(
    capturedContent.includes('https://wp.test/uploads/hero.png'),
    'Gutenberg block should include the uploaded image source URL',
  );
});

test('should_include_caption_from_images_yml_in_gutenberg_block', async () => {
  let capturedContent = null;
  const fakeWp = makeFakeWp({
    createPost: async (payload) => {
      capturedContent = payload.content;
      return { id: 999, link: 'https://wp.test/?p=999', slug: 'test-post', date: '2026-01-01' };
    },
  });

  await createOrUpdateDraftFromDir(FIXTURE, 1, fakeWp, makeFakePrHelpers());

  // images.yml declares caption: "Figure 1" for hero.png
  assert.ok(capturedContent.includes('Figure 1'), 'Gutenberg block should include caption from images.yml');
});

test('should_not_modify_draft_md_file_on_disk', async () => {
  const draftPath = path.join(FIXTURE, 'draft.md');
  const before = readFileSync(draftPath, 'utf8');

  await createOrUpdateDraftFromDir(FIXTURE, 1, makeFakeWp(), makeFakePrHelpers());

  const after = readFileSync(draftPath, 'utf8');
  assert.equal(after, before, 'draft.md should be unmodified on disk after sync');
});

test('should_create_post_with_draft_status_on_first_sync', async () => {
  let capturedStatus = null;
  const fakeWp = makeFakeWp({
    createPost: async (payload) => {
      capturedStatus = payload.status;
      return { id: 999, link: 'https://wp.test/?p=999', slug: 'test-post', date: '2026-01-01' };
    },
  });

  await createOrUpdateDraftFromDir(FIXTURE, 1, fakeWp, makeFakePrHelpers());

  assert.equal(capturedStatus, 'draft', 'newly created post should have status "draft"');
});

test('should_attach_uploaded_body_images_to_post', async () => {
  const attachedPairs = [];
  const fakeWp = makeFakeWp({
    attachMediaToPost: async (mediaId, postId) => {
      attachedPairs.push({ mediaId, postId });
      return {};
    },
  });

  await createOrUpdateDraftFromDir(FIXTURE, 1, fakeWp, makeFakePrHelpers());

  assert.equal(attachedPairs.length, 1, 'should call attachMediaToPost once for the one image in the fixture');
  assert.equal(attachedPairs[0].mediaId, 123, 'should attach with the correct media id');
  assert.equal(attachedPairs[0].postId, 999, 'should attach to the id of the created post');
});
