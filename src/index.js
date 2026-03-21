/**
 * Main sync script entry point.
 *
 * Usage:
 *   node src/index.js pr   # run on pull_request opened/synchronize/reopened
 *
 * Reads GITHUB_EVENT_PATH for PR info, GITHUB_TOKEN for comments.
 * Requires WP_URL, WP_USER, WP_APP_PASSWORD in environment.
 */
import fs from 'fs';
import axios from 'axios';
import { wpClient } from './wp-client.js';
import { createOrUpdateDraftFromDir } from './sync.js';

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

function findPostDirsFromFiles(files) {
  const set = new Set();
  for (const f of files) {
    const m = f.match(/^content\/posts\/([^/]+)\/draft\.md$/);
    if (m) set.add(`content/posts/${m[1]}`);
  }
  return Array.from(set);
}

function makePrHelpers(token, owner, repo) {
  const headers = {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github.v3+json',
  };
  return {
    async readMapping(prNumber) {
      const url = `https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/comments`;
      const res = await axios.get(url, { headers });
      for (const c of res.data.reverse()) {
        const m =
          c.body &&
          c.body.match(
            /<!-- wp-sync[\s\S]*?post_id:\s*(\d+)[\s\S]*?post_url:\s*(\S+)[\s\S]*?-->/i,
          );
        if (m) return { post_id: parseInt(m[1], 10), post_url: m[2] };
      }
      return null;
    },
    async writeMapping(prNumber, postId, postUrl, slug, date) {
      const url = `https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/comments`;
      const body = [
        `WP draft created: ${postUrl}`,
        '',
        `<!-- wp-sync`,
        `post_id: ${postId}`,
        `post_url: ${postUrl}`,
        `post_slug: ${slug || ''}`,
        `post_date: ${date || ''}`,
        `-->`,
      ].join('\n');
      await axios.post(url, { body }, { headers });
    },
    async commentOnPR(prNumber, message) {
      const url = `https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/comments`;
      await axios.post(url, { body: message }, { headers });
    },
  };
}

async function handlePR() {
  const pr = event.pull_request;
  if (!pr) {
    console.log('No pull_request in event.');
    return;
  }
  const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
  const filesUrl = `https://api.github.com/repos/${owner}/${repo}/pulls/${pr.number}/files`;
  const filesRes = await axios.get(filesUrl, {
    headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: 'application/vnd.github.v3+json' },
  });
  const files = filesRes.data.map((f) => f.filename);
  const postDirs = findPostDirsFromFiles(files);
  if (postDirs.length === 0) {
    console.log('No post draft.md changes detected.');
    return;
  }
  console.log('Post dirs changed:', postDirs);
  const prHelpers = makePrHelpers(GITHUB_TOKEN, owner, repo);
  for (const postDir of postDirs) {
    await createOrUpdateDraftFromDir(postDir, pr.number, wp, prHelpers);
  }
}

async function run() {
  const mode = process.argv[2];
  if (mode === 'pr') {
    await handlePR();
  } else {
    console.error('Unknown mode. Use "pr".');
    process.exit(1);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
