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
