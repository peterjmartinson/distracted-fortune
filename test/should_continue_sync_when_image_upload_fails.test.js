import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createOrUpdateDraftFromDir } from '../src/sync.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE = path.join(__dirname, 'fixtures', '01_simple_post');

test('should_still_create_post_when_image_upload_fails', async () => {
  let createPostCalled = false;
  const fakeWp = {
    uploadMedia: async () => {
      throw new Error('Simulated upload failure');
    },
    attachMediaToPost: async () => ({}),
    findOrCreateTerm: async () => 1,
    createPost: async () => {
      createPostCalled = true;
      return { id: 999, link: 'https://wp.test/?p=999', slug: 'test-post', date: '2026-01-01' };
    },
    updatePost: async () => {
      throw new Error('updatePost should not be called');
    },
  };
  const fakePrHelpers = {
    readMapping: async () => null,
    writeMapping: async () => {},
    commentOnPR: async () => {},
  };

  await createOrUpdateDraftFromDir(FIXTURE, 1, fakeWp, fakePrHelpers);

  assert.ok(createPostCalled, 'createPost should still be called even when image upload fails');
});

test('should_report_image_upload_failures_in_pr_comment', async () => {
  const comments = [];
  const fakeWp = {
    uploadMedia: async () => {
      throw new Error('Simulated upload failure');
    },
    attachMediaToPost: async () => ({}),
    findOrCreateTerm: async () => 1,
    createPost: async () => ({
      id: 999,
      link: 'https://wp.test/?p=999',
      slug: 'test-post',
      date: '2026-01-01',
    }),
    updatePost: async () => {
      throw new Error('updatePost should not be called');
    },
  };
  const fakePrHelpers = {
    readMapping: async () => null,
    writeMapping: async () => {},
    commentOnPR: async (_prNumber, message) => {
      comments.push(message);
    },
  };

  await createOrUpdateDraftFromDir(FIXTURE, 1, fakeWp, fakePrHelpers);

  const warningComment = comments.find((c) => c.includes('⚠️') || c.toLowerCase().includes('failed to upload'));
  assert.ok(warningComment, 'a warning PR comment should be posted when image upload fails');
});
