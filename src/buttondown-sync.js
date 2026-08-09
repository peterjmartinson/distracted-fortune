/**
 * buttondown-sync.js — Build Buttondown email content from local markdown drafts.
 *
 * Handles two content types:
 *  - Articles (content/posts/): excerpt + WordPress post link
 *  - Newsletters (content/newsletters/): full markdown body converted to HTML
 */
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';

/**
 * Convert a markdown string to HTML.
 * @param {string} markdown
 * @returns {Promise<string>}
 */
async function markdownToHtml(markdown) {
  const vfile = await unified()
    .use(remarkParse)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(markdown);
  return String(vfile);
}

/**
 * Build Buttondown email content for an article.
 * Sends the excerpt and a link to the full post on WordPress.
 *
 * @param {{ title?: string, excerpt?: string, email_subject?: string }} frontmatter
 * @param {string} wpPostUrl - WordPress post URL
 * @returns {{ subject: string, body: string }}
 */
export function buildArticleEmail(frontmatter, wpPostUrl) {
  const subject = frontmatter.email_subject || frontmatter.title || 'New post';
  const excerpt = frontmatter.excerpt || '';
  const body = [
    excerpt ? `<p>${excerpt}</p>` : '',
    `<p><a href="${wpPostUrl}">Read the full post →</a></p>`,
  ]
    .filter(Boolean)
    .join('\n');
  return { subject, body };
}

/**
 * Build Buttondown email content for a Jekyll article in `_posts/`.
 * Reads front matter from the file, constructs the full article URL from
 * siteUrl + permalink, and delegates to buildArticleEmail.
 *
 * @param {string} filePath - path to the `_posts/YYYY-MM-DD-slug.md` file
 * @param {string} siteUrl - site base URL, e.g. "https://distractedfortune.com"
 * @returns {Promise<{ subject: string, body: string }>}
 */
export async function buildArticleEmailFromFile(filePath, siteUrl) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = matter(raw);
  const front = parsed.data;
  const permalink = front.permalink || '/';
  const articleUrl = siteUrl.replace(/\/$/, '') + permalink;
  return buildArticleEmail(front, articleUrl);
}

/**
 * Build Buttondown email content for a newsletter.
 * Converts the full draft.md body to HTML.
 *
 * @param {string} postDir - path to the newsletter directory
 * @returns {Promise<{ subject: string, body: string }>}
 */
export async function buildNewsletterEmail(postDir) {
  const mdPath = path.join(postDir, 'draft.md');
  const raw = fs.readFileSync(mdPath, 'utf8');
  const parsed = matter(raw);
  const front = parsed.data;

  const subject = front.email_subject || front.title || 'New newsletter';
  const body = await markdownToHtml(parsed.content);
  return { subject, body };
}

/**
 * Check if a file (or post directory containing draft.md) has publish_post: true.
 *
 * @param {string} fileOrDir - path to markdown file or directory containing draft.md
 * @returns {boolean}
 */
export function shouldPublishPost(fileOrDir) {
  const mdPath = fs.existsSync(fileOrDir) && fs.statSync(fileOrDir).isDirectory()
    ? path.join(fileOrDir, 'draft.md')
    : fileOrDir;

  if (!fs.existsSync(mdPath)) return false;
  const raw = fs.readFileSync(mdPath, 'utf8');
  const parsed = matter(raw);
  const val = parsed.data.publish_post;
  return val === true || val === 'true';
}

/**
 * Extract metadata for Buffer social media update from a markdown file or newsletter directory.
 *
 * @param {string} fileOrDir - path to markdown file or directory containing draft.md
 * @param {string} [siteUrl] - optional site base URL for constructing full permalink URLs
 * @returns {{ title: string, excerpt: string, publishTime: string|null, url: string|null, text: string }}
 */
export function getBufferMetadata(fileOrDir, siteUrl) {
  const mdPath = fs.existsSync(fileOrDir) && fs.statSync(fileOrDir).isDirectory()
    ? path.join(fileOrDir, 'draft.md')
    : fileOrDir;

  if (!fs.existsSync(mdPath)) {
    return { title: '', excerpt: '', publishTime: null, url: null, text: '' };
  }

  const raw = fs.readFileSync(mdPath, 'utf8');
  const parsed = matter(raw);
  const front = parsed.data;

  const isNewsletter = fileOrDir.includes('newsletters');
  const title = front.title || front.email_subject || (isNewsletter ? 'New newsletter' : 'New post');
  const excerpt = front.excerpt || '';
  const publishTime = front.publish_time ? String(front.publish_time) : null;
  const permalink = front.permalink || null;
  const url = (permalink && siteUrl) ? siteUrl.replace(/\/$/, '') + permalink : null;

  let text;
  if (isNewsletter) {
    text = excerpt ? `New newsletter: ${title} - ${excerpt}` : `New newsletter: ${title}`;
    if (url) text += ` ${url}`;
  } else {
    if (excerpt && url) {
      text = `New post: ${title} - ${excerpt} ${url}`;
    } else if (excerpt) {
      text = `New post: ${title} - ${excerpt}`;
    } else if (url) {
      text = `New post: ${title} ${url}`;
    } else {
      text = `New post: ${title}`;
    }
  }

  return { title, excerpt, publishTime, url, text };
}

/**
 * Update the publish_post flag in a markdown file frontmatter to false.
 *
 * @param {string} fileOrDir - path to markdown file or directory containing draft.md
 */
export function flipPublishFlag(fileOrDir) {
  const mdPath = fs.existsSync(fileOrDir) && fs.statSync(fileOrDir).isDirectory()
    ? path.join(fileOrDir, 'draft.md')
    : fileOrDir;

  if (!fs.existsSync(mdPath)) return;
  const raw = fs.readFileSync(mdPath, 'utf8');
  if (/publish_post:\s*(true|"true"|'true')/i.test(raw)) {
    const updated = raw.replace(/publish_post:\s*(true|"true"|'true')/i, 'publish_post: false');
    fs.writeFileSync(mdPath, updated, 'utf8');
  } else {
    const parsed = matter(raw);
    parsed.data.publish_post = false;
    const updated = matter.stringify(parsed.content, parsed.data);
    fs.writeFileSync(mdPath, updated, 'utf8');
  }
}


