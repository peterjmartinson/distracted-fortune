/**
 * sync.js — Core WP post sync logic.
 *
 * Pure helpers and async functions are exported and accept a `wp` client as a
 * parameter so they can be unit-tested without real network calls.
 *
 * References: Issue #12
 */
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import yaml from 'js-yaml';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';

// ---------------------------------------------------------------------------
// Pure helpers (no I/O — fully unit-testable)
// ---------------------------------------------------------------------------

/**
 * Extract all local (non-http) image references from markdown text.
 * @param {string} markdown
 * @returns {{ alt: string, src: string }[]}
 */
export function extractLocalImages(markdown) {
  const regex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const images = [];
  let match;
  while ((match = regex.exec(markdown)) !== null) {
    const [, alt, src] = match;
    if (!/^https?:\/\//i.test(src)) {
      images.push({ alt, src: src.replace(/^\.\//, '') });
    }
  }
  return images;
}

/**
 * Build Gutenberg image block markup for a given WP media upload.
 * @param {number} id         - WP media attachment id
 * @param {string} sourceUrl  - uploaded image URL
 * @param {string} [alt]      - alt text
 * @param {string} [caption]  - caption text (element omitted when empty)
 * @returns {string}
 */
export function buildGutenbergImageBlock(id, sourceUrl, alt = '', caption = '') {
  const captionHtml = caption
    ? `<figcaption class="wp-element-caption">${escapeHtml(caption)}</figcaption>`
    : '';
  return [
    `<!-- wp:image {"id":${id},"sizeSlug":"full","linkDestination":"none"} -->`,
    `<figure class="wp-block-image size-full"><img src="${sourceUrl}" alt="${escapeHtml(alt)}" class="wp-image-${id}"/>${captionHtml}</figure>`,
    `<!-- /wp:image -->`,
  ].join('\n');
}

/**
 * Replace local markdown image references with Gutenberg image blocks.
 * External (http/https) images and images absent from imageMap are left unchanged.
 *
 * @param {string} markdown
 * @param {Record<string, { id: number, source_url: string, alt: string, caption: string }>} imageMap
 * @returns {string}
 */
export function replaceMarkdownImagesWithBlocks(markdown, imageMap) {
  return markdown.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (full, alt, src) => {
    if (/^https?:\/\//i.test(src)) return full;
    const filename = src.replace(/^\.\//, '');
    const info = imageMap[filename];
    if (!info) return full;
    // Blank lines ensure remark treats the HTML block as a standalone block element.
    return (
      '\n\n' +
      buildGutenbergImageBlock(
        info.id,
        info.source_url,
        alt || info.alt || '',
        info.caption || '',
      ) +
      '\n\n'
    );
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ---------------------------------------------------------------------------
// Async helpers
// ---------------------------------------------------------------------------

/**
 * Upload all image files found in postDir to WP.
 * Reads optional images.yml for title/alt/caption metadata.
 * Failed uploads are collected in `errors` rather than thrown so the sync
 * can continue.
 *
 * @param {string} postDir
 * @param {object} wp  - WP client (must expose uploadMedia())
 * @returns {{ map: Record<string, {id, source_url, alt, caption}>, errors: {fname, error}[] }}
 */
export async function uploadImagesForDir(postDir, wp) {
  const imgMetaPath = path.join(postDir, 'images.yml');
  let meta = {};
  if (fs.existsSync(imgMetaPath)) {
    meta = yaml.load(fs.readFileSync(imgMetaPath, 'utf8')) || {};
  }

  const files = fs
    .readdirSync(postDir)
    .filter((f) => /\.(jpe?g|png|gif|webp|svg)$/i.test(f));

  const map = {};
  const errors = [];

  for (const fname of files) {
    const m = (meta.images || []).find((i) => i.file === fname) || {};
    const title = m.title || path.parse(fname).name;
    const alt = m.alt || '';
    const caption = m.caption || '';
    try {
      const stream = fs.createReadStream(path.join(postDir, fname));
      const uploaded = await wp.uploadMedia(stream, fname, {
        title,
        alt_text: alt,
        caption,
      });
      map[fname] = { id: uploaded.id, source_url: uploaded.source_url, alt, caption };
      console.log(`Uploaded ${fname} => ${uploaded.source_url}`);
    } catch (e) {
      const msg = e.response ? JSON.stringify(e.response.data) : e.message;
      console.error(`Failed to upload ${fname}: ${msg}`);
      errors.push({ fname, error: msg });
    }
  }

  return { map, errors };
}

/**
 * Create or update a WP draft from a post directory.
 *
 * @param {string} postDir
 * @param {number} prNumber
 * @param {object} wp         - WP client ({uploadMedia, findOrCreateTerm, createPost, updatePost, attachMediaToPost})
 * @param {object} prHelpers  - {readMapping, writeMapping, commentOnPR}
 * @returns {{ post: object, imageErrors: object[] } | undefined}
 */
export async function createOrUpdateDraftFromDir(postDir, prNumber, wp, prHelpers) {
  const { readMapping, writeMapping, commentOnPR } = prHelpers;

  const mdPath = path.join(postDir, 'draft.md');
  if (!fs.existsSync(mdPath)) {
    console.log(`draft.md not found in ${postDir}`);
    return;
  }

  const raw = fs.readFileSync(mdPath, 'utf8');
  const parsed = matter(raw);
  const front = parsed.data;

  // 1. Upload all local body images (featured image handled separately below)
  const { map: imageMap, errors: imageErrors } = await uploadImagesForDir(postDir, wp);

  // 2. Replace markdown image refs with Gutenberg blocks in-memory; repo files stay unchanged
  const processedMarkdown = replaceMarkdownImagesWithBlocks(parsed.content, imageMap);

  // 3. Convert markdown → HTML; allowDangerousHtml passes Gutenberg block markup through unmodified
  const vfile = await unified()
    .use(remarkParse)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(processedMarkdown);
  const html = String(vfile);

  // 4. Upload featured image from frontmatter (if local)
  let featured_media;
  if (front.featured_image && !/^https?:\/\//i.test(front.featured_image)) {
    const fpath = path.join(postDir, front.featured_image);
    if (fs.existsSync(fpath)) {
      try {
        const stream = fs.createReadStream(fpath);
        const uploaded = await wp.uploadMedia(stream, path.basename(fpath), {
          title: front.title || '',
          alt_text: '',
          caption: '',
        });
        featured_media = uploaded.id;
      } catch (e) {
        console.error(`Failed to upload featured image: ${e.message}`);
      }
    }
  }

  // 5. Resolve tags & categories to WP term ids
  const tagIds = [];
  const categoryIds = [];
  if (Array.isArray(front.tags)) {
    for (const t of front.tags) tagIds.push(await wp.findOrCreateTerm('tags', t));
  }
  if (Array.isArray(front.categories)) {
    for (const c of front.categories)
      categoryIds.push(await wp.findOrCreateTerm('categories', c));
  }

  // 6. Create or update the WP draft
  const mapping = await readMapping(prNumber);
  const payload = {
    title: front.title || 'Untitled',
    content: html,
    excerpt: front.excerpt || '',
    date: front.date || undefined,
    tags: tagIds,
    categories: categoryIds,
  };
  if (featured_media !== undefined) payload.featured_media = featured_media;

  let post;
  if (mapping && mapping.post_id) {
    post = await wp.updatePost(mapping.post_id, payload);
    console.log(`Updated post ${post.id}: ${post.link}`);
  } else {
    payload.status = 'draft';
    post = await wp.createPost(payload);
    console.log(`Created post ${post.id}: ${post.link}`);
    await writeMapping(prNumber, post.id, post.link, post.slug, post.date);
  }

  // 7. Attach body images to the post for proper Media Library ownership (non-fatal)
  for (const [, info] of Object.entries(imageMap)) {
    try {
      await wp.attachMediaToPost(info.id, post.id);
    } catch (e) {
      console.warn(`Could not attach media ${info.id} to post ${post.id}: ${e.message}`);
    }
  }

  // 8. Report upload errors in the PR, but always proceed
  if (imageErrors.length > 0) {
    const lines = imageErrors.map((e) => `- \`${e.fname}\`: ${e.error}`).join('\n');
    await commentOnPR(
      prNumber,
      `⚠️ Some images failed to upload and will not appear inline:\n${lines}\n\nPost was synced anyway.`,
    );
  }

  await commentOnPR(
    prNumber,
    `WP draft available: ${post.link}\n(kept as draft until PR is merged)`,
  );

  return { post, imageErrors };
}
