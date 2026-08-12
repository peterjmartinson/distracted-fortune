import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { getBufferMetadata } from '../src/buttondown-sync.js';
import { bufferClient } from '../src/buffer-client.js';

test('getBufferMetadata should parse frontmatter correctly for articles', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'buffer-meta-article-'));
  const filePath = path.join(tmpDir, 'test_article.md');

  const content = `---
title: "Burn The Ships"
excerpt: "Why taking bold action matters."
permalink: /burn-the-ships/
publish_post: true
publish_time: "2026-08-10 13:00"
---
Article body text`;

  fs.writeFileSync(filePath, content, 'utf8');

  const meta = getBufferMetadata(filePath, 'https://distractedfortune.com');

  assert.equal(meta.title, 'Burn The Ships');
  assert.equal(meta.excerpt, 'Why taking bold action matters.');
  assert.equal(meta.publishTime, '2026-08-10 13:00');
  assert.equal(meta.url, 'https://distractedfortune.com/burn-the-ships/');
  assert.equal(
    meta.text,
    'New post: Burn The Ships - Why taking bold action matters. https://distractedfortune.com/burn-the-ships/'
  );

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('getBufferMetadata should parse frontmatter correctly for newsletters', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'buffer-meta-newsletter-'));
  const newsDir = path.join(tmpDir, 'content', 'newsletters', '20260810_Test');
  fs.mkdirSync(newsDir, { recursive: true });
  const draftPath = path.join(newsDir, 'draft.md');

  const content = `---
title: "Weekly Insights"
email_subject: "Weekly Digest #42"
publish_post: true
publish_time: "2026-08-11 09:00"
---
Newsletter content`;

  fs.writeFileSync(draftPath, content, 'utf8');

  const meta = getBufferMetadata(newsDir, 'https://distractedfortune.com');

  assert.equal(meta.title, 'Weekly Insights');
  assert.equal(meta.publishTime, '2026-08-11 09:00');
  assert.equal(meta.text, 'New newsletter: Weekly Insights');

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('bufferClient should validate parameters before sending API calls', async () => {
  assert.throws(() => bufferClient({ accessToken: '' }), /requires an accessToken/);

  const client = bufferClient({ accessToken: 'test-token' });

  await assert.rejects(
    async () => client.createUpdate({ profileIds: [], text: 'Hello' }),
    /requires at least one profile ID/
  );

  await assert.rejects(
    async () => client.createUpdate({ profileIds: ['p1'], text: '' }),
    /requires text content/
  );
});

test('bufferClient should send GraphQL request with createPost mutation and Bearer token', async () => {
  const requests = [];
  const fakeHttp = {
    async post(url, data, options) {
      requests.push({ url, data, options });
      return { data: { data: { createPost: { id: 'post-123' } } } };
    },
  };

  const client = bufferClient({ accessToken: 'test-access-token', _httpClient: fakeHttp });
  const result = await client.createUpdate({
    profileIds: ['channel-1', 'channel-2'],
    text: 'Test post',
    scheduledAt: '2026-08-12 13:00',
  });

  assert.equal(result.buffer_count, 2);
  assert.equal(requests.length, 2);

  assert.equal(requests[0].url, 'https://api.buffer.com/graphql');
  assert.equal(requests[0].options.headers.Authorization, 'Bearer test-access-token');
  assert.equal(requests[0].options.headers['Content-Type'], 'application/json');

  assert.ok(requests[0].data.query.includes('createPost'));
  assert.equal(requests[0].data.variables.channelId, 'channel-1');
  assert.equal(requests[0].data.variables.text, 'Test post');
  assert.equal(requests[0].data.variables.scheduledAt, '2026-08-12 13:00');

  assert.equal(requests[1].data.variables.channelId, 'channel-2');
});

test('bufferClient should handle top-level errors array in GraphQL response', async () => {
  const fakeHttp = {
    async post() {
      return {
        data: {
          errors: [{ message: 'Unauthorized or token invalid' }],
        },
      };
    },
  };

  const client = bufferClient({ accessToken: 'invalid-token', _httpClient: fakeHttp });

  await assert.rejects(
    async () => client.createUpdate({ profileIds: ['channel-1'], text: 'Test' }),
    /Buffer GraphQL Error: Unauthorized or token invalid/
  );
});

