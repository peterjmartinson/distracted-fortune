import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildArticleEmail, buildArticleEmailFromFile, buildNewsletterEmail } from '../src/buttondown-sync.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const NEWSLETTER_FIXTURE = path.join(__dirname, 'fixtures', '02_simple_newsletter');
const ARTICLE_FIXTURE = path.join(__dirname, 'fixtures', '01_simple_post');
const JEKYLL_ARTICLE_FIXTURE = path.join(__dirname, 'fixtures', '03_jekyll_article.md');

// ---------------------------------------------------------------------------
// buildArticleEmail
// ---------------------------------------------------------------------------

test('should_use_email_subject_field_when_present', () => {
  const front = { email_subject: '[DF] Custom Subject', title: 'My Title', excerpt: 'Short summary.' };
  const { subject } = buildArticleEmail(front, 'https://example.com/post');
  assert.equal(subject, '[DF] Custom Subject');
});

test('should_fall_back_to_title_when_no_email_subject', () => {
  const front = { title: 'My Title', excerpt: 'Short summary.' };
  const { subject } = buildArticleEmail(front, 'https://example.com/post');
  assert.equal(subject, 'My Title');
});

test('should_include_excerpt_in_article_body', () => {
  const front = { title: 'My Title', excerpt: 'A short teaser.' };
  const { body } = buildArticleEmail(front, 'https://example.com/post');
  assert.ok(body.includes('A short teaser.'), 'body should contain the excerpt');
});

test('should_include_wp_link_in_article_body', () => {
  const front = { title: 'My Title', excerpt: 'A short teaser.' };
  const { body } = buildArticleEmail(front, 'https://example.com/post');
  assert.ok(body.includes('https://example.com/post'), 'body should contain the WP post URL');
});

test('should_omit_excerpt_paragraph_when_excerpt_is_empty', () => {
  const front = { title: 'My Title' };
  const { body } = buildArticleEmail(front, 'https://example.com/post');
  assert.ok(!body.includes('<p></p>'), 'should not include empty excerpt paragraph');
  assert.ok(body.includes('https://example.com/post'), 'should still include the post link');
});

// ---------------------------------------------------------------------------
// buildNewsletterEmail
// ---------------------------------------------------------------------------

test('should_use_email_subject_from_frontmatter_for_newsletter', async () => {
  const { subject } = await buildNewsletterEmail(NEWSLETTER_FIXTURE);
  assert.equal(subject, '[Distracted Fortune] Test Newsletter Subject');
});

test('should_convert_newsletter_body_to_html', async () => {
  const { body } = await buildNewsletterEmail(NEWSLETTER_FIXTURE);
  assert.ok(body.includes('<strong>bold text</strong>'), 'body should render bold markdown as HTML');
});

test('should_include_newsletter_link_as_anchor_tag', async () => {
  const { body } = await buildNewsletterEmail(NEWSLETTER_FIXTURE);
  assert.ok(
    body.includes('<a href="https://example.com">link</a>'),
    'body should render markdown links as anchor tags',
  );
});

// ---------------------------------------------------------------------------
// buildArticleEmailFromFile — Jekyll _posts file
// ---------------------------------------------------------------------------

test('should_build_article_url_from_site_url_and_permalink', async () => {
  const { body } = await buildArticleEmailFromFile(
    JEKYLL_ARTICLE_FIXTURE,
    'https://distractedfortune.com',
  );
  assert.ok(
    body.includes('https://distractedfortune.com/test-article/'),
    'body should contain the full article URL',
  );
});

test('should_include_excerpt_from_jekyll_article_in_body', async () => {
  const { body } = await buildArticleEmailFromFile(
    JEKYLL_ARTICLE_FIXTURE,
    'https://distractedfortune.com',
  );
  assert.ok(
    body.includes('A summary for testing the article email builder.'),
    'body should contain the excerpt from front matter',
  );
});

test('should_use_title_as_subject_for_jekyll_article', async () => {
  const { subject } = await buildArticleEmailFromFile(
    JEKYLL_ARTICLE_FIXTURE,
    'https://distractedfortune.com',
  );
  assert.equal(subject, 'Test Article');
});

test('should_strip_trailing_slash_from_site_url_before_joining_permalink', async () => {
  const { body } = await buildArticleEmailFromFile(
    JEKYLL_ARTICLE_FIXTURE,
    'https://distractedfortune.com/',
  );
  assert.ok(
    body.includes('https://distractedfortune.com/test-article/'),
    'should not produce double slash when siteUrl has trailing slash',
  );
});
