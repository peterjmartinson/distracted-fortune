/**
 * Main sync script
 *
 * Usage:
 *  node src/index.js pr       # run for pull_request opened/synchronize/reopened
 *  node src/index.js publish  # run for pull_request closed+merged to master
 *
 * Reads GITHUB_EVENT_PATH to find PR info, and uses GITHUB_TOKEN to comment on PR.
 *
 * Notes:
 *  - Only operates on content/posts/* /draft.md
 *  - Expects WP_URL, WP_USER, WP_APP_PASSWORD in env
 */
import fs from 'fs';
import path from 'path';
import cp from 'child_process';
import matter from 'gray-matter';
import yaml from 'js-yaml';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import axios from 'axios';
import { wpClient } from './wp-client.js';

const GITHUB_EVENT_PATH = process.env.GITHUB_EVENT_PATH;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

if (!GITHUB_EVENT_PATH || !fs.existsSync(GITHUB_EVENT_PATH)) {
  console.error('GITHUB_EVENT_PATH not found. This script must run in GitHub Actions with event context.');
  process.exit(1);
}

const event = JSON.parse(fs.readFileSync(GITHUB_EVENT_PATH, 'utf8'));

const WP_URL = process.env.WP_URL;
const WP_USER = process.env.WP_USER;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD;

if (!WP_URL || !WP_USER || !WP_APP_PASSWORD) {
  console.error('Missing WP_URL, WP_USER, or WP_APP_PASSWORD in environment.');
  process.exit(1);
}

const wp = wpClient({ wpUrl: WP_URL, user: WP_USER, appPassword: WP_APP_PASSWORD });

async function run() {
  const mode = process.argv[2];
  if (mode === 'pr') {
    await handlePR();
  } else if (mode === 'publish') {
    await handlePublish();
  } else {
    console.error('Unknown mode. Use "pr" or "publish".');
    process.exit(1);
  }
}

function gitChangedFiles(baseSha, headSha) {
  // returns array of changed file paths between two SHAs
  try {
    const out = cp.execSync(`git diff --name-only ${baseSha} ${headSha}`, { encoding: 'utf8' });
    return out.split('\n').map(s => s.trim()).filter(Boolean);
  } catch (e) {
    console.error('git diff failed', e.message);
    return [];
  }
}

function findPostDirsFromFiles(files) {
  // look for paths matching content/posts/<dir>/draft.md
  const set = new Set();
  for (const f of files) {
    const m = f.match(/^content\/posts\/([^\/]+)\/draft\.md$/);
    if (m) set.add(`content/posts/${m[1]}`);
  }
  return Array.from(set);
}

async function handlePR() {
  // find base & head from payload
  const pr = event.pull_request;
  if (!pr) {
    console.log('No pull_request in event.');
    return;
  }
  const baseSha = pr.base.sha;
  const headSha = pr.head.sha;
  const changed = gitChangedFiles(baseSha, headSha);
  const postDirs = findPostDirsFromFiles(changed);
  if (postDirs.length === 0) {
    console.log('No post draft.md changes detected.');
    return;
  }
  console.log('Post dirs changed:', postDirs);
  for (const postDir of postDirs) {
    await createOrUpdateDraftFromDir(postDir, pr.number);
  }
}

async function handlePublish() {
  // Called on pull_request closed+merged to master. The event contains pull_request.
  const pr = event.pull_request;
  if (!pr || !pr.merged) {
    console.log('Not a merged pull request.');
    return;
  }
  // Get list of files in the PR by querying GitHub API (safer than git diff here)
  const owner = process.env.GITHUB_REPOSITORY.split('/')[0];
  const repo = process.env.GITHUB_REPOSITORY.split('/')[1];
  const prNumber = pr.number;
  const filesUrl = `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/files`;
  const filesRes = await axios.get(filesUrl, { headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: 'application/vnd.github.v3+json' } });
  const files = filesRes.data.map(f => f.filename);
  const postDirs = findPostDirsFromFiles(files);
  if (postDirs.length === 0) {
    console.log('No post draft.md changes in merged PR.');
    return;
  }
  for (const postDir of postDirs) {
    await publishPostFromDir(postDir, pr.number);
  }
}

// --- helpers: convert markdown, upload images, create/update post, manage PR comments ---

async function createOrUpdateDraftFromDir(postDir, prNumber) {
  const mdPath = path.join(postDir, 'draft.md');
  if (!fs.existsSync(mdPath)) {
    console.log(`draft.md not found in ${postDir}`);
    return;
  }
  const raw = fs.readFileSync(mdPath, 'utf8');
  const parsed = matter(raw);
  const front = parsed.data;
  const markdown = parsed.content;

  // convert markdown -> html
  console.log('remarkParse:', remarkParse);
  console.log('remarkRehype:', remarkRehype);
  console.log('rehypeStringify:', rehypeStringify);
  const vfile = await unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeStringify)
    .process(markdown);
  let html = String(vfile);

  // Upload images in postDir and replace local urls in HTML
  const imageMap = await uploadImagesForDir(postDir);
  for (const [localPath, info] of Object.entries(imageMap)) {
    // localPath may be like 'hero.jpg' or './hero.jpg' ; replace occurrences
    const localNorm = localPath.replace(/^\.\//, '');
    html = html.split(localPath).join(info.source_url);
    html = html.split(localNorm).join(info.source_url);
  }

  // handle featured_image (if present and relative)
  let featured_media = undefined;
  if (front.featured_image && !/^https?:\/\//i.test(front.featured_image)) {
    const fpath = path.join(postDir, front.featured_image);
    if (fs.existsSync(fpath)) {
      const stream = fs.createReadStream(fpath);
      const uploaded = await wp.uploadMedia(stream, path.basename(fpath), { title: front.title || '', alt_text: '', caption: '' });
      featured_media = uploaded.id;
    }
  }

  // tags & categories -> ids
  const tagIds = [];
  const categoryIds = [];
  if (Array.isArray(front.tags)) {
    for (const t of front.tags) {
      const id = await wp.findOrCreateTerm('tags', t);
      tagIds.push(id);
    }
  }
  if (Array.isArray(front.categories)) {
    for (const c of front.categories) {
      const id = await wp.findOrCreateTerm('categories', c);
      categoryIds.push(id);
    }
  }

  // check if PR already has a mapping comment
  const mapping = await readMappingFromPR(prNumber);
  let post;
  const payload = {
    title: front.title || 'Untitled',
    content: html,
    excerpt: front.excerpt || '',
    date: front.date || undefined, // keep date in post (scheduling handled on publish)
    tags: tagIds,
    categories: categoryIds
  };
  if (featured_media) payload.featured_media = featured_media;

  if (mapping && mapping.post_id) {
    // update existing post
    post = await wp.updatePost(mapping.post_id, payload);
    console.log(`Updated post ${post.id}: ${post.link}`);
  } else {
    // create draft (explicitly draft)
    payload.status = 'draft';
    post = await wp.createPost(payload);
    console.log(`Created post ${post.id}: ${post.link}`);
    await writeMappingToPR(prNumber, post.id, post.link, post.slug, post.date);
  }

  // post a short comment with link (and mapping maintained in hidden HTML comment)
  await postOrUpdateShortComment(prNumber, post.id, post.link);
}

async function publishPostFromDir(postDir, prNumber) {
  // For publishing: find mapping in the PR, then update post status to publish or future per frontmatter date
  const mdPath = path.join(postDir, 'draft.md');
  if (!fs.existsSync(mdPath)) {
    console.log(`draft.md not found in ${postDir}`);
    return;
  }
  const raw = fs.readFileSync(mdPath, 'utf8');
  const parsed = matter(raw);
  const front = parsed.data;
  const markdown = parsed.content;

  // find mapping from PR comments
  const mapping = await readMappingFromPR(prNumber);
  if (!mapping || !mapping.post_id) {
    console.log('No mapping found in PR; cannot publish. Consider running the PR sync step first.');
    return;
  }

  // convert markdown -> html
  const vfile = await unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeStringify)
    .process(markdown);
  let html = String(vfile);

  // upload images and replace
  const imageMap = await uploadImagesForDir(postDir);
  for (const [localPath, info] of Object.entries(imageMap)) {
    const localNorm = localPath.replace(/^\.\//, '');
    html = html.split(localPath).join(info.source_url);
    html = html.split(localNorm).join(info.source_url);
  }

  // tags & categories
  const tagIds = [];
  const categoryIds = [];
  if (Array.isArray(front.tags)) {
    for (const t of front.tags) {
      const id = await wp.findOrCreateTerm('tags', t);
      tagIds.push(id);
    }
  }
  if (Array.isArray(front.categories)) {
    for (const c of front.categories) {
      const id = await wp.findOrCreateTerm('categories', c);
      categoryIds.push(id);
    }
  }

  const payload = {
    title: front.title || 'Untitled',
    content: html,
    excerpt: front.excerpt || '',
    tags: tagIds,
    categories: categoryIds,
    date: front.date || undefined
  };

  // determine publish vs future
  if (front.date) {
    const postDate = new Date(front.date);
    const now = new Date();
    if (postDate > now) {
      payload.status = 'future';
      // WP will honor the date and schedule
    } else {
      payload.status = 'publish';
    }
  } else {
    payload.status = 'publish';
  }

  const post = await wp.updatePost(mapping.post_id, payload);
  console.log(`Published/updated post ${post.id}: ${post.link}`);

  // post a comment notifying about publish
  await commentOnPR(prNumber, `WP post published: ${post.link}`);
}

// uploads all image files in a post dir and returns a mapping { relativePath: {id, source_url} }
async function uploadImagesForDir(postDir) {
  const map = {};
  const imgMetaPath = path.join(postDir, 'images.yml');
  let meta = {};
  if (fs.existsSync(imgMetaPath)) {
    const raw = fs.readFileSync(imgMetaPath, 'utf8');
    meta = yaml.load(raw) || {};
  }
  const files = fs.readdirSync(postDir).filter(f => f.match(/\.(jpe?g|png|gif|webp|svg)$/i));
  for (const fname of files) {
    const full = path.join(postDir, fname);
    const stream = fs.createReadStream(full);
    const m = (meta.images || []).find(i => i.file === fname) || {};
    const title = m.title || path.parse(fname).name;
    const alt = m.alt || '';
    const caption = m.caption || '';
    try {
      const uploaded = await wp.uploadMedia(stream, fname, { title, alt_text: alt, caption });
      map[fname] = { id: uploaded.id, source_url: uploaded.source_url };
      console.log(`Uploaded image ${fname} => ${uploaded.source_url}`);
    } catch (e) {
      console.error(`Failed to upload ${fname}:`, e.response ? e.response.data : e.message);
    }
  }
  return map;
}

// PR comment helpers: mapping stored in an HTML comment so it's easy to find programmatically
async function readMappingFromPR(prNumber) {
  const owner = process.env.GITHUB_REPOSITORY.split('/')[0];
  const repo = process.env.GITHUB_REPOSITORY.split('/')[1];
  const url = `https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/comments`;
  const res = await axios.get(url, { headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: 'application/vnd.github.v3+json' } });
  for (const c of res.data.reverse()) {
    const m = c.body && c.body.match(/<!-- wp-sync[\s\S]*?post_id:\s*(\d+)[\s\S]*?post_url:\s*(\S+)[\s\S]*?-->/i);
    if (m) {
      return { post_id: parseInt(m[1], 10), post_url: m[2] };
    }
  }
  return null;
}

async function writeMappingToPR(prNumber, postId, postUrl, slug, date) {
  const owner = process.env.GITHUB_REPOSITORY.split('/')[0];
  const repo = process.env.GITHUB_REPOSITORY.split('/')[1];
  const url = `https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/comments`;
  const body = [
    `WP draft created: ${postUrl}`,
    '',
    `<!-- wp-sync`,
    `post_id: ${postId}`,
    `post_url: ${postUrl}`,
    `post_slug: ${slug || ''}`,
    `post_date: ${date || ''}`,
    `-->`
  ].join('\n');
  await axios.post(url, { body }, { headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: 'application/vnd.github.v3+json' } });
}

async function postOrUpdateShortComment(prNumber, postId, postUrl) {
  // create or update a short human-friendly comment (we'll append if not present)
  await commentOnPR(prNumber, `WP draft available: ${postUrl}\n(kept as draft until PR is merged)`);
}

async function commentOnPR(prNumber, message) {
  const owner = process.env.GITHUB_REPOSITORY.split('/')[0];
  const repo = process.env.GITHUB_REPOSITORY.split('/')[1];
  const url = `https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/comments`;
  await axios.post(url, { body: message }, { headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: 'application/vnd.github.v3+json' } });
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
